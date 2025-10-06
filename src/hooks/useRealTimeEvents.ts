"use client";

/**
 * useRealTimeEvents Hook
 * Manages real-time blockchain event subscriptions with automatic cleanup
 */

import { useEffect, useCallback, useRef } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { web3Utils } from "@/lib/utils/web3";
import {
  realTimeEventsService,
  EventHandler,
} from "@/lib/services/contracts/RealTimeEvents";

export interface UseRealTimeEventsOptions {
  enabled?: boolean;
  includeListings?: boolean;
  includeOffers?: boolean;
  includeAuctions?: boolean;
  includeBundles?: boolean;
}

export function useRealTimeEvents(
  handlers: EventHandler,
  options: UseRealTimeEventsOptions = {}
) {
  const { isConnected } = useAppSelector((state) => state.wallet);
  const isInitialized = useRef(false);

  const {
    enabled = true,
    includeListings = true,
    includeOffers = true,
    includeAuctions = true,
    includeBundles = true,
  } = options;

  /**
   * Initialize event service
   */
  const initializeEvents = useCallback(async () => {
    if (!enabled || !isConnected || isInitialized.current) return;

    try {
      const provider = web3Utils.getProvider();
      if (!provider) {
        console.warn("Provider not available for real-time events");
        return;
      }

      // Initialize event service
      await realTimeEventsService.initialize(provider);

      // Subscribe to selected event types
      const subscriptionPromises: Promise<void>[] = [];

      if (includeListings) {
        subscriptionPromises.push(
          realTimeEventsService.subscribeToListingEvents(handlers)
        );
      }

      if (includeOffers) {
        subscriptionPromises.push(
          realTimeEventsService.subscribeToOfferEvents(handlers)
        );
      }

      if (includeAuctions) {
        subscriptionPromises.push(
          realTimeEventsService.subscribeToAuctionEvents(handlers)
        );
      }

      if (includeBundles) {
        subscriptionPromises.push(
          realTimeEventsService.subscribeToBundleEvents(handlers)
        );
      }

      await Promise.all(subscriptionPromises);
      isInitialized.current = true;

      console.log("✅ Real-time events initialized");
    } catch (error) {
      console.error("Failed to initialize real-time events:", error);
    }
  }, [
    enabled,
    isConnected,
    handlers,
    includeListings,
    includeOffers,
    includeAuctions,
    includeBundles,
  ]);

  /**
   * Cleanup events
   */
  const cleanupEvents = useCallback(() => {
    if (isInitialized.current) {
      realTimeEventsService.unsubscribeAll();
      isInitialized.current = false;
      console.log("🔇 Real-time events cleaned up");
    }
  }, []);

  /**
   * Initialize on mount, cleanup on unmount
   */
  useEffect(() => {
    initializeEvents();

    return () => {
      cleanupEvents();
    };
  }, [initializeEvents, cleanupEvents]);

  return {
    isInitialized: isInitialized.current,
    activeSubscriptions: realTimeEventsService.getActiveSubscriptions(),
    cleanup: cleanupEvents,
  };
}
