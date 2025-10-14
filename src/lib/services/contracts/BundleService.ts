/**
 * Bundle Service
 * Handles bundle creation, purchasing, and management operations
 * Now uses MarketplaceHub for address discovery
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { BundleManager_ABI } from "@/lib/contracts/abis";
import { userHubService } from "@/lib/services/contracts/UserHubService";

export interface BundleItem {
  collection: string;
  tokenId: string;
  amount: string;
  tokenType: "ERC721" | "ERC1155";
}

export interface CreateBundleParams {
  items: BundleItem[];
  totalPrice: string;
  discountPercentage: number;
  duration: number; // in seconds
  description: string;
  imageUrl: string;
}

export interface BundleInfo {
  id: string;
  seller: string;
  totalPrice: string;
  discountPercentage: number;
  status: "ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED" | "UNKNOWN";
  startTime: number;
  endTime: number;
  createdAt: number;
  soldAt: number;
  buyer: string;
  description: string;
  imageUrl: string;
  items: Array<{
    collection: string;
    tokenId: string;
    amount: string;
    tokenType: "ERC721" | "ERC1155";
    isIncluded: boolean;
  }>;
}

export class BundleService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private bundleManagerAddress: string | null = null;
  
  /**
   * Get bundle manager contract for direct access
   */
  async getBundleManagerContract(): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }
    if (!this.bundleManagerAddress) {
      throw new Error("Bundle manager not initialized");
    }
    
    return new ethers.Contract(
      this.bundleManagerAddress,
      BundleManager_ABI,
      this.signer
    );
  }
  
  /**
   * Get signer for direct contract interaction
   */
  getSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }
    return this.signer;
  }
  
  /**
   * Get provider
   */
  getProvider(): ethers.Provider {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }
    return this.provider;
  }

  /**
   * Initialize bundle service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Get bundle manager address from hub
    const addresses = userHubService.getAddresses();
    this.bundleManagerAddress = addresses.bundleManager;

    logger.success(
      "BundleService initialized with BundleManager",
      { bundleManagerAddress: this.bundleManagerAddress },
      { component: "BundleService", action: "initialize" }
    );
  }



  /**
   * Creates a new bundle
   */
  async createBundle(params: CreateBundleParams): Promise<string> {
    try {
      const contract = await this.getBundleManagerContract();

      const bundleItems = params.items.map((item) => ({
        collection: item.collection,
        tokenId: item.tokenId,
        amount: item.amount,
        tokenType: item.tokenType === "ERC721" ? 0 : 1,
      }));

      const priceInWei = ethers.parseEther(params.totalPrice);
      const endTime = Math.floor(Date.now() / 1000) + params.duration;

      const tx = await contract.createBundle(
        bundleItems,
        priceInWei,
        params.discountPercentage * 100, // Convert to basis points
        endTime,
        params.description,
        params.imageUrl
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === "BundleCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        return parsed?.args.bundleId.toString();
      }

      throw new Error("BundleCreated event not found");
    } catch (error) {
      logger.error("Error creating bundle", error, {
        component: "BundleService",
        action: "createBundle",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Updates bundle price and discount
   */
  async updateBundlePrice(
    bundleId: string,
    newPrice: string,
    newDiscount: number
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = await this.getBundleManagerContract();
      const priceInWei = ethers.parseEther(newPrice);

      const tx = await contract.updateBundlePrice(
        bundleId,
        priceInWei,
        newDiscount * 100 // Convert to basis points
      );

      return tx;
    } catch (error) {
      logger.error("Error updating bundle price", error, {
        component: "BundleService",
        action: "updateBundlePrice",
      });
      throw this.formatTransactionError(error);
    }
  }



  /**
   * Gets bundle details
   */
  async getBundle(bundleId: string): Promise<BundleInfo> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      const address = process.env.NEXT_PUBLIC_BUNDLE_MANAGER_ADDRESS;
      if (!address) {
        throw new Error("BundleManager address not configured");
      }

      const contract = new ethers.Contract(
        address,
        BundleManager_ABI,
        this.provider
      );

      const [bundle, timing, metadata, items] = await Promise.all([
        contract.bundles(bundleId),
        contract.bundleTiming(bundleId),
        contract.bundleMetadata(bundleId),
        contract.getBundleItems(bundleId),
      ]);

      return {
        id: bundleId,
        seller: bundle.seller,
        totalPrice: ethers.formatEther(bundle.totalPrice),
        discountPercentage: bundle.discountPercentage / 100,
        status: this.getBundleStatus(bundle.status),
        startTime: timing.startTime.toString(),
        endTime: timing.endTime.toString(),
        createdAt: timing.createdAt.toString(),
        soldAt: timing.soldAt.toString(),
        buyer: metadata.buyer,
        description: metadata.description,
        imageUrl: metadata.imageUrl,
        items: items.map((item: any) => ({
          collection: item.collection,
          tokenId: item.tokenId.toString(),
          amount: item.amount.toString(),
          tokenType: item.tokenType === 0 ? "ERC721" : "ERC1155",
          isIncluded: item.isIncluded,
        })),
      };
    } catch (error) {
      logger.error("Error getting bundle", error, {
        component: "BundleService",
        action: "getBundle",
      });
      throw error;
    }
  }

  /**
   * Gets all bundles for a user
   */
  async getUserBundles(userAddress: string): Promise<BundleInfo[]> {
    try {
      const contract = await this.getBundleManagerContract();
      const bundleIds = await contract.getUserBundles(userAddress);
      return Promise.all(
        bundleIds.map((id: bigint) => this.getBundle(id.toString()))
      );
    } catch (error) {
      logger.error("Error getting user bundles", error, {
        component: "BundleService",
        action: "getUserBundles",
      });
      throw error;
    }
  }

  /**
   * Purchases a bundle
   */
  async purchaseBundle(
    bundleId: string,
    price: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = await this.getBundleManagerContract();

      const tx = await contract.purchaseBundle(bundleId, {
        value: ethers.parseEther(price),
      });

      return tx;
    } catch (error) {
      logger.error("Error purchasing bundle", error, {
        component: "BundleService",
        action: "purchaseBundle",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Cancels a bundle
   */
  async cancelBundle(
    bundleId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = await this.getBundleManagerContract();
      const tx = await contract.cancelBundle(bundleId);
      return tx;
    } catch (error) {
      logger.error("Error canceling bundle", error, {
        component: "BundleService",
        action: "cancelBundle",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Gets all active bundles
   */
  async getActiveBundles(): Promise<BundleInfo[]> {
    try {
      const contract = await this.getBundleManagerContract();
      const bundleIds = await contract.getActiveBundles();
      return Promise.all(
        bundleIds.map((id: bigint) => this.getBundle(id.toString()))
      );
    } catch (error) {
      logger.error("Error getting active bundles", error, {
        component: "BundleService",
        action: "getActiveBundles",
      });
      throw error;
    }
  }

  /**
   * Gets bundles by collection
   */
  async getBundlesByCollection(collection: string): Promise<BundleInfo[]> {
    try {
      const contract = await this.getBundleManagerContract();
      const bundleIds = await contract.getBundlesByCollection(collection);
      return Promise.all(
        bundleIds.map((id: bigint) => this.getBundle(id.toString()))
      );
    } catch (error) {
      logger.error("Error getting bundles by collection", error, {
        component: "BundleService",
        action: "getBundlesByCollection",
      });
      throw error;
    }
  }

  /**
   * Gets user's purchased bundles
   */
  async getUserPurchasedBundles(userAddress: string): Promise<BundleInfo[]> {
    try {
      const contract = await this.getBundleManagerContract();
      const bundleIds = await contract.getUserPurchasedBundles(userAddress);
      return Promise.all(
        bundleIds.map((id: bigint) => this.getBundle(id.toString()))
      );
    } catch (error) {
      logger.error("Error getting user purchased bundles", error, {
        component: "BundleService",
        action: "getUserPurchasedBundles",
      });
      throw error;
    }
  }

  /**
   * Check if bundle is available for purchase
   */
  async isBundleAvailable(bundleId: string): Promise<boolean> {
    try {
      const contract = await this.getBundleManagerContract();
      return await contract.isBundleAvailable(bundleId);
    } catch (error) {
      logger.error("Error checking bundle availability", error, {
        component: "BundleService",
        action: "isBundleAvailable",
      });
      return false;
    }
  }


  /**
   * Get bundle status from status code
   */
  private getBundleStatus(
    statusCode: number
  ): "ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED" | "UNKNOWN" {
    const statuses: ("ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED")[] = [
      "ACTIVE",
      "SOLD",
      "CANCELLED",
      "EXPIRED",
    ];
    return statuses[statusCode] || "UNKNOWN";
  }

  /**
   * Format transaction error for user-friendly messages
   */
  private formatTransactionError(error: any): Error {
    if (error.code === "ACTION_REJECTED") {
      return new Error("Transaction was rejected by user");
    }
    if (error.code === "INSUFFICIENT_FUNDS") {
      return new Error("Insufficient funds to complete transaction");
    }
    if (error.message?.includes("execution reverted")) {
      const revertReason = error.message.split("execution reverted: ")[1];
      return new Error(revertReason || "Transaction failed");
    }
    return new Error(error.message || "Transaction failed");
  }
}

// Export singleton instance
export const bundleService = new BundleService();
