/**
 * Service Validator
 * Centralized validation for service-level operations
 *
 * Combines ContractValidator (input validation) with business logic validation
 * for a complete validation layer before blockchain transactions.
 */

import { ContractValidator, ValidationResult } from "@/lib/utils/validators";
import { CONTRACT_CONSTANTS } from "@/lib/constants";

/**
 * Listing parameters for validation
 */
export interface ListingParams {
  contractAddress: string;
  tokenId: string;
  price: string;
  duration: string | number;
  amount?: string;
  tokenType: "ERC721" | "ERC1155";
}

/**
 * Offer parameters for validation
 */
export interface OfferParams {
  collection: string;
  tokenId?: string;
  price: string;
  expirationTime: number;
  quantity?: number;
}

/**
 * Auction parameters for validation
 */
export interface AuctionParams {
  nftContract: string;
  tokenId: string;
  startPrice: string;
  reservePrice?: string;
  duration: number;
}

/**
 * Bundle parameters for validation
 */
export interface BundleParams {
  items: Array<{
    collection: string;
    tokenId: string;
    amount: string;
  }>;
  totalPrice: string;
  discountPercentage: number;
  duration: number;
}

export class ServiceValidator {
  /**
   * Validate listing creation parameters
   *
   * @param params - Listing parameters
   * @returns ValidationResult with errors if any
   *
   * @example
   * ```typescript
   * const result = ServiceValidator.validateListingParams(params);
   * if (!result.isValid) {
   *   throw new Error(result.errors.join(", "));
   * }
   * ```
   */
  static validateListingParams(params: ListingParams): ValidationResult {
    return ContractValidator.validateMultiple({
      contractAddress: () =>
        ContractValidator.validateAddress(params.contractAddress, "NFT contract address"),
      tokenId: () => ContractValidator.validateTokenId(params.tokenId),
      price: () => ContractValidator.validatePrice(params.price),
      duration: () => {
        const durationNum =
          typeof params.duration === "string"
            ? parseInt(params.duration, 10)
            : params.duration;
        ContractValidator.validateDuration(durationNum);
      },
      amount: () => {
        if (params.tokenType === "ERC1155" && params.amount) {
          ContractValidator.validateAmount(params.amount);
        }
      },
    });
  }

