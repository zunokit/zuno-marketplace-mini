/**
 * Fee Manager Service
 * Handles advanced fee management including tiers, VIP status, and discounts
 * Based on AdvancedFeeManager.sol
 */

import { ethers } from "ethers";
import { marketplaceHubService } from "./MarketplaceHubService";
import { AdvancedFeeManager_ABI } from "@/lib/contracts/abis";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum FeeTierName {
  BRONZE = "Bronze",
  SILVER = "Silver",
  GOLD = "Gold",
  PLATINUM = "Platinum"
}

export interface FeeConfig {
  makerFee: bigint;      // Fee paid by seller (basis points)
  takerFee: bigint;      // Fee paid by buyer (basis points)
  listingFee: bigint;    // Fixed fee for creating listings (wei)
  auctionFee: bigint;    // Additional fee for auctions (basis points)
  bundleFee: bigint;     // Additional fee for bundle sales (basis points)
  isActive: boolean;     // Whether fees are active
}

export interface FeeTier {
  tierId: bigint;        // Current tier ID
  discountBps: bigint;   // Current discount in basis points
  lastUpdated: bigint;   // Last time tier was updated
}

export interface FeeTierConfig {
  volumeThreshold: bigint;  // Minimum volume to reach this tier (wei)
  discountBps: bigint;      // Discount in basis points (e.g., 100 = 1%)
  tierName: string;         // Human-readable tier name
  isActive: boolean;        // Whether this tier is active
}

export interface CollectionFeeOverride {
  makerFeeOverride: bigint;  // Override maker fee (basis points)
  takerFeeOverride: bigint;  // Override taker fee (basis points)
  discountBps: bigint;       // Additional discount for this collection
  hasOverride: boolean;      // Whether override is active
  isVerified: boolean;       // Whether collection is verified
  setAt: bigint;             // When override was set
}

export interface UserVolumeData {
  totalVolume: bigint;       // Total trading volume (wei)
  last30DaysVolume: bigint;  // Volume in last 30 days (wei)
  lastTradeTimestamp: bigint; // Last trade timestamp
  tradeCount: bigint;        // Total number of trades
}

export interface VIPStatus {
  isVIP: boolean;             // Whether user has VIP status
  vipDiscountBps: bigint;     // VIP-specific discount (basis points)
  vipExpiryTimestamp: bigint; // When VIP status expires
  vipTier: string;            // VIP tier name
}

export interface FeeCalculation {
  finalFee: bigint;          // Calculated fee amount
  appliedDiscount: bigint;   // Total discount applied (bps)
}

export interface TierUpgradeInfo {
  isEligible: boolean;       // Whether user is eligible for upgrade
  nextTierId: bigint;        // Next tier ID
  volumeNeeded: bigint;      // Additional volume needed
  nextTierDiscount: bigint;  // Discount at next tier
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class FeeManagerService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private feeManagerAddress: string | null = null;

  /**
   * Initialize fee manager service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Get fee manager address from hub's fee registry
    const hub = marketplaceHubService.getHub();
    const feeRegistryAddress = await hub.getFeeRegistry();

    // Note: FeeRegistry should provide FeeManager address
    // For now, we'll need to get it from FeeRegistry contract
    // TODO: Add getFeeManager() to FeeRegistry or Hub

    console.log("✅ FeeManagerService initialized");
  }

  /**
   * Get fee manager contract instance
   */
  private getFeeManagerContract(readOnly: boolean = false): ethers.Contract {
    if (readOnly && this.provider) {
      if (!this.feeManagerAddress) {
        throw new Error("FeeManager address not configured");
      }
      return new ethers.Contract(this.feeManagerAddress, AdvancedFeeManager_ABI, this.provider);
    }

    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    if (!this.feeManagerAddress) {
      throw new Error("FeeManager address not configured");
    }

    return new ethers.Contract(this.feeManagerAddress, AdvancedFeeManager_ABI, this.signer);
  }

  // ============================================================================
  // FEE CALCULATION
  // ============================================================================

