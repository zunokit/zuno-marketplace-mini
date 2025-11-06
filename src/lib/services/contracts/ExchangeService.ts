/**
 * Exchange Service
 * Handles NFT listing, buying, and cancellation operations
 * Now uses UserHub for address discovery
 */

import { ethers } from "ethers";
import { userHubService } from "./UserHubService";
import { logger } from "@/lib/utils/logger";
import { getContractABI } from "@/lib/contracts/abi-manager";

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

export interface Listing {
  listingId: string;
  seller: string;
  contractAddress: string;
  tokenId: bigint;
  amount: bigint;
  price: bigint;
  paymentToken: string;
  expirationTime: bigint;
  isActive: boolean;
  tokenType: "ERC721" | "ERC1155";
}

export class ExchangeService {
  public provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  
  /**
   * Get signer for direct contract interaction
   */
  getSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }
    return this.signer;
  }

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
  private async getExchangeContract(
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const address =
      tokenType === "ERC721"
        ? userHubService.getERC721Exchange()
        : userHubService.getERC1155Exchange();

    const abiName =
      tokenType === "ERC721" ? "ERC721NFTExchange" : "ERC1155NFTExchange";
    const abi = await getContractABI(abiName);

    return new ethers.Contract(address, abi, this.signer);
  }

  /**
   * Get exchange contract for read-only operations
   */
  private async getExchangeContractReadOnly(
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.Contract> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const address =
      tokenType === "ERC721"
        ? userHubService.getERC721Exchange()
        : userHubService.getERC1155Exchange();

    const abiName =
      tokenType === "ERC721" ? "ERC721NFTExchange" : "ERC1155NFTExchange";
    const abi = await getContractABI(abiName);

    return new ethers.Contract(address, abi, this.provider);
  }

  /**
   * Auto-detect exchange for an NFT contract
   */
  async getExchangeForNFT(nftContract: string): Promise<string> {
    return await userHubService.getExchangeFor(nftContract);
  }

  /**
   * Get all active listings onchain
   */
  async getAllActiveListings(
    tokenType: "ERC721" | "ERC1155" = "ERC721",
    limit: number = 100,
    offset: number = 0
  ): Promise<Listing[]> {
    try {
      const exchange = await this.getExchangeContractReadOnly(tokenType);
      
      // TODO: Implement based on your contract's actual methods
      // This is a placeholder structure
      const listings: Listing[] = [];
      
      logger.info(`Fetching active ${tokenType} listings`, { limit, offset }, {
        component: "ExchangeService",
        action: "getAllActiveListings"
      });
      
      return listings;
    } catch (error) {
      logger.error("Failed to get active listings", error, {
        component: "ExchangeService",
        action: "getAllActiveListings"
      });
      return [];
    }
  }

  /**
   * Get listing by NFT
   */
  async getListingByNFT(
    contractAddress: string,
    tokenId: string,
    tokenType: "ERC721" | "ERC1155" = "ERC721"
  ): Promise<Listing | null> {
    try {
      const exchange = await this.getExchangeContractReadOnly(tokenType);
      
      // Check if NFT is listed
      const isListed = await exchange.isNFTListed(contractAddress, tokenId);
      if (!isListed) return null;
      
      // Get listing details - adapt to your contract's actual method
      const listing = await exchange.getListingByNFT(contractAddress, tokenId);
      
      return {
        listingId: listing.listingId,
        seller: listing.seller,
        contractAddress: listing.contractAddress,
        tokenId: listing.tokenId,
        amount: listing.amount || 1n,
        price: listing.price,
        paymentToken: listing.paymentToken || ethers.ZeroAddress,
        expirationTime: listing.expirationTime,
        isActive: listing.isActive,
        tokenType
      };
    } catch (error) {
      logger.error("Failed to get listing by NFT", error, {
        component: "ExchangeService",
        action: "getListingByNFT"
      });
      return null;
    }
  }

  /**
   * Create a listing
   */
  async createListing(
    params: ListingParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const exchange = await this.getExchangeContract(params.tokenType);
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

      const exchange = await this.getExchangeContract(params.tokenType);
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
   * Buy an NFT listing (alias for buyNFT)
   */
  async buyListing(
    contractAddress: string,
    tokenId: string,
    amount: string = "1",
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    return this.buyNFT(contractAddress, tokenId, amount, tokenType);
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
      const exchange = await this.getExchangeContract(tokenType);
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
      const exchange = await this.getExchangeContract(tokenType);
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
      const exchange = await this.getExchangeContract(tokenType);
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
          ? userHubService.getERC721Exchange()
          : userHubService.getERC1155Exchange();

      const abiName =
        tokenType === "ERC721" ? "ERC721NFTExchange" : "ERC1155NFTExchange";
      const abi = await getContractABI(abiName);

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
   * Update listing price
   */
  async updateListingPrice(
    listingId: string,
    newPrice: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const exchange = await this.getExchangeContract(tokenType);
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
   * Calculate fees for a listing
   * @notice Fees are now calculated via FeeRegistry/AdvancedFeeManager  
   */
  async calculateFees(nftContract: string, tokenId: string, salePrice: string, userAddress?: string) {
    const salePriceBigInt = ethers.parseEther(salePrice);
    
    // Get fee registry from UserHub
    const feeRegistryAddress = userHubService.getFeeRegistry();
    
    // TODO: Implement fee calculation via FeeRegistry
    logger.info("Fee calculation via FeeRegistry", { 
      feeRegistryAddress,
      nftContract,
      salePrice 
    }, {
      component: "ExchangeService",
      action: "calculateFees"
    });
    
    // For now, return placeholder values
    const platformFeeRate = 250n; // 2.5% in basis points
    const royaltyRate = 500n; // 5% in basis points
    
    const platformFee = (salePriceBigInt * platformFeeRate) / 10000n;
    const royaltyAmount = (salePriceBigInt * royaltyRate) / 10000n;
    const sellerProceeds = salePriceBigInt - platformFee - royaltyAmount;
    
    return {
      platformFee,
      royaltyAmount,
      royaltyRecipient: ethers.ZeroAddress, // TODO: Get from royalty registry
      sellerProceeds,
      totalPrice: salePriceBigInt
    };
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
          userHubService.getERC721Exchange(),
          "ERC721"
        ).catch(() => []),
        this.getCollectionListings(
          userHubService.getERC1155Exchange(),
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
          userHubService.getERC721Exchange(),
          "ERC721"
        )
          .then((listings) => listings.length)
          .catch(() => 0),
        this.getCollectionListings(
          userHubService.getERC1155Exchange(),
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
   * List an NFT for sale on the marketplace
   *
   * Creates a listing for an NFT (ERC721 or ERC1155) that buyers can purchase.
   * The NFT must be approved for the exchange contract before listing.
   *
   * @param params - Listing parameters
   * @param params.contractAddress - NFT contract address
   * @param params.tokenId - Token ID to list
   * @param params.price - Sale price in ETH (as string, e.g. "0.1")
   * @param params.duration - Listing duration in seconds
   * @param params.amount - Amount to list (for ERC1155 only, defaults to "1")
   * @param params.tokenType - Token standard ("ERC721" or "ERC1155")
   * @returns Listing ID as string
   * @throws {Error} If user is not connected, NFT not approved, or transaction fails
   *
   * @example
   * ```ts
   * const listingId = await exchangeService.listNFT({
   *   contractAddress: "0x...",
   *   tokenId: "1",
   *   price: "0.5",
   *   duration: "86400", // 24 hours
   *   tokenType: "ERC721"
   * });
   * ```
   */
  async listNFT(params: ListingParams): Promise<string> {
    try {
      const contract = await this.getExchangeContract(params.tokenType);
      
      const tx = await contract.listNFT(
        params.contractAddress,
        params.tokenId,
        params.tokenType === "ERC1155" ? params.amount || "1" : undefined,
        ethers.parseEther(params.price),
        params.duration
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => 
        log.eventName === "NFTListed"
      );
      
      logger.success("NFT listed successfully", {
        listingId: event?.args?.listingId,
        contractAddress: params.contractAddress,
        tokenId: params.tokenId,
        price: params.price,
      }, {
        component: "ExchangeService",
        action: "listNFT",
      });

      return event?.args?.listingId || "";
    } catch (error) {
      logger.error("Failed to list NFT", error, {
        component: "ExchangeService",
        action: "listNFT",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Batch list multiple NFTs
   */
  async batchListNFT(params: BatchListingParams): Promise<string[]> {
    try {
      const contract = await this.getExchangeContract(params.tokenType);
      
      const prices = params.prices.map(p => ethers.parseEther(p));
      
      const tx = await contract.batchListNFT(
        params.contractAddress,
        params.tokenIds,
        params.tokenType === "ERC1155" ? params.amounts : undefined,
        prices,
        params.duration
      );
      
      const receipt = await tx.wait();
      const listingIds = receipt.logs
        .filter((log: any) => log.eventName === "NFTListed")
        .map((log: any) => log.args?.listingId);
      
      logger.success("Batch NFT listing successful", {
        count: listingIds.length,
        contractAddress: params.contractAddress,
      }, {
        component: "ExchangeService",
        action: "batchListNFT",
      });

      return listingIds;
    } catch (error) {
      logger.error("Failed to batch list NFTs", error, {
        component: "ExchangeService",
        action: "batchListNFT",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Batch buy multiple NFTs
   */
  async batchBuyNFT(listingIds: string[], totalPrice: string): Promise<void> {
    try {
      // Determine which exchange to use based on first listing
      const firstListing = await this.getListing(listingIds[0]);
      const tokenType = await this.detectTokenType(firstListing.contractAddress);
      const contract = await this.getExchangeContract(tokenType);
      
      const tx = await contract.batchBuyNFT(listingIds, {
        value: ethers.parseEther(totalPrice)
      });
      
      await tx.wait();
      
      logger.success("Batch purchase successful", {
        count: listingIds.length,
        totalPrice,
      }, {
        component: "ExchangeService",
        action: "batchBuyNFT",
      });
    } catch (error) {
      logger.error("Failed to batch buy NFTs", error, {
        component: "ExchangeService",
        action: "batchBuyNFT",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get listing details by listing ID
   */
  async getListing(listingId: string): Promise<Listing> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      // Try both exchanges to find the listing
      const erc721Contract = await this.getExchangeContractReadOnly("ERC721");
      const erc1155Contract = await this.getExchangeContractReadOnly("ERC1155");

      let listing;
      let tokenType: "ERC721" | "ERC1155" = "ERC721";

      try {
        listing = await erc721Contract.getListing(listingId);
        if (!listing.seller || listing.seller === ethers.ZeroAddress) {
          throw new Error("Not found in ERC721");
        }
      } catch {
        listing = await erc1155Contract.getListing(listingId);
        tokenType = "ERC1155";
      }

      return {
        listingId,
        seller: listing.seller,
        contractAddress: listing.contractAddress,
        tokenId: listing.tokenId,
        amount: listing.amount || 1n,
        price: listing.price,
        paymentToken: listing.paymentToken || ethers.ZeroAddress,
        expirationTime: listing.expirationTime,
        isActive: listing.isActive,
        tokenType,
      };
    } catch (error) {
      logger.error("Failed to get listing", error, {
        component: "ExchangeService",
        action: "getListing",
      });
      throw error;
    }
  }

  /**
   * Get user's active listings
   */
  async getUserListings(userAddress: string): Promise<Listing[]> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const erc721Contract = await this.getExchangeContractReadOnly("ERC721");
      const erc1155Contract = await this.getExchangeContractReadOnly("ERC1155");

      // Get user listings from both exchanges
      const [erc721Listings, erc1155Listings] = await Promise.all([
        erc721Contract.getUserListings(userAddress).catch(() => []),
        erc1155Contract.getUserListings(userAddress).catch(() => []),
      ]);

      // Format and combine listings
      const formattedERC721 = erc721Listings.map((l: any) => ({
        ...l,
        tokenType: "ERC721" as const,
        amount: 1n,
      }));

      const formattedERC1155 = erc1155Listings.map((l: any) => ({
        ...l,
        tokenType: "ERC1155" as const,
      }));

      return [...formattedERC721, ...formattedERC1155];
    } catch (error) {
      logger.error("Failed to get user listings", error, {
        component: "ExchangeService",
        action: "getUserListings",
      });
      return [];
    }
  }

  /**
   * Check if NFT is listed
   */
  async isNFTListed(contractAddress: string, tokenId: string): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const tokenType = await this.detectTokenType(contractAddress);
      const contract = await this.getExchangeContractReadOnly(tokenType);

      return await contract.isNFTListed(contractAddress, tokenId);
    } catch (error) {
      logger.error("Failed to check if NFT is listed", error, {
        component: "ExchangeService",
        action: "isNFTListed",
      });
      return false;
    }
  }

  /**
   * Extend listing duration
   */
  async extendListing(listingId: string, additionalDuration: string): Promise<void> {
    try {
      // Get listing to determine token type
      const listing = await this.getListing(listingId);
      const contract = await this.getExchangeContract(listing.tokenType);

      const tx = await contract.extendListing(listingId, additionalDuration);
      await tx.wait();

      logger.success("Listing extended successfully", {
        listingId,
        additionalDuration,
      }, {
        component: "ExchangeService",
        action: "extendListing",
      });
    } catch (error) {
      logger.error("Failed to extend listing", error, {
        component: "ExchangeService",
        action: "extendListing",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Pause listing
   */
  async pauseListing(listingId: string): Promise<void> {
    try {
      const listing = await this.getListing(listingId);
      const contract = await this.getExchangeContract(listing.tokenType);

      const tx = await contract.pauseListing(listingId);
      await tx.wait();

      logger.success("Listing paused successfully", {
        listingId,
      }, {
        component: "ExchangeService",
        action: "pauseListing",
      });
    } catch (error) {
      logger.error("Failed to pause listing", error, {
        component: "ExchangeService",
        action: "pauseListing",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Resume paused listing
   */
  async resumeListing(listingId: string): Promise<void> {
    try {
      const listing = await this.getListing(listingId);
      const contract = await this.getExchangeContract(listing.tokenType);

      const tx = await contract.resumeListing(listingId);
      await tx.wait();

      logger.success("Listing resumed successfully", {
        listingId,
      }, {
        component: "ExchangeService",
        action: "resumeListing",
      });
    } catch (error) {
      logger.error("Failed to resume listing", error, {
        component: "ExchangeService",
        action: "resumeListing",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Batch cancel listings
   */
  async batchCancelListing(listingIds: string[]): Promise<void> {
    try {
      if (listingIds.length === 0) return;

      // Get first listing to determine token type
      const firstListing = await this.getListing(listingIds[0]);
      const contract = await this.getExchangeContract(firstListing.tokenType);

      const tx = await contract.batchCancelListing(listingIds);
      await tx.wait();

      logger.success("Batch cancel successful", {
        count: listingIds.length,
      }, {
        component: "ExchangeService",
        action: "batchCancelListing",
      });
    } catch (error) {
      logger.error("Failed to batch cancel listings", error, {
        component: "ExchangeService",
        action: "batchCancelListing",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Detect token type for NFT contract
   */
  private async detectTokenType(contractAddress: string): Promise<"ERC721" | "ERC1155"> {
    try {
      const exchangeAddress = await userHubService.getExchangeFor(contractAddress);
      const erc721Exchange = userHubService.getERC721Exchange();
      
      return exchangeAddress === erc721Exchange ? "ERC721" : "ERC1155";
    } catch (error) {
      logger.warn("Failed to detect token type, defaulting to ERC721", {
        contractAddress,
      }, {
        component: "ExchangeService",
        action: "detectTokenType",
      });
      return "ERC721";
    }
  }

  /**
   * Format transaction error for user-friendly messages
   *
   * Converts low-level blockchain errors into readable error messages.
   * Handles common error cases like user rejection, insufficient funds,
   * and contract reverts.
   *
   * @param error - Error from ethers.js transaction
   * @returns Formatted Error object with user-friendly message
   */
  private formatTransactionError(error: unknown): Error {
    if (typeof error === "object" && error !== null) {
      const err = error as { code?: string; message?: string };

      if (err.code === "ACTION_REJECTED") {
        return new Error("Transaction was rejected by user");
      }
      if (err.code === "INSUFFICIENT_FUNDS") {
        return new Error("Insufficient funds to complete transaction");
      }
      if (err.message?.includes("execution reverted")) {
        const revertReason = err.message.split("execution reverted: ")[1];
        return new Error(revertReason || "Transaction failed");
      }
      if (err.message) {
        return new Error(err.message);
      }
    }

    return new Error("Transaction failed");
  }
}

// Export singleton instance
export const exchangeService = new ExchangeService();
