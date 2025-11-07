/**
 * Contract Validator Utility
 * Centralized validation for smart contract inputs
 *
 * Provides validation functions for addresses, amounts, fees, and other
 * contract parameters to ensure data integrity before blockchain transactions.
 */

import { ethers } from "ethers";
import { CONTRACT_CONSTANTS } from "@/lib/constants";

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ContractValidator {
  /**
   * Validate Ethereum address format
   *
   * @param address - Address to validate
   * @param fieldName - Optional field name for error message
   * @throws Error if address is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validateAddress("0x1234..."); // throws if invalid
   * ContractValidator.validateAddress(addr, "NFT contract"); // custom error message
   * ```
   */
  static validateAddress(address: string, fieldName: string = "Address"): void {
    if (!address) {
      throw new Error(`${fieldName} is required`);
    }

    if (!ethers.isAddress(address)) {
      throw new Error(`${fieldName} is not a valid Ethereum address: ${address}`);
    }
  }

  /**
   * Check if address is valid without throwing
   *
   * @param address - Address to check
   * @returns True if valid, false otherwise
   *
   * @example
   * ```typescript
   * if (ContractValidator.isValidAddress(addr)) {
   *   // proceed with transaction
   * }
   * ```
   */
  static isValidAddress(address: string): boolean {
    return address !== null && address !== undefined && ethers.isAddress(address);
  }

  /**
   * Validate price value (must be positive)
   *
   * @param price - Price in ETH as string
   * @param fieldName - Optional field name for error message
   * @throws Error if price is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validatePrice("1.5"); // OK
   * ContractValidator.validatePrice("-1"); // throws
   * ContractValidator.validatePrice("abc"); // throws
   * ```
   */
  static validatePrice(price: string, fieldName: string = "Price"): void {
    if (!price) {
      throw new Error(`${fieldName} is required`);
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) {
      throw new Error(`${fieldName} must be a valid number: ${price}`);
    }

    if (priceNum <= 0) {
      throw new Error(`${fieldName} must be greater than 0`);
    }

    // Validate it can be parsed to wei
    try {
      ethers.parseEther(price);
    } catch (error) {
      throw new Error(`${fieldName} is not a valid ETH amount: ${price}`);
    }
  }

  /**
   * Validate token ID (must be non-negative integer)
   *
   * @param tokenId - Token ID as string
   * @param fieldName - Optional field name for error message
   * @throws Error if token ID is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validateTokenId("123"); // OK
   * ContractValidator.validateTokenId("-1"); // throws
   * ContractValidator.validateTokenId("abc"); // throws
   * ```
   */
  static validateTokenId(tokenId: string, fieldName: string = "Token ID"): void {
    if (tokenId === null || tokenId === undefined) {
      throw new Error(`${fieldName} is required`);
    }

    // Try to convert to BigInt to validate
    try {
      const id = BigInt(tokenId);
      if (id < BigInt(0)) {
        throw new Error(`${fieldName} must be non-negative`);
      }
    } catch (error) {
      throw new Error(`${fieldName} must be a valid integer: ${tokenId}`);
    }
  }

  /**
   * Validate fee percentage (0-100%)
   *
   * @param percentage - Fee percentage as number
   * @param fieldName - Optional field name for error message
   * @param maxPercentage - Maximum allowed percentage (default: 100)
   * @throws Error if percentage is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validateFeePercentage(2.5); // OK
   * ContractValidator.validateFeePercentage(150); // throws (> 100%)
   * ContractValidator.validateFeePercentage(-5); // throws (negative)
   * ```
   */
  static validateFeePercentage(
    percentage: number,
    fieldName: string = "Fee",
    maxPercentage: number = 100
  ): void {
    if (percentage === null || percentage === undefined) {
      throw new Error(`${fieldName} is required`);
    }

    if (isNaN(percentage)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    if (percentage < 0) {
      throw new Error(`${fieldName} cannot be negative`);
    }

    if (percentage > maxPercentage) {
      throw new Error(`${fieldName} cannot exceed ${maxPercentage}%`);
    }
  }

  /**
   * Validate fee in basis points (0-10000)
   *
   * @param basisPoints - Fee in basis points
   * @param fieldName - Optional field name for error message
   * @param maxBasisPoints - Maximum allowed basis points (default: 10000)
   * @throws Error if basis points are invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validateBasisPoints(250); // OK (2.5%)
   * ContractValidator.validateBasisPoints(15000); // throws (> 100%)
   * ```
   */
  static validateBasisPoints(
    basisPoints: number | bigint,
    fieldName: string = "Fee",
    maxBasisPoints: number = CONTRACT_CONSTANTS.BASIS_POINTS
  ): void {
    const bp = typeof basisPoints === "bigint" ? Number(basisPoints) : basisPoints;

    if (bp === null || bp === undefined) {
      throw new Error(`${fieldName} is required`);
    }

    if (isNaN(bp)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    if (bp < 0) {
      throw new Error(`${fieldName} cannot be negative`);
    }

    if (bp > maxBasisPoints) {
      throw new Error(`${fieldName} cannot exceed ${maxBasisPoints} basis points`);
    }
  }

  /**
   * Validate royalty fee (0-10% = 0-1000 basis points)
   *
   * @param basisPoints - Royalty in basis points
   * @param fieldName - Optional field name for error message
   * @throws Error if royalty is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validateRoyalty(500); // OK (5%)
   * ContractValidator.validateRoyalty(1500); // throws (> 10%)
   * ```
   */
  static validateRoyalty(
    basisPoints: number | bigint,
    fieldName: string = "Royalty"
  ): void {
    this.validateBasisPoints(
      basisPoints,
      fieldName,
      CONTRACT_CONSTANTS.MAX_ROYALTY_FEE
    );
  }

  /**
   * Validate platform fee (0-5% = 0-500 basis points)
   *
   * @param basisPoints - Platform fee in basis points
   * @param fieldName - Optional field name for error message
   * @throws Error if fee is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validatePlatformFee(250); // OK (2.5%)
   * ContractValidator.validatePlatformFee(600); // throws (> 5%)
   * ```
   */
  static validatePlatformFee(
    basisPoints: number | bigint,
    fieldName: string = "Platform Fee"
  ): void {
    this.validateBasisPoints(
      basisPoints,
      fieldName,
      CONTRACT_CONSTANTS.MAX_PLATFORM_FEE
    );
  }

  /**
   * Validate duration in seconds
   *
   * @param duration - Duration in seconds
   * @param fieldName - Optional field name for error message
   * @param minDuration - Minimum allowed duration (default: MIN_LISTING_DURATION)
   * @param maxDuration - Maximum allowed duration (default: MAX_LISTING_DURATION)
   * @throws Error if duration is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validateDuration(86400); // OK (1 day)
   * ContractValidator.validateDuration(60); // throws (< 1 hour)
   * ```
   */
  static validateDuration(
    duration: number,
    fieldName: string = "Duration",
    minDuration: number = CONTRACT_CONSTANTS.MIN_LISTING_DURATION,
    maxDuration: number = CONTRACT_CONSTANTS.MAX_LISTING_DURATION
  ): void {
    if (duration === null || duration === undefined) {
      throw new Error(`${fieldName} is required`);
    }

    if (isNaN(duration)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    if (duration < minDuration) {
      throw new Error(
        `${fieldName} must be at least ${minDuration} seconds (${
          minDuration / 3600
        } hours)`
      );
    }

    if (duration > maxDuration) {
      throw new Error(
        `${fieldName} cannot exceed ${maxDuration} seconds (${
          maxDuration / 86400
        } days)`
      );
    }
  }

  /**
   * Validate auction duration
   *
   * @param duration - Duration in seconds
   * @param fieldName - Optional field name for error message
   * @throws Error if duration is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validateAuctionDuration(86400); // OK (1 day)
   * ContractValidator.validateAuctionDuration(60); // throws (< 1 hour)
   * ```
   */
  static validateAuctionDuration(
    duration: number,
    fieldName: string = "Auction Duration"
  ): void {
    this.validateDuration(
      duration,
      fieldName,
      CONTRACT_CONSTANTS.MIN_AUCTION_DURATION,
      CONTRACT_CONSTANTS.MAX_AUCTION_DURATION
    );
  }

  /**
   * Validate amount (must be positive integer)
   *
   * @param amount - Amount as string or number
   * @param fieldName - Optional field name for error message
   * @throws Error if amount is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validateAmount("10"); // OK
   * ContractValidator.validateAmount("-5"); // throws
   * ContractValidator.validateAmount("0"); // throws
   * ```
   */
  static validateAmount(
    amount: string | number,
    fieldName: string = "Amount"
  ): void {
    const amt = typeof amount === "string" ? parseInt(amount, 10) : amount;

    if (isNaN(amt)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    if (amt <= 0) {
      throw new Error(`${fieldName} must be greater than 0`);
    }
  }

  /**
   * Validate multiple parameters and return aggregated result
   *
   * @param validators - Object of validator functions to run
   * @returns ValidationResult with all errors
   *
   * @example
   * ```typescript
   * const result = ContractValidator.validateMultiple({
   *   address: () => ContractValidator.validateAddress(addr),
   *   price: () => ContractValidator.validatePrice(price),
   *   tokenId: () => ContractValidator.validateTokenId(tokenId),
   * });
   *
   * if (!result.isValid) {
   *   console.error(result.errors);
   * }
   * ```
   */
  static validateMultiple(
    validators: Record<string, () => void>
  ): ValidationResult {
    const errors: string[] = [];

    for (const [key, validator] of Object.entries(validators)) {
      try {
        validator();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : `${key} validation failed`;
        errors.push(message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate non-empty string
   *
   * @param value - String to validate
   * @param fieldName - Field name for error message
   * @param minLength - Minimum string length (default: 1)
   * @param maxLength - Maximum string length (optional)
   * @throws Error if string is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validateString("Hello", "Name"); // OK
   * ContractValidator.validateString("", "Name"); // throws
   * ContractValidator.validateString("Hi", "Name", 3); // throws (too short)
   * ```
   */
  static validateString(
    value: string,
    fieldName: string,
    minLength: number = 1,
    maxLength?: number
  ): void {
    if (value === null || value === undefined) {
      throw new Error(`${fieldName} is required`);
    }

    if (typeof value !== "string") {
      throw new Error(`${fieldName} must be a string`);
    }

    if (value.length < minLength) {
      throw new Error(
        `${fieldName} must be at least ${minLength} character${
          minLength === 1 ? "" : "s"
        }`
      );
    }

    if (maxLength && value.length > maxLength) {
      throw new Error(`${fieldName} cannot exceed ${maxLength} characters`);
    }
  }

  /**
   * Validate array is not empty
   *
   * @param array - Array to validate
   * @param fieldName - Field name for error message
   * @param minLength - Minimum array length (default: 1)
   * @param maxLength - Maximum array length (optional)
   * @throws Error if array is invalid
   *
   * @example
   * ```typescript
   * ContractValidator.validateArray([1, 2], "Items"); // OK
   * ContractValidator.validateArray([], "Items"); // throws
   * ```
   */
  static validateArray<T>(
    array: T[],
    fieldName: string,
    minLength: number = 1,
    maxLength?: number
  ): void {
    if (!Array.isArray(array)) {
      throw new Error(`${fieldName} must be an array`);
    }

    if (array.length < minLength) {
      throw new Error(
        `${fieldName} must contain at least ${minLength} item${
          minLength === 1 ? "" : "s"
        }`
      );
    }

    if (maxLength && array.length > maxLength) {
      throw new Error(`${fieldName} cannot contain more than ${maxLength} items`);
    }
  }
}
