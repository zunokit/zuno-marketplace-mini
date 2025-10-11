/**
 * Contract-related type definitions
 */

import { ethers } from "ethers";

/**
 * Configuration for a safe contract method call
 */
export interface SafeCallConfig<T> {
  method: string;
  fallback: T;
  transform?: (value: any) => T;
}

/**
 * Contract error structure
 */
export interface ContractError {
  reason?: string;
  message?: string;
  error?: { message?: string };
  code?: string | number;
  data?: string;
}

/**
 * NFT token types
 */
export type NFTType = 'ERC721' | 'ERC1155';

/**
 * Contract method result
 */
export type ContractMethodResult<T> = T | null;

/**
 * Batch call configuration
 */
export type BatchCallConfig<T extends readonly unknown[]> = {
  [K in keyof T]: SafeCallConfig<T[K]>;
};

/**
 * Contract transaction options
 */
export interface ContractTransactionOptions {
  value?: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
  nonce?: number;
}

/**
 * Token URI strategies
 */
export enum TokenURIStrategy {
  BASE_TOKEN_URI = 'baseTokenURI',
  TOKEN_URI = 'tokenURI',
  URI = 'uri'
}
