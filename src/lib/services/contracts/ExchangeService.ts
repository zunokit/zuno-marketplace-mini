/**
 * Exchange Service
 * Handles NFT listing, buying, and cancellation operations
 * Now uses MarketplaceHub for address discovery
 */

import { ethers } from "ethers";
import { marketplaceHubService } from "./MarketplaceHubService";
import { logger } from "@/lib/utils/logger";
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
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize exchange service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    logger.success("ExchangeService initialized", null, {
      component: "ExchangeService",
      action: "initialize",
    });
  }

  /**
   * Get exchange contract for specific token type
   */
  private getExchangeContract(
    tokenType: "ERC721" | "ERC1155"
  ): ethers.Contract {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const address =
      tokenType === "ERC721"
        ? marketplaceHubService.getERC721Exchange()
        : marketplaceHubService.getERC1155Exchange();

    const abi =
      tokenType === "ERC721" ? ERC721NFTExchange_ABI : ERC1155NFTExchange_ABI;

    return new ethers.Contract(address, abi, this.signer);
  }

  /**
   * Auto-detect exchange for an NFT contract
   */
  async getExchangeForNFT(nftContract: string): Promise<string> {
    return await marketplaceHubService.getExchangeFor(nftContract);
  }

  /**
   * Create a listing
   */
  async createListing(
    params: ListingParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const exchange = this.getExchangeContract(params.tokenType);
      const durationInSeconds = parseInt(params.duration) * 24 * 60 * 60;
      const amount =
        params.tokenType === "ERC1155" ? params.amount || "1" : "1";

      const tx = await exchange.listNFT(
        params.contractAddress,
        params.tokenId,
        amount,
        ethers.parseEther(params.price),
        durationInSeconds
      );

      return tx;
    } catch (error) {
      logger.error("Error creating listing", error, {
        component: "ExchangeService",
        action: "createListing",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Create batch listing
   */
  async createBatchListing(
    params: BatchListingParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      logger.info(
        "Creating batch listing",
        {
          contractAddress: params.contractAddress,
          tokenIds: params.tokenIds,
          prices: params.prices,
          duration: params.duration,
          tokenType: params.tokenType,
        },
        { component: "ExchangeService", action: "createBatchListing" }
      );

      const exchange = this.getExchangeContract(params.tokenType);
      const durationInSeconds = parseInt(params.duration) * 24 * 60 * 60;

      const tx = await exchange.batchListNFTs(
        params.contractAddress,
        params.tokenIds,
        params.tokenType === "ERC1155" ? params.amounts || [] : [],
        params.prices.map((price) => ethers.parseEther(price)),
        durationInSeconds
      );

      return tx;
    } catch (error) {
      logger.error("Error creating batch listing", error, {
        component: "ExchangeService",
        action: "createBatchListing",
      });
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
      const exchange = this.getExchangeContract(tokenType);
      const listingPrice = await this.getListingPrice(
        contractAddress,
        tokenId,
        tokenType
      );

      const tx = await exchange.buyNFT(contractAddress, tokenId, amount, {
        value: listingPrice,
      });

      return tx;
    } catch (error) {
      logger.error("Error buying NFT", error, {
        component: "ExchangeService",
        action: "buyNFT",
      });
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
      const exchange = this.getExchangeContract(tokenType);
      const tx = await exchange.cancelListing(contractAddress, tokenId);
      return tx;
    } catch (error) {
      logger.error("Error canceling listing", error, {
        component: "ExchangeService",
        action: "cancelListing",
      });
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
      const exchange = this.getExchangeContract(tokenType);
      const listing = await exchange.getListing(contractAddress, tokenId);
      return listing.price;
    } catch (error) {
      logger.error("Error getting listing price", error, {
        component: "ExchangeService",
        action: "getListingPrice",
      });
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
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const address =
        tokenType === "ERC721"
          ? marketplaceHubService.getERC721Exchange()
          : marketplaceHubService.getERC1155Exchange();

      const abi =
        tokenType === "ERC721" ? ERC721NFTExchange_ABI : ERC1155NFTExchange_ABI;

      const exchange = new ethers.Contract(address, abi, this.provider);
      const listings = await exchange.getCollectionListings(contractAddress);
      return listings;
    } catch (error) {
      logger.error("Error getting collection listings", error, {
        component: "ExchangeService",
        action: "getCollectionListings",
      });
      throw error;
    }
  }

  /**
   * Get user's listings
   */
  async getUserListings(
    userAddress: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<any[]> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const address =
        tokenType === "ERC721"
          ? marketplaceHubService.getERC721Exchange()
          : marketplaceHubService.getERC1155Exchange();

      const abi =
        tokenType === "ERC721" ? ERC721NFTExchange_ABI : ERC1155NFTExchange_ABI;

      const exchange = new ethers.Contract(address, abi, this.provider);
      const listings = await exchange.getUserListings(userAddress);
      return listings;
    } catch (error) {
      logger.error("Error getting user listings", error, {
        component: "ExchangeService",
        action: "getUserListings",
      });
      throw error;
    }
  }

  /**
   * Update listing price
   */
  async updateListingPrice(
    listingId: string,
    newPrice: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const exchange = this.getExchangeContract(tokenType);
      const tx = await exchange.updateListingPrice(
        listingId,
        ethers.parseEther(newPrice)
      );
      return tx;
    } catch (error) {
      logger.error("Error updating listing price", error, {
        component: "ExchangeService",
        action: "updateListingPrice",
      });
      throw error;
    }
  }

  /**
   * Calculate fees for a listing using Hub
   */
  async calculateFees(nftContract: string, tokenId: string, salePrice: string) {
    const salePriceBigInt = ethers.parseEther(salePrice);
    return await marketplaceHubService.calculateFees(
      nftContract,
      tokenId,
      salePriceBigInt
    );
  }

  /**
   * Get recent listings for home page
   */
  async getRecentListings(limit: number = 6): Promise<any[]> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      // Get recent listings from both ERC721 and ERC1155 exchanges
      const [erc721Listings, erc1155Listings] = await Promise.all([
        this.getCollectionListings(
          marketplaceHubService.getERC721Exchange(),
          "ERC721"
        ).catch(() => []),
        this.getCollectionListings(
          marketplaceHubService.getERC1155Exchange(),
          "ERC1155"
        ).catch(() => []),
      ]);

      // Combine and sort by timestamp (if available) or return first N
      const allListings = [...erc721Listings, ...erc1155Listings];
      return allListings.slice(0, limit);
    } catch (error) {
      logger.error("Error getting recent listings", error, {
        component: "ExchangeService",
        action: "getRecentListings",
      });
      return [];
    }
  }

  /**
   * Get count of active listings
   */
  async getActiveListingsCount(): Promise<number> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      // Get active listings count from both exchanges
      const [erc721Count, erc1155Count] = await Promise.all([
        this.getCollectionListings(
          marketplaceHubService.getERC721Exchange(),
          "ERC721"
        )
          .then((listings) => listings.length)
          .catch(() => 0),
        this.getCollectionListings(
          marketplaceHubService.getERC1155Exchange(),
          "ERC1155"
        )
          .then((listings) => listings.length)
          .catch(() => 0),
      ]);

      return erc721Count + erc1155Count;
    } catch (error) {
      logger.error("Error getting active listings count", error, {
        component: "ExchangeService",
        action: "getActiveListingsCount",
      });
      return 0;
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
