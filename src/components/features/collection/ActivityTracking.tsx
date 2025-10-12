/**
 * Activity Tracking Component
 * Displays collection activity history (mints, transfers, sales, etc.)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { eventService } from "@/lib/services/blockchain/EventService";
import { collectionService } from "@/lib/services/contracts/CollectionService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  ExternalLink,
  RefreshCw,
  Filter,
  Loader2,
  AlertCircle,
  Users,
  Package,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export interface ActivityEvent {
  id: string;
  type: "mint" | "transfer" | "sale" | "list" | "approval";
  from: string;
  to: string;
  tokenId?: string;
  amount?: string;
  price?: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  description: string;
}

interface ActivityTrackingProps {
  collectionAddress: string;
  tokenType: "ERC721" | "ERC1155";
}

export function ActivityTracking({
  collectionAddress,
  tokenType,
}: ActivityTrackingProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);

  const loadActivities = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        // Get collection contract using provider
        const { ERC721Collection_ABI, ERC1155Collection_ABI } = await import(
          "@/lib/contracts/abis"
        );
        const abi =
          tokenType === "ERC721" ? ERC721Collection_ABI : ERC1155Collection_ABI;

        // Get provider from web3Utils
        const { web3Utils } = await import("@/lib/utils/web3");
        let provider = web3Utils.getProvider();

        // Initialize provider if not available
        if (!provider) {
          try {
            await web3Utils.initializeProvider();
            provider = web3Utils.getProvider();
          } catch (initError) {
            console.error("Failed to initialize provider:", initError);
            throw new Error("No provider available");
          }
        }

        if (!provider) {
          throw new Error("No provider available");
        }

        const collection = new ethers.Contract(
          collectionAddress,
          abi,
          provider
        );

        // Query past events (only standard ERC721/ERC1155 events)
        const events = await Promise.all([
          // Transfer events
          eventService
            .queryEvents(collection, "Transfer", undefined, undefined)
            .catch(() => []),
          // Approval events
          eventService
            .queryEvents(collection, "Approval", undefined, undefined)
            .catch(() => []),
          eventService
            .queryEvents(collection, "ApprovalForAll", undefined, undefined)
            .catch(() => []),
        ]);

        // Flatten and process events
        const allEvents = events.flat();
        const processedActivities = allEvents
          .map((event, index) => processEvent(event, index))
          .filter((activity): activity is ActivityEvent => activity !== null)
          .sort((a, b) => b.timestamp - a.timestamp);

        setActivities(processedActivities);
      } catch (err: any) {
        console.error("Failed to load activities:", err);
        // Don't show error for common issues like no provider or no events
        if (err.message?.includes("No provider available")) {
          setError("Please connect your wallet to view activity");
        } else if (err.message?.includes("unknown fragment")) {
          // Contract doesn't support this event type, just show empty state
          setActivities([]);
        } else {
          setError(err.message || "Failed to load activity history");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [collectionAddress, tokenType]
  );

  const processEvent = (event: any, index: number): ActivityEvent | null => {
    try {
      console.log("Raw event data:", event);
      const { name, args, blockNumber, transactionHash, timestamp } = event;

      // If event doesn't have proper data structure, skip it
      if (!name || !args || args.length === 0) {
        console.log("Skipping event with invalid structure");
        return null;
      }

      let type: ActivityEvent["type"] = "transfer";
      let description = "";
      let from = "";
      let to = "";
      let tokenId = "";
      let amount = "";
      let price = "";

      switch (name) {
        case "Transfer":
          // Handle both named and indexed arguments
          from = args.from || args[0] || "";
          to = args.to || args[1] || "";
          tokenId = args.tokenId?.toString() || args[2]?.toString() || "";

          // Debug log to see what we're getting
          console.log("Processing Transfer event:", {
            from,
            to,
            tokenId,
            args,
            argsLength: args.length,
            argsKeys: Object.keys(args),
          });

          // If args is empty or all values are empty, skip this event
          if (!from && !to && !tokenId) {
            console.log("Skipping event with empty data");
            return null;
          }

          // Skip invalid transfers (both from and to are zero address)
          if (from === ethers.ZeroAddress && to === ethers.ZeroAddress) {
            return null;
          }

          if (from === ethers.ZeroAddress) {
            type = "mint";
            description = tokenId ? `Minted token #${tokenId}` : "Minted NFT";
          } else if (to === ethers.ZeroAddress) {
            type = "transfer";
            description = tokenId ? `Burned token #${tokenId}` : "Burned NFT";
          } else {
            type = "transfer";
            description = tokenId
              ? `Transferred token #${tokenId}`
              : "Transferred NFT";
          }
          break;

        case "TransferSingle":
          from = args.from || args[0] || "";
          to = args.to || args[1] || "";
          tokenId = args.id?.toString() || args[2]?.toString() || "";
          amount = args.value?.toString() || args[3]?.toString() || "";

          if (from === ethers.ZeroAddress) {
            type = "mint";
            description = tokenId
              ? `Minted ${amount} of token #${tokenId}`
              : `Minted ${amount} NFTs`;
          } else {
            type = "transfer";
            description = tokenId
              ? `Transferred ${amount} of token #${tokenId}`
              : `Transferred ${amount} NFTs`;
          }
          break;

        case "TransferBatch":
          from = args.from || args[0] || "";
          to = args.to || args[1] || "";
          const ids = args.ids || args[2] || [];
          const values = args.values || args[3] || [];

          type = "transfer";
          description = `Batch transferred ${ids.length} tokens`;
          break;

        case "Approval":
          from = args.owner || args[0] || "";
          to = args.approved || args[1] || "";
          tokenId = args.tokenId?.toString() || args[2]?.toString() || "";

          type = "approval";
          description = `Approved token #${tokenId}`;
          break;

        case "ApprovalForAll":
          from = args.owner || args[0] || "";
          to = args.operator || args[1] || "";
          const approved = args.approved || args[2] || false;

          type = "approval";
          description = approved
            ? "Approved all tokens"
            : "Revoked all approvals";
          break;

        default:
          return null;
      }

      const activityEvent = {
        id: `${transactionHash || "unknown"}-${index}`,
        type,
        from,
        to,
        tokenId,
        amount,
        price,
        transactionHash: transactionHash || "unknown",
        blockNumber,
        timestamp: timestamp || Date.now(),
        description,
      };

      console.log("Created activity event:", activityEvent);
      return activityEvent;
    } catch (error) {
      console.error("Failed to process event:", error);
      return null;
    }
  };

  const subscribeToEvents = useCallback(async () => {
    try {
      // Check if provider is available before subscribing
      const { web3Utils } = await import("@/lib/utils/web3");
      let provider = web3Utils.getProvider();

      // Initialize provider if not available
      if (!provider) {
        try {
          await web3Utils.initializeProvider();
          provider = web3Utils.getProvider();
        } catch (initError) {
          console.log(
            "Failed to initialize provider for subscription:",
            initError
          );
          return;
        }
      }

      if (!provider) {
        console.log("No provider available for event subscription");
        return;
      }

      const ids = await eventService.subscribeToCollection(
        collectionAddress,
        tokenType as any, // Type assertion for compatibility
        ["Transfer", "Approval", "ApprovalForAll"]
      );
      setSubscriptionIds(ids);

      // Listen for new events
      const handleNewEvent = (event: CustomEvent) => {
        console.log("Received new collection event:", event.detail);
        if (event.detail.collection === collectionAddress) {
          // Process the new event immediately - use event.detail.data
          const newActivity = processEvent(event.detail.data, Date.now());
          if (newActivity) {
            console.log("Adding new activity to list:", newActivity);
            setActivities((prev) => [newActivity, ...prev]);
          } else {
            console.log("Event processed but no activity created");
          }
        }
      };

      window.addEventListener(
        "collection-event",
        handleNewEvent as EventListener
      );

      return () => {
        window.removeEventListener(
          "collection-event",
          handleNewEvent as EventListener
        );
      };
    } catch (error) {
      console.error("Failed to subscribe to events:", error);
    }
  }, [collectionAddress, tokenType, loadActivities]);

  useEffect(() => {
    loadActivities();
    subscribeToEvents();

    return () => {
      // Cleanup subscriptions
      subscriptionIds.forEach((id) => eventService.unsubscribe(id));
    };
  }, [collectionAddress, tokenType]);

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    return activity.type === filter;
  });

  const getActivityIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "mint":
        return <Package className="h-4 w-4 text-green-500" />;
      case "transfer":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "sale":
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case "list":
        return <Activity className="h-4 w-4 text-purple-500" />;
      case "approval":
        return <Activity className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (type: ActivityEvent["type"]) => {
    const variants = {
      mint: "default",
      transfer: "secondary",
      sale: "destructive",
      list: "outline",
      approval: "outline",
    } as const;

    return (
      <Badge variant={variants[type] || "outline"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatAddress = (address: string) => {
    if (!address || address === ethers.ZeroAddress) return "Zero Address";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openEtherscan = (txHash: string) => {
    const explorerUrl = `https://etherscan.io/tx/${txHash}`;
    window.open(explorerUrl, "_blank");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="link"
                size="sm"
                onClick={() => loadActivities()}
                className="ml-2"
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="mint">Mint</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadActivities(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activity found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Activity will appear here as transactions occur
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">
                      {activity.description}
                    </p>
                    {getActivityBadge(activity.type)}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-4">
                      {activity.type === "mint" &&
                        activity.to &&
                        activity.to !== ethers.ZeroAddress && (
                          <span>To: {formatAddress(activity.to)}</span>
                        )}
                      {activity.type === "transfer" &&
                        activity.from &&
                        activity.from !== ethers.ZeroAddress && (
                          <span>From: {formatAddress(activity.from)}</span>
                        )}
                      {activity.type === "transfer" &&
                        activity.to &&
                        activity.to !== ethers.ZeroAddress && (
                          <span>To: {formatAddress(activity.to)}</span>
                        )}
                      {activity.type === "approval" &&
                        activity.to &&
                        activity.to !== ethers.ZeroAddress && (
                          <span>Approved: {formatAddress(activity.to)}</span>
                        )}
                      {activity.tokenId && activity.tokenId !== "" && (
                        <span>Token ID: #{activity.tokenId}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => openEtherscan(activity.transactionHash)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View on Etherscan
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
