/**
 * Environment Storage Service
 * Handles localStorage persistence for runtime environment configuration
 */

import type { EnvConfig, EnvVariable } from "@/types/env-config";
import { ENV_STORAGE_KEY, ENV_VARIABLE_DEFINITIONS } from "@/types/env-config";
import { logger } from "@/lib/utils/logger";

class EnvStorageService {
  private static instance: EnvStorageService;

  private constructor() {}

  static getInstance(): EnvStorageService {
    if (!EnvStorageService.instance) {
      EnvStorageService.instance = new EnvStorageService();
    }
    return EnvStorageService.instance;
  }

  /**
   * Check if running in browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  /**
   * Save environment configuration to localStorage
   */
  save(config: EnvConfig): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      logger.error("Failed to save environment config", error, {
        component: "EnvStorageService",
        action: "saveConfig",
      });
      throw new Error("Failed to save configuration to localStorage");
    }
  }

  /**
   * Load environment configuration from localStorage
   */
  load(): EnvConfig | null {
    if (!this.isBrowser()) return null;

    try {
      const stored = localStorage.getItem(ENV_STORAGE_KEY);
      if (!stored) return null;

      const config = JSON.parse(stored) as EnvConfig;
      return config;
    } catch (error) {
      logger.error("Failed to load environment config", error, {
        component: "EnvStorageService",
        action: "loadConfig",
      });
      return null;
    }
  }

  /**
   * Clear environment configuration from localStorage
   */
  clear(): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.removeItem(ENV_STORAGE_KEY);
    } catch (error) {
      logger.error("Failed to clear environment config", error, {
        component: "EnvStorageService",
        action: "clearConfig",
      });
    }
  }

  /**
   * Check if localStorage configuration exists
   */
  hasStoredConfig(): boolean {
    if (!this.isBrowser()) return false;
    return localStorage.getItem(ENV_STORAGE_KEY) !== null;
  }

  /**
   * Parse .env format text into EnvConfig
   * Supports formats:
   * - KEY=value
   * - KEY="value"
   * - KEY='value'
   * - # comments
   * - empty lines
   */
  parseEnvText(text: string): EnvConfig {
    const config: EnvConfig = {
      NEXT_PUBLIC_DEFAULT_CHAIN_ID: "",
    };

    const lines = text.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) continue;

      // Parse KEY=VALUE format
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!match) continue;

      const [, key, rawValue] = match;

      // Remove quotes if present
      let value = rawValue.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      config[key] = value;
    }

    return config;
  }

  /**
   * Convert EnvConfig to .env format text
   */
  toEnvText(config: EnvConfig): string {
    const lines: string[] = [];

    for (const def of ENV_VARIABLE_DEFINITIONS) {
      if (def.description) {
        lines.push(`# ${def.description}`);
      }
      const value = config[def.key] || "";
      lines.push(`${def.key}=${value}`);
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Validate environment configuration
   */
  validate(config: EnvConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required variables
    for (const def of ENV_VARIABLE_DEFINITIONS) {
      if (def.required && !config[def.key]) {
        errors.push(`${def.key} is required`);
      }
    }

    // Validate chain ID
    const chainId = config.NEXT_PUBLIC_DEFAULT_CHAIN_ID;
    if (chainId && !["1", "11155111", "31337"].includes(chainId)) {
      errors.push("Invalid chain ID. Must be 1, 11155111, or 31337");
    }

    // Validate contract addresses format (0x + 40 hex chars)
    const addressKeys = [
      "NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL",
      "NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA",
      "NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET",
    ];

    for (const key of addressKeys) {
      const address = config[key];
      if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        errors.push(`${key} must be a valid Ethereum address`);
      }
    }

    // Validate RPC URLs format
    const rpcUrlKeys = [
      "NEXT_PUBLIC_RPC_URL_LOCAL",
      "NEXT_PUBLIC_RPC_URL_SEPOLIA",
      "NEXT_PUBLIC_RPC_URL_MAINNET",
    ];

    for (const key of rpcUrlKeys) {
      const url = config[key];
      if (url && !/^https?:\/\/.+/.test(url)) {
        errors.push(`${key} must be a valid HTTP/HTTPS URL`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge configuration with defaults from ENV_VARIABLE_DEFINITIONS
   */
  mergeWithDefaults(config: Partial<EnvConfig>): EnvVariable[] {
    return ENV_VARIABLE_DEFINITIONS.map((def) => ({
      ...def,
      value: config[def.key] || def.value || "",
    }));
  }
}

export const envStorageService = EnvStorageService.getInstance();
