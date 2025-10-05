/**
 * Exchange Service
 * Ported from frontend-foundry/src/services/contracts/marketplace/ExchangeService.js
 * Handles NFT listing, buying, and cancellation operations
 */

import { ethers } from "ethers";
import { getContractRegistryService } from "./ContractRegistryService";
import {
  ERC721NFTExchange_ABI,
  ERC1155NFTExchange_ABI,
} from "@/lib/contracts/abis";

export interface ListingParams {
  contractAddress: string;
  tokenId: string;
  price: string;
  duration: string;
  amount?: string;
  tokenType: "ERC721" | "ERC1155";
}

export interface BatchListingParams {
  contractAddress: string;
  tokenIds: string[];
  prices: string[];
  duration: string;
  amounts?: string[];
  tokenType: "ERC721" | "ERC1155";
}

export class ExchangeService {
  private isInitialized = false;
  private exchangeAddresses: { ERC721?: string; ERC1155?: string } = {};

  constructor() {
    // No need to store addresses, will get from registry service
  }

  /**
   * Initialize exchange contracts by loading their addresses
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadExchangeAddresses();
      this.isInitialized = true;
      console.log("✅ ExchangeService initialized");
    } catch (error) {
      console.error("❌ Failed to initialize ExchangeService:", error);
      throw error;
    }
  }

  /**
   * Load exchange contract addresses from the registry
   */
  private async loadExchangeAddresses(): Promise<void> {
    try {
      const registryService = getContractRegistryService();
      const registry = registryService.getContractByKey(
        "NFT_EXCHANGE_REGISTRY"
      );
      const [erc721Address, erc1155Address] =
        await registry.getExchangeAddresses();

      this.exchangeAddresses = {
        ERC721: erc721Address,
        ERC1155: erc1155Address,
      };

      console.log("✅ Exchange addresses loaded:", {
        ERC721: erc721Address,
        ERC1155: erc1155Address,
      });
    } catch (error) {
      console.error(
        "❌ Error loading exchange addresses from registry:",
        error
      );
      this.exchangeAddresses = {};
      throw error;
    }
  }

  /**
   * Get the registry contract instance
   */
  getRegistryContract(): ethers.Contract {
    const registryService = getContractRegistryService();
    return registryService.getContractByKey("NFT_EXCHANGE_REGISTRY");
  }

  /**
   * Get exchange address for a specific NFT contract
   */
  async getExchangeForNFT(nftContract: string): Promise<string> {
    try {
      const registry = this.getRegistryContract();
      return await registry.getExchangeForNFT(nftContract);
    } catch (error) {
      console.error("Error getting exchange for NFT:", error);
      throw error;
    }
  }

