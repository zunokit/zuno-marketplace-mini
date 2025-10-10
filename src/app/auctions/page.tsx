'use client';

/**
 * Auctions Page
 * Migrated from frontend-foundry/src/components/Auction.jsx
 * Supports English Auction (price increases) & Dutch Auction (price decreases)
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppSelector } from '@/lib/store/hooks';
import { useToast } from '@/hooks/use-toast';
import { auctionService } from '@/lib/services/contracts/AuctionService';
import { ethers } from 'ethers';
import {
  AlertCircle,
  Loader2,
  Clock,
  TrendingUp,
  TrendingDown,
  Gavel,
  Timer,
  RefreshCw
} from 'lucide-react';

// Define types locally since we removed mock service
enum AuctionType {
  ENGLISH = 0,
  DUTCH = 1
}

enum AuctionStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
  SETTLED = 'SETTLED',
  INACTIVE = 'INACTIVE'
}

interface Auction {
  id: string;
  type: AuctionType;
  status: AuctionStatus;
  nftContract: string;
  tokenId: string;
  seller: string;
  nftName: string;
  nftImage: string;
  collectionName: string;
  startPrice: string;
  currentPrice: string;
  reservePrice: string;
  priceDropPerHour?: string;
  startTime: number;
  endTime: number;
  highestBid?: string;
  highestBidder?: string;
  totalBids: number;
  amount: bigint;
}

export default function AuctionsPage() {
  const { toast } = useToast();

  // Redux state
  const { account, isConnected } = useAppSelector((state) => state.wallet);

  // Local state
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const [userAuctions, setUserAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Map on-chain AuctionInfo to UI Auction shape
  const mapAuctionInfoToAuction = (
    info: import('@/lib/services/contracts/AuctionService').AuctionInfo
  ): Auction => {
    const toEthString = (value: bigint) => {
      try {
        return ethers.formatEther(value);
      } catch {
        return '0';
      }
    };

    // Map status codes: on-chain 0=Active,1=Ended,2=Cancelled → UI enum
    const statusCode = Number(info.status);
    const status =
      statusCode === 0
        ? AuctionStatus.ACTIVE
        : statusCode === 1
        ? AuctionStatus.ENDED
        : statusCode === 2
        ? AuctionStatus.CANCELLED
        : AuctionStatus.INACTIVE;

    const type =
      Number(info.auctionType) === 0 ? AuctionType.ENGLISH : AuctionType.DUTCH;

    const endTimeMs = Number(info.endTime) * 1000;
    const startTimeMs = Number(info.startTime) * 1000;

    return {
      id: info.auctionId,
      type,
      status,
      nftContract: info.nftContract,
      tokenId: info.tokenId,
      seller: info.highestBidder || '',
      nftName: `NFT #${info.tokenId}`,
      nftImage: `https://picsum.photos/seed/${info.tokenId}/400/400`,
      collectionName: 'Collection',
      startPrice: toEthString(info.startPrice),
      currentPrice: toEthString(info.currentPrice),
      reservePrice: toEthString(info.reservePrice),
      priceDropPerHour: undefined,
      startTime: startTimeMs,
      endTime: endTimeMs,
      highestBid: info.highestBid ? toEthString(info.highestBid) : undefined,
      highestBidder: info.highestBidder || undefined,
      totalBids: 0,
      amount: info.amount
    };
  };

  /**
   * Load auctions and subscribe to events
   */
  useEffect(() => {
    if (account) {
      loadAuctions();
    }
  }, [account, refreshKey]);

  /**
   * Auto-refresh every 30 seconds
   */
  useEffect(() => {
    if (!account) return;

    const interval = setInterval(() => {
      loadAuctions();
    }, 30000);

    return () => clearInterval(interval);
  }, [account]);

  /**
   * Load auctions from mock service or blockchain
   */
  const loadAuctions = async () => {
    if (!account) return;

    setLoading(true);
    try {
      // Real blockchain data
      // Note: Services already initialized via initializeServices() in useWeb3
      // TODO: These methods don't exist in current AuctionService
      // Need to implement or remove this functionality
      console.warn('Real auction data not yet implemented');
      setActiveAuctions([]);
      setUserAuctions([]);
    } catch (error) {
      console.error('Error loading auctions:', error);
      toast({
        title: 'Error Loading Auctions',
        description:
          error instanceof Error ? error.message : 'Failed to load auctions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  /**
   * Format time remaining
   */
  const formatTimeRemaining = (endTime: number): string => {
    const now = Date.now();
    const remaining = endTime - now;

    if (remaining <= 0) return 'Ended';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  /**
   * Get auction type badge
   */
  const getAuctionTypeBadge = (type: AuctionType) => {
    if (type === AuctionType.ENGLISH) {
      return (
        <Badge variant="default" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          English
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        Dutch
      </Badge>
    );
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status: AuctionStatus) => {
    switch (status) {
      case AuctionStatus.ACTIVE:
        return <Badge variant="default">Active</Badge>;
      case AuctionStatus.ENDED:
        return <Badge variant="secondary">Ended</Badge>;
      case AuctionStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      case AuctionStatus.SETTLED:
        return <Badge variant="outline">Settled</Badge>;
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  /**
   * Handle place bid (English auction)
   */
  const handlePlaceBid = async (auctionId: string, bidAmount: string) => {
    try {
      // Real contract interaction
      // Note: Service already initialized via initializeServices()
      await auctionService.placeBid(auctionId, bidAmount);
      toast({
        title: 'Bid Placed!',
        description: `Successfully placed bid of ${bidAmount} ETH`
      });
      handleRefresh();
    } catch (error) {
      toast({
        title: 'Bid Failed',
        description:
          error instanceof Error ? error.message : 'Failed to place bid',
        variant: 'destructive'
      });
    }
  };

  /**
   * Handle buy now (Dutch auction)
   */
  const handleBuyNow = async (auctionId: string, price: string) => {
    try {
      // Real contract interaction
      // Note: Service already initialized, buyNow renamed to buyFromDutchAuction
      await auctionService.buyFromDutchAuction(auctionId, price);
      toast({
        title: 'Purchase Successful!',
        description: `Successfully bought NFT for ${price} ETH`
      });
      handleRefresh();
    } catch (error) {
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Failed to buy',
        variant: 'destructive'
      });
    }
  };

  // Check if wallet is connected
  if (!isConnected || !account) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to access auction features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Gavel className="h-8 w-8" />
              NFT Auctions
            </h1>
            <p className="text-muted-foreground">
              Create and participate in NFT auctions
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse" className="gap-2">
            Browse Auctions
            {activeAuctions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeAuctions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-auctions" className="gap-2">
            My Auctions
            {userAuctions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {userAuctions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="create">Create Auction</TabsTrigger>
        </TabsList>

        {/* Browse Auctions */}
        <TabsContent value="browse">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeAuctions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Active Auctions</AlertTitle>
              <AlertDescription>
                There are no active auctions at the moment. Check back later or
                create your own!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAuctions.map((auction) => (
                <Card key={auction.id} className="overflow-hidden">
                  {/* NFT Image */}
                  <div className="relative w-full h-64 bg-muted">
                    <Image
                      src={auction.nftImage}
                      alt={auction.nftName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {getAuctionTypeBadge(auction.type)}
                      {getStatusBadge(auction.status)}
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg">{auction.nftName}</CardTitle>
                    <CardDescription>{auction.collectionName}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Pricing */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {auction.type === AuctionType.ENGLISH
                            ? 'Current Bid'
                            : 'Current Price'}
                        </span>
                        <span className="font-semibold">
                          {auction.currentPrice} ETH
                        </span>
                      </div>
                      {auction.type === AuctionType.ENGLISH &&
                        auction.totalBids > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Total Bids
                            </span>
                            <span>{auction.totalBids}</span>
                          </div>
                        )}
                    </div>

                    <Separator />

                    {/* Time Remaining */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Ends in {formatTimeRemaining(auction.endTime)}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter>
                    {auction.type === AuctionType.ENGLISH ? (
                      <Button
                        className="w-full"
                        onClick={() => {
                          const minBid = (
                            parseFloat(auction.currentPrice) + 0.01
                          ).toFixed(2);
                          handlePlaceBid(auction.id, minBid);
                        }}
                      >
                        Place Bid
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() =>
                          handleBuyNow(auction.id, auction.currentPrice)
                        }
                      >
                        Buy Now
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Auctions */}
        <TabsContent value="my-auctions">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userAuctions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Auctions Created</AlertTitle>
              <AlertDescription>
                You haven't created any auctions yet. Go to the Create tab to
                get started!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {userAuctions.map((auction) => (
                <Card key={auction.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={auction.nftImage}
                          alt={auction.nftName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {auction.nftName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {auction.collectionName}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {getAuctionTypeBadge(auction.type)}
                            {getStatusBadge(auction.status)}
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Start Price</p>
                            <p className="font-semibold">
                              {auction.startPrice} ETH
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Current Price
                            </p>
                            <p className="font-semibold">
                              {auction.currentPrice} ETH
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Time Left</p>
                            <p className="font-semibold">
                              {formatTimeRemaining(auction.endTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create Auction */}
        <TabsContent value="create">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Create Auction</AlertTitle>
            <AlertDescription>
              Auction creation form will be implemented next. This will allow
              you to create English or Dutch auctions for your NFTs.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
