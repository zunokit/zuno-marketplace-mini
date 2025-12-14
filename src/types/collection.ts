/**
 * Collection-related type definitions
 * Uses SDK types for type safety
 */

import type {
  CollectionParams as SDKCollectionParams,
  MintERC721Params,
  BatchMintERC721Params,
  MintERC1155Params,
  TokenStandard,
} from "zuno-marketplace-sdk";

/**
 * Token type - re-export from SDK
 */
export type NFTType = TokenStandard;

/**
 * Parameters for creating a new collection
 * Extends SDK CollectionParams with app-specific fields
 */
export interface CreateCollectionParams extends SDKCollectionParams {
  tokenType: NFTType;
  // App-specific fields not in SDK
  allowlist?: string[];
  baseTokenURI?: string;
}

/**
 * Parameters for minting ERC721 NFTs - re-export from SDK
 */
export type MintERC721 = MintERC721Params;

/**
 * Parameters for batch minting ERC721 NFTs - re-export from SDK
 */
export type BatchMintERC721 = BatchMintERC721Params;

/**
 * Parameters for minting ERC1155 NFTs - re-export from SDK
 */
export type MintERC1155 = MintERC1155Params;

/**
 * Legacy mint params for backwards compatibility
 */
export type MintParams = {
  collection: string;
  to: string;
  amount?: string;
  tokenType: NFTType;
  value?: string;
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
  description?: string;
  totalSupply: string;
  tokenType: NFTType;
  maxSupply?: string;
  mintPrice?: string;
  royaltyFee?: string;
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
