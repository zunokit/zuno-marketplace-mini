import { zunoApiClient } from "@/lib/api/zuno-api-client";
import { logger } from "@/lib/utils/logger";

/**
 * Contract address information from API
 */
export interface ContractAddress {
  contractName: string;
  contractAddress: string;
  network: string;
  chainId: number;
  verified: boolean;
  deployedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Network contract addresses
 */
export interface NetworkAddresses {
  hub: string;
  erc721Exchange: string;
  erc1155Exchange: string;
  erc721Factory: string;
  erc1155Factory: string;
  englishAuction: string;
  dutchAuction: string;
  auctionFactory: string;
  feeRegistry: string;
  bundleManager: string;
  offerManager: string;
  adminHub: string;
  accessControl: string;
  emergencyManager: string;
  timelock: string;
  listingValidator: string;
  historyTracker: string;
  collectionVerifier: string;
  feeManager: string;
  royaltyManager: string;
  exchangeRegistry: string;
  collectionRegistry: string;
  auctionRegistry: string;
}

/**
 * Address Manager for contract addresses from API
 */
class AddressManager {
  private addressCache: Map<number, NetworkAddresses> = new Map();
  private fetchingPromises: Map<number, Promise<NetworkAddresses>> = new Map();

  /**
   * Fetch network addresses from API
   */
  async fetchNetworkAddresses(chainId: number): Promise<NetworkAddresses> {
    const existingFetch = this.fetchingPromises.get(chainId);
    if (existingFetch) {
      logger.info(
        "Network addresses fetch already in progress",
        { chainId },
        { component: "AddressManager", action: "fetchNetworkAddresses" }
      );
      return existingFetch;
    }

    // Check cache first
    const cached = this.addressCache.get(chainId);
    if (cached) {
      logger.info(
        "Network addresses found in cache",
        { chainId },
        { component: "AddressManager", action: "fetchNetworkAddresses" }
      );
      return cached;
    }

    // Fetch from API
    const fetchPromise = (async () => {
      try {
        logger.info(
          "Fetching network addresses from API",
          { chainId },
          { component: "AddressManager", action: "fetchNetworkAddresses" }
        );

        // Get all contracts for the network
        const contracts = await zunoApiClient.getContracts({
          network: this.getNetworkName(chainId),
          verified: true,
        });

        // Convert to NetworkAddresses format
        const addresses = this.contractsToNetworkAddresses(contracts, chainId);

        // Cache the result
        this.addressCache.set(chainId, addresses);

        logger.success(
          "Network addresses fetched and cached successfully",
          { chainId, contractCount: contracts.length },
          { component: "AddressManager", action: "fetchNetworkAddresses" }
        );

        return addresses;
      } catch (error) {
        logger.error(
          "Failed to fetch network addresses",
          error as Error,
          { component: "AddressManager", action: "fetchNetworkAddresses" }
        );
        throw error;
      } finally {
        this.fetchingPromises.delete(chainId);
      }
    })();

    this.fetchingPromises.set(chainId, fetchPromise);
    return fetchPromise;
  }

  /**
   * Get contract address by name
   */
  async getContractAddress(
    contractName: string,
    chainId: number
  ): Promise<string> {
    const addresses = await this.fetchNetworkAddresses(chainId);
    const address = this.getAddressFromContractName(contractName, addresses);

    if (!address) {
      throw new Error(
        `Contract address not found for ${contractName} on chain ${chainId}`
      );
    }

    return address;
  }

  /**
   * Get specific address types
   */
  async getHubAddress(chainId: number): Promise<string> {
    const addresses = await this.fetchNetworkAddresses(chainId);
    return addresses.hub;
  }

  async getAdminHubAddress(chainId: number): Promise<string> {
    const addresses = await this.fetchNetworkAddresses(chainId);
    return addresses.adminHub;
  }

