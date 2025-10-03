/**
 * Real-time Events Service
 * Handles blockchain event subscriptions for listings, offers, and auctions
 * Provides real-time updates to the UI
 */

import { ethers } from "ethers";
import { getContractRegistryService } from "./ContractRegistryService";

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

  constructor() {}

  /**
   * Initialize the real-time events service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const registryService = getContractRegistryService();
      await registryService.initialize();

      this.isInitialized = true;
      console.log("✅ RealTimeEventsService initialized");
    } catch (error) {
      console.error("❌ Failed to initialize RealTimeEventsService:", error);
      throw error;
    }
  }

  /**
   * Subscribe to listing events
   */
  async subscribeToListingEvents(handlers: EventHandler): Promise<void> {
    try {
      const registryService = getContractRegistryService();
      const registry = registryService.getContractByKey(
        "NFT_EXCHANGE_REGISTRY"
      );

      // ListingCreated event
      if (handlers.onListingCreated) {
        const subscription = registry.on("ListingCreated", (event) => {
          console.log("📝 ListingCreated event:", event);
          handlers.onListingCreated!(event);
        });

        this.subscriptions.set("ListingCreated", {
          id: "ListingCreated",
          contract: registry,
          eventName: "ListingCreated",
          filter: null,
          handler: handlers.onListingCreated,
        });
      }

      // ListingPurchased event
      if (handlers.onListingPurchased) {
        const subscription = registry.on("ListingPurchased", (event) => {
          console.log("💰 ListingPurchased event:", event);
          handlers.onListingPurchased!(event);
        });

        this.subscriptions.set("ListingPurchased", {
          id: "ListingPurchased",
          contract: registry,
          eventName: "ListingPurchased",
          filter: null,
          handler: handlers.onListingPurchased,
        });
      }

      // ListingCancelled event
      if (handlers.onListingCancelled) {
        const subscription = registry.on("ListingCancelled", (event) => {
          console.log("❌ ListingCancelled event:", event);
          handlers.onListingCancelled!(event);
        });

        this.subscriptions.set("ListingCancelled", {
          id: "ListingCancelled",
          contract: registry,
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
      const registryService = getContractRegistryService();
      const offerManager = registryService.getContractByKey("OFFER_MANAGER");

      // OfferCreated event
      if (handlers.onOfferCreated) {
        const subscription = offerManager.on("OfferCreated", (event) => {
          console.log("🎯 OfferCreated event:", event);
          handlers.onOfferCreated!(event);
        });

        this.subscriptions.set("OfferCreated", {
          id: "OfferCreated",
          contract: offerManager,
          eventName: "OfferCreated",
          filter: null,
          handler: handlers.onOfferCreated,
        });
      }

      // OfferAccepted event
      if (handlers.onOfferAccepted) {
        const subscription = offerManager.on("OfferAccepted", (event) => {
          console.log("✅ OfferAccepted event:", event);
          handlers.onOfferAccepted!(event);
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
        const subscription = offerManager.on("OfferCancelled", (event) => {
          console.log("❌ OfferCancelled event:", event);
          handlers.onOfferCancelled!(event);
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
   * Subscribe to auction events
   */
  async subscribeToAuctionEvents(handlers: EventHandler): Promise<void> {
    try {
      const registryService = getContractRegistryService();
      const factory = registryService.getContractByKey("AUCTION_FACTORY");

      // AuctionCreated event
      if (handlers.onAuctionCreated) {
        const subscription = factory.on("AuctionCreated", (event) => {
          console.log("🏆 AuctionCreated event:", event);
          handlers.onAuctionCreated!(event);
        });

        this.subscriptions.set("AuctionCreated", {
          id: "AuctionCreated",
          contract: factory,
          eventName: "AuctionCreated",
          filter: null,
          handler: handlers.onAuctionCreated,
        });
      }

      // BidPlaced event
      if (handlers.onBidPlaced) {
        const subscription = factory.on("BidPlaced", (event) => {
          console.log("💰 BidPlaced event:", event);
          handlers.onBidPlaced!(event);
        });

        this.subscriptions.set("BidPlaced", {
          id: "BidPlaced",
          contract: factory,
          eventName: "BidPlaced",
          filter: null,
          handler: handlers.onBidPlaced,
        });
      }

      // AuctionEnded event
      if (handlers.onAuctionEnded) {
        const subscription = factory.on("AuctionEnded", (event) => {
          console.log("🏁 AuctionEnded event:", event);
          handlers.onAuctionEnded!(event);
        });

        this.subscriptions.set("AuctionEnded", {
          id: "AuctionEnded",
          contract: factory,
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
      const registryService = getContractRegistryService();
      const bundleManager = registryService.getContractByKey("BUNDLE_MANAGER");

      // BundleCreated event
      if (handlers.onBundleCreated) {
        const subscription = bundleManager.on("BundleCreated", (event) => {
          console.log("📦 BundleCreated event:", event);
          handlers.onBundleCreated!(event);
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
        const subscription = bundleManager.on("BundlePurchased", (event) => {
          console.log("💰 BundlePurchased event:", event);
          handlers.onBundlePurchased!(event);
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
        const subscription = bundleManager.on("BundleCancelled", (event) => {
          console.log("❌ BundleCancelled event:", event);
          handlers.onBundleCancelled!(event);
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
