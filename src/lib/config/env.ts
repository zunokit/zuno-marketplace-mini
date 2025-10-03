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

  // 🎭 MAIN SWITCH: Mock Data vs Real Contracts
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true",
} as const;

/**
 * Validate required environment variables
 */
export function validateEnvironment() {
  // Log current mode
  console.log(
    `🔧 NFT Marketplace - ${
      ENV.USE_MOCK_DATA ? "🎭 MOCK DATA MODE" : "⛓️ REAL CONTRACT MODE"
    }`
  );

  // Warning if using mock data in production
  if (ENV.NODE_ENV === "production" && ENV.USE_MOCK_DATA) {
    console.error("🚨 WARNING: USE_MOCK_DATA is enabled in production!");
  }
}

/**
 * Check if using mock data
 */
export const isMockMode = () => ENV.USE_MOCK_DATA;
