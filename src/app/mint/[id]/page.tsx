"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCollectionInfo, useCollection } from "zuno-marketplace-sdk/react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  DollarSign, 
  Percent, 
  Users, 
  User,
  Hash,
  ArrowLeft,
  Loader2,
  Plus,
  Minus,
  Wallet,
  CheckCircle
} from "lucide-react";

export default function MintPage() {
  const params = useParams();
  const router = useRouter();
  const collectionAddress = params.id as string;
  
  const { data: collection, isLoading, error, refetch } = useCollectionInfo(collectionAddress);
  const { batchMintERC721, batchMintERC1155 } = useCollection();
  const { address, isConnected } = useAccount();
  
  const [quantity, setQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  
  const isERC1155 = collection?.tokenType === 'ERC1155';
  const mintFn = isERC1155 ? batchMintERC1155 : batchMintERC721;

  const mintPrice = parseFloat(collection?.mintPrice || "0");
  const totalPrice = mintPrice * quantity;
  const maxSupply = Number(collection?.maxSupply || 0);
  const totalMinted = Number(collection?.totalSupply || 0);
  const remaining = maxSupply - totalMinted;
  const mintLimit = Number(collection?.mintLimitPerWallet || 10);
  const maxMintable = Math.min(remaining, mintLimit);

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= maxMintable) {
      setQuantity(newQty);
    }
  };

  const handleMint = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    setIsMinting(true);
    try {
      const totalValue = ethers.parseEther(totalPrice.toString()).toString();
      
      const result = await mintFn.mutateAsync({
        collectionAddress,
        recipient: address,
        amount: quantity,
        value: totalValue,
      });
      
      toast.success(`${quantity} NFT${quantity > 1 ? 's' : ''} Minted!`, {
        description: `TX: ${result.tx.hash.slice(0, 10)}...`,
      });
      
      refetch();
      setQuantity(1);
    } catch (err) {
      toast.error("Failed to mint NFT", {
        description: (err as Error).message || "Unknown error",
      });
    } finally {
      setIsMinting(false);
    }
  };

  const formatAddress = (addr: string) => 
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const mintProgress = maxSupply > 0 ? (totalMinted / maxSupply) * 100 : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading collection: {error.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => router.push(`/collections/${collectionAddress}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Collection
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Collection Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">{collection?.name}</CardTitle>
              <Badge variant="secondary">{collection?.tokenType}</Badge>
            </div>
            <CardDescription className="font-mono text-xs">
              {collectionAddress}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            {collection?.description && (
              <div>
                <p className="text-sm text-muted-foreground">{collection.description}</p>
              </div>
            )}

            <Separator />

            {/* Supply Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Minted
                </span>
                <span className="font-medium">
                  {totalMinted.toLocaleString()} / {maxSupply.toLocaleString()}
                </span>
              </div>
              <Progress value={mintProgress} className="h-3" />
              <p className="text-xs text-muted-foreground text-right">
                {remaining.toLocaleString()} remaining
              </p>
            </div>

            <Separator />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Mint Price
                </p>
                <p className="text-lg font-bold">{collection?.mintPrice || "0"} ETH</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Royalty
                </p>
                <p className="text-lg font-bold">
                  {((collection?.royaltyFee || 0) / 100).toFixed(1)}%
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Limit/Wallet
                </p>
                <p className="text-lg font-bold">{collection?.mintLimitPerWallet || "∞"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Symbol
                </p>
                <p className="text-lg font-bold">{collection?.symbol}</p>
              </div>
            </div>

            <Separator />

            {/* Owner */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Owner
              </span>
              <span className="font-mono text-sm">
                {formatAddress(collection?.owner || '')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Mint Card */}
        <Card>
          <CardHeader>
            <CardTitle>Mint NFT</CardTitle>
            <CardDescription>
              {remaining > 0 
                ? `${remaining.toLocaleString()} NFTs available to mint`
                : "Sold out!"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wallet Status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Wallet className="h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {isConnected ? "Wallet Connected" : "Wallet Not Connected"}
                </p>
                {isConnected && address && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatAddress(address)}
                  </p>
                )}
              </div>
              {isConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <Label>Quantity</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (val >= 1 && val <= maxMintable) {
                      setQuantity(val);
                    }
                  }}
                  className="w-20 text-center text-lg font-bold"
                  min={1}
                  max={maxMintable}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= maxMintable}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Max: {maxMintable}
                </span>
              </div>
            </div>

            <Separator />

            {/* Price Summary */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price per NFT</span>
                <span>{mintPrice} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span>x {quantity}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{totalPrice.toFixed(4)} ETH</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full h-12 text-lg"
              onClick={handleMint}
              disabled={isMinting || !isConnected || remaining <= 0}
            >
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Minting...
                </>
              ) : remaining <= 0 ? (
                "Sold Out"
              ) : !isConnected ? (
                "Connect Wallet to Mint"
              ) : (
                `Mint ${quantity} NFT${quantity > 1 ? 's' : ''}`
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
