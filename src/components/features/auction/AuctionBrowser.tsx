"use client";

import { useState, useEffect, useMemo } from "react";
import { logger } from "@/lib/utils/logger";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuctionCard } from "./AuctionCard";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  RefreshCw,
  Gavel,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/providers/WalletProvider";
import { useAuction } from "@/hooks/use-auction";

interface FilterOptions {
  priceMin: string;
  priceMax: string;
  auctionType: "ALL" | "ENGLISH" | "DUTCH";
  status: string;
}

interface SortOption {
  value: string;
  label: string;
  icon?: any;
}

const sortOptions: SortOption[] = [
  { value: "price_asc", label: "Price: Low to High", icon: SortAsc },
  { value: "price_desc", label: "Price: High to Low", icon: SortDesc },
  { value: "ending_soon", label: "Ending Soon" },
  { value: "newest", label: "Recently Listed" },
  { value: "oldest", label: "Oldest First" },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "ENDED", label: "Ended" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function AuctionBrowser() {
  const { account } = useWallet();
  const { getActiveAuctions, placeBid, buyDutchAuction, cancelAuction } = useAuction();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("ending_soon");
  const [filters, setFilters] = useState<FilterOptions>({
    priceMin: "",
    priceMax: "",
    auctionType: "ALL",
    status: "ACTIVE",
  });

  // Fetch auctions from blockchain
  const fetchAuctions = async () => {
    setLoading(true);
    setError(null);
    try {
      logger.startTimer("fetch-auctions");
      logger.info("Fetching auctions from blockchain", null, {
        component: "AuctionBrowser",
        action: "fetchAuctions",
      });

      const { english, dutch } = await getActiveAuctions();

      // Combine English and Dutch auctions
      const allAuctions = [
        ...english.map((a: any) => ({ ...a, auctionType: "ENGLISH" as const })),
        ...dutch.map((a: any) => ({ ...a, auctionType: "DUTCH" as const })),
      ];

      setAuctions(allAuctions);
      logger.endTimer("fetch-auctions", `Fetched ${allAuctions.length} auctions`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch auctions";
      setError(errorMsg);
      logger.error("Failed to fetch auctions", err, {
        component: "AuctionBrowser",
        action: "fetchAuctions",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  // Filter and sort auctions
  const filteredAndSortedAuctions = useMemo(() => {
    const filtered = auctions.filter((auction) => {
      // Status filter
      if (filters.status !== "all" && auction.status !== filters.status) {
        return false;
      }

      // Auction type filter
      if (filters.auctionType !== "ALL" && auction.auctionType !== filters.auctionType) {
        return false;
      }

      // Price range filter
      if (
        filters.priceMin &&
        parseFloat(auction.currentPrice) < parseFloat(filters.priceMin)
      ) {
        return false;
      }
      if (
        filters.priceMax &&
        parseFloat(auction.currentPrice) > parseFloat(filters.priceMax)
      ) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = auction.nft?.name?.toLowerCase().includes(query);
        const matchesCollection = auction.nft?.collection?.name
          ?.toLowerCase()
          .includes(query);
        const matchesTokenId = auction.tokenId.includes(query);

        if (!matchesName && !matchesCollection && !matchesTokenId) {
          return false;
        }
      }

      return true;
    });

    // Sort auctions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return parseFloat(a.currentPrice) - parseFloat(b.currentPrice);
        case "price_desc":
          return parseFloat(b.currentPrice) - parseFloat(a.currentPrice);
        case "ending_soon":
          return a.endTime - b.endTime;
        case "newest":
          return b.startTime - a.startTime;
        case "oldest":
          return a.startTime - b.startTime;
        default:
          return 0;
      }
    });

    return filtered;
  }, [auctions, filters, searchQuery, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.auctionType !== "ALL") count++;
    if (filters.status !== "ACTIVE") count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      priceMin: "",
      priceMax: "",
      auctionType: "ALL",
      status: "ACTIVE",
    });
    setSearchQuery("");
  };

  const handleBid = async (auctionId: string, amount: string, auctionType: "ENGLISH" | "DUTCH") => {
    try {
      if (auctionType === "ENGLISH") {
        await placeBid(auctionId, amount);
      } else {
        await buyDutchAuction(auctionId);
      }
      // Refresh auctions after successful bid
      await fetchAuctions();
    } catch (error) {
      logger.error("Failed to place bid", error, {
        component: "AuctionBrowser",
        action: "placeBid",
      });
    }
  };

  const handleCancel = async (auctionId: string, auctionType: "ENGLISH" | "DUTCH") => {
    try {
      await cancelAuction(auctionId, auctionType);
      // Refresh auctions after successful cancellation
      await fetchAuctions();
    } catch (error) {
      logger.error("Failed to cancel auction", error, {
        component: "AuctionBrowser",
        action: "cancelAuction",
      });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground mb-4">
          Failed to load auctions
        </p>
        <Button variant="outline" onClick={fetchAuctions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gavel className="h-8 w-8" />
            Auctions
          </h1>
          <p className="text-muted-foreground">
            Bid on exclusive NFTs or watch prices drop
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Auction Type Tabs */}
      <Tabs
        value={filters.auctionType}
        onValueChange={(value) =>
          setFilters((prev) => ({ ...prev, auctionType: value as any }))
        }
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="ALL" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            All
          </TabsTrigger>
          <TabsTrigger value="ENGLISH" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            English
          </TabsTrigger>
          <TabsTrigger value="DUTCH" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Dutch
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, collection, or token ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.icon && <option.icon className="h-4 w-4" />}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filters */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Refine your search with these filters
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium">Price Range (ETH)</label>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.priceMin}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceMin: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.priceMax}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceMax: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear All Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${filteredAndSortedAuctions.length} auctions`}
        </p>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear {activeFiltersCount} filter
            {activeFiltersCount !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Auctions Grid */}
      {loading ? (
        <div
          className={cn(
            "grid gap-6",
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          )}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedAuctions.length > 0 ? (
        <div
          className={cn(
            "grid gap-6",
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 max-w-2xl mx-auto"
          )}
        >
          {filteredAndSortedAuctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              isOwner={auction.seller === account}
              onBid={(amount) => handleBid(auction.id, amount, auction.auctionType)}
              onCancel={() => handleCancel(auction.id, auction.auctionType)}
              onView={() => {
                logger.info(
                  "View auction details",
                  { auctionId: auction.id },
                  { component: "AuctionBrowser", action: "viewAuction" }
                );
                window.location.href = `/auctions/${auction.id}`;
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <Gavel className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No auctions found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
