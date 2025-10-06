"use client";

/**
 * Analytics Dashboard Page
 * Marketplace analytics using ListingHistoryTrackerService
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/lib/store/hooks";
import { isMockDataEnabled } from "@/lib/services/mock/mockDataService";
import {
  listingHistoryTrackerService,
  GlobalStats,
  ListingHistoryTrackerService,
} from "@/lib/services/contracts/ListingHistoryTrackerService";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
} from "lucide-react";

export default function AnalyticsPage() {
  const { account } = useAppSelector((state) => state.wallet);
  const [useMockData] = useState(isMockDataEnabled());

  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalTransactions: BigInt(0),
    totalVolume: BigInt(0),
    totalListings: BigInt(0),
    totalSales: BigInt(0),
    averagePrice: BigInt(0),
    uniqueCollections: BigInt(0),
    uniqueUsers: BigInt(0),
  });

  const [loading, setLoading] = useState(true);

  /**
   * Load analytics data
   */
  useEffect(() => {
    if (!useMockData && account) {
      loadAnalytics();
    } else if (useMockData) {
      // Mock data
      setGlobalStats({
        totalTransactions: BigInt(2834),
        totalVolume: BigInt("2345670000000000000000"), // 2345.67 ETH
        totalListings: BigInt(1456),
        totalSales: BigInt(1234),
        averagePrice: BigInt("1500000000000000000"), // 1.5 ETH
        uniqueCollections: BigInt(45),
        uniqueUsers: BigInt(892),
      });
      setLoading(false);
    }
  }, [account, useMockData]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const stats = await listingHistoryTrackerService.getGlobalStats();
      setGlobalStats(stats);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📊 Marketplace Analytics</h1>
        <p className="text-muted-foreground">
          Real-time marketplace statistics and insights
        </p>
      </div>

      {useMockData && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ Mock Data Mode - Real contract integration disabled
          </p>
        </div>
      )}

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ListingHistoryTrackerService.formatVolume(
                globalStats.totalVolume
              )}{" "}
              ETH
            </div>
            <p className="text-xs text-muted-foreground">
              All-time trading volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {globalStats.totalSales.toString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Listings
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {globalStats.totalListings.toString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Current marketplace listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {globalStats.uniqueUsers.toString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Active marketplace participants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Price</CardTitle>
            <CardDescription>Mean NFT sale price</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {ListingHistoryTrackerService.formatPrice(
                globalStats.averagePrice
              )}{" "}
              ETH
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collections</CardTitle>
            <CardDescription>Unique NFT collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {globalStats.uniqueCollections.toString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Transactions</CardTitle>
            <CardDescription>All marketplace activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {globalStats.totalTransactions.toString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Transaction Breakdown
          </CardTitle>
          <CardDescription>
            Distribution of marketplace activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Listings Created</span>
              <Badge>{globalStats.totalListings.toString()}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sales Completed</span>
              <Badge>{globalStats.totalSales.toString()}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Transactions</span>
              <Badge variant="outline">
                {globalStats.totalTransactions.toString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
