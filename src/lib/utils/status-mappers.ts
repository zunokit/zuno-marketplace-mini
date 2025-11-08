/**
 * Status Mapper Utility
 * Centralized status and type code mapping for contract data
 *
 * Provides consistent mapping between numeric status codes from smart contracts
 * and human-readable string representations used in the frontend.
 */

/**
 * Bundle status codes from BundleManager contract
 */
export type BundleStatus = "ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED" | "UNKNOWN";

/**
 * Offer status codes from OfferManager contract
 */
export type OfferStatus = "ACTIVE" | "ACCEPTED" | "CANCELLED" | "EXPIRED" | "UNKNOWN";

/**
 * Offer type codes from OfferManager contract
 */
export type OfferType = "NFT" | "COLLECTION" | "TRAIT" | "UNKNOWN";

/**
 * Auction status codes
 */
export type AuctionStatus = "ACTIVE" | "ENDED" | "CANCELLED" | "CLAIMED" | "UNKNOWN";

/**
 * Listing status codes
 */
export type ListingStatus = "ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED" | "UNKNOWN";

/**
 * Transaction types from ListingHistoryTracker
 */
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

/**
 * Action status from Timelock contract
 */
export enum ActionStatus {
  PENDING = 0,
  EXECUTED = 1,
  CANCELLED = 2,
  EXPIRED = 3,
}

export class StatusMapper {
  /**
   * Map bundle status code to string
   *
   * @param statusCode - Numeric status code from contract (0-3)
   * @returns Human-readable status string
   *
   * @example
   * ```typescript
   * const status = StatusMapper.mapBundleStatus(0); // "ACTIVE"
   * const status = StatusMapper.mapBundleStatus(1); // "SOLD"
   * ```
   */
  static mapBundleStatus(statusCode: number): BundleStatus {
    const statuses: BundleStatus[] = [
      "ACTIVE",    // 0
      "SOLD",      // 1
      "CANCELLED", // 2
      "EXPIRED",   // 3
    ];
    return statuses[statusCode] || "UNKNOWN";
  }

  /**
   * Map offer status code to string
   *
   * @param statusCode - Numeric status code from contract (0-3)
   * @returns Human-readable status string
   *
   * @example
   * ```typescript
   * const status = StatusMapper.mapOfferStatus(0); // "ACTIVE"
   * const status = StatusMapper.mapOfferStatus(1); // "ACCEPTED"
   * ```
   */
  static mapOfferStatus(statusCode: number): OfferStatus {
    const statuses: OfferStatus[] = [
      "ACTIVE",    // 0
      "ACCEPTED",  // 1
      "CANCELLED", // 2
      "EXPIRED",   // 3
    ];
    return statuses[statusCode] || "UNKNOWN";
  }

  /**
   * Map offer type code to string
   *
   * @param typeCode - Numeric type code from contract (0-2)
   * @returns Human-readable type string
   *
   * @example
   * ```typescript
   * const type = StatusMapper.mapOfferType(0); // "NFT"
   * const type = StatusMapper.mapOfferType(1); // "COLLECTION"
   * ```
   */
  static mapOfferType(typeCode: number): OfferType {
    const types: OfferType[] = [
      "NFT",        // 0
      "COLLECTION", // 1
      "TRAIT",      // 2
    ];
    return types[typeCode] || "UNKNOWN";
  }

  /**
   * Map auction status code to string
   *
   * @param statusCode - Numeric status code from contract (0-3)
   * @returns Human-readable status string
   *
   * @example
   * ```typescript
   * const status = StatusMapper.mapAuctionStatus(0); // "ACTIVE"
   * const status = StatusMapper.mapAuctionStatus(1); // "ENDED"
   * ```
   */
  static mapAuctionStatus(statusCode: number): AuctionStatus {
    const statuses: AuctionStatus[] = [
      "ACTIVE",    // 0
      "ENDED",     // 1
      "CANCELLED", // 2
      "CLAIMED",   // 3
    ];
    return statuses[statusCode] || "UNKNOWN";
  }

