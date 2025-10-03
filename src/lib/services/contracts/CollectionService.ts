/**
 * Collection Service
 * Handles basic ERC721/ERC1155 collection operations
 * Provides helpers for minting, approval, and transfer operations
 */

import { ethers } from "ethers";
import { ERC721_ABI, ERC1155_ABI } from "@/lib/contracts/abis";
import { contractRegistryService } from "./ContractRegistryService";

export interface MintParams {
  collection: string;
  tokenId?: string; // For ERC721, auto-generated if not provided
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

export interface ApprovalParams {
  collection: string;
  tokenId: string;
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
  private isInitialized = false;

  constructor() {}

  /**
   * Initialize the collection service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.isInitialized = true;
      console.log("✅ CollectionService initialized");
    } catch (error) {
      console.error("❌ Failed to initialize CollectionService:", error);
      throw error;
    }
  }

  /**
   * Get collection contract instance
   */
  private getCollectionContract(
    collectionAddress: string,
    tokenType: "ERC721" | "ERC1155"
  ): ethers.Contract {
    const abi = tokenType === "ERC721" ? ERC721_ABI : ERC1155_ABI;
    const signer = contractRegistryService.getSigner();
    return new ethers.Contract(collectionAddress, abi, signer);
  }

  /**
   * Get collection information
   */
  async getCollectionInfo(collectionAddress: string): Promise<CollectionInfo> {
    try {
      // Try ERC721 first
      try {
        const contract = this.getCollectionContract(collectionAddress, "ERC721");
        const [name, symbol, totalSupply] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.totalSupply(),
        ]);

        return {
          address: collectionAddress,
          name,
          symbol,
          totalSupply: totalSupply.toString(),
          tokenType: "ERC721",
        };
      } catch {
        // Try ERC1155
        const contract = this.getCollectionContract(collectionAddress, "ERC1155");
        const [name, symbol] = await Promise.all([
          contract.name(),
          contract.symbol(),
        ]);

        return {
          address: collectionAddress,
          name,
          symbol,
          totalSupply: "0", // ERC1155 doesn't have totalSupply
          tokenType: "ERC1155",
        };
      }
    } catch (error) {
      console.error("Error getting collection info:", error);
      throw error;
    }
  }

  /**
   * Mint a new token
   */
  async mintToken(params: MintParams): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = this.getCollectionContract(params.collection, params.tokenType);

      if (params.tokenType === "ERC721") {
        const tx = await contract.mint(params.metadataUri || "");
        return tx;
      } else {
        // ERC1155
        const amount = params.amount || "1";
        const tx = await contract.mint(
          params.tokenId || "0", // Use provided tokenId or default to 0
          amount,
          params.metadataUri || ""
        );
        return tx;
      }
    } catch (error) {
      console.error("Error minting token:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Batch mint tokens
   */
  async batchMintTokens(
    collection: string,
    tokenIds: string[],
    amounts: string[],
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = this.getCollectionContract(collection, tokenType);

      if (tokenType === "ERC721") {
        // For ERC721, mint each token individually
        const tx = await contract.batchMint(tokenIds);
        return tx;
      } else {
        // For ERC1155, batch mint
        const tx = await contract.batchMint(tokenIds, amounts);
        return tx;
      }
    } catch (error) {
      console.error("Error batch minting tokens:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Transfer a token
   */
  async transferToken(params: TransferParams): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = this.getCollectionContract(params.collection, params.tokenType);

      if (params.tokenType === "ERC721") {
        const tx = await contract.transferFrom(
          await contractRegistryService.getSigner().getAddress(),
          params.to,
          params.tokenId
        );
        return tx;
      } else {
        // ERC1155
        const tx = await contract.safeTransferFrom(
          await contractRegistryService.getSigner().getAddress(),
          params.to,
          params.tokenId,
          params.amount,
          "0x" // Empty data
        );
        return tx;
      }
    } catch (error) {
      console.error("Error transferring token:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Approve a token for transfer
   */
  async approveToken(params: ApprovalParams): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = this.getCollectionContract(params.collection, params.tokenType);

      if (params.tokenType === "ERC721") {
        const tx = await contract.approve(params.to, params.tokenId);
        return tx;
      } else {
        // ERC1155 - set approval for all
        const tx = await contract.setApprovalForAll(params.to, true);
        return tx;
      }
    } catch (error) {
      console.error("Error approving token:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get token owner
   */
  async getTokenOwner(
    collection: string,
    tokenId: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<string> {
    try {
      const contract = this.getCollectionContract(collection, tokenType);

      if (tokenType === "ERC721") {
        return await contract.ownerOf(tokenId);
      } else {
        // For ERC1155, we need to check balance
        const signer = contractRegistryService.getSigner();
        const userAddress = await signer.getAddress();
        const balance = await contract.balanceOf(userAddress, tokenId);
        return balance > 0 ? userAddress : "0x0000000000000000000000000000000000000000";
      }
    } catch (error) {
      console.error("Error getting token owner:", error);
      throw error;
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(
    collection: string,
    tokenId: string,
    userAddress: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<string> {
    try {
      const contract = this.getCollectionContract(collection, tokenType);

      if (tokenType === "ERC721") {
        const owner = await contract.ownerOf(tokenId);
        return owner.toLowerCase() === userAddress.toLowerCase() ? "1" : "0";
      } else {
        // ERC1155
        const balance = await contract.balanceOf(userAddress, tokenId);
        return balance.toString();
      }
    } catch (error) {
      console.error("Error getting token balance:", error);
      return "0";
    }
  }

  /**
   * Check if user is approved for token
   */
  async isApprovedForToken(
    collection: string,
    tokenId: string,
    userAddress: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<boolean> {
    try {
      const contract = this.getCollectionContract(collection, tokenType);

      if (tokenType === "ERC721") {
        const approved = await contract.getApproved(tokenId);
        return approved.toLowerCase() === userAddress.toLowerCase();
      } else {
        // ERC1155
        const owner = await contract.ownerOf(tokenId);
        const isApproved = await contract.isApprovedForAll(owner, userAddress);
        return isApproved;
      }
    } catch (error) {
      console.error("Error checking token approval:", error);
      return false;
    }
  }

  /**
   * Get token URI
   */
  async getTokenURI(
    collection: string,
    tokenId: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<string> {
    try {
      const contract = this.getCollectionContract(collection, tokenType);

      if (tokenType === "ERC721") {
        return await contract.tokenURI(tokenId);
      } else {
        // ERC1155
        return await contract.uri(tokenId);
      }
    } catch (error) {
      console.error("Error getting token URI:", error);
      return "";
    }
  }

  /**
   * Get user's tokens
   */
  async getUserTokens(
    userAddress: string,
    collection: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<Array<{ tokenId: string; balance: string; uri: string }>> {
    try {
      const contract = this.getCollectionContract(collection, tokenType);

      if (tokenType === "ERC721") {
        const balance = await contract.balanceOf(userAddress);
        const tokens = [];

        for (let i = 0; i < balance; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          const uri = await this.getTokenURI(collection, tokenId.toString(), tokenType);
          
          tokens.push({
            tokenId: tokenId.toString(),
            balance: "1",
            uri,
          });
        }

        return tokens;
      } else {
        // For ERC1155, we need to know the token IDs
        // This is a simplified version - in practice, you'd need to track token IDs
        return [];
      }
    } catch (error) {
      console.error("Error getting user tokens:", error);
      return [];
    }
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
