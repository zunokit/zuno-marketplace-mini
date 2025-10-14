"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { 
  exchangeService,
  nftMetadataService,
  listingHistoryTrackerService,
  type Listing 
} from "@/lib/services/contracts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Filter, Grid, List, Search, ShoppingCart, Gavel, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatEther } from "ethers";

interface NFTListingWithMetadata extends Listing {
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
  };
  collectionName?: string;
  floorPrice?: bigint;
}

interface Filters {
  priceRange: [number, number];
  sortBy: "price_asc" | "price_desc" | "newest" | "ending_soon";
  tokenType: "all" | "ERC721" | "ERC1155";
  status: "active" | "all";
  searchQuery: string;
  collection?: string;
}

export default function MarketplacePage() {
  const { account: address, isConnected } = useWallet();
  const [listings, setListings] = useState<NFTListingWithMetadata[]>([]);
  const [filteredListings, setFilteredListings] = useState<NFTListingWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"listings" | "auctions" | "bundles">("listings");
  
  const [filters, setFilters] = useState<Filters>({
    priceRange: [0, 100],
    sortBy: "newest",
    tokenType: "all",
    status: "active",
    searchQuery: "",
    collection: undefined
  });

  // Fetch listings on component mount
  useEffect(() => {
    fetchListings();
  }, []);

  // Apply filters when listings or filters change
  useEffect(() => {
    applyFilters();
  }, [listings, filters]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      logger.info("Fetching marketplace listings from blockchain", null, {
        component: "MarketplacePage",
        action: "fetchListings"
      });

      // Fetch listings from both ERC721 and ERC1155 exchanges
      const [erc721Listings, erc1155Listings] = await Promise.all([
        exchangeService.getAllActiveListings("ERC721", 50, 0),
        exchangeService.getAllActiveListings("ERC1155", 50, 0)
      ]);

      const allListings = [...erc721Listings, ...erc1155Listings];
      
      // Fetch metadata for all listings in parallel
      const listingsWithMetadata: NFTListingWithMetadata[] = await Promise.all(
        allListings.map(async (listing) => {
          try {
            // Fetch NFT metadata
            const metadata = await nftMetadataService.getNFTMetadata(
              listing.contractAddress,
              listing.tokenId.toString()
            );
            
            // Fetch collection metadata
            const collectionMeta = await nftMetadataService.getCollectionMetadata(
              listing.contractAddress
            );
            
            // Get collection stats if available
            let floorPrice: bigint | undefined;
            try {
              const stats = await listingHistoryTrackerService.getCollectionStats(
                listing.contractAddress
              );
              floorPrice = stats?.floorPrice;
            } catch {
              // Stats might not be available
            }
            
            return {
              ...listing,
              metadata: metadata ? {
                name: metadata.name,
                description: metadata.description,
                image: metadata.image,
                attributes: metadata.attributes
              } : undefined,
              collectionName: collectionMeta?.name,
              floorPrice
            };
          } catch (error) {
            logger.warn("Failed to fetch metadata for listing", error, {
              component: "MarketplacePage",
              action: "fetchListings",
              listingId: listing.listingId
            });
            
            return listing as NFTListingWithMetadata;
          }
        })
      );

      setListings(listingsWithMetadata);
      logger.success(`Fetched ${listingsWithMetadata.length} listings from blockchain`, null, {
        component: "MarketplacePage",
        action: "fetchListings"
      });
    } catch (error) {
      logger.error("Failed to fetch listings", error, {
        component: "MarketplacePage",
        action: "fetchListings"
      });
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Filter by search query
    if (filters.searchQuery) {
      filtered = filtered.filter(listing => 
        listing.metadata?.name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        listing.metadata?.description?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Filter by token type
    if (filters.tokenType !== "all") {
      filtered = filtered.filter(listing => listing.tokenType === filters.tokenType);
    }

    // Filter by status
    if (filters.status === "active") {
      filtered = filtered.filter(listing => listing.isActive);
    }

    // Filter by price range
    filtered = filtered.filter(listing => {
      const priceInEth = parseFloat(formatEther(listing.price));
      return priceInEth >= filters.priceRange[0] && priceInEth <= filters.priceRange[1];
    });

    // Sort listings
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "price_asc":
          return Number(a.price - b.price);
        case "price_desc":
          return Number(b.price - a.price);
        case "ending_soon":
          return Number(a.expirationTime - b.expirationTime);
        case "newest":
        default:
          return Number(b.expirationTime - a.expirationTime);
      }
    });

    setFilteredListings(filtered);
  };

  const handleBuyNFT = async (listing: NFTListingWithMetadata) => {
    try {
      logger.info("Initiating NFT purchase", { listingId: listing.listingId }, {
        component: "MarketplacePage",
        action: "handleBuyNFT"
      });

      // Buy NFT through exchange contract
      const tx = await exchangeService.buyListing(
        listing.contractAddress, 
        listing.tokenId.toString(),
        listing.amount?.toString() || "1",
        listing.tokenType || "ERC721"
      );
      
      logger.success("NFT purchased successfully", { tx }, {
        component: "MarketplacePage",
        action: "handleBuyNFT"
      });

      // Refresh listings
      await fetchListings();
    } catch (error) {
      logger.error("Failed to buy NFT", error, {
        component: "MarketplacePage",
        action: "handleBuyNFT"
      });
    }
  };

  const ListingCard = ({ listing }: { listing: NFTListingWithMetadata }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative aspect-square bg-gray-100">
          {listing.metadata?.image ? (
            <Image
              src={listing.metadata.image}
              alt={listing.metadata.name || "NFT"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
          <Badge className="absolute top-2 right-2">
            {listing.tokenType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2">
          {listing.metadata?.name || `Token #${listing.tokenId.toString()}`}
        </CardTitle>
        {listing.collectionName && (
          <p className="text-xs text-gray-500 mb-1">{listing.collectionName}</p>
        )}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {listing.metadata?.description || "No description"}
        </p>
        {listing.amount && (
          <p className="text-sm text-gray-500 mb-2">
            Available: {listing.amount}
          </p>
        )}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">
            {formatEther(listing.price)} ETH
          </span>
          <Badge variant={listing.isActive ? "default" : "secondary"}>
            {listing.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
        <Link href={`/nft/${listing.contractAddress}/${listing.tokenId}`} className="flex-1">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
        {listing.isActive && isConnected && (
          <Button 
            onClick={() => handleBuyNFT(listing)}
            className="flex-1"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">NFT Marketplace</h1>
        
        {/* Search and View Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search NFTs..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="auctions">
              <Gavel className="w-4 h-4 mr-2" />
              Auctions
            </TabsTrigger>
            <TabsTrigger value="bundles">
              <Package className="w-4 h-4 mr-2" />
              Bundles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filters Sidebar */}
              <div className="lg:w-64 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sort By */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Sort By</label>
                      <Select 
                        value={filters.sortBy} 
                        onValueChange={(v) => setFilters({ ...filters, sortBy: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="ending_soon">Ending Soon</SelectItem>
                          <SelectItem value="price_asc">Price: Low to High</SelectItem>
                          <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Token Type */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Token Type</label>
                      <Select 
                        value={filters.tokenType} 
                        onValueChange={(v) => setFilters({ ...filters, tokenType: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="ERC721">ERC721</SelectItem>
                          <SelectItem value="ERC1155">ERC1155</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Price Range: {filters.priceRange[0]} - {filters.priceRange[1]} ETH
                      </label>
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(v) => setFilters({ ...filters, priceRange: v as [number, number] })}
                        min={0}
                        max={100}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select 
                        value={filters.status} 
                        onValueChange={(v) => setFilters({ ...filters, status: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setFilters({
                        priceRange: [0, 100],
                        sortBy: "newest",
                        tokenType: "all",
                        status: "active",
                        searchQuery: "",
                        collection: undefined
                      })}
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Listings Grid/List */}
              <div className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : filteredListings.length > 0 ? (
                  <div className={viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "space-y-4"
                  }>
                    {filteredListings.map(listing => (
                      <ListingCard key={listing.listingId} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500">No listings found matching your criteria</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="auctions" className="mt-6">
            <Card className="p-8 text-center">
              <Gavel className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Auction listings coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="bundles" className="mt-6">
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Bundle listings coming soon...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
