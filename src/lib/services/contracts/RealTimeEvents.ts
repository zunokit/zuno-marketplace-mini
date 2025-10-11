/**
 * Real-time Events Service
 * Handles blockchain event subscriptions for listings, offers, and auctions
 * Provides real-time updates to the UI
 */

import { ethers } from "ethers";
import { marketplaceHubService } from "./MarketplaceHubService";
import {
  ERC721NFTExchange_ABI,
  ERC1155NFTExchange_ABI,
  EnglishAuction_ABI,
  DutchAuction_ABI,
  BundleManager_ABI,
  OfferManager_ABI,
} from "@/lib/contracts/abis";

export interface EventSubscription {
  id: string;
  contract: ethers.Contract;
  eventName: string;
  filter: any;
  handler: (event: any) => void;
}

export interface EventHandler {
  onListingCreated?: (event: any) => void;
  onListingPurchased?: (event: any) => void;
  onListingCancelled?: (event: any) => void;
  onOfferCreated?: (event: any) => void;
  onOfferAccepted?: (event: any) => void;
  onOfferCancelled?: (event: any) => void;
  onAuctionCreated?: (event: any) => void;
  onBidPlaced?: (event: any) => void;
  onAuctionEnded?: (event: any) => void;
  onBundleCreated?: (event: any) => void;
  onBundlePurchased?: (event: any) => void;
  onBundleCancelled?: (event: any) => void;
}

export class RealTimeEventsService {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private isInitialized = false;
  private provider: ethers.Provider | null = null;

  constructor() {}

