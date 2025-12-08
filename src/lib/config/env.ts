/**
 * Environment Variables Helper
 * Provides type-safe access to environment variables
 */

export const ENV = {
  // Chain configuration
  DEFAULT_CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || "31337", 10),

  // RPC URL (single URL for current network)
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",

  // Zuno API
  ZUNO_API_URL: process.env.NEXT_PUBLIC_ZUNO_API_URL || "",
  ZUNO_API_KEY: process.env.NEXT_PUBLIC_ZUNO_API_KEY || "",

  // Optional: Default allowlist (comma-separated addresses)
  DEFAULT_ALLOWLIST: process.env.NEXT_PUBLIC_DEFAULT_ALLOWLIST || "",
} as const;
