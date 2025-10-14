/**
 * Royalty Manager Service
 * Handles advanced royalty management with ERC2981 support and multiple recipients
 * Based on AdvancedRoyaltyManager.sol
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { userHubService } from "./UserHubService";
import { AdvancedRoyaltyManager_ABI } from "@/lib/contracts/abis";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AdvancedRoyaltyInfo {
  hasAdvancedRoyalty: boolean; // Whether collection uses advanced royalty
  totalRoyaltyBps: bigint; // Total royalty percentage (basis points)
  maxRoyaltyBps: bigint; // Maximum allowed royalty for this collection
  useERC2981: boolean; // Whether to use ERC2981 standard
  allowOverrides: boolean; // Whether to allow royalty overrides
  lastUpdated: bigint; // Last update timestamp
  updatedBy: string; // Who last updated the royalty
}

export interface RoyaltyRecipient {
  recipient: string; // Recipient address
  basisPoints: bigint; // Royalty percentage in basis points
  role: string; // Role description (e.g., "creator", "platform", "charity")
  isActive: boolean; // Whether this recipient is active
}

export interface RoyaltyCaps {
  maxTotalRoyalty: bigint; // Maximum total royalty (basis points)
  maxSingleRecipient: bigint; // Maximum for single recipient
  maxRecipients: bigint; // Maximum number of recipients
  enforceGlobalCaps: boolean; // Whether to enforce global caps
}

export interface RoyaltyDistribution {
  recipient: string;
  amount: bigint;
  role: string;
}

export interface RoyaltyInfo {
  receiver: string; // ERC2981 royalty receiver
  royaltyAmount: bigint; // Royalty amount in wei
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class RoyaltyManagerService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private royaltyManagerAddress: string | null = null;

  /**
   * Initialize royalty manager service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Get royalty manager address from hub's fee registry
    // TODO: Add getRoyaltyManager() to FeeRegistry or Hub

    logger.success("RoyaltyManagerService initialized", null, {
      component: "RoyaltyManagerService",
      action: "initialize",
    });
  }

  /**
   * Get royalty manager contract instance
   */
  private getRoyaltyManagerContract(
    readOnly: boolean = false
  ): ethers.Contract {
    if (readOnly && this.provider) {
      if (!this.royaltyManagerAddress) {
        throw new Error("RoyaltyManager address not configured");
      }
      return new ethers.Contract(
        this.royaltyManagerAddress,
        AdvancedRoyaltyManager_ABI,
        this.provider
      );
    }

    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    if (!this.royaltyManagerAddress) {
      throw new Error("RoyaltyManager address not configured");
    }

    return new ethers.Contract(
      this.royaltyManagerAddress,
      AdvancedRoyaltyManager_ABI,
      this.signer
    );
  }

  // ============================================================================
  // ROYALTY QUERIES
  // ============================================================================

  /**
   * Get royalty info for a token (ERC2981 compatible)
   * @param collection NFT collection address
   * @param tokenId Token ID
   * @param salePrice Sale price in wei
   */
  async getRoyaltyInfo(
    collection: string,
    tokenId: bigint,
    salePrice: bigint
  ): Promise<RoyaltyInfo> {
    const contract = this.getRoyaltyManagerContract(true);

    const [receiver, royaltyAmount] = await contract.royaltyInfo(
      tokenId,
      salePrice
    );

    return {
      receiver,
      royaltyAmount,
    };
  }

  /**
   * Get advanced royalty settings for a collection
   */
  async getAdvancedRoyalty(collection: string): Promise<AdvancedRoyaltyInfo> {
    const contract = this.getRoyaltyManagerContract(true);
    const info = await contract.advancedRoyalties(collection);

    return {
      hasAdvancedRoyalty: info.hasAdvancedRoyalty,
      totalRoyaltyBps: info.totalRoyaltyBps,
      maxRoyaltyBps: info.maxRoyaltyBps,
      useERC2981: info.useERC2981,
      allowOverrides: info.allowOverrides,
      lastUpdated: info.lastUpdated,
      updatedBy: info.updatedBy,
    };
  }

  /**
   * Get royalty recipients for a collection
   */
  async getRoyaltyRecipients(collection: string): Promise<RoyaltyRecipient[]> {
    const contract = this.getRoyaltyManagerContract(true);
    const recipients = await contract.royaltyRecipients(collection);

    return recipients.map((r: any) => ({
      recipient: r.recipient,
      basisPoints: r.basisPoints,
      role: r.role,
      isActive: r.isActive,
    }));
  }

  /**
   * Get custom royalty contract for a collection
   */
  async getCustomRoyaltyContract(collection: string): Promise<string> {
    const contract = this.getRoyaltyManagerContract(true);
    return await contract.customRoyaltyContracts(collection);
  }

  /**
   * Get global royalty caps
   */
  async getGlobalCaps(): Promise<RoyaltyCaps> {
    const contract = this.getRoyaltyManagerContract(true);
    const caps = await contract.globalCaps();

    return {
      maxTotalRoyalty: caps.maxTotalRoyalty,
      maxSingleRecipient: caps.maxSingleRecipient,
      maxRecipients: caps.maxRecipients,
      enforceGlobalCaps: caps.enforceGlobalCaps,
    };
  }

  /**
   * Get total royalties distributed
   */
  async getTotalRoyaltiesDistributed(): Promise<bigint> {
    const contract = this.getRoyaltyManagerContract(true);
    return await contract.totalRoyaltiesDistributed();
  }

  // ============================================================================
  // ROYALTY MANAGEMENT (Admin)
  // ============================================================================

  /**
   * Set advanced royalty for a collection
   * @param collection Collection address
   * @param recipients Array of royalty recipients
   * @param useERC2981 Whether to use ERC2981 standard
   */
  async setAdvancedRoyalty(
    collection: string,
    recipients: RoyaltyRecipient[],
    useERC2981: boolean
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getRoyaltyManagerContract();

    const tx = await contract.setAdvancedRoyalty(
      collection,
      recipients,
      useERC2981
    );
    await tx.wait();

    return tx;
  }

  /**
   * Add a royalty recipient to a collection
   */
  async addRoyaltyRecipient(
    collection: string,
    recipient: RoyaltyRecipient
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getRoyaltyManagerContract();

    const tx = await contract.addRoyaltyRecipient(collection, recipient);
    await tx.wait();

    return tx;
  }

  /**
   * Remove a royalty recipient from a collection
   */
  async removeRoyaltyRecipient(
    collection: string,
    recipientAddress: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getRoyaltyManagerContract();

    const tx = await contract.removeRoyaltyRecipient(
      collection,
      recipientAddress
    );
    await tx.wait();

    return tx;
  }

  /**
   * Set custom royalty contract for a collection
   */
  async setCustomRoyaltyContract(
    collection: string,
    customContract: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getRoyaltyManagerContract();

    const tx = await contract.setCustomRoyaltyContract(
      collection,
      customContract
    );
    await tx.wait();

    return tx;
  }

  /**
   * Update global royalty caps
   */
  async updateRoyaltyCaps(
    caps: RoyaltyCaps
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getRoyaltyManagerContract();

    const tx = await contract.updateRoyaltyCaps(caps);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // ROYALTY DISTRIBUTION
  // ============================================================================

  /**
   * Calculate and distribute royalties for a sale
   * @param collection NFT collection address
   * @param tokenId Token ID
   * @param salePrice Sale price in wei
   */
  async calculateAndDistributeRoyalties(
    collection: string,
    tokenId: bigint,
    salePrice: bigint
  ): Promise<{
    tx: ethers.ContractTransactionResponse;
    distributions: RoyaltyDistribution[];
  }> {
    const contract = this.getRoyaltyManagerContract();

    // Get recipients before distributing
    const recipients = await this.getRoyaltyRecipients(collection);
    const advancedInfo = await this.getAdvancedRoyalty(collection);

    const tx = await contract.calculateAndDistributeRoyalties(
      collection,
      tokenId,
      salePrice
    );
    await tx.wait();

    // Calculate distributions
    const distributions: RoyaltyDistribution[] = recipients
      .filter((r) => r.isActive)
      .map((r) => ({
        recipient: r.recipient,
        amount: (salePrice * r.basisPoints) / BigInt(10000),
        role: r.role,
      }));

    return {
      tx,
      distributions,
    };
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Check if contract supports ERC2981
   */
  async supportsERC2981(contractAddress: string): Promise<boolean> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const contract = new ethers.Contract(
      contractAddress,
      ["function supportsInterface(bytes4) view returns (bool)"],
      this.provider
    );

    try {
      // ERC2981 interface ID: 0x2a55205a
      return await contract.supportsInterface("0x2a55205a");
    } catch {
      return false;
    }
  }

  /**
   * Calculate total royalty for a sale price
   */
  static calculateTotalRoyalty(salePrice: bigint, royaltyBps: bigint): bigint {
    return (salePrice * royaltyBps) / BigInt(10000);
  }

  /**
   * Calculate seller proceeds after royalties
   */
  static calculateSellerProceeds(
    salePrice: bigint,
    royaltyBps: bigint,
    platformFeeBps: bigint
  ): bigint {
    const totalBps = royaltyBps + platformFeeBps;
    const totalFees = (salePrice * totalBps) / BigInt(10000);
    return salePrice - totalFees;
  }

  /**
   * Validate royalty percentage
   */
  static isValidRoyaltyBps(bps: bigint): boolean {
    return bps >= BigInt(0) && bps <= BigInt(1000); // Max 10%
  }

  /**
   * Convert basis points to percentage
   */
  static bpsToPercentage(bps: bigint): number {
    return Number(bps) / 100;
  }

  /**
   * Format royalty amount for display
   */
  static formatRoyalty(royaltyInWei: bigint, decimals: number = 18): string {
    return ethers.formatUnits(royaltyInWei, decimals);
  }

  /**
   * Split royalty among multiple recipients
   */
  static splitRoyalty(
    totalRoyalty: bigint,
    recipients: RoyaltyRecipient[]
  ): Map<string, bigint> {
    const totalBps = recipients.reduce(
      (sum, r) => sum + r.basisPoints,
      BigInt(0)
    );

    const distributions = new Map<string, bigint>();

    recipients.forEach((recipient) => {
      const amount = (totalRoyalty * recipient.basisPoints) / totalBps;
      distributions.set(recipient.recipient, amount);
    });

    return distributions;
  }
}

// Export singleton instance
export const royaltyManagerService = new RoyaltyManagerService();
