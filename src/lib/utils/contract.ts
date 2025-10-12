/**
 * Contract utility functions
 */

import { ethers } from "ethers";
import { logger } from "./logger";
import { INTERFACE_IDS } from "@/lib/constants";
import type {
  SafeCallConfig,
  BatchCallConfig,
  ContractError,
  NFTType,
} from "@/types/contract";

/**
 * Safely call a contract method with a fallback value
 * @param contract - The ethers contract instance
 * @param methodName - Name of the method to call
 * @param fallback - Fallback value if method doesn't exist or fails
 * @param transform - Optional transformation function for the result
 * @returns The method result or fallback value
 */
export async function safeContractCall<T>(
  contract: ethers.Contract,
  methodName: string,
  fallback: T,
  transform?: (value: any) => T
): Promise<T> {
  try {
    // Check if the method exists on the contract
    if (typeof contract[methodName] !== "function") {
      return fallback;
    }

    const result = await contract[methodName]();
    return transform ? transform(result) : result;
  } catch (error) {
    // Log error in development for debugging
    if (process.env.NODE_ENV === "development") {
      logger.debug(`Contract method ${methodName} failed`, error, {
        component: "ContractUtils",
        action: "safeContractCall",
        methodName,
      });
    }
    return fallback;
  }
}

/**
 * Batch call multiple contract methods safely in parallel
 * @param contract - The ethers contract instance
 * @param methodConfigs - Array of method configurations
 * @returns Array of results in the same order as methodConfigs
 */
export async function safeContractBatchCall<T extends readonly unknown[]>(
  contract: ethers.Contract,
  methodConfigs: BatchCallConfig<T>
): Promise<T> {
  const promises = (
    methodConfigs as Array<{
      method: string;
      fallback: unknown;
      transform?: (value: any) => unknown;
    }>
  ).map((config) =>
    safeContractCall(contract, config.method, config.fallback, config.transform)
  );

  return Promise.all(promises) as unknown as Promise<T>;
}

/**
 * Check if a contract implements a specific interface
 * @param contract - The ethers contract instance
 * @param interfaceId - The ERC165 interface ID to check
 * @returns Whether the contract supports the interface
 */
export async function supportsInterface(
  contract: ethers.Contract,
  interfaceId: string
): Promise<boolean> {
  try {
    if (typeof contract.supportsInterface !== "function") {
      return false;
    }
    return await contract.supportsInterface(interfaceId);
  } catch {
    return false;
  }
}

/**
 * Get the type of NFT contract (ERC721 or ERC1155)
 * @param contract - The ethers contract instance
 * @returns The token type or null if not recognized
 */
export async function detectNFTType(
  contract: ethers.Contract
): Promise<NFTType | null> {
  const [isERC721, isERC1155] = await Promise.all([
    supportsInterface(contract, INTERFACE_IDS.ERC721),
    supportsInterface(contract, INTERFACE_IDS.ERC1155),
  ]);

  if (isERC1155) return "ERC1155";
  if (isERC721) return "ERC721";
  return null;
}

/**
 * Format contract error for user-friendly message
 * @param error - The error object from contract call
 * @param defaultMessage - Default message if error can't be parsed
 * @returns User-friendly error message
 */
export function formatContractError(
  error: unknown,
  defaultMessage: string = "Transaction failed"
): string {
  const err = error as ContractError;

  // Check for common error patterns
  if (err.code === "ACTION_REJECTED" || err.code === 4001) {
    return "Transaction was rejected by user";
  }

  if (err.code === "INSUFFICIENT_FUNDS" || err.code === -32000) {
    return "Insufficient funds to complete transaction";
  }

  // Extract revert reason
  if (err.message?.includes("execution reverted")) {
    const match = err.message.match(/execution reverted: (.+?)(?:\"|$)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  // Try various error message fields
  return err.reason || err.error?.message || err.message || defaultMessage;
}
