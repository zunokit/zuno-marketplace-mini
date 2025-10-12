/**
 * Collections Page Component
 * Shows all collections with filtering and stats
 */

"use client";

import { useState, useEffect } from "react";
import { logger } from "@/lib/utils/logger";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { TokenType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Grid,
  List,
  Search,
  Filter,
  Plus,
  Package,
  Users,
  TrendingUp,
  Sparkles,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  collectionQueryService,
  CollectionData,
} from "@/lib/services/contracts/CollectionQueryService";

interface CollectionDisplayData {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  tokenType: TokenType;
  stats: {
    totalSupply: number;
    totalMinted: number;
    floorPrice: string;
    volume24h: string;
    owners: number;
  };
}

interface CollectionCardProps {
  collection: CollectionDisplayData;
  view: "grid" | "list";
}

function CollectionCard({ collection, view }: CollectionCardProps) {
  const router = useRouter();

  if (view === "list") {
    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => router.push(`/collections/${collection.address}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Image */}
            <div className="relative w-20 h-20 flex-shrink-0">
              {collection.image ? (
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <Badge className="absolute -bottom-1 -right-1 text-xs">
                {collection.tokenType}
              </Badge>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {collection.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {collection.description}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Floor</p>
                <p className="font-medium">{collection.stats.floorPrice} ETH</p>
              </div>
              <div>
                <p className="text-muted-foreground">24h Volume</p>
                <p className="font-medium">{collection.stats.volume24h} ETH</p>
              </div>
              <div>
                <p className="text-muted-foreground">Owners</p>
                <p className="font-medium">
                  {collection.stats.owners.toLocaleString()}
                </p>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/collections/${collection.address}`)}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-square">
          {collection.image ? (
            <img
              src={collection.image}
              alt={collection.name}
              className="w-full h-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-t-lg flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute top-2 right-2">
            {collection.tokenType}
          </Badge>
          {collection.stats.totalMinted === collection.stats.totalSupply && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              Sold Out
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">{collection.name}</h3>
        <p className="text-sm text-muted-foreground truncate mb-4">
          {collection.description}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Floor Price</span>
            <span className="font-medium">
              {collection.stats.floorPrice} ETH
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Supply</span>
            <span className="font-medium">
              {collection.stats.totalMinted.toLocaleString()} /{" "}
              {collection.stats.totalSupply.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">24h Volume</span>
            <span className="font-medium">
              {collection.stats.volume24h} ETH
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionDisplayData[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<
    CollectionDisplayData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [tokenTypeFilter, setTokenTypeFilter] = useState<"all" | TokenType>(
    "all"
  );
  const [sortBy, setSortBy] = useState("volume");

  // Filter and sort collections
  useEffect(() => {
    let filtered = [...collections];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by token type
    if (tokenTypeFilter !== "all") {
      filtered = filtered.filter((c) => c.tokenType === tokenTypeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "volume":
          return parseFloat(b.stats.volume24h) - parseFloat(a.stats.volume24h);
        case "floor":
          return (
            parseFloat(b.stats.floorPrice) - parseFloat(a.stats.floorPrice)
          );
        case "minted":
          return b.stats.totalMinted - a.stats.totalMinted;
        case "owners":
          return b.stats.owners - a.stats.owners;
        default:
          return 0;
      }
    });

    setFilteredCollections(filtered);
  }, [collections, searchTerm, tokenTypeFilter, sortBy]);

  // Load collections from blockchain
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const fetchedCollections =
        await collectionQueryService.getAllCollections();

      // Transform to CollectionDisplayData format
      const formattedCollections: CollectionDisplayData[] =
        fetchedCollections.map((col) => ({
          address: col.address,
          name: col.name || "Unnamed Collection",
          symbol: col.symbol || "",
          description: col.description || "",
          image: "", // Collections don't have images in the contract
          tokenType:
            col.type === "ERC721" ? TokenType.ERC721 : TokenType.ERC1155,
          stats: {
            totalSupply: Number(col.maxSupply || 0),
            totalMinted: Number(col.totalSupply || 0),
            floorPrice: col.stats.floorPrice,
            volume24h: col.stats.totalVolume,
            owners: col.stats.totalOwners,
          },
        }));

      setCollections(formattedCollections);
    } catch (error) {
      logger.error("Failed to load collections", error, {
        component: "CollectionsPage",
        action: "loadCollections",
      });
      toast.error("Failed to load collections");
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collections</h1>
          <p className="text-muted-foreground mt-1">
            Explore all NFT collections on the marketplace
          </p>
        </div>
        <Button onClick={() => router.push("/collections/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Collection
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collections.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Volume (24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collections
                .reduce((sum, c) => sum + parseFloat(c.stats.volume24h), 0)
                .toFixed(1)}{" "}
              ETH
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Owners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collections
                .reduce((sum, c) => sum + c.stats.owners, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total NFTs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collections
                .reduce((sum, c) => sum + c.stats.totalMinted, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={tokenTypeFilter}
          onValueChange={(value: any) => setTokenTypeFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Token Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={TokenType.ERC721}>ERC721</SelectItem>
            <SelectItem value={TokenType.ERC1155}>ERC1155</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="volume">24h Volume</SelectItem>
            <SelectItem value="floor">Floor Price</SelectItem>
            <SelectItem value="minted">Total Minted</SelectItem>
            <SelectItem value="owners">Owners</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collections Grid/List */}
      {isLoading ? (
        <div
          className={
            view === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          }
        >
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="p-0">
                <Skeleton className="aspect-square rounded-t-lg" />
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCollections.length > 0 ? (
        <div
          className={
            view === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          }
        >
          {filteredCollections.map((collection) => (
            <CollectionCard
              key={collection.address}
              collection={collection}
              view={view}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No collections found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
