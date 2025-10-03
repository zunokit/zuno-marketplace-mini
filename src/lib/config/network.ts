/**
 * Network Configuration
 * Ported from frontend-foundry/src/contracts/network.js
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Local development network (Anvil)
export const LOCAL_NETWORK: NetworkConfig = {
  chainId: 31337,
  name: "Anvil Local",
  rpcUrl: process.env.NEXT_PUBLIC_LOCAL_RPC_URL || "http://localhost:8545",
  blockExplorer: "http://localhost:8545",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

// Sepolia testnet
export const SEPOLIA_NETWORK: NetworkConfig = {
  chainId: 11155111,
  name: "Sepolia",
  rpcUrl:
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
    "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  blockExplorer: "https://sepolia.etherscan.io",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

// Ethereum mainnet
export const MAINNET_NETWORK: NetworkConfig = {
  chainId: 1,
  name: "Ethereum Mainnet",
  rpcUrl:
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
    "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
  blockExplorer: "https://etherscan.io",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

// All supported networks
export const SUPPORTED_NETWORKS = {
  [LOCAL_NETWORK.chainId]: LOCAL_NETWORK,
  [SEPOLIA_NETWORK.chainId]: SEPOLIA_NETWORK,
  [MAINNET_NETWORK.chainId]: MAINNET_NETWORK,
};

// Current network configuration (default to local)
export const NETWORK_CONFIG = LOCAL_NETWORK;

/**
 * Get network configuration by chain ID
 */
export function getNetworkConfig(chainId: number | string): NetworkConfig {
  const id = typeof chainId === "string" ? parseInt(chainId, 16) : chainId;

  switch (id) {
    case 31337:
    case 0x7a69:
      return LOCAL_NETWORK;
    case 11155111:
    case 0xaa36a7:
      return SEPOLIA_NETWORK;
    case 1:
    case 0x1:
      return MAINNET_NETWORK;
    default:
      console.warn(
        `Unknown chain ID: ${chainId}, falling back to local network`
      );
      return LOCAL_NETWORK;
  }
}

/**
 * Check if chain ID is local network
 */
export function isLocalNetwork(chainId: number | string): boolean {
  const id = typeof chainId === "string" ? parseInt(chainId, 16) : chainId;
  return id === 31337 || id === 0x7a69;
}

/**
 * Check if chain ID is test network
 */
export function isTestNetwork(chainId: number | string): boolean {
  const id = typeof chainId === "string" ? parseInt(chainId, 16) : chainId;
  return id === 11155111 || id === 0xaa36a7;
}

/**
 * Check if chain ID is main network
 */
export function isMainNetwork(chainId: number | string): boolean {
  const id = typeof chainId === "string" ? parseInt(chainId, 16) : chainId;
  return id === 1 || id === 0x1;
}

/**
 * Get supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(SUPPORTED_NETWORKS).map(Number);
}

/**
 * Check if chain ID is supported
 */
export function isSupportedNetwork(chainId: number | string): boolean {
  const id = typeof chainId === "string" ? parseInt(chainId, 16) : chainId;
  return id in SUPPORTED_NETWORKS;
}
