/**
 * Mock Data Service
 * Provides mock data for development without blockchain connection
 */

import { ENV } from "@/lib/config/env";

export interface MockCollection {
  address: string;
  name: string;
  symbol: string;
  type: "ERC721" | "ERC1155";
  owner: string;
  description?: string;
  image?: string;
  mintPrice: string;
  maxSupply: number;
  totalMinted: number;
  isActive: boolean;
}

export interface MockNFT {
  tokenId: string;
  collectionAddress: string;
  owner: string;
  tokenURI: string;
  amount: string;
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface MockListing {
  listingId: string;
  seller: string;
  collectionAddress: string;
  tokenId: string;
  price: string;
  isActive: boolean;
  expiresAt: number;
}

/**
 * Simulate network delay for realistic testing (300ms)
 */
const simulateNetworkDelay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
};

/**
 * Generate mock collections
 */
export function generateMockCollections(count: number = 5): MockCollection[] {
  const collections: MockCollection[] = [];

  for (let i = 0; i < count; i++) {
    collections.push({
      address: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`,
      name: `Mock Collection ${i + 1}`,
      symbol: `MOCK${i + 1}`,
      type: i % 2 === 0 ? "ERC721" : "ERC1155",
      owner: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`,
      description: `This is a mock collection #${i + 1} for testing`,
      image: `https://picsum.photos/seed/collection${i}/400/400`,
      mintPrice: (0.001 * (i + 1)).toString(),
      maxSupply: 100 * (i + 1),
      totalMinted: Math.floor(Math.random() * 50),
      isActive: true,
    });
  }

  return collections;
}

/**
 * Generate mock NFTs for a collection
 */
export function generateMockNFTs(
  collectionAddress: string,
  count: number = 10
): MockNFT[] {
  const nfts: MockNFT[] = [];

  for (let i = 0; i < count; i++) {
    nfts.push({
      tokenId: (i + 1).toString(),
      collectionAddress,
      owner: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`,
      tokenURI: `ipfs://mock-${collectionAddress}-${i + 1}`,
      amount: "1",
      name: `Mock NFT #${i + 1}`,
      description: `This is a mock NFT #${i + 1}`,
      image: `https://picsum.photos/seed/nft${i}/300/300`,
      attributes: [
        {
          trait_type: "Rarity",
          value: ["Common", "Rare", "Epic", "Legendary"][
            Math.floor(Math.random() * 4)
          ],
        },
        {
          trait_type: "Level",
          value: Math.floor(Math.random() * 100).toString(),
        },
      ],
    });
  }

  return nfts;
}

/**
 * Generate mock listings
 */
