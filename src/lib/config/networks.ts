/**
 * Network Configuration
 * Centralized network and contract configuration with localStorage priority
 */

import { envConfigManager } from '@/lib/utils/env-config';

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  hubAddress?: string;
  isTestnet?: boolean;
  blockExplorer?: string;
}

/**
 * Get network configuration with localStorage priority
 * Priority: localStorage (Settings Modal) > process.env
 */
function getNetworkConfigMap(): Record<number, NetworkConfig> {
  // Get config from envConfigManager (handles localStorage > process.env priority)
  const hubLocal = envConfigManager.getMarketplaceHubAddress(31337);
  const hubSepolia = envConfigManager.getMarketplaceHubAddress(11155111);
  const hubMainnet = envConfigManager.getMarketplaceHubAddress(1);

  return {
    // Local Network (Anvil/Hardhat)
    31337: {
      chainId: 31337,
      name: 'Local Network',
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_LOCAL || 'http://127.0.0.1:8545',
      hubAddress: hubLocal,
      isTestnet: true
    },

    // Sepolia Testnet
    11155111: {
      chainId: 11155111,
      name: 'Sepolia',
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || 'https://rpc.sepolia.org',
      hubAddress: hubSepolia,
      isTestnet: true,
      blockExplorer: 'https://sepolia.etherscan.io'
    },

    // Ethereum Mainnet
    1: {
      chainId: 1,
      name: 'Ethereum',
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_MAINNET || 'https://eth.public-rpc.com',
      hubAddress: hubMainnet,
      isTestnet: false,
      blockExplorer: 'https://etherscan.io'
    }
  };
}

export function getDefaultChainId(): number {
  return envConfigManager.getDefaultChainId();
}

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return getNetworkConfigMap()[chainId];
}

export function getHubAddress(chainId: number): string | undefined {
  return envConfigManager.getMarketplaceHubAddress(chainId);
}

export function isNetworkSupported(chainId: number): boolean {
  const hubAddress = getHubAddress(chainId);
  return !!hubAddress && hubAddress.length > 0;
}
