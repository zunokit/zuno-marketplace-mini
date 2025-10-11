"use client";
import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { CollectionsGrid } from "@/components/features/collection/CollectionsGrid";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, TrendingUp, Filter, Grid3X3, List } from "lucide-react";
import Link from "next/link";
import {
  collectionQueryService,
  type CollectionData,
} from "@/lib/services/contracts/CollectionQueryService";
import { marketplaceHubService } from "@/lib/services/contracts/MarketplaceHubService";
import { web3Utils } from "@/lib/utils/web3";
import { ZERO_ADDRESS } from "@/lib/constants";

const sortOptions = [
  { value: "volume_desc", label: "Highest Volume" },
  { value: "volume_asc", label: "Lowest Volume" },
  { value: "floor_desc", label: "Highest Floor" },
  { value: "floor_asc", label: "Lowest Floor" },
  { value: "newest", label: "Recently Created" },
  { value: "oldest", label: "Oldest First" },
  { value: "name_asc", label: "A to Z" },
  { value: "name_desc", label: "Z to A" },
];

const filterOptions = [
  { value: "all", label: "All Collections" },
  { value: "verified", label: "Verified Only" },
  { value: "ERC721", label: "ERC721" },
  { value: "ERC1155", label: "ERC1155" },
];

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("volume_desc");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load collections on mount (client-side only)
  useEffect(() => {
    // Only run on client-side to avoid SSR issues
    if (typeof window !== "undefined") {
      loadCollections();
    }
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      setCollections([]); // Clear existing collections

      // Check if we're in browser environment
      if (typeof window === "undefined") {
        console.log("⚠️ Not in browser environment");
        setError("Browser environment required for blockchain connection");
        return;
      }

      // Initialize web3 and services
      console.log("🔗 Initializing Web3 provider...");
      await web3Utils.initializeProvider();
      const provider = web3Utils.getProvider();

      if (!provider) {
        console.log("❌ No Web3 provider available");
        setError(
          "Web3 provider not available. Please connect your wallet to view collections."
        );
        return;
      }

      console.log("✅ Web3 provider initialized");

      // Initialize collection query service
      console.log("🔍 Initializing collection query service...");
      await collectionQueryService.initialize(provider);

      // Get all collections from blockchain
      console.log("📡 Loading collections from blockchain...");
      const blockchainCollections =
        await collectionQueryService.getAllCollections();

      console.log(
        `✅ Found ${blockchainCollections.length} collections from blockchain`
      );
      console.log("🔍 Collections data:", blockchainCollections);

      // Debug: Check if collections are valid
      const validCollections = blockchainCollections.filter(
        (c) => c && c.address && c.name
      );
      console.log(`✅ Valid collections: ${validCollections.length}`);

      setCollections(blockchainCollections);
      console.log("🔄 Collections state updated");
      console.log("🔍 State collections:", blockchainCollections.slice(0, 2)); // Show first 2 for debugging

      if (blockchainCollections.length === 0) {
        // Check if contracts are deployed
        const addresses = marketplaceHubService.getAddresses();
        const contractsDeployed = addresses.erc721Factory !== ZERO_ADDRESS;

        if (!contractsDeployed) {
          setError(
            "Marketplace contracts not deployed. Please deploy the contracts using 'zuno-marketplace-contracts' repository or switch to a network with deployed contracts."
          );
        } else {
          setError(
            "No collections found on blockchain. Try creating a collection first."
          );
        }
      }
    } catch (error) {
      console.error("❌ Error loading collections:", error);
      setError(
        `Failed to load collections from blockchain: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort collections
  const filteredAndSortedCollections = useMemo(() => {
    const filtered = collections.filter((collection) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = collection.name.toLowerCase().includes(query);
        const matchesSymbol = collection.symbol.toLowerCase().includes(query);
        const matchesDescription = collection.description
          ?.toLowerCase()
          .includes(query);

        if (!matchesName && !matchesSymbol && !matchesDescription) {
          return false;
        }
      }

      // Type/Verification filter
      if (filterBy === "verified" && !collection.verified) {
        return false;
      }
      if (filterBy === "ERC721" && collection.type !== "ERC721") {
        return false;
      }
      if (filterBy === "ERC1155" && collection.type !== "ERC1155") {
        return false;
      }

      return true;
    });

    // Sort collections
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "volume_desc":
          return (
            parseFloat(b.stats?.totalVolume || "0") -
            parseFloat(a.stats?.totalVolume || "0")
          );
        case "volume_asc":
          return (
            parseFloat(a.stats?.totalVolume || "0") -
            parseFloat(b.stats?.totalVolume || "0")
          );
        case "floor_desc":
          return (
            parseFloat(b.stats?.floorPrice || "0") -
            parseFloat(a.stats?.floorPrice || "0")
          );
        case "floor_asc":
          return (
            parseFloat(a.stats?.floorPrice || "0") -
            parseFloat(b.stats?.floorPrice || "0")
          );
        case "newest":
          return (b.createdAt || 0) - (a.createdAt || 0);
        case "oldest":
          return (a.createdAt || 0) - (b.createdAt || 0);
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    console.log("🔍 Filtered collections:", filtered);
    return filtered;
  }, [collections, searchQuery, sortBy, filterBy]);

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="text-muted-foreground">
              Discover amazing NFT collections from creators worldwide
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/collections/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <TrendingUp className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading collections from blockchain..."
              : `${filteredAndSortedCollections.length} collections found`}
            {!loading && collections.length > 0 && (
              <span className="ml-2 text-green-600">
                ✅ Live from blockchain
              </span>
            )}
          </p>

          {(searchQuery || filterBy !== "all") && (
            <div className="flex items-center gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filterBy !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Filter:{" "}
                  {filterOptions.find((f) => f.value === filterBy)?.label}
                  <button
                    onClick={() => setFilterBy("all")}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-yellow-600 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">{error}</h3>
          <Button onClick={loadCollections} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Collections Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedCollections.length > 0 ? (
        <CollectionsGrid
          collections={filteredAndSortedCollections}
          viewMode={viewMode}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              {collections.length === 0
                ? "No collections available"
                : "No collections found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {collections.length === 0
                ? "No collections have been created on this blockchain yet. Be the first to create one!"
                : "Try adjusting your search or filter criteria"}
            </p>
            {collections.length === 0 ? (
              <Button asChild>
                <Link href="/collections/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Collection
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterBy("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