  /**
   * Map listing status code to string
   *
   * @param statusCode - Numeric status code from contract (0-3)
   * @returns Human-readable status string
   *
   * @example
   * ```typescript
   * const status = StatusMapper.mapListingStatus(0); // "ACTIVE"
   * const status = StatusMapper.mapListingStatus(1); // "SOLD"
   * ```
   */
  static mapListingStatus(statusCode: number): ListingStatus {
    const statuses: ListingStatus[] = [
      "ACTIVE",    // 0
      "SOLD",      // 1
      "CANCELLED", // 2
      "EXPIRED",   // 3
    ];
    return statuses[statusCode] || "UNKNOWN";
  }

  /**
   * Get human-readable transaction type name
   *
   * @param type - Transaction type enum value
   * @returns Formatted transaction type name
   *
   * @example
   * ```typescript
   * const name = StatusMapper.getTransactionTypeName(TransactionType.LISTING_CREATED);
   * // Returns: "Listing Created"
   * ```
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
   * Get human-readable action status name (for Timelock)
   *
   * @param status - Action status enum value
   * @returns Formatted action status name
   *
   * @example
   * ```typescript
   * const name = StatusMapper.getActionStatusName(ActionStatus.PENDING);
   * // Returns: "Pending"
   * ```
   */
  static getActionStatusName(status: ActionStatus): string {
    const names: Record<ActionStatus, string> = {
      [ActionStatus.PENDING]: "Pending",
      [ActionStatus.EXECUTED]: "Executed",
      [ActionStatus.CANCELLED]: "Cancelled",
      [ActionStatus.EXPIRED]: "Expired",
    };
    return names[status] || "Unknown";
  }

  /**
   * Check if status represents an active/open state
   *
   * @param status - Status string to check
   * @returns True if status is active/open
   *
   * @example
   * ```typescript
   * StatusMapper.isActiveStatus("ACTIVE"); // true
   * StatusMapper.isActiveStatus("SOLD"); // false
   * ```
   */
  static isActiveStatus(
    status: BundleStatus | OfferStatus | AuctionStatus | ListingStatus
  ): boolean {
    return status === "ACTIVE";
  }

  /**
   * Check if status represents a completed/final state
   *
   * @param status - Status string to check
   * @returns True if status is completed/final
   *
   * @example
   * ```typescript
   * StatusMapper.isCompletedStatus("SOLD"); // true
   * StatusMapper.isCompletedStatus("ACCEPTED"); // true
   * StatusMapper.isCompletedStatus("ACTIVE"); // false
   * ```
   */
  static isCompletedStatus(
    status: BundleStatus | OfferStatus | AuctionStatus | ListingStatus
  ): boolean {
    return (
      status === "SOLD" ||
      status === "ACCEPTED" ||
      status === "ENDED" ||
      status === "CLAIMED"
    );
  }

  /**
   * Check if status represents a cancelled state
   *
   * @param status - Status string to check
   * @returns True if status is cancelled
   *
   * @example
   * ```typescript
   * StatusMapper.isCancelledStatus("CANCELLED"); // true
   * StatusMapper.isCancelledStatus("ACTIVE"); // false
   * ```
   */
  static isCancelledStatus(
    status: BundleStatus | OfferStatus | AuctionStatus | ListingStatus
  ): boolean {
    return status === "CANCELLED";
  }

  /**
   * Check if status represents an expired state
   *
   * @param status - Status string to check
   * @returns True if status is expired
   *
   * @example
   * ```typescript
   * StatusMapper.isExpiredStatus("EXPIRED"); // true
   * StatusMapper.isExpiredStatus("ACTIVE"); // false
   * ```
   */
  static isExpiredStatus(
    status: BundleStatus | OfferStatus | AuctionStatus | ListingStatus
  ): boolean {
    return status === "EXPIRED";
  }
}
