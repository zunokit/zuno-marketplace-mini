/**
 * Mock Analytics Service
 * Provides mock analytics data for development
 */

export interface VolumeDataPoint {
  timestamp: number;
  date: string;
  totalVolume: number;
  totalSales: number;
  averagePrice: number;
}

export interface CollectionStats {
  address: string;
  name: string;
  volume: number;
  sales: number;
  averagePrice: number;
  floorPrice: number;
  uniqueOwners: number;
}

export interface PlatformStats {
  totalVolume: string;
  totalSales: number;
  totalCollections: number;
  totalNFTs: number;
  totalUsers: number;
  activeUsers24h: number;
}

/**
 * Generate mock volume data
 */
export function generateMockVolumeData(days: number = 30): VolumeDataPoint[] {
  const data: VolumeDataPoint[] = [];
  const now = Date.now();

  for (let i = days - 1; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const date = new Date(timestamp);

    // Generate realistic looking data with some randomness
    const baseVolume = 50 + Math.random() * 100;
    const sales = Math.floor(10 + Math.random() * 40);
    const avgPrice = baseVolume / sales;

    data.push({
      timestamp,
      date: date.toLocaleDateString(),
      totalVolume: parseFloat(baseVolume.toFixed(2)),
      totalSales: sales,
      averagePrice: parseFloat(avgPrice.toFixed(2)),
    });
  }

  return data;
}

/**
 * Generate mock collection stats
 */
export function generateMockCollectionStats(count: number = 10): CollectionStats[] {
  const collections: CollectionStats[] = [];
  const names = [
    "CryptoPunks",
    "Bored Apes",
    "Azuki",
    "Doodles",
    "Clone X",
    "Moonbirds",
    "Pudgy Penguins",
    "Meebits",
    "Cool Cats",
    "World of Women",
  ];

  for (let i = 0; i < count; i++) {
    const volume = parseFloat((Math.random() * 1000 + 100).toFixed(2));
    const sales = Math.floor(Math.random() * 200 + 50);
    const avgPrice = volume / sales;
    const floorPrice = avgPrice * (0.5 + Math.random() * 0.5);

    collections.push({
      address: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`,
      name: names[i] || `Collection ${i + 1}`,
      volume,
      sales,
      averagePrice: parseFloat(avgPrice.toFixed(2)),
      floorPrice: parseFloat(floorPrice.toFixed(2)),
      uniqueOwners: Math.floor(sales * (0.5 + Math.random() * 0.5)),
    });
  }

  // Sort by volume
  return collections.sort((a, b) => b.volume - a.volume);
}

/**
 * Mock Analytics Service Class
 */
export class MockAnalyticsService {
  private volumeData: VolumeDataPoint[] = [];
  private collectionStats: CollectionStats[] = [];

  constructor() {
    this.volumeData = generateMockVolumeData(30);
    this.collectionStats = generateMockCollectionStats(10);
  }

  /**
   * Get platform stats
   */
  async getPlatformStats(): Promise<PlatformStats> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const totalVolume = this.volumeData.reduce((sum, d) => sum + d.totalVolume, 0);
    const totalSales = this.volumeData.reduce((sum, d) => sum + d.totalSales, 0);

    return {
      totalVolume: totalVolume.toFixed(2),
      totalSales,
      totalCollections: this.collectionStats.length,
      totalNFTs: Math.floor(Math.random() * 5000 + 1000),
      totalUsers: Math.floor(Math.random() * 1000 + 500),
      activeUsers24h: Math.floor(Math.random() * 200 + 50),
    };
  }

  /**
   * Get volume data for time period
   */
  async getVolumeData(period: "day" | "week" | "month"): Promise<VolumeDataPoint[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    let days: number;
    switch (period) {
      case "day":
        days = 7;
        break;
      case "week":
        days = 30;
        break;
      case "month":
        days = 90;
        break;
    }

    if (this.volumeData.length < days) {
      this.volumeData = generateMockVolumeData(days);
    }

    return this.volumeData.slice(-days);
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(limit: number = 10): Promise<CollectionStats[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return this.collectionStats.slice(0, limit);
  }

  /**
   * Get user portfolio analytics
   */
  async getUserPortfolio(userAddress: string): Promise<{
    totalValue: number;
    totalNFTs: number;
    collections: number;
    profitLoss: number;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      totalValue: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      totalNFTs: Math.floor(Math.random() * 50 + 5),
      collections: Math.floor(Math.random() * 10 + 2),
      profitLoss: parseFloat(((Math.random() - 0.5) * 20).toFixed(2)),
    };
  }
}

// Singleton instance
let mockAnalyticsServiceInstance: MockAnalyticsService | null = null;

export function getMockAnalyticsService(): MockAnalyticsService {
  if (!mockAnalyticsServiceInstance) {
    mockAnalyticsServiceInstance = new MockAnalyticsService();
  }
  return mockAnalyticsServiceInstance;
}

