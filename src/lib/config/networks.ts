/**
 * Network Configuration
 * Centralized network and contract configuration
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  hubAddress?: string;
  isTestnet?: boolean;
  blockExplorer?: string;
}

export const NETWORK_CONFIG: Record<number, NetworkConfig> = {
  // Local Network (Anvil/Hardhat)
  31337: {
    chainId: 31337,
    name: 'Local Network',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_LOCAL || 'http://127.0.0.1:8545',
    hubAddress: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL,
    isTestnet: true
  },
  
  // Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || 'https://rpc.sepolia.org',
    hubAddress: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA,
    isTestnet: true,
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_MAINNET || 'https://eth.public-rpc.com',
    hubAddress: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET,
    isTestnet: false,
    blockExplorer: 'https://etherscan.io'
  }
};

export const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || 31337);

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return NETWORK_CONFIG[chainId];
}

export function getHubAddress(chainId: number): string | undefined {
  return NETWORK_CONFIG[chainId]?.hubAddress;
}

export function isNetworkSupported(chainId: number): boolean {
  return chainId in NETWORK_CONFIG && !!NETWORK_CONFIG[chainId].hubAddress;
}
