/**
 * Environment Configuration
 * Centralized configuration for environment variables with type safety
 *
 * Priority: localStorage (runtime config) > process.env
 */

import { envConfigManager } from "@/lib/utils/env-config";

/**
 * Get environment configuration with runtime priority
 */
export const ENV = {
  // Application
  NODE_ENV: process.env.NODE_ENV as "development" | "production" | "test",

  // Blockchain - with runtime config priority
  get DEFAULT_CHAIN_ID() {
    return envConfigManager.getDefaultChainId();
  },
} as const;

/**
 * Validate required environment variables
 */
export function validateEnvironment() {
  const isUsingStored = envConfigManager.isUsingStoredConfig();

  // Log current mode
  console.log(
    `🔧 NFT Marketplace - Chain ID: ${ENV.DEFAULT_CHAIN_ID}${isUsingStored ? " (Runtime Config)" : ""}`
  );
}
