/**
 * Contract Services - Centralized export
 * All services now use UserHub for address discovery
 *
 * Directory Structure:
 * - core/       - UserHub, AdminHub
 * - trading/    - Exchange, Auction, Bundle, Offer
 * - management/ - FeeManager, RoyaltyManager, Collection
 * - security/   - AccessControl, EmergencyManager, Timelock
 * - validation/ - ListingValidator, MarketplaceValidator, CollectionVerifier, ListingHistoryTracker
 * - utils/      - AddressManager, CollectionQueryService, RealTimeEvents
 */

import { ethers } from "ethers";
import { userHubService } from "./core/UserHubService";
import { logger } from "@/lib/utils/logger";
import { exchangeService } from "./trading/ExchangeService";
import { auctionService } from "./trading/AuctionService";
import { bundleService } from "./trading/BundleService";
import { offerService } from "./trading/OfferService";
import { collectionService } from "./management/CollectionService";
import { feeManagerService } from "./management/FeeManagerService";
import { royaltyManagerService } from "./management/RoyaltyManagerService";
import { accessControlService } from "./security/AccessControlService";
import { emergencyManagerService } from "./security/EmergencyManagerService";
import { listingValidatorService } from "./validation/ListingValidatorService";
import { listingHistoryTrackerService } from "./validation/ListingHistoryTrackerService";
import { collectionVerifierService } from "./validation/CollectionVerifierService";
import { timelockService } from "./security/TimelockService";
import { adminHubService } from "./core/AdminHubService";
import { marketplaceValidatorService } from "./validation/MarketplaceValidatorService";
import { ZERO_ADDRESS } from "@/lib/constants";

// ============================================================================
// CORE SERVICES
// ============================================================================

export {
  userHubService,
  UserHubService,
} from "./core/UserHubService";
export type {
  UserHubAddresses,
} from "./core/UserHubService";

export { adminHubService, AdminHubService } from "./core/AdminHubService";
export type {
  AdminHubConfig,
  TokenStandard,
  AuctionType as AdminAuctionType,
} from "./core/AdminHubService";

// ============================================================================
// TRADING SERVICES
// ============================================================================

export { exchangeService, ExchangeService } from "./trading/ExchangeService";
export type { ListingParams, BatchListingParams, Listing } from "./trading/ExchangeService";

export { auctionService, AuctionService } from "./trading/AuctionService";
export type {
  EnglishAuctionParams,
  DutchAuctionParams,
  AuctionInfo,
} from "./trading/AuctionService";

export { bundleService, BundleService } from "./trading/BundleService";
export type {
  BundleItem,
  CreateBundleParams,
  BundleInfo,
} from "./trading/BundleService";

export { offerService, OfferService } from "./trading/OfferService";
export type {
  NFTOfferParams,
  CollectionOfferParams,
  TraitOfferParams,
  OfferInfo,
} from "./trading/OfferService";

// ============================================================================
// MANAGEMENT SERVICES
// ============================================================================

export { collectionService, CollectionService } from "./management/CollectionService";

export { feeManagerService, FeeManagerService } from "./management/FeeManagerService";
export type {
  FeeConfig,
  FeeTier,
  FeeTierConfig,
  CollectionFeeOverride,
  UserVolumeData,
  VIPStatus,
  FeeCalculation,
  TierUpgradeInfo,
} from "./management/FeeManagerService";

export {
  royaltyManagerService,
  RoyaltyManagerService,
} from "./management/RoyaltyManagerService";
export type {
  AdvancedRoyaltyInfo,
  RoyaltyRecipient,
  RoyaltyCaps,
  RoyaltyDistribution,
  RoyaltyInfo,
} from "./management/RoyaltyManagerService";

// ============================================================================
// SECURITY SERVICES
// ============================================================================

export {
  accessControlService,
  AccessControlService,
} from "./security/AccessControlService";
export type {
  MarketplaceRole,
  RolePermissions,
  RoleAssignment,
  RoleMemberInfo,
} from "./security/AccessControlService";

export {
  emergencyManagerService,
  EmergencyManagerService,
} from "./security/EmergencyManagerService";
export type {
  BlacklistInfo,
  EmergencyStatus,
  NFTResetParams,
} from "./security/EmergencyManagerService";

export { timelockService, TimelockService } from "./security/TimelockService";
export type {
  ActionStatus,
  ActionData,
  PendingAction,
} from "./security/TimelockService";

// ============================================================================
// VALIDATION SERVICES
// ============================================================================

export {
  listingValidatorService,
  ListingValidatorService,
} from "./validation/ListingValidatorService";
export type {
  ValidationSettings,
  UserCooldown,
  SpamTracker,
  ValidationResult,
  ListingParams as ValidatorListingParams,
} from "./validation/ListingValidatorService";

