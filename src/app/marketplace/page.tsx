"use client";

import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Store, 
  RefreshCw, 
  Loader2, 
  Clock,
  ShoppingCart,
  Search
} from "lucide-react";
import { useCollectionInfo, useExchange, useCreatedCollections, useZuno } from "zuno-marketplace-sdk/react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import Link from "next/link";

interface Listing {
  id: string;
  collectionAddress: string;
  tokenId: string;
  price: string;
  seller: string;
  endTime: number;
  status: string;
}

interface ListingCardProps {
  listing: {
    id: string;
    collectionAddress: string;
    tokenId: string;
    price: string;
    seller: string;
    endTime: number;
    status: string;
  };
  onBuy: (listingId: string, price: string) => void;
  isBuying: boolean;
  currentUser?: string;
}

function ListingCard({ listing, onBuy, isBuying, currentUser }: ListingCardProps) {
  const { data: info } = useCollectionInfo(listing.collectionAddress);
  const timeLeft = Math.max(0, listing.endTime - Math.floor(Date.now() / 1000));
  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const isSeller = currentUser?.toLowerCase() === listing.seller.toLowerCase();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="text-xs bg-background">
            {listing.price} ETH
          </Badge>
        </div>
        <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary/30">#{listing.tokenId}</span>
        </div>
      </div>
      <CardContent className="p-4">
        <Link href={`/collections/${listing.collectionAddress}`}>
          <p className="text-sm font-medium truncate mb-1 hover:underline">
            {info?.name || 'Loading...'}
          </p>
        </Link>
        <p className="text-xs text-muted-foreground font-mono truncate mb-3">
          {listing.collectionAddress.slice(0, 8)}...{listing.collectionAddress.slice(-6)}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeLeft > 0 ? (days > 0 ? `${days}d ${hours}h` : `${hours}h left`) : 'Expired'}
          </span>
          <span className="truncate max-w-[80px]" title={listing.seller}>
            {listing.seller.slice(0, 6)}...
          </span>
        </div>
        {isSeller ? (
          <Button variant="outline" className="w-full" disabled>
            Your Listing
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={() => onBuy(listing.id, listing.price)}
            disabled={isBuying || timeLeft <= 0}
          >
            {isBuying ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Buying...</>
            ) : (
              <><ShoppingCart className="h-4 w-4 mr-2" />Buy for {listing.price} ETH</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function MarketplacePage() {
  const { address, isConnected } = useAccount();
  const sdk = useZuno();
  const [searchFilter, setSearchFilter] = useState("");
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: collections, refetch: refetchCollections } = useCreatedCollections();
  const { buyNFT } = useExchange();

  // Fetch listings from all collections
  useEffect(() => {
    if (!collections || collections.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchAllListings = async () => {
      setIsLoading(true);
      const listings: Listing[] = [];

      for (const col of collections) {
        try {
          const colListings = await sdk.exchange.getListings(col.address);
          listings.push(...colListings);
        } catch {
          // Skip collections with no listings or errors
        }
      }

      setAllListings(listings);
      setIsLoading(false);
    };

    fetchAllListings();
  }, [collections, sdk]);

  const handleRefresh = async () => {
    refetchCollections();
  };

  const handleBuy = async (listingId: string, price: string) => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    setBuyingId(listingId);
    try {
      const { ethers } = await import('ethers');
      await buyNFT.mutateAsync({ 
        listingId, 
        value: ethers.parseEther(price).toString()
      });
      toast.success("NFT purchased successfully!");
      handleRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to purchase NFT");
    } finally {
      setBuyingId(null);
    }
  };

  // Filter active listings and apply search
  const activeListings = useMemo(() => {
    let filtered = allListings.filter(l => l.status === 'active');
    
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      filtered = filtered.filter(l => 
        l.collectionAddress.toLowerCase().includes(search) ||
        l.tokenId.includes(search) ||
        l.seller.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [allListings, searchFilter]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Store className="h-8 w-8" />
            Marketplace
          </h1>
          <p className="text-muted-foreground">Browse and buy NFTs listed for sale</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by collection, token ID, or seller..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 font-mono text-sm"
            />
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="text-sm text-muted-foreground mb-4">
          {isLoading ? 'Loading listings...' : `${activeListings.length} active listing${activeListings.length !== 1 ? 's' : ''}`}
          {collections && ` from ${collections.length} collection${collections.length !== 1 ? 's' : ''}`}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}

        {/* Listings */}
        {!isLoading && activeListings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activeListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onBuy={handleBuy}
                isBuying={buyingId === listing.id}
                currentUser={address}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && activeListings.length === 0 && (
          <div className="text-center py-12">
            <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">No listings found</p>
            <p className="text-sm text-muted-foreground">
              {searchFilter 
                ? 'No listings match your search criteria.'
                : 'No NFTs are currently listed for sale. List yours from the Profile page!'}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
