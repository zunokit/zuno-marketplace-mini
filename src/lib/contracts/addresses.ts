import { ENV } from "@/lib/config/env";

// Contract addresses for different networks
// Addresses from frontend-foundry deployment
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  11155111: {
    // Core Marketplace
    NFT_EXCHANGE_REGISTRY:
      process.env.NEXT_PUBLIC_NFT_EXCHANGE_REGISTRY_SEPOLIA || "",
    COLLECTION_FACTORY_REGISTRY:
      process.env.NEXT_PUBLIC_COLLECTION_FACTORY_REGISTRY_SEPOLIA || "",

    // Listing Management
    LISTING_MANAGER: process.env.NEXT_PUBLIC_LISTING_MANAGER_SEPOLIA || "",
    LISTING_VALIDATOR: process.env.NEXT_PUBLIC_LISTING_VALIDATOR_SEPOLIA || "",
    LISTING_HISTORY_TRACKER:
      process.env.NEXT_PUBLIC_LISTING_HISTORY_TRACKER_SEPOLIA || "",

    // Advanced Features
    AUCTION_FACTORY: process.env.NEXT_PUBLIC_AUCTION_FACTORY_SEPOLIA || "",
    OFFER_MANAGER: process.env.NEXT_PUBLIC_OFFER_MANAGER_SEPOLIA || "",
    BUNDLE_MANAGER: process.env.NEXT_PUBLIC_BUNDLE_MANAGER_SEPOLIA || "",

    // Admin & Management
    FEE_MANAGER: process.env.NEXT_PUBLIC_FEE_MANAGER_SEPOLIA || "",
    ROYALTY_MANAGER: process.env.NEXT_PUBLIC_ROYALTY_MANAGER_SEPOLIA || "",
    ACCESS_CONTROL: process.env.NEXT_PUBLIC_ACCESS_CONTROL_SEPOLIA || "",
    COLLECTION_VERIFIER:
      process.env.NEXT_PUBLIC_COLLECTION_VERIFIER_SEPOLIA || "",
    EMERGENCY_MANAGER: process.env.NEXT_PUBLIC_EMERGENCY_MANAGER_SEPOLIA || "",
  },

  // Local development (addresses from frontend-foundry deployment)
  31337: {
    // Core Marketplace
    NFT_EXCHANGE_REGISTRY:
      process.env.NEXT_PUBLIC_NFT_EXCHANGE_REGISTRY_LOCAL ||
      "0xa722bda6968f50778b973ae2701e90200c564b49",
    COLLECTION_FACTORY_REGISTRY:
      process.env.NEXT_PUBLIC_COLLECTION_FACTORY_REGISTRY_LOCAL ||
      "0x942ed2fa862887dc698682cc6a86355324f0f01e",

    // Listing Management
    LISTING_MANAGER:
      process.env.NEXT_PUBLIC_LISTING_MANAGER_LOCAL ||
      "0x0fe4223ad99df788a6dcad148eb4086e6389ceb6",
    LISTING_VALIDATOR:
      process.env.NEXT_PUBLIC_LISTING_VALIDATOR_LOCAL ||
      "0x683d9cdd3239e0e01e8dc6315fa50ad92ab71d2d",
    LISTING_HISTORY_TRACKER:
      process.env.NEXT_PUBLIC_LISTING_HISTORY_TRACKER_LOCAL ||
      "0x1c9fd50df7a4f066884b58a05d91e4b55005876a",

    // Advanced Features
    AUCTION_FACTORY:
      process.env.NEXT_PUBLIC_AUCTION_FACTORY_LOCAL ||
      "0xc7cdb7a2e5dda1b7a0e792fe1ef08ed20a6f56d4",
    OFFER_MANAGER:
      process.env.NEXT_PUBLIC_OFFER_MANAGER_LOCAL ||
      "0x71a0b8a2245a9770a4d887ce1e4ecc6c1d4ff28c",
    BUNDLE_MANAGER:
      process.env.NEXT_PUBLIC_BUNDLE_MANAGER_LOCAL ||
      "0xb185e9f6531ba9877741022c92ce858cdcc5760e",

    // Admin & Management
    FEE_MANAGER:
      process.env.NEXT_PUBLIC_FEE_MANAGER_LOCAL ||
      "0x8e264821afa98dd104eecfcfa7fd9f8d8b320ada",
    ROYALTY_MANAGER:
      process.env.NEXT_PUBLIC_ROYALTY_MANAGER_LOCAL ||
      "0x871acbeabbaf8bed65c22ba7132becfabf8c27b5",
    ACCESS_CONTROL:
      process.env.NEXT_PUBLIC_ACCESS_CONTROL_LOCAL ||
      "0x0aec7c174554af8aec3680bb58431f6618311510",
    COLLECTION_VERIFIER:
      process.env.NEXT_PUBLIC_COLLECTION_VERIFIER_LOCAL ||
      "0xc1e0a9db9ea830c52603798481045688c8ae99c2",
    EMERGENCY_MANAGER:
      process.env.NEXT_PUBLIC_EMERGENCY_MANAGER_LOCAL ||
      "0x6a59cc73e334b018c9922793d96df84b538e6fd5",
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
 * Get specific contract address
 */
export function getContractAddress(
  contractName: keyof (typeof CONTRACT_ADDRESSES)[31337],
  chainId: number = 31337
): string {
  const addresses = getContractAddresses(chainId);
  const address = addresses[contractName];

  if (!address) {
    throw new Error(
      `Contract address not found: ${contractName} on chain ${chainId}`
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
