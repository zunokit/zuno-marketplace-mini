/**
 * Mock Auction Service
 * Provides mock auction data for development
 */

import { ENV } from "@/lib/config/env";

export enum AuctionType {
  ENGLISH = 0, // Price increases with bids
  DUTCH = 1, // Price decreases over time
}

export enum AuctionStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  ENDED = 2,
  CANCELLED = 3,
  SETTLED = 4,
}

export interface Auction {
  id: string;
  type: AuctionType;
  status: AuctionStatus;
  nftContract: string;
  tokenId: string;
  seller: string;
  nftName: string;
  nftImage: string;
  collectionName: string;

  // Pricing
  startPrice: string;
  currentPrice: string;
  reservePrice: string;
  priceDropPerHour?: string; // For Dutch auction

  // Timing
  startTime: number;
  endTime: number;

  // Bidding (English auction)
  highestBid?: string;
  highestBidder?: string;
  totalBids: number;

  // Meta
  amount: string; // For ERC1155
}

/**
 * Calculate current Dutch auction price
 */
function calculateDutchPrice(auction: Auction): string {
  if (auction.type !== AuctionType.DUTCH || !auction.priceDropPerHour) {
    return auction.currentPrice;
  }

  const now = Date.now();
  const elapsed = (now - auction.startTime) / (1000 * 60 * 60); // hours
  const priceDrop = parseFloat(auction.priceDropPerHour) * elapsed;
  const currentPrice = Math.max(
    parseFloat(auction.startPrice) - priceDrop,
    parseFloat(auction.reservePrice)
  );

  return currentPrice.toFixed(4);
}

/**
 * Generate mock auctions
 */
export function generateMockAuctions(count: number = 10): Auction[] {
  const auctions: Auction[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const type = i % 2 === 0 ? AuctionType.ENGLISH : AuctionType.DUTCH;
    const isActive = i % 3 !== 0;

    const startTime = now - Math.random() * 24 * 60 * 60 * 1000; // Started within last 24h
    const duration = 24 + Math.random() * 48; // 24-72 hours
    const endTime = startTime + duration * 60 * 60 * 1000;

    const startPrice = (Math.random() * 10 + 1).toFixed(2);
    const reservePrice = (parseFloat(startPrice) * 0.5).toFixed(2);

    const auction: Auction = {
      id: (i + 1).toString(),
      type,
      status: isActive ? AuctionStatus.ACTIVE : AuctionStatus.ENDED,
      nftContract: `0x${Math.random()
        .toString(16)
        .slice(2, 42)
        .padEnd(40, "0")}`,
      tokenId: Math.floor(Math.random() * 10000).toString(),
      seller: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`,
      nftName: `Mock NFT #${Math.floor(Math.random() * 10000)}`,
      nftImage: `https://picsum.photos/seed/auction${i}/400/400`,
      collectionName: ["CryptoPunks", "Bored Apes", "Azuki", "Doodles"][
        Math.floor(Math.random() * 4)
      ],
      startPrice,
      currentPrice: startPrice,
      reservePrice,
      startTime,
      endTime,
      amount: "1",
      totalBids: 0,
    };

    if (type === AuctionType.DUTCH) {
      auction.priceDropPerHour = (parseFloat(startPrice) * 0.1).toFixed(4);
      auction.currentPrice = calculateDutchPrice(auction);
    } else {
      // English auction with some bids
      if (isActive && Math.random() > 0.5) {
        auction.totalBids = Math.floor(Math.random() * 10) + 1;
        auction.highestBid = (
          parseFloat(startPrice) *
          (1 + Math.random())
        ).toFixed(2);
        auction.highestBidder = `0x${Math.random()
          .toString(16)
          .slice(2, 42)
          .padEnd(40, "0")}`;
        auction.currentPrice = auction.highestBid;
      }
    }

    auctions.push(auction);
  }

  return auctions;
}

/**
 * Mock Auction Service Class
 */
export class MockAuctionService {
  private auctions: Auction[] = [];

  constructor() {
    this.auctions = generateMockAuctions(20);
  }

  /**
   * Get all active auctions
   */
  async getActiveAuctions(): Promise<Auction[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return this.auctions
      .filter((a) => a.status === AuctionStatus.ACTIVE)
      .map((auction) => ({
        ...auction,
        currentPrice:
          auction.type === AuctionType.DUTCH
            ? calculateDutchPrice(auction)
            : auction.currentPrice,
      }));
  }

