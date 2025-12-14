"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Gavel, TrendingDown, Clock, User, 
  Loader2, AlertCircle, CheckCircle, XCircle 
} from "lucide-react";
import Link from "next/link";
import { useAuction, useAuctionDetails, useDutchAuctionPrice, usePendingRefund } from "zuno-marketplace-sdk/react";
import { useAccount } from "wagmi";
import { toast } from "sonner";

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;
  
  const { address, isConnected } = useAccount();
  const { data: auction, isLoading, error, refetch } = useAuctionDetails(auctionId);
  const { data: currentPrice } = useDutchAuctionPrice(
    auction?.type === 'dutch' ? auctionId : undefined
  );
  const { data: pendingRefund } = usePendingRefund(
    auction?.type === 'english' ? auctionId : undefined,
    address
  );
  const { placeBid, buyNow, cancelAuction, settleAuction, withdrawBid } = useAuction();
  
  const hasPendingRefund = pendingRefund && parseFloat(pendingRefund) > 0;

  const [bidAmount, setBidAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isEnglish = auction?.type === 'english';
  const isSeller = auction?.seller?.toLowerCase() === address?.toLowerCase();
  const isEnded = auction ? Date.now() / 1000 > auction.endTime : false;
  const canSettle = isEnded && auction?.status === 'active';

  const timeLeft = auction ? Math.max(0, auction.endTime - Math.floor(Date.now() / 1000)) : 0;
  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);

  const minBid = auction ? parseFloat(auction.currentBid || auction.startingBid || '0') * 1.05 : 0;

  const handlePlaceBid = async () => {
    if (!bidAmount) return;
    
    const bidValue = parseFloat(bidAmount);
    if (bidValue < minBid) {
      toast.error(`Bid must be at least ${minBid.toFixed(4)} ETH (5% higher than current bid)`);
      return;
    }
    
    setIsProcessing(true);
    try {
      await placeBid.mutateAsync({ auctionId, amount: bidAmount });
      toast.success("Bid placed successfully!");
      setBidAmount("");
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to place bid";
      if (msg.includes("InsufficientBidIncrement") || msg.includes("0x955daf56")) {
        toast.error(`Bid too low! Minimum bid is ${minBid.toFixed(4)} ETH`);
      } else if (msg.includes("BidTooLow") || msg.includes("0x")) {
        toast.error("Your bid is lower than the current highest bid");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyNow = async () => {
    setIsProcessing(true);
    try {
      await buyNow.mutateAsync({ auctionId });
      toast.success("Purchase successful!");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to purchase");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await cancelAuction.mutateAsync({ auctionId });
      toast.success("Auction cancelled");
      router.push("/auctions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSettle = async () => {
    setIsProcessing(true);
    try {
      await settleAuction.mutateAsync({ auctionId });
      toast.success("Auction settled!");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to settle");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    setIsProcessing(true);
    try {
      await withdrawBid.mutateAsync({ auctionId });
      toast.success(`Withdrawn ${pendingRefund} ETH successfully!`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to withdraw");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !auction) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Auction Not Found</h1>
          <p className="text-muted-foreground mb-4">This auction does not exist or has been removed.</p>
          <Button asChild><Link href="/auctions">Back to Auctions</Link></Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/auctions" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Auctions
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NFT Preview */}
          <Card>
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-8xl font-bold text-primary/30">#{auction.tokenId}</span>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={isEnglish ? "default" : "secondary"}>
                  {isEnglish ? <Gavel className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {isEnglish ? 'English Auction' : 'Dutch Auction'}
                </Badge>
                <Badge variant={
                  auction.status === 'active' ? 'outline' : 
                  auction.status === 'ended' ? 'secondary' : 'destructive'
                }>
                  {auction.status === 'active' && <Clock className="h-3 w-3 mr-1" />}
                  {auction.status === 'ended' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {auction.status === 'cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                  {auction.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                Collection: {auction.collectionAddress}
              </p>
            </CardContent>
          </Card>

          {/* Auction Info & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Time */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Remaining
                  </span>
                  <span className="font-semibold">
                    {timeLeft > 0 ? `${days}d ${hours}h ${minutes}m` : 'Ended'}
                  </span>
                </div>

                <Separator />

                {/* Price Info */}
                {isEnglish ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Starting Bid</span>
                      <span>{auction.startPrice} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Bid</span>
                      <span className="text-xl font-bold text-primary">
                        {auction.currentBid || auction.startPrice} ETH
                      </span>
                    </div>
                    {auction.reservePrice && auction.reservePrice !== '0' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reserve Price</span>
                        <span>{auction.reservePrice} ETH</span>
                      </div>
                    )}
                    {auction.highestBidder && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Highest Bidder</span>
                        <span className="font-mono text-sm">
                          {auction.highestBidder.slice(0, 8)}...{auction.highestBidder.slice(-6)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Price</span>
                      <span>{auction.startPrice} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Price</span>
                      <span>{auction.endPrice} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Price</span>
                      <span className="text-xl font-bold text-primary">
                        {currentPrice || auction.startPrice} ETH
                      </span>
                    </div>
                  </>
                )}

                <Separator />

                {/* Seller */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Seller
                  </span>
                  <span className="font-mono text-sm">
                    {auction.seller?.slice(0, 8)}...{auction.seller?.slice(-6)}
                    {isSeller && <Badge variant="outline" className="ml-2">You</Badge>}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {auction.status === 'active' && !isEnded && (
              <Card>
                <CardHeader>
                  <CardTitle>{isEnglish ? 'Place a Bid' : 'Buy Now'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEnglish ? (
                    <>
                      <div className="space-y-2">
                        <Label>Your Bid (ETH)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min={minBid}
                          placeholder={`Min: ${minBid.toFixed(4)} ETH`}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          disabled={!isConnected || isSeller}
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum bid: {minBid.toFixed(4)} ETH (5% higher than current)
                        </p>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={handlePlaceBid}
                        disabled={!isConnected || isSeller || isProcessing || !bidAmount}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gavel className="h-4 w-4 mr-2" />}
                        Place Bid
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleBuyNow}
                      disabled={!isConnected || isSeller || isProcessing}
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Buy Now for {currentPrice || auction.startPrice} ETH
                    </Button>
                  )}

                  {isSeller && (
                    <Button variant="destructive" className="w-full" onClick={handleCancel} disabled={isProcessing}>
                      Cancel Auction
                    </Button>
                  )}

                  {!isConnected && (
                    <p className="text-sm text-center text-muted-foreground">
                      Connect wallet to participate
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Settle / Withdraw */}
            {canSettle && (
              <Card>
                <CardContent className="pt-6">
                  <Button className="w-full" onClick={handleSettle} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Settle Auction
                  </Button>
                </CardContent>
              </Card>
            )}

            {isEnglish && isConnected && !isSeller && hasPendingRefund && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    You have {pendingRefund} ETH to withdraw from a previous bid
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleWithdraw} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Withdraw {pendingRefund} ETH
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
