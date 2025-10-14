/**
 * Marketplace Validator Service
 * Tracks NFT status across marketplace to prevent double-listing
 * Validates NFT availability before listing/auction operations
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { envConfigManager } from "@/lib/utils/env-config";

// MarketplaceValidator is deployment-specific and not in UserHub
// Must be configured separately via environment
const VALIDATOR_KEY = "NEXT_PUBLIC_MARKETPLACE_VALIDATOR";

export enum NFTStatus {
  AVAILABLE = 0,
  LISTED = 1,
  AUCTIONED = 2,
  SOLD = 3,
  CANCELLED = 4,
}

export interface NFTStatusInfo {
  isAvailable: boolean;
  currentStatus: NFTStatus;
  listingId?: string;
  lastUpdated: bigint;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class MarketplaceValidatorService {
  private validator: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize MarketplaceValidator service
   * Note: Validator address must be configured in environment
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    
    // Get validator address from environment config
    const config = envConfigManager.getConfig();
    const validatorAddress = config[`${VALIDATOR_KEY}_${chainId}`] || 
                           config[VALIDATOR_KEY];

    if (!validatorAddress) {
      logger.warn(
        "MarketplaceValidator not configured - NFT status validation unavailable",
        { chainId },
        { component: "MarketplaceValidatorService", action: "initialize" }
      );
      return;
    }

    try {
      // Verify contract exists
      const code = await provider.getCode(validatorAddress);
      if (code === "0x") {
        throw new Error("No contract at MarketplaceValidator address");
      }

      // Define MarketplaceValidator ABI
      const MarketplaceValidator_ABI = [
        "function isNFTAvailable(address nftContract, uint256 tokenId, address owner) external view returns (bool isAvailable, uint8 status)",
        "function getNFTIdentifier(address nftContract, uint256 tokenId, address owner) external pure returns (bytes32)",
        "function getNFTStatus(address nftContract, uint256 tokenId, address owner) external view returns (uint8)",
        "function updateNFTStatus(bytes32 nftId, uint8 newStatus) external",
        "function registerExchange(address exchange, string calldata exchangeType) external",
        "function unregisterExchange(address exchange) external",
        "function registerAuction(address auction, string calldata auctionType) external",
        "function unregisterAuction(address auction) external",
        "function registeredExchanges(address exchange) external view returns (bool)",
        "function registeredAuctions(address auction) external view returns (bool)",
        "function getAllExchanges() external view returns (address[] memory)",
        "function getAllAuctions() external view returns (address[] memory)",
        "function emergencyResetNFTStatus(address nftContract, uint256 tokenId, address owner) external",
        "function validateListing(address nftContract, uint256 tokenId, address owner, uint256 price, uint256 duration) external view returns (bool, string[] memory)",
        "function validateAuction(address nftContract, uint256 tokenId, address owner, uint256 startPrice, uint256 reservePrice, uint256 duration) external view returns (bool, string[] memory)",
        "event NFTStatusUpdated(bytes32 indexed nftId, uint8 oldStatus, uint8 newStatus, address updatedBy)",
        "event ExchangeRegistered(address indexed exchange, string exchangeType)",
        "event AuctionRegistered(address indexed auction, string auctionType)",
      ];

      this.validator = new ethers.Contract(
        validatorAddress,
        MarketplaceValidator_ABI,
        signer || provider
      );

      logger.success(
        "MarketplaceValidator initialized",
        { address: validatorAddress },
        { component: "MarketplaceValidatorService", action: "initialize" }
      );
    } catch (error) {
      logger.error("Failed to initialize MarketplaceValidator", error, {
        component: "MarketplaceValidatorService",
        action: "initialize",
      });
    }
  }

  /**
   * Check if NFT is available for listing/auction
   */
  async isNFTAvailable(
    nftContract: string,
    tokenId: string,
    ownerAddress: string
  ): Promise<NFTStatusInfo> {
    try {
      if (!this.validator) {
        // If validator not configured, assume available
        return {
          isAvailable: true,
          currentStatus: NFTStatus.AVAILABLE,
          lastUpdated: 0n,
        };
      }

      const [isAvailable, status] = await this.validator.isNFTAvailable(
        nftContract,
        tokenId,
        ownerAddress
      );

      return {
        isAvailable,
        currentStatus: status as NFTStatus,
        lastUpdated: BigInt(Date.now()),
      };
    } catch (error) {
      logger.error("Failed to check NFT availability", error, {
        component: "MarketplaceValidatorService",
        action: "isNFTAvailable",
      });
      // Default to available on error
      return {
        isAvailable: true,
        currentStatus: NFTStatus.AVAILABLE,
        lastUpdated: 0n,
      };
    }
  }

  /**
   * Get NFT identifier for tracking
   */
  async getNFTIdentifier(
    nftContract: string,
    tokenId: string,
    ownerAddress: string
  ): Promise<string> {
    try {
      if (!this.validator) {
        // Generate identifier locally if validator not available
        return ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "uint256", "address"],
            [nftContract, tokenId, ownerAddress]
          )
        );
      }

      return await this.validator.getNFTIdentifier(
        nftContract,
        tokenId,
        ownerAddress
      );
    } catch (error) {
      logger.error("Failed to get NFT identifier", error, {
        component: "MarketplaceValidatorService",
        action: "getNFTIdentifier",
      });
      throw error;
    }
  }

  /**
   * Get NFT status
   */
  async getNFTStatus(
    nftContract: string,
    tokenId: string,
    ownerAddress: string
  ): Promise<NFTStatus> {
    try {
      if (!this.validator) {
        return NFTStatus.AVAILABLE;
      }

      const status = await this.validator.getNFTStatus(
        nftContract,
        tokenId,
        ownerAddress
      );

      return status as NFTStatus;
    } catch (error) {
      logger.error("Failed to get NFT status", error, {
        component: "MarketplaceValidatorService",
        action: "getNFTStatus",
      });
      return NFTStatus.AVAILABLE;
    }
  }

  /**
   * Update NFT status (called by exchanges/auctions)
   */
  async updateNFTStatus(nftId: string, newStatus: NFTStatus): Promise<void> {
    try {
      if (!this.validator || !this.signer) {
        logger.warn("Cannot update NFT status - validator not initialized", null, {
          component: "MarketplaceValidatorService",
          action: "updateNFTStatus",
        });
        return;
      }

      const tx = await this.validator.updateNFTStatus(nftId, newStatus);
      await tx.wait();

      logger.info(
        "NFT status updated",
        { nftId, newStatus },
        { component: "MarketplaceValidatorService", action: "updateNFTStatus" }
      );
    } catch (error) {
      logger.error("Failed to update NFT status", error, {
        component: "MarketplaceValidatorService",
        action: "updateNFTStatus",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Validate listing parameters
   */
  async validateListing(
    nftContract: string,
    tokenId: string,
    ownerAddress: string,
    price: string,
    duration: number
  ): Promise<ValidationResult> {
    try {
      if (!this.validator) {
        // Basic validation if validator not available
        const errors: string[] = [];
        const warnings: string[] = [];

        if (BigInt(price) <= 0n) {
          errors.push("Price must be greater than zero");
        }
        if (duration <= 0) {
          errors.push("Duration must be greater than zero");
        }
        if (duration > 365 * 24 * 60 * 60) {
          warnings.push("Listing duration exceeds one year");
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      }

      const [isValid, validationErrors] = await this.validator.validateListing(
        nftContract,
        tokenId,
        ownerAddress,
        ethers.parseEther(price),
        duration
      );

      return {
        isValid,
        errors: isValid ? [] : validationErrors,
        warnings: [],
      };
    } catch (error) {
      logger.error("Failed to validate listing", error, {
        component: "MarketplaceValidatorService",
        action: "validateListing",
      });
      return {
        isValid: true, // Allow listing on validation error
        errors: [],
        warnings: ["Could not validate listing parameters"],
      };
    }
  }

  /**
   * Validate auction parameters
   */
  async validateAuction(
    nftContract: string,
    tokenId: string,
    ownerAddress: string,
    startPrice: string,
    reservePrice: string,
    duration: number
  ): Promise<ValidationResult> {
    try {
      if (!this.validator) {
        // Basic validation if validator not available
        const errors: string[] = [];
        const warnings: string[] = [];

        const startPriceBN = BigInt(ethers.parseEther(startPrice));
        const reservePriceBN = BigInt(ethers.parseEther(reservePrice));

        if (startPriceBN <= 0n) {
          errors.push("Start price must be greater than zero");
        }
        if (reservePriceBN > 0n && reservePriceBN < startPriceBN) {
          errors.push("Reserve price must be greater than or equal to start price");
        }
        if (duration <= 0) {
          errors.push("Duration must be greater than zero");
        }
        if (duration > 30 * 24 * 60 * 60) {
          warnings.push("Auction duration exceeds 30 days");
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      }

      const [isValid, validationErrors] = await this.validator.validateAuction(
        nftContract,
        tokenId,
        ownerAddress,
        ethers.parseEther(startPrice),
        ethers.parseEther(reservePrice),
        duration
      );

      return {
        isValid,
        errors: isValid ? [] : validationErrors,
        warnings: [],
      };
    } catch (error) {
      logger.error("Failed to validate auction", error, {
        component: "MarketplaceValidatorService",
        action: "validateAuction",
      });
      return {
        isValid: true, // Allow auction on validation error
        errors: [],
        warnings: ["Could not validate auction parameters"],
      };
    }
  }

  /**
   * Check if exchange is registered
   */
  async isExchangeRegistered(exchangeAddress: string): Promise<boolean> {
    try {
      if (!this.validator) {
        return true; // Assume registered if validator not available
      }

      return await this.validator.registeredExchanges(exchangeAddress);
    } catch (error) {
      logger.error("Failed to check exchange registration", error, {
        component: "MarketplaceValidatorService",
        action: "isExchangeRegistered",
      });
      return true;
    }
  }

  /**
   * Check if auction is registered
   */
  async isAuctionRegistered(auctionAddress: string): Promise<boolean> {
    try {
      if (!this.validator) {
        return true; // Assume registered if validator not available
      }

      return await this.validator.registeredAuctions(auctionAddress);
    } catch (error) {
      logger.error("Failed to check auction registration", error, {
        component: "MarketplaceValidatorService",
        action: "isAuctionRegistered",
      });
      return true;
    }
  }

  /**
   * Get all registered exchanges
   */
  async getAllExchanges(): Promise<string[]> {
    try {
      if (!this.validator) {
        return [];
      }

      return await this.validator.getAllExchanges();
    } catch (error) {
      logger.error("Failed to get all exchanges", error, {
        component: "MarketplaceValidatorService",
        action: "getAllExchanges",
      });
      return [];
    }
  }

  /**
   * Get all registered auctions
   */
  async getAllAuctions(): Promise<string[]> {
    try {
      if (!this.validator) {
        return [];
      }

      return await this.validator.getAllAuctions();
    } catch (error) {
      logger.error("Failed to get all auctions", error, {
        component: "MarketplaceValidatorService",
        action: "getAllAuctions",
      });
      return [];
    }
  }

  /**
   * Register exchange (admin only)
   */
  async registerExchange(
    exchangeAddress: string,
    exchangeType: string
  ): Promise<void> {
    try {
      if (!this.validator || !this.signer) {
        throw new Error("Validator not initialized or no signer");
      }

      const tx = await this.validator.registerExchange(exchangeAddress, exchangeType);
      await tx.wait();

      logger.success(
        "Exchange registered with validator",
        { exchangeAddress, exchangeType },
        { component: "MarketplaceValidatorService", action: "registerExchange" }
      );
    } catch (error) {
      logger.error("Failed to register exchange", error, {
        component: "MarketplaceValidatorService",
        action: "registerExchange",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Register auction (admin only)
   */
  async registerAuction(
    auctionAddress: string,
    auctionType: string
  ): Promise<void> {
    try {
      if (!this.validator || !this.signer) {
        throw new Error("Validator not initialized or no signer");
      }

      const tx = await this.validator.registerAuction(auctionAddress, auctionType);
      await tx.wait();

      logger.success(
        "Auction registered with validator",
        { auctionAddress, auctionType },
        { component: "MarketplaceValidatorService", action: "registerAuction" }
      );
    } catch (error) {
      logger.error("Failed to register auction", error, {
        component: "MarketplaceValidatorService",
        action: "registerAuction",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Emergency reset NFT status (admin only)
   */
  async emergencyResetNFTStatus(
    nftContract: string,
    tokenId: string,
    ownerAddress: string
  ): Promise<void> {
    try {
      if (!this.validator || !this.signer) {
        throw new Error("Validator not initialized or no signer");
      }

      const tx = await this.validator.emergencyResetNFTStatus(
        nftContract,
        tokenId,
        ownerAddress
      );
      await tx.wait();

      logger.success(
        "NFT status reset",
        { nftContract, tokenId, ownerAddress },
        { component: "MarketplaceValidatorService", action: "emergencyResetNFTStatus" }
      );
    } catch (error) {
      logger.error("Failed to reset NFT status", error, {
        component: "MarketplaceValidatorService",
        action: "emergencyResetNFTStatus",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.validator !== null;
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
    if (error.message?.includes("NFT not available")) {
      return new Error("NFT is already listed or in auction");
    }
    if (error.message?.includes("execution reverted")) {
      const revertReason = error.message.split("execution reverted: ")[1];
      return new Error(revertReason || "Transaction failed");
    }
    return new Error(error.message || "Transaction failed");
  }
}

// Export singleton instance
export const marketplaceValidatorService = new MarketplaceValidatorService();
