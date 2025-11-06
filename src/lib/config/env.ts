/**
 * Environment Variables Helper
 * Provides type-safe access to environment variables
 */

export const ENV = {
  // Chain configuration
  DEFAULT_CHAIN_ID: parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || "31337",
    10
  ),

  // Contract addresses
  USER_HUB_LOCAL: process.env.NEXT_PUBLIC_USER_HUB_LOCAL || "",

  // RPC URLs
  RPC_URL_LOCAL: process.env.NEXT_PUBLIC_RPC_URL_LOCAL || "",
  RPC_URL_SEPOLIA: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || "",
  RPC_URL_MAINNET: process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "",

  // Allowlist
  DEFAULT_ALLOWLIST: process.env.NEXT_PUBLIC_DEFAULT_ALLOWLIST || "",

  // Zuno API
  ZUNO_API_URL: process.env.NEXT_PUBLIC_ZUNO_API_URL || "",
  ZUNO_API_KEY: process.env.NEXT_PUBLIC_ZUNO_API_KEY || "",
} as const;
