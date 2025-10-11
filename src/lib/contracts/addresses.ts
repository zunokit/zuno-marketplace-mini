import { ENV } from "@/lib/config/env";

/**
 * Contract addresses for different networks
 *
 * IMPORTANT: Frontend now uses MarketplaceHub as single entry point
 * Hub provides getAllAddresses() to discover all contract addresses
 * Only MarketplaceHub address is required per network
 */
export const CONTRACT_ADDRESSES = {
  // Ethereum Mainnet
  1: {
    // Single entry point - Hub provides all other addresses
    MARKETPLACE_HUB: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET || "",
  },

  // Sepolia Testnet
  11155111: {
    // Single entry point - Hub provides all other addresses
    MARKETPLACE_HUB: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA || "",
  },

  // Local development (Hardhat/Anvil)
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
    console.log(`Supported chains: ${Object.keys(CONTRACT_ADDRESSES).join(", ")}`);
    // Return empty configuration for unsupported networks
    return {
      MARKETPLACE_HUB: "",
    };
  }
  return addresses;
}

/**
 * Get MarketplaceHub address for network
 */
export function getMarketplaceHubAddress(chainId: number = 31337): string {
  const addresses = getContractAddresses(chainId);
  const address = addresses.MARKETPLACE_HUB;

  // Don't throw for unsupported networks, return empty string
  if (!address) {
    console.warn(
      `MarketplaceHub address not configured for chain ${chainId}`
    );
    return "";
  }

  return address;
}


