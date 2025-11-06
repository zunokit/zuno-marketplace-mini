/**
 * Contract Services - Centralized export
 * All services now use UserHub for address discovery
 */

import { ethers } from "ethers";
import { userHubService } from "./UserHubService";
import { logger } from "@/lib/utils/logger";
import { exchangeService } from "./ExchangeService";
import { auctionService } from "./AuctionService";
import { bundleService } from "./BundleService";
import { offerService } from "./OfferService";
import { collectionService } from "./CollectionService";
import { feeManagerService } from "./FeeManagerService";
import { royaltyManagerService } from "./RoyaltyManagerService";
import { accessControlService } from "./AccessControlService";
import { emergencyManagerService } from "./EmergencyManagerService";
import { listingValidatorService } from "./ListingValidatorService";
import { listingHistoryTrackerService } from "./ListingHistoryTrackerService";
import { collectionVerifierService } from "./CollectionVerifierService";
import { timelockService } from "./TimelockService";
import { adminHubService } from "./AdminHubService";
import { marketplaceValidatorService } from "./MarketplaceValidatorService";
import { ZERO_ADDRESS } from "@/lib/constants";

export {
  userHubService,
  UserHubService,
} from "./UserHubService";
export type {
  UserHubAddresses,
} from "./UserHubService";

export { exchangeService, ExchangeService } from "./ExchangeService";
export type { ListingParams, BatchListingParams } from "./ExchangeService";

export { auctionService, AuctionService } from "./AuctionService";
export type {
  EnglishAuctionParams,
  DutchAuctionParams,
  AuctionInfo,
} from "./AuctionService";

export { bundleService, BundleService } from "./BundleService";
export type {
  BundleItem,
  CreateBundleParams,
  BundleInfo,
} from "./BundleService";

export { offerService, OfferService } from "./OfferService";
export type {
  NFTOfferParams,
  CollectionOfferParams,
  TraitOfferParams,
  OfferInfo,
} from "./OfferService";

export { collectionService, CollectionService } from "./CollectionService";

export { feeManagerService, FeeManagerService } from "./FeeManagerService";
export type {
  FeeConfig,
  FeeTier,
  FeeTierConfig,
  CollectionFeeOverride,
  UserVolumeData,
  VIPStatus,
  FeeCalculation,
  TierUpgradeInfo,
} from "./FeeManagerService";

export {
  royaltyManagerService,
  RoyaltyManagerService,
} from "./RoyaltyManagerService";
export type {
  AdvancedRoyaltyInfo,
  RoyaltyRecipient,
  RoyaltyCaps,
  RoyaltyDistribution,
  RoyaltyInfo,
} from "./RoyaltyManagerService";

export {
  accessControlService,
  AccessControlService,
} from "./AccessControlService";
export type {
  MarketplaceRole,
  RolePermissions,
  RoleAssignment,
  RoleMemberInfo,
} from "./AccessControlService";

export {
  emergencyManagerService,
  EmergencyManagerService,
} from "./EmergencyManagerService";
export type {
  BlacklistInfo,
  EmergencyStatus,
  NFTResetParams,
} from "./EmergencyManagerService";

export {
  listingValidatorService,
  ListingValidatorService,
} from "./ListingValidatorService";
export type {
  ValidationSettings,
  UserCooldown,
  SpamTracker,
  ValidationResult,
  ListingParams as ValidatorListingParams,
} from "./ListingValidatorService";

export {
  listingHistoryTrackerService,
  ListingHistoryTrackerService,
} from "./ListingHistoryTrackerService";
export type {
  TransactionType,
  TransactionRecord,
  CollectionStats,
  UserStats,
  GlobalStats,
  PricePoint,
  DailyVolume,
} from "./ListingHistoryTrackerService";

export {
  collectionVerifierService,
  CollectionVerifierService,
} from "./CollectionVerifierService";
export type {
  VerificationStatus,
  CollectionVerification,
  CollectionMetadata,
  VerificationRequest,
} from "./CollectionVerifierService";

export { timelockService, TimelockService } from "./TimelockService";
export type {
  ActionStatus,
  ActionData,
  PendingAction,
} from "./TimelockService";

export { adminHubService, AdminHubService } from "./AdminHubService";
export type {
  AdminHubConfig,
  TokenStandard,
  AuctionType as AdminAuctionType,
} from "./AdminHubService";

export { 
  marketplaceValidatorService, 
  MarketplaceValidatorService 
} from "./MarketplaceValidatorService";
export type {
  NFTStatus,
  NFTStatusInfo,
  ValidationResult as ValidatorValidationResult,
} from "./MarketplaceValidatorService";

export {
  collectionQueryService,
  CollectionQueryService,
} from "./CollectionQueryService";
export type { CollectionData } from "./CollectionQueryService";

// Export NFT Metadata Service
export { nftMetadataService } from "../NFTMetadataService";
export type { NFTMetadata, CollectionMetadata as CollectionMetadataInfo } from "../NFTMetadataService";

// Export User NFT Service
export { userNFTService } from "../UserNFTService";
export type { UserNFT } from "../UserNFTService";

// Export Listing type from ExchangeService
export type { Listing } from "./ExchangeService";

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
