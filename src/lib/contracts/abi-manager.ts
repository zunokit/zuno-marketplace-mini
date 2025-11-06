import { zunoApiClient, ContractABI } from "@/lib/api/zuno-api-client";
import { logger } from "@/lib/utils/logger";

/**
 * Contract name type for type safety
 * Maps to contract names in the Zuno Marketplace API
 */
export type ContractName =
  | "UserHub"
  | "AdminHub"
  | "ERC721NFTExchange"
  | "ERC1155NFTExchange"
  | "EnglishAuction"
  | "DutchAuction"
  | "BundleManager"
  | "OfferManager"
  | "ERC721Collection"
  | "ERC1155Collection"
  | "ERC721CollectionFactory"
  | "ERC1155CollectionFactory"
  | "ExchangeRegistry"
  | "CollectionRegistry"
  | "AuctionRegistry"
  | "FeeRegistry"
  | "AdvancedFeeManager"
  | "AdvancedRoyaltyManager"
  | "MarketplaceAccessControl"
  | "EmergencyManager"
  | "MarketplaceTimelock"
  | "ListingValidator"
  | "ListingHistoryTracker"
  | "CollectionVerifier";

/**
 * ABI Manager for contract services
 * Provides both synchronous (cached) and asynchronous (fetched) ABI access
 */
class ABIManager {
  private abiCache: Map<string, any[]> = new Map();
  private fetchingPromises: Map<string, Promise<any[]>> = new Map();

  /**
   * Get cache key for ABI
   */
  private getCacheKey(name: ContractName, network?: string): string {
    return `${name}${network ? `_${network}` : ""}`;
  }

  /**
   * Get ABI from cache
   */
  private getFromCache(name: ContractName, network?: string): any[] | null {
    const key = this.getCacheKey(name, network);
    return this.abiCache.get(key) || null;
  }

  /**
   * Set ABI in cache
   */
  private setCache(name: ContractName, abi: any[], network?: string): void {
    const key = this.getCacheKey(name, network);
    this.abiCache.set(key, abi);
  }

  /**
   * Fetch ABI from API and cache it
   *
   * @param name - Contract name
   * @param network - Optional network filter
   * @returns Promise with ABI array
   */
  async fetchABI(name: ContractName, network?: string): Promise<any[]> {
    const cacheKey = this.getCacheKey(name, network);

    // Check if already fetching
    const existingFetch = this.fetchingPromises.get(cacheKey);
    if (existingFetch) {
      logger.info(
        "ABI fetch already in progress, waiting...",
        { name, network },
        { component: "ABIManager", action: "fetchABI" }
      );
      return existingFetch;
    }

    // Check cache first
    const cached = this.getFromCache(name, network);
    if (cached) {
      logger.info(
        "ABI found in cache",
        { name, network },
        { component: "ABIManager", action: "fetchABI" }
      );
      return cached;
    }

    // Fetch from API
    const fetchPromise = (async () => {
      try {
        logger.info(
          "Fetching ABI from API",
          { name, network },
          { component: "ABIManager", action: "fetchABI" }
        );

        const contractABI = await zunoApiClient.getContractByName(
          name,
          network
        );

        if (!contractABI || !contractABI.abi) {
          throw new Error(`ABI not found for contract: ${name}`);
        }

        // Cache the ABI
        this.setCache(name, contractABI.abi, network);

        logger.success(
          "ABI fetched and cached successfully",
          { name, network, abiLength: contractABI.abi.length },
          { component: "ABIManager", action: "fetchABI" }
        );

        return contractABI.abi;
      } catch (error) {
        logger.error(
          "Failed to fetch ABI",
          error as Error,
          { component: "ABIManager", action: "fetchABI" }
        );
        throw error;
      } finally {
        this.fetchingPromises.delete(cacheKey);
      }
    })();

    this.fetchingPromises.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Get ABI synchronously from cache
   * Throws error if ABI is not cached
   *
   * @param name - Contract name
   * @param network - Optional network filter
   * @returns ABI array from cache
   * @throws Error if ABI not in cache
   */
  getABI(name: ContractName, network?: string): any[] {
    const cached = this.getFromCache(name, network);

    if (!cached) {
      throw new Error(
        `ABI not cached for ${name}. Call fetchABI() first or use getABIAsync().`
      );
    }

    return cached;
  }

  /**
   * Get ABI asynchronously (fetch if not cached)
   *
   * @param name - Contract name
   * @param network - Optional network filter
   * @returns Promise with ABI array
   */
  async getABIAsync(name: ContractName, network?: string): Promise<any[]> {
    const cached = this.getFromCache(name, network);
    if (cached) {
      return cached;
    }

    return this.fetchABI(name, network);
  }

  /**
   * Prefetch multiple ABIs
   * Useful for preloading commonly used ABIs
   *
   * @param names - Array of contract names to prefetch
   * @param network - Optional network filter
   */
  async prefetchABIs(
    names: ContractName[],
    network?: string
  ): Promise<void> {
    logger.info(
      "Prefetching multiple ABIs",
      { count: names.length, network },
      { component: "ABIManager", action: "prefetchABIs" }
    );

    await Promise.all(
      names.map((name) => this.fetchABI(name, network).catch((error) => {
        logger.warn(
          `Failed to prefetch ABI for ${name}`,
          { error },
          { component: "ABIManager", action: "prefetchABIs" }
        );
      }))
    );

    logger.success(
      "ABIs prefetched successfully",
      { count: names.length },
      { component: "ABIManager", action: "prefetchABIs" }
    );
  }

  /**
   * Clear cache for specific ABI or all ABIs
   *
   * @param name - Optional contract name to clear (clears all if not provided)
   * @param network - Optional network filter
   */
  clearCache(name?: ContractName, network?: string): void {
    if (name) {
      const key = this.getCacheKey(name, network);
      this.abiCache.delete(key);
      logger.info(
        "ABI cache cleared",
        { name, network },
        { component: "ABIManager", action: "clearCache" }
      );
    } else {
      this.abiCache.clear();
      logger.info(
        "All ABI caches cleared",
        {},
        { component: "ABIManager", action: "clearCache" }
      );
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.abiCache.size,
      keys: Array.from(this.abiCache.keys()),
    };
  }
}

/**
 * Singleton ABI Manager instance
 */
export const abiManager = new ABIManager();

/**
 * Helper function to get ABI for a contract
 * Async version - fetches if not cached
 *
 * @param name - Contract name
 * @param network - Optional network filter
 * @returns Promise with ABI array
 *
 * @example
 * ```ts
 * const abi = await getContractABI("UserHub");
 * const contract = new ethers.Contract(address, abi, signer);
 * ```
 */
export async function getContractABI(
  name: ContractName,
  network?: string
): Promise<any[]> {
  return abiManager.getABIAsync(name, network);
}

/**
 * Helper function to prefetch ABIs
 *
 * @param names - Array of contract names
 * @param network - Optional network filter
 *
 * @example
 * ```ts
 * // Prefetch commonly used ABIs on app startup
 * await prefetchABIs(["UserHub", "ERC721NFTExchange", "ERC1155NFTExchange"]);
 * ```
 */
export async function prefetchABIs(
  names: ContractName[],
  network?: string
): Promise<void> {
  return abiManager.prefetchABIs(names, network);
}
