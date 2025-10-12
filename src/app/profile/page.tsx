"use client";
import { useState } from "react";
import { logger } from "@/lib/utils/logger";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { NFTCard } from "@/components/features/nft/NFTCard";
import { UserCollections } from "@/components/features/collection/UserCollections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  ExternalLink,
  Settings,
  Share2,
  Palette,
  Package,
  Gavel,
  Heart,
  Activity,
  TrendingUp,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import Link from "next/link";

// User data helper
const getUserData = (address: string) => ({
  address,
  username: "CosmicCreator",
  bio: "Digital artist and NFT creator passionate about exploring the intersection of technology and art.",
  avatar: "https://picsum.photos/200/200?random=avatar",
  banner: "https://picsum.photos/1200/300?random=banner",
  verified: true,
  joinedAt: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
  stats: {
    nftsOwned: 147,
    nftsCreated: 89,
    collectionsOwned: 23,
    collectionsCreated: 5,
    totalValue: "45.2",
    totalSales: "128.7",
  },
  socialLinks: {
    website: "https://cosmicart.io",
    twitter: "https://twitter.com/cosmiccreator",
    instagram: "https://instagram.com/cosmiccreator",
  },
});

// User's NFTs data
const userNFTs = [
  {
    id: "1",
    tokenId: "1234",
    contractAddress: "0x123...",
    name: "Cosmic Warrior #1234",
    image: "https://picsum.photos/400/400?random=1",
    price: "2.5",
    currency: "ETH",
    owner: "0x742d35cc6bb5c57e4f6a8c5c3d4b2a0f8e6d9b5c",
    collection: {
      name: "Cosmic Warriors",
      verified: true,
    },
    rarity: "rare" as const,
    isListed: true,
  },
  {
    id: "2",
    tokenId: "5678",
    contractAddress: "0x456...",
    name: "Digital Dreams #5678",
    image: "https://picsum.photos/400/400?random=2",
    owner: "0x742d35cc6bb5c57e4f6a8c5c3d4b2a0f8e6d9b5c",
    collection: {
      name: "Digital Dreams",
      verified: false,
    },
    rarity: "epic" as const,
    isListed: false,
  },
];

// User's collections data
const userCollections = [
  {
    address: "0x123...",
    name: "Cosmic Warriors",
    symbol: "CW",
    description: "A collection of 10,000 unique cosmic warriors.",
    image: "https://picsum.photos/200/200?random=4",
    creator: "0x742d35cc6bb5c57e4f6a8c5c3d4b2a0f8e6d9b5c",
    verified: true,
    type: "ERC721" as const,
    stats: {
      totalSupply: 10000,
      totalOwners: 5432,
      floorPrice: "1.2",
      totalVolume: "12500.5",
      listed: 234,
    },
  },
];

export default function ProfilePage() {
  const { account, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState("owned");

  if (!isConnected || !account) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            Please connect your wallet to view your profile and manage your
            NFTs.
          </p>
        </div>
      </MainLayout>
    );
  }

  const userData = getUserData(account);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <MainLayout>
      {/* Banner */}
      <div className="relative h-48 mb-8 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20">
        {userData.banner && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${userData.banner})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8 -mt-20 relative z-10">
        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarFallback className="text-2xl">
                {account.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* User Details */}
            <div className="flex-1 mt-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {userData.username || formatAddress(account)}
                </h1>
                {userData.verified && (
                  <Badge variant="secondary">Verified</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <span className="font-mono">{formatAddress(account)}</span>
                <Button variant="ghost" size="sm" onClick={copyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`https://etherscan.io/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>

              {userData.bio && (
                <p className="text-muted-foreground mb-4 max-w-2xl">
                  {userData.bio}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Joined {formatDate(userData.joinedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 lg:w-48 mt-4">
          <Button asChild>
            <Link href="/profile/settings">
              <Settings className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>

          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share Profile
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Owned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.stats.nftsOwned}</div>
            <p className="text-xs text-muted-foreground">NFTs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData.stats.nftsCreated}
            </div>
            <p className="text-xs text-muted-foreground">NFTs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData.stats.collectionsOwned}
            </div>
            <p className="text-xs text-muted-foreground">Owned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData.stats.collectionsCreated}
            </div>
            <p className="text-xs text-muted-foreground">Collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData.stats.totalValue}
            </div>
            <p className="text-xs text-muted-foreground">ETH</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData.stats.totalSales}
            </div>
            <p className="text-xs text-muted-foreground">ETH</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="owned" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Owned
          </TabsTrigger>
          <TabsTrigger value="created" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Created
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Collections
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Offers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owned" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userNFTs.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onLike={() =>
                  logger.info(
                    "Like NFT",
                    { nftId: nft.id },
                    { component: "ProfilePage", action: "likeNFT" }
                  )
                }
                onBuy={() =>
                  logger.info(
                    "Buy NFT",
                    { nftId: nft.id },
                    { component: "ProfilePage", action: "buyNFT" }
                  )
                }
                onMakeOffer={() =>
                  logger.info(
                    "Make offer",
                    { nftId: nft.id },
                    { component: "ProfilePage", action: "makeOffer" }
                  )
                }
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="created" className="mt-6">
          <div className="text-center py-12">
            <Palette className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No NFTs Created Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating your first NFT collection
            </p>
            <Button asChild>
              <Link href="/collections/create">Create Collection</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          <UserCollections collections={userCollections} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-16 w-16 mx-auto mb-4" />
                <p>No recent activity</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start exploring and save your favorite NFTs
            </p>
            <Button variant="outline" asChild>
              <Link href="/marketplace">Explore Marketplace</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="offers" className="mt-6">
          <div className="text-center py-12">
            <Gavel className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Offers</h3>
            <p className="text-muted-foreground">
              Your offers made and received will appear here
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
