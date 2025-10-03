import { ENV } from "@/lib/config/env";

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  11155111: {
    COLLECTION_FACTORY:
      process.env.NEXT_PUBLIC_COLLECTION_FACTORY_SEPOLIA ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    ERC721_EXCHANGE:
      process.env.NEXT_PUBLIC_ERC721_EXCHANGE_SEPOLIA ||
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    ERC1155_EXCHANGE:
      process.env.NEXT_PUBLIC_ERC1155_EXCHANGE_SEPOLIA ||
      "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    AUCTION_FACTORY:
      process.env.NEXT_PUBLIC_AUCTION_FACTORY_SEPOLIA ||
      "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    BUNDLE_MANAGER:
      process.env.NEXT_PUBLIC_BUNDLE_MANAGER_SEPOLIA ||
      "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    OFFER_MANAGER:
      process.env.NEXT_PUBLIC_OFFER_MANAGER_SEPOLIA ||
      "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    COLLECTION_VERIFIER:
      process.env.NEXT_PUBLIC_COLLECTION_VERIFIER_SEPOLIA ||
      "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    FEE_MANAGER:
      process.env.NEXT_PUBLIC_FEE_MANAGER_SEPOLIA ||
      "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    ROYALTY_MANAGER:
      process.env.NEXT_PUBLIC_ROYALTY_MANAGER_SEPOLIA ||
      "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    ACCESS_CONTROL:
      process.env.NEXT_PUBLIC_ACCESS_CONTROL_SEPOLIA ||
      "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    EMERGENCY_MANAGER:
      process.env.NEXT_PUBLIC_EMERGENCY_MANAGER_SEPOLIA ||
      "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
  },

  // Local development
  31337: {
    COLLECTION_FACTORY:
      process.env.NEXT_PUBLIC_COLLECTION_FACTORY_LOCAL ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    ERC721_EXCHANGE:
      process.env.NEXT_PUBLIC_ERC721_EXCHANGE_LOCAL ||
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    ERC1155_EXCHANGE:
      process.env.NEXT_PUBLIC_ERC1155_EXCHANGE_LOCAL ||
      "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    AUCTION_FACTORY:
      process.env.NEXT_PUBLIC_AUCTION_FACTORY_LOCAL ||
      "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    BUNDLE_MANAGER:
      process.env.NEXT_PUBLIC_BUNDLE_MANAGER_LOCAL ||
      "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    OFFER_MANAGER:
      process.env.NEXT_PUBLIC_OFFER_MANAGER_LOCAL ||
      "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    COLLECTION_VERIFIER:
      process.env.NEXT_PUBLIC_COLLECTION_VERIFIER_LOCAL ||
      "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    FEE_MANAGER:
      process.env.NEXT_PUBLIC_FEE_MANAGER_LOCAL ||
      "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    ROYALTY_MANAGER:
      process.env.NEXT_PUBLIC_ROYALTY_MANAGER_LOCAL ||
      "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    ACCESS_CONTROL:
      process.env.NEXT_PUBLIC_ACCESS_CONTROL_LOCAL ||
      "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    EMERGENCY_MANAGER:
      process.env.NEXT_PUBLIC_EMERGENCY_MANAGER_LOCAL ||
      "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
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
