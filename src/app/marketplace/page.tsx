"use client";

import { useState } from "react";
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
import { useCollectionInfo, useExchange, useListings } from "zuno-marketplace-sdk/react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import Link from "next/link";

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
  const [collectionFilter, setCollectionFilter] = useState("");
  const [buyingId, setBuyingId] = useState<string | null>(null);
  
  // Get listings for a specific collection if filtered
  const { data: listings, isLoading, refetch } = useListings(
    collectionFilter || undefined
  );
  const { buyNFT } = useExchange();

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
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to purchase NFT");
    } finally {
      setBuyingId(null);
    }
  };

  const activeListings = listings?.filter(l => l.status === 'active') || [];

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
              placeholder="Filter by collection address..."
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="pl-10 font-mono text-sm"
            />
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Info */}
        {!collectionFilter && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              Enter a collection address to view listings. 
              Browse collections from the <Link href="/collections" className="underline">Collections</Link> page.
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && collectionFilter && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}

        {/* Listings */}
        {!isLoading && collectionFilter && activeListings.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {activeListings.length} listing{activeListings.length !== 1 ? 's' : ''} found
            </p>
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
          </>
        )}

        {/* Empty */}
        {!isLoading && collectionFilter && activeListings.length === 0 && (
          <div className="text-center py-12">
            <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">No listings found</p>
            <p className="text-sm text-muted-foreground">
              No NFTs are currently listed for sale in this collection.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
