/**
 * Collection-related type definitions
 */

import type { NFTType } from "./contract";

/**
 * Parameters for creating a new collection
 */
export type CreateCollectionParams = {
  name: string;
  symbol: string;
  owner?: string;
  description?: string;
  mintPrice?: string;
  royaltyFee?: string;
  maxSupply?: string;
  mintLimitPerWallet?: string;
  mintStartTime?: string;
  allowlistMintPrice?: string;
  publicMintPrice?: string;
  allowlistStageDuration?: string; // Duration in seconds (default 24h = 86400)
  baseURI?: string;
  tokenType: NFTType;
  allowlist?: string[]; // Array of addresses to add to allowlist
};

/**
 * Parameters for minting NFTs
 */
export type MintParams = {
  collection: string;
  to: string;
  amount?: string; // For ERC1155, default 1
  tokenType: NFTType;
  value?: string; // ETH value to send with transaction
};

/**
 * Parameters for transferring NFTs
 */
export type TransferParams = {
  collection: string;
  tokenId: string;
  amount: string;
  tokenType: NFTType;
  to: string;
};

/**
 * Collection information
 */
export type CollectionInfo = {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  tokenType: NFTType;
  maxSupply?: string;
  mintPrice?: string;
  baseURI?: string;
};

/**
 * Mint information for a collection
 */
export type MintInfo = {
  currentMintPrice: string;
  isAllowlisted: boolean;
  mintedPerWallet: string;
  mintLimitPerWallet: string;
  totalMinted: string;
  maxSupply: string;
  canMint: boolean;
  mintStage: MintStage;
};

/**
 * Mint stages
 */
export type MintStage = "not_started" | "allowlist" | "public" | "unknown";

/**
 * Collection verification result
 */
export type CollectionVerification = {
  isValid: boolean;
  tokenType: string;
};

/**
 * Minted token information
 */
export type MintedToken = {
  tokenId: string;
  amount: string;
};
