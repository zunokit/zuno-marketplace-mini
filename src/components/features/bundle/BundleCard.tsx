"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Package, Eye, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface BundleCardProps {
  bundle: {
    id: string;
    seller: string;
    nfts: Array<{
      contractAddress: string;
      tokenId: string;
      tokenType: "ERC721" | "ERC1155";
      amount?: string;
      metadata?: {
        name?: string;
        image?: string;
      };
    }>;
    price: string;
    status: "ACTIVE" | "SOLD" | "CANCELLED";
    createdAt: number;
    expiresAt: number;
  };
  className?: string;
  isOwner?: boolean;
  onBuy?: () => void;
  onCancel?: () => void;
  onView?: () => void;
}

export function BundleCard({
  bundle,
  className,
  isOwner = false,
  onBuy,
  onCancel,
  onView,
}: BundleCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(4);
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

  const isExpired = bundle.expiresAt < Date.now();

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
    <Card className={cn("group overflow-hidden transition-all hover:shadow-lg", className)}>
      <CardHeader className="p-0">
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <Badge className={cn("text-white", getStatusColor(bundle.status))}>
            {bundle.status}
          </Badge>
          <Badge className="bg-purple-500 text-white flex items-center gap-1">
            <Package className="h-3 w-3" />
            {bundle.nfts.length} NFTs
          </Badge>
        </div>

        {/* NFT Grid Preview */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <div className="grid grid-cols-2 gap-1 p-1 h-full">
            {bundle.nfts.slice(0, 4).map((nft, idx) => (
              <div key={idx} className="relative bg-muted rounded overflow-hidden">
                {nft.metadata?.image ? (
                  <Image
                    src={nft.metadata.image}
                    alt={nft.metadata?.name || `NFT ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    #{nft.tokenId}
                  </div>
                )}
              </div>
            ))}
          </div>
          {bundle.nfts.length > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-2xl">
              +{bundle.nfts.length - 4}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Bundle Title */}
        <h3 className="font-semibold truncate mb-2">
          Bundle of {bundle.nfts.length} NFTs
        </h3>

        {/* NFT List */}
        <div className="space-y-1 mb-3">
          {bundle.nfts.slice(0, 3).map((nft, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">
                {nft.tokenType}
              </Badge>
              <span className="text-muted-foreground truncate">
                {nft.metadata?.name || `Token #${nft.tokenId}`}
              </span>
            </div>
          ))}
          {bundle.nfts.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{bundle.nfts.length - 3} more NFTs
            </p>
          )}
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">Seller:</span>
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-xs">
              {bundle.seller.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{formatAddress(bundle.seller)}</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-muted-foreground">Bundle Price</p>
            <p className="text-lg font-bold">{formatPrice(bundle.price)} ETH</p>
          </div>
        </div>

        {/* Time Info */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {isExpired ? (
            "Expired"
          ) : (
            <>
              Expires{" "}
              {formatDistanceToNow(new Date(bundle.expiresAt), { addSuffix: true })}
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {bundle.status === "ACTIVE" && !isExpired && (
          <div className="w-full space-y-2">
            {isOwner ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <X className="mr-2 h-4 w-4" />
                    Cancel Bundle
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Bundle</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this bundle? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Bundle</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={isProcessing}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isProcessing ? "Cancelling..." : "Cancel Bundle"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" disabled={isProcessing}>
                    <Package className="mr-2 h-4 w-4" />
                    {isProcessing ? "Processing..." : "Buy Bundle"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                    <AlertDialogDescription>
                      You are about to purchase this bundle of {bundle.nfts.length} NFTs for{" "}
                      <strong>{formatPrice(bundle.price)} ETH</strong>. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBuy} disabled={isProcessing}>
                      {isProcessing ? "Processing..." : "Confirm Purchase"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" className="w-full" onClick={onView}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </div>
        )}

        {(bundle.status === "SOLD" || bundle.status === "CANCELLED" || isExpired) && (
          <div className="w-full text-center">
            <Badge variant="outline" className="w-full justify-center py-2">
              {bundle.status === "SOLD"
                ? `Sold for ${formatPrice(bundle.price)} ETH`
                : bundle.status === "CANCELLED"
                ? "Bundle Cancelled"
                : "Bundle Expired"}
            </Badge>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
