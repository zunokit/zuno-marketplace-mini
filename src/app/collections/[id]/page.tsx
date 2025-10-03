"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { CollectionNFTs } from "@/components/features/nft/CollectionNFTs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Share2,
  ExternalLink,
  Users,
  Package,
  TrendingUp,
  Volume2,
  Verified,
  Globe,
  Twitter,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Mock collection data
const getCollectionData = (id: string) => ({
  address: id,
  name: "Cosmic Warriors",
  symbol: "CW",
  description:
    "A collection of 10,000 unique cosmic warriors ready for battle across the metaverse. Each warrior possesses unique traits and abilities, forged in the depths of space and time.",
  longDescription: `The Cosmic Warriors collection represents the finest digital art in the NFT space. Each piece is carefully crafted with attention to detail, featuring over 200 unique traits across multiple categories including backgrounds, armor, weapons, and special effects.

Created by renowned digital artist @CosmicCreator, this collection has become a cornerstone of the NFT community, with holders gaining access to exclusive events, merchandise, and future collections.`,
  image: "https://picsum.photos/200/200?random=1",
  bannerImage: "https://picsum.photos/1200/300?random=1",
  creator: "0x742d35cc6bb5c57e4f6a8c5c3d4b2a0f8e6d9b5c",
  verified: true,
  type: "ERC721" as const,
  stats: {
    totalSupply: 10000,
    totalOwners: 5432,
    floorPrice: "1.2",
    totalVolume: "12500.5",
    listed: 234,
    volumeChange: "+12.5%",
    floorChange: "+8.2%",
    ownersChange: "+156",
  },
  socialLinks: {
    website: "https://cosmicwarriors.io",
    twitter: "https://twitter.com/cosmicwarriors",
    discord: "https://discord.gg/cosmicwarriors",
  },
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
});

// Mock NFTs in collection
const collectionNFTs = [
  {
    id: "1",
    tokenId: "1234",
    contractAddress: "0x123...",
    name: "Cosmic Warrior #1234",
    image: "https://picsum.photos/400/400?random=1",
    price: "2.5",
    currency: "ETH",
    owner: "0x742d35cc6bb5c57e4f6a8c5c3d4b2a0f8e6d9b5c",
    rarity: "rare" as const,
    isListed: true,
    traits: [
      { trait_type: "Background", value: "Nebula" },
      { trait_type: "Armor", value: "Quantum Steel" },
      { trait_type: "Weapon", value: "Plasma Sword" },
    ],
  },
  {
    id: "2",
    tokenId: "5678",
    contractAddress: "0x123...",
    name: "Cosmic Warrior #5678",
    image: "https://picsum.photos/400/400?random=2",
    price: "1.8",
    currency: "ETH",
    owner: "0x853e46dc7bb6d8c4f5b9d8c5c3d4b2a0f8e6d9b5c",
    rarity: "epic" as const,
    isListed: true,
    traits: [
      { trait_type: "Background", value: "Void" },
      { trait_type: "Armor", value: "Crystal Plate" },
      { trait_type: "Weapon", value: "Energy Lance" },
    ],
  },
  // Add more NFTs...
];

export default function CollectionDetailPage() {
  const params = useParams();
  const collectionId = params.id as string;
  const collection = getCollectionData(collectionId);

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("items");

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <MainLayout>
      {/* Banner */}
      <div className="relative h-64 mb-8 rounded-2xl overflow-hidden">
        <Image
          src={collection.bannerImage}
          alt={`${collection.name} banner`}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Collection Header */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Collection Info */}
        <div className="flex-1">
          <div className="flex items-start gap-6 mb-6">
            {/* Collection Avatar */}
            <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-4 border-background shadow-lg">
              <Image
                src={collection.image}
                alt={collection.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Collection Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{collection.name}</h1>
                {collection.verified && (
                  <Verified className="h-6 w-6 text-blue-500" />
                )}
                <Badge variant="outline">{collection.type}</Badge>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <span>by</span>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">
                    {collection.creator.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/profile/${collection.creator}`}
                  className="hover:text-primary transition-colors"
                >
                  {formatAddress(collection.creator)}
                </Link>
              </div>

              <p className="text-muted-foreground mb-4 max-w-2xl">
                {collection.description}
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {collection.socialLinks.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={collection.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Website
                    </a>
                  </Button>
                )}
                {collection.socialLinks.twitter && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={collection.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="mr-2 h-4 w-4" />
                      Twitter
                    </a>
                  </Button>
                )}
                {collection.socialLinks.discord && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={collection.socialLinks.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Discord
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 lg:w-48">
          <Button
            variant={isFollowing ? "outline" : "default"}
            onClick={() => setIsFollowing(!isFollowing)}
            className="w-full"
          >
            <Heart
              className={`mr-2 h-4 w-4 ${isFollowing ? "fill-current" : ""}`}
            />
            {isFollowing ? "Following" : "Follow"}
          </Button>

          <Button variant="outline" className="w-full">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>

          <Button variant="outline" className="w-full" asChild>
            <a
              href={`https://etherscan.io/address/${collection.address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Etherscan
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(collection.stats.totalSupply)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Owners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(collection.stats.totalOwners)}
            </div>
            <p className="text-xs text-green-600">
              {collection.stats.ownersChange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Floor Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collection.stats.floorPrice} ETH
            </div>
            <p className="text-xs text-green-600">
              {collection.stats.floorChange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Total Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collection.stats.totalVolume} ETH
            </div>
            <p className="text-xs text-green-600">
              {collection.stats.volumeChange}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="items">
            Items ({collection.stats.listed})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <CollectionNFTs nfts={collectionNFTs} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest transactions and events for this collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Activity feed coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Collection Analytics</CardTitle>
              <CardDescription>
                Detailed stats and market trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About {collection.name}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-line">
                {collection.longDescription}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
