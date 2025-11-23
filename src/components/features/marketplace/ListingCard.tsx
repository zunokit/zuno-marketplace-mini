"use client";
import { useState } from "react";
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
  ShoppingCart,
  Edit,
  X,
  Clock,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ZERO_ADDRESS } from "@/lib/constants";

export interface ListingCardProps {
  listing: {
    id: string;
    seller: string;
    tokenContract: string;
    tokenId: string;
    price: string;
    currency: string;
    status: "ACTIVE" | "SOLD" | "CANCELLED";
    createdAt: number;
    updatedAt: number;
    nft?: {
      name?: string;
      image?: string;
      collection?: {
        name?: string;
        verified?: boolean;
      };
    };
    priceHistory?: Array<{
      price: string;
      timestamp: number;
    }>;
  };
  className?: string;
  isOwner?: boolean;
  onBuy?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onView?: () => void;
}

export function ListingCard({
  listing,
  className,
  isOwner = false,
  onBuy,
  onEdit,
  onCancel,
  onView,
}: ListingCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
      case "SOLD":
        return "bg-blue-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriceChange = () => {
    if (!listing.priceHistory || listing.priceHistory.length < 2) return null;

    const currentPrice = parseFloat(listing.price);
    const previousPrice = parseFloat(
      listing.priceHistory[listing.priceHistory.length - 2].price
    );
    const change = ((currentPrice - previousPrice) / previousPrice) * 100;

    return {
      percentage: Math.abs(change).toFixed(1),
      isIncrease: change > 0,
      isDecrease: change < 0,
    };
  };

  const priceChange = getPriceChange();

  const handleBuy = async () => {
    setIsProcessing(true);
    try {
      await onBuy?.();
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

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:shadow-lg",
        className
      )}
    >
      <CardHeader className="p-0">
        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className={cn("text-white", getStatusColor(listing.status))}>
            {listing.status}
          </Badge>
        </div>

        {/* Price Change Indicator */}
        {priceChange && listing.status === "ACTIVE" && (
          <div className="absolute top-3 right-3 z-10">
            <Badge
              variant={priceChange.isIncrease ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {priceChange.isIncrease ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {priceChange.percentage}%
            </Badge>
          </div>
        )}

        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {listing.nft?.image && !imageError ? (
            <Image
              src={listing.nft.image}
              alt={listing.nft?.name || "NFT"}
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
        {listing.nft?.collection && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {listing.nft.collection.name}
            </span>
            {listing.nft.collection.verified && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                ✓
              </Badge>
            )}
          </div>
        )}

        {/* NFT Name */}
        <Link href={`/nft/${listing.tokenContract}/${listing.tokenId}`}>
          <h3 className="font-semibold truncate hover:text-primary transition-colors mb-2">
            {listing.nft?.name || `#${listing.tokenId}`}
          </h3>
        </Link>

        {/* Seller Info */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">Seller:</span>
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-xs">
              {listing.seller.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/profile/${listing.seller}`}
            className="text-sm hover:text-primary transition-colors"
          >
            {formatAddress(listing.seller)}
          </Link>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-lg font-bold">
              {formatPrice(listing.price)}{" "}
              {listing.currency === ZERO_ADDRESS ? "ETH" : listing.currency}
            </p>
          </div>
        </div>

        {/* Listing Time */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          Listed{" "}
          {formatDistanceToNow(new Date(listing.createdAt), {
            addSuffix: true,
          })}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {listing.status === "ACTIVE" && (
          <div className="w-full space-y-2">
            {isOwner ? (
              // Owner Actions
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Price
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Listing</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this listing? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Listing</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        disabled={isProcessing}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isProcessing ? "Cancelling..." : "Cancel Listing"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              // Buyer Actions
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" disabled={isProcessing}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {isProcessing ? "Processing..." : "Buy Now"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                    <AlertDialogDescription>
                      You are about to purchase &quot;
                      {listing.nft?.name || `#${listing.tokenId}`}&quot; for{" "}
                      <strong>{formatPrice(listing.price)} ETH</strong>. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBuy}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Confirm Purchase"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {listing.status === "SOLD" && (
          <div className="w-full text-center">
            <Badge variant="secondary" className="w-full justify-center py-2">
              Sold for {formatPrice(listing.price)} ETH
            </Badge>
          </div>
        )}

        {listing.status === "CANCELLED" && (
          <div className="w-full text-center">
            <Badge variant="outline" className="w-full justify-center py-2">
              Listing Cancelled
            </Badge>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
