"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import {
  auctionService,
  nftMetadataService,
  userHubService,
  listingHistoryTrackerService
} from "@/lib/services/contracts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Gavel,
  Timer,
  TrendingDown,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Info,
  Trophy,
  Zap,
  Heart
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatEther, parseEther } from "ethers";

interface AuctionData {
  auctionId: string;
  auctionType: "ENGLISH" | "DUTCH";
  seller: string;
  nftContract: string;
  tokenId: string;
  startPrice: bigint;
  currentPrice: bigint;
  reservePrice?: bigint;
  endingPrice?: bigint; // For Dutch
  highestBidder?: string;
  highestBid?: bigint;
  startTime: bigint;
  endTime: bigint;
  status: "ACTIVE" | "ENDED" | "CANCELLED";
  totalBids?: number;
  metadata?: {
    name: string;
    description: string;
    image: string;
    collectionName?: string;
  };
}

interface BidHistory {
  bidder: string;
  amount: bigint;
  timestamp: bigint;
  txHash: string;
}

export default function AuctionsPage() {
  const { account: address, isConnected } = useWallet();
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"english" | "dutch">("english");
  const [selectedAuction, setSelectedAuction] = useState<AuctionData | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "ended">("active");

  useEffect(() => {
    fetchAuctions();
  }, [activeTab, filterStatus]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      logger.info(`Fetching ${activeTab} auctions from blockchain`, null, {
        component: "AuctionsPage",
        action: "fetchAuctions"
      });

      const auctionContract = activeTab === "english"
        ? await auctionService.getEnglishAuctionContract()
        : await auctionService.getDutchAuctionContract();

      // Get active auction IDs
      // This depends on your contract implementation
      // Using events as fallback
      const filter = auctionContract.filters.AuctionCreated();
      const events = await auctionContract.queryFilter(filter);
      
      const auctionDataPromises = events.map(async (event) => {
        try {
          const auctionId = (event as any).args?.[0];
          if (!auctionId) return null;

          // Get auction details
          const auction = await auctionContract.getAuction(auctionId);
          
          // Skip if not matching filter
          const now = BigInt(Math.floor(Date.now() / 1000));
          const isActive = auction.endTime > now && auction.status === 0;
          
          if (filterStatus === "active" && !isActive) return null;
          if (filterStatus === "ended" && isActive) return null;

          // Get NFT metadata
          const metadata = await nftMetadataService.getNFTMetadata(
            auction.nftContract,
            auction.tokenId.toString()
          );

          // Get collection metadata
          const collectionMeta = await nftMetadataService.getCollectionMetadata(
            auction.nftContract
          );

          // For English auctions, get bid count
          let totalBids = 0;
          if (activeTab === "english") {
            try {
              const bidFilter = auctionContract.filters.BidPlaced(auctionId);
              const bidEvents = await auctionContract.queryFilter(bidFilter);
              totalBids = bidEvents.length;
            } catch {}
          }

          // Calculate current price for Dutch auction
          let currentPrice = auction.currentPrice || auction.startPrice;
          if (activeTab === "dutch" && isActive) {
            try {
              currentPrice = await auctionContract.getCurrentPrice(auctionId);
            } catch {}
          }

          return {
            auctionId,
            auctionType: activeTab.toUpperCase() as "ENGLISH" | "DUTCH",
            seller: auction.seller,
            nftContract: auction.nftContract,
            tokenId: auction.tokenId.toString(),
            startPrice: auction.startPrice,
            currentPrice,
            reservePrice: auction.reservePrice,
            endingPrice: auction.endingPrice,
            highestBidder: auction.highestBidder,
            highestBid: auction.highestBid || 0n,
            startTime: auction.startTime,
            endTime: auction.endTime,
            status: isActive ? "ACTIVE" : "ENDED",
            totalBids,
            metadata: metadata ? {
              name: metadata.name,
              description: metadata.description,
              image: metadata.image,
              collectionName: collectionMeta?.name
            } : undefined
          } as AuctionData;
        } catch (error) {
          logger.warn("Failed to fetch auction data", error, {
            component: "AuctionsPage",
            action: "fetchAuctions"
          });
          return null;
        }
      });

      const auctionData = (await Promise.all(auctionDataPromises))
        .filter(a => a !== null) as AuctionData[];

      setAuctions(auctionData);
      logger.success(`Fetched ${auctionData.length} ${activeTab} auctions`, null, {
        component: "AuctionsPage",
        action: "fetchAuctions"
      });
    } catch (error) {
      logger.error("Failed to fetch auctions", error, {
        component: "AuctionsPage",
        action: "fetchAuctions"
      });
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!selectedAuction || !bidAmount || !isConnected) return;

    try {
      setBidding(true);
      const amount = parseEther(bidAmount);
      
      logger.info("Placing bid", {
        auctionId: selectedAuction.auctionId,
        amount: bidAmount
      }, {
        component: "AuctionsPage",
        action: "handlePlaceBid"
      });

      const auctionContract = await auctionService.getEnglishAuctionContract();
      
      // Check minimum bid
      const minBid = (selectedAuction.highestBid || 0n) > 0n
        ? (selectedAuction.highestBid || 0n) + parseEther("0.01") // Min increment
        : selectedAuction.startPrice;
      
      if (amount < minBid) {
        throw new Error(`Minimum bid is ${formatEther(minBid)} ETH`);
      }

      const tx = await auctionContract.placeBid(selectedAuction.auctionId, {
        value: amount
      });

      await tx.wait();
      toast.success("Bid placed successfully!");
      setBidAmount("");
      await fetchAuctions();
      await fetchBidHistory(selectedAuction.auctionId);
    } catch (error: any) {
      logger.error("Failed to place bid", error, {
        component: "AuctionsPage",
        action: "handlePlaceBid"
      });
      toast.error(error.message || "Failed to place bid");
    } finally {
      setBidding(false);
    }
  };

  const handleBuyNow = async (auction: AuctionData) => {
    if (!isConnected) return;

    try {
      logger.info("Buying Dutch auction", {
        auctionId: auction.auctionId,
        price: formatEther(auction.currentPrice)
      }, {
        component: "AuctionsPage",
        action: "handleBuyNow"
      });

      const auctionContract = await auctionService.getDutchAuctionContract();
      const tx = await auctionContract.buyNow(auction.auctionId, {
        value: auction.currentPrice
      });

      await tx.wait();
      toast.success("NFT purchased successfully!");
      await fetchAuctions();
    } catch (error) {
      logger.error("Failed to buy Dutch auction", error, {
        component: "AuctionsPage",
        action: "handleBuyNow"
      });
      toast.error("Failed to purchase NFT");
    }
  };

  const fetchBidHistory = async (auctionId: string) => {
    try {
      const auctionContract = await auctionService.getEnglishAuctionContract();
      const filter = auctionContract.filters.BidPlaced(auctionId);
      const events = await auctionContract.queryFilter(filter);
      
      const history: BidHistory[] = events.map(event => ({
        bidder: (event as any).args?.[1] || "",
        amount: (event as any).args?.[2] || 0n,
        timestamp: BigInt(event.blockNumber),
        txHash: event.transactionHash
      }));

      setBidHistory(history.reverse());
    } catch (error) {
      logger.error("Failed to fetch bid history", error, {
        component: "AuctionsPage",
        action: "fetchBidHistory"
      });
      setBidHistory([]);
    }
  };

  const calculateTimeLeft = (endTime: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const diff = Number(endTime - now);
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const calculatePriceDecay = (auction: AuctionData) => {
    if (auction.auctionType !== "DUTCH") return 0;
    
    const elapsed = Number(BigInt(Math.floor(Date.now() / 1000)) - auction.startTime);
    const duration = Number(auction.endTime - auction.startTime);
    return Math.min((elapsed / duration) * 100, 100);
  };

  const AuctionCard = ({ auction }: { auction: AuctionData }) => {
    const isEnglish = auction.auctionType === "ENGLISH";
    const timeLeft = calculateTimeLeft(auction.endTime);
    const priceDecay = calculatePriceDecay(auction);

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square bg-gray-100">
          {auction.metadata?.image ? (
            <img
              src={auction.metadata.image}
              alt={auction.metadata.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gavel className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-2">
            <Badge variant={isEnglish ? "default" : "secondary"}>
              {isEnglish ? "English" : "Dutch"}
            </Badge>
            {auction.status === "ACTIVE" ? (
              <Badge variant="default" className="bg-green-500">
                <Timer className="w-3 h-3 mr-1" />
                {timeLeft}
              </Badge>
            ) : (
              <Badge variant="secondary">Ended</Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1">
            {auction.metadata?.name || `Token #${auction.tokenId}`}
          </h3>
          {auction.metadata?.collectionName && (
            <p className="text-sm text-gray-500 mb-3">{auction.metadata.collectionName}</p>
          )}

          {isEnglish ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Current Bid</span>
                <span className="font-bold text-lg">
                  {(auction.highestBid || 0n) > 0n 
                    ? formatEther(auction.highestBid || 0n) 
                    : formatEther(auction.startPrice)} ETH
                </span>
              </div>
              {auction.totalBids !== undefined && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Total Bids</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {auction.totalBids}
                  </span>
                </div>
              )}
              {auction.reservePrice && auction.reservePrice > 0n && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Reserve</span>
                  {(auction.highestBid || 0n) >= auction.reservePrice ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Met
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Met</Badge>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Current Price</span>
                  <span className="font-bold text-lg">
                    {formatEther(auction.currentPrice)} ETH
                  </span>
                </div>
                <Progress value={priceDecay} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Start: {formatEther(auction.startPrice)} ETH</span>
                  <span>End: {formatEther(auction.endingPrice || 0n)} ETH</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-orange-600">
                  <TrendingDown className="w-4 h-4" />
                  Price decreasing
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 mt-4">
            {auction.status === "ACTIVE" && (
              <>
                {isEnglish ? (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setSelectedAuction(auction);
                      fetchBidHistory(auction.auctionId);
                    }}
                  >
                    <Gavel className="w-4 h-4 mr-2" />
                    Place Bid
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={() => handleBuyNow(auction)}
                    disabled={!isConnected}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Buy Now
                  </Button>
                )}
              </>
            )}
            <Link href={`/auctions/${auction.auctionId}`}>
              <Button variant="outline">View Details</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">NFT Auctions</h1>
        <p className="text-gray-600">Bid on English auctions or grab Dutch auction deals</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="english">
              <Gavel className="w-4 h-4 mr-2" />
              English Auctions
            </TabsTrigger>
            <TabsTrigger value="dutch">
              <TrendingDown className="w-4 h-4 mr-2" />
              Dutch Auctions
            </TabsTrigger>
          </TabsList>

          <select
            className="px-4 py-2 border rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Auctions</option>
            <option value="active">Active Only</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {auctions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {auctions.map(auction => (
                  <AuctionCard key={auction.auctionId} auction={auction} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Gavel className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No {activeTab} auctions found</p>
              </Card>
            )}
          </>
        )}
      </Tabs>

      {/* Bid Dialog */}
      {selectedAuction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Place Bid</CardTitle>
                  <CardDescription>
                    {selectedAuction.metadata?.name || `Token #${selectedAuction.tokenId}`}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedAuction(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Bid</p>
                  <p className="text-2xl font-bold">
                    {(selectedAuction.highestBid || 0n) > 0n
                      ? formatEther(selectedAuction.highestBid || 0n)
                      : formatEther(selectedAuction.startPrice)} ETH
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Left</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {calculateTimeLeft(selectedAuction.endTime)}
                  </p>
                </div>
              </div>

              {selectedAuction.reservePrice && selectedAuction.reservePrice > 0n && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Reserve price: {formatEther(selectedAuction.reservePrice)} ETH
                    {(selectedAuction.highestBid || 0n) >= selectedAuction.reservePrice && " (Met)"}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Your Bid (ETH)</label>
                <Input
                  type="number"
                  placeholder={`Minimum: ${formatEther(
                    (selectedAuction.highestBid || 0n) > 0n
                      ? (selectedAuction.highestBid || 0n) + parseEther("0.01")
                      : selectedAuction.startPrice
                  )} ETH`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  step="0.01"
                />
              </div>

              {bidHistory.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Bid History</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {bidHistory.map((bid, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}
                        </span>
                        <span className="font-medium">{formatEther(bid.amount)} ETH</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handlePlaceBid}
                disabled={bidding || !bidAmount || !isConnected}
              >
                {bidding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Bid...
                  </>
                ) : (
                  <>
                    <Gavel className="w-4 h-4 mr-2" />
                    Place Bid
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
