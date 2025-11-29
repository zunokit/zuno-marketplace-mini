"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { CollectionsGrid } from "@/components/features/collection/CollectionsGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/utils/sdk-logger";

// Collection type for the page (matches CollectionsGrid)
interface Collection {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  creator: string;
  verified?: boolean;
  type: "ERC721" | "ERC1155";
  stats?: {
    totalSupply: number;
    totalOwners: number;
    floorPrice?: string;
    totalVolume?: string;
    listed?: number;
  };
  socialLinks?: {
    website?: string;
    twitter?: string;
    discord?: string;
  };
  createdAt?: number;
}

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [isLoading, setIsLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

  // TODO: Fetch collections from blockchain/API
  // For now, start with empty array - collections will be added when created
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call delay
    const timer = setTimeout(() => {
      setCollections([]);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(collections.length / pageSize));

  // Filter collections based on search
  const filteredCollections = collections.filter(collection => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collection.name?.toLowerCase().includes(query) ||
      collection.symbol?.toLowerCase().includes(query) ||
      collection.address?.toLowerCase().includes(query)
    );
  });

  // Sort collections
  const sortedCollections = [...filteredCollections].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "recent":
        return (b.createdAt || 0) - (a.createdAt || 0);
      case "volume":
        const volumeA = parseFloat(a.stats?.totalVolume || "0");
        const volumeB = parseFloat(b.stats?.totalVolume || "0");
        return volumeB - volumeA;
      default:
        return 0;
    }
  });

  useEffect(() => {
    logger.info(
      "Collections page loaded",
      { totalCollections: collections.length, page, pageSize },
      { component: "CollectionsPage", action: "load" }
    );
  }, [collections.length, page, pageSize]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Explore Collections</h1>
              <p className="text-muted-foreground">
                Discover unique NFT collections from talented creators
              </p>
            </div>
            <Button asChild>
              <Link href="/collections/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="volume">Total Volume</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Collections Grid */}
        {!isLoading && (
          <>
            {sortedCollections.length > 0 ? (
              <CollectionsGrid collections={sortedCollections} />
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
                  {searchQuery 
                    ? "No collections found matching your search" 
                    : "No collections available yet"}
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/collections/create">Create First Collection</Link>
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
