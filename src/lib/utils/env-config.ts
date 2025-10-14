/**
 * Runtime Environment Configuration Utility
 * Priority: localStorage > process.env
 */

import type { EnvConfig } from "@/types/env-config";
import { envStorageService } from "@/lib/services/env-storage.service";
import { logger } from "@/lib/utils/logger";

class EnvConfigManager {
  private static instance: EnvConfigManager;
  private cachedConfig: EnvConfig | null = null;

  private constructor() {}

  static getInstance(): EnvConfigManager {
    if (!EnvConfigManager.instance) {
      EnvConfigManager.instance = new EnvConfigManager();
    }
    return EnvConfigManager.instance;
  }

  /**
   * Get environment variable with localStorage priority
   * Priority: localStorage > process.env
   */
  get(key: string): string | undefined {
    const config = this.getConfig();
    return config[key];
  }

  /**
   * Get full configuration with localStorage priority
   */
  getConfig(): EnvConfig {
    // Return cached config if available
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    // Try localStorage first
    const storedConfig = envStorageService.load();
    if (storedConfig) {
      this.cachedConfig = storedConfig;
      return storedConfig;
    }

    // Fallback to process.env
    const envConfig: EnvConfig = {
      NEXT_PUBLIC_DEFAULT_CHAIN_ID:
        process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || "31337",
      NEXT_PUBLIC_DEFAULT_ALLOWLIST: process.env.NEXT_PUBLIC_DEFAULT_ALLOWLIST,
      NEXT_PUBLIC_USER_HUB_LOCAL:
        process.env.NEXT_PUBLIC_USER_HUB_LOCAL,
      NEXT_PUBLIC_USER_HUB_SEPOLIA:
        process.env.NEXT_PUBLIC_USER_HUB_SEPOLIA,
      NEXT_PUBLIC_USER_HUB_MAINNET:
        process.env.NEXT_PUBLIC_USER_HUB_MAINNET,
      NEXT_PUBLIC_RPC_URL_LOCAL: process.env.NEXT_PUBLIC_RPC_URL_LOCAL,
      NEXT_PUBLIC_RPC_URL_SEPOLIA: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA,
      NEXT_PUBLIC_RPC_URL_MAINNET: process.env.NEXT_PUBLIC_RPC_URL_MAINNET,
    };

    this.cachedConfig = envConfig;
    return envConfig;
  }

  /**
   * Update configuration and save to localStorage
   */
  setConfig(config: EnvConfig): void {
    // Validate configuration
    const validation = envStorageService.validate(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
    }

    // Save to localStorage
    envStorageService.save(config);

    // Update cache
    this.cachedConfig = config;

    // Trigger reload to apply new configuration
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  /**
   * Clear configuration and reset to process.env defaults
   */
  clearConfig(): void {
    envStorageService.clear();
    this.cachedConfig = null;

    // Trigger reload to apply default configuration
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  /**
   * Check if using localStorage configuration
   */
  isUsingStoredConfig(): boolean {
    const isUsingStored = envStorageService.hasStoredConfig();
    logger.debug(
      "🔧 [EnvConfig] isUsingStoredConfig",
      { isUsingStored },
      {
        component: "EnvConfig",
        action: "isUsingStoredConfig",
      }
    );
    return isUsingStored;
  }

  /**
   * Get chain-specific UserHub address
   */
  getUserHubAddress(chainId: number): string | undefined {
    const config = this.getConfig();
    const isUsingStored = this.isUsingStoredConfig();

    let address: string | undefined;
    switch (chainId) {
      case 31337:
        address = config.NEXT_PUBLIC_USER_HUB_LOCAL;
        break;
      case 11155111:
        address = config.NEXT_PUBLIC_USER_HUB_SEPOLIA;
        break;
      case 1:
        address = config.NEXT_PUBLIC_USER_HUB_MAINNET;
        break;
      default:
        address = undefined;
    }

    logger.debug(
      `🔧 [EnvConfig] getUserHubAddress(${chainId})`,
      {
        address,
        source: isUsingStored ? "localStorage" : "process.env",
      },
      {
        component: "EnvConfig",
        action: "getUserHubAddress",
      }
    );

    return address;
  }

  /**
   * @deprecated Use getUserHubAddress() instead
   */
  getMarketplaceHubAddress(chainId: number): string | undefined {
    return this.getUserHubAddress(chainId);
  }

  /**
   * Get default chain ID
   */
  getDefaultChainId(): number {
    const chainIdStr = this.get("NEXT_PUBLIC_DEFAULT_CHAIN_ID");
    return parseInt(chainIdStr || "31337", 10);
  }

  /**
   * Check if configuration is complete for a specific chain
   */
  isConfiguredForChain(chainId: number): boolean {
    const hubAddress = this.getUserHubAddress(chainId);
    return !!hubAddress && hubAddress.length > 0;
  }

  /**
   * Get allowlist addresses as array
   * Parses comma-separated string into array of addresses
   */
  getAllowlistAddresses(): string[] {
    const allowlistStr = this.get("NEXT_PUBLIC_DEFAULT_ALLOWLIST");

    if (!allowlistStr || allowlistStr.trim() === "") {
      return [];
    }

    // Split by comma and clean up addresses
    return allowlistStr
      .split(",")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);
  }

  /**
   * Get RPC URL for a specific chain
   */
  getRpcUrl(chainId: number): string | undefined {
    const config = this.getConfig();

    switch (chainId) {
      case 31337:
        return config.NEXT_PUBLIC_RPC_URL_LOCAL;
      case 11155111:
        return config.NEXT_PUBLIC_RPC_URL_SEPOLIA;
      case 1:
        return config.NEXT_PUBLIC_RPC_URL_MAINNET;
      default:
        return undefined;
    }
  }
}

export const envConfigManager = EnvConfigManager.getInstance();

/**
 * Helper function to get environment variable
 * @deprecated Use envConfigManager.get() instead
 */
export function getEnv(key: string): string | undefined {
  return envConfigManager.get(key);
}
