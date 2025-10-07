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
  tokenId?: string; // For ERC721
  amount?: string; // For ERC1155, default 1
  tokenType: "ERC721" | "ERC1155";
  metadataUri?: string;
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

    if (!factoryAddress || factoryAddress === "0x0000000000000000000000000000000000000000") {
      console.error(`❌ ${tokenType} Factory not available:`, {
        factoryAddress,
        hubInitialized: !!marketplaceHubService,
        addresses: marketplaceHubService.getAddresses()
      });
      throw new Error(
        `${tokenType} Factory not deployed or not found in hub. ` +
        `Expected address: 0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc (for ERC721). ` +
        `Make sure the MarketplaceHub is properly initialized and contracts are deployed.`
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
  async createCollection(
    params: CreateCollectionParams
  ): Promise<string> {
    try {
      const factory = await this.getFactoryContract(params.tokenType);
      
      // Get current account as owner
      const account = await this.signer!.getAddress();

      // Prepare struct parameters
      const collectionParams = {
        name: params.name,
        symbol: params.symbol,
        owner: params.owner || account,
        description: params.description || "",
        mintPrice: ethers.parseEther(params.mintPrice || "0.001"),
        royaltyFee: ethers.parseUnits(params.royaltyFee || "5", 2), // 5% = 500 basis points
        maxSupply: BigInt(params.maxSupply || "10000"),
        mintLimitPerWallet: BigInt(params.mintLimitPerWallet || "10"),
        mintStartTime: BigInt(params.mintStartTime || Math.floor(Date.now() / 1000)),
        allowlistMintPrice: ethers.parseEther(params.allowlistMintPrice || "0.001"),
        publicMintPrice: ethers.parseEther(params.publicMintPrice || "0.001"),
        allowlistStageDuration: BigInt(params.allowlistStageDuration || "86400"), // 24 hours default
        tokenURI: params.baseURI || "https://api.example.com/metadata/",
      };

      // Use correct method name based on token type
      const methodName = params.tokenType === "ERC721" ? "createERC721Collection" : "createERC1155Collection";
      const tx = await factory[methodName](collectionParams);

      const receipt = await tx.wait();

      // Find CollectionCreated event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "CollectionCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = factory.interface.parseLog(event);
        console.log("📋 Event parsed:", parsed);
        console.log("📋 Event args:", parsed?.args);
        
        // Try different possible field names
        const collectionAddress = parsed?.args?.collection || 
                                 parsed?.args?.collectionAddress ||
                                 parsed?.args?.[0] ||
                                 parsed?.args?.[1];
        
        console.log("✅ Collection deployed at:", collectionAddress);
        return collectionAddress || "0x0000000000000000000000000000000000000000";
      }

      // If event parsing fails, try to get the new contract address from transaction receipt
      console.log("⚠️ CollectionCreated event not found, trying alternative method...");
      
      // Get factory address for comparison
      const factoryAddress = await marketplaceHubService.getCollectionFactory(params.tokenType);
      
      // For factory contracts, the new contract address is often in logs or receipt
      if (receipt.logs && receipt.logs.length > 0) {
        console.log("🔍 Checking transaction logs for contract address...");
        
        // Try to find contract creation in logs
        for (const log of receipt.logs) {
          console.log("🔍 Checking log:", {
            address: log.address,
            topics: log.topics,
            data: log.data
          });
          
          if (log.topics && log.topics.length > 0) {
            try {
              // Check all topics for potential contract addresses
              for (let i = 1; i < log.topics.length; i++) {
                const topic = log.topics[i];
                if (topic && topic.length === 66) {
                  const contractAddress = '0x' + topic.slice(26);
                  // Verify it's not zero address
                  if (contractAddress !== '0x0000000000000000000000000000000000000000') {
                    console.log(`✅ Found contract address in topic[${i}]:`, contractAddress);
                    return contractAddress;
                  }
                }
              }
              
              // Also check if the log.address itself is the new contract
              if (log.address && log.address !== factoryAddress) {
                console.log("✅ Found contract address as log.address:", log.address);
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

    return new ethers.Contract(
      address,
      abi,
      this.signer || this.provider
    );
  }

  /**
   * Mint NFT
   */
  async mint(
    params: MintParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) {
        throw new Error("Signer not available - connect wallet first");
      }

      const collection = this.getCollectionContract(
        params.collection,
        params.tokenType
      );

      if (params.tokenType === "ERC721") {
        const tokenId = params.tokenId || Date.now().toString();
        const uri = params.metadataUri || "";
        return await collection.mint(params.to, tokenId, uri);
      } else {
        const amount = params.amount || "1";
        const uri = params.metadataUri || "";
        return await collection.mint(params.to, amount, uri);
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
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
      try {
        totalSupply = (await collection.totalSupply()).toString();
      } catch {
        // Some collections may not have totalSupply
      }

      return {
        address,
        name,
        symbol,
        totalSupply,
        tokenType,
      };
    } catch (error) {
      console.error("Error getting collection info:", error);
      throw error;
    }
  }

  /**
   * Get token owner (ERC721 only)
   */
  async getTokenOwner(
    collection: string,
    tokenId: string
  ): Promise<string> {
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
    if (error.code === "ACTION_REJECTED") {
      return new Error("Transaction was rejected by user");
    }
    if (error.code === "INSUFFICIENT_FUNDS") {
      return new Error("Insufficient funds to complete transaction");
    }
    if (error.message?.includes("execution reverted")) {
      const revertReason = error.message.split("execution reverted: ")[1];
      return new Error(revertReason || "Transaction failed");
    }
    return new Error(error.message || "Transaction failed");
  }
}

// Export singleton instance
export const collectionService = new CollectionService();
