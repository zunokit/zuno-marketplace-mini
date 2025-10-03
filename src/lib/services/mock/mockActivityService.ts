/**
 * Mock Activity Service
 * Provides mock activity/transaction data for development
 */

import { ENV } from "@/lib/config/env";

export type ActivityType =
  | "buy"
  | "sell"
  | "list"
  | "offer"
  | "bid"
  | "mint"
  | "transfer"
  | "cancel";
export type ActivityStatus =
  | "completed"
  | "active"
  | "pending"
  | "expired"
  | "cancelled";

export interface ActivityNFT {
  name: string;
  collection: string;
  image: string;
  tokenId: string;
  collectionAddress: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  nft: ActivityNFT;
  amount: string;
  currency: string;
  from: string | null;
  to: string | null;
  txHash: string;
  timestamp: string;
  status: ActivityStatus;
  blockNumber?: number;
  gasUsed?: string;
}

/**
 * Generate mock activities for testing
 */
export function generateMockActivities(
  userAddress: string,
  count: number = 20
): Activity[] {
  const activities: Activity[] = [];
  const now = Date.now();

  const activityTypes: ActivityType[] = [
    "buy",
    "sell",
    "list",
    "offer",
    "bid",
    "mint",
    "transfer",
    "cancel",
  ];
  const collections = [
    { name: "CryptoPunks", prefix: "CryptoPunk" },
    { name: "Bored Ape Yacht Club", prefix: "Bored Ape" },
    { name: "Azuki", prefix: "Azuki" },
    { name: "Doodles", prefix: "Doodle" },
    { name: "CloneX", prefix: "CloneX" },
  ];

  for (let i = 0; i < count; i++) {
    const type =
      activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const collection =
      collections[Math.floor(Math.random() * collections.length)];
    const tokenId = Math.floor(Math.random() * 10000).toString();

    // Random timestamp trong 30 ngày qua
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

    // Random addresses
    const randomAddress = () =>
      `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`;

    let from: string | null = null;
    let to: string | null = null;
    let status: ActivityStatus = "completed";

    // Set from/to based on activity type
    switch (type) {
      case "buy":
        from = randomAddress();
        to = userAddress;
        status = "completed";
        break;
      case "sell":
        from = userAddress;
        to = randomAddress();
        status = "completed";
        break;
      case "list":
        from = userAddress;
        to = null;
        status = Math.random() > 0.5 ? "active" : "cancelled";
        break;
      case "offer":
        from = userAddress;
        to = randomAddress();
        status = Math.random() > 0.3 ? "pending" : "expired";
        break;
      case "bid":
        from = userAddress;
        to = randomAddress();
        status = Math.random() > 0.4 ? "pending" : "expired";
        break;
      case "mint":
        from = null;
        to = userAddress;
        status = "completed";
        break;
      case "transfer":
        from = userAddress;
        to = randomAddress();
        status = "completed";
        break;
      case "cancel":
        from = userAddress;
        to = null;
        status = "completed";
        break;
    }

    activities.push({
      id: (i + 1).toString(),
      type,
      nft: {
        name: `${collection.prefix} #${tokenId}`,
        collection: collection.name,
        image: `https://picsum.photos/seed/activity${i}/200/200`,
        tokenId,
        collectionAddress: randomAddress(),
      },
      amount: (Math.random() * 10 + 0.1).toFixed(2),
      currency: "ETH",
      from,
      to,
      txHash: `0x${Math.random().toString(16).slice(2, 66).padEnd(64, "0")}`,
      timestamp: timestamp.toISOString(),
      status,
      blockNumber: 18000000 + Math.floor(Math.random() * 100000),
      gasUsed: (Math.random() * 0.01).toFixed(6),
    });
  }

  // Sort by timestamp desc
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return activities;
}

/**
 * Mock Activity Service Class
 */
export class MockActivityService {
  private activities: Map<string, Activity[]> = new Map();

  /**
   * Get activities for a user
   */
  async getActivities(
    userAddress: string,
    options?: {
      type?: ActivityType | "all";
      timeRange?: "7d" | "30d" | "90d" | "1y" | "all";
      limit?: number;
    }
  ): Promise<Activity[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Get or generate activities for user
    if (!this.activities.has(userAddress)) {
      this.activities.set(userAddress, generateMockActivities(userAddress, 50));
    }

    let activities = this.activities.get(userAddress) || [];

    // Filter by type
    if (options?.type && options.type !== "all") {
      activities = activities.filter((a) => a.type === options.type);
    }

    // Filter by time range
    if (options?.timeRange && options.timeRange !== "all") {
      const now = Date.now();
      const ranges: Record<string, number> = {
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
        "1y": 365 * 24 * 60 * 60 * 1000,
      };

      const range = ranges[options.timeRange];
      if (range) {
        activities = activities.filter(
          (a) => now - new Date(a.timestamp).getTime() <= range
        );
      }
    }

    // Limit results
    if (options?.limit) {
      activities = activities.slice(0, options.limit);
    }

    return activities;
  }

  /**
   * Get single activity by ID
   */
  async getActivity(
    activityId: string,
    userAddress: string
  ): Promise<Activity | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const activities = this.activities.get(userAddress) || [];
    return activities.find((a) => a.id === activityId) || null;
  }

  /**
   * Get activity stats
   */
  async getStats(userAddress: string): Promise<{
    totalActivities: number;
    totalTrades: number;
    totalVolume: string;
    recentActivity: Activity[];
  }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const activities = this.activities.get(userAddress) || [];
    const trades = activities.filter(
      (a) => a.type === "buy" || a.type === "sell"
    );
    const totalVolume = trades.reduce(
      (sum, a) => sum + parseFloat(a.amount),
      0
    );

    return {
      totalActivities: activities.length,
      totalTrades: trades.length,
      totalVolume: totalVolume.toFixed(2),
      recentActivity: activities.slice(0, 5),
    };
  }
}

// Singleton instance
let mockActivityServiceInstance: MockActivityService | null = null;

export function getMockActivityService(): MockActivityService {
  if (!mockActivityServiceInstance) {
    mockActivityServiceInstance = new MockActivityService();
  }
  return mockActivityServiceInstance;
}
