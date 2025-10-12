/**
 * Network Configuration
 * Centralized network and contract configuration with localStorage priority
 */

import { envConfigManager } from "@/lib/utils/env-config";

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

  // Get RPC URLs from config manager (handles localStorage > process.env priority)
  const rpcLocal = envConfigManager.getRpcUrl(31337) || "http://127.0.0.1:8545";
  const rpcSepolia =
    envConfigManager.getRpcUrl(11155111) || "https://rpc.sepolia.org";
  const rpcMainnet =
    envConfigManager.getRpcUrl(1) || "https://eth.public-rpc.com";

  return {
    // Local Network (Anvil/Hardhat)
    31337: {
      chainId: 31337,
      name: "Local Network",
      rpcUrl: rpcLocal,
      hubAddress: hubLocal,
      isTestnet: true,
    },

    // Sepolia Testnet
    11155111: {
      chainId: 11155111,
      name: "Sepolia",
      rpcUrl: rpcSepolia,
      hubAddress: hubSepolia,
      isTestnet: true,
      blockExplorer: "https://sepolia.etherscan.io",
    },

    // Ethereum Mainnet
    1: {
      chainId: 1,
      name: "Ethereum",
      rpcUrl: rpcMainnet,
      hubAddress: hubMainnet,
      isTestnet: false,
      blockExplorer: "https://etherscan.io",
    },
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
