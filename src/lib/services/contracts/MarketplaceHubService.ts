/**
 * MarketplaceHub Service
 * Single entry point for discovering all marketplace contract addresses
 * Based on Hub + Registry pattern from zuno-marketplace-contracts
 */

import { ethers } from "ethers";
import { getHubAddress } from "@/lib/config/networks";
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
    const hubAddress = getHubAddress(chainId);

    // Check if hub address is configured
    if (!hubAddress || hubAddress === "0x0000000000000000000000000000000000000000") {
      console.warn(`⚠️ MarketplaceHub not configured for chain ${chainId}`);
      // Set default addresses for development/testing
      this.setDefaultAddresses();
      return;
    }

    // Validate contract exists at address
    const code = await provider.getCode(hubAddress);
    if (code === "0x") {
      console.warn(`⚠️ No contract deployed at MarketplaceHub address ${hubAddress} on chain ${chainId}`);
      console.log("Using default addresses for development/testing");
      // Set default addresses for development/testing
      this.setDefaultAddresses();
      return;
    }

    this.hub = new ethers.Contract(
      hubAddress,
      MarketplaceHub_ABI,
      signer || provider
    );

    try {
      // Load all addresses from hub
      await this.loadAddresses();
      console.log("✅ MarketplaceHub initialized from contract:", {
        hub: hubAddress,
        chainId,
        addresses: this.addresses,
      });
    } catch (error: any) {
      console.error("❌ Failed to load addresses from hub:", error?.message || error);
      console.warn("⚠️ Hub may not be properly initialized or ABI mismatch");
      this.setDefaultAddresses();
    }
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
   * Set default addresses for development/testing when hub is not available
   */
  private setDefaultAddresses(): void {
    // Use zero addresses as placeholders for development
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    
    this.addresses = {
      hub: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL || zeroAddress,
      erc721Exchange: zeroAddress,
      erc1155Exchange: zeroAddress,
      erc721Factory: zeroAddress,
      erc1155Factory: zeroAddress,
      englishAuction: zeroAddress,
      dutchAuction: zeroAddress,
      auctionFactory: zeroAddress,
      feeRegistry: zeroAddress,
      bundleManager: zeroAddress,
      offerManager: zeroAddress,
    };

    console.log("⚠️ Using default placeholder addresses for development");
    console.log("To use real contracts, deploy the contracts and update the .env file");
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
   * Get collection factory for token type (from cache)
   */
  getCollectionFactory(tokenType: "ERC721" | "ERC1155"): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
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
      throw new Error("Hub not initialized");
    }
    return this.addresses.erc721Factory;
  }

  /**
   * Get ERC1155 Factory address (from cache)
   */
  getERC1155Factory(): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
    }
    return this.addresses.erc1155Factory;
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
   * Get Bundle Manager address (from cache)
   */
  getBundleManager(): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
    }
    return this.addresses.bundleManager;
  }

  /**
   * Get Offer Manager address (from cache)
   */
  getOfferManager(): string {
    if (!this.addresses) {
      throw new Error("Hub not initialized");
    }
    return this.addresses.offerManager;
  }

  // ==================== REGISTRY QUERIES ====================

  /**
   * Get all registered exchanges
   */
  async getAllExchanges(): Promise<{
    standards: number[];
    exchanges: string[];
  }> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    const [standards, exchanges] = await this.hub.getAllExchanges();
    return { standards, exchanges };
  }

  /**
   * Get all registered factories
   */
  async getAllFactories(): Promise<{
    tokenTypes: string[];
    factories: string[];
  }> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    const [tokenTypes, factories] = await this.hub.getAllFactories();
    return { tokenTypes, factories };
  }

  /**
   * Get all registered auction contracts
   */
  async getAllAuctions(): Promise<{
    types: number[];
    contracts: string[];
  }> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    const [types, contracts] = await this.hub.getAllAuctions();
    return { types, contracts };
  }

  /**
   * Check if address is a registered exchange
   */
  async isRegisteredExchange(exchange: string): Promise<boolean> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.isRegisteredExchange(exchange);
  }

  /**
   * Check if address is a registered factory
   */
  async isRegisteredFactory(factory: string): Promise<boolean> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.isRegisteredFactory(factory);
  }

  /**
   * Check if address is a registered auction contract
   */
  async isRegisteredAuction(auctionContract: string): Promise<boolean> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.isRegisteredAuction(auctionContract);
  }

  // ==================== ADDITIONAL FEE QUERIES ====================

  /**
   * Calculate platform fee only
   */
  async calculatePlatformFee(salePrice: bigint): Promise<bigint> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.calculatePlatformFee(salePrice);
  }

  /**
   * Calculate royalty fee only
   */
  async calculateRoyalty(
    nftContract: string,
    tokenId: string,
    salePrice: bigint
  ): Promise<{ recipient: string; amount: bigint }> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    const [recipient, amount] = await this.hub.calculateRoyalty(
      nftContract,
      tokenId,
      salePrice
    );
    return { recipient, amount };
  }

  /**
   * Get fee-related contract addresses
   */
  async getFeeContracts(): Promise<{
    baseFeeContract: string;
    feeManagerContract: string;
    royaltyManagerContract: string;
  }> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    const [baseFeeContract, feeManagerContract, royaltyManagerContract] =
      await this.hub.getFeeContracts();
    return {
      baseFeeContract,
      feeManagerContract,
      royaltyManagerContract,
    };
  }

  // ==================== REGISTRY ACCESS ====================

  /**
   * Get Exchange Registry address
   */
  async getExchangeRegistry(): Promise<string> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.getExchangeRegistry();
  }

  /**
   * Get Collection Registry address
   */
  async getCollectionRegistry(): Promise<string> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.getCollectionRegistry();
  }

  /**
   * Get Fee Registry address
   */
  async getFeeRegistry(): Promise<string> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.getFeeRegistry();
  }

  /**
   * Get Auction Registry address
   */
  async getAuctionRegistry(): Promise<string> {
    if (!this.hub) {
      throw new Error("Hub not initialized");
    }
    return await this.hub.getAuctionRegistry();
  }

  // ==================== ADMIN FUNCTIONS ====================

  /**
   * Update a registry address (Admin only)
   * @param registryType "exchange", "collection", "fee", "auction", "bundle", or "offer"
   * @param newRegistry The new registry address
   */
  async updateRegistry(
    registryType: string,
    newRegistry: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.hub || !this.signer) {
      throw new Error("Hub not initialized with signer");
    }
    return await this.hub.updateRegistry(registryType, newRegistry);
  }
}

// Export singleton instance
export const marketplaceHubService = new MarketplaceHubService();
