/**
 * AdminHub Service
 * Administrative operations for marketplace management
 * Requires admin role for all operations
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { envConfigManager } from "@/lib/utils/env-config";

// AdminHub is deployment-specific and not in UserHub
// Must be configured separately via environment
const ADMIN_HUB_KEY = "NEXT_PUBLIC_ADMIN_HUB";

export interface AdminHubConfig {
  exchangeRegistry: string;
  collectionRegistry: string;
  feeRegistry: string;
  auctionRegistry: string;
}

export enum TokenStandard {
  ERC721 = 0,
  ERC1155 = 1,
}

export enum AuctionType {
  ENGLISH = 0,
  DUTCH = 1,
}

export class AdminHubService {
  private adminHub: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize AdminHub service
   * Note: AdminHub address must be configured in environment
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    
    // Get AdminHub address from environment config
    const config = envConfigManager.getConfig();
    const adminHubAddress = config[`${ADMIN_HUB_KEY}_${chainId}`] || 
                           config[ADMIN_HUB_KEY];

    if (!adminHubAddress) {
      logger.warn(
        "AdminHub not configured - admin operations unavailable",
        { chainId },
        { component: "AdminHubService", action: "initialize" }
      );
      return;
    }

    try {
      // Verify contract exists
      const code = await provider.getCode(adminHubAddress);
      if (code === "0x") {
        throw new Error("No contract at AdminHub address");
      }

      // Note: We would need AdminHub_ABI imported
      // For now, using a placeholder - this needs the actual ABI
      const AdminHub_ABI = [
        "function registerExchange(uint8 tokenStandard, address exchange) external",
        "function unregisterExchange(uint8 tokenStandard) external",
        "function registerCollectionFactory(string tokenType, address factory) external",
        "function unregisterCollectionFactory(string tokenType) external",
        "function registerAuction(uint8 auctionType, address auction) external",
        "function unregisterAuction(uint8 auctionType) external",
        "function setFeeRegistry(address feeRegistry) external",
        "function setAdditionalContracts(address validator, address emergency, address access, address history) external",
        "function emergencyPause() external",
        "function emergencyUnpause() external",
        "function getAllRegistries() external view returns (address, address, address, address)",
      ];

      this.adminHub = new ethers.Contract(
        adminHubAddress,
        AdminHub_ABI,
        signer || provider
      );

      logger.success(
        "AdminHub initialized",
        { address: adminHubAddress },
        { component: "AdminHubService", action: "initialize" }
      );
    } catch (error) {
      logger.error("Failed to initialize AdminHub", error, {
        component: "AdminHubService",
        action: "initialize",
      });
    }
  }

  /**
   * Register new exchange contract
   */
  async registerExchange(
    tokenStandard: TokenStandard,
    exchangeAddress: string
  ): Promise<void> {
    try {
      if (!this.adminHub || !this.signer) {
        throw new Error("AdminHub not initialized or no signer");
      }

      const tx = await this.adminHub.registerExchange(tokenStandard, exchangeAddress);
      await tx.wait();

      logger.success(
        "Exchange registered",
        { tokenStandard, exchangeAddress },
        { component: "AdminHubService", action: "registerExchange" }
      );
    } catch (error) {
      logger.error("Failed to register exchange", error, {
        component: "AdminHubService",
        action: "registerExchange",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Unregister exchange contract
   */
  async unregisterExchange(tokenStandard: TokenStandard): Promise<void> {
    try {
      if (!this.adminHub || !this.signer) {
        throw new Error("AdminHub not initialized or no signer");
      }

      const tx = await this.adminHub.unregisterExchange(tokenStandard);
      await tx.wait();

      logger.success(
        "Exchange unregistered",
        { tokenStandard },
        { component: "AdminHubService", action: "unregisterExchange" }
      );
    } catch (error) {
      logger.error("Failed to unregister exchange", error, {
        component: "AdminHubService",
        action: "unregisterExchange",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Register collection factory
   */
  async registerCollectionFactory(
    tokenType: "ERC721" | "ERC1155",
    factoryAddress: string
  ): Promise<void> {
    try {
      if (!this.adminHub || !this.signer) {
        throw new Error("AdminHub not initialized or no signer");
      }

      const tx = await this.adminHub.registerCollectionFactory(tokenType, factoryAddress);
      await tx.wait();

      logger.success(
        "Collection factory registered",
        { tokenType, factoryAddress },
        { component: "AdminHubService", action: "registerCollectionFactory" }
      );
    } catch (error) {
      logger.error("Failed to register collection factory", error, {
        component: "AdminHubService",
        action: "registerCollectionFactory",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Unregister collection factory
   */
  async unregisterCollectionFactory(tokenType: "ERC721" | "ERC1155"): Promise<void> {
    try {
      if (!this.adminHub || !this.signer) {
        throw new Error("AdminHub not initialized or no signer");
      }

      const tx = await this.adminHub.unregisterCollectionFactory(tokenType);
      await tx.wait();

      logger.success(
        "Collection factory unregistered",
        { tokenType },
        { component: "AdminHubService", action: "unregisterCollectionFactory" }
      );
    } catch (error) {
      logger.error("Failed to unregister collection factory", error, {
        component: "AdminHubService",
        action: "unregisterCollectionFactory",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Register auction contract
   */
  async registerAuction(
    auctionType: AuctionType,
    auctionAddress: string
  ): Promise<void> {
    try {
      if (!this.adminHub || !this.signer) {
        throw new Error("AdminHub not initialized or no signer");
      }

      const tx = await this.adminHub.registerAuction(auctionType, auctionAddress);
      await tx.wait();

      logger.success(
        "Auction registered",
        { auctionType, auctionAddress },
        { component: "AdminHubService", action: "registerAuction" }
      );
    } catch (error) {
      logger.error("Failed to register auction", error, {
        component: "AdminHubService",
        action: "registerAuction",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Unregister auction contract
   */
  async unregisterAuction(auctionType: AuctionType): Promise<void> {
    try {
      if (!this.adminHub || !this.signer) {
        throw new Error("AdminHub not initialized or no signer");
      }

      const tx = await this.adminHub.unregisterAuction(auctionType);
      await tx.wait();

      logger.success(
        "Auction unregistered",
        { auctionType },
        { component: "AdminHubService", action: "unregisterAuction" }
      );
    } catch (error) {
      logger.error("Failed to unregister auction", error, {
        component: "AdminHubService",
        action: "unregisterAuction",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Set fee registry address
   */
  async setFeeRegistry(feeRegistryAddress: string): Promise<void> {
    try {
      if (!this.adminHub || !this.signer) {
        throw new Error("AdminHub not initialized or no signer");
      }

      const tx = await this.adminHub.setFeeRegistry(feeRegistryAddress);
      await tx.wait();

      logger.success(
        "Fee registry updated",
        { feeRegistryAddress },
        { component: "AdminHubService", action: "setFeeRegistry" }
      );
    } catch (error) {
      logger.error("Failed to set fee registry", error, {
        component: "AdminHubService",
        action: "setFeeRegistry",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Set additional contracts (validator, emergency, access, history)
   */
  async setAdditionalContracts(
    validatorAddress: string,
    emergencyAddress: string,
    accessControlAddress: string,
    historyTrackerAddress: string
  ): Promise<void> {
    try {
      if (!this.adminHub || !this.signer) {
        throw new Error("AdminHub not initialized or no signer");
      }

      const tx = await this.adminHub.setAdditionalContracts(
        validatorAddress,
        emergencyAddress,
        accessControlAddress,
        historyTrackerAddress
      );
      await tx.wait();

      logger.success(
        "Additional contracts updated",
        {
          validator: validatorAddress,
          emergency: emergencyAddress,
          accessControl: accessControlAddress,
          historyTracker: historyTrackerAddress,
        },
        { component: "AdminHubService", action: "setAdditionalContracts" }
      );
    } catch (error) {
      logger.error("Failed to set additional contracts", error, {
        component: "AdminHubService",
        action: "setAdditionalContracts",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Emergency pause all operations
   */
  async emergencyPause(): Promise<void> {
    try {
      if (!this.adminHub || !this.signer) {
        throw new Error("AdminHub not initialized or no signer");
      }

      const tx = await this.adminHub.emergencyPause();
      await tx.wait();

      logger.success(
        "System emergency paused",
        null,
        { component: "AdminHubService", action: "emergencyPause" }
      );
    } catch (error) {
      logger.error("Failed to emergency pause", error, {
        component: "AdminHubService",
        action: "emergencyPause",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Emergency unpause operations
   */
  async emergencyUnpause(): Promise<void> {
    try {
      if (!this.adminHub || !this.signer) {
        throw new Error("AdminHub not initialized or no signer");
      }

      const tx = await this.adminHub.emergencyUnpause();
      await tx.wait();

      logger.success(
        "System emergency unpaused",
        null,
        { component: "AdminHubService", action: "emergencyUnpause" }
      );
    } catch (error) {
      logger.error("Failed to emergency unpause", error, {
        component: "AdminHubService",
        action: "emergencyUnpause",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get all registry addresses
   */
  async getAllRegistries(): Promise<AdminHubConfig> {
    try {
      if (!this.adminHub) {
        throw new Error("AdminHub not initialized");
      }

      const registries = await this.adminHub.getAllRegistries();

      return {
        exchangeRegistry: registries[0],
        collectionRegistry: registries[1],
        feeRegistry: registries[2],
        auctionRegistry: registries[3],
      };
    } catch (error) {
      logger.error("Failed to get registries", error, {
        component: "AdminHubService",
        action: "getAllRegistries",
      });
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.adminHub !== null;
  }

  /**
   * Format transaction error for user-friendly messages
   */
  private formatTransactionError(error: any): Error {
    if (error.code === "ACTION_REJECTED") {
      return new Error("Transaction was rejected by user");
    }
    if (error.message?.includes("Ownable: caller is not the owner")) {
      return new Error("Admin role required for this operation");
    }
    if (error.message?.includes("execution reverted")) {
      const revertReason = error.message.split("execution reverted: ")[1];
      return new Error(revertReason || "Transaction failed");
    }
    return new Error(error.message || "Transaction failed");
  }
}

// Export singleton instance
export const adminHubService = new AdminHubService();
