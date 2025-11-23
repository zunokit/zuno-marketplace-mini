/**
 * Environment Configuration Manager
 * Manages runtime environment configuration with localStorage support
 */

import { logger } from "./logger";

export interface EnvConfig {
  NEXT_PUBLIC_DEFAULT_CHAIN_ID?: string;
  NEXT_PUBLIC_RPC_URL_LOCAL?: string;
  NEXT_PUBLIC_RPC_URL_SEPOLIA?: string;
  NEXT_PUBLIC_RPC_URL_MAINNET?: string;
  NEXT_PUBLIC_DEFAULT_ALLOWLIST?: string;
  NEXT_PUBLIC_ZUNO_API_URL?: string;
  NEXT_PUBLIC_ZUNO_API_KEY?: string;
  [key: string]: string | undefined;
}

class EnvConfigManager {
  private readonly STORAGE_KEY = "zuno-marketplace-env-config";

  /**
   * Get configuration value with fallback to process.env
   */
  private getValue(key: string): string | undefined {
    // Try localStorage first (runtime config)
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const config = JSON.parse(stored) as EnvConfig;
          if (config[key]) {
            return config[key];
          }
        }
      } catch (error) {
        logger.warn(
          "Failed to read from localStorage",
          { error },
          { component: "EnvConfigManager", action: "getValue" }
        );
      }
    }

    // Fallback to process.env
    return process.env[key];
  }

  /**
   * Get all configuration
   */
  getConfig(): EnvConfig {
    const config: EnvConfig = {};

    // List of known config keys
    const keys = [
      "NEXT_PUBLIC_DEFAULT_CHAIN_ID",
      "NEXT_PUBLIC_RPC_URL_LOCAL",
      "NEXT_PUBLIC_RPC_URL_SEPOLIA",
      "NEXT_PUBLIC_RPC_URL_MAINNET",
      "NEXT_PUBLIC_DEFAULT_ALLOWLIST",
      "NEXT_PUBLIC_ZUNO_API_URL",
      "NEXT_PUBLIC_ZUNO_API_KEY",
    ];

    for (const key of keys) {
      const value = this.getValue(key);
      if (value) {
        config[key] = value;
      }
    }

    return config;
  }

  /**
   * Set configuration (saves to localStorage)
   */
  setConfig(config: Partial<EnvConfig>): void {
    if (typeof window === "undefined") {
      logger.warn(
        "Cannot set config in non-browser environment",
        {},
        { component: "EnvConfigManager", action: "setConfig" }
      );
      return;
    }

    try {
      const existing = this.getConfig();
      const merged = { ...existing, ...config };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
      logger.success(
        "Configuration saved",
        { keys: Object.keys(config) },
        { component: "EnvConfigManager", action: "setConfig" }
      );
    } catch (error) {
      logger.error("Failed to save configuration", error as Error, {
        component: "EnvConfigManager",
        action: "setConfig",
      });
    }
  }

  /**
   * Clear configuration (removes from localStorage)
   */
  clearConfig(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      logger.info(
        "Configuration cleared",
        {},
        { component: "EnvConfigManager", action: "clearConfig" }
      );
    } catch (error) {
      logger.error("Failed to clear configuration", error as Error, {
        component: "EnvConfigManager",
        action: "clearConfig",
      });
    }
  }

  /**
   * Get default chain ID
   */
  getDefaultChainId(): number {
    const value = this.getValue("NEXT_PUBLIC_DEFAULT_CHAIN_ID");
    return value ? parseInt(value, 10) : 31337; // Default to local
  }

  /**
   * Get allowlist addresses
   */
  getAllowlistAddresses(): string[] {
    const value = this.getValue("NEXT_PUBLIC_DEFAULT_ALLOWLIST");
    if (!value) return [];

    // Split by comma or newline
    return value
      .split(/[,\n]/)
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);
  }

  /**
   * Get RPC URL for specific chain
   */
  getRpcUrl(chainId: number): string | undefined {
    switch (chainId) {
      case 31337:
        return this.getValue("NEXT_PUBLIC_RPC_URL_LOCAL");
      case 11155111:
        return this.getValue("NEXT_PUBLIC_RPC_URL_SEPOLIA");
      case 1:
        return this.getValue("NEXT_PUBLIC_RPC_URL_MAINNET");
      default:
        return undefined;
    }
  }

  /**
   * Get Zuno API configuration
   */
  getZunoApiConfig(): { url?: string; apiKey?: string } {
    return {
      url: this.getValue("NEXT_PUBLIC_ZUNO_API_URL"),
      apiKey: this.getValue("NEXT_PUBLIC_ZUNO_API_KEY"),
    };
  }
}

/**
 * Singleton instance
 */
export const envConfigManager = new EnvConfigManager();