  /**
   * Validate offer creation parameters
   *
   * @param params - Offer parameters
   * @returns ValidationResult with errors if any
   */
  static validateOfferParams(params: OfferParams): ValidationResult {
    const errors: string[] = [];

    // Validate collection address
    try {
      ContractValidator.validateAddress(params.collection, "Collection address");
    } catch (error) {
      errors.push((error as Error).message);
    }

    // Validate token ID if provided (NFT offer)
    if (params.tokenId) {
      try {
        ContractValidator.validateTokenId(params.tokenId);
      } catch (error) {
        errors.push((error as Error).message);
      }
    }

    // Validate price
    try {
      ContractValidator.validatePrice(params.price);
    } catch (error) {
      errors.push((error as Error).message);
    }

    // Validate expiration time
    const now = Math.floor(Date.now() / 1000);
    if (params.expirationTime <= now) {
      errors.push("Expiration time must be in the future");
    }

    // Validate quantity for collection offers
    if (!params.tokenId && params.quantity) {
      try {
        ContractValidator.validateAmount(params.quantity);
      } catch (error) {
        errors.push((error as Error).message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate auction creation parameters
   *
   * @param params - Auction parameters
   * @returns ValidationResult with errors if any
   */
  static validateAuctionParams(params: AuctionParams): ValidationResult {
    return ContractValidator.validateMultiple({
      nftContract: () =>
        ContractValidator.validateAddress(params.nftContract, "NFT contract address"),
      tokenId: () => ContractValidator.validateTokenId(params.tokenId),
      startPrice: () => ContractValidator.validatePrice(params.startPrice, "Start price"),
      reservePrice: () => {
        if (params.reservePrice) {
          ContractValidator.validatePrice(params.reservePrice, "Reserve price");
          // Reserve price should be >= start price
          const start = parseFloat(params.startPrice);
          const reserve = parseFloat(params.reservePrice);
          if (reserve < start) {
            throw new Error("Reserve price must be greater than or equal to start price");
          }
        }
      },
      duration: () =>
        ContractValidator.validateAuctionDuration(params.duration),
    });
  }

  /**
   * Validate bundle creation parameters
   *
   * @param params - Bundle parameters
   * @returns ValidationResult with errors if any
   */
  static validateBundleParams(params: BundleParams): ValidationResult {
    const errors: string[] = [];

    // Validate items array
    try {
      ContractValidator.validateArray(params.items, "Bundle items", 2, 10);
    } catch (error) {
      errors.push((error as Error).message);
    }

    // Validate each item
    for (let i = 0; i < params.items.length; i++) {
      const item = params.items[i];
      try {
        ContractValidator.validateAddress(
          item.collection,
          `Item ${i + 1} collection address`
        );
        ContractValidator.validateTokenId(item.tokenId, `Item ${i + 1} token ID`);
        ContractValidator.validateAmount(item.amount, `Item ${i + 1} amount`);
      } catch (error) {
        errors.push((error as Error).message);
      }
    }

    // Validate total price
    try {
      ContractValidator.validatePrice(params.totalPrice, "Total price");
    } catch (error) {
      errors.push((error as Error).message);
    }

    // Validate discount percentage
    try {
      ContractValidator.validateFeePercentage(
        params.discountPercentage,
        "Discount",
        100
      );
    } catch (error) {
      errors.push((error as Error).message);
    }

    // Validate duration
    try {
      ContractValidator.validateDuration(params.duration, "Bundle duration");
    } catch (error) {
      errors.push((error as Error).message);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate royalty settings
   *
   * @param basisPoints - Royalty in basis points
   * @param recipients - Array of recipient addresses
   * @returns ValidationResult with errors if any
   */
  static validateRoyaltySettings(
    basisPoints: number,
    recipients: string[]
  ): ValidationResult {
    const errors: string[] = [];

    // Validate royalty amount
    try {
      ContractValidator.validateRoyalty(basisPoints);
    } catch (error) {
      errors.push((error as Error).message);
    }

    // Validate recipients
    try {
      ContractValidator.validateArray(recipients, "Recipients", 1, 5);
    } catch (error) {
      errors.push((error as Error).message);
    }

    // Validate each recipient address
    for (let i = 0; i < recipients.length; i++) {
      try {
        ContractValidator.validateAddress(recipients[i], `Recipient ${i + 1}`);
      } catch (error) {
        errors.push((error as Error).message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate collection creation parameters
   *
   * @param name - Collection name
   * @param symbol - Collection symbol
   * @param maxSupply - Maximum supply (0 for unlimited)
   * @param royaltyBps - Royalty in basis points
   * @returns ValidationResult with errors if any
   */
  static validateCollectionParams(
    name: string,
    symbol: string,
    maxSupply: number,
    royaltyBps: number
  ): ValidationResult {
    const errors: string[] = [];

    // Validate name
    try {
      ContractValidator.validateString(name, "Collection name", 1, 100);
    } catch (error) {
      errors.push((error as Error).message);
    }

    // Validate symbol
    try {
      ContractValidator.validateString(symbol, "Collection symbol", 1, 10);
    } catch (error) {
      errors.push((error as Error).message);
    }

    // Validate max supply
    if (maxSupply < 0) {
      errors.push("Max supply cannot be negative");
    }

    // Validate royalty
    try {
      ContractValidator.validateRoyalty(royaltyBps);
    } catch (error) {
      errors.push((error as Error).message);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate price update
   *
   * @param oldPrice - Current price in ETH
   * @param newPrice - New price in ETH
   * @param maxChangePercent - Maximum allowed price change percentage (default: 50%)
   * @returns ValidationResult with errors if any
   */
  static validatePriceUpdate(
    oldPrice: string,
    newPrice: string,
    maxChangePercent: number = 50
  ): ValidationResult {
    const errors: string[] = [];

    // Validate both prices
    try {
      ContractValidator.validatePrice(oldPrice, "Current price");
      ContractValidator.validatePrice(newPrice, "New price");
    } catch (error) {
      errors.push((error as Error).message);
      return { isValid: false, errors };
    }

    // Check price change is not too drastic
    const oldPriceNum = parseFloat(oldPrice);
    const newPriceNum = parseFloat(newPrice);
    const changePercent =
      Math.abs(newPriceNum - oldPriceNum) / oldPriceNum * 100;

    if (changePercent > maxChangePercent) {
      errors.push(
        `Price change of ${changePercent.toFixed(
          1
        )}% exceeds maximum allowed change of ${maxChangePercent}%`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate batch operation parameters
   *
   * @param items - Array of items to validate
   * @param minItems - Minimum number of items
   * @param maxItems - Maximum number of items
   * @returns ValidationResult with errors if any
   */
  static validateBatchOperation(
    items: unknown[],
    minItems: number = 1,
    maxItems: number = 100
  ): ValidationResult {
    return ContractValidator.validateMultiple({
      items: () =>
        ContractValidator.validateArray(items, "Batch items", minItems, maxItems),
    });
  }
}
