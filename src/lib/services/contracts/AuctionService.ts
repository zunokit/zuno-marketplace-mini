/**
 * Auction Service
 * Ported from frontend-foundry/src/services/contracts/auction/AuctionService.js
 * Handles auction creation, bidding, and settlement operations
 */

import { ethers } from "ethers";
import { getContractRegistryService } from "./ContractRegistryService";

export interface EnglishAuctionParams {
  nftContract: string;
  tokenId: string;
  amount: string;
  startPrice: string;
  reservePrice: string;
  duration: number; // in hours
}

export interface DutchAuctionParams {
  nftContract: string;
  tokenId: string;
  amount: string;
  startPrice: string;
  reservePrice: string;
  duration: number; // in hours
  priceDropPerHour: string;
}

export interface AuctionInfo {
  auctionId: string;
  nftContract: string;
  tokenId: string;
  amount: string;
  startPrice: bigint;
  reservePrice: bigint;
  currentPrice: bigint;
  highestBid: bigint;
  highestBidder: string;
  startTime: bigint;
  endTime: bigint;
  status: number; // 0: Active, 1: Ended, 2: Cancelled
  auctionType: number; // 0: English, 1: Dutch
}

export class AuctionService {
  private isInitialized = false;

  constructor() {
    // No need to store addresses, will get from registry service
  }

  /**
   * Initialize the auction service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Verify factory contract is accessible
      await this.getFactoryContract().getAddress();
      this.isInitialized = true;
      console.log("✅ AuctionService initialized");
    } catch (error) {
      console.error("❌ Failed to initialize AuctionService:", error);
      throw error;
    }
  }

  /**
   * Get the auction factory contract instance
   */
  getFactoryContract(): ethers.Contract {
    const registryService = getContractRegistryService();
    return registryService.getContractByKey("AUCTION_FACTORY");
  }