export {
  listingHistoryTrackerService,
  ListingHistoryTrackerService,
} from "./validation/ListingHistoryTrackerService";
export type {
  TransactionType,
  TransactionRecord,
  CollectionStats,
  UserStats,
  GlobalStats,
  PricePoint,
  DailyVolume,
} from "./validation/ListingHistoryTrackerService";

export {
  collectionVerifierService,
  CollectionVerifierService,
} from "./validation/CollectionVerifierService";
export type {
  VerificationStatus,
  CollectionVerification,
  CollectionMetadata,
  VerificationRequest,
} from "./validation/CollectionVerifierService";

export {
  marketplaceValidatorService,
  MarketplaceValidatorService
} from "./validation/MarketplaceValidatorService";
export type {
  NFTStatus,
  NFTStatusInfo,
  ValidationResult as ValidatorValidationResult,
} from "./validation/MarketplaceValidatorService";

// ============================================================================
// UTILITY SERVICES
// ============================================================================

export {
  collectionQueryService,
  CollectionQueryService,
} from "./utils/CollectionQueryService";
export type { CollectionData } from "./utils/CollectionQueryService";

export {
  realTimeEventsService,
  RealTimeEventsService,
} from "./utils/RealTimeEvents";
export type { EventHandler, EventSubscription } from "./utils/RealTimeEvents";

// Export NFT Metadata Service
export { nftMetadataService } from "../NFTMetadataService";
export type { NFTMetadata, CollectionMetadata as CollectionMetadataInfo } from "../NFTMetadataService";

// Export User NFT Service
export { userNFTService } from "../UserNFTService";
export type { UserNFT } from "../UserNFTService";

/**
 * Initialize all contract services
 *
 * Initializes the UserHub service first (which loads all contract addresses),
 * then initializes all other services. Services are initialized in parallel
 * for better performance. Optional services that may not have addresses
 * configured are initialized separately and won't cause initialization to fail.
 *
 * @param provider - Ethers provider instance (JsonRpcProvider, BrowserProvider, etc.)
 * @param signer - Optional ethers signer for write operations
 * @throws {Error} Only if UserHub initialization fails
 *
 * @example
 * ```ts
 * import { initializeServices } from '@/lib/services/contracts';
 * import { BrowserProvider } from 'ethers';
 *
 * const provider = new BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 *
 * await initializeServices(provider, signer);
 * ```
 */
export async function initializeServices(
  provider: ethers.Provider,
  signer?: ethers.Signer
): Promise<void> {
  try {
    // Initialize UserHub first (it loads all addresses)
    await userHubService.initialize(provider, signer);
    
    // Initialize metadata and user NFT services
    const { nftMetadataService } = await import("../NFTMetadataService");
    const { userNFTService } = await import("../UserNFTService");
    await nftMetadataService.initialize(provider);
    await userNFTService.initialize(provider);

    // Check if we have valid addresses
    const addresses = userHubService.getAddresses();
    const hasValidAddresses = addresses.erc721Exchange !== ZERO_ADDRESS;

    if (hasValidAddresses) {
      // Initialize other services only if we have valid addresses
      const coreServices = [
        exchangeService,
        auctionService,
        bundleService,
        offerService,
        collectionService,
        feeManagerService,
        royaltyManagerService,
        accessControlService,
        emergencyManagerService,
        listingValidatorService,
        listingHistoryTrackerService,
        collectionVerifierService,
        timelockService,
      ];

      // Initialize optional services (may not have addresses configured)
      const optionalServices = [
        adminHubService,
        marketplaceValidatorService,
      ];

      // Initialize core services
      await Promise.all(
        coreServices.map((svc) => svc.initialize(provider, signer))
      );

      // Initialize optional services without failing
      await Promise.allSettled(
        optionalServices.map((svc) => svc.initialize(provider, signer))
      );

      const totalServices = coreServices.length + optionalServices.length;

      logger.success(
        `All marketplace services initialized (${totalServices} services)`,
        {
          coreServices: coreServices.length,
          optionalServices: optionalServices.length,
          totalServices,
        },
        { component: "ContractServices", action: "initialize" }
      );
    } else {
      logger.warn(
        "Marketplace services not initialized - contracts not deployed",
        null,
        {
          component: "ContractServices",
          action: "initialize",
        }
      );
      logger.info(
        "Deploy the contracts using the zuno-marketplace-contracts repository",
        null,
        {
          component: "ContractServices",
          action: "initialize",
        }
      );
    }
  } catch (error) {
    logger.error("Failed to initialize services", error, {
      component: "ContractServices",
      action: "initialize",
    });
    // Don't throw - allow app to run in limited mode
    logger.warn(
      "Running in limited mode without smart contract features",
      null,
      {
        component: "ContractServices",
        action: "initialize",
      }
    );
  }
}
