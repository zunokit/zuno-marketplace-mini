/**
 * Contract Types
 * Strict type definitions for smart contract interactions
 * Replaces `any` types throughout the codebase
 */

import { ethers } from "ethers";

// ============================================================================
// TRANSACTION & EVENT TYPES
// ============================================================================

/**
 * Transaction log interface
 */
export interface ContractLog {
  eventName?: string;
  args?: Record<string, unknown>;
  topics: string[];
  data: string;
  index: number;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  transactionIndex: number;
  address: string;
  removed: boolean;
}

/**
 * Transaction receipt with properly typed logs
 */
export interface ContractTransactionReceipt {
  to: string;
  from: string;
  contractAddress: string | null;
  transactionIndex: number;
  gasUsed: bigint;
  logsBloom: string;
  blockHash: string;
  transactionHash: string;
  logs: ContractLog[];
  blockNumber: number;
  confirmations: number;
  cumulativeGasUsed: bigint;
  effectiveGasPrice: bigint;
  status: number;
  type: number;
}

// ============================================================================
// RAW CONTRACT RETURN TYPES
// ============================================================================

/**
 * Raw listing data from ERC721/ERC1155 Exchange contracts
 */
export interface RawContractListing {
  listingId: bigint;
  seller: string;
  contractAddress: string;
  tokenId: bigint;
  amount: bigint;
  price: bigint;
  paymentToken: string;
  expirationTime: bigint;
  isActive: boolean;
}

/**
 * Raw offer data from OfferManager contract
 */
export interface RawContractOffer {
  id: bigint;
  creator: string;
  collection: string;
  tokenId: bigint;
  price: bigint;
  quantity: bigint;
  expirationTime: bigint;
  status: number;
  offerType: number;
  traits: string[];
}

/**
 * Raw bundle data from BundleManager contract
 */
export interface RawContractBundle {
  id: bigint;
  seller: string;
  totalPrice: bigint;
  discountPercentage: number;
  status: number;
}

/**
 * Raw bundle timing data
 */
export interface RawBundleTiming {
  startTime: bigint;
  endTime: bigint;
  createdAt: bigint;
  soldAt: bigint;
}

/**
 * Raw bundle item data
 */
export interface RawBundleItem {
  collection: string;
  tokenId: bigint;
  amount: bigint;
  tokenType: number;
  isIncluded: boolean;
}

/**
 * Raw auction info from EnglishAuction/DutchAuction contracts
 */
export interface RawContractAuction {
  auctionId: bigint;
  seller: string;
  nftContract: string;
  tokenId: bigint;
  startPrice: bigint;
  endPrice?: bigint; // Dutch auction only
  reservePrice?: bigint; // English auction only
  duration: bigint;
  startTime: bigint;
  endTime: bigint;
  highestBidder: string;
  highestBid: bigint;
  status: number;
  isEnded: boolean;
}

/**
 * Raw bid data from EnglishAuction contract
 */
export interface RawContractBid {
  bidder: string;
  amount: bigint;
  timestamp: bigint;
}

/**
 * Raw transaction record from ListingHistoryTracker
 */
export interface RawTransactionRecord {
  txType: number;
  collection: string;
  tokenId: bigint;
  seller: string;
  buyer: string;
  price: bigint;
  timestamp: bigint;
  txHash: string;
}

/**
 * Raw price point from ListingHistoryTracker
 */
export interface RawPricePoint {
  price: bigint;
  timestamp: bigint;
  source: number;
}

/**
 * Raw royalty recipient from RoyaltyManager
 */
export interface RawRoyaltyRecipient {
  recipient: string;
  basisPoints: bigint;
  role: string;
  isActive: boolean;
}

/**
 * Raw fee config from FeeManager
 */
export interface RawFeeConfig {
  tierId: bigint;
  name: string;
  baseFee: bigint;
  discountedFee: bigint;
  minVolume: bigint;
  isActive: boolean;
}

/**
 * Raw role assignment history from AccessControl
 */
export interface RawRoleHistory {
  account: string;
  role: string;
  assignedBy: string;
  assignedAt: bigint;
  reason: string;
  isActive: boolean;
}

// ============================================================================
// TIMELOCK TYPES
// ============================================================================

/**
 * Decoded function call data
 */
export interface DecodedFunctionCall {
  name: string;
  args: unknown[];
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Generic contract event
 */
export interface ContractEvent {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  removed: boolean;
  address: string;
  data: string;
  topics: string[];
  transactionHash: string;
  logIndex: number;
  args?: Record<string, unknown>;
  event?: string;
  eventSignature?: string;
}

/**
 * Event listener configuration
 */
export interface EventListener {
  filter: ethers.DeferredTopicFilter | ethers.ContractEventName;
  handler: (event: ContractEvent) => void;
}

/**
 * Marketplace event handlers interface
 */
export interface MarketplaceEventHandlers {
  onListingCreated?: (event: ContractEvent) => void;
  onListingPurchased?: (event: ContractEvent) => void;
  onListingCancelled?: (event: ContractEvent) => void;
  onOfferCreated?: (event: ContractEvent) => void;
  onOfferAccepted?: (event: ContractEvent) => void;
  onOfferCancelled?: (event: ContractEvent) => void;
  onAuctionCreated?: (event: ContractEvent) => void;
  onBidPlaced?: (event: ContractEvent) => void;
  onAuctionEnded?: (event: ContractEvent) => void;
  onBundleCreated?: (event: ContractEvent) => void;
  onBundlePurchased?: (event: ContractEvent) => void;
  onBundleCancelled?: (event: ContractEvent) => void;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Generic listing interface for validation
 */
export interface ValidatableListing {
  contractAddress: string;
  tokenId: string;
  price: string;
  duration?: string | number;
  seller?: string;
  [key: string]: unknown;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if object is a ContractLog
 */
export function isContractLog(obj: unknown): obj is ContractLog {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "topics" in obj &&
    "data" in obj &&
    "address" in obj
  );
}

/**
 * Type guard to check if object is a RawContractListing
 */
export function isRawContractListing(obj: unknown): obj is RawContractListing {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "listingId" in obj &&
    "seller" in obj &&
    "contractAddress" in obj &&
    "tokenId" in obj &&
    "price" in obj
  );
}

/**
 * Type guard for contract events
 */
export function isContractEvent(obj: unknown): obj is ContractEvent {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "blockNumber" in obj &&
    "transactionHash" in obj &&
    "topics" in obj
  );
}
