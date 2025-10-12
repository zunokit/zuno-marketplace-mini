/**
 * Environment Configuration
 * Centralized configuration for environment variables with type safety
 *
 * Priority: localStorage (runtime config) > process.env
 */

import { envConfigManager } from "@/lib/utils/env-config";
import { logger } from "@/lib/utils/logger";

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
  // Environment configuration loaded
  logger.info(
    "Environment configuration loaded",
    {
      message: `🔧 NFT Marketplace - Chain ID: ${ENV.DEFAULT_CHAIN_ID}${
        isUsingStored ? " (Runtime Config)" : ""
      }`,
    },
    { component: "Env", action: "validateEnvironment" }
  );
}
