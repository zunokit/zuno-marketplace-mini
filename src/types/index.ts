/**
 * Global Type Definitions
 */

// Wallet & Web3
export interface WalletState {
  account: string | null;
  chainId: number | null;
  balance: string | null;
  isConnected: boolean;
}

// NFT Types
export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  tokenType: "ERC721" | "ERC1155";
  name: string;
  description: string;
  image: string;
  owner: string;
  creator: string;
  attributes?: NFTAttribute[];
  metadata?: Record<string, any>;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

// Collection Types
export interface Collection {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  banner?: string;
  tokenType: "ERC721" | "ERC1155";
  creator: string;
  totalSupply?: string;
  floorPrice?: string;
  volume?: string;
  verified?: boolean;
}

// Listing Types
export interface Listing {
  id: string;
  nftContract: string;
  tokenId: string;
  seller: string;
  price: string;
  amount: string;
  startTime: number;
  endTime: number;
  status: ListingStatus;
  tokenType: "ERC721" | "ERC1155";
}

export enum ListingStatus {
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

// Auction Types
export interface Auction {
  id: string;
  nftContract: string;
  tokenId: string;
  seller: string;
  startPrice: string;
  reservePrice: string;
  currentPrice: string;
  highestBid: string;
  highestBidder: string;
  startTime: number;
  endTime: number;
  status: AuctionStatus;
  auctionType: AuctionType;
}

export enum AuctionStatus {
  ACTIVE = 0,
  ENDED = 1,
  CANCELLED = 2,
}

export enum AuctionType {
  ENGLISH = 0,
  DUTCH = 1,
}

// Offer Types
export interface Offer {
  id: string;
  creator: string;
  collection: string;
  tokenId: string;
  price: string;
  quantity: string;
  expirationTime: number;
  status: OfferStatus;
  offerType: OfferType;
}

export enum OfferStatus {
  ACTIVE = "ACTIVE",
  ACCEPTED = "ACCEPTED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export enum OfferType {
  NFT = "NFT",
  COLLECTION = "COLLECTION",
  TRAIT = "TRAIT",
}

// Bundle Types
export interface Bundle {
  id: string;
  seller: string;
  totalPrice: string;
  discountPercentage: number;
  status: BundleStatus;
  startTime: number;
  endTime: number;
  items: BundleItem[];
}

export interface BundleItem {
  collection: string;
  tokenId: string;
  amount: string;
  tokenType: "ERC721" | "ERC1155";
  isIncluded: boolean;
}

export enum BundleStatus {
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

// Transaction Types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: TransactionStatus;
  type: TransactionType;
}

export enum TransactionStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum TransactionType {
  LIST = "LIST",
  BUY = "BUY",
  CANCEL = "CANCEL",
  BID = "BID",
  ACCEPT_OFFER = "ACCEPT_OFFER",
  CREATE_BUNDLE = "CREATE_BUNDLE",
}

// Activity Types
export interface Activity {
  id: string;
  type: ActivityType;
  nftContract: string;
  tokenId: string;
  from: string;
  to: string;
  price?: string;
  timestamp: number;
  txHash: string;
}

export enum ActivityType {
  MINT = "MINT",
  LIST = "LIST",
  SALE = "SALE",
  CANCEL = "CANCEL",
  TRANSFER = "TRANSFER",
  BID = "BID",
  OFFER = "OFFER",
}

// Network Types
export interface Network {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Fee Types
export interface FeeBreakdown {
  platformFee: bigint;
  royaltyFee: bigint;
  totalFees: bigint;
  sellerProceeds: bigint;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter Types
export interface NFTFilters {
  collections?: string[];
  minPrice?: string;
  maxPrice?: string;
  traits?: Record<string, string[]>;
  status?: ListingStatus[];
}

export interface CollectionFilters {
  verified?: boolean;
  tokenType?: "ERC721" | "ERC1155";
  sortBy?: "volume" | "floorPrice" | "totalSupply";
}

// Error Types
export interface ContractError {
  code: string;
  message: string;
  data?: any;
}
