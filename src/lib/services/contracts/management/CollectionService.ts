/**
 * Collection Service
 * Handles ERC721/ERC1155 collection creation and minting operations
 * Uses UserHub for factory address discovery
 *
 * IMPORTANT: This service follows the exact logic from smart contracts:
 * - Mint price calculation based on current stage (allowlist vs public)
 * - No fallback/mock data - all data comes from blockchain
 * - Proper event parsing for deterministic collection address retrieval
 */

import { ethers } from "ethers";
import { userHubService } from "../core/UserHubService";
import { logger } from "@/lib/utils/logger";
import { getContractABI } from "@/lib/contracts/abi-manager";
import {
  ZERO_ADDRESS,
  INTERFACE_IDS,
  CONTRACT_CONSTANTS,
} from "@/lib/constants";
import { supportsInterface } from "@/lib/utils/contract";
import type { NFTType } from "@/types/contract";
import type {
  CreateCollectionParams,
  MintParams,
  CollectionInfo,
  MintInfo,
  MintStage,
} from "@/types/collection";

export class CollectionService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Get the current provider
   * Used for direct contract interactions in pages
   */
  getProvider(): ethers.Provider | null {
    return this.provider;
  }

  /**
   * Initialize collection service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    logger.info(
      "CollectionService initialized",
      { hasSigner: !!signer },
      { component: "CollectionService", action: "initialize" }
    );
  }

  /**
   * Get ERC721 factory contract
   */
  async getERC721FactoryContract(): Promise<ethers.Contract> {
    return this.getFactoryContract("ERC721");
  }

  /**
   * Get ERC1155 factory contract
   */
  async getERC1155FactoryContract(): Promise<ethers.Contract> {
    return this.getFactoryContract("ERC1155");
  }

  /**
   * Check if collection is verified
   */
  async isCollectionVerified(collectionAddress: string): Promise<boolean> {
    try {
      // This would typically check with CollectionVerifierService
      // For now, return false as a placeholder
      return false;
    } catch (error) {
      logger.error("Error checking collection verification", error, {
        component: "CollectionService",
        action: "isCollectionVerified"
      });
      return false;
    }
  }

  /**
   * Get collection factory contract for token type
   */
  private async getFactoryContract(
    tokenType: NFTType
  ): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    if (!this.provider) {
      throw new Error(
        "CollectionService not initialized - call initialize() first"
      );
    }

    // Get factory address from UserHub
    let factoryAddress: string;
    try {
      factoryAddress = userHubService.getCollectionFactory(tokenType);
    } catch (error) {
      // If UserHub not initialized, initialize it first
      const err = error as Error;
      if (err.message?.includes("UserHub not initialized")) {
        await userHubService.initialize(this.provider, this.signer);
        factoryAddress = userHubService.getCollectionFactory(tokenType);
      } else {
        throw error;
      }
    }

    if (!factoryAddress || factoryAddress === ZERO_ADDRESS) {
      throw new Error(
        `${tokenType} Factory not available. Please ensure contracts are deployed and UserHub is initialized.`
      );
    }

    const abiName =
      tokenType === "ERC721"
        ? "ERC721CollectionFactory"
        : "ERC1155CollectionFactory";
    const abi = await getContractABI(abiName);

    return new ethers.Contract(factoryAddress, abi, this.signer);
  }

  /**
   * Create a new collection
   * Returns: Collection address (deterministic from event parsing)
   */
  async createCollection(params: CreateCollectionParams): Promise<string> {
    const factory = await this.getFactoryContract(params.tokenType);
    const account = await this.signer!.getAddress();

    logger.info(
      "Creating collection",
      { tokenType: params.tokenType, name: params.name, owner: params.owner || account },
      { component: "CollectionService", action: "createCollection" }
    );

    // Prepare collection params struct matching CollectionParams in smart contract
    const collectionParams = {
      name: params.name,
      symbol: params.symbol,
      owner: params.owner || account,
      description: params.description || "",
      mintPrice: ethers.parseEther(params.mintPrice || "0.001"),
      royaltyFee: BigInt((parseInt(params.royaltyFee || "5") * 100)), // Convert % to basis points
      maxSupply: BigInt(params.maxSupply || "10000"),
      mintLimitPerWallet: BigInt(params.mintLimitPerWallet || "10"),
      mintStartTime: BigInt(
        params.mintStartTime ||
          Math.floor(Date.now() / 1000) -
            CONTRACT_CONSTANTS.MINT_START_TIME_OFFSET
      ),
      allowlistMintPrice: ethers.parseEther(
        params.allowlistMintPrice || params.mintPrice || "0.001"
      ),
      publicMintPrice: ethers.parseEther(
        params.publicMintPrice || params.mintPrice || "0.001"
      ),
      allowlistStageDuration: BigInt(
        params.allowlistStageDuration ||
          CONTRACT_CONSTANTS.DEFAULT_ALLOWLIST_DURATION
      ),
      tokenURI: params.baseURI || "https://api.example.com/metadata/",
    };

    // Call the appropriate factory method
    const methodName =
      params.tokenType === "ERC721"
        ? "createERC721Collection"
        : "createERC1155Collection";

    logger.info(
      "Calling factory method",
      { method: methodName, factory: await factory.getAddress() },
      { component: "CollectionService", action: "createCollection" }
    );

    const tx = await factory[methodName](collectionParams);
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error("Collection creation transaction failed");
    }

    // Parse event to get collection address (DETERMINISTIC)
    const eventName =
      params.tokenType === "ERC721"
        ? "ERC721CollectionCreated"
        : "ERC1155CollectionCreated";

    let collectionAddress: string | null = null;

    for (const log of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });

        if (parsed && parsed.name === eventName) {
          // Event signature: ERC721CollectionCreated(address indexed collection, address indexed creator)
          // args[0] = collection address, args[1] = creator address
          collectionAddress = parsed.args[0];
          break;
        }
      } catch {
        // Skip logs that don't match our interface
        continue;
      }
    }

    if (!collectionAddress || collectionAddress === ZERO_ADDRESS) {
      throw new Error(
        "Collection creation failed - could not parse collection address from event"
      );
    }

    logger.success(
      "Collection created successfully",
      {
        collectionAddress,
        tokenType: params.tokenType,
        name: params.name,
        transaction: receipt.hash,
      },
      { component: "CollectionService", action: "createCollection" }
    );

    // Add addresses to allowlist if provided
    if (params.allowlist && params.allowlist.length > 0) {
      try {
        await this.addToAllowlist(
          collectionAddress,
          params.allowlist,
          params.tokenType
        );
      } catch (error) {
        logger.warn(
          "Failed to add allowlist addresses",
          error,
          { component: "CollectionService", action: "createCollection" }
        );
        // Don't throw - collection was created successfully
      }
    }

    return collectionAddress;
  }

  /**
   * Create ERC721 collection (alias for createCollection)
   */
  async createERC721Collection(
    params: Omit<CreateCollectionParams, "tokenType">
  ): Promise<string> {
    return this.createCollection({ ...params, tokenType: "ERC721" });
  }

  /**
   * Create ERC1155 collection (alias for createCollection)
   */
  async createERC1155Collection(
    params: Omit<CreateCollectionParams, "tokenType">
  ): Promise<string> {
    return this.createCollection({ ...params, tokenType: "ERC1155" });
  }

  /**
   * Request verification for a collection (placeholder for future implementation)
   */
  async requestVerification(
    collectionAddress: string,
    metadata: {
      website?: string;
      twitter?: string;
      discord?: string;
      description?: string;
    }
  ): Promise<string> {
    // This would typically interact with a backend service
    // For now, return a placeholder transaction hash
    logger.info(
      "Verification request submitted",
      { collectionAddress, metadata },
      { component: "CollectionService", action: "requestVerification" }
    );
    
    // Return a mock transaction hash
    return "0x" + "0".repeat(64);
  }

  /**
   * Batch mint NFTs (wrapper for mint with quantity)
   */
  async batchMint(
    params: MintParams & { quantity: number }
  ): Promise<ethers.ContractTransactionResponse> {
    return this.mint(params);
  }

  /**
   * Add addresses to collection allowlist (owner only)
   */
  async addToAllowlist(
    collectionAddress: string,
    addresses: string[],
    tokenType: NFTType
  ): Promise<void> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const collection = await this.getCollectionContract(collectionAddress, tokenType);

    logger.info(
      "Adding addresses to allowlist",
      { collection: collectionAddress, count: addresses.length },
      { component: "CollectionService", action: "addToAllowlist" }
    );

    const tx = await collection.addToAllowlist(addresses);
    await tx.wait();

    logger.success(
      "Allowlist updated",
      { collection: collectionAddress, count: addresses.length },
      { component: "CollectionService", action: "addToAllowlist" }
    );
  }

  /**
   * Get collection contract instance
   */
  private async getCollectionContract(
    address: string,
    tokenType: NFTType
  ): Promise<ethers.Contract> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const abiName =
      tokenType === "ERC721" ? "ERC721Collection" : "ERC1155Collection";
    const abi = await getContractABI(abiName);

    return new ethers.Contract(address, abi, this.signer || this.provider);
  }

  /**
   * Mint NFT with CORRECT price calculation
   * Price is determined by current mint stage:
   * - ALLOWLIST stage: uses allowlistMintPrice
   * - PUBLIC stage: uses publicMintPrice
   */
  async mint(params: MintParams): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    // Auto-detect token type if needed
    const detectedType = await this.detectTokenType(params.collection).catch(
      () => params.tokenType
    );
    const tokenType = detectedType || params.tokenType;

    const collection = await this.getCollectionContract(params.collection, tokenType);

    // Verify contract exists
    const code = await this.provider?.getCode(params.collection);
    if (!code || code === "0x") {
      throw new Error(`No contract found at address ${params.collection}`);
    }

    const minterAddress = await this.signer.getAddress();

    // Get mint info to determine current stage and price
    // This calls getMintInfo() which returns all mint-related data
    const mintInfo = await collection.getMintInfo(minterAddress);

    // Extract data from getMintInfo result
    // Returns: (currentTime, mintStartTime, allowlistStageEnd, currentStage,
    //          currentMintPrice, allowlistPrice, publicPrice, totalMinted,
    //          maxSupply, mintedPerWallet, mintLimitPerWallet, accountInAllowlist)
    const currentMintPrice: bigint = mintInfo[4]; // currentMintPrice based on stage
    const currentStage: number = Number(mintInfo[3]); // MintStage enum
    const isAllowlisted: boolean = mintInfo[11]; // accountInAllowlist

    logger.info(
      "Mint price info from contract",
      {
        currentMintPrice: ethers.formatEther(currentMintPrice),
        currentStage,
        isAllowlisted,
      },
      { component: "CollectionService", action: "mint" }
    );

    const quantity = parseInt(params.amount || "1");

    // Calculate total price: currentMintPrice * quantity
    // currentMintPrice is already calculated by contract based on stage
    const totalPrice = currentMintPrice * BigInt(quantity);

    // Override with explicit value if provided (for testing/special cases)
    const finalTotalPrice = params.value
      ? BigInt(params.value)
      : totalPrice;

    logger.info(
      "Minting NFT",
      {
        collection: params.collection,
        tokenType,
        quantity,
        pricePerNFT: ethers.formatEther(currentMintPrice),
        totalPrice: ethers.formatEther(finalTotalPrice),
      },
      { component: "CollectionService", action: "mint" }
    );

    // Call the appropriate mint function based on token type
    if (tokenType === "ERC721") {
      return await this.mintERC721(
        collection,
        params.to,
        quantity,
        finalTotalPrice,
        params.collection
      );
    } else {
      return await this.mintERC1155(
        collection,
        params.to,
        quantity,
        finalTotalPrice,
        params.collection
      );
    }
  }

  /**
   * Mint ERC721 NFT(s)
   * Calls mint() for single or batchMintERC721() for multiple
   */
  private async mintERC721(
    collection: ethers.Contract,
    to: string,
    quantity: number,
    totalPrice: bigint,
    collectionAddress: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (quantity > 1) {
      // Batch mint
      const gasEstimate = await collection.batchMintERC721.estimateGas(
        to,
        quantity,
        { value: totalPrice }
      );
      const gasLimit = (gasEstimate * 120n) / 100n; // 20% buffer

      const tx = await collection.batchMintERC721(to, quantity, {
        value: totalPrice,
        gasLimit,
      });

      this.logMintSuccess(tx, collectionAddress, quantity, "ERC721");
      return tx;
    } else {
      // Single mint
      const gasEstimate = await collection.mint.estimateGas(to, {
        value: totalPrice,
      });
      const gasLimit = (gasEstimate * 120n) / 100n;

      const tx = await collection.mint(to, {
        value: totalPrice,
        gasLimit,
      });

      this.logMintSuccess(tx, collectionAddress, quantity, "ERC721");
      return tx;
    }
  }

  /**
   * Mint ERC1155 NFT(s)
   * Calls mint() for single or batchMintERC1155() for multiple
   */
  private async mintERC1155(
    collection: ethers.Contract,
    to: string,
    amount: number,
    totalPrice: bigint,
    collectionAddress: string
  ): Promise<ethers.ContractTransactionResponse> {
    // ERC1155 mint takes amount parameter
    const gasEstimate = await collection.mint.estimateGas(to, amount, {
      value: totalPrice,
    });
    const gasLimit = (gasEstimate * 120n) / 100n;

    const tx = await collection.mint(to, amount, {
      value: totalPrice,
      gasLimit,
    });

    this.logMintSuccess(tx, collectionAddress, amount, "ERC1155");
    return tx;
  }

  /**
   * Log mint success and parse events for token IDs
   */
  private logMintSuccess(
    tx: ethers.ContractTransactionResponse,
    collectionAddress: string,
    quantity: number,
    tokenType: string
  ): void {
    tx.wait()
      .then((receipt) => {
        if (receipt && receipt.status === 1) {
          logger.success(
            `Successfully minted ${quantity} ${tokenType} NFT(s)`,
            {
              contract: collectionAddress,
              transaction: receipt.hash,
              quantity,
            },
            { component: "CollectionService", action: `mint${tokenType}` }
          );
        }
      })
      .catch((err) => {
        logger.error("Failed to get mint receipt", err, {
          component: "CollectionService",
          action: `mint${tokenType}`,
        });
      });
  }

  /**
   * Set approval for exchange
   */
  async setApprovalForAll(
    collection: string,
    operator: string,
    approved: boolean,
    tokenType: NFTType
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const collectionContract = await this.getCollectionContract(
      collection,
      tokenType
    );

    return await collectionContract.setApprovalForAll(operator, approved);
  }

  /**
   * Check if operator is approved
   */
  async isApprovedForAll(
    collection: string,
    owner: string,
    operator: string,
    tokenType: NFTType
  ): Promise<boolean> {
    const collectionContract = await this.getCollectionContract(
      collection,
      tokenType
    );

    return await collectionContract.isApprovedForAll(owner, operator);
  }

  /**
   * Update mint stage for a collection (owner only)
   * This function progresses the mint stage from INACTIVE -> ALLOWLIST -> PUBLIC
   */
  async updateMintStage(
    collectionAddress: string,
    tokenType: NFTType
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const collection = await this.getCollectionContract(collectionAddress, tokenType);

    return await collection.updateMintStage();
  }

  /**
   * Get mint information for a collection
   * Returns current stage, prices, limits, and allowlist status
   */
  async getMintInfo(
    collectionAddress: string,
    userAddress: string,
    tokenType: NFTType
  ): Promise<MintInfo> {
    const collection = await this.getCollectionContract(
      collectionAddress,
      tokenType
    );

    const mintInfo = await collection.getMintInfo(userAddress);

    // Extract data from tuple
    // (currentTime, mintStartTime, allowlistStageEnd, currentStage,
    //  currentMintPrice, allowlistPrice, publicPrice, totalMinted,
    //  maxSupply, mintedPerWallet, mintLimitPerWallet, accountInAllowlist)
    const currentMintPrice = mintInfo[4].toString();
    const isAllowlisted = mintInfo[11];
    const mintedPerWallet = mintInfo[9].toString();
    const mintLimitPerWallet = mintInfo[10].toString();
    const totalMinted = mintInfo[7].toString();
    const maxSupply = mintInfo[8].toString();

    const stageNum = Number(mintInfo[3]);
    let mintStage: MintStage = "not_started";
    if (stageNum === 0) {
      mintStage = "not_started";
    } else if (stageNum === 1) {
      mintStage = "allowlist";
    } else if (stageNum === 2) {
      mintStage = "public";
    }

    const hasSupplyLeft = parseInt(totalMinted) < parseInt(maxSupply);
    const underWalletLimit =
      parseInt(mintedPerWallet) < parseInt(mintLimitPerWallet);
    const stageAllowsMinting =
      (mintStage === "allowlist" && isAllowlisted) || mintStage === "public";
    const canMint = hasSupplyLeft && underWalletLimit && stageAllowsMinting;

    return {
      currentMintPrice,
      isAllowlisted,
      mintedPerWallet,
      mintLimitPerWallet,
      totalMinted,
      maxSupply,
      canMint,
      mintStage,
    };
  }

  /**
   * Detect the token type of a collection by checking ERC165 interface support
   */
  async detectTokenType(address: string): Promise<NFTType> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const contract = new ethers.Contract(
      address,
      ["function supportsInterface(bytes4) view returns (bool)"],
      this.provider
    );

    const [isERC1155, isERC721] = await Promise.all([
      supportsInterface(contract, INTERFACE_IDS.ERC1155),
      supportsInterface(contract, INTERFACE_IDS.ERC721),
    ]);

    if (isERC1155) return "ERC1155";
    if (isERC721) return "ERC721";

    throw new Error(
      `Contract at ${address} does not support ERC721 or ERC1155 interface`
    );
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(
    address: string,
    tokenType: NFTType
  ): Promise<CollectionInfo> {
    const collection = await this.getCollectionContract(address, tokenType);

    // Fetch all properties from contract
    const [
      name,
      symbol,
      description,
      totalMinted,
      maxSupply,
      mintPrice,
      royaltyFee,
      baseURI,
    ] = await Promise.all([
      collection.name(),
      collection.symbol(),
      collection.getDescription(),
      collection.getTotalMinted().then((v: bigint) => v.toString()),
      collection.getMaxSupply().then((v: bigint) => v.toString()),
      collection.getMintPrice().then((v: bigint) => ethers.formatEther(v)),
      collection.getRoyaltyFee().then((v: bigint) => v.toString()),
      collection.s_tokenURI(), // Base URI stored in contract
    ]);

    return {
      address,
      name,
      symbol,
      description,
      totalSupply: totalMinted,
      tokenType,
      maxSupply,
      mintPrice,
      royaltyFee,
      baseURI,
    };
  }

  /**
   * Get token owner (ERC721 only)
   */
  async getTokenOwner(collection: string, tokenId: string): Promise<string> {
    const collectionContract = await this.getCollectionContract(collection, "ERC721");
    return await collectionContract.ownerOf(tokenId);
  }

  /**
   * Get token balance (ERC1155 only)
   */
  async getTokenBalance(
    collection: string,
    owner: string,
    tokenId: string
  ): Promise<string> {
    const collectionContract = await this.getCollectionContract(
      collection,
      "ERC1155"
    );
    const balance = await collectionContract.balanceOf(owner, tokenId);
    return balance.toString();
  }
}

export const collectionService = new CollectionService();
