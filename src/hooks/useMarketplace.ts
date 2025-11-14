/**
 * Marketplace Hooks - Custom hooks for common marketplace operations
 *
 * These hooks provide a clean interface for common marketplace operations
 * using the Zuno SDK under the hood.
 */

import { useState, useCallback, useMemo } from "react";
import {
  useExchange,
  useAuction,
  useCollection,
  // Query hooks - SDK v1.0.1
  useListings,
  useListing,
  useAuctionDetails,
  useCollectionInfo
} from "zuno-marketplace-sdk/react";
import { logger } from "@/lib/utils/logger";

// Types for marketplace operations
export interface NFTListing {
  id: string;
  collectionAddress: string;
  tokenId: string;
  seller: string;
  price: string;
  endTime: number;
  status: 'active' | 'sold' | 'cancelled';
}

export interface NFTAuction {
  id: string;
  collectionAddress: string;
  tokenId: string;
  seller: string;
  currentBid?: string;
  currentBidder?: string;
  endTime: number;
  type: 'english' | 'dutch';
  status: 'active' | 'ended';
}

export interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  totalSupply: number;
  owner: string;
  createdAt: number;
}

/**
 * Hook for NFT marketplace operations
 * Combines exchange, auction, and collection functionality
 */
export function useMarketplace() {
  const exchange = useExchange();
  const auction = useAuction();
  const collection = useCollection();

  const [activeTab, setActiveTab] = useState<'listings' | 'auctions' | 'collections'>('listings');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    collection: '',
    seller: '',
  });

  // Exchange operations
  const listNFT = useCallback(async (params: {
    collectionAddress: string;
    tokenId: string;
    price: string;
    duration: number;
  }) => {
    return exchange.listNFT.mutateAsync(params);
  }, [exchange]);

  const buyNFT = useCallback(async (listingId: string, value?: string) => {
    // SDK v1.0.1: BuyNFTParams has 'value' not 'maxPrice'
    return exchange.buyNFT.mutateAsync({ listingId, value });
  }, [exchange]);

  const cancelListing = useCallback(async (listingId: string) => {
    // SDK v1.0.1: cancelListing expects object not string
    return exchange.cancelListing.mutateAsync({ listingId });
  }, [exchange]);

  // Auction operations
  const createAuction = useCallback(async (params: {
    collectionAddress: string;
    tokenId: string;
    startingPrice: string;
    auctionType: 'english' | 'dutch';
    duration: number;
    reservePrice?: string;
    endPrice?: string; // For Dutch auctions
  }) => {
    if (params.auctionType === 'english') {
      // SDK v1.0.2: uses 'collectionAddress' (standardized naming)
      return auction.createEnglishAuction.mutateAsync({
        collectionAddress: params.collectionAddress,
        tokenId: params.tokenId,
        startingBid: params.startingPrice, // SDK uses 'startingBid'
        reservePrice: params.reservePrice,
        duration: params.duration,
      });
    } else {
      // SDK v1.0.2: uses 'collectionAddress' (standardized naming)
      return auction.createDutchAuction.mutateAsync({
        collectionAddress: params.collectionAddress,
        tokenId: params.tokenId,
        startPrice: params.startingPrice,
        endPrice: params.endPrice || params.startingPrice,
        duration: params.duration,
      });
    }
  }, [auction]);

  const placeBid = useCallback(async (auctionId: string, bidAmount: string) => {
    // SDK v1.0.2: uses 'amount' parameter
    return auction.placeBid.mutateAsync({ auctionId, amount: bidAmount });
  }, [auction]);

  // Collection operations
  const createCollection = useCallback(async (params: {
    name: string;
    symbol: string;
    collectionType: 'ERC721' | 'ERC1155';
    baseURI?: string;
    maxSupply?: number;
    royaltyReceiver?: string;
    royaltyFee?: number;
  }) => {
    if (params.collectionType === 'ERC721') {
      // SDK v1.0.2: method is 'createERC721' (not 'createERC721Collection')
      // SDK v1.0.2: uses 'baseUri' (lowercase i) not 'baseURI'
      return collection.createERC721.mutateAsync({
        name: params.name,
        symbol: params.symbol,
        baseUri: params.baseURI || '',
        maxSupply: params.maxSupply || 10000,
      });
    } else {
      // SDK v1.0.2: method is 'createERC1155' (not 'createERC1155Collection')
      return collection.createERC1155.mutateAsync({
        uri: params.baseURI || '',
      });
    }
  }, [collection]);

  const mintNFT = useCallback(async (params: {
    collectionAddress: string;
    collectionType: 'ERC721' | 'ERC1155';
    recipient: string;
    tokenId?: string;
    amount?: string; // For ERC1155
    value?: string;
  }) => {
    if (params.collectionType === 'ERC721') {
      // SDK v1.0.2: MintERC721Params doesn't have tokenURI parameter
      return collection.mintERC721.mutateAsync({
        collectionAddress: params.collectionAddress,
        recipient: params.recipient,
        value: params.value,
      });
    } else {
      // SDK v1.0.2: amount must be number not string, no 'value' param
      return collection.mintERC1155.mutateAsync({
        collectionAddress: params.collectionAddress,
        recipient: params.recipient,
        tokenId: params.tokenId || '1',
        amount: parseInt(params.amount || '1'),
        // Note: MintERC1155Params doesn't have 'value' field
      });
    }
  }, [collection]);

  // Data fetching with filters
  // NOTE: SDK v1.0.2 uses separate query hooks (useListings, useAuctionDetails, useCollectionInfo)
  // These methods are kept for backward compatibility but should use SDK query hooks directly
  const fetchListings = useCallback(async () => {
    // This is a placeholder - consumers should use useListings() hook directly
    // Example: const { data } = useListings(collectionAddress, page, pageSize)
    throw new Error('Use useListings() hook directly from SDK instead of fetchListings()');
  }, [filters]);

  const fetchAuctions = useCallback(async () => {
    // This is a placeholder - consumers should use useAuctionDetails() hook directly
    // Example: const { data } = useAuctionDetails(auctionId)
    throw new Error('Use useAuctionDetails() hook directly from SDK instead of fetchAuctions()');
  }, [filters]);

  const fetchCollections = useCallback(async () => {
    // This is a placeholder - consumers should use useCollectionInfo() hook directly
    // Example: const { data } = useCollectionInfo(address)
    throw new Error('Use useCollectionInfo() hook directly from SDK instead of fetchCollections()');
  }, [filters]);

  // Computed values
  const isLoading = useMemo(() => {
    return (
      exchange.listNFT.isPending ||
      exchange.buyNFT.isPending ||
      exchange.cancelListing.isPending ||
      auction.createEnglishAuction.isPending ||
      auction.createDutchAuction.isPending ||
      auction.placeBid.isPending ||
      collection.createERC721.isPending ||  // Fixed: createERC721 not createERC721Collection
      collection.createERC1155.isPending ||  // Fixed: createERC1155 not createERC1155Collection
      collection.mintERC721.isPending ||
      collection.mintERC1155.isPending
    );
  }, [
    exchange.listNFT.isPending,
    exchange.buyNFT.isPending,
    exchange.cancelListing.isPending,
    auction.createEnglishAuction.isPending,
    auction.createDutchAuction.isPending,
    auction.placeBid.isPending,
    collection.createERC721.isPending,  // Fixed
    collection.createERC1155.isPending,  // Fixed
    collection.mintERC721.isPending,
    collection.mintERC1155.isPending,
  ]);

  // Get errors from any operation
  const error = useMemo(() => {
    return (
      exchange.listNFT.error ||
      exchange.buyNFT.error ||
      exchange.cancelListing.error ||
      auction.createEnglishAuction.error ||
      auction.createDutchAuction.error ||
      auction.placeBid.error ||
      collection.createERC721.error ||  // Fixed
      collection.createERC1155.error ||  // Fixed
      collection.mintERC721.error ||
      collection.mintERC1155.error
    );
  }, [
    exchange.listNFT.error,
    exchange.buyNFT.error,
    exchange.cancelListing.error,
    auction.createEnglishAuction.error,
    auction.createDutchAuction.error,
    auction.placeBid.error,
    collection.createERC721.error,  // Fixed
    collection.createERC1155.error,  // Fixed
    collection.mintERC721.error,
    collection.mintERC1155.error,
  ]);

  return {
    // State
    activeTab,
    filters,
    isLoading,
    error,

    // Actions
    setActiveTab,
    setFilters,

    // Exchange methods
    listNFT,
    buyNFT,
    cancelListing,
    fetchListings,

    // Auction methods
    createAuction,
    placeBid,
    fetchAuctions,

    // Collection methods
    createCollection,
    mintNFT,
    fetchCollections,

    // Raw SDK access for advanced usage
    sdk: {
      exchange,
      auction,
      collection,
    },
  };
}

