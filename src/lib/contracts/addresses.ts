import { ENV } from "@/lib/config/env";

/**
 * Contract addresses for different networks
 *
 * IMPORTANT: Frontend now uses MarketplaceHub as single entry point
 * Hub provides getAllAddresses() to discover all contract addresses
 * Only MarketplaceHub address is required per network
 */
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  11155111: {
    // Single entry point - Hub provides all other addresses
    MARKETPLACE_HUB: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA || "",
  },

  // Local development
  31337: {
    // Single entry point - Hub provides all other addresses
    MARKETPLACE_HUB:
      process.env.NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL || "",
  },
};

/**
 * Get contract addresses for current network
 */
export function getContractAddresses(chainId: number = 31337) {
  const addresses =
    CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    console.warn(`No contract addresses found for chain ID: ${chainId}`);
    return CONTRACT_ADDRESSES[31337]; // Fallback to local
  }
  return addresses;
}

/**
 * Get MarketplaceHub address for network
 */
export function getMarketplaceHubAddress(chainId: number = 31337): string {
  const addresses = getContractAddresses(chainId);
  const address = addresses.MARKETPLACE_HUB;

  if (!address) {
    throw new Error(
      `MarketplaceHub address not found for chain ${chainId}`
    );
  }

  return address;
}

/**
 * Supported networks configuration
 */
export const SUPPORTED_NETWORKS = {
  11155111: {
    name: "Ethereum Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  31337: {
    name: "Local Network",
    rpcUrl: "http://localhost:8545",
    blockExplorer: "http://localhost:8545",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
};