  /**
   * Initialize the real-time events service
   */
  async initialize(provider: ethers.Provider): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.provider = provider;
      this.isInitialized = true;
      console.log("✅ RealTimeEventsService initialized");
    } catch (error) {
      console.error("❌ Failed to initialize RealTimeEventsService:", error);
      throw error;
    }
  }

  /**
   * Subscribe to listing events (ERC721)
   */
  async subscribeToListingEvents(handlers: EventHandler): Promise<void> {
    try {
      if (!this.provider) throw new Error("Provider not initialized");

      const exchangeAddress = marketplaceHubService.getERC721Exchange();
      const exchange = new ethers.Contract(
        exchangeAddress,
        ERC721NFTExchange_ABI,
        this.provider
      );

      // ListingCreated event
      if (handlers.onListingCreated) {
        exchange.on("NFTListed", (...args) => {
          console.log("📝 NFTListed event:", args);
          handlers.onListingCreated!(args);
        });

        this.subscriptions.set("NFTListed", {
          id: "NFTListed",
          contract: exchange,
          eventName: "NFTListed",
          filter: null,
          handler: handlers.onListingCreated,
        });
      }

      // ListingPurchased event
      if (handlers.onListingPurchased) {
        exchange.on("NFTSold", (...args) => {
          console.log("💰 NFTSold event:", args);
          handlers.onListingPurchased!(args);
        });

        this.subscriptions.set("NFTSold", {
          id: "NFTSold",
          contract: exchange,
          eventName: "NFTSold",
          filter: null,
          handler: handlers.onListingPurchased,
        });
      }

      // ListingCancelled event
      if (handlers.onListingCancelled) {
        exchange.on("ListingCancelled", (...args) => {
          console.log("❌ ListingCancelled event:", args);
          handlers.onListingCancelled!(args);
        });

        this.subscriptions.set("ListingCancelled", {
          id: "ListingCancelled",
          contract: exchange,
          eventName: "ListingCancelled",
          filter: null,
          handler: handlers.onListingCancelled,
        });
      }
    } catch (error) {
      console.error("Error subscribing to listing events:", error);
      throw error;
    }
  }

  /**
   * Subscribe to offer events
   */
  async subscribeToOfferEvents(handlers: EventHandler): Promise<void> {
    try {
      if (!this.provider) throw new Error("Provider not initialized");

      const offerAddress = marketplaceHubService.getOfferManager();
      const offerManager = new ethers.Contract(
        offerAddress,
        OfferManager_ABI,
        this.provider
      );

      // OfferCreated event
      if (handlers.onOfferCreated) {
        offerManager.on("OfferMade", (...args) => {
          console.log("🎯 OfferMade event:", args);
          handlers.onOfferCreated!(args);
        });

        this.subscriptions.set("OfferMade", {
          id: "OfferMade",
          contract: offerManager,
          eventName: "OfferMade",
          filter: null,
          handler: handlers.onOfferCreated,
        });
      }

      // OfferAccepted event
      if (handlers.onOfferAccepted) {
        offerManager.on("OfferAccepted", (...args) => {
          console.log("✅ OfferAccepted event:", args);
          handlers.onOfferAccepted!(args);
        });

        this.subscriptions.set("OfferAccepted", {
          id: "OfferAccepted",
          contract: offerManager,
          eventName: "OfferAccepted",
          filter: null,
          handler: handlers.onOfferAccepted,
        });
      }

      // OfferCancelled event
      if (handlers.onOfferCancelled) {
        offerManager.on("OfferCancelled", (...args) => {
          console.log("❌ OfferCancelled event:", args);
          handlers.onOfferCancelled!(args);
        });

        this.subscriptions.set("OfferCancelled", {
          id: "OfferCancelled",
          contract: offerManager,
          eventName: "OfferCancelled",
          filter: null,
          handler: handlers.onOfferCancelled,
        });
      }
    } catch (error) {
      console.error("Error subscribing to offer events:", error);
      throw error;
    }
  }

  /**
   * Subscribe to auction events (English Auction)
   */
  async subscribeToAuctionEvents(handlers: EventHandler): Promise<void> {
    try {
      if (!this.provider) throw new Error("Provider not initialized");

      const englishAuctionAddress = marketplaceHubService.getEnglishAuction();
      const englishAuction = new ethers.Contract(
        englishAuctionAddress,
        EnglishAuction_ABI,
        this.provider
      );

      // AuctionCreated event
      if (handlers.onAuctionCreated) {
        englishAuction.on("AuctionCreated", (...args) => {
          console.log("🏆 AuctionCreated event:", args);
          handlers.onAuctionCreated!(args);
        });

        this.subscriptions.set("AuctionCreated", {
          id: "AuctionCreated",
          contract: englishAuction,
          eventName: "AuctionCreated",
          filter: null,
          handler: handlers.onAuctionCreated,
        });
      }

      // BidPlaced event
      if (handlers.onBidPlaced) {
        englishAuction.on("BidPlaced", (...args) => {
          console.log("💰 BidPlaced event:", args);
          handlers.onBidPlaced!(args);
        });

        this.subscriptions.set("BidPlaced", {
          id: "BidPlaced",
          contract: englishAuction,
          eventName: "BidPlaced",
          filter: null,
          handler: handlers.onBidPlaced,
        });
      }

      // AuctionEnded event
      if (handlers.onAuctionEnded) {
        englishAuction.on("AuctionEnded", (...args) => {
          console.log("🏁 AuctionEnded event:", args);
          handlers.onAuctionEnded!(args);
        });

        this.subscriptions.set("AuctionEnded", {
          id: "AuctionEnded",
          contract: englishAuction,
          eventName: "AuctionEnded",
          filter: null,
          handler: handlers.onAuctionEnded,
        });
      }
    } catch (error) {
      console.error("Error subscribing to auction events:", error);
      throw error;
    }
  }

  /**
   * Subscribe to bundle events
   */
  async subscribeToBundleEvents(handlers: EventHandler): Promise<void> {
    try {
      if (!this.provider) throw new Error("Provider not initialized");

      const bundleAddress = marketplaceHubService.getBundleManager();
      const bundleManager = new ethers.Contract(
        bundleAddress,
        BundleManager_ABI,
        this.provider
      );

      // BundleCreated event
      if (handlers.onBundleCreated) {
        bundleManager.on("BundleCreated", (...args) => {
          console.log("📦 BundleCreated event:", args);
          handlers.onBundleCreated!(args);
        });

        this.subscriptions.set("BundleCreated", {
          id: "BundleCreated",
          contract: bundleManager,
          eventName: "BundleCreated",
          filter: null,
          handler: handlers.onBundleCreated,
        });
      }

      // BundlePurchased event
      if (handlers.onBundlePurchased) {
        bundleManager.on("BundlePurchased", (...args) => {
          console.log("💰 BundlePurchased event:", args);
          handlers.onBundlePurchased!(args);
        });

        this.subscriptions.set("BundlePurchased", {
          id: "BundlePurchased",
          contract: bundleManager,
          eventName: "BundlePurchased",
          filter: null,
          handler: handlers.onBundlePurchased,
        });
      }

      // BundleCancelled event
      if (handlers.onBundleCancelled) {
        bundleManager.on("BundleCancelled", (...args) => {
          console.log("❌ BundleCancelled event:", args);
          handlers.onBundleCancelled!(args);
        });

        this.subscriptions.set("BundleCancelled", {
          id: "BundleCancelled",
          contract: bundleManager,
          eventName: "BundleCancelled",
          filter: null,
          handler: handlers.onBundleCancelled,
        });
      }
    } catch (error) {
      console.error("Error subscribing to bundle events:", error);
      throw error;
    }
  }

  /**
   * Subscribe to all events
   */
  async subscribeToAllEvents(handlers: EventHandler): Promise<void> {
    try {
      await Promise.all([
        this.subscribeToListingEvents(handlers),
        this.subscribeToOfferEvents(handlers),
        this.subscribeToAuctionEvents(handlers),
        this.subscribeToBundleEvents(handlers),
      ]);

      console.log("✅ Subscribed to all events");
    } catch (error) {
      console.error("Error subscribing to all events:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a specific event
   */
  unsubscribeFromEvent(eventName: string): void {
    const subscription = this.subscriptions.get(eventName);
    if (subscription) {
      subscription.contract.removeAllListeners(eventName);
      this.subscriptions.delete(eventName);
      console.log(`🔇 Unsubscribed from ${eventName}`);
    }
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribeAll(): void {
    for (const [eventName, subscription] of this.subscriptions) {
      subscription.contract.removeAllListeners(eventName);
    }
    this.subscriptions.clear();
    console.log("🔇 Unsubscribed from all events");
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const realTimeEventsService = new RealTimeEventsService();
