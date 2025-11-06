"use client";

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
import { Skeleton } from "@/components/ui/skeleton";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { FeaturedNFTs } from "@/components/features/nft/FeaturedNFTs";
import { TrendingCollections } from "@/components/features/collection/TrendingCollections";
import { useHomeData } from "@/hooks/use-home-data";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Palette,
  Gavel,
  Star,
  Activity,
  Volume2,
  Settings,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// No fallback data - all data must come from contracts

export default function Home() {
  const {
    stats,
    featuredNFTs,
    trendingCollections,
    isLoading,
    error,
    refetch,
  } = useHomeData();

  // Only use contract data - no fallbacks
  const displayStats = [
    {
      title: "Total Volume",
      value: stats.totalVolume,
      description: "All time trading volume",
      icon: Volume2,
      trend: stats.trends.volume,
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      description: "Monthly active traders",
      icon: Users,
      trend: stats.trends.users,
    },
    {
      title: "Collections",
      value: stats.collections,
      description: "Verified collections",
      icon: Palette,
      trend: stats.trends.collections,
    },
    {
      title: "Live Auctions",
      value: stats.liveAuctions,
      description: "Currently active",
      icon: Gavel,
      trend: stats.trends.auctions,
    },
  ];

  const displayFeaturedNFTs = featuredNFTs;
  const displayTrendingCollections = trendingCollections;

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-xl sm:rounded-2xl md:rounded-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <Badge variant="secondary" className="mb-3 sm:mb-4">
            <Star className="mr-1 h-3 w-3" />
            <span className="text-xs sm:text-sm">
              The Premier NFT Marketplace
            </span>
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
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href="/collections/create">Create Collection</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              Marketplace Statistics
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Real-time data from the blockchain
            </p>
          </div>
          {error && (
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Unable to load contract data
              </span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}. Please ensure contracts are deployed and wallet is
              connected.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading
            ? // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : displayStats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">
                      {stat.value}
                    </div>
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
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              Featured NFTs
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Latest listings from the marketplace
            </p>
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/marketplace">
              <span className="sm:hidden">View All</span>
              <span className="hidden sm:inline">View All</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <Skeleton className="h-64 w-full rounded-t-lg" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayFeaturedNFTs.length > 0 ? (
          <FeaturedNFTs nfts={displayFeaturedNFTs} />
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Palette className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No NFTs Available</h3>
            <p className="text-muted-foreground mb-4">
              No NFTs are currently listed on the marketplace.
            </p>
            <Button asChild>
              <Link href="/collections/create">Create Collection</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Trending Collections */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              Trending Collections
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Top collections by trading volume
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

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayTrendingCollections.length > 0 ? (
          <TrendingCollections collections={displayTrendingCollections} />
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No Collections Available
            </h3>
            <p className="text-muted-foreground mb-4">
              No collections have been created yet on the marketplace.
            </p>
            <Button asChild>
              <Link href="/collections/create">Create First Collection</Link>
            </Button>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">
            How It Works
          </h2>
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
