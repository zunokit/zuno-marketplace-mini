/**
 * Auction Service
 * Handles auction creation, bidding, and settlement operations
 * Now uses UserHub for address discovery
 */

import { ethers } from "ethers";
import { userHubService } from "../core/UserHubService";
import { logger } from "@/lib/utils/logger";
import { getContractABI } from "@/lib/contracts/abi-manager";
import type { RawContractBid } from "@/types/contract-types";

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

    logger.success("AuctionService initialized", null, {
      component: "AuctionService",
      action: "initialize",
    });
  }

  /**
   * Get English auction contract
   */
  async getEnglishAuctionContract(): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const address = userHubService.getEnglishAuction();
    const abi = await getContractABI("EnglishAuction");
    return new ethers.Contract(address, abi, this.signer);
  }

  /**
   * Get Dutch auction contract
   */
  async getDutchAuctionContract(): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const address = userHubService.getDutchAuction();
    const abi = await getContractABI("DutchAuction");
    return new ethers.Contract(address, abi, this.signer);
  }

  /**
   * Create an English auction
   */
  async createEnglishAuction(
    params: EnglishAuctionParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const auction = await this.getEnglishAuctionContract();
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
      logger.error("Error creating English auction", error, {
        component: "AuctionService",
        action: "createEnglishAuction",
      });
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
      const auction = await this.getDutchAuctionContract();
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
      logger.error("Error creating Dutch auction", error, {
        component: "AuctionService",
        action: "createDutchAuction",
      });
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
      const auction = await this.getEnglishAuctionContract();

      const tx = await auction.placeBid(auctionId, {
        value: ethers.parseEther(bidAmount),
      });

      return tx;
    } catch (error) {
      logger.error("Error placing bid", error, {
        component: "AuctionService",
        action: "placeBid",
      });
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
      const auction = await this.getDutchAuctionContract();

      const tx = await auction.buy(auctionId, {
        value: ethers.parseEther(price),
      });

      return tx;
    } catch (error) {
      logger.error("Error buying from Dutch auction", error, {
        component: "AuctionService",
        action: "buyFromDutchAuction",
      });
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
      const auction = await this.getEnglishAuctionContract();
      const tx = await auction.cancelAuction(auctionId);
      return tx;
    } catch (error) {
      logger.error("Error canceling English auction", error, {
        component: "AuctionService",
        action: "cancelEnglishAuction",
      });
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
      const auction = await this.getDutchAuctionContract();
      const tx = await auction.cancelAuction(auctionId);
      return tx;
    } catch (error) {
      logger.error("Error canceling Dutch auction", error, {
        component: "AuctionService",
        action: "cancelDutchAuction",
      });
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
      const auction = await this.getEnglishAuctionContract();
      const tx = await auction.endAuction(auctionId);
      return tx;
    } catch (error) {
      logger.error("Error ending English auction", error, {
        component: "AuctionService",
        action: "endEnglishAuction",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get English auction information
   */
  async getEnglishAuctionInfo(auctionId: string): Promise<any> {
    try {
      const auction = await this.getEnglishAuctionContract();
      const auctionInfo = await auction.getAuction(auctionId);
      return auctionInfo;
    } catch (error) {
      logger.error("Error getting English auction info", error, {
        component: "AuctionService",
        action: "getEnglishAuctionInfo",
      });
      throw error;
    }
  }

  /**
   * Get Dutch auction information
   */
  async getDutchAuctionInfo(auctionId: string): Promise<any> {
    try {
      const auction = await this.getDutchAuctionContract();
      const auctionInfo = await auction.getAuction(auctionId);
      return auctionInfo;
    } catch (error) {
      logger.error("Error getting Dutch auction info", error, {
        component: "AuctionService",
        action: "getDutchAuctionInfo",
      });
      throw error;
    }
  }

  /**
   * Get current price for Dutch auction
   */
  async getCurrentDutchPrice(auctionId: string): Promise<bigint> {
    try {
      const auction = await this.getDutchAuctionContract();
      return await auction.getCurrentPrice(auctionId);
    } catch (error) {
      logger.error("Error getting current Dutch price", error, {
        component: "AuctionService",
        action: "getCurrentDutchPrice",
      });
      throw error;
    }
  }

  /**
   * Withdraw bid from an auction (for non-winners)
   */
  async withdrawBid(auctionId: string): Promise<void> {
    try {
      const auction = await this.getEnglishAuctionContract();
      const tx = await auction.withdrawBid(auctionId);
      await tx.wait();

      logger.success("Bid withdrawn successfully", { auctionId }, {
        component: "AuctionService",
        action: "withdrawBid",
      });
    } catch (error) {
      logger.error("Failed to withdraw bid", error, {
        component: "AuctionService",
        action: "withdrawBid",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get bid history for an auction
   */
  async getBidHistory(auctionId: string): Promise<Array<{
    bidder: string;
    amount: bigint;
    timestamp: bigint;
  }>> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const abi = await getContractABI("EnglishAuction");
      const auction = new ethers.Contract(
        userHubService.getEnglishAuction(),
        abi,
        this.provider
      );

      const history = await auction.getBidHistory(auctionId);

      return history.map((bid: RawContractBid) => ({
        bidder: bid.bidder,
        amount: bid.amount,
        timestamp: bid.timestamp,
      }));
    } catch (error) {
      logger.error("Failed to get bid history", error, {
        component: "AuctionService",
        action: "getBidHistory",
      });
      return [];
    }
  }

  /**
   * Check if user can bid on auction
   */
  async canBid(auctionId: string, bidAmount: string): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const abi = await getContractABI("EnglishAuction");
      const auction = new ethers.Contract(
        userHubService.getEnglishAuction(),
        abi,
        this.provider
      );

      return await auction.canBid(auctionId, ethers.parseEther(bidAmount));
    } catch (error) {
      logger.error("Failed to check if can bid", error, {
        component: "AuctionService",
        action: "canBid",
      });
      return false;
    }
  }

  /**
   * Get time remaining for auction
   */
  async getTimeRemaining(auctionId: string): Promise<bigint> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const abi = await getContractABI("EnglishAuction");
      const auction = new ethers.Contract(
        userHubService.getEnglishAuction(),
        abi,
        this.provider
      );

      return await auction.getTimeRemaining(auctionId);
    } catch (error) {
      logger.error("Failed to get time remaining", error, {
        component: "AuctionService",
        action: "getTimeRemaining",
      });
      return 0n;
    }
  }

  /**
   * Get price at specific time for Dutch auction
   */
  async getPriceAt(auctionId: string, timestamp: bigint): Promise<bigint> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const abi = await getContractABI("DutchAuction");
      const auction = new ethers.Contract(
        userHubService.getDutchAuction(),
        abi,
        this.provider
      );

      return await auction.getPriceAt(auctionId, timestamp);
    } catch (error) {
      logger.error("Failed to get price at timestamp", error, {
        component: "AuctionService",
        action: "getPriceAt",
      });
      return 0n;
    }
  }

  /**
   * Calculate price decay for Dutch auction
   */
  async calculatePriceDecay(auctionId: string): Promise<{
    currentPrice: bigint;
    priceDropPerHour: bigint;
    timeElapsed: bigint;
  }> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const abi = await getContractABI("DutchAuction");
      const auction = new ethers.Contract(
        userHubService.getDutchAuction(),
        abi,
        this.provider
      );

      const decay = await auction.calculatePriceDecay(auctionId);

      return {
        currentPrice: decay.currentPrice,
        priceDropPerHour: decay.priceDropPerHour,
        timeElapsed: decay.timeElapsed,
      };
    } catch (error) {
      logger.error("Failed to calculate price decay", error, {
        component: "AuctionService",
        action: "calculatePriceDecay",
      });
      return {
        currentPrice: 0n,
        priceDropPerHour: 0n,
        timeElapsed: 0n,
      };
    }
  }

  /**
   * Check if auction is active
   */
  async isAuctionActive(auctionId: string, auctionType: "English" | "Dutch" = "English"): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const contractAddress = auctionType === "English"
        ? userHubService.getEnglishAuction()
        : userHubService.getDutchAuction();

      const abiName = auctionType === "English"
        ? "EnglishAuction"
        : "DutchAuction";
      const abi = await getContractABI(abiName);

      const auction = new ethers.Contract(contractAddress, abi, this.provider);

      return await auction.isAuctionActive(auctionId);
    } catch (error) {
      logger.error("Failed to check if auction is active", error, {
        component: "AuctionService",
        action: "isAuctionActive",
      });
      return false;
    }
  }

  /**
   * Get highest bid for English auction
   */
  async getHighestBid(auctionId: string): Promise<{
    bidder: string;
    amount: bigint;
  }> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const abi = await getContractABI("EnglishAuction");
      const auction = new ethers.Contract(
        userHubService.getEnglishAuction(),
        abi,
        this.provider
      );

      const bid = await auction.getHighestBid(auctionId);

      return {
        bidder: bid.bidder,
        amount: bid.amount,
      };
    } catch (error) {
      logger.error("Failed to get highest bid", error, {
        component: "AuctionService",
        action: "getHighestBid",
      });
      return {
        bidder: ethers.ZeroAddress,
        amount: 0n,
      };
    }
  }

  /**
   * Format transaction error for user-friendly messages
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
export const auctionService = new AuctionService();
