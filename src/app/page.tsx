import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { FeaturedNFTs } from "@/components/features/nft/FeaturedNFTs";
import { TrendingCollections } from "@/components/features/collection/TrendingCollections";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Palette,
  Gavel,
  Star,
  Activity,
  Volume2,
} from "lucide-react";

// Demo data for landing page showcase
const featuredNFTs = [
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
    price: "1.8",
    currency: "ETH",
    owner: "0x853e46dc7bb6d8c4f5b9d8c5c3d4b2a0f8e6d9b5c",
    collection: {
      name: "Digital Dreams",
      verified: false,
    },
    rarity: "epic" as const,
    isListed: true,
  },
  {
    id: "3",
    tokenId: "9012",
    contractAddress: "0x789...",
    name: "Neon Nights #9012",
    image: "https://picsum.photos/400/400?random=3",
    price: "0.8",
    currency: "ETH",
    owner: "0x964f57ed8cc7e9d5f6c0e9d6c4d5b3a1f9e7d0c6c",
    isListed: true,
  },
];

const trendingCollections = [
  {
    address: "0x123...",
    name: "Cosmic Warriors",
    symbol: "CW",
    image: "https://picsum.photos/100/100?random=4",
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
  {
    address: "0x456...",
    name: "Digital Dreams",
    symbol: "DD",
    image: "https://picsum.photos/100/100?random=5",
    creator: "0x853e46dc7bb6d8c4f5b9d8c5c3d4b2a0f8e6d9b5c",
    verified: false,
    type: "ERC721" as const,
    stats: {
      totalSupply: 5000,
      totalOwners: 2876,
      floorPrice: "0.8",
      totalVolume: "8750.2",
      listed: 156,
    },
  },
];

const stats = [
  {
    title: "Total Volume",
    value: "1.2M ETH",
    description: "All time trading volume",
    icon: Volume2,
    trend: "+12.5%",
  },
  {
    title: "Active Users",
    value: "150K+",
    description: "Monthly active traders",
    icon: Users,
    trend: "+8.2%",
  },
  {
    title: "Collections",
    value: "25K+",
    description: "Verified collections",
    icon: Palette,
    trend: "+15.1%",
  },
  {
    title: "Live Auctions",
    value: "1.8K",
    description: "Currently active",
    icon: Gavel,
    trend: "+3.7%",
  },
];

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-xl sm:rounded-2xl md:rounded-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <Badge variant="secondary" className="mb-3 sm:mb-4">
            <Star className="mr-1 h-3 w-3" />
            <span className="text-xs sm:text-sm">The Premier NFT Marketplace</span>
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 sm:mb-6">
            Discover, Create & Trade Extraordinary NFTs
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join the world's largest digital marketplace for crypto collectibles
            and non-fungible tokens. Buy, sell, and discover exclusive digital
            items.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/marketplace">
                Explore Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/collections/create">Create Collection</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-1">
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  <Badge variant="secondary" className="text-xs w-fit">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured NFTs */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Featured NFTs</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Handpicked by our curators</p>
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/marketplace">
              <span className="sm:hidden">View All</span>
              <span className="hidden sm:inline">View All</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <FeaturedNFTs nfts={featuredNFTs} />
      </section>

      {/* Trending Collections */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Trending Collections</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Most popular collections this week
            </p>
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/collections">
              <span className="sm:hidden">View All</span>
              <span className="hidden sm:inline">View All</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <TrendingCollections collections={trendingCollections} />
      </section>

      {/* How It Works */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">How It Works</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            Get started with Zuno in just a few simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Connect Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect your crypto wallet to start buying, selling, and
                creating NFTs on our platform.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                <Palette className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Create & Collect</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload your artwork, create collections, or browse and collect
                amazing NFTs from artists worldwide.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-pink-600" />
              </div>
              <CardTitle>Trade & Earn</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                List your NFTs for sale, participate in auctions, and earn from
                your digital art and collectibles.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
