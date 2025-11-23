"use client";
import { useState, useEffect } from "react";
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
import { ListingCard } from "./ListingCard";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useExchange, useListings } from "zuno-marketplace-sdk/react";
import { useAccount } from "wagmi";

interface FilterOptions {
  priceMin: string;
  priceMax: string;
  currency: string;
  collection: string;
  status: string;
}

interface SortOption {
  value: string;
  label: string;
  icon?: any;
}

export function MarketplaceBrowser() {
  const { buyNFT, cancelListing } = useExchange();
  const { data: listings, isLoading, refetch } = useListings("", 1, 50);
  const { isConnected, address } = useAccount();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("recent");

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      logger.error("Failed to refresh listings", error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredListings = listings?.items?.filter((listing: any) => {
    if (searchQuery) {
      return listing.seller.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Filter listings by price, collection, etc.
                </SheetDescription>
              </SheetHeader>
              {/* Filter content would go here */}
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredListings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {searchQuery ? "No listings found matching your search." : "No active listings."}
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {!isLoading && filteredListings.length > 0 && (
        <div
          className={cn(
            "gap-6",
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          )}
        >
          {filteredListings.map((listing: any) => (
            <ListingCard
              key={listing.id || listing.listingId}
              listing={listing}
              isOwner={listing.seller?.toLowerCase() === address?.toLowerCase()}
              onBuy={() => {
                if (listing.id || listing.listingId) {
                  buyNFT.mutateAsync({
                    listingId: listing.id || listing.listingId
                  });
                }
              }}
              onCancel={() => {
                if (listing.id || listing.listingId) {
                  cancelListing.mutateAsync({
                    listingId: listing.id || listing.listingId
                  });
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}