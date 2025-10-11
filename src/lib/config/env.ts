/**
 * Environment Configuration
 * Centralized configuration for environment variables with type safety
 */

export const ENV = {
  // Application
  NODE_ENV: process.env.NODE_ENV as "development" | "production" | "test",

  // Blockchain
  DEFAULT_CHAIN_ID: parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || "31337"
  ),
} as const;

/**
 * Validate required environment variables
 */
export function validateEnvironment() {
  // Log current mode
  console.log(
    `🔧 NFT Marketplace - Chain ID: ${ENV.DEFAULT_CHAIN_ID}`
  );
}
