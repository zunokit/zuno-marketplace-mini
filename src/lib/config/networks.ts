/**
 * Network Configuration
 * Simplified network configuration without hardcoded addresses
 * Contract addresses are fetched dynamically from API
 */

import { getHubAddressFromManager } from "@/lib/services/contracts/utils/AddressManager";

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  isTestnet?: boolean;
  blockExplorer?: string;
}

/**
 * Get network configuration
 * Contract addresses are fetched dynamically from API
 */
function getNetworkConfigMap(): Record<number, NetworkConfig> {
  return {
    // Local Network (Anvil/Hardhat)
    31337: {
      chainId: 31337,
      name: "Local Network",
      rpcUrl: "http://127.0.0.1:8545",
      isTestnet: true,
    },

    // Sepolia Testnet
    11155111: {
      chainId: 11155111,
      name: "Sepolia",
      rpcUrl: "https://rpc.sepolia.org",
      isTestnet: true,
      blockExplorer: "https://sepolia.etherscan.io",
    },

    // Ethereum Mainnet
    1: {
      chainId: 1,
      name: "Ethereum",
      rpcUrl: "https://eth.public-rpc.com",
      isTestnet: false,
      blockExplorer: "https://etherscan.io",
    },
  };
}

export function getDefaultChainId(): number {
  return 31337; // Default to local network for development
}

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return getNetworkConfigMap()[chainId];
}

export function getHubAddress(chainId: number): Promise<string> {
  return getHubAddressFromManager(chainId);
}

export function isNetworkSupported(chainId: number): boolean {
  return !!getNetworkConfig(chainId);
}