  /**
   * Create a listing using the unified registry
   */
  async createListing(
    params: ListingParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const registry = this.getRegistryContract();
      const durationInSeconds = parseInt(params.duration) * 24 * 60 * 60;
      const amount =
        params.tokenType === "ERC1155" ? params.amount || "1" : "1";

      const tx = await registry.listNFT(
        params.contractAddress,
        params.tokenId,
        amount,
        ethers.parseEther(params.price),
        durationInSeconds
      );

      return tx;
    } catch (error) {
      console.error("Error creating listing:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Create batch listing using individual exchange contracts
   */
  async createBatchListing(
    params: BatchListingParams
  ): Promise<ethers.ContractTransactionResponse[]> {
    try {
      console.log("🏷️ Creating batch listing:", {
        contractAddress: params.contractAddress,
        tokenIds: params.tokenIds,
        prices: params.prices,
        duration: params.duration,
        tokenType: params.tokenType,
      });

      const exchangeAddress = this.exchangeAddresses[params.tokenType];
      if (!exchangeAddress) {
        throw new Error(
          `Exchange address not found for token type: ${params.tokenType}`
        );
      }

      const exchangeABI =
        params.tokenType === "ERC721"
          ? ERC721NFTExchange_ABI
          : ERC1155NFTExchange_ABI;
      const exchange = getContractRegistryService().getContractByKey(
        "NFT_EXCHANGE_REGISTRY"
      ); // Use registry for batch operations

      const durationInSeconds = parseInt(params.duration) * 24 * 60 * 60;
      const tx = await exchange.batchListNFTs(
        params.contractAddress,
        params.tokenIds,
        params.tokenType === "ERC1155" ? params.amounts || [] : [],
        params.prices.map((price) => ethers.parseEther(price)),
        durationInSeconds
      );

      return [tx];
    } catch (error) {
      console.error("Error creating batch listing:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Buy an NFT from a listing
   */
  async buyNFT(
    contractAddress: string,
    tokenId: string,
    amount: string = "1",
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const exchangeAddress = this.exchangeAddresses[tokenType];
      if (!exchangeAddress) {
        throw new Error(
          `Exchange address not found for token type: ${tokenType}`
        );
      }

      const exchangeABI =
        tokenType === "ERC721" ? ERC721NFTExchange_ABI : ERC1155NFTExchange_ABI;
      const exchange = new ethers.Contract(
        exchangeAddress,
        exchangeABI,
        getContractRegistryService().getSigner()
      );

      const tx = await exchange.buyNFT(contractAddress, tokenId, amount, {
        value: await this.getListingPrice(contractAddress, tokenId, tokenType),
      });

      return tx;
    } catch (error) {
      console.error("Error buying NFT:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Cancel a listing
   */
  async cancelListing(
    contractAddress: string,
    tokenId: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const exchangeAddress = this.exchangeAddresses[tokenType];
      if (!exchangeAddress) {
        throw new Error(
          `Exchange address not found for token type: ${tokenType}`
        );
      }

      const exchangeABI =
        tokenType === "ERC721" ? ERC721NFTExchange_ABI : ERC1155NFTExchange_ABI;
      const exchange = new ethers.Contract(
        exchangeAddress,
        exchangeABI,
        getContractRegistryService().getSigner()
      );

      const tx = await exchange.cancelListing(contractAddress, tokenId);
      return tx;
    } catch (error) {
      console.error("Error canceling listing:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get listing price for an NFT
   */
  private async getListingPrice(
    contractAddress: string,
    tokenId: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<bigint> {
    try {
      const exchangeAddress = this.exchangeAddresses[tokenType];
      if (!exchangeAddress) {
        throw new Error(
          `Exchange address not found for token type: ${tokenType}`
        );
      }

      const exchangeABI =
        tokenType === "ERC721" ? ERC721NFTExchange_ABI : ERC1155NFTExchange_ABI;
      const exchange = new ethers.Contract(
        exchangeAddress,
        exchangeABI,
        getContractRegistryService().getSigner()
      );

      const listing = await exchange.getListing(contractAddress, tokenId);
      return listing.price;
    } catch (error) {
      console.error("Error getting listing price:", error);
      throw error;
    }
  }

  /**
   * Get all listings for a collection
   */
  async getCollectionListings(
    contractAddress: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<any[]> {
    try {
      const exchangeAddress = this.exchangeAddresses[tokenType];
      if (!exchangeAddress) {
        throw new Error(
          `Exchange address not found for token type: ${tokenType}`
        );
      }

      const exchangeABI =
        tokenType === "ERC721" ? ERC721NFTExchange_ABI : ERC1155NFTExchange_ABI;
      const exchange = new ethers.Contract(
        exchangeAddress,
        exchangeABI,
        getContractRegistryService().getSigner()
      );

      const listings = await exchange.getCollectionListings(contractAddress);
      return listings;
    } catch (error) {
      console.error("Error getting collection listings:", error);
      throw error;
    }
  }

  /**
   * Get user's listings
   */
  async getUserListings(userAddress: string): Promise<any[]> {
    try {
      const registry = this.getRegistryContract();
      const listings = await registry.getUserListings(userAddress);
      return listings;
    } catch (error) {
      console.error("Error getting user listings:", error);
      throw error;
    }
  }

  /**
   * Update listing price
   */
  async updateListingPrice(
    listingId: string,
    newPrice: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const registry = this.getRegistryContract();
      const tx = await registry.updateListingPrice(
        listingId,
        ethers.parseEther(newPrice)
      );
      return tx;
    } catch (error) {
      console.error("Error updating listing price:", error);
      throw error;
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
export const exchangeService = new ExchangeService();
