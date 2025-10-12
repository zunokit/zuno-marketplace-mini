/**
 * Runtime Environment Configuration Types
 * Supports dynamic configuration via localStorage with .env fallback
 */

export interface EnvVariable {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
}

export interface EnvConfig {
  NEXT_PUBLIC_DEFAULT_CHAIN_ID: string;
  NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL?: string;
  NEXT_PUBLIC_DEFAULT_ALLOWLIST?: string;
  NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA?: string;
  NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET?: string;
  NEXT_PUBLIC_RPC_URL_LOCAL?: string;
  NEXT_PUBLIC_RPC_URL_SEPOLIA?: string;
  NEXT_PUBLIC_RPC_URL_MAINNET?: string;
  [key: string]: string | undefined;
}

export interface EnvConfigState {
  variables: EnvVariable[];
  isValid: boolean;
  errors: string[];
}

export const ENV_VARIABLE_DEFINITIONS: EnvVariable[] = [
  {
    key: "NEXT_PUBLIC_DEFAULT_CHAIN_ID",
    value: "",
    description: "Default chain ID (31337=Local, 11155111=Sepolia, 1=Mainnet)",
    required: true,
  },
  {
    key: "NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL",
    value: "",
    description: "MarketplaceHub contract address for local network",
    required: false,
  },
  {
    key: "NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA",
    value: "",
    description: "MarketplaceHub contract address for Sepolia testnet",
    required: false,
  },
  {
    key: "NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET",
    value: "",
    description: "MarketplaceHub contract address for Ethereum mainnet",
    required: false,
  },
  {
    key: "NEXT_PUBLIC_RPC_URL_LOCAL",
    value: "http://127.0.0.1:8545",
    description: "RPC URL for local network (Anvil/Hardhat)",
    required: false,
  },
  {
    key: "NEXT_PUBLIC_RPC_URL_SEPOLIA",
    value: "https://rpc.sepolia.org",
    description: "RPC URL for Sepolia testnet",
    required: false,
  },
  {
    key: "NEXT_PUBLIC_RPC_URL_MAINNET",
    value: "https://eth.public-rpc.com",
    description: "RPC URL for Ethereum mainnet",
    required: false,
  },
  {
    key: "NEXT_PUBLIC_DEFAULT_ALLOWLIST",
    value: "",
    description: "Default allowlist addresses (comma-separated)",
    required: true,
  },
];

export const ENV_STORAGE_KEY = "zuno_marketplace_env_config";
