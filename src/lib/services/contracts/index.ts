/**
 * Contract Services - Centralized export
 * All services now use MarketplaceHub for address discovery
 */

export { marketplaceHubService, MarketplaceHubService } from "./MarketplaceHubService";
export type { MarketplaceAddresses, FeeBreakdown } from "./MarketplaceHubService";

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
  await Promise.all([
    exchangeService.initialize(provider, signer),
    auctionService.initialize(provider, signer),
    bundleService.initialize(provider, signer),
    offerService.initialize(provider, signer),
    collectionService.initialize(provider, signer),
  ]);

  console.log("✅ All marketplace services initialized");
}
