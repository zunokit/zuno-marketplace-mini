/**
 * Runtime Environment Configuration Utility
 * Priority: localStorage > process.env
 */

import type { EnvConfig } from '@/types/env-config';
import { envStorageService } from '@/lib/services/env-storage.service';

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
        process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || '31337',
      NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL:
        process.env.NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL,
      NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA:
        process.env.NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA,
      NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET:
        process.env.NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET,
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
      throw new Error(
        `Invalid configuration: ${validation.errors.join(', ')}`
      );
    }

    // Save to localStorage
    envStorageService.save(config);

    // Update cache
    this.cachedConfig = config;

    // Trigger reload to apply new configuration
    if (typeof window !== 'undefined') {
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
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  /**
   * Check if using localStorage configuration
   */
  isUsingStoredConfig(): boolean {
    return envStorageService.hasStoredConfig();
  }

  /**
   * Get chain-specific MarketplaceHub address
   */
  getMarketplaceHubAddress(chainId: number): string | undefined {
    const config = this.getConfig();

    switch (chainId) {
      case 31337:
        return config.NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL;
      case 11155111:
        return config.NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA;
      case 1:
        return config.NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET;
      default:
        return undefined;
    }
  }

  /**
   * Get default chain ID
   */
  getDefaultChainId(): number {
    const chainIdStr = this.get('NEXT_PUBLIC_DEFAULT_CHAIN_ID');
    return parseInt(chainIdStr || '31337', 10);
  }

  /**
   * Check if configuration is complete for a specific chain
   */
  isConfiguredForChain(chainId: number): boolean {
    const hubAddress = this.getMarketplaceHubAddress(chainId);
    return !!hubAddress && hubAddress.length > 0;
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
