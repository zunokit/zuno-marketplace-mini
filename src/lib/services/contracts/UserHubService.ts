/**
 * UserHub Service
 * Single entry point for discovering all marketplace contract addresses
 * Replaces MarketplaceHubService - simpler, read-only hub for user queries
 *
 * UserHub is a lightweight read-only contract that provides:
 * - Contract address discovery via getAllAddresses()
 * - Factory lookup by token type
 * - Exchange lookup by NFT contract
 * - No admin functions, no fee calculations (those moved to separate contracts)
 */

import { ethers } from "ethers";
import { getHubAddressFromManager } from "@/lib/services/contracts/AddressManager";
import { getContractABI } from "@/lib/contracts/abi-manager";
import { ZERO_ADDRESS } from "@/lib/constants";
import { logger } from "@/lib/utils/logger";

export interface UserHubAddresses {
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
}

export class UserHubService {
  private hub: ethers.Contract | null = null;
  private addresses: UserHubAddresses | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize the UserHub service with provider/signer
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    logger.info(
      "UserHub initialization starting",
      {
        chainId,
        networkName: network.name,
      },
      { component: "UserHubService", action: "initialize" }
    );

    // Fetch hub address from API
    let hubAddress: string;
    try {
      hubAddress = await getHubAddressFromManager(chainId);
      logger.info(
        "UserHub address fetched from API",
        { chainId, hubAddress },
        { component: "UserHubService", action: "initialize" }
      );
    } catch (error) {
      logger.error(
        "Failed to fetch UserHub address from API",
        error as Error,
        { component: "UserHubService", action: "initialize" }
      );
      throw new Error(
        `Failed to fetch UserHub address for chain ${chainId} (${network.name}). ` +
        `Please ensure Zuno API is available and contracts are deployed to the network.`
      );
    }

    // Validate contract exists at address
    const code = await provider.getCode(hubAddress);
    if (code === "0x") {
      throw new Error(
        `No contract deployed at UserHub address ${hubAddress} on chain ${chainId}. ` +
          `Please ensure contracts are deployed to the network.`
      );
    }

    // Fetch ABI from API
    const abi = await getContractABI("UserHub");

    this.hub = new ethers.Contract(
      hubAddress,
      abi,
      signer || provider
    );

