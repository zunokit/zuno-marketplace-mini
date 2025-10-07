/**
 * Collection Service
 * Handles ERC721/ERC1155 collection creation and operations
 * Uses MarketplaceHub for factory address discovery
 */

import { ethers } from "ethers";
import { marketplaceHubService } from "./MarketplaceHubService";
import {
  ERC721Collection_ABI,
  ERC1155Collection_ABI,
  ERC721CollectionFactory_ABI,
  ERC1155CollectionFactory_ABI,
} from "@/lib/contracts/abis";
import { ZERO_ADDRESS } from "@/lib/constants";

export interface CreateCollectionParams {
  name: string;
  symbol: string;
  owner?: string;
  description?: string;
  mintPrice?: string;
  royaltyFee?: string;
  maxSupply?: string;
  mintLimitPerWallet?: string;
  mintStartTime?: string;
  allowlistMintPrice?: string;
  publicMintPrice?: string;
  allowlistStageDuration?: string; // Duration in seconds (default 24h = 86400)
  baseURI?: string;
  tokenType: "ERC721" | "ERC1155";
}

export interface MintParams {
  collection: string;
  to: string;
  amount?: string; // For ERC1155, default 1
  tokenType: "ERC721" | "ERC1155";
  value?: string; // ETH value to send with transaction
}

export interface TransferParams {
  collection: string;
  tokenId: string;
  amount: string;
  tokenType: "ERC721" | "ERC1155";
  to: string;
}

export interface CollectionInfo {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  tokenType: "ERC721" | "ERC1155";
  maxSupply?: string;
  mintPrice?: string;
  baseURI?: string;
}