export function generateMockListings(count: number = 10): MockListing[] {
  const listings: MockListing[] = [];
  const collections = generateMockCollections(3);

  for (let i = 0; i < count; i++) {
    const collection = collections[i % collections.length];
    listings.push({
      listingId: (i + 1).toString(),
      seller: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`,
      collectionAddress: collection.address,
      tokenId: (i + 1).toString(),
      price: (0.01 * (i + 1)).toString(),
      isActive: true,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    });
  }

  return listings;
}

/**
 * Mock Data Service Class
 */
export class MockDataService {
  private collections: MockCollection[] = [];
  private nfts: Map<string, MockNFT[]> = new Map();
  private listings: MockListing[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.collections = generateMockCollections();
    this.collections.forEach((collection) => {
      this.nfts.set(
        collection.address,
        generateMockNFTs(collection.address, 10)
      );
    });
    this.listings = generateMockListings();
  }

  // Collections
  async getCollections(): Promise<MockCollection[]> {
    await simulateNetworkDelay();
    return this.collections;
  }

  async getCollection(address: string): Promise<MockCollection | undefined> {
    await simulateNetworkDelay();
    return this.collections.find(
      (c) => c.address.toLowerCase() === address.toLowerCase()
    );
  }

  async createCollection(
    data: Partial<MockCollection>
  ): Promise<MockCollection> {
    await simulateNetworkDelay();

    const newCollection: MockCollection = {
      address: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`,
      name: data.name || "New Collection",
      symbol: data.symbol || "NEW",
      type: data.type || "ERC721",
      owner: data.owner || "0x0",
      description: data.description,
      image: data.image,
      mintPrice: data.mintPrice || "0.001",
      maxSupply: data.maxSupply || 100,
      totalMinted: 0,
      isActive: true,
    };

    this.collections.push(newCollection);
    this.nfts.set(newCollection.address, []);

    return newCollection;
  }

  // NFTs
  async getNFTs(collectionAddress: string): Promise<MockNFT[]> {
    await simulateNetworkDelay();
    return this.nfts.get(collectionAddress) || [];
  }

  async getNFT(
    collectionAddress: string,
    tokenId: string
  ): Promise<MockNFT | undefined> {
    await simulateNetworkDelay();
    const nfts = this.nfts.get(collectionAddress) || [];
    return nfts.find((nft) => nft.tokenId === tokenId);
  }

  async mintNFT(
    collectionAddress: string,
    recipient: string,
    amount: number = 1
  ): Promise<MockNFT[]> {
    await simulateNetworkDelay();

    const collection = await this.getCollection(collectionAddress);
    if (!collection) {
      throw new Error("Collection not found");
    }

    if (collection.totalMinted + amount > collection.maxSupply) {
      throw new Error("Exceeds max supply");
    }

    const mintedNFTs: MockNFT[] = [];
    const currentNFTs = this.nfts.get(collectionAddress) || [];

    for (let i = 0; i < amount; i++) {
      const tokenId = (collection.totalMinted + i + 1).toString();
      const newNFT: MockNFT = {
        tokenId,
        collectionAddress,
        owner: recipient,
        tokenURI: `ipfs://mock-${collectionAddress}-${tokenId}`,
        amount: "1",
        name: `${collection.name} #${tokenId}`,
        description: `Minted NFT from ${collection.name}`,
        image: `https://picsum.photos/seed/nft${tokenId}/300/300`,
        attributes: [
          {
            trait_type: "Rarity",
            value: ["Common", "Rare", "Epic"][Math.floor(Math.random() * 3)],
          },
          { trait_type: "Generation", value: "Mock" },
        ],
      };

      currentNFTs.push(newNFT);
      mintedNFTs.push(newNFT);
    }

    this.nfts.set(collectionAddress, currentNFTs);
    collection.totalMinted += amount;

    return mintedNFTs;
  }

  // Listings
  async getListings(): Promise<MockListing[]> {
    await simulateNetworkDelay();
    return this.listings.filter((l) => l.isActive);
  }

  async createListing(data: Partial<MockListing>): Promise<MockListing> {
    await simulateNetworkDelay();

    const newListing: MockListing = {
      listingId: (this.listings.length + 1).toString(),
      seller: data.seller || "0x0",
      collectionAddress: data.collectionAddress || "0x0",
      tokenId: data.tokenId || "1",
      price: data.price || "0.01",
      isActive: true,
      expiresAt: data.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    this.listings.push(newListing);
    return newListing;
  }

  async cancelListing(listingId: string): Promise<void> {
    await simulateNetworkDelay();

    const listing = this.listings.find((l) => l.listingId === listingId);
    if (listing) {
      listing.isActive = false;
    }
  }

  // Utility
  reset() {
    this.initialize();
  }
}

// Singleton instance
let mockDataServiceInstance: MockDataService | null = null;

export function getMockDataService(): MockDataService {
  if (!mockDataServiceInstance) {
    mockDataServiceInstance = new MockDataService();
  }
  return mockDataServiceInstance;
}

/**
 * Check if mock data is enabled
 */
export function isMockDataEnabled(): boolean {
  return ENV.USE_MOCK_DATA;
}

/**
 * Log mock data status
 */
export function logMockDataStatus() {
  if (isMockDataEnabled()) {
    console.log("🎭 Mock Data Service: ENABLED");
  }
}