  /**
   * Get user auctions
   */
  async getUserAuctions(userAddress: string): Promise<Auction[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return this.auctions
      .filter((a) => a.seller.toLowerCase() === userAddress.toLowerCase())
      .map((auction) => ({
        ...auction,
        currentPrice:
          auction.type === AuctionType.DUTCH
            ? calculateDutchPrice(auction)
            : auction.currentPrice,
      }));
  }

  /**
   * Get single auction
   */
  async getAuction(auctionId: string): Promise<Auction | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction) return null;

    return {
      ...auction,
      currentPrice:
        auction.type === AuctionType.DUTCH
          ? calculateDutchPrice(auction)
          : auction.currentPrice,
    };
  }

  /**
   * Create English auction
   */
  async createEnglishAuction(data: {
    nftContract: string;
    tokenId: string;
    startPrice: string;
    reservePrice: string;
    duration: number; // hours
  }): Promise<Auction> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const now = Date.now();
    const auction: Auction = {
      id: (this.auctions.length + 1).toString(),
      type: AuctionType.ENGLISH,
      status: AuctionStatus.ACTIVE,
      nftContract: data.nftContract,
      tokenId: data.tokenId,
      seller: "0xCurrentUserAddress", // Would be from wallet
      nftName: `NFT #${data.tokenId}`,
      nftImage: `https://picsum.photos/seed/${data.tokenId}/400/400`,
      collectionName: "My Collection",
      startPrice: data.startPrice,
      currentPrice: data.startPrice,
      reservePrice: data.reservePrice,
      startTime: now,
      endTime: now + data.duration * 60 * 60 * 1000,
      amount: "1",
      totalBids: 0,
    };

    this.auctions.push(auction);
    return auction;
  }

  /**
   * Create Dutch auction
   */
  async createDutchAuction(data: {
    nftContract: string;
    tokenId: string;
    startPrice: string;
    reservePrice: string;
    duration: number; // hours
    priceDropPerHour: string;
  }): Promise<Auction> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const now = Date.now();
    const auction: Auction = {
      id: (this.auctions.length + 1).toString(),
      type: AuctionType.DUTCH,
      status: AuctionStatus.ACTIVE,
      nftContract: data.nftContract,
      tokenId: data.tokenId,
      seller: "0xCurrentUserAddress",
      nftName: `NFT #${data.tokenId}`,
      nftImage: `https://picsum.photos/seed/${data.tokenId}/400/400`,
      collectionName: "My Collection",
      startPrice: data.startPrice,
      currentPrice: data.startPrice,
      reservePrice: data.reservePrice,
      priceDropPerHour: data.priceDropPerHour,
      startTime: now,
      endTime: now + data.duration * 60 * 60 * 1000,
      amount: "1",
      totalBids: 0,
    };

    this.auctions.push(auction);
    return auction;
  }

  /**
   * Place bid on English auction
   */
  async placeBid(auctionId: string, bidAmount: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction || auction.type !== AuctionType.ENGLISH) {
      throw new Error("Invalid auction");
    }

    auction.highestBid = bidAmount;
    auction.currentPrice = bidAmount;
    auction.highestBidder = "0xCurrentUserAddress";
    auction.totalBids += 1;
  }

  /**
   * Buy Dutch auction at current price
   */
  async buyDutchAuction(auctionId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction || auction.type !== AuctionType.DUTCH) {
      throw new Error("Invalid auction");
    }

    auction.status = AuctionStatus.SETTLED;
  }

  /**
   * Cancel auction
   */
  async cancelAuction(auctionId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }

    auction.status = AuctionStatus.CANCELLED;
  }

  /**
   * Settle auction
   */
  async settleAuction(auctionId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }

    auction.status = AuctionStatus.SETTLED;
  }
}

// Singleton instance
let mockAuctionServiceInstance: MockAuctionService | null = null;

export function getMockAuctionService(): MockAuctionService {
  if (!mockAuctionServiceInstance) {
    mockAuctionServiceInstance = new MockAuctionService();
  }
  return mockAuctionServiceInstance;
}
