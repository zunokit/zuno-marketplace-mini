"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCreatedCollections, useCollectionInfo } from "zuno-marketplace-sdk/react";

function CollectionCard({ address, type }: { address: string; type: "ERC721" | "ERC1155" }) {
  const { data: info, isLoading } = useCollectionInfo(address);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  const totalMinted = parseInt(info?.totalSupply || "0");
  const maxSupply = parseInt(info?.maxSupply || "0");
  const progress = maxSupply > 0 ? (totalMinted / maxSupply) * 100 : 0;

  return (
    <Link href={`/collections/${address}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <span className="text-4xl font-bold text-primary/30">
            {info?.symbol?.slice(0, 2) || "??"}
          </span>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold truncate">{info?.name || "Unknown"}</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {type}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3 truncate">
            {info?.symbol || "---"}
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Minted</span>
              <span>{totalMinted} / {maxSupply || "∞"}</span>
            </div>
            {maxSupply > 0 && (
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span>{info?.mintPrice || "0"} ETH</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const { data: createdCollections, isLoading, error, refetch } = useCreatedCollections();

  const filteredCollections = useMemo(() => {
    if (!createdCollections) return [];
    
    let filtered = [...createdCollections];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.address.toLowerCase().includes(query) ||
        c.creator.toLowerCase().includes(query)
      );
    }

    if (sortBy === "recent") {
      filtered.sort((a, b) => b.blockNumber - a.blockNumber);
    }

    return filtered;
  }, [createdCollections, searchQuery, sortBy]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Explore Collections</h1>
              <p className="text-muted-foreground">
                {createdCollections?.length || 0} collections found on-chain
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
                placeholder="Search by address or creator..."
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
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading collections from blockchain...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-lg text-red-500 mb-4">Failed to load collections</p>
            <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        )}

        {/* Collections Grid */}
        {!isLoading && !error && (
          <>
            {filteredCollections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCollections.map((collection) => (
                  <CollectionCard
                    key={collection.address}
                    address={collection.address}
                    type={collection.type}
                  />
                ))}
              </div>
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
          </>
        )}
      </div>
    </MainLayout>
  );
}