  /**
   * Calculate fees for a transaction
   * @param user Address of the user (seller for maker, buyer for taker)
   * @param collection NFT collection address
   * @param salePrice Sale price in wei
   * @param isMaker Whether calculating maker fee (true) or taker fee (false)
   */
  async calculateFees(
    user: string,
    collection: string,
    salePrice: bigint,
    isMaker: boolean
  ): Promise<FeeCalculation> {
    const contract = this.getFeeManagerContract(true);

    const [finalFee, appliedDiscount] = await contract.calculateFees(
      user,
      collection,
      salePrice,
      isMaker
    );

    return {
      finalFee,
      appliedDiscount
    };
  }

  /**
   * Get effective fee rate for a user
   */
  async getEffectiveFeeRate(
    user: string,
    collection: string,
    isMaker: boolean
  ): Promise<{
    baseFeeRate: bigint;
    finalFeeRate: bigint;
    totalDiscount: bigint;
  }> {
    const contract = this.getFeeManagerContract(true);

    const result = await contract.getEffectiveFeeRate(user, collection, isMaker);

    return {
      baseFeeRate: result[0],
      finalFeeRate: result[1],
      totalDiscount: result[2]
    };
  }

  // ============================================================================
  // USER TIER & VOLUME
  // ============================================================================

  /**
   * Get user's current fee tier
   */
  async getUserFeeTier(user: string): Promise<FeeTier> {
    const contract = this.getFeeManagerContract(true);
    const tier = await contract.getUserFeeTier(user);

    return {
      tierId: tier.tierId,
      discountBps: tier.discountBps,
      lastUpdated: tier.lastUpdated
    };
  }

  /**
   * Get user's volume data
   */
  async getUserVolumeData(user: string): Promise<UserVolumeData> {
    const contract = this.getFeeManagerContract(true);
    const data = await contract.getUserVolumeData(user);

    return {
      totalVolume: data.totalVolume,
      last30DaysVolume: data.last30DaysVolume,
      lastTradeTimestamp: data.lastTradeTimestamp,
      tradeCount: data.tradeCount
    };
  }

  /**
   * Check if user is eligible for tier upgrade
   */
  async checkTierUpgradeEligibility(user: string): Promise<TierUpgradeInfo> {
    const contract = this.getFeeManagerContract(true);
    const result = await contract.checkTierUpgradeEligibility(user);

    return {
      isEligible: result[0],
      nextTierId: result[1],
      volumeNeeded: result[2],
      nextTierDiscount: result[3]
    };
  }

  // ============================================================================
  // VIP STATUS
  // ============================================================================

  /**
   * Get user's VIP status
   */
  async getUserVIPStatus(user: string): Promise<VIPStatus> {
    const contract = this.getFeeManagerContract(true);
    const vip = await contract.getUserVIPStatus(user);

    return {
      isVIP: vip.isVIP,
      vipDiscountBps: vip.vipDiscountBps,
      vipExpiryTimestamp: vip.vipExpiryTimestamp,
      vipTier: vip.vipTier
    };
  }

