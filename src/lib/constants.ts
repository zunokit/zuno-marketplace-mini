/**
 * Application Constants
 */

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

// Supported chain IDs
export const SUPPORTED_CHAINS = {
  LOCAL: 31337,
  SEPOLIA: 11155111,
  MAINNET: 1,
} as const;

// Default values
export const DEFAULT_CHAIN_ID = SUPPORTED_CHAINS.LOCAL;

// ERC165 Interface IDs
export const INTERFACE_IDS = {
  ERC721: "0x80ac58cd",
  ERC1155: "0xd9b67a26",
  ERC2981: "0x2a55205a", // ERC2981 Royalty Standard
  ERC721Metadata: "0x5b5e139f",
  ERC1155MetadataURI: "0x0e89341c",
} as const;

// Contract Constants
export const CONTRACT_CONSTANTS = {
  MAX_ROYALTY_FEE: 1000, // 10% in basis points
  MAX_PLATFORM_FEE: 500, // 5% in basis points
  MIN_LISTING_DURATION: 3600, // 1 hour in seconds
  MAX_LISTING_DURATION: 31536000, // 1 year in seconds
  MIN_AUCTION_DURATION: 3600, // 1 hour
  MAX_AUCTION_DURATION: 2592000, // 30 days
  BASIS_POINTS: 10000, // 100% = 10000 basis points
  MINT_START_TIME_OFFSET: 300, // 5 minutes in seconds
  DEFAULT_ALLOWLIST_DURATION: 86400, // 24 hours in seconds
} as const;