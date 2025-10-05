/**
 * MarketplaceHub Service
 * Single entry point for discovering all marketplace contract addresses
 * Based on Hub + Registry pattern from zuno-marketplace-contracts
 */

import { ethers } from "ethers";
import { getMarketplaceHubAddress } from "@/lib/contracts/addresses";
import { MarketplaceHub_ABI } from "@/lib/contracts/abis";

export interface MarketplaceAddresses {
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

export interface FeeBreakdown {
  platformFee: bigint;
  royaltyFee: bigint;
  totalFees: bigint;
  sellerProceeds: bigint;
}

export class MarketplaceHubService {
  private hub: ethers.Contract | null = null;
  private addresses: MarketplaceAddresses | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize the hub service with provider/signer
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const hubAddress = getMarketplaceHubAddress(chainId);

    this.hub = new ethers.Contract(
      hubAddress,
      MarketplaceHub_ABI,
      signer || provider
    );

    // Load all addresses from hub
    await this.loadAddresses();

    console.log("✅ MarketplaceHub initialized:", {
      hub: hubAddress,
      chainId,
      addresses: this.addresses,
    });
  }

  /**
   * Load all contract addresses from hub
   */
  private async loadAddresses(): Promise<void> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }

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
   * Get all marketplace addresses
   */
  getAddresses(): MarketplaceAddresses {
    if (!this.addresses) {
      throw new Error("Hub not initialized - call initialize() first");
    }
    return this.addresses;
  }

  /**
   * Get hub contract instance
   */
  getHub(): ethers.Contract {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return this.hub;
  }

  /**
   * Auto-detect which exchange to use for an NFT
   */
  async getExchangeFor(nftContract: string): Promise<string> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.getExchangeFor(nftContract);
  }

  /**
   * Get specific exchange address
   */
  getERC721Exchange(): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
    }
    return this.addresses.erc721Exchange;
  }

  /**
   * Get specific exchange address
   */
  getERC1155Exchange(): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
    }
    return this.addresses.erc1155Exchange;
  }

  /**
   * Get collection factory for token type
   */
  async getCollectionFactory(
    tokenType: "ERC721" | "ERC1155"
  ): Promise<string> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.getCollectionFactory(tokenType);
  }

  /**
   * Calculate fees for a sale
   */
  async calculateFees(
    nftContract: string,
    tokenId: string,
    salePrice: bigint
  ): Promise<FeeBreakdown> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }

    const breakdown = await this.hub.calculateFees(
      nftContract,
      tokenId,
      salePrice
    );

    return {
      platformFee: breakdown.platformFee,
      royaltyFee: breakdown.royaltyFee,
      totalFees: breakdown.totalFees,
      sellerProceeds: breakdown.sellerProceeds,
    };
  }

  /**
   * Get platform fee percentage
   */
  async getPlatformFeePercentage(): Promise<number> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    const fee = await this.hub.getPlatformFeePercentage();
    return Number(fee);
  }

  /**
   * Verify if a collection is valid
   */
  async verifyCollection(
    collection: string
  ): Promise<{ isValid: boolean; tokenType: string }> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }

    const [isValid, tokenType] = await this.hub.verifyCollection(collection);

    return { isValid, tokenType };
  }

  /**
   * Get auction contract addresses
   */
  getEnglishAuction(): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
    }
    return this.addresses.englishAuction;
  }

  getDutchAuction(): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
    }
    return this.addresses.dutchAuction;
  }

  getAuctionFactory(): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
    }
    return this.addresses.auctionFactory;
  }

  /**
   * Get Bundle Manager address
   */
  getBundleManager(): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
    }
    return this.addresses.bundleManager;
  }

  /**
   * Get Offer Manager address
   */
  getOfferManager(): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
    }
    return this.addresses.offerManager;
  }

  /**
   * Get Bundle Manager address async (for compatibility)
   */
  async getBundleManagerAsync(): Promise<string> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.getBundleManager();
  }

  /**
   * Get Offer Manager address async (for compatibility)
   */
  async getOfferManagerAsync(): Promise<string> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.getOfferManager();
  }
}

// Export singleton instance
export const marketplaceHubService = new MarketplaceHubService();
