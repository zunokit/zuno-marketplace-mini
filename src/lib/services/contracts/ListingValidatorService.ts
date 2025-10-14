/**
 * Listing Validator Service
 * Pre-flight validation for marketplace listings
 * Based on ListingValidator.sol
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { userHubService } from "./UserHubService";
import { ListingValidator_ABI } from "@/lib/contracts/abis";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ValidationSettings {
  minPrice: bigint; // Minimum listing price
  maxPrice: bigint; // Maximum listing price
  minDuration: bigint; // Minimum listing duration (seconds)
  maxDuration: bigint; // Maximum listing duration (seconds)
  cooldownPeriod: bigint; // Cooldown between listings (seconds)
  maxListingsPerUser: bigint; // Maximum active listings per user
  requireVerifiedCollection: boolean; // Whether collection must be verified
  enableQualityCheck: boolean; // Whether to perform quality checks
  isActive: boolean; // Whether these settings are active
}

export interface UserCooldown {
  lastListingTime: bigint; // Last time user created a listing
  activeListings: bigint; // Number of active listings
  totalListings: bigint; // Total listings created
  isRestricted: boolean; // Whether user is restricted
}

export interface SpamTracker {
  listingsInLastHour: bigint; // Listings created in last hour
  lastHourStart: bigint; // Start of current hour window
  suspiciousActivity: bigint; // Suspicious activity score
  isFlagged: boolean; // Whether user is flagged for spam
}

export interface ValidationResult {
  isValid: boolean; // Whether listing passes validation
  errors: string[]; // Array of validation errors
  qualityScore: bigint; // Quality score (0-100)
  recommendedPrice: bigint; // Recommended price (if applicable)
}

export interface ListingParams {
  collection: string;
  tokenId: bigint;
  price: bigint;
  duration: bigint;
  listingType: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ListingValidatorService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private validatorAddress: string | null = null;

  // Constants
  public readonly MAX_QUALITY_SCORE = 100;
  public readonly MIN_AUTO_APPROVAL_SCORE = 70;
  public readonly MAX_LISTINGS_PER_HOUR = 10;
  public readonly DEFAULT_COOLDOWN = 300; // 5 minutes

  /**
   * Initialize listing validator service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Get validator address from hub
    // TODO: Add getListingValidator() to Hub

    logger.success("ListingValidatorService initialized", null, {
      component: "ListingValidatorService",
      action: "initialize",
    });
  }

  /**
   * Get validator contract instance
   */
  private getValidatorContract(readOnly: boolean = false): ethers.Contract {
    if (readOnly && this.provider) {
      if (!this.validatorAddress) {
        throw new Error("ListingValidator address not configured");
      }
      return new ethers.Contract(
        this.validatorAddress,
        ListingValidator_ABI,
        this.provider
      );
    }

    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    if (!this.validatorAddress) {
      throw new Error("ListingValidator address not configured");
    }

    return new ethers.Contract(
      this.validatorAddress,
      ListingValidator_ABI,
      this.signer
    );
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate a listing before creation
   * @param listing Listing parameters
   * @param user User address
   */
  async validateListing(listing: any, user: string): Promise<ValidationResult> {
    const contract = this.getValidatorContract(true);

    const result = await contract.validateListing(listing, user);

    return {
      isValid: result.isValid,
      errors: result.errors,
      qualityScore: result.qualityScore,
      recommendedPrice: result.recommendedPrice,
    };
  }

  /**
   * Validate a listing update
   * @param oldListing Current listing
   * @param newListing Updated listing
   * @param user User address
   */
  async validateListingUpdate(
    oldListing: any,
    newListing: any,
    user: string
  ): Promise<ValidationResult> {
    const contract = this.getValidatorContract(true);

    const result = await contract.validateListingUpdate(
      oldListing,
      newListing,
      user
    );

    return {
      isValid: result.isValid,
      errors: result.errors,
      qualityScore: result.qualityScore,
      recommendedPrice: result.recommendedPrice,
    };
  }

  /**
   * Quick validation check (client-side only)
   */
  async quickValidate(params: ListingParams): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check price
    if (params.price <= BigInt(0)) {
      errors.push("Price must be greater than 0");
    }

    // Check duration
    if (params.duration < BigInt(3600)) {
      errors.push("Duration must be at least 1 hour");
    }

    if (params.duration > BigInt(7776000)) {
      errors.push("Duration cannot exceed 90 days");
    }

    // Check collection address
    if (!ethers.isAddress(params.collection)) {
      errors.push("Invalid collection address");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  /**
   * Get validation settings for a collection
   */
  async getCollectionSettings(collection: string): Promise<ValidationSettings> {
    const contract = this.getValidatorContract(true);
    const settings = await contract.collectionSettings(collection);

    return {
      minPrice: settings.minPrice,
      maxPrice: settings.maxPrice,
      minDuration: settings.minDuration,
      maxDuration: settings.maxDuration,
      cooldownPeriod: settings.cooldownPeriod,
      maxListingsPerUser: settings.maxListingsPerUser,
      requireVerifiedCollection: settings.requireVerifiedCollection,
      enableQualityCheck: settings.enableQualityCheck,
      isActive: settings.isActive,
    };
  }

  /**
   * Get global validation settings
   */
  async getGlobalSettings(): Promise<ValidationSettings> {
    const contract = this.getValidatorContract(true);
    const settings = await contract.globalSettings();

    return {
      minPrice: settings.minPrice,
      maxPrice: settings.maxPrice,
      minDuration: settings.minDuration,
      maxDuration: settings.maxDuration,
      cooldownPeriod: settings.cooldownPeriod,
      maxListingsPerUser: settings.maxListingsPerUser,
      requireVerifiedCollection: settings.requireVerifiedCollection,
      enableQualityCheck: settings.enableQualityCheck,
      isActive: settings.isActive,
    };
  }

  /**
   * Set validation settings for a collection (admin only)
   */
  async setCollectionSettings(
    collection: string,
    settings: ValidationSettings
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getValidatorContract();

    const tx = await contract.setValidationSettings(collection, settings);
    await tx.wait();

    return tx;
  }

  /**
   * Set global validation settings (admin only)
   */
  async setGlobalSettings(
    settings: ValidationSettings
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getValidatorContract();

    const tx = await contract.setGlobalValidationSettings(settings);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // USER TRACKING
  // ============================================================================

  /**
   * Get user cooldown info
   */
  async getUserCooldown(user: string): Promise<UserCooldown> {
    const contract = this.getValidatorContract(true);
    const cooldown = await contract.userCooldowns(user);

    return {
      lastListingTime: cooldown.lastListingTime,
      activeListings: cooldown.activeListings,
      totalListings: cooldown.totalListings,
      isRestricted: cooldown.isRestricted,
    };
  }

  /**
   * Get spam tracker for user
   */
  async getSpamTracker(user: string): Promise<SpamTracker> {
    const contract = this.getValidatorContract(true);
    const tracker = await contract.spamTrackers(user);

    return {
      listingsInLastHour: tracker.listingsInLastHour,
      lastHourStart: tracker.lastHourStart,
      suspiciousActivity: tracker.suspiciousActivity,
      isFlagged: tracker.isFlagged,
    };
  }

  /**
   * Get listing quality score
   */
  async getListingQualityScore(listingId: string): Promise<bigint> {
    const contract = this.getValidatorContract(true);
    return await contract.listingQualityScores(listingId);
  }

  /**
   * Get total validated listings
   */
  async getTotalValidatedListings(): Promise<bigint> {
    const contract = this.getValidatorContract(true);
    return await contract.totalValidatedListings();
  }

  // ============================================================================
  // USER CHECKS
  // ============================================================================

  /**
   * Check if user can create listing now
   */
  async canUserCreateListing(user: string): Promise<{
    canCreate: boolean;
    reason: string;
    cooldownRemaining: bigint;
  }> {
    const cooldown = await this.getUserCooldown(user);
    const settings = await this.getGlobalSettings();

    // Check if restricted
    if (cooldown.isRestricted) {
      return {
        canCreate: false,
        reason: "User is restricted from creating listings",
        cooldownRemaining: BigInt(0),
      };
    }

    // Check cooldown
    const now = BigInt(Math.floor(Date.now() / 1000));
    const timeSinceLastListing = now - cooldown.lastListingTime;

    if (timeSinceLastListing < settings.cooldownPeriod) {
      const remaining = settings.cooldownPeriod - timeSinceLastListing;
      return {
        canCreate: false,
        reason: "Cooldown period not expired",
        cooldownRemaining: remaining,
      };
    }

    // Check max listings
    if (cooldown.activeListings >= settings.maxListingsPerUser) {
      return {
        canCreate: false,
        reason: "Maximum active listings reached",
        cooldownRemaining: BigInt(0),
      };
    }

    // Check spam
    const spamTracker = await this.getSpamTracker(user);
    if (spamTracker.isFlagged) {
      return {
        canCreate: false,
        reason: "User flagged for suspicious activity",
        cooldownRemaining: BigInt(0),
      };
    }

    return {
      canCreate: true,
      reason: "OK",
      cooldownRemaining: BigInt(0),
    };
  }

  /**
   * Check if user is rate limited
   */
  async isUserRateLimited(user: string): Promise<boolean> {
    const tracker = await this.getSpamTracker(user);
    return tracker.listingsInLastHour >= BigInt(this.MAX_LISTINGS_PER_HOUR);
  }

  // ============================================================================
  // ADMIN FUNCTIONS
  // ============================================================================

  /**
   * Pause validator
   */
  async pause(): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getValidatorContract();

    const tx = await contract.pause();
    await tx.wait();

    return tx;
  }

  /**
   * Unpause validator
   */
  async unpause(): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getValidatorContract();

    const tx = await contract.unpause();
    await tx.wait();

    return tx;
  }

  /**
   * Check if validator is paused
   */
  async isPaused(): Promise<boolean> {
    const contract = this.getValidatorContract(true);
    return await contract.paused();
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Format validation errors for display
   */
  static formatErrors(errors: string[]): string {
    if (errors.length === 0) return "No errors";
    return errors.map((e, i) => `${i + 1}. ${e}`).join("\n");
  }

  /**
   * Get quality score label
   */
  static getQualityLabel(score: bigint): string {
    const s = Number(score);
    if (s >= 90) return "Excellent";
    if (s >= 70) return "Good";
    if (s >= 50) return "Fair";
    if (s >= 30) return "Poor";
    return "Very Poor";
  }

  /**
   * Format cooldown time
   */
  static formatCooldown(seconds: bigint): string {
    const secs = Number(seconds);
    if (secs === 0) return "Ready";

    const minutes = Math.floor(secs / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs % 60}s`;
    }
    return `${secs}s`;
  }

  /**
   * Estimate listing quality
   */
  static estimateQuality(params: ListingParams): number {
    let score = 100;

    // Price check
    if (params.price < ethers.parseEther("0.001")) {
      score -= 20;
    }

    // Duration check
    const days = Number(params.duration) / 86400;
    if (days < 1) score -= 10;
    if (days > 30) score -= 5;

    return Math.max(0, score);
  }

  /**
   * Get recommended price range
   */
  static getRecommendedPriceRange(settings: ValidationSettings): {
    min: bigint;
    max: bigint;
  } {
    return {
      min: settings.minPrice,
      max: settings.maxPrice,
    };
  }

  /**
   * Validate price range
   */
  static isPriceInRange(price: bigint, settings: ValidationSettings): boolean {
    return price >= settings.minPrice && price <= settings.maxPrice;
  }

  /**
   * Validate duration range
   */
  static isDurationInRange(
    duration: bigint,
    settings: ValidationSettings
  ): boolean {
    return duration >= settings.minDuration && duration <= settings.maxDuration;
  }
}

// Export singleton instance
export const listingValidatorService = new ListingValidatorService();