/**
 * Hook for user-specific marketplace data
 */
export function useUserMarketplace(userAddress: string) {
  const marketplace = useMarketplace();

  const [userListings, setUserListings] = useState<NFTListing[]>([]);
  const [userAuctions, setUserAuctions] = useState<NFTAuction[]>([]);
  const [userCollections, setUserCollections] = useState<NFTCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user-specific data
  const fetchUserData = useCallback(async () => {
    if (!userAddress) return;

    setIsLoading(true);
    try {
      // SDK v1.0.2: Core modules don't have getListings/getAuctions/getCollections methods
      // These are only available as React hooks (useListings, useAuctionDetails, useCollectionInfo)
      // TODO: Refactor this to use SDK query hooks directly in components

      // Temporarily setting empty arrays - consumers should use SDK query hooks
      setUserListings([]);
      setUserAuctions([]);
      setUserCollections([]);

      logger.error('Failed to fetch user marketplace data', new Error('Not implemented'), {
        component: 'useMarketplace',
        action: 'fetchUserData',
        userAddress,
        note: 'Use useListings(), useAuctionDetails(), useCollectionInfo() hooks directly from SDK'
      });
    } catch (error) {
      logger.error('Failed to fetch user marketplace data', error, {
        component: 'useMarketplace',
        action: 'fetchUserData',
        userAddress
      });
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  // Calculate user stats
  const userStats = useMemo(() => {
    const activeListings = userListings.filter(l => l.status === 'active').length;
    const activeAuctions = userAuctions.filter(a => a.status === 'active').length;
    const totalCollections = userCollections.length;

    return {
      activeListings,
      activeAuctions,
      totalCollections,
    };
  }, [userListings, userAuctions, userCollections]);

  return {
    userListings,
    userAuctions,
    userCollections,
    isLoadingUserData: isLoading,  // User data loading state (renamed to avoid conflict)
    userStats,
    fetchUserData,
    // Re-export marketplace methods
    ...marketplace,
  };
}