/**
 * Zuno Marketplace SDK Configuration
 *
 * This file configures the Zuno Marketplace SDK with proper API credentials
 * and network settings for the application.
 */

import { ZunoSDK, ZunoSDKConfig } from 'zuno-marketplace-sdk';
import { logger } from '@/lib/utils/logger';

/**
 * Default SDK configuration
 */
const defaultConfig: ZunoSDKConfig = {
  apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY || '',
  network: (process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID
    ? parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID)
    : 31337) as number | 'mainnet' | 'sepolia' | 'polygon' | 'arbitrum',
  apiUrl: process.env.NEXT_PUBLIC_ZUNO_API_URL,
  cache: {
    ttl: 300000, // 5 minutes cache for contract instances
    gcTime: 600000, // 10 minutes garbage collection
  },
  retryPolicy: {
    maxRetries: 3,
    backoff: 'exponential',
  },
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Create and configure Zuno SDK instance
 *
 * @param config - Optional override configuration
 * @returns Configured ZunoSDK instance
 *
 * @example
 * ```ts
 * import { createSDK } from '@/lib/config/zuno-sdk';
 *
 * // Use default config
 * const sdk = createSDK();
 *
 * // Override network for specific use case
 * const mainnetSDK = createSDK({ network: 'mainnet' });
 * ```
 */
export function createSDK(config: Partial<ZunoSDKConfig> = {}): ZunoSDK {
  const finalConfig = { ...defaultConfig, ...config };

  // Validate required configuration
  if (!finalConfig.apiKey) {
    throw new Error('Zuno SDK API key is required. Set NEXT_PUBLIC_ZUNO_API_KEY in your environment.');
  }

  if (!finalConfig.apiUrl) {
    throw new Error('Zuno SDK API URL is required. Set NEXT_PUBLIC_ZUNO_API_URL in your environment.');
  }

  return new ZunoSDK(finalConfig);
}

/**
 * Default SDK instance using environment configuration
 * This is the primary SDK instance that should be used throughout the application
 */
export const sdk = createSDK();

/**
 * Create SDK for specific network
 * Helper function to create SDK instances for different networks
 *
 * @param network - Target network
 * @param config - Optional additional configuration
 * @returns ZunoSDK instance configured for the specified network
 */
export function createSDKForNetwork(
  network: 'mainnet' | 'sepolia' | 'polygon' | 'arbitrum' | number,
  config: Partial<ZunoSDKConfig> = {}
): ZunoSDK {
  return createSDK({ ...config, network });
}

/**
 * Network-specific SDK instances
 * These can be used for multi-network applications
 */
export const sepoliaSDK = createSDKForNetwork('sepolia');
export const mainnetSDK = createSDKForNetwork('mainnet');
export const localSDK = createSDKForNetwork(31337);

/**
 * SDK initialization utilities
 */

/**
 * Initialize SDK with prefetching
 * Preloads common ABIs for better performance
 *
 * @param sdk - SDK instance to initialize (defaults to default SDK)
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeSDK(sdkInstance: ZunoSDK = sdk): Promise<void> {
  try {
    // Prefetch common ABIs for better performance
    // Note: SDK v1.0.1 changed prefetchABIs API - no longer takes arguments
    await sdkInstance.prefetchABIs();

    logger.success('Zuno SDK initialized successfully', undefined, {
      component: 'ZunoSDK',
      action: 'initializeSDK'
    });
  } catch (error) {
    logger.error('Failed to initialize Zuno SDK', error, {
      component: 'ZunoSDK',
      action: 'initializeSDK'
    });
    throw error;
  }
}

/**
 * Get current network configuration as string
 * Useful for debugging and UI display
 */
export function getNetworkDisplay(network: ZunoSDKConfig['network']): string {
  if (typeof network === 'number') {
    switch (network) {
      case 1:
        return 'Ethereum Mainnet';
      case 11155111:
        return 'Sepolia Testnet';
      case 31337:
        return 'Local Development';
      case 137:
        return 'Polygon';
      case 42161:
        return 'Arbitrum One';
      default:
        return `Chain ID: ${network}`;
    }
  }

  switch (network) {
    case 'mainnet':
      return 'Ethereum Mainnet';
    case 'sepolia':
      return 'Sepolia Testnet';
    case 'polygon':
      return 'Polygon';
    case 'arbitrum':
      return 'Arbitrum One';
    default:
      return network;
  }
}

/**
 * Validate SDK configuration
 * Checks if all required environment variables are set
 *
 * @returns { isValid: boolean, errors: string[] } Validation result
 */
export function validateSDKConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_ZUNO_API_KEY) {
    errors.push('NEXT_PUBLIC_ZUNO_API_KEY is not set');
  }

  if (!process.env.NEXT_PUBLIC_ZUNO_API_URL) {
    errors.push('NEXT_PUBLIC_ZUNO_API_URL is not set');
  }

  if (process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID) {
    const chainId = parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID);
    if (isNaN(chainId) || chainId <= 0) {
      errors.push('NEXT_PUBLIC_DEFAULT_CHAIN_ID must be a valid positive integer');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Export the configuration for external use
 */
export { defaultConfig };