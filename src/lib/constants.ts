/**
 * Application Constants
 */

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Supported chain IDs
export const SUPPORTED_CHAINS = {
  LOCAL: 31337,
  SEPOLIA: 11155111,
  MAINNET: 1,
} as const;

// Default values
export const DEFAULT_CHAIN_ID = SUPPORTED_CHAINS.LOCAL;