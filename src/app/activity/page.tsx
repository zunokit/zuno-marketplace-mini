"use client";

/**
 * Activity History Page
 * Migrated from frontend-foundry/src/pages/ActivityHistory.jsx
 * Tracks all NFT transactions and activities using blockchain events
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { isMockDataEnabled } from "@/lib/services/mock/mockDataService";
import {
  getMockActivityService,
  Activity,
  ActivityType,
} from "@/lib/services/mock/mockActivityService";
import {
  AlertCircle,
  Loader2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Tag,
  Gavel,
  Repeat,
  Sparkles,
  X,
} from "lucide-react";

export default function ActivityHistoryPage() {
  const { toast } = useToast();

  // Redux state
  const { account, isConnected } = useAppSelector((state) => state.wallet);

  // Local state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<ActivityType | "all">("all");
  const [timeRange, setTimeRange] = useState<
    "7d" | "30d" | "90d" | "1y" | "all"
  >("30d");
  const [useMockData] = useState(isMockDataEnabled());

  // Activity type labels
  const activityTypes = {
    all: "All Activities",
    buy: "Purchases",
    sell: "Sales",
    list: "Listings",
    offer: "Offers",
    bid: "Bids",
    mint: "Mints",
    transfer: "Transfers",
    cancel: "Cancellations",
  };

  // Time range labels
  const timeRanges = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    "1y": "Last year",
    all: "All time",
  };

  /**
   * Fetch user activities
   */
  useEffect(() => {
    if (account) {
      fetchUserActivity();
    }
  }, [account, filter, timeRange]);

  /**
   * Fetch activities from mock service or blockchain
   */
  const fetchUserActivity = async () => {
    if (!account) return;

    setLoading(true);
    try {
      if (useMockData) {
        // Mock data
        const mockService = getMockActivityService();
        const fetchedActivities = await mockService.getActivities(account, {
          type: filter,
          timeRange,
          limit: 100,
        });
        setActivities(fetchedActivities);
        setFilteredActivities(fetchedActivities);
      } else {
        // Real blockchain data
        // TODO: Implement real contract interaction
        // Should listen to events from:
        // - ListingHistoryTracker: TransactionRecorded, PricePointAdded, UserStatsUpdated
        // - Exchange contracts: ItemListed, ItemSold, ListingCancelled
        // - Auction contracts: BidPlaced, AuctionEnded
        // - NFT contracts: Transfer, Minted

        toast({
          title: "Blockchain Integration",
          description: "Real blockchain activity tracking coming soon",
          variant: "default",
        });
        setActivities([]);
        setFilteredActivities([]);
      }
    } catch (error) {
      console.error("Error fetching user activity:", error);
      toast({
        title: "Error Loading Activities",
        description:
          error instanceof Error ? error.message : "Failed to load activities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  /**
   * Get activity icon
   */
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "buy":
        return <ShoppingCart className="h-4 w-4" />;
      case "sell":
        return <TrendingUp className="h-4 w-4" />;
      case "list":
        return <Tag className="h-4 w-4" />;
      case "offer":
        return <TrendingDown className="h-4 w-4" />;
      case "bid":
        return <Gavel className="h-4 w-4" />;
      case "mint":
        return <Sparkles className="h-4 w-4" />;
      case "transfer":
        return <Repeat className="h-4 w-4" />;
      case "cancel":
        return <X className="h-4 w-4" />;
      default:
        return null;
    }
  };

  /**
   * Get activity color
   */
  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case "buy":
        return "text-green-500 bg-green-50 dark:bg-green-950";
      case "sell":
        return "text-orange-500 bg-orange-50 dark:bg-orange-950";
      case "list":
        return "text-blue-500 bg-blue-50 dark:bg-blue-950";
      case "offer":
        return "text-purple-500 bg-purple-50 dark:bg-purple-950";
      case "bid":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-950";
      case "mint":
        return "text-pink-500 bg-pink-50 dark:bg-pink-950";
      case "transfer":
        return "text-gray-500 bg-gray-50 dark:bg-gray-950";
      case "cancel":
        return "text-red-500 bg-red-50 dark:bg-red-950";
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-950";
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  /**
   * Format address
   */
  const formatAddress = (address: string | null): string => {
    if (!address) return "—";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Get activity description
   */
  const getActivityDescription = (activity: Activity): string => {
    const { type, nft, amount, currency } = activity;

    switch (type) {
      case "buy":
        return `Bought ${nft.name} for ${amount} ${currency}`;
      case "sell":
        return `Sold ${nft.name} for ${amount} ${currency}`;
      case "list":
        return `Listed ${nft.name} for ${amount} ${currency}`;
      case "offer":
        return `Made offer on ${nft.name} for ${amount} ${currency}`;
      case "bid":
        return `Placed bid on ${nft.name} for ${amount} ${currency}`;
      case "mint":
        return `Minted ${nft.name}`;
      case "transfer":
        return `Transferred ${nft.name} to ${formatAddress(activity.to)}`;
      case "cancel":
        return `Cancelled listing for ${nft.name}`;
      default:
        return `${type} ${nft.name}`;
    }
  };

  // Calculate stats
  const stats = {
    total: filteredActivities.length,
    trades: filteredActivities.filter(
      (a) => a.type === "buy" || a.type === "sell"
    ).length,
    volume: filteredActivities
      .filter((a) => a.type === "buy" || a.type === "sell")
      .reduce((sum, a) => sum + parseFloat(a.amount), 0)
      .toFixed(2),
  };

  // Check if wallet is connected
  if (!isConnected || !account) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to view your activity history.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Activity History</h1>
        <p className="text-muted-foreground">
          Track all your NFT transactions and activities
        </p>
        {useMockData && (
          <Badge variant="outline" className="mt-2">
            🎭 Mock Data Mode
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Activities</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Trades</CardDescription>
            <CardTitle className="text-3xl">{stats.trades}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Trading Volume</CardDescription>
            <CardTitle className="text-3xl">{stats.volume} ETH</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Activity Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger id="activity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(activityTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Range Filter */}
            <div className="space-y-2">
              <Label htmlFor="time-range">Time Range</Label>
              <Select
                value={timeRange}
                onValueChange={(v: any) => setTimeRange(v)}
              >
                <SelectTrigger id="time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(timeRanges).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Activities Found</AlertTitle>
          <AlertDescription>
            {filter === "all"
              ? "You haven't made any transactions yet. Start by buying or minting your first NFT!"
              : `No ${activityTypes[
                  filter
                ].toLowerCase()} found for the selected time period.`}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <Card key={activity.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`p-3 rounded-lg ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* NFT Image */}
                  {activity.nft.image && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={activity.nft.image}
                        alt={activity.nft.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {getActivityDescription(activity)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {activity.nft.collection}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>{formatTimeAgo(activity.timestamp)}</span>
                          {activity.from && activity.from !== account && (
                            <>
                              <span>•</span>
                              <span>from {formatAddress(activity.from)}</span>
                            </>
                          )}
                          {activity.to && activity.to !== account && (
                            <>
                              <span>•</span>
                              <span>to {formatAddress(activity.to)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amount & Status */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-lg mb-2">
                          {activity.amount} {activity.currency}
                        </p>
                        <Badge
                          variant="outline"
                          className={getStatusColor(activity.status)}
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Transaction Hash */}
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono">
                        {activity.txHash.slice(0, 20)}...
                        {activity.txHash.slice(-10)}
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`https://etherscan.io/tx/${activity.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          View on Etherscan
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
