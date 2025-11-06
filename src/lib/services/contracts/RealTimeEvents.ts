/**
 * Real-time Events Service
 * Handles blockchain event subscriptions for listings, offers, and auctions
 * Provides real-time updates to the UI
 */

import { ethers } from "ethers";
import { userHubService } from "./UserHubService";
import { logger } from "@/lib/utils/logger";
import { getContractABI } from "@/lib/contracts/abi-manager";

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
      logger.success("RealTimeEventsService initialized", null, {
        component: "RealTimeEventsService",
        action: "initialize",
      });
    } catch (error) {
      logger.error("Failed to initialize RealTimeEventsService", error, {
        component: "RealTimeEventsService",
        action: "initialize",
      });
      throw error;
    }
  }

  /**
   * Subscribe to listing events (ERC721)
   */
  async subscribeToListingEvents(handlers: EventHandler): Promise<void> {
    try {
      if (!this.provider) throw new Error("Provider not initialized");

      const addresses = await userHubService.getAddresses();
      const exchangeAddress = addresses.erc721Exchange;
      const abi = await getContractABI("ERC721NFTExchange");
      const exchange = new ethers.Contract(
        exchangeAddress,
        abi,
        this.provider
      );

      // ListingCreated event
      if (handlers.onListingCreated) {
        exchange.on("NFTListed", (...args) => {
          logger.info("NFTListed event", args, {
            component: "RealTimeEventsService",
            action: "handleNFTListed",
          });
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
          logger.info("NFTSold event", args, {
            component: "RealTimeEventsService",
            action: "handleNFTSold",
          });
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
          logger.info("ListingCancelled event", args, {
            component: "RealTimeEventsService",
            action: "handleListingCancelled",
          });
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
      logger.error("Error subscribing to listing events", error, {
        component: "RealTimeEventsService",
        action: "subscribeToListingEvents",
      });
      throw error;
    }
  }

  /**
   * Subscribe to offer events
   */
  async subscribeToOfferEvents(handlers: EventHandler): Promise<void> {
    try {
      if (!this.provider) throw new Error("Provider not initialized");

      const offerAddresses = await userHubService.getAddresses();
      const offerAddress = offerAddresses.offerManager;
      const abi = await getContractABI("OfferManager");
      const offerManager = new ethers.Contract(
        offerAddress,
        abi,
        this.provider
      );

      // OfferCreated event
      if (handlers.onOfferCreated) {
        offerManager.on("OfferMade", (...args) => {
          logger.info("OfferMade event", args, {
            component: "RealTimeEventsService",
            action: "handleOfferMade",
          });
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
          logger.info("OfferAccepted event", args, {
            component: "RealTimeEventsService",
            action: "handleOfferAccepted",
          });
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
          logger.info("OfferCancelled event", args, {
            component: "RealTimeEventsService",
            action: "handleOfferCancelled",
          });
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
      logger.error("Error subscribing to offer events", error, {
        component: "RealTimeEventsService",
        action: "subscribeToOfferEvents",
      });
      throw error;
    }
  }

  /**
   * Subscribe to auction events (English Auction)
   */
  async subscribeToAuctionEvents(handlers: EventHandler): Promise<void> {
    try {
      if (!this.provider) throw new Error("Provider not initialized");

      const auctionAddresses = await userHubService.getAddresses();
      const englishAuctionAddress = auctionAddresses.englishAuction;
      const abi = await getContractABI("EnglishAuction");
      const englishAuction = new ethers.Contract(
        englishAuctionAddress,
        abi,
        this.provider
      );

      // AuctionCreated event
      if (handlers.onAuctionCreated) {
        englishAuction.on("AuctionCreated", (...args) => {
          logger.info("AuctionCreated event", args, {
            component: "RealTimeEventsService",
            action: "handleAuctionCreated",
          });
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
          logger.info("BidPlaced event", args, {
            component: "RealTimeEventsService",
            action: "handleBidPlaced",
          });
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
          logger.info("AuctionEnded event", args, {
            component: "RealTimeEventsService",
            action: "handleAuctionEnded",
          });
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
      logger.error("Error subscribing to auction events", error, {
        component: "RealTimeEventsService",
        action: "subscribeToAuctionEvents",
      });
      throw error;
    }
  }

  /**
   * Subscribe to bundle events
   */
  async subscribeToBundleEvents(handlers: EventHandler): Promise<void> {
    try {
      if (!this.provider) throw new Error("Provider not initialized");

      const bundleAddresses = await userHubService.getAddresses();
      const bundleAddress = bundleAddresses.bundleManager;
      const abi = await getContractABI("BundleManager");
      const bundleManager = new ethers.Contract(
        bundleAddress,
        abi,
        this.provider
      );

      // BundleCreated event
      if (handlers.onBundleCreated) {
        bundleManager.on("BundleCreated", (...args) => {
          logger.info("BundleCreated event", args, {
            component: "RealTimeEventsService",
            action: "handleBundleCreated",
          });
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
          logger.info("BundlePurchased event", args, {
            component: "RealTimeEventsService",
            action: "handleBundlePurchased",
          });
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
          logger.info("BundleCancelled event", args, {
            component: "RealTimeEventsService",
            action: "handleBundleCancelled",
          });
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
      logger.error("Error subscribing to bundle events", error, {
        component: "RealTimeEventsService",
        action: "subscribeToBundleEvents",
      });
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

      logger.success("Subscribed to all events", null, {
        component: "RealTimeEventsService",
        action: "subscribeToAllEvents",
      });
    } catch (error) {
      logger.error("Error subscribing to all events", error, {
        component: "RealTimeEventsService",
        action: "subscribeToAllEvents",
      });
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
      logger.info(`Unsubscribed from ${eventName}`, null, {
        component: "RealTimeEventsService",
        action: "unsubscribeFromEvent",
        eventName,
      });
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
    logger.info("Unsubscribed from all events", null, {
      component: "RealTimeEventsService",
      action: "unsubscribeFromAllEvents",
    });
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
