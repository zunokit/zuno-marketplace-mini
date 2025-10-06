/**
 * Contract Services - Centralized export
 * All services now use MarketplaceHub for address discovery
 */

import { marketplaceHubService } from "./MarketplaceHubService";
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

export {
  marketplaceHubService,
  MarketplaceHubService,
} from "./MarketplaceHubService";
export type {
  MarketplaceAddresses,
  FeeBreakdown,
} from "./MarketplaceHubService";

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
export type {
  CreateCollectionParams,
  MintParams,
  TransferParams,
  CollectionInfo,
} from "./CollectionService";

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

/**
 * Initialize all services
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
  provider: any,
  signer?: any
): Promise<void> {
  // Initialize Hub first (it loads all addresses)
  await marketplaceHubService.initialize(provider, signer);

  // Initialize other services
  const services = [
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

  await Promise.all(services.map((svc) => svc.initialize(provider, signer)));

  console.log(
    `✅ All marketplace services initialized (${services.length} services)`
  );
}