    try {
      // Load all addresses from hub
      await this.loadAddresses();
      logger.success(
        "UserHub initialized successfully",
        {
          hub: hubAddress,
          chainId,
          addresses: this.addresses,
        },
        { component: "UserHubService", action: "initialize" }
      );
    } catch (error: any) {
      logger.error("Failed to load addresses from UserHub", error, {
        component: "UserHubService",
        action: "initialize",
      });

      // Handle specific RPC errors
      if (error?.message?.includes("BlockOutOfRangeError")) {
        throw new Error(
          `Blockchain synchronization error: The network appears to be out of sync or restarted. ` +
            `Please check your RPC URL configuration in Settings and ensure the blockchain is fully synchronized. ` +
            `If using a local network, restart Anvil and redeploy contracts.`
        );
      }

      throw new Error(
        `Failed to initialize UserHub: ${
          error?.message || "Unknown error"
        }. ` + `Please check contract deployment and ABI compatibility.`
      );
    }
  }

  /**
   * Load all contract addresses from UserHub.getAllAddresses()
   */
  private async loadAddresses(): Promise<void> {
    if (!this.hub) {
      throw new Error("UserHub not initialized");
    }

    // UserHub.getAllAddresses() returns:
    // (erc721Exchange, erc1155Exchange, erc721Factory, erc1155Factory,
    //  englishAuction, dutchAuction, auctionFactory, feeRegistry,
    //  bundleManager, offerManager)
    const result = await this.hub.getAllAddresses();

    this.addresses = {
      hub: await this.hub.getAddress(),
      erc721Exchange: result[0],
      erc1155Exchange: result[1],
      erc721Factory: result[2],
      erc1155Factory: result[3],
      englishAuction: result[4],
      dutchAuction: result[5],
      auctionFactory: result[6],
      feeRegistry: result[7],
      bundleManager: result[8],
      offerManager: result[9],
    };
  }

  /**
   * Get all marketplace addresses (cached)
   */
  getAddresses(): UserHubAddresses {
    if (!this.addresses) {
      throw new Error("UserHub not initialized - call initialize() first");
    }
    return this.addresses;
  }

  /**
   * Get hub contract instance
   */
  getHub(): ethers.Contract {
    if (!this.hub) {
      throw new Error("UserHub not initialized");
    }
    return this.hub;
  }

  /**
   * Auto-detect which exchange to use for an NFT contract
   * Calls UserHub.getExchangeFor() which checks ERC165 interface support
   */
  async getExchangeFor(nftContract: string): Promise<string> {
    if (!this.hub) {
      throw new Error("UserHub not initialized");
    }
    return await this.hub.getExchangeFor(nftContract);
  }

  /**
   * Get factory contract address for token type ("ERC721" or "ERC1155")
   * Calls UserHub.getFactoryFor() which queries CollectionRegistry
   */
  async getFactoryFor(tokenType: "ERC721" | "ERC1155"): Promise<string> {
    if (!this.hub) {
      throw new Error("UserHub not initialized");
    }
    return await this.hub.getFactoryFor(tokenType);
  }

  /**
   * Get auction contract address for auction type
   * @param auctionType 0 = ENGLISH, 1 = DUTCH
   */
  async getAuctionFor(auctionType: 0 | 1): Promise<string> {
    if (!this.hub) {
      throw new Error("UserHub not initialized");
    }
    return await this.hub.getAuctionFor(auctionType);
  }

  /**
   * Get Fee Registry contract address directly from UserHub
   * This is the preferred method for getting FeeRegistry address
   */
  async getFeeRegistryAddress(): Promise<string> {
    if (!this.hub) {
      throw new Error("UserHub not initialized");
    }
    return await this.hub.getFeeRegistry();
  }

  // ==================== CACHED ADDRESS GETTERS ====================

  /**
   * Get ERC721 Exchange address (from cache)
   */
  getERC721Exchange(): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return this.addresses.erc721Exchange;
  }

  /**
   * Get ERC1155 Exchange address (from cache)
   */
  getERC1155Exchange(): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return this.addresses.erc1155Exchange;
  }

  /**
   * Get collection factory for token type (from cache)
   */
  getCollectionFactory(tokenType: "ERC721" | "ERC1155"): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return tokenType === "ERC721"
      ? this.addresses.erc721Factory
      : this.addresses.erc1155Factory;
  }

  /**
   * Get ERC721 Factory address (from cache)
   */
  getERC721Factory(): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return this.addresses.erc721Factory;
  }

  /**
   * Get ERC1155 Factory address (from cache)
   */
  getERC1155Factory(): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return this.addresses.erc1155Factory;
  }

  /**
   * Get English Auction contract address (from cache)
   */
  getEnglishAuction(): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return this.addresses.englishAuction;
  }

  /**
   * Get Dutch Auction contract address (from cache)
   */
  getDutchAuction(): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return this.addresses.dutchAuction;
  }

  /**
   * Get Auction Factory address (from cache)
   */
  getAuctionFactory(): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return this.addresses.auctionFactory;
  }

  /**
   * Get Fee Registry address (from cache)
   */
  getFeeRegistry(): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return this.addresses.feeRegistry;
  }

  /**
   * Get Bundle Manager address (from cache)
   */
  getBundleManager(): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return this.addresses.bundleManager;
  }

  /**
   * Get Offer Manager address (from cache)
   */
  getOfferManager(): string {
    if (!this.addresses) {
      throw new Error("UserHub not initialized");
    }
    return this.addresses.offerManager;
  }

  // ==================== ADDITIONAL USERUB FUNCTIONS ====================

  /**
   * Get all registries addresses
   * Returns: (exchangeRegistry, collectionRegistry, feeRegistry, auctionRegistry)
   */
  async getAllRegistries(): Promise<{
    exchangeRegistry: string;
    collectionRegistry: string;
    feeRegistry: string;
    auctionRegistry: string;
  }> {
    if (!this.hub) {
      throw new Error("UserHub not initialized");
    }
    const result = await this.hub.getAllRegistries();
    return {
      exchangeRegistry: result[0],
      collectionRegistry: result[1],
      feeRegistry: result[2],
      auctionRegistry: result[3],
    };
  }

  /**
   * Get additional contract addresses set by AdminHub
   * Returns: (listingValidator, emergencyManager, accessControl, historyTracker)
   */
  async getAdditionalAddresses(): Promise<{
    listingValidator: string;
    emergencyManager: string;
    accessControl: string;
    historyTracker: string;
  }> {
    if (!this.hub) {
      throw new Error("UserHub not initialized");
    }
    const result = await this.hub.getAdditionalAddresses();
    return {
      listingValidator: result[0],
      emergencyManager: result[1],
      accessControl: result[2],
      historyTracker: result[3],
    };
  }

  /**
   * Get system health status
   * Returns: (isHealthy, activeContracts[], timestamp)
   */
  async getSystemStatus(): Promise<{
    isHealthy: boolean;
    activeContracts: string[];
    timestamp: bigint;
  }> {
    if (!this.hub) {
      throw new Error("UserHub not initialized");
    }
    const result = await this.hub.getSystemStatus();
    return {
      isHealthy: result[0],
      activeContracts: result[1],
      timestamp: result[2],
    };
  }

  /**
   * Check if system is paused (via EmergencyManager)
   */
  async isPaused(): Promise<boolean> {
    if (!this.hub) {
      throw new Error("UserHub not initialized");
    }
    return await this.hub.isPaused();
  }
}

// Export singleton instance
export const userHubService = new UserHubService();
