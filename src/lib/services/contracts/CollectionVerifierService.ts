/**
 * Collection Verifier Service
 * Handles collection verification and metadata management
 * Based on CollectionVerifier.sol
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { userHubService } from "./UserHubService";
import { getContractABI } from "@/lib/contracts/abi-manager";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum VerificationStatus {
  NONE = 0,
  PENDING = 1,
  VERIFIED = 2,
  REJECTED = 3,
  REVOKED = 4,
}

export interface CollectionVerification {
  isVerified: boolean;
  verificationTier: string; // "basic", "premium", "featured"
  verifiedAt: bigint;
  verifiedBy: string;
  expiresAt: bigint;
  status: VerificationStatus;
}

export interface CollectionMetadata {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
  category: string;
  creatorAddress: string;
  totalSupply: bigint;
  socialLinks: string[];
}

export interface VerificationRequest {
  collection: string;
  requester: string;
  requestedAt: bigint;
  metadata: CollectionMetadata;
  verificationTier: string;
  fee: bigint;
  status: VerificationStatus;
  reviewNotes: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class CollectionVerifierService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private verifierAddress: string | null = null;

  /**
   * Initialize collection verifier service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Get verifier address from hub
    // TODO: Add getCollectionVerifier() to Hub

    logger.success("CollectionVerifierService initialized", null, {
      component: "CollectionVerifierService",
      action: "initialize",
    });
  }

  /**
   * Get verifier contract instance
   */
  private async getVerifierContract(readOnly: boolean = false): Promise<ethers.Contract> {
    const abi = await getContractABI("CollectionVerifier");

    if (readOnly && this.provider) {
      if (!this.verifierAddress) {
        throw new Error("CollectionVerifier address not configured");
      }
      return new ethers.Contract(
        this.verifierAddress,
        abi,
        this.provider
      );
    }

    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    if (!this.verifierAddress) {
      throw new Error("CollectionVerifier address not configured");
    }

    return new ethers.Contract(
      this.verifierAddress,
      abi,
      this.signer
    );
  }

  // ============================================================================
  // VERIFICATION QUERIES
  // ============================================================================

  /**
   * Check if collection is verified
   */
  async isCollectionVerified(collection: string): Promise<boolean> {
    const contract = await this.getVerifierContract(true);
    return await contract.isCollectionVerified(collection);
  }

  /**
   * Get collection verification details
   */
  async getCollectionVerification(
    collection: string
  ): Promise<CollectionVerification> {
    const contract = await this.getVerifierContract(true);
    const verification = await contract.getCollectionVerification(collection);

    return {
      isVerified: verification.isVerified,
      verificationTier: verification.verificationTier,
      verifiedAt: verification.verifiedAt,
      verifiedBy: verification.verifiedBy,
      expiresAt: verification.expiresAt,
      status: verification.status,
    };
  }

  /**
   * Get collection metadata
   */
  async getCollectionMetadata(collection: string): Promise<CollectionMetadata> {
    const contract = await this.getVerifierContract(true);
    const metadata = await contract.getCollectionMetadata(collection);

    return {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      imageUrl: metadata.imageUrl,
      externalUrl: metadata.externalUrl,
      category: metadata.category,
      creatorAddress: metadata.creatorAddress,
      totalSupply: metadata.totalSupply,
      socialLinks: metadata.socialLinks,
    };
  }

  /**
   * Get verification request details
   */
  async getVerificationRequest(
    collection: string
  ): Promise<VerificationRequest> {
    const contract = await this.getVerifierContract(true);
    const request = await contract.getVerificationRequest(collection);

    return {
      collection: request.collection,
      requester: request.requester,
      requestedAt: request.requestedAt,
      metadata: request.metadata,
      verificationTier: request.verificationTier,
      fee: request.fee,
      status: request.status,
      reviewNotes: request.reviewNotes,
    };
  }

  /**
   * Get all verified collections
   */
  async getAllVerifiedCollections(): Promise<string[]> {
    const contract = await this.getVerifierContract(true);
    return await contract.getAllVerifiedCollections();
  }

  /**
   * Get verification fee
   */
  async getVerificationFee(): Promise<bigint> {
    const contract = await this.getVerifierContract(true);
    return await contract.verificationFee();
  }

  // ============================================================================
  // VERIFICATION REQUESTS
  // ============================================================================

  /**
   * Request verification for a collection
   */
  async requestVerification(
    collection: string,
    metadata: CollectionMetadata,
    verificationTier: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getVerifierContract();

    const fee = await this.getVerificationFee();

    const tx = await contract.requestVerification(
      collection,
      metadata,
      verificationTier,
      { value: fee }
    );
    await tx.wait();

    return tx;
  }

  /**
   * Update collection metadata
   */
  async updateCollectionMetadata(
    collection: string,
    metadata: CollectionMetadata
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getVerifierContract();

    const tx = await contract.updateCollectionMetadata(collection, metadata);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // ADMIN FUNCTIONS
  // ============================================================================

  /**
   * Process verification request (admin/verifier only)
   */
  async processVerificationRequest(
    collection: string,
    approved: boolean,
    verificationTier: string,
    reviewNotes: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getVerifierContract();

    const tx = await contract.processVerificationRequest(
      collection,
      approved,
      verificationTier,
      reviewNotes
    );
    await tx.wait();

    return tx;
  }

  /**
   * Revoke verification (admin only)
   */
  async revokeVerification(
    collection: string,
    reason: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getVerifierContract();

    const tx = await contract.revokeVerification(collection, reason);
    await tx.wait();

    return tx;
  }

  /**
   * Batch verify collections (admin only)
   */
  async batchVerifyCollections(
    collections: string[],
    verificationTiers: string[]
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getVerifierContract();

    const tx = await contract.batchVerifyCollections(
      collections,
      verificationTiers
    );
    await tx.wait();

    return tx;
  }

  /**
   * Update verification fee (admin only)
   */
  async updateVerificationFee(
    newFee: bigint
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getVerifierContract();

    const tx = await contract.updateVerificationFee(newFee);
    await tx.wait();

    return tx;
  }

  /**
   * Toggle verified-only mode (admin only)
   */
  async toggleVerifiedOnlyMode(
    enabled: boolean
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getVerifierContract();

    const tx = await contract.toggleVerifiedOnlyMode(enabled);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get verification status name
   */
  static getStatusName(status: VerificationStatus): string {
    const names: Record<VerificationStatus, string> = {
      [VerificationStatus.NONE]: "Not Verified",
      [VerificationStatus.PENDING]: "Pending Review",
      [VerificationStatus.VERIFIED]: "Verified",
      [VerificationStatus.REJECTED]: "Rejected",
      [VerificationStatus.REVOKED]: "Revoked",
    };

    return names[status] || "Unknown";
  }

  /**
   * Get verification tier badge
   */
  static getTierBadge(tier: string): string {
    const badges: Record<string, string> = {
      basic: "✓",
      premium: "⭐",
      featured: "👑",
    };

    return badges[tier.toLowerCase()] || "✓";
  }

  /**
   * Check if verification is expired
   */
  static isVerificationExpired(expiresAt: bigint): boolean {
    if (expiresAt === BigInt(0)) return false; // No expiry
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now > expiresAt;
  }

  /**
   * Get days until expiration
   */
  static getDaysUntilExpiry(expiresAt: bigint): number {
    if (expiresAt === BigInt(0)) return Infinity;

    const now = BigInt(Math.floor(Date.now() / 1000));
    const secondsRemaining = Number(expiresAt - now);

    if (secondsRemaining <= 0) return 0;

    return Math.floor(secondsRemaining / 86400);
  }

  /**
   * Format verification fee
   */
  static formatFee(fee: bigint, decimals: number = 18): string {
    return ethers.formatUnits(fee, decimals);
  }

  /**
   * Validate metadata
   */
  static validateMetadata(metadata: CollectionMetadata): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!metadata.name || metadata.name.length < 3) {
      errors.push("Name must be at least 3 characters");
    }

    if (!metadata.symbol || metadata.symbol.length < 2) {
      errors.push("Symbol must be at least 2 characters");
    }

    if (!metadata.description || metadata.description.length < 20) {
      errors.push("Description must be at least 20 characters");
    }

    if (!ethers.isAddress(metadata.creatorAddress)) {
      errors.push("Invalid creator address");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get verification tier info
   */
  static getTierInfo(tier: string): {
    name: string;
    description: string;
    badge: string;
  } {
    const tiers: Record<string, any> = {
      basic: {
        name: "Basic",
        description: "Standard verification for legitimate collections",
        badge: "✓",
      },
      premium: {
        name: "Premium",
        description: "Enhanced verification with priority support",
        badge: "⭐",
      },
      featured: {
        name: "Featured",
        description: "Top-tier verification with maximum visibility",
        badge: "👑",
      },
    };

    return (
      tiers[tier.toLowerCase()] || {
        name: "Unknown",
        description: "Unknown tier",
        badge: "?",
      }
    );
  }

  /**
   * Build verification request summary
   */
  static buildRequestSummary(request: VerificationRequest): string {
    const metadata = request.metadata;
    return `
      Collection: ${metadata.name} (${metadata.symbol})
      Tier: ${request.verificationTier}
      Status: ${this.getStatusName(request.status)}
      Fee: ${this.formatFee(request.fee)} ETH
      Requested: ${new Date(
        Number(request.requestedAt) * 1000
      ).toLocaleDateString()}
    `.trim();
  }
}

// Export singleton instance
export const collectionVerifierService = new CollectionVerifierService();