export class CollectionService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize collection service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    console.log("✅ CollectionService initialized");
  }

  /**
   * Get collection factory for token type
   */
  private async getFactoryContract(
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const factoryAddress = await marketplaceHubService.getCollectionFactory(
      tokenType
    );

    console.log(`🏭 ${tokenType} Factory Address:`, factoryAddress);

    if (!factoryAddress || factoryAddress === ZERO_ADDRESS) {
      throw new Error(
        `${tokenType} Factory not available. Please ensure contracts are deployed and hub is initialized.`
      );
    }

    const abi =
      tokenType === "ERC721"
        ? ERC721CollectionFactory_ABI
        : ERC1155CollectionFactory_ABI;

    return new ethers.Contract(factoryAddress, abi, this.signer);
  }

  /**
   * Create a new collection
   */
  async createCollection(params: CreateCollectionParams): Promise<string> {
    try {
      const factory = await this.getFactoryContract(params.tokenType);

      // Get current account as owner
      const account = await this.signer!.getAddress();

      // Prepare struct parameters - all uint256 values must be strings for ethers v6
      const collectionParams = {
        name: params.name,
        symbol: params.symbol,
        owner: params.owner || account,
        description: params.description || "",
        mintPrice: ethers.parseEther(params.mintPrice || "0.001").toString(),
        royaltyFee: (parseInt(params.royaltyFee || "5") * 100).toString(), // Convert percentage to basis points (5% = 500)
        maxSupply: (params.maxSupply || "10000").toString(),
        mintLimitPerWallet: (params.mintLimitPerWallet || "10").toString(),
        mintStartTime: (
          params.mintStartTime || Math.floor(Date.now() / 1000)
        ).toString(),
        allowlistMintPrice: ethers
          .parseEther(params.allowlistMintPrice || params.mintPrice || "0.001")
          .toString(),
        publicMintPrice: ethers
          .parseEther(params.publicMintPrice || params.mintPrice || "0.001")
          .toString(),
        allowlistStageDuration: (
          params.allowlistStageDuration || "86400"
        ).toString(), // 24 hours default
        tokenURI: params.baseURI || "https://api.example.com/metadata/",
      };

      console.log("🔍 DEBUG: Collection parameters being sent:", {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        collectionParams,
      });

      // Use correct method name based on token type
      const methodName =
        params.tokenType === "ERC721"
          ? "createERC721Collection"
          : "createERC1155Collection";
      const tx = await factory[methodName](collectionParams);

      const receipt = await tx.wait();

      // Find CollectionCreated event
      const eventName =
        params.tokenType === "ERC721"
          ? "ERC721CollectionCreated"
          : "ERC1155CollectionCreated";
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === eventName;
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = factory.interface.parseLog(event);
        console.log("📋 Event parsed:", parsed);
        console.log("📋 Event args:", parsed?.args);

        // Try different possible field names
        const collectionAddress =
          parsed?.args?.collection ||
          parsed?.args?.collectionAddress ||
          parsed?.args?.[0] ||
          parsed?.args?.[1];

        console.log("✅ Collection deployed at:", collectionAddress);

        // Log detailed info about the deployment
        console.log("📝 Deployment details:", {
          collectionAddress,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          parameters: {
            name: params.name,
            symbol: params.symbol,
            owner: params.owner || account,
            description: params.description,
            tokenType: params.tokenType,
          },
        });

        if (
          !collectionAddress ||
          collectionAddress === "0x0000000000000000000000000000000000000000"
        ) {
          throw new Error(
            "Collection deployment failed - no valid address returned"
          );
        }

        return collectionAddress;
      }

      // If event parsing fails, try to get the new contract address from transaction receipt
      console.log(
        "⚠️ CollectionCreated event not found, trying alternative method..."
      );

      // Get factory address for comparison
      const factoryAddress = await marketplaceHubService.getCollectionFactory(
        params.tokenType
      );

      // For factory contracts, the new contract address is often in logs or receipt
      if (receipt.logs && receipt.logs.length > 0) {
        console.log("🔍 Checking transaction logs for contract address...");

        // Try to find contract creation in logs
        for (const log of receipt.logs) {
          console.log("🔍 Checking log:", {
            address: log.address,
            topics: log.topics,
            data: log.data,
          });

          if (log.topics && log.topics.length > 0) {
            try {
              // Check all topics for potential contract addresses
              for (let i = 1; i < log.topics.length; i++) {
                const topic = log.topics[i];
                if (topic && topic.length === 66) {
                  const contractAddress = "0x" + topic.slice(26);
                  // Verify it's not zero address
                  if (
                    contractAddress !==
                    "0x0000000000000000000000000000000000000000"
                  ) {
                    console.log(
                      `✅ Found contract address in topic[${i}]:`,
                      contractAddress
                    );
                    return contractAddress;
                  }
                }
              }

              // Also check if the log.address itself is the new contract
              if (log.address && log.address !== factoryAddress) {
                console.log(
                  "✅ Found contract address as log.address:",
                  log.address
                );
                return log.address;
              }
            } catch (e) {
              // Continue searching
            }
          }
        }
      }

      console.log("⚠️ Using factory contract interaction as success indicator");
      return "SUCCESS_BUT_ADDRESS_UNKNOWN";
    } catch (error) {
      console.error("❌ Collection creation failed:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get collection contract instance
   */
  private getCollectionContract(
    address: string,
    tokenType: "ERC721" | "ERC1155"
  ): ethers.Contract {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const abi =
      tokenType === "ERC721" ? ERC721Collection_ABI : ERC1155Collection_ABI;

    return new ethers.Contract(address, abi, this.signer || this.provider);
  }

  /**
   * Mint NFT
   * For production contracts, mint functions are payable and require ETH
   */
  async mint(params: MintParams): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) {
        throw new Error("Signer not available - connect wallet first");
      }

      const collection = this.getCollectionContract(
        params.collection,
        params.tokenType
      );

      // Get mint info to determine the correct price
      const minterAddress = await this.signer.getAddress();
      let mintPrice = ethers.parseEther("0");

      try {
        const mintInfo = await collection.getMintInfo(minterAddress);
        mintPrice =
          mintInfo.currentMintPrice || mintInfo[4] || ethers.parseEther("0");
        console.log(
          "💰 Mint price from contract:",
          ethers.formatEther(mintPrice),
          "ETH"
        );
      } catch (error) {
        // If getMintInfo fails, use the provided value or default
        console.log("⚠️ Could not get mint info, using provided value");
        if (params.value) {
          mintPrice = ethers.parseEther(params.value);
        }
      }

      // Override with explicit value if provided
      if (params.value) {
        mintPrice = ethers.parseEther(params.value);
        console.log("💰 Using provided mint price:", params.value, "ETH");
      }

      if (params.tokenType === "ERC721") {
        // ERC721: mint(address to) payable
        return await collection.mint(params.to, { value: mintPrice });
      } else {
        // ERC1155: mint(address to, uint256 amount) payable
        const amount = params.amount || "1";
        return await collection.mint(params.to, amount, { value: mintPrice });
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Batch mint multiple NFTs in a single transaction (ERC1155 only)
   */
  async batchMint(
    collection: string,
    to: string,
    amounts: string[],
    value?: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) {
        throw new Error("Signer not available - connect wallet first");
      }

      const collectionContract = this.getCollectionContract(
        collection,
        "ERC1155"
      );

      // Calculate total mint price
      const minterAddress = await this.signer.getAddress();
      let totalMintPrice = ethers.parseEther("0");

      try {
        const mintInfo = await collectionContract.getMintInfo(minterAddress);
        const pricePerItem =
          mintInfo.currentMintPrice || mintInfo[4] || ethers.parseEther("0");
        const totalAmount = amounts.reduce(
          (sum, amount) => sum + BigInt(amount),
          BigInt(0)
        );
        totalMintPrice = pricePerItem * totalAmount;
        console.log(
          "💰 Total batch mint price:",
          ethers.formatEther(totalMintPrice),
          "ETH"
        );
      } catch (error) {
        // If getMintInfo fails, use the provided value
        if (value) {
          totalMintPrice = ethers.parseEther(value);
        }
      }

      // Override with explicit value if provided
      if (value) {
        totalMintPrice = ethers.parseEther(value);
      }

      // Call batchMint if available, otherwise mint multiple times
      if (collectionContract.batchMint) {
        return await collectionContract.batchMint(to, amounts, {
          value: totalMintPrice,
        });
      } else {
        // Fallback: mint one by one (less efficient)
        console.warn("⚠️ Batch mint not available, minting one by one");
        const totalAmount = amounts
          .reduce((sum, amount) => sum + parseInt(amount), 0)
          .toString();
        return await collectionContract.mint(to, totalAmount, {
          value: totalMintPrice,
        });
      }
    } catch (error) {
      console.error("Error batch minting NFTs:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Set approval for exchange
   */
  async setApprovalForAll(
    collection: string,
    operator: string,
    approved: boolean,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) {
        throw new Error("Signer not available - connect wallet first");
      }

      const collectionContract = this.getCollectionContract(
        collection,
        tokenType
      );

      return await collectionContract.setApprovalForAll(operator, approved);
    } catch (error) {
      console.error("Error setting approval:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Check if operator is approved
   */
  async isApprovedForAll(
    collection: string,
    owner: string,
    operator: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<boolean> {
    try {
      const collectionContract = this.getCollectionContract(
        collection,
        tokenType
      );

      return await collectionContract.isApprovedForAll(owner, operator);
    } catch (error) {
      console.error("Error checking approval:", error);
      return false;
    }
  }

  /**
   * Update mint stage for a collection (owner only)
   * This function progresses the mint stage from not_started -> allowlist -> public
   */
  async updateMintStage(
    collectionAddress: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) {
        throw new Error("Signer not available - connect wallet first");
      }

      const collection = this.getCollectionContract(
        collectionAddress,
        tokenType
      );

      // Call updateMintStage to progress to the next stage
      const tx = await collection.updateMintStage();
      console.log("📋 Updating mint stage for collection:", collectionAddress);
      
      return tx;
    } catch (error) {
      console.error("Error updating mint stage:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get mint information for a collection
   */
  async getMintInfo(
    collectionAddress: string,
    userAddress: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<{
    currentMintPrice: string;
    isAllowlisted: boolean;
    mintedPerWallet: string;
    mintLimitPerWallet: string;
    totalMinted: string;
    maxSupply: string;
    canMint: boolean;
    mintStage: string;
  }> {
    try {
      const collection = this.getCollectionContract(
        collectionAddress,
        tokenType
      );

      const mintInfo = await collection.getMintInfo(userAddress);

      // Parse mint info based on the return structure
      const currentMintPrice = ethers.formatEther(
        mintInfo.currentMintPrice || mintInfo[4] || "0"
      );
      const isAllowlisted =
        mintInfo.accountInAllowlist || mintInfo[11] || false;
      const mintedPerWallet = (
        mintInfo.mintedPerWallet ||
        mintInfo[9] ||
        "0"
      ).toString();
      const mintLimitPerWallet = (
        mintInfo.mintLimitPerWallet ||
        mintInfo[10] ||
        "0"
      ).toString();
      const totalMinted = (
        mintInfo.totalMinted ||
        mintInfo[7] ||
        "0"
      ).toString();
      const maxSupply = (mintInfo.maxSupply || mintInfo[8] || "0").toString();

      // Determine mint stage
      let mintStage = "not_started";
      const currentStageEnum = mintInfo.currentStage || mintInfo[3];
      console.log("🔍 Mint stage enum value:", currentStageEnum);
      
      if (currentStageEnum !== undefined) {
        if (currentStageEnum === 0 || currentStageEnum === "0") {
          mintStage = "not_started";
        } else if (currentStageEnum === 1 || currentStageEnum === "1") {
          mintStage = "allowlist";
        } else if (currentStageEnum === 2 || currentStageEnum === "2") {
          mintStage = "public";
        }
      }
      
      console.log("🎯 Determined mint stage:", mintStage);
      console.log("📊 Mint info:", {
        mintedPerWallet,
        mintLimitPerWallet,
        totalMinted,
        maxSupply,
        currentMintPrice
      });

      // Check if user can mint
      const hasSupplyLeft = parseInt(totalMinted) < parseInt(maxSupply);
      const underWalletLimit = parseInt(mintedPerWallet) < parseInt(mintLimitPerWallet);
      const stageAllowsMinting = (mintStage === "allowlist" && isAllowlisted) || (mintStage === "public");
      
      // User can mint if:
      // 1. There's supply left
      // 2. They're under their wallet limit
      // 3. Mint stage is active and they meet the requirements
      const canMint = hasSupplyLeft && underWalletLimit && stageAllowsMinting;
      
      console.log("🚀 Can mint check:", {
        hasSupplyLeft,
        underWalletLimit,
        stageAllowsMinting,
        isAllowlisted,
        mintStage,
        canMint
      });

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
    } catch (error) {
      console.error("Error getting mint info:", error);
      // Return default values if getMintInfo fails
      return {
        currentMintPrice: "0",
        isAllowlisted: false,
        mintedPerWallet: "0",
        mintLimitPerWallet: "0",
        totalMinted: "0",
        maxSupply: "0",
        canMint: false,
        mintStage: "unknown",
      };
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(
    address: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<CollectionInfo> {
    try {
      const collection = this.getCollectionContract(address, tokenType);

      const [name, symbol] = await Promise.all([
        collection.name(),
        collection.symbol(),
      ]);

      let totalSupply = "0";
      let maxSupply = "0";
      let mintPrice = "0";
      let baseURI = "";
      
      try {
        totalSupply = (await collection.totalSupply()).toString();
      } catch {
        // Some collections may not have totalSupply
      }
      
      try {
        maxSupply = (await collection.maxSupply()).toString();
      } catch {
        // Some collections may not have maxSupply
      }
      
      try {
        mintPrice = ethers.formatEther(await collection.mintPrice());
      } catch {
        // Some collections may not have mintPrice
      }
      
      try {
        baseURI = await collection.baseTokenURI();
      } catch {
        // Some collections may not have baseTokenURI
      }

      return {
        address,
        name,
        symbol,
        totalSupply,
        tokenType,
        maxSupply,
        mintPrice,
        baseURI
      };
    } catch (error) {
      console.error("Error getting collection info:", error);
      throw error;
    }
  }

  /**
   * Get token owner (ERC721 only)
   */
  async getTokenOwner(collection: string, tokenId: string): Promise<string> {
    try {
      const collectionContract = this.getCollectionContract(
        collection,
        "ERC721"
      );

      return await collectionContract.ownerOf(tokenId);
    } catch (error) {
      console.error("Error getting token owner:", error);
      throw error;
    }
  }

  /**
   * Get token balance (ERC1155 only)
   */
  async getTokenBalance(
    collection: string,
    owner: string,
    tokenId: string
  ): Promise<string> {
    try {
      const collectionContract = this.getCollectionContract(
        collection,
        "ERC1155"
      );

      const balance = await collectionContract.balanceOf(owner, tokenId);
      return balance.toString();
    } catch (error) {
      console.error("Error getting token balance:", error);
      throw error;
    }
  }

  /**
   * Verify collection using Hub
   */
  async verifyCollection(
    collection: string
  ): Promise<{ isValid: boolean; tokenType: string }> {
    return await marketplaceHubService.verifyCollection(collection);
  }

  /**
   * Format transaction error for user-friendly messages
   */
  private formatTransactionError(error: any): Error {
    // User rejection
    if (error.code === "ACTION_REJECTED" || error.code === 4001) {
      return new Error("Transaction was rejected by user");
    }

    // Insufficient funds
    if (error.code === "INSUFFICIENT_FUNDS" || error.code === -32000) {
      return new Error("Insufficient funds to complete transaction");
    }

    // Network errors
    if (error.code === "NETWORK_ERROR") {
      return new Error("Network error - please check your connection");
    }

    // Timeout
    if (error.code === "TIMEOUT") {
      return new Error("Transaction timed out - please try again");
    }

    // Gas estimation failed
    if (error.message?.includes("gas required exceeds allowance")) {
      return new Error("Gas estimation failed - transaction may fail");
    }

    // Contract revert errors
    if (error.message?.includes("execution reverted")) {
      const revertReason = error.message
        .split("execution reverted: ")[1]
        ?.split('"')[0];

      // Check for custom error data
      if (error.data) {
        const errorData = error.data;
        // Custom error selectors
        if (errorData === "0xf501eed5" || revertReason?.includes("MintingNotStarted")) {
          return new Error("Minting has not started yet. Please wait for the mint to begin.");
        }
        if (errorData === "0x5a8a1c5c" || revertReason?.includes("MintingNotActive")) {
          return new Error("Minting is not currently active");
        }
        if (revertReason?.includes("MintLimitExceeded")) {
          return new Error("You have exceeded the mint limit per wallet");
        }
        if (revertReason?.includes("InsufficientPayment")) {
          return new Error("Incorrect ETH amount sent for minting");
        }
        if (revertReason?.includes("NotInAllowlist")) {
          return new Error("Your address is not in the allowlist");
        }
      }

      // Common mint errors
      if (revertReason?.includes("Mint not started")) {
        return new Error("Minting has not started yet");
      }
      if (revertReason?.includes("Exceeded mint limit")) {
        return new Error("You have exceeded the mint limit per wallet");
      }
      if (revertReason?.includes("Max supply reached")) {
        return new Error("Collection has reached maximum supply");
      }
      if (revertReason?.includes("Incorrect payment")) {
        return new Error("Incorrect ETH amount sent for minting");
      }
      if (revertReason?.includes("Not in allowlist")) {
        return new Error("Your address is not in the allowlist");
      }
      if (revertReason?.includes("Allowlist stage ended")) {
        return new Error("The allowlist minting stage has ended");
      }

      return new Error(revertReason || "Transaction failed");
    }

    // Unparseable error
    if (error.error?.message) {
      return new Error(error.error.message);
    }

    return new Error(error.message || "Transaction failed");
  }
}

// Export singleton instance
export const collectionService = new CollectionService();
