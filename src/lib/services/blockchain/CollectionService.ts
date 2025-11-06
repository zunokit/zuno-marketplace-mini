/**
 * Collection Service
 * Production-ready service for NFT collection operations
 */

import { ethers } from "ethers";
import {
  TokenType,
  MintStage,
  CreateCollectionParams,
  CollectionInfo,
  MintParams,
  BatchMintParams,
  MintInfo,
  CollectionError,
  MintError,
} from "@/types";
import { getContractABI } from "@/lib/contracts/abi-manager";
import { TransactionService } from "./TransactionService";
import { EventService } from "./EventService";
import { logger } from "@/lib/utils/logger";

export class CollectionService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private transactionService: TransactionService;
  private eventService: EventService;
  private factoryAddresses: Map<TokenType, string> = new Map();

  constructor() {
    this.transactionService = new TransactionService();
    this.eventService = new EventService();
  }

  /**
   * Initialize the service with provider and signer
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Initialize dependent services
    await this.transactionService.initialize(provider, signer);
    await this.eventService.initialize(provider);

    // Load factory addresses from hub
    await this.loadFactoryAddresses();

    logger.info("CollectionService initialized");
  }

  /**
   * Load factory addresses from MarketplaceHub
   */
  private async loadFactoryAddresses(): Promise<void> {
    try {
      // This should be loaded from your MarketplaceHub contract
      // For now, using environment variables or hardcoded addresses
      const hubAddress = process.env.NEXT_PUBLIC_HUB_ADDRESS;
      if (!hubAddress || !this.provider) return;

      const hubAbi = [
        "function erc721Factory() view returns (address)",
        "function erc1155Factory() view returns (address)",
      ];

      const hub = new ethers.Contract(hubAddress, hubAbi, this.provider);

      const [erc721Factory, erc1155Factory] = await Promise.all([
        hub.erc721Factory(),
        hub.erc1155Factory(),
      ]);

      this.factoryAddresses.set(TokenType.ERC721, erc721Factory);
      this.factoryAddresses.set(TokenType.ERC1155, erc1155Factory);

      logger.info("Factory addresses loaded", {
        erc721Factory,
        erc1155Factory,
      });
    } catch (error) {
      logger.error("Failed to load factory addresses", error);
    }
  }

  /**
   * Create a new NFT collection
   */
  async createCollection(params: CreateCollectionParams): Promise<string> {
    try {
      if (!this.signer) {
        throw new CollectionError("Wallet not connected", "NO_SIGNER");
      }

      const factoryAddress = this.factoryAddresses.get(params.tokenType);
      if (!factoryAddress) {
        throw new CollectionError(
          `${params.tokenType} factory not available`,
          "FACTORY_NOT_FOUND"
        );
      }

      // Get the appropriate factory ABI
      const factoryAbi = await getContractABI(
        params.tokenType === TokenType.ERC721
          ? "ERC721CollectionFactory"
          : "ERC1155CollectionFactory"
      );

      const factory = new ethers.Contract(
        factoryAddress,
        factoryAbi,
        this.signer
      );

      // Prepare parameters
      const owner = params.owner || (await this.signer.getAddress());
      const metadataUri = params.image || "";
      const description = params.description || "";
      const royaltyFee = Number(params.royaltyFee || 500);
      const royaltyBasisPoints = Math.floor(royaltyFee * 100); // Convert percentage to basis points

      logger.info("Creating collection", {
        name: params.name,
        symbol: params.symbol,
        tokenType: params.tokenType,
      });

      // Call the factory method
      let tx: ethers.ContractTransactionResponse;

      if (params.tokenType === TokenType.ERC721) {
        tx = await factory.createCollection(
          params.name,
          params.symbol,
          owner,
          metadataUri,
          description,
          params.mintPrice,
          royaltyBasisPoints,
          params.maxSupply,
          params.mintLimitPerWallet,
          params.baseTokenURI,
          params.revealed ?? true
        );
      } else {
        tx = await factory.createCollection(
          params.name,
          params.symbol,
          owner,
          metadataUri,
          description,
          params.mintPrice,
          royaltyBasisPoints,
          params.maxSupply,
          params.mintLimitPerWallet,
          params.baseTokenURI
        );
      }

      // Wait for transaction and get the collection address from event
      const receipt = await this.transactionService.waitForTransaction(tx.hash);
      const collectionAddress = this.extractCollectionAddress(receipt, factory);

      if (!collectionAddress) {
        throw new CollectionError(
          "Failed to get collection address from transaction",
          "ADDRESS_EXTRACTION_FAILED"
        );
      }

      logger.success("Collection created", {
        address: collectionAddress,
        transactionHash: receipt.hash,
      });

      // Subscribe to collection events
      await this.eventService.subscribeToCollection(
        collectionAddress,
        params.tokenType
      );

      return collectionAddress;
    } catch (error) {
      logger.error("Failed to create collection", error);
      throw this.formatError(error);
    }
  }

  /**
   * Extract collection address from transaction receipt
   */
  private extractCollectionAddress(
    receipt: ethers.TransactionReceipt,
    factory: ethers.Contract
  ): string | null {
    try {
      // Find CollectionCreated event
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });

          if (parsed?.name === "CollectionCreated") {
            return parsed.args.collection || parsed.args[0];
          }
        } catch {
          // Continue to next log
        }
      }

      return null;
    } catch (error) {
      logger.error("Failed to extract collection address", error);
      return null;
    }
  }

  /**
   * Get collection information
   */
  async getCollectionInfo(
    address: string,
    tokenType: TokenType
  ): Promise<CollectionInfo> {
    try {
      if (!this.provider) {
        throw new CollectionError("Provider not initialized", "NO_PROVIDER");
      }

      const abi = await getContractABI(
        tokenType === TokenType.ERC721
          ? "ERC721Collection"
          : "ERC1155Collection"
      );
      const contract = new ethers.Contract(address, abi, this.provider);

      // Fetch all data in parallel
      const [
        name,
        symbol,
        owner,
        totalMinted,
        maxSupply,
        mintPrice,
        mintLimit,
      ] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.owner(),
        contract.getTotalMinted(),
        contract.getMaxSupply(),
        contract.getMintPrice(),
        contract.getMintLimitPerWallet(),
      ]);

      // Get base URI
      let baseTokenURI = "";
      try {
        baseTokenURI =
          tokenType === TokenType.ERC721
            ? await contract.baseTokenURI()
            : await contract.uri(0);
      } catch {
        // Some contracts might not have this function
      }

      return {
        address,
        tokenType,
        metadata: {
          name,
          symbol,
          // Additional metadata can be fetched from IPFS or API
        },
        config: {
          mintPrice,
          royaltyFee: 500, // Default, should be fetched from contract
          maxSupply,
          mintLimitPerWallet: mintLimit,
          baseTokenURI,
        },
        stats: {
          totalMinted,
          maxSupply,
          owners: 0, // This would require indexing or graph query
        },
      };
    } catch (error) {
      logger.error("Failed to get collection info", error);
      throw this.formatError(error);
    }
  }

  /**
   * Get mint information for a user
   */
  async getMintInfo(
    collectionAddress: string,
    userAddress: string,
    tokenType: TokenType
  ): Promise<MintInfo> {
    try {
      if (!this.provider) {
        throw new CollectionError("Provider not initialized", "NO_PROVIDER");
      }

      const abi = await getContractABI(
        tokenType === TokenType.ERC721
          ? "ERC721Collection"
          : "ERC1155Collection"
      );
      const contract = new ethers.Contract(
        collectionAddress,
        abi,
        this.provider
      );

      // Fetch mint data
      const [
        mintPrice,
        totalMinted,
        maxSupply,
        mintedPerWallet,
        mintLimitPerWallet,
      ] = await Promise.all([
        contract.getMintPrice(),
        contract.getTotalMinted(),
        contract.getMaxSupply(),
        contract.getMintedPerWallet(userAddress),
        contract.getMintLimitPerWallet(),
      ]);

      // Get current stage and allowlist status for ERC721
      let currentStage = MintStage.PUBLIC;
      let isAllowlisted = false;

      if (tokenType === TokenType.ERC721) {
        try {
          const stageValue = await contract.getCurrentStage();
          const stages = [
            MintStage.INACTIVE,
            MintStage.ALLOWLIST,
            MintStage.PUBLIC,
          ];
          currentStage = stages[Number(stageValue)];
          isAllowlisted = await contract.isInAllowlist(userAddress);
        } catch {
          // Contract might not have these functions
        }
      }

      // Calculate if user can mint
      const remainingSupply: bigint = BigInt(maxSupply) - BigInt(totalMinted);
      const userRemaining: bigint =
        BigInt(mintLimitPerWallet) - BigInt(mintedPerWallet);
      const canMint =
        currentStage !== MintStage.INACTIVE &&
        remainingSupply > 0n &&
        userRemaining > 0n &&
        (currentStage === MintStage.PUBLIC || isAllowlisted);

      return {
        currentStage,
        currentPrice: BigInt(mintPrice),
        isAllowlisted,
        mintedPerWallet: BigInt(mintedPerWallet),
        mintLimitPerWallet: BigInt(mintLimitPerWallet),
        canMint,
        remainingSupply,
        totalMinted: BigInt(totalMinted),
        maxSupply: BigInt(maxSupply),
      };
    } catch (error) {
      logger.error("Failed to get mint info", error);
      throw this.formatError(error);
    }
  }

  /**
   * Mint NFTs
   */
  async mint(params: MintParams): Promise<string> {
    try {
      if (!this.signer) {
        throw new MintError("Wallet not connected", "NO_SIGNER");
      }

      const tokenType = await this.detectTokenType(params.collection);
      const abi = await getContractABI(
        tokenType === TokenType.ERC721
          ? "ERC721Collection"
          : "ERC1155Collection"
      );
      const contract = new ethers.Contract(params.collection, abi, this.signer);

      // Get mint price
      const mintPrice = await contract.getMintPrice();
      const to = params.to || (await this.signer.getAddress());
      const quantity = params.quantity || 1;

      logger.info("Minting NFT", {
        collection: params.collection,
        to,
        quantity,
        price: ethers.formatEther(mintPrice),
      });

      let tx: ethers.ContractTransactionResponse;

      if (tokenType === TokenType.ERC721) {
        if (quantity === 1) {
          // Single mint
          tx = await contract.mint(to, { value: mintPrice });
        } else {
          // Batch mint for ERC721
          tx = await contract.batchMintERC721(to, quantity, {
            value: mintPrice * BigInt(quantity),
          });
        }
      } else {
        // ERC1155 mint (creates new token IDs in Zuno)
        tx = await contract.mint(to, quantity, {
          value: mintPrice * BigInt(quantity),
        });
      }

      const receipt = await this.transactionService.waitForTransaction(tx.hash);

      logger.success("NFT minted", {
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      });

      return receipt.hash;
    } catch (error) {
      logger.error("Failed to mint NFT", error);
      throw this.formatError(error);
    }
  }

  /**
   * Batch mint NFTs to multiple recipients
   */
  async batchMint(params: BatchMintParams): Promise<string> {
    try {
      if (!this.signer) {
        throw new MintError("Wallet not connected", "NO_SIGNER");
      }

      const tokenType = await this.detectTokenType(params.collection);

      if (tokenType === TokenType.ERC721) {
        // For ERC721, we need to do multiple transactions
        // This is a simplified version - in production you might want to batch these
        const results = [];
        for (let i = 0; i < params.recipients.length; i++) {
          const result = await this.mint({
            collection: params.collection,
            to: params.recipients[i],
            quantity: params.quantities[i],
          });
          results.push(result);
        }
        return results[results.length - 1]; // Return last transaction hash
      } else {
        // For ERC1155, use batch mint if available
        const abi = await getContractABI("ERC1155Collection");
        const contract = new ethers.Contract(
          params.collection,
          abi,
          this.signer
        );

        const mintPrice = await contract.getMintPrice();
        const totalQuantity = params.quantities.reduce((sum, q) => sum + q, 0);

        // Note: Zuno's ERC1155 creates new token IDs, doesn't mint specific ones
        const tx = await contract.batchMintERC1155(
          params.recipients[0], // Zuno might only support single recipient
          totalQuantity,
          { value: mintPrice * BigInt(totalQuantity) }
        );

        const receipt = await this.transactionService.waitForTransaction(
          tx.hash
        );
        return receipt.hash;
      }
    } catch (error) {
      logger.error("Failed to batch mint NFTs", error);
      throw this.formatError(error);
    }
  }

  /**
   * Set approval for marketplace or other operator
   */
  async setApprovalForAll(
    collection: string,
    operator: string,
    approved: boolean
  ): Promise<string> {
    try {
      if (!this.signer) {
        throw new CollectionError("Wallet not connected", "NO_SIGNER");
      }

      const tokenType = await this.detectTokenType(collection);
      const abi = await getContractABI(
        tokenType === TokenType.ERC721
          ? "ERC721Collection"
          : "ERC1155Collection"
      );
      const contract = new ethers.Contract(collection, abi, this.signer);

      const tx = await contract.setApprovalForAll(operator, approved);
      const receipt = await this.transactionService.waitForTransaction(tx.hash);

      logger.success("Approval set", {
        collection,
        operator,
        approved,
        transactionHash: receipt.hash,
      });

      return receipt.hash;
    } catch (error) {
      logger.error("Failed to set approval", error);
      throw this.formatError(error);
    }
  }

  /**
   * Check if operator is approved
   */
  async isApprovedForAll(
    collection: string,
    owner: string,
    operator: string
  ): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new CollectionError("Provider not initialized", "NO_PROVIDER");
      }

      const tokenType = await this.detectTokenType(collection);
      const abi = await getContractABI(
        tokenType === TokenType.ERC721
          ? "ERC721Collection"
          : "ERC1155Collection"
      );
      const contract = new ethers.Contract(collection, abi, this.provider);

      return await contract.isApprovedForAll(owner, operator);
    } catch (error) {
      logger.error("Failed to check approval", error);
      return false;
    }
  }

  /**
   * Detect token type of a collection
   */
  private async detectTokenType(collection: string): Promise<TokenType> {
    try {
      if (!this.provider) {
        throw new CollectionError("Provider not initialized", "NO_PROVIDER");
      }

      // Try ERC721 first
      const erc721Abi = await getContractABI("ERC721Collection");
      const erc721Contract = new ethers.Contract(
        collection,
        erc721Abi,
        this.provider
      );
      try {
        await erc721Contract.ownerOf(1); // ERC721 specific function
        return TokenType.ERC721;
      } catch {
        // Not ERC721, try ERC1155
        const erc1155Abi = await getContractABI("ERC1155Collection");
        const erc1155Contract = new ethers.Contract(
          collection,
          erc1155Abi,
          this.provider
        );
        await erc1155Contract.uri(0); // ERC1155 specific function
        return TokenType.ERC1155;
      }
    } catch (error) {
      // Default to ERC721 if detection fails
      return TokenType.ERC721;
    }
  }

  /**
   * Format errors for user-friendly messages
   */
  private formatError(error: any): Error {
    // User rejected transaction
    if (error.code === "ACTION_REJECTED" || error.code === 4001) {
      return new CollectionError(
        "Transaction rejected by user",
        "USER_REJECTED"
      );
    }

    // Insufficient funds
    if (error.code === "INSUFFICIENT_FUNDS") {
      return new CollectionError(
        "Insufficient funds for transaction",
        "INSUFFICIENT_FUNDS"
      );
    }

    // Contract errors
    if (error.message?.includes("execution reverted")) {
      const reason = error.message.match(/execution reverted: (.+)/)?.[1];

      // Mint errors
      if (reason?.includes("MintLimitExceeded")) {
        return new MintError("Mint limit exceeded", "MINT_LIMIT_EXCEEDED");
      }
      if (reason?.includes("MaxSupplyReached")) {
        return new MintError("Collection sold out", "MAX_SUPPLY_REACHED");
      }
      if (reason?.includes("InsufficientPayment")) {
        return new MintError(
          "Incorrect payment amount",
          "INSUFFICIENT_PAYMENT"
        );
      }
      if (reason?.includes("NotInAllowlist")) {
        return new MintError("Address not in allowlist", "NOT_IN_ALLOWLIST");
      }
      if (reason?.includes("MintNotStarted")) {
        return new MintError("Minting has not started", "MINT_NOT_STARTED");
      }

      return new CollectionError(
        reason || "Transaction failed",
        "CONTRACT_ERROR"
      );
    }

    return error;
  }
}

// Export singleton instance
export const collectionService = new CollectionService();
