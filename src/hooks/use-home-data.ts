"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { logger } from "@/lib/utils/logger";
import {
  marketplaceHubService,
  exchangeService,
  listingHistoryTrackerService,
  collectionQueryService,
} from "@/lib/services/contracts";
import { web3Utils } from "@/lib/utils/web3";

// Types for home page data
export interface HomePageStats {
  totalVolume: string;
  activeUsers: string;
  collections: string;
  liveAuctions: string;
  trends: {
    volume: string;
    users: string;
    collections: string;
    auctions: string;
  };
}

export interface FeaturedNFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  image: string;
  price?: string;
  currency?: string;
  owner: string;
  collection?: {
    name: string;
    verified?: boolean;
  };
  rarity?: "common" | "rare" | "epic" | "legendary";
  isListed?: boolean;
  isAuction?: boolean;
  auctionEndTime?: number;
}

export interface TrendingCollection {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  creator: string;
  verified?: boolean;
  type: "ERC721" | "ERC1155";
  stats?: {
    totalSupply: number;
    totalOwners: number;
    floorPrice?: string;
    totalVolume?: string;
    listed?: number;
  };
  socialLinks?: {
    website?: string;
    twitter?: string;
    discord?: string;
  };
  createdAt?: number;
}

export interface HomePageData {
  stats: HomePageStats;
  featuredNFTs: FeaturedNFT[];
  trendingCollections: TrendingCollection[];
  isLoading: boolean;
  error: string | null;
}

