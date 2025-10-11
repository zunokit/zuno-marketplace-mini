/**
 * Application Constants
 */

// Network Constants
export const SUPPORTED_CHAIN_IDS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
  LOCAL: 31337,
} as const;

export const CHAIN_NAMES: Record<number, string> = {
  [SUPPORTED_CHAIN_IDS.MAINNET]: "Ethereum Mainnet",
  [SUPPORTED_CHAIN_IDS.SEPOLIA]: "Sepolia Testnet",
  [SUPPORTED_CHAIN_IDS.LOCAL]: "Local Network",
};

export const BLOCK_EXPLORERS: Record<number, string> = {
  [SUPPORTED_CHAIN_IDS.MAINNET]: "https://etherscan.io",
  [SUPPORTED_CHAIN_IDS.SEPOLIA]: "https://sepolia.etherscan.io",
  [SUPPORTED_CHAIN_IDS.LOCAL]: "http://localhost:8545",
};

// Contract Constants
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

/**
 * ERC165 Interface IDs for NFT standards
 */
export const INTERFACE_IDS = {
  ERC165: '0x01ffc9a7',
  ERC721: '0x80ac58cd',
  ERC721_METADATA: '0x5b5e139f',
  ERC721_ENUMERABLE: '0x780e9d63',
  ERC1155: '0xd9b67a26',
  ERC1155_METADATA: '0x0e89341c',
  ERC2981_ROYALTY: '0x2a55205a',
} as const;

/**
 * Contract development constants
 */
export const CONTRACT_CONSTANTS = {
  MINT_START_TIME_OFFSET: 3600, // 1 hour in seconds
  DEFAULT_ALLOWLIST_DURATION: 86400, // 24 hours in seconds
} as const;

export const TOKEN_STANDARDS = {
  ERC721: "ERC721",
  ERC1155: "ERC1155",
} as const;

// Fee Constants
export const BPS_DENOMINATOR = 10000;
export const DEFAULT_PLATFORM_FEE_BPS = 200; // 2%
export const MAX_ROYALTY_BPS = 1000; // 10%

// Time Constants
export const SECONDS_PER_DAY = 24 * 60 * 60;
export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_MINUTE = 60;

// Listing Constants
export const DEFAULT_LISTING_DURATION_DAYS = 7;
export const MAX_LISTING_DURATION_DAYS = 365;
export const MIN_LISTING_DURATION_DAYS = 1;

// Auction Constants
export const DEFAULT_AUCTION_DURATION_HOURS = 24;
export const MIN_AUCTION_DURATION_HOURS = 1;
export const MAX_AUCTION_DURATION_HOURS = 168; // 7 days

export const MIN_BID_INCREMENT_BPS = 500; // 5%

// Pagination Constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// UI Constants
export const TOAST_DURATION = 5000;
export const DEBOUNCE_DELAY = 300;

// Image Constants
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// IPFS Constants
export const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
export const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// Regex Patterns
export const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
export const IPFS_HASH_REGEX = /^Qm[a-zA-Z0-9]{44}$/;

// Transaction Confirmation
export const DEFAULT_CONFIRMATIONS = 1;
export const SAFE_CONFIRMATIONS = 3;

// Gas Limits (estimates)
export const GAS_LIMITS = {
  LIST_NFT: 150000,
  BUY_NFT: 200000,
  CANCEL_LISTING: 100000,
  CREATE_AUCTION: 200000,
  PLACE_BID: 150000,
  CREATE_COLLECTION: 3000000,
  MINT_NFT: 200000,
  APPROVE_NFT: 50000,
  CREATE_BUNDLE: 300000,
  CREATE_OFFER: 150000,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_CONNECTED: "wallet_connected",
  PREFERRED_NETWORK: "preferred_network",
  THEME: "theme",
  RECENT_COLLECTIONS: "recent_collections",
  FAVORITES: "favorites",
} as const;

// API Endpoints (if using backend)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Feature Flags
export const FEATURES = {
  BUNDLES_ENABLED: true,
  OFFERS_ENABLED: true,
  DUTCH_AUCTIONS_ENABLED: true,
  ANALYTICS_ENABLED: true,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet",
  WRONG_NETWORK: "Please switch to the correct network",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  TRANSACTION_REJECTED: "Transaction was rejected",
  APPROVAL_REQUIRED: "Please approve the contract first",
  INVALID_ADDRESS: "Invalid Ethereum address",
  INVALID_AMOUNT: "Invalid amount",
  LISTING_EXPIRED: "Listing has expired",
  AUCTION_ENDED: "Auction has ended",
  BID_TOO_LOW: "Bid amount is too low",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LISTING_CREATED: "Listing created successfully",
  NFT_PURCHASED: "NFT purchased successfully",
  LISTING_CANCELLED: "Listing cancelled successfully",
  AUCTION_CREATED: "Auction created successfully",
  BID_PLACED: "Bid placed successfully",
  COLLECTION_CREATED: "Collection created successfully",
  NFT_MINTED: "NFT minted successfully",
  OFFER_CREATED: "Offer created successfully",
  OFFER_ACCEPTED: "Offer accepted successfully",
  BUNDLE_CREATED: "Bundle created successfully",
} as const;
