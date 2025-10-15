"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Gavel,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Flame,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ZERO_ADDRESS } from "@/lib/constants";

export interface AuctionCardProps {
  auction: {
    id: string;
    auctionType: "ENGLISH" | "DUTCH";
    seller: string;
    tokenContract: string;
    tokenId: string;
    startPrice: string;
    currentPrice: string;
    reservePrice?: string;
    endPrice?: string; // For Dutch auction
    minBidIncrement?: string; // For English auction
    highestBidder?: string;
    currency: string;
    status: "ACTIVE" | "ENDED" | "CANCELLED";
    startTime: number;
    endTime: number;
    nft?: {
      name?: string;
      image?: string;
      collection?: {
        name?: string;
        verified?: boolean;
      };
    };
    bidCount?: number;
  };
  className?: string;
  isOwner?: boolean;
  onBid?: (amount: string) => void;
  onCancel?: () => void;
  onView?: () => void;
}

export function AuctionCard({
  auction,
  className,
  isOwner = false,
  onBid,
  onCancel,
  onView,
}: AuctionCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isEnded: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: false });

  // Countdown timer
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const end = auction.endTime;
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, isEnded: false });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [auction.endTime]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num.toFixed(4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "ENDED":
        return "bg-blue-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getAuctionTypeIcon = () => {
    if (auction.auctionType === "DUTCH") {
      return <TrendingDown className="h-4 w-4" />;
    }
    return <TrendingUp className="h-4 w-4" />;
  };

  const getAuctionTypeColor = () => {
    if (auction.auctionType === "DUTCH") {
      return "bg-orange-500";
    }
    return "bg-purple-500";
  };

  const handleBid = async () => {
    setIsProcessing(true);
    try {
      // For English auction, get bid amount from user
      if (auction.auctionType === "ENGLISH") {
        const minBid = parseFloat(auction.currentPrice) + parseFloat(auction.minBidIncrement || "0");
        const bidAmount = window.prompt(
          `Enter your bid amount (minimum: ${minBid.toFixed(4)} ETH):`,
          minBid.toFixed(4)
        );
        if (bidAmount) {
          await onBid?.(bidAmount);
        }
      } else {
        // For Dutch auction, accept current price
        await onBid?.(auction.currentPrice);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onCancel?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const isAuctionEnded = timeRemaining.isEnded || auction.status !== "ACTIVE";

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:shadow-lg",
        className
      )}
    >
      <CardHeader className="p-0">
        {/* Status and Type Badges */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <Badge className={cn("text-white", getStatusColor(auction.status))}>
            {auction.status}
          </Badge>
          <Badge className={cn("text-white flex items-center gap-1", getAuctionTypeColor())}>
            {getAuctionTypeIcon()}
            {auction.auctionType}
          </Badge>
        </div>

        {/* Ending Soon Badge */}
        {!isAuctionEnded && timeRemaining.hours < 1 && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
              <Flame className="h-3 w-3" />
              Ending Soon
            </Badge>
          </div>
        )}

        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {auction.nft?.image && !imageError ? (
            <Image
              src={auction.nft.image}
              alt={auction.nft?.name || "NFT"}
              fill
              className={cn(
                "object-cover transition-transform group-hover:scale-105",
                imageLoading && "blur-sm"
              )}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <div className="text-muted-foreground">No Image</div>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="secondary" size="sm" onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Collection Info */}
        {auction.nft?.collection && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {auction.nft.collection.name}
            </span>
            {auction.nft.collection.verified && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                ✓
              </Badge>
            )}
          </div>
        )}

        {/* NFT Name */}
        <Link href={`/nft/${auction.tokenContract}/${auction.tokenId}`}>
          <h3 className="font-semibold truncate hover:text-primary transition-colors mb-2">
            {auction.nft?.name || `#${auction.tokenId}`}
          </h3>
        </Link>

        {/* Seller Info */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">Seller:</span>
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-xs">
              {auction.seller.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/profile/${auction.seller}`}
            className="text-sm hover:text-primary transition-colors"
          >
            {formatAddress(auction.seller)}
          </Link>
        </div>

        {/* Price Info */}
        <div className="space-y-2 mb-3">
          {auction.auctionType === "ENGLISH" ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Bid</p>
                  <p className="text-lg font-bold">
                    {formatPrice(auction.currentPrice)} ETH
                  </p>
                </div>
                {auction.bidCount !== undefined && (
                  <Badge variant="outline">
                    {auction.bidCount} {auction.bidCount === 1 ? "bid" : "bids"}
                  </Badge>
                )}
              </div>
              {auction.highestBidder && (
                <div className="text-xs text-muted-foreground">
                  Highest bidder: {formatAddress(auction.highestBidder)}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-lg font-bold">
                  {formatPrice(auction.currentPrice)} ETH
                </p>
              </div>
              {auction.endPrice && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">End Price</p>
                  <p className="text-sm font-medium">
                    {formatPrice(auction.endPrice)} ETH
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Countdown Timer */}
        {!isAuctionEnded ? (
          <div className="flex items-center gap-1 text-sm bg-muted rounded-lg p-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono font-medium">
              {timeRemaining.days > 0 && `${timeRemaining.days}d `}
              {String(timeRemaining.hours).padStart(2, "0")}:
              {String(timeRemaining.minutes).padStart(2, "0")}:
              {String(timeRemaining.seconds).padStart(2, "0")}
            </span>
            <span className="text-muted-foreground ml-1">remaining</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            Auction ended
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {auction.status === "ACTIVE" && !isAuctionEnded && (
          <div className="w-full space-y-2">
            {isOwner ? (
              // Owner Actions
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Gavel className="mr-2 h-4 w-4" />
                    Cancel Auction
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Auction</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this auction? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Auction</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={isProcessing}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isProcessing ? "Cancelling..." : "Cancel Auction"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              // Bidder Actions
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" disabled={isProcessing}>
                    <Gavel className="mr-2 h-4 w-4" />
                    {isProcessing
                      ? "Processing..."
                      : auction.auctionType === "ENGLISH"
                      ? "Place Bid"
                      : "Buy Now"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {auction.auctionType === "ENGLISH"
                        ? "Place Bid"
                        : "Buy Now"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {auction.auctionType === "ENGLISH" ? (
                        <>
                          You are about to place a bid on "
                          {auction.nft?.name || `#${auction.tokenId}`}".
                          Minimum bid: <strong>{formatPrice(
                            (parseFloat(auction.currentPrice) +
                              parseFloat(auction.minBidIncrement || "0")).toString()
                          )} ETH</strong>
                        </>
                      ) : (
                        <>
                          You are about to purchase "
                          {auction.nft?.name || `#${auction.tokenId}`}" for{" "}
                          <strong>{formatPrice(auction.currentPrice)} ETH</strong>.
                          This action cannot be undone.
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBid} disabled={isProcessing}>
                      {isProcessing ? "Processing..." : "Confirm"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {(isAuctionEnded || auction.status === "ENDED") && (
          <div className="w-full text-center">
            <Badge variant="secondary" className="w-full justify-center py-2">
              Auction Ended
              {auction.highestBidder && ` - Sold for ${formatPrice(auction.currentPrice)} ETH`}
            </Badge>
          </div>
        )}

        {auction.status === "CANCELLED" && (
          <div className="w-full text-center">
            <Badge variant="outline" className="w-full justify-center py-2">
              Auction Cancelled
            </Badge>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
