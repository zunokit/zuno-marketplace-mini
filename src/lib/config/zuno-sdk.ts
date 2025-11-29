/**
 * Zuno Marketplace SDK Configuration
 *
 * This file provides configuration utilities for the Zuno Marketplace SDK.
 * The SDK is managed by ZunoProvider in app-provider.tsx.
 */

import type { ZunoSDKConfig } from "zuno-marketplace-sdk";

/**
 * Default SDK configuration
 * Used by ZunoProvider in app-provider.tsx
 */
export const defaultConfig: ZunoSDKConfig = {
  apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY || "",
  network: (process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID
    ? parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID)
    : 31337) as number | "mainnet" | "sepolia" | "polygon" | "arbitrum",
  apiUrl: process.env.NEXT_PUBLIC_ZUNO_API_URL,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
  cache: {
    ttl: 300000, // 5 minutes cache for contract instances
    gcTime: 600000, // 10 minutes garbage collection
  },
  retryPolicy: {
    maxRetries: 3,
    backoff: "exponential",
  },
  logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
  },
};

/**
 * Validate SDK configuration
 * Checks if all required environment variables are set
 *
 * @returns { isValid: boolean, errors: string[] } Validation result
 */
export function validateSDKConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_ZUNO_API_KEY) {
    errors.push("NEXT_PUBLIC_ZUNO_API_KEY is not set");
  }

  if (!process.env.NEXT_PUBLIC_ZUNO_API_URL) {
    errors.push("NEXT_PUBLIC_ZUNO_API_URL is not set");
  }

  if (process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID) {
    const chainId = parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID);
    if (isNaN(chainId) || chainId <= 0) {
      errors.push(
        "NEXT_PUBLIC_DEFAULT_CHAIN_ID must be a valid positive integer"
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
