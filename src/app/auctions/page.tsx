"use client";

// Force dynamic rendering to avoid SSR issues with wagmi/query
export const dynamic = "force-dynamic";

import { useState } from "react";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gavel,
  Plus,
  Clock,
  TrendingDown,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  useActiveAuctions,
  useAuctionsBySeller,
} from "@/hooks/useAuctionQueries";
import { useWallet } from "zuno-marketplace-sdk/react";
import { ClientOnly } from "@/components/common/ClientOnly";

function AuctionCard({
  auction,
}: {
  auction: {
    id: string;
    type: string;
    collectionAddress: string;
    tokenId: string;
    currentBid?: string;
    startPrice?: string;
    endPrice?: string;
    endTime: number;
    status: string;
  };
}) {
  const isEnglish = auction.type === "english";
  const timeLeft = Math.max(0, auction.endTime - Math.floor(Date.now() / 1000));
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);

  return (
    <Link href={`/auctions/${auction.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
          <span className="text-4xl font-bold text-primary/30">
            #{auction.tokenId}
          </span>
          <Badge
            variant={isEnglish ? "default" : "secondary"}
            className="absolute top-2 right-2"
          >
            {isEnglish ? (
              <Gavel className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {isEnglish ? "English" : "Dutch"}
          </Badge>
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-mono mb-2">
            {auction.collectionAddress.slice(0, 10)}...
            {auction.collectionAddress.slice(-8)}
          </p>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              {isEnglish ? "Current Bid" : "Current Price"}
            </span>
            <span className="font-semibold">
              {auction.currentBid || auction.startPrice || "0"} ETH
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeLeft > 0 ? `${hours}h ${minutes}m left` : "Ended"}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Inner component with Web3 hooks - only renders on client-side
 */
function AuctionsContent() {
  const { address } = useWallet();
  const [tab, setTab] = useState("all");

  const {
    data: activeAuctions,
    isLoading: loadingActive,
    refetch: refetchActive,
  } = useActiveAuctions(1, 50);
  const {
    data: myAuctions,
    isLoading: loadingMy,
    refetch: refetchMy,
  } = useAuctionsBySeller(address, 1, 50);

  const auctions = tab === "all" ? activeAuctions?.items : myAuctions?.items;
  const isLoading = tab === "all" ? loadingActive : loadingMy;
  const refetch = tab === "all" ? refetchActive : refetchMy;

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Gavel className="h-8 w-8" />
            NFT Auctions
          </h1>
          <p className="text-muted-foreground">
            Bid on English auctions or grab Dutch auction deals
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/auctions/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Auction
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Auctions</TabsTrigger>
          <TabsTrigger value="my">My Auctions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loadingActive ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : auctions && auctions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gavel className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">
                No active auctions
              </p>
              <Button asChild>
                <Link href="/auctions/create">Create First Auction</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          {!address ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Connect wallet to view your auctions
              </p>
            </div>
          ) : loadingMy ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : myAuctions && myAuctions.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {myAuctions.items.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                You have no auctions
              </p>
              <Button asChild>
                <Link href="/auctions/create">Create Auction</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AuctionsPage() {
  return (
    <MainLayout>
      <ClientOnly
        fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}
      >
        <AuctionsContent />
      </ClientOnly>
    </MainLayout>
  );
}
