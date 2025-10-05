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
  baseURI: string;
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
  ): Promise<{ tx: ethers.ContractTransactionResponse; address: string }> {
    try {
      const factory = await this.getFactoryContract(params.tokenType);

      const tx = await factory.createCollection(
        params.name,
        params.symbol,
        params.baseURI
      );

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
        return {
          tx,
          address: parsed?.args.collection,
        };
      }

      throw new Error("CollectionCreated event not found");
    } catch (error) {
      console.error("Error creating collection:", error);
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