  /**
   * Create an English auction
   */
  async createEnglishAuction(
    params: EnglishAuctionParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const factory = this.getFactoryContract();
      const durationInSeconds = params.duration * 60 * 60; // Convert hours to seconds

      const tx = await factory.createEnglishAuction(
        params.nftContract,
        params.tokenId,
        params.amount,
        ethers.parseEther(params.startPrice),
        ethers.parseEther(params.reservePrice),
        durationInSeconds
      );

      return tx;
    } catch (error) {
      console.error("Error creating English auction:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Create a Dutch auction
   */
  async createDutchAuction(
    params: DutchAuctionParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const factory = this.getFactoryContract();
      const durationInSeconds = params.duration * 60 * 60; // Convert hours to seconds

      const tx = await factory.createDutchAuction(
        params.nftContract,
        params.tokenId,
        params.amount,
        ethers.parseEther(params.startPrice),
        ethers.parseEther(params.reservePrice),
        durationInSeconds,
        ethers.parseEther(params.priceDropPerHour)
      );

      return tx;
    } catch (error) {
      console.error("Error creating Dutch auction:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Place a bid on an auction
   */
  async placeBid(
    auctionId: string,
    bidAmount: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const factory = this.getFactoryContract();

      const tx = await factory.placeBid(auctionId, {
        value: ethers.parseEther(bidAmount),
      });

      return tx;
    } catch (error) {
      console.error("Error placing bid:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Buy now from a Dutch auction
   */
  async buyNow(
    auctionId: string,
    price: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const factory = this.getFactoryContract();

      const tx = await factory.buyNow(auctionId, {
        value: ethers.parseEther(price),
      });

      return tx;
    } catch (error) {
      console.error("Error buying now:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Cancel an auction
   */
  async cancelAuction(
    auctionId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const factory = this.getFactoryContract();

      const tx = await factory.cancelAuction(auctionId);
      return tx;
    } catch (error) {
      console.error("Error canceling auction:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Settle an auction
   */
  async settleAuction(
    auctionId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const factory = this.getFactoryContract();

      const tx = await factory.settleAuction(auctionId);
      return tx;
    } catch (error) {
      console.error("Error settling auction:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Withdraw bid from an auction
   */
  async withdrawBid(
    auctionId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const factory = this.getFactoryContract();

      const tx = await factory.withdrawBid(auctionId);
      return tx;
    } catch (error) {
      console.error("Error withdrawing bid:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get auction information
   */
  async getAuctionInfo(auctionId: string): Promise<AuctionInfo> {
    try {
      const factory = this.getFactoryContract();
      const auctionInfo = await factory.getAuctionInfo(auctionId);

      return {
        auctionId,
        nftContract: auctionInfo.nftContract,
        tokenId: auctionInfo.tokenId.toString(),
        amount: auctionInfo.amount.toString(),
        startPrice: auctionInfo.startPrice,
        reservePrice: auctionInfo.reservePrice,
        currentPrice: auctionInfo.currentPrice,
        highestBid: auctionInfo.highestBid,
        highestBidder: auctionInfo.highestBidder,
        startTime: auctionInfo.startTime,
        endTime: auctionInfo.endTime,
        status: auctionInfo.status,
        auctionType: auctionInfo.auctionType,
      };
    } catch (error) {
      console.error("Error getting auction info:", error);
      throw error;
    }
  }

  /**
   * Get all active auctions
   */
  async getActiveAuctions(): Promise<AuctionInfo[]> {
    try {
      const factory = this.getFactoryContract();
      const auctions = await factory.getActiveAuctions();

      return auctions.map((auction: any, index: number) => ({
        auctionId: index.toString(),
        nftContract: auction.nftContract,
        tokenId: auction.tokenId.toString(),
        amount: auction.amount.toString(),
        startPrice: auction.startPrice,
        reservePrice: auction.reservePrice,
        currentPrice: auction.currentPrice,
        highestBid: auction.highestBid,
        highestBidder: auction.highestBidder,
        startTime: auction.startTime,
        endTime: auction.endTime,
        status: auction.status,
        auctionType: auction.auctionType,
      }));
    } catch (error) {
      console.error("Error getting active auctions:", error);
      throw error;
    }
  }

  /**
   * Get user's auctions
   */
  async getUserAuctions(userAddress: string): Promise<AuctionInfo[]> {
    try {
      const factory = this.getFactoryContract();
      const auctions = await factory.getUserAuctions(userAddress);

      return auctions.map((auction: any, index: number) => ({
        auctionId: index.toString(),
        nftContract: auction.nftContract,
        tokenId: auction.tokenId.toString(),
        amount: auction.amount.toString(),
        startPrice: auction.startPrice,
        reservePrice: auction.reservePrice,
        currentPrice: auction.currentPrice,
        highestBid: auction.highestBid,
        highestBidder: auction.highestBidder,
        startTime: auction.startTime,
        endTime: auction.endTime,
        status: auction.status,
        auctionType: auction.auctionType,
      }));
    } catch (error) {
      console.error("Error getting user auctions:", error);
      throw error;
    }
  }

  /**
   * Get user's bids
   */
  async getUserBids(userAddress: string): Promise<any[]> {
    try {
      const factory = this.getFactoryContract();
      const bids = await factory.getUserBids(userAddress);
      return bids;
    } catch (error) {
      console.error("Error getting user bids:", error);
      throw error;
    }
  }

  /**
   * Check if auction can be settled
   */
  async canSettleAuction(auctionId: string): Promise<boolean> {
    try {
      const factory = this.getFactoryContract();
      return await factory.canSettleAuction(auctionId);
    } catch (error) {
      console.error("Error checking if auction can be settled:", error);
      return false;
    }
  }

  /**
   * Get current price for Dutch auction
   */
  async getCurrentPrice(auctionId: string): Promise<bigint> {
    try {
      const factory = this.getFactoryContract();
      return await factory.getCurrentPrice(auctionId);
    } catch (error) {
      console.error("Error getting current price:", error);
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
export const auctionService = new AuctionService();
