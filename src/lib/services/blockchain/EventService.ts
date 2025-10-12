/**
 * Event Service
 * Handles blockchain event monitoring and subscriptions
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { TokenType } from "@/types";
import { ParsedEvent, EventSubscription } from "@/types/events";

export class EventService {
  private provider: ethers.Provider | null = null;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: Map<string, ParsedEvent[]> = new Map();

  /**
   * Initialize the service
   */
  async initialize(provider: ethers.Provider): Promise<void> {
    this.provider = provider;
    logger.info("EventService initialized");
  }

  /**
   * Subscribe to collection events
   */
  async subscribeToCollection(
    address: string,
    tokenType: TokenType,
    events?: string[]
  ): Promise<string[]> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const subscriptionIds: string[] = [];

    // Import the appropriate ABI
    const { ERC721Collection_ABI, ERC1155Collection_ABI } = await import(
      "@/lib/contracts/abis"
    );
    const abi =
      tokenType === TokenType.ERC721
        ? ERC721Collection_ABI
        : ERC1155Collection_ABI;
    const contract = new ethers.Contract(address, abi, this.provider);

    // Default events to subscribe to
    const defaultEvents =
      tokenType === TokenType.ERC721
        ? ["Transfer", "Approval", "ApprovalForAll"]
        : ["TransferSingle", "TransferBatch", "ApprovalForAll"];

    const eventsToSubscribe = events || defaultEvents;

    for (const eventName of eventsToSubscribe) {
      const id = await this.subscribe(contract, eventName, (event) => {
        this.handleCollectionEvent(address, eventName, event);
      });
      subscriptionIds.push(id);
    }

    logger.info(
      `Subscribed to ${subscriptionIds.length} events for collection ${address}`,
      {
        collectionAddress: address,
        tokenType,
        eventCount: subscriptionIds.length,
        events: eventsToSubscribe,
      }
    );

    return subscriptionIds;
  }

  /**
   * Subscribe to a specific event
   */
  async subscribe(
    contract: ethers.Contract,
    eventName: string,
    callback: (event: ParsedEvent) => void,
    filter?: any
  ): Promise<string> {
    const id = `${contract.target}_${eventName}_${Date.now()}`;

    try {
      // Create event filter
      const eventFilter = contract.filters[eventName]?.(...(filter || []));

      // Subscribe to event
      const listener = (event: any) => {
        const parsedEvent = this.parseEvent([event], contract, eventName);
        logger.debug(`Event received: ${eventName} on ${contract.target}`, {
          blockNumber: parsedEvent.blockNumber,
          transactionHash: parsedEvent.transactionHash,
        });
        callback(parsedEvent);
        this.addToHistory(id, parsedEvent);
      };

      contract.on(eventFilter || eventName, listener);

      // Store subscription
      const subscription: EventSubscription = {
        id,
        contract,
        event: eventName,
        filter,
        callback,
        unsubscribe: () => {
          contract.off(eventFilter || eventName, listener);
        },
      };

      this.subscriptions.set(id, subscription);

      logger.info(`Subscribed to ${eventName} on ${contract.target}`, {
        subscriptionId: id,
        contractAddress: contract.target,
        eventName,
      });

      return id;
    } catch (error) {
      logger.error(`Failed to subscribe to ${eventName}`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      logger.debug(`Unsubscribed from ${subscriptionId}`);
    }
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
    logger.info("Unsubscribed from all events");
  }

  /**
   * Query past events
   */
  async queryEvents(
    contract: ethers.Contract,
    eventName: string,
    fromBlock?: number,
    toBlock?: number,
    filter?: any
  ): Promise<ParsedEvent[]> {
    try {
      const eventFilter = contract.filters[eventName]?.(...(filter || []));

      const events = await contract.queryFilter(
        eventFilter || eventName,
        fromBlock || 0,
        toBlock || "latest"
      );

      return events.map((event) =>
        this.parseEvent([event], contract, eventName)
      );
    } catch (error) {
      logger.error(`Failed to query ${eventName} events`, error);
      return [];
    }
  }

  /**
   * Parse event data
   */
  private parseEvent(
    args: any[],
    contract: ethers.Contract,
    eventName: string
  ): ParsedEvent {
    try {
      const event = args[0];

      // Handle event with log data (from queryFilter)
      if (event?.log) {
        const parsed = contract.interface.parseLog({
          topics: event.log.topics,
          data: event.log.data,
        });

        return {
          name: eventName,
          address: contract.target as string,
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash,
          args: parsed?.args || {},
          timestamp: Date.now(),
        };
      }

      // Handle direct event object from ethers (from event listeners)
      if (event?.args) {
        return {
          name: eventName,
          address: contract.target as string,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          args: event.args,
          timestamp: Date.now(),
        };
      }

      // Fallback for malformed events
      return {
        name: eventName,
        address: contract.target as string,
        blockNumber: 0,
        transactionHash: "",
        args: event || {},
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error("Failed to parse event", {
        error,
        eventName,
        contract: contract.target,
      });
      return {
        name: eventName,
        address: contract.target as string,
        blockNumber: 0,
        transactionHash: "",
        args: {},
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Handle collection events
   */
  private handleCollectionEvent(
    address: string,
    eventName: string,
    event: ParsedEvent
  ): void {
    logger.info(`Collection event: ${eventName} on ${address}`, {
      eventName,
      collectionAddress: address,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: event.timestamp,
    });

    // Emit custom events for UI updates
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("collection-event", {
          detail: {
            collection: address,
            event: eventName,
            data: event,
          },
        })
      );
    }
  }

  /**
   * Add event to history
   */
  private addToHistory(subscriptionId: string, event: ParsedEvent): void {
    if (!this.eventHistory.has(subscriptionId)) {
      this.eventHistory.set(subscriptionId, []);
    }

    const history = this.eventHistory.get(subscriptionId)!;
    history.push(event);

    // Keep only last 100 events
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Get event history
   */
  getHistory(subscriptionId: string): any[] {
    return this.eventHistory.get(subscriptionId) || [];
  }

  /**
   * Clear event history
   */
  clearHistory(subscriptionId?: string): void {
    if (subscriptionId) {
      this.eventHistory.delete(subscriptionId);
    } else {
      this.eventHistory.clear();
    }
  }

  /**
   * Watch for transaction receipt and events
   */
  async watchTransaction(
    hash: string,
    expectedEvents?: string[]
  ): Promise<{ receipt: ethers.TransactionReceipt; events: ParsedEvent[] }> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const receipt = await this.provider.waitForTransaction(hash);

    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    const events: ParsedEvent[] = [];

    // Parse logs for expected events
    if (expectedEvents && receipt.logs) {
      for (const log of receipt.logs) {
        try {
          // Try to decode the log
          // This would need the contract interface to properly decode
          events.push({
            name: "Unknown",
            address: log.address,
            blockNumber: receipt.blockNumber,
            transactionHash: receipt.hash,
            args: {},
            timestamp: Date.now(),
          });
        } catch {
          // Skip logs that can't be decoded
        }
      }
    }

    return { receipt, events };
  }
}

// Export singleton instance
export const eventService = new EventService();