export const useHomeData = () => {
  const [data, setData] = useState<HomePageData>({
    stats: {
      totalVolume: "0",
      activeUsers: "0",
      collections: "0",
      liveAuctions: "0",
      trends: {
        volume: "+0%",
        users: "+0%",
        collections: "+0%",
        auctions: "+0%",
      },
    },
    featuredNFTs: [],
    trendingCollections: [],
    isLoading: true,
    error: null,
  });

  const wallet = useAppSelector((state) => state.wallet);

  /**
   * Fetch marketplace statistics
   */
  const fetchStats = useCallback(async (): Promise<HomePageStats> => {
    try {
      // Get global stats from listing history tracker
      const globalStats = await listingHistoryTrackerService.getGlobalStats();

      // Get active listings count
      const activeListings = await exchangeService.getActiveListingsCount();

      // Calculate trends (mock for now - in real app, compare with previous period)
      const trends = {
        volume: "+12.5%",
        users: "+8.2%",
        collections: "+15.1%",
        auctions: "+3.7%",
      };

      return {
        totalVolume: `${(Number(globalStats.totalVolume) / 1e18).toFixed(
          1
        )} ETH`,
        activeUsers: `${Number(globalStats.uniqueUsers).toLocaleString()}+`,
        collections: `${Number(
          globalStats.uniqueCollections
        ).toLocaleString()}+`,
        liveAuctions: `${activeListings}`,
        trends,
      };
    } catch (error) {
      logger.error("Failed to fetch marketplace stats", error, {
        component: "useHomeData",
        action: "fetchStats",
      });

      // Return empty stats when contract data is not available
      return {
        totalVolume: "0 ETH",
        activeUsers: "0",
        collections: "0",
        liveAuctions: "0",
        trends: {
          volume: "+0%",
          users: "+0%",
          collections: "+0%",
          auctions: "+0%",
        },
      };
    }
  }, []);

  /**
   * Fetch featured NFTs
   */
  const fetchFeaturedNFTs = useCallback(async (): Promise<FeaturedNFT[]> => {
    try {
      // Get recent listings from exchange service
      const listings = await exchangeService.getRecentListings(6); // Get 6 recent listings

      const featuredNFTsResults: (FeaturedNFT | null)[] = await Promise.all(
        listings.map(async (listing) => {
          try {
            // Get collection info
            const collectionData = await collectionQueryService.getCollection(
              listing.contractAddress
            );

            if (!collectionData) {
              // Skip NFTs without collection data
              return null;
            }

            // Get NFT metadata (mock for now - in real app, fetch from IPFS/metadata service)
            const metadata = {
              name: `${collectionData.name} #${listing.tokenId}`,
              image: `https://picsum.photos/400/400?random=${listing.tokenId}`,
              description: `A unique NFT from ${collectionData.name} collection`,
            };

            return {
              id: `${listing.contractAddress}-${listing.tokenId}`,
              tokenId: listing.tokenId,
              contractAddress: listing.contractAddress,
              name: metadata.name,
              image: metadata.image,
              price: listing.price,
              currency: "ETH",
              owner: listing.seller,
              collection: {
                name: collectionData.name,
                verified: collectionData.verified,
              },
              rarity: "rare" as const,
              isListed: true,
            };
          } catch (error) {
            logger.warn("Failed to fetch NFT metadata", error, {
              component: "useHomeData",
              action: "fetchFeaturedNFTs",
            });

            // Skip NFTs that failed to load
            return null;
          }
        })
      );

      // Filter out null results
      return featuredNFTsResults.filter(
        (nft): nft is FeaturedNFT => nft !== null
      );
    } catch (error) {
      logger.error("Failed to fetch featured NFTs", error, {
        component: "useHomeData",
        action: "fetchFeaturedNFTs",
      });
      return [];
    }
  }, []);

  /**
   * Fetch trending collections
   */
  const fetchTrendingCollections = useCallback(async (): Promise<
    TrendingCollection[]
  > => {
    try {
      // Get collections with highest volume from listing history tracker
      const topCollections =
        await listingHistoryTrackerService.getTopCollectionsByVolume(4);

      const trendingCollectionsResults: (TrendingCollection | null)[] =
        await Promise.all(
          topCollections.map(async (collectionAddress) => {
            try {
              const collectionData = await collectionQueryService.getCollection(
                collectionAddress
              );

              if (!collectionData) {
                // Skip collections without data
                return null;
              }

              const collectionStats =
                await listingHistoryTrackerService.getCollectionStats(
                  collectionAddress
                );

              return {
                address: collectionAddress,
                name: collectionData.name,
                symbol: collectionData.symbol,
                description: collectionData.description,
                image: `https://picsum.photos/100/100?random=${collectionAddress.slice(
                  -4
                )}`,
                creator: collectionData.creator,
                verified: collectionData.verified,
                type: collectionData.type,
                stats: {
                  totalSupply: Number(collectionData.totalSupply),
                  totalOwners: collectionData.stats.totalOwners,
                  floorPrice: `${(
                    Number(collectionStats.floorPrice) / 1e18
                  ).toFixed(2)}`,
                  totalVolume: `${(
                    Number(collectionStats.totalVolume) / 1e18
                  ).toFixed(1)}`,
                  listed: collectionData.stats.listed,
                },
                createdAt: collectionData.createdAt,
              };
            } catch (error) {
              logger.warn("Failed to fetch collection data", error, {
                component: "useHomeData",
                action: "fetchTrendingCollections",
              });

              // Skip collections that failed to load
              return null;
            }
          })
        );

      // Filter out null results
      return trendingCollectionsResults.filter(
        (collection): collection is TrendingCollection => collection !== null
      );
    } catch (error) {
      logger.error("Failed to fetch trending collections", error, {
        component: "useHomeData",
        action: "fetchTrendingCollections",
      });
      return [];
    }
  }, []);

  /**
   * Load all home page data
   */
  const loadData = useCallback(async () => {
    // Always show loading state initially
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    if (!wallet.isConnected) {
      setData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Initialize services if needed
      const provider = web3Utils.getProvider();
      const signer = web3Utils.getSigner();

      if (provider) {
        await marketplaceHubService.initialize(provider, signer || undefined);
      }

      // Fetch all data in parallel
      const [stats, featuredNFTs, trendingCollections] = await Promise.all([
        fetchStats(),
        fetchFeaturedNFTs(),
        fetchTrendingCollections(),
      ]);

      setData({
        stats,
        featuredNFTs,
        trendingCollections,
        isLoading: false,
        error: null,
      });

      logger.success(
        "Home page data loaded successfully",
        {
          statsCount: Object.keys(stats).length,
          featuredNFTsCount: featuredNFTs.length,
          trendingCollectionsCount: trendingCollections.length,
        },
        {
          component: "useHomeData",
          action: "loadData",
        }
      );
    } catch (error) {
      logger.error("Failed to load home page data", error, {
        component: "useHomeData",
        action: "loadData",
      });

      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load data",
      }));
    }
  }, [
    wallet.isConnected,
    fetchStats,
    fetchFeaturedNFTs,
    fetchTrendingCollections,
  ]);

  // Load data when wallet connects
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...data,
    refetch: loadData,
  };
};
