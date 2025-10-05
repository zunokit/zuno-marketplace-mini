/**
 * Auction Service
 * Handles auction creation, bidding, and settlement operations
 * Now uses MarketplaceHub for address discovery
 */

import { ethers } from "ethers";
import { marketplaceHubService } from "./MarketplaceHubService";
import {
  EnglishAuction_ABI,
  DutchAuction_ABI,
} from "@/lib/contracts/abis";

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
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize auction service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    console.log("✅ AuctionService initialized");
  }

  /**
   * Get English auction contract
   */
  private getEnglishAuctionContract(): ethers.Contract {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const address = marketplaceHubService.getEnglishAuction();
    return new ethers.Contract(
      address,
      EnglishAuction_ABI,
      this.signer
    );
  }

  /**
   * Get Dutch auction contract
   */
  private getDutchAuctionContract(): ethers.Contract {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const address = marketplaceHubService.getDutchAuction();
    return new ethers.Contract(
      address,
      DutchAuction_ABI,
      this.signer
    );
  }

  /**
   * Create an English auction
   */
  async createEnglishAuction(
    params: EnglishAuctionParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const auction = this.getEnglishAuctionContract();
      const durationInSeconds = params.duration * 60 * 60;

      const tx = await auction.createAuction(
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
      const auction = this.getDutchAuctionContract();
      const durationInSeconds = params.duration * 60 * 60;

      const tx = await auction.createAuction(
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
   * Place a bid on an English auction
   */
  async placeBid(
    auctionId: string,
    bidAmount: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const auction = this.getEnglishAuctionContract();

      const tx = await auction.placeBid(auctionId, {
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
  async buyFromDutchAuction(
    auctionId: string,
    price: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const auction = this.getDutchAuctionContract();

      const tx = await auction.buy(auctionId, {
        value: ethers.parseEther(price),
      });

      return tx;
    } catch (error) {
      console.error("Error buying from Dutch auction:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Cancel an English auction
   */
  async cancelEnglishAuction(
    auctionId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const auction = this.getEnglishAuctionContract();
      const tx = await auction.cancelAuction(auctionId);
      return tx;
    } catch (error) {
      console.error("Error canceling English auction:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Cancel a Dutch auction
   */
  async cancelDutchAuction(
    auctionId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const auction = this.getDutchAuctionContract();
      const tx = await auction.cancelAuction(auctionId);
      return tx;
    } catch (error) {
      console.error("Error canceling Dutch auction:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * End an English auction
   */
  async endEnglishAuction(
    auctionId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const auction = this.getEnglishAuctionContract();
      const tx = await auction.endAuction(auctionId);
      return tx;
    } catch (error) {
      console.error("Error ending English auction:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get English auction information
   */
  async getEnglishAuctionInfo(auctionId: string): Promise<any> {
    try {
      const auction = this.getEnglishAuctionContract();
      const auctionInfo = await auction.getAuction(auctionId);
      return auctionInfo;
    } catch (error) {
      console.error("Error getting English auction info:", error);
      throw error;
    }
  }

  /**
   * Get Dutch auction information
   */
  async getDutchAuctionInfo(auctionId: string): Promise<any> {
    try {
      const auction = this.getDutchAuctionContract();
      const auctionInfo = await auction.getAuction(auctionId);
      return auctionInfo;
    } catch (error) {
      console.error("Error getting Dutch auction info:", error);
      throw error;
    }
  }

  /**
   * Get current price for Dutch auction
   */
  async getCurrentDutchPrice(auctionId: string): Promise<bigint> {
    try {
      const auction = this.getDutchAuctionContract();
      return await auction.getCurrentPrice(auctionId);
    } catch (error) {
      console.error("Error getting current Dutch price:", error);
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
