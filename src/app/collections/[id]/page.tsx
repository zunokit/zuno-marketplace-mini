"use client";

import { useParams, useRouter } from "next/navigation";
import { useCollectionInfo, useZuno } from "zuno-marketplace-sdk/react";
import { toast } from "sonner";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  DollarSign, 
  Percent, 
  Users, 
  User,
  Hash,
  ExternalLink,
  Coins,
  FolderOpen
} from "lucide-react";
import Link from "next/link";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionAddress = params.id as string;
  const { data: collection, isLoading, error } = useCollectionInfo(collectionAddress);
  const sdk = useZuno();

  const handleMint = () => {
    router.push(`/mint/${collectionAddress}`);
  };

  const handleViewExplorer = () => {
    const config = sdk.getConfig();
    const network = config.network;
    
    let explorerUrl = "";
    if (network === "mainnet" || network === 1) {
      explorerUrl = `https://etherscan.io/address/${collectionAddress}`;
    } else if (network === "sepolia" || network === 11155111) {
      explorerUrl = `https://sepolia.etherscan.io/address/${collectionAddress}`;
    } else if (network === 31337) {
      toast.info("No explorer available for local network");
      return;
    } else {
      explorerUrl = `https://etherscan.io/address/${collectionAddress}`;
    }
    
    window.open(explorerUrl, "_blank");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Error loading collection</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const totalMinted = Number(collection?.totalSupply || 0);
  const maxSupply = Number(collection?.maxSupply || 0);
  const mintProgress = maxSupply > 0 ? (totalMinted / maxSupply) * 100 : 0;

  const formatAddress = (addr: string) => 
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{collection?.name || "Collection"}</h1>
          <Badge variant="secondary">{collection?.tokenType}</Badge>
        </div>
        <p className="text-muted-foreground font-mono text-sm">{collectionAddress}</p>
        {collection?.description && (
          <p className="mt-2 text-muted-foreground">{collection.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Supply */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Supply
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {totalMinted.toLocaleString()} / {maxSupply.toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  {mintProgress.toFixed(1)}%
                </span>
              </div>
              <Progress value={mintProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Mint Price */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Mint Price
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {collection?.mintPrice || "0"} ETH
            </p>
          </CardContent>
        </Card>

        {/* Royalty */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Royalty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {((collection?.royaltyFee || 0) / 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        {/* Mint Limit */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mint Limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {collection?.mintLimitPerWallet || 0}
            </p>
            <p className="text-xs text-muted-foreground">Per wallet</p>
          </CardContent>
        </Card>

        {/* Symbol */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Symbol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{collection?.symbol}</p>
          </CardContent>
        </Card>

        {/* Owner */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Owner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">
              {formatAddress(collection?.owner || '')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleMint}>
            <Coins className="mr-2 h-4 w-4" />
            Mint NFT
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile">
              <FolderOpen className="mr-2 h-4 w-4" />
              My NFTs
            </Link>
          </Button>
          <Button variant="outline" onClick={handleViewExplorer}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}