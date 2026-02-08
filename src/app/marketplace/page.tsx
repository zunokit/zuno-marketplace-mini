"use client";

// Force dynamic rendering to avoid SSR issues with wagmi/query
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store,
  RefreshCw,
  Loader2,
  Clock,
  ShoppingCart,
  Search,
  XCircle
} from "lucide-react";
import { useCollectionInfo, useExchange, useCreatedCollections, useZuno, useWallet } from "zuno-marketplace-sdk/react";
import { toast } from "sonner";
import Link from "next/link";
import { handleSdkError } from "@/lib/utils/error-handler";
import { useMarketplaceListings } from "@/hooks/useMarketplaceListings";
import type { Listing } from "@/hooks/useMarketplaceListings";

const SECONDS_PER_DAY = 86400;
const SECONDS_PER_HOUR = 3600;

function formatTimeRemaining(endTime: number): string {
  const timeLeft = Math.max(0, endTime - Math.floor(Date.now() / 1000));
  if (timeLeft === 0) return 'Expired';

  const days = Math.floor(timeLeft / SECONDS_PER_DAY);
  const hours = Math.floor((timeLeft % SECONDS_PER_DAY) / SECONDS_PER_HOUR);

  return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
}

function getTimeRemainingSeconds(endTime: number): number {
  return Math.max(0, endTime - Math.floor(Date.now() / 1000));
}

interface ListingCardProps {
  listing: Listing;
  onBuy: (listingId: string, price: string) => void;
  isBuying: boolean;
  currentUser?: string;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  selectionMode?: boolean;
}

function ListingCard({ listing, onBuy, isBuying, currentUser, isSelected, onSelect, selectionMode }: ListingCardProps) {
  const { data: info } = useCollectionInfo(listing.collectionAddress);
  const timeLeftSeconds = getTimeRemainingSeconds(listing.endTime);
  const isSeller = currentUser?.toLowerCase() === listing.seller.toLowerCase();
  const canSelect = !isSeller && timeLeftSeconds > 0;

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="relative">
        {selectionMode && canSelect && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox 
              checked={isSelected} 
              onCheckedChange={(checked) => onSelect?.(!!checked)}
              className="bg-background"
            />
          </div>
        )}
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="text-xs bg-background">
            {listing.price} ETH
          </Badge>
        </div>
        <div 
          className={`h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ${selectionMode && canSelect ? 'cursor-pointer' : ''}`}
          onClick={() => selectionMode && canSelect && onSelect?.(!isSelected)}
        >
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
            {formatTimeRemaining(listing.endTime)}
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
            disabled={isBuying || timeLeftSeconds <= 0}
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
  const { address, isConnected } = useWallet();
  const sdk = useZuno();
  const [searchFilter, setSearchFilter] = useState("");
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [isBatchBuying, setIsBatchBuying] = useState(false);

  const { data: collections } = useCreatedCollections();
  const { buyNFT, batchBuyNFT } = useExchange();

  const collectionAddresses = collections?.map(c => c.address) ?? [];
  const { data: allListings = [], isLoading, refetch: refetchListings } = useMarketplaceListings(collectionAddresses);

  const handleBuy = async (listingId: string, _price: string) => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    setBuyingId(listingId);
    try {
      const totalPrice = await sdk.exchange.getBuyerPrice(listingId);
      await buyNFT.mutateAsync({ listingId, value: totalPrice });
      toast.success("NFT purchased successfully!");
    } catch (err) {
      handleSdkError(err, "Failed to purchase NFT");
    } finally {
      setBuyingId(null);
    }
  };

  const handleSelectListing = (listingId: string, selected: boolean) => {
    setSelectedListings(prev => {
      const updated = new Set(prev);
      selected ? updated.add(listingId) : updated.delete(listingId);
      return updated;
    });
  };

  const handleBatchBuy = async () => {
    if (!isConnected || selectedListings.size === 0) return;

    setIsBatchBuying(true);
    try {
      const listingIds = Array.from(selectedListings);
      const { ethers } = await import('ethers');

      let totalValue = 0n;
      for (const id of listingIds) {
        const price = await sdk.exchange.getBuyerPrice(id);
        totalValue += ethers.parseEther(price);
      }

      await batchBuyNFT.mutateAsync({
        listingIds,
        value: ethers.formatEther(totalValue)
      });

      toast.success(`Successfully purchased ${listingIds.length} NFTs!`);
      setSelectedListings(new Set());
    } catch (err) {
      handleSdkError(err, "Failed to batch buy NFTs");
    } finally {
      setIsBatchBuying(false);
    }
  };

  const handleRefresh = () => refetchListings();

  const selectedTotalPrice = useMemo(() => {
    return Array.from(selectedListings).reduce((sum, id) => {
      const listing = allListings.find(l => l.id === id);
      return sum + (listing ? parseFloat(listing.price) : 0);
    }, 0);
  }, [selectedListings, allListings]);

  const selectionMode = selectedListings.size > 0;

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Store className="h-8 w-8" />
            Marketplace
          </h1>
          <p className="text-muted-foreground">Browse and buy NFTs listed for sale</p>
        </div>

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

        <div className="text-sm text-muted-foreground mb-4">
          {isLoading ? 'Loading listings...' : `${activeListings.length} active listing${activeListings.length !== 1 ? 's' : ''}`}
          {collections && ` from ${collections.length} collection${collections.length !== 1 ? 's' : ''}`}
          {!isLoading && activeListings.length > 0 && (
            <span className="ml-2 text-xs">(Click cards to select for batch buy)</span>
          )}
        </div>

        {selectionMode && (
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border border-primary/50 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-primary">{selectedListings.size} NFT(s) selected</p>
              <p className="text-sm text-muted-foreground">~{selectedTotalPrice.toFixed(4)} ETH (+ fees)</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedListings(new Set())}>
                <XCircle className="h-4 w-4 mr-2" />Clear
              </Button>
              <Button size="sm" onClick={handleBatchBuy} disabled={isBatchBuying}>
                {isBatchBuying ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Buying...</>
                ) : (
                  <><ShoppingCart className="h-4 w-4 mr-2" />Buy {selectedListings.size} NFTs (1 tx)</>
                )}
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}

        {!isLoading && activeListings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activeListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onBuy={handleBuy}
                isBuying={buyingId === listing.id}
                currentUser={address}
                isSelected={selectedListings.has(listing.id)}
                onSelect={(selected) => handleSelectListing(listing.id, selected)}
                selectionMode={true}
              />
            ))}
          </div>
        )}

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
