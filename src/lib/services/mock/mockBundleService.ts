/**
 * Mock Bundle Service  
 * Provides mock bundle data for development
 */

export enum BundleStatus {
  ACTIVE = 0,
  SOLD = 1,
  CANCELLED = 2,
  EXPIRED = 3,
}

export interface BundleItem {
  nftContract: string;
  tokenId: string;
  amount: string;
  nftName: string;
  nftImage: string;
  collectionName: string;
}

export interface Bundle {
  id: string;
  status: BundleStatus;
  creator: string;
  name: string;
  description: string;
  items: BundleItem[];
  
  // Pricing
  bundlePrice: string;
  totalValue: string; // Sum of individual NFT values
  discountPercentage: number;
  
  // Timing
  createdAt: number;
  expiresAt: number;
}

/**
 * Generate mock bundles
 */
export function generateMockBundles(count: number = 12): Bundle[] {
  const bundles: Bundle[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const isActive = i % 4 !== 0;
    const itemCount = 2 + Math.floor(Math.random() * 4); // 2-5 items per bundle
    
    const createdAt = now - Math.random() * 7 * 24 * 60 * 60 * 1000;
    const duration = 7 + Math.random() * 21; // 7-28 days
    const expiresAt = createdAt + duration * 24 * 60 * 60 * 1000;
    
    const items: BundleItem[] = [];
    let totalValue = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const value = parseFloat((Math.random() * 2 + 0.5).toFixed(2));
      totalValue += value;
      
      items.push({
        nftContract: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`,
        tokenId: Math.floor(Math.random() * 10000).toString(),
        amount: "1",
        nftName: `NFT #${Math.floor(Math.random() * 10000)}`,
        nftImage: `https://picsum.photos/seed/bundle${i}item${j}/300/300`,
        collectionName: ["CryptoPunks", "Bored Apes", "Azuki"][Math.floor(Math.random() * 3)],
      });
    }
    
    const discountPercentage = 5 + Math.floor(Math.random() * 15); // 5-20% discount
    const bundlePrice = totalValue * (1 - discountPercentage / 100);
    
    const bundle: Bundle = {
      id: (i + 1).toString(),
      status: isActive
        ? (now > expiresAt ? BundleStatus.EXPIRED : BundleStatus.ACTIVE)
        : (Math.random() > 0.5 ? BundleStatus.SOLD : BundleStatus.CANCELLED),
      creator: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`,
      name: `Bundle #${i + 1}`,
      description: `Amazing bundle of ${itemCount} NFTs with ${discountPercentage}% discount`,
      items,
      bundlePrice: bundlePrice.toFixed(2),
      totalValue: totalValue.toFixed(2),
      discountPercentage,
      createdAt,
      expiresAt,
    };
    
    bundles.push(bundle);
  }
  
  return bundles;
}

/**
 * Mock Bundle Service Class
 */
export class MockBundleService {
  private bundles: Bundle[] = [];
  
  constructor() {
    this.bundles = generateMockBundles(20);
  }
  
  /**
   * Get all active bundles
   */
  async getActiveBundles(): Promise<Bundle[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const now = Date.now();
    return this.bundles.filter(
      (b) => b.status === BundleStatus.ACTIVE && b.expiresAt > now
    );
  }
  
  /**
   * Get user's bundles
   */
  async getUserBundles(userAddress: string): Promise<Bundle[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    return this.bundles.filter(
      (b) => b.creator.toLowerCase() === userAddress.toLowerCase()
    );
  }
  
  /**
   * Get single bundle
   */
  async getBundle(bundleId: string): Promise<Bundle | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    return this.bundles.find((b) => b.id === bundleId) || null;
  }
  
  /**
   * Create bundle
   */
  async createBundle(data: {
    name: string;
    description: string;
    items: Array<{ nftContract: string; tokenId: string }>;
    bundlePrice: string;
    duration: number; // days
  }): Promise<Bundle> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    if (data.items.length < 2) {
      throw new Error("Bundle must contain at least 2 NFTs");
    }
    if (data.items.length > 10) {
      throw new Error("Bundle can contain maximum 10 NFTs");
    }
    
    const now = Date.now();
    const items: BundleItem[] = data.items.map((item, idx) => ({
      nftContract: item.nftContract,
      tokenId: item.tokenId,
      amount: "1",
      nftName: `NFT #${item.tokenId}`,
      nftImage: `https://picsum.photos/seed/${item.tokenId}/300/300`,
      collectionName: "Collection",
    }));
    
    const bundle: Bundle = {
      id: (this.bundles.length + 1).toString(),
      status: BundleStatus.ACTIVE,
      creator: "0xCurrentUserAddress",
      name: data.name,
      description: data.description,
      items,
      bundlePrice: data.bundlePrice,
      totalValue: (parseFloat(data.bundlePrice) * 1.1).toFixed(2), // Assume 10% discount
      discountPercentage: 10,
      createdAt: now,
      expiresAt: now + data.duration * 24 * 60 * 60 * 1000,
    };
    
    this.bundles.push(bundle);
    return bundle;
  }
  
  /**
   * Buy bundle
   */
  async buyBundle(bundleId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const bundle = this.bundles.find((b) => b.id === bundleId);
    if (!bundle) throw new Error("Bundle not found");
    if (bundle.status !== BundleStatus.ACTIVE) throw new Error("Bundle is not active");
    
    bundle.status = BundleStatus.SOLD;
  }
  
  /**
   * Cancel bundle
   */
  async cancelBundle(bundleId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const bundle = this.bundles.find((b) => b.id === bundleId);
    if (!bundle) throw new Error("Bundle not found");
    
    bundle.status = BundleStatus.CANCELLED;
  }
}

// Singleton instance
let mockBundleServiceInstance: MockBundleService | null = null;

export function getMockBundleService(): MockBundleService {
  if (!mockBundleServiceInstance) {
    mockBundleServiceInstance = new MockBundleService();
  }
  return mockBundleServiceInstance;
}

