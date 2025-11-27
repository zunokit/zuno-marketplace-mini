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
import { logger } from "@/lib/utils/logger";

// Mock data for collections
const mockCollections = [
  {
    address: "0x1234567890123456789012345678901234567890",
    name: "Cosmic Creatures",
    symbol: "COSMIC",
    description: "A collection of otherworldly digital creatures",
    creator: "0x1234...5678",
    verified: true,
    type: "ERC721" as const,
    stats: {
      totalSupply: 100,
      totalOwners: 45,
      floorPrice: "0.5",
      totalVolume: "125.5",
      listed: 12,
    },
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  },
  {
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    name: "Digital Dreams",
    symbol: "DREAM",
    description: "Surreal digital art exploring consciousness",
    creator: "0xabcd...efgh",
    verified: true,
    type: "ERC721" as const,
    stats: {
      totalSupply: 50,
      totalOwners: 28,
      floorPrice: "0.8",
      totalVolume: "89.2",
      listed: 8,
    },
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
  },
  {
    address: "0x9876543210987654321098765432109876543210",
    name: "Abstract Visions",
    symbol: "VISION",
    description: "Abstract generative art pieces",
    creator: "0x9876...5432",
    verified: false,
    type: "ERC721" as const,
    stats: {
      totalSupply: 200,
      totalOwners: 67,
      floorPrice: "0.3",
      totalVolume: "45.7",
      listed: 23,
    },
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
  },
];

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading for demo
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [page]);

  // Use mock data instead of SDK hook
  const collections = mockCollections;
  const totalPages = Math.ceil(collections.length / pageSize);

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