  /**
   * Convert API contracts to NetworkAddresses format
   */
  private contractsToNetworkAddresses(
    contracts: ContractAddress[],
    chainId: number
  ): NetworkAddresses {
    const addresses: Partial<NetworkAddresses> = {};

    contracts.forEach((contract) => {
      switch (contract.contractName) {
        case "UserHub":
          addresses.hub = contract.contractAddress;
          break;
        case "AdminHub":
          addresses.adminHub = contract.contractAddress;
          break;
        case "ERC721NFTExchange":
          addresses.erc721Exchange = contract.contractAddress;
          break;
        case "ERC1155NFTExchange":
          addresses.erc1155Exchange = contract.contractAddress;
          break;
        case "ERC721CollectionFactory":
          addresses.erc721Factory = contract.contractAddress;
          break;
        case "ERC1155CollectionFactory":
          addresses.erc1155Factory = contract.contractAddress;
          break;
        case "EnglishAuction":
          addresses.englishAuction = contract.contractAddress;
          break;
        case "DutchAuction":
          addresses.dutchAuction = contract.contractAddress;
          break;
        case "AuctionFactory":
          addresses.auctionFactory = contract.contractAddress;
          break;
        case "FeeRegistry":
          addresses.feeRegistry = contract.contractAddress;
          break;
        case "BundleManager":
          addresses.bundleManager = contract.contractAddress;
          break;
        case "OfferManager":
          addresses.offerManager = contract.contractAddress;
          break;
        case "MarketplaceAccessControl":
          addresses.accessControl = contract.contractAddress;
          break;
        case "EmergencyManager":
          addresses.emergencyManager = contract.contractAddress;
          break;
        case "MarketplaceTimelock":
          addresses.timelock = contract.contractAddress;
          break;
        case "ListingValidator":
          addresses.listingValidator = contract.contractAddress;
          break;
        case "ListingHistoryTracker":
          addresses.historyTracker = contract.contractAddress;
          break;
        case "CollectionVerifier":
          addresses.collectionVerifier = contract.contractAddress;
          break;
        case "AdvancedFeeManager":
          addresses.feeManager = contract.contractAddress;
          break;
        case "AdvancedRoyaltyManager":
          addresses.royaltyManager = contract.contractAddress;
          break;
        case "ExchangeRegistry":
          addresses.exchangeRegistry = contract.contractAddress;
          break;
        case "CollectionRegistry":
          addresses.collectionRegistry = contract.contractAddress;
          break;
        case "AuctionRegistry":
          addresses.auctionRegistry = contract.contractAddress;
          break;
      }
    });

    // Validate required addresses
    const requiredAddresses = [
      "hub",
      "erc721Exchange",
      "erc1155Exchange",
      "erc721Factory",
      "erc1155Factory",
    ];

    const missing = requiredAddresses.filter(
      (key) => !addresses[key as keyof Partial<NetworkAddresses>]
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required contract addresses on chain ${chainId}: ${missing.join(", ")}`
      );
    }

    return addresses as NetworkAddresses;
  }

  /**
   * Get address from contract name
   */
  private getAddressFromContractName(
    contractName: string,
    addresses: NetworkAddresses
  ): string | null {
    const mapping: Record<string, keyof NetworkAddresses> = {
      UserHub: "hub",
      AdminHub: "adminHub",
      ERC721NFTExchange: "erc721Exchange",
      ERC1155NFTExchange: "erc1155Exchange",
      ERC721CollectionFactory: "erc721Factory",
      ERC1155CollectionFactory: "erc1155Factory",
      EnglishAuction: "englishAuction",
      DutchAuction: "dutchAuction",
      AuctionFactory: "auctionFactory",
      FeeRegistry: "feeRegistry",
      BundleManager: "bundleManager",
      OfferManager: "offerManager",
      MarketplaceAccessControl: "accessControl",
      EmergencyManager: "emergencyManager",
      MarketplaceTimelock: "timelock",
      ListingValidator: "listingValidator",
      ListingHistoryTracker: "historyTracker",
      CollectionVerifier: "collectionVerifier",
      AdvancedFeeManager: "feeManager",
      AdvancedRoyaltyManager: "royaltyManager",
      ExchangeRegistry: "exchangeRegistry",
      CollectionRegistry: "collectionRegistry",
      AuctionRegistry: "auctionRegistry",
    };

    const key = mapping[contractName];
    return key ? addresses[key] : null;
  }

  /**
   * Get network name from chainId
   */
  private getNetworkName(chainId: number): string {
    switch (chainId) {
      case 1:
        return "ethereum";
      case 11155111:
        return "sepolia";
      case 31337:
        return "local";
      default:
        return "unknown";
    }
  }

  /**
   * Clear cache for specific chain or all chains
   */
  clearCache(chainId?: number): void {
    if (chainId) {
      this.addressCache.delete(chainId);
      logger.info(
        "Address cache cleared for chain",
        { chainId },
        { component: "AddressManager", action: "clearCache" }
      );
    } else {
      this.addressCache.clear();
      logger.info(
        "All address caches cleared",
        {},
        { component: "AddressManager", action: "clearCache" }
      );
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; chains: number[] } {
    return {
      size: this.addressCache.size,
      chains: Array.from(this.addressCache.keys()),
    };
  }
}

/**
 * Singleton address manager instance
 */
export const addressManager = new AddressManager();

/**
 * Helper function to get network addresses
 */
export async function getNetworkAddresses(chainId: number): Promise<NetworkAddresses> {
  return addressManager.fetchNetworkAddresses(chainId);
}

/**
 * Helper function to get contract address
 */
export async function getContractAddress(
  contractName: string,
  chainId: number
): Promise<string> {
  return addressManager.getContractAddress(contractName, chainId);
}

/**
 * Helper function to get hub address
 */
export async function getHubAddressFromManager(chainId: number): Promise<string> {
  return addressManager.getHubAddress(chainId);
}

/**
 * Helper function to get admin hub address
 */
export async function getAdminHubAddress(chainId: number): Promise<string> {
  return addressManager.getAdminHubAddress(chainId);
}

/**
 * Helper function to get exchange address
 */
export async function getExchangeAddress(chainId: number, tokenType: "ERC721" | "ERC1155"): Promise<string> {
  const addresses = await addressManager.fetchNetworkAddresses(chainId);
  return tokenType === "ERC721" ? addresses.erc721Exchange : addresses.erc1155Exchange;
}

/**
 * Helper function to get factory address
 */
export async function getFactoryAddress(chainId: number, tokenType: "ERC721" | "ERC1155"): Promise<string> {
  const addresses = await addressManager.fetchNetworkAddresses(chainId);
  return tokenType === "ERC721" ? addresses.erc721Factory : addresses.erc1155Factory;
}