  /**
   * Update VIP status (admin only)
   */
  async updateVIPStatus(
    user: string,
    vipData: VIPStatus
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getFeeManagerContract();

    const tx = await contract.updateVIPStatus(user, vipData);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // COLLECTION OVERRIDES
  // ============================================================================

  /**
   * Get collection-specific fee override
   */
  async getCollectionFeeOverride(collection: string): Promise<CollectionFeeOverride> {
    const contract = this.getFeeManagerContract(true);
    const override = await contract.getCollectionFeeOverride(collection);

    return {
      makerFeeOverride: override.makerFeeOverride,
      takerFeeOverride: override.takerFeeOverride,
      discountBps: override.discountBps,
      hasOverride: override.hasOverride,
      isVerified: override.isVerified,
      setAt: override.setAt
    };
  }

  /**
   * Set collection fee override (admin only)
   */
  async setCollectionFeeOverride(
    collection: string,
    feeOverride: CollectionFeeOverride
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getFeeManagerContract();

    const tx = await contract.setCollectionFeeOverride(collection, feeOverride);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // FEE CONFIGURATION
  // ============================================================================

  /**
   * Get base fee configuration
   */
  async getBaseFeeConfig(): Promise<FeeConfig> {
    const contract = this.getFeeManagerContract(true);
    const config = await contract.getBaseFeeConfig();

    return {
      makerFee: config.makerFee,
      takerFee: config.takerFee,
      listingFee: config.listingFee,
      auctionFee: config.auctionFee,
      bundleFee: config.bundleFee,
      isActive: config.isActive
    };
  }

  /**
   * Update base fee config (admin only)
   */
  async updateBaseFeeConfig(
    newConfig: FeeConfig
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getFeeManagerContract();

    const tx = await contract.updateBaseFeeConfig(newConfig);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // TIER MANAGEMENT
  // ============================================================================

  /**
   * Get fee tier configuration
   */
  async getFeeTierConfig(tierId: number): Promise<FeeTierConfig> {
    const contract = this.getFeeManagerContract(true);
    const config = await contract.getFeeTierConfig(tierId);

    return {
      volumeThreshold: config.volumeThreshold,
      discountBps: config.discountBps,
      tierName: config.tierName,
      isActive: config.isActive
    };
  }

  /**
   * Get all fee tier configurations
   */
  async getAllFeeTierConfigs(): Promise<FeeTierConfig[]> {
    const contract = this.getFeeManagerContract(true);
    const configs = await contract.getAllFeeTierConfigs();

    return configs.map((config: any) => ({
      volumeThreshold: config.volumeThreshold,
      discountBps: config.discountBps,
      tierName: config.tierName,
      isActive: config.isActive
    }));
  }

  /**
   * Update fee tier (admin only)
   */
  async updateFeeTier(
    tierId: number,
    tierConfig: FeeTierConfig
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getFeeManagerContract();

    const tx = await contract.updateFeeTier(tierId, tierConfig);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // ADMIN FUNCTIONS
  // ============================================================================

  /**
   * Update user volume (operator only)
   */
  async updateUserVolume(
    user: string,
    tradeVolume: bigint
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getFeeManagerContract();

    const tx = await contract.updateUserVolume(user, tradeVolume);
    await tx.wait();

    return tx;
  }

  /**
   * Batch update user volumes (operator only)
   */
  async batchUpdateUserVolumes(
    users: string[],
    volumes: bigint[]
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getFeeManagerContract();

    const tx = await contract.batchUpdateUserVolumes(users, volumes);
    await tx.wait();

    return tx;
  }

  /**
   * Update fee recipient (admin only)
   */
  async updateFeeRecipient(
    newRecipient: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getFeeManagerContract();

    const tx = await contract.updateFeeRecipient(newRecipient);
    await tx.wait();

    return tx;
  }

  /**
   * Emergency pause (emergency role only)
   */
  async emergencyPause(): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getFeeManagerContract();

    const tx = await contract.emergencyPause();
    await tx.wait();

    return tx;
  }

  /**
   * Unpause (admin only)
   */
  async unpause(): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getFeeManagerContract();

    const tx = await contract.unpause();
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Convert basis points to percentage
   */
  static bpsToPercentage(bps: bigint): number {
    return Number(bps) / 100;
  }

  /**
   * Convert percentage to basis points
   */
  static percentageToBps(percentage: number): bigint {
    return BigInt(Math.floor(percentage * 100));
  }

  /**
   * Format fee amount for display
   */
  static formatFee(feeInWei: bigint, decimals: number = 18): string {
    return ethers.formatUnits(feeInWei, decimals);
  }

  /**
   * Get tier name by ID
   */
  static getTierName(tierId: bigint): FeeTierName | string {
    switch (Number(tierId)) {
      case 0: return FeeTierName.BRONZE;
      case 1: return FeeTierName.SILVER;
      case 2: return FeeTierName.GOLD;
      case 3: return FeeTierName.PLATINUM;
      default: return `Tier ${tierId}`;
    }
  }
}

// Export singleton instance
export const feeManagerService = new FeeManagerService();
