/**
 * Collection Detail Component
 * Shows collection information and allows minting
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCollection } from '@/hooks/useCollection';
import { useWallet } from '@/providers/WalletProvider';
import { MintNFTButton } from '@/components/features/nft/MintNFTButton';
import { CollectionInfo, TokenType } from '@/types';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Package,
  TrendingUp,
  Verified,
  Globe,
  Twitter,
  MessageSquare,
  Copy,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export function CollectionDetail() {
  const params = useParams();
  const collectionAddress = params.id as string;
  const { isConnected } = useWallet();
  const { getCollectionInfo } = useCollection();
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (collectionAddress) {
      fetchCollectionInfo();
    }
  }, [collectionAddress]);

  const fetchCollectionInfo = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Try both token types to detect which one it is
      let info = await getCollectionInfo(collectionAddress, TokenType.ERC721);
      if (!info) {
        info = await getCollectionInfo(collectionAddress, TokenType.ERC1155);
      }
      
      if (info) {
        setCollectionInfo(info);
      } else {
        setError('Collection not found or invalid address');
      }
    } catch (err: any) {
      console.error('Failed to fetch collection info:', err);
      setError(err.message || 'Failed to load collection information');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(collectionAddress);
    toast.success('Address copied to clipboard');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openEtherscan = () => {
    // Use appropriate block explorer based on network
    const explorerUrl = `https://etherscan.io/address/${collectionAddress}`;
    window.open(explorerUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>

        {/* Info Skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="link"
            size="sm"
            onClick={() => fetchCollectionInfo()}
            className="ml-2"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!collectionInfo) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No collection found at this address
        </AlertDescription>
      </Alert>
    );
  }

  const { metadata, config, stats, tokenType } = collectionInfo;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-64 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg overflow-hidden">
          {metadata.banner ? (
            <img
              src={metadata.banner}
              alt={metadata.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          )}
        </div>

        {/* Collection Info */}
        <div className="relative -mt-16 px-6">
          <div className="flex items-end gap-6">
            {/* Logo */}
            <div className="relative">
              {metadata.image ? (
                <img
                  src={metadata.image}
                  alt={metadata.name}
                  className="w-32 h-32 rounded-lg border-4 border-background object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-lg border-4 border-background bg-muted flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {tokenType && (
                <Badge className="absolute -bottom-2 -right-2">
                  {tokenType}
                </Badge>
              )}
            </div>

            {/* Title and Actions */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    {metadata.name}
                    <Verified className="h-6 w-6 text-primary" />
                  </h1>
                  <p className="text-muted-foreground">
                    {metadata.symbol} • Created by {formatAddress(collectionAddress)}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fetchCollectionInfo(true)}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <MintNFTButton
                    collectionAddress={collectionAddress}
                    tokenType={tokenType}
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Supply</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalMinted.toString()} / {stats.maxSupply.toString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((Number(stats.totalMinted) / Number(stats.maxSupply)) * 100).toFixed(1)}% minted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mint Price</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ethers.formatEther(config.mintPrice)} ETH
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per NFT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Royalty</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(config.royaltyFee / 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Creator fee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mint Limit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config.mintLimitPerWallet.toString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per wallet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="about" className="space-y-4">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {metadata.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>

          {/* Social Links */}
          {(metadata.website || metadata.twitter || metadata.discord) && (
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {metadata.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={metadata.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        Website
                      </a>
                    </Button>
                  )}
                  {metadata.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://twitter.com/${metadata.twitter}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="mr-2 h-4 w-4" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {metadata.discord && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={metadata.discord} target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Discord
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Contract Address</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm">{formatAddress(collectionAddress)}</code>
                  <Button variant="ghost" size="icon" onClick={copyAddress}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={openEtherscan}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Token Standard</span>
                <Badge variant="outline">{tokenType}</Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Blockchain</span>
                <span>Ethereum</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Token URI</span>
                <span className="text-sm truncate max-w-xs">
                  {config.baseTokenURI || 'Not set'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Activity tracking coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
