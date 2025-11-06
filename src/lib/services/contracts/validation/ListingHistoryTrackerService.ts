/**
 * Listing History Tracker Service
 * Analytics and history tracking for marketplace transactions
 * Based on ListingHistoryTracker.sol
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { userHubService } from "../core/UserHubService";
import { getContractABI } from "@/lib/contracts/abi-manager";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum TransactionType {
  LISTING_CREATED = 0,
  LISTING_CANCELLED = 1,
  SALE_COMPLETED = 2,
  OFFER_MADE = 3,
  OFFER_ACCEPTED = 4,
  AUCTION_STARTED = 5,
  BID_PLACED = 6,
  AUCTION_ENDED = 7,
}

export interface TransactionRecord {
  txType: TransactionType;
  collection: string;
  tokenId: bigint;
  seller: string;
  buyer: string;
  price: bigint;
  timestamp: bigint;
  txHash: string;
}

export interface CollectionStats {
  totalListings: bigint;
  totalSales: bigint;
  totalVolume: bigint;
  averagePrice: bigint;
  floorPrice: bigint;
  ceilingPrice: bigint;
  lastSalePrice: bigint;
  lastSaleTimestamp: bigint;
}

export interface UserStats {
  totalListingsCreated: bigint;
  totalSalesMade: bigint;
  totalPurchases: bigint;
  totalVolumeAsSeller: bigint;
  totalVolumeAsBuyer: bigint;
  averageSalePrice: bigint;
  averagePurchasePrice: bigint;
  firstActivityTimestamp: bigint;
  lastActivityTimestamp: bigint;
}

export interface GlobalStats {
  totalTransactions: bigint;
  totalVolume: bigint;
  totalListings: bigint;
  totalSales: bigint;
  averagePrice: bigint;
  uniqueCollections: bigint;
  uniqueUsers: bigint;
}

export interface PricePoint {
  price: bigint;
  timestamp: bigint;
  source: TransactionType;
}

export interface DailyVolume {
  date: bigint;
  listingVolume: bigint;
  saleVolume: bigint;
  offerVolume: bigint;
  auctionVolume: bigint;
  totalVolume: bigint;
  transactionCount: bigint;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ListingHistoryTrackerService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private trackerAddress: string | null = null;
  private historyTrackerAddress: string | null = null;

  /**
   * Get the history tracker contract instance
   */
  async getHistoryTrackerContract(): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const address = this.historyTrackerAddress || this.trackerAddress;
    if (!address) {
      throw new Error("HistoryTracker address not loaded from hub");
    }

    const abi = await getContractABI("ListingHistoryTracker");
    return new ethers.Contract(
      address,
      abi,
      this.signer
    );
  }

  /**
   * Initialize history tracker service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Get tracker address from hub
    // TODO: Add getListingHistoryTracker() to Hub

    logger.success("ListingHistoryTrackerService initialized", null, {
      component: "ListingHistoryTrackerService",
      action: "initialize",
    });
  }

  /**
   * Get tracker contract instance
   */
  private async getTrackerContract(readOnly: boolean = false): Promise<ethers.Contract> {
    const abi = await getContractABI("ListingHistoryTracker");

    if (readOnly && this.provider) {
      if (!this.trackerAddress) {
        throw new Error("ListingHistoryTracker address not configured");
      }
      return new ethers.Contract(
        this.trackerAddress,
        abi,
        this.provider
      );
    }

    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    if (!this.trackerAddress) {
      throw new Error("ListingHistoryTracker address not configured");
    }

    return new ethers.Contract(
      this.trackerAddress,
      abi,
      this.signer
    );
  }

  // ============================================================================
  // TRANSACTION RECORDING (Admin/Operator)
  // ============================================================================

  /**
   * Record a transaction
   */
  async recordTransaction(
    record: TransactionRecord
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getTrackerContract();

    const tx = await contract.recordTransaction(record);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // NFT HISTORY
  // ============================================================================

  /**
   * Get transaction history for a specific NFT
   */
  async getNFTHistory(
    collection: string,
    tokenId: bigint,
    limit: number = 50
  ): Promise<TransactionRecord[]> {
    const contract = await this.getTrackerContract(true);

    const records = await contract.getNFTHistory(collection, tokenId, limit);

    return records.map((r: any) => ({
      txType: r.txType,
      collection: r.collection,
      tokenId: r.tokenId,
      seller: r.seller,
      buyer: r.buyer,
      price: r.price,
      timestamp: r.timestamp,
      txHash: r.txHash,
    }));
  }

  /**
   * Get last sale price for an NFT
   */
  async getLastSalePrice(collection: string, tokenId: bigint): Promise<bigint> {
    const history = await this.getNFTHistory(collection, tokenId, 1);

    if (history.length === 0) return BigInt(0);

    const lastSale = history.find(
      (h) => h.txType === TransactionType.SALE_COMPLETED
    );

    return lastSale ? lastSale.price : BigInt(0);
  }

  // ============================================================================
  // COLLECTION ANALYTICS
  // ============================================================================

  /**
   * Get collection statistics
   */
  async getCollectionStats(collection: string): Promise<CollectionStats> {
    const contract = await this.getTrackerContract(true);
    const stats = await contract.collectionStats(collection);

    return {
      totalListings: stats.totalListings,
      totalSales: stats.totalSales,
      totalVolume: stats.totalVolume,
      averagePrice: stats.averagePrice,
      floorPrice: stats.floorPrice,
      ceilingPrice: stats.ceilingPrice,
      lastSalePrice: stats.lastSalePrice,
      lastSaleTimestamp: stats.lastSaleTimestamp,
    };
  }

  /**
   * Get collection price history
   */
  async getCollectionPriceHistory(
    collection: string,
    limit: number = 100
  ): Promise<PricePoint[]> {
    const contract = await this.getTrackerContract(true);

    const points = await contract.getCollectionPriceHistory(collection, limit);

    return points.map((p: any) => ({
      price: p.price,
      timestamp: p.timestamp,
      source: p.source,
    }));
  }

  /**
   * Get collection floor price
   */
  async getFloorPrice(collection: string): Promise<bigint> {
    const stats = await this.getCollectionStats(collection);
    return stats.floorPrice;
  }

  /**
   * Get collection ceiling price
   */
  async getCeilingPrice(collection: string): Promise<bigint> {
    const stats = await this.getCollectionStats(collection);
    return stats.ceilingPrice;
  }

  /**
   * Get collection average price
   */
  async getAveragePrice(collection: string): Promise<bigint> {
    const stats = await this.getCollectionStats(collection);
    return stats.averagePrice;
  }

  /**
   * Get collection total volume
   */
  async getCollectionVolume(collection: string): Promise<bigint> {
    const stats = await this.getCollectionStats(collection);
    return stats.totalVolume;
  }

  // ============================================================================
  // USER ANALYTICS
  // ============================================================================

  /**
   * Get user statistics
   */
  async getUserStats(user: string): Promise<UserStats> {
    const contract = await this.getTrackerContract(true);
    const stats = await contract.userStats(user);

    return {
      totalListingsCreated: stats.totalListingsCreated,
      totalSalesMade: stats.totalSalesMade,
      totalPurchases: stats.totalPurchases,
      totalVolumeAsSeller: stats.totalVolumeAsSeller,
      totalVolumeAsBuyer: stats.totalVolumeAsBuyer,
      averageSalePrice: stats.averageSalePrice,
      averagePurchasePrice: stats.averagePurchasePrice,
      firstActivityTimestamp: stats.firstActivityTimestamp,
      lastActivityTimestamp: stats.lastActivityTimestamp,
    };
  }

  /**
   * Get user trading volume
   */
  async getUserVolume(user: string): Promise<{
    asSeller: bigint;
    asBuyer: bigint;
    total: bigint;
  }> {
    const stats = await this.getUserStats(user);

    return {
      asSeller: stats.totalVolumeAsSeller,
      asBuyer: stats.totalVolumeAsBuyer,
      total: stats.totalVolumeAsSeller + stats.totalVolumeAsBuyer,
    };
  }

  /**
   * Get user transaction count
   */
  async getUserTransactionCount(user: string): Promise<{
    listings: bigint;
    sales: bigint;
    purchases: bigint;
    total: bigint;
  }> {
    const stats = await this.getUserStats(user);

    return {
      listings: stats.totalListingsCreated,
      sales: stats.totalSalesMade,
      purchases: stats.totalPurchases,
      total:
        stats.totalListingsCreated +
        stats.totalSalesMade +
        stats.totalPurchases,
    };
  }

  // ============================================================================
  // GLOBAL ANALYTICS
  // ============================================================================

  /**
   * Get global marketplace statistics
   */
  async getGlobalStats(): Promise<GlobalStats> {
    const contract = await this.getTrackerContract(true);
    const stats = await contract.globalStats();

    return {
      totalTransactions: stats.totalTransactions,
      totalVolume: stats.totalVolume,
      totalListings: stats.totalListings,
      totalSales: stats.totalSales,
      averagePrice: stats.averagePrice,
      uniqueCollections: stats.uniqueCollections,
      uniqueUsers: stats.uniqueUsers,
    };
  }

  /**
   * Get daily volume
   */
  async getDailyVolume(date: bigint): Promise<DailyVolume> {
    const contract = await this.getTrackerContract(true);
    const volume = await contract.dailyVolumes(date);

    return {
      date: volume.date,
      listingVolume: volume.listingVolume,
      saleVolume: volume.saleVolume,
      offerVolume: volume.offerVolume,
      auctionVolume: volume.auctionVolume,
      totalVolume: volume.totalVolume,
      transactionCount: volume.transactionCount,
    };
  }

  /**
   * Get today's volume
   */
  async getTodayVolume(): Promise<DailyVolume> {
    const today = BigInt(Math.floor(Date.now() / 86400000) * 86400);
    return this.getDailyVolume(today);
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get transaction type name
   */
  static getTransactionTypeName(type: TransactionType): string {
    const names: Record<TransactionType, string> = {
      [TransactionType.LISTING_CREATED]: "Listing Created",
      [TransactionType.LISTING_CANCELLED]: "Listing Cancelled",
      [TransactionType.SALE_COMPLETED]: "Sale Completed",
      [TransactionType.OFFER_MADE]: "Offer Made",
      [TransactionType.OFFER_ACCEPTED]: "Offer Accepted",
      [TransactionType.AUCTION_STARTED]: "Auction Started",
      [TransactionType.BID_PLACED]: "Bid Placed",
      [TransactionType.AUCTION_ENDED]: "Auction Ended",
    };

    return names[type] || "Unknown";
  }

  /**
   * Format price for display
   */
  static formatPrice(price: bigint, decimals: number = 18): string {
    return ethers.formatUnits(price, decimals);
  }

  /**
   * Format volume for display
   */
  static formatVolume(volume: bigint, decimals: number = 18): string {
    const formatted = ethers.formatUnits(volume, decimals);
    const num = parseFloat(formatted);

    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(4);
  }

  /**
   * Calculate price change percentage
   */
  static calculatePriceChange(oldPrice: bigint, newPrice: bigint): number {
    if (oldPrice === BigInt(0)) return 0;

    const change = Number(newPrice - oldPrice);
    const percentage = (change / Number(oldPrice)) * 100;

    return percentage;
  }

  /**
   * Get trending collections (by volume)
   */
  async getTrendingCollections(
    collections: string[],
    limit: number = 10
  ): Promise<Array<{ collection: string; volume: bigint }>> {
    const volumeData = await Promise.all(
      collections.map(async (collection) => ({
        collection,
        volume: await this.getCollectionVolume(collection),
      }))
    );

    return volumeData
      .sort((a, b) => (b.volume > a.volume ? 1 : -1))
      .slice(0, limit);
  }

  /**
   * Get active traders
   */
  async getActiveTraders(
    users: string[],
    limit: number = 10
  ): Promise<Array<{ user: string; volume: bigint }>> {
    const userData = await Promise.all(
      users.map(async (user) => {
        const volume = await this.getUserVolume(user);
        return { user, volume: volume.total };
      })
    );

    return userData
      .sort((a, b) => (b.volume > a.volume ? 1 : -1))
      .slice(0, limit);
  }

  /**
   * Format timestamp
   */
  static formatTimestamp(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  }

  /**
   * Get time ago
   */
  static getTimeAgo(timestamp: bigint): string {
    const now = Math.floor(Date.now() / 1000);
    const seconds = now - Number(timestamp);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Generate price chart data
   */
  static generateChartData(priceHistory: PricePoint[]): Array<{
    timestamp: number;
    price: number;
  }> {
    return priceHistory.map((p) => ({
      timestamp: Number(p.timestamp) * 1000,
      price: parseFloat(ethers.formatEther(p.price)),
    }));
  }

  /**
   * Get top collections by trading volume
   */
  async getTopCollectionsByVolume(limit: number = 4): Promise<string[]> {
    try {
      if (!this.provider || !this.trackerAddress) {
        throw new Error("Service not initialized");
      }

      const abi = await getContractABI("ListingHistoryTracker");
      const contract = new ethers.Contract(
        this.trackerAddress,
        abi,
        this.provider
      );

      // Get all collections and their volumes
      const collections = await contract.getTopCollectionsByVolume(limit);
      return collections;
    } catch (error) {
      logger.error("Error getting top collections by volume", error, {
        component: "ListingHistoryTrackerService",
        action: "getTopCollectionsByVolume",
      });

      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Calculate volume statistics
   */
  static calculateVolumeStats(volumes: DailyVolume[]): {
    total: bigint;
    average: bigint;
    peak: bigint;
    peakDate: bigint;
  } {
    if (volumes.length === 0) {
      return {
        total: BigInt(0),
        average: BigInt(0),
        peak: BigInt(0),
        peakDate: BigInt(0),
      };
    }

    const total = volumes.reduce((sum, v) => sum + v.totalVolume, BigInt(0));
    const average = total / BigInt(volumes.length);
    const peak = volumes.reduce(
      (max, v) => (v.totalVolume > max.totalVolume ? v : max),
      volumes[0]
    );

    return {
      total,
      average,
      peak: peak.totalVolume,
      peakDate: peak.date,
    };
  }
}

// Export singleton instance
export const listingHistoryTrackerService = new ListingHistoryTrackerService();
