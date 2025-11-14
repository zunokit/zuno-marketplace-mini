/**
 * Marketplace Hooks - Custom hooks for common marketplace operations
 *
 * These hooks provide a clean interface for common marketplace operations
 * using the Zuno SDK under the hood.
 */

import { useState, useCallback, useMemo } from "react";
import { useExchange, useAuction, useCollection } from "zuno-marketplace-sdk/react";

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

  const buyNFT = useCallback(async (listingId: string, maxPrice?: string) => {
    return exchange.buyNFT.mutateAsync({ listingId, maxPrice });
  }, [exchange]);

  const cancelListing = useCallback(async (listingId: string) => {
    return exchange.cancelListing.mutateAsync(listingId);
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
      return auction.createEnglishAuction.mutateAsync({
        collectionAddress: params.collectionAddress,
        tokenId: params.tokenId,
        startingPrice: params.startingPrice,
        reservePrice: params.reservePrice,
        duration: params.duration,
      });
    } else {
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
    return auction.placeBid.mutateAsync({ auctionId, bidAmount });
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
      return collection.createERC721Collection.mutateAsync(params);
    } else {
      return collection.createERC1155Collection.mutateAsync(params);
    }
  }, [collection]);

  const mintNFT = useCallback(async (params: {
    collectionAddress: string;
    collectionType: 'ERC721' | 'ERC1155';
    recipient: string;
    tokenId?: string;
    amount?: string; // For ERC1155
    tokenURI?: string;
    value?: string;
  }) => {
    if (params.collectionType === 'ERC721') {
      return collection.mintERC721.mutateAsync({
        collectionAddress: params.collectionAddress,
        recipient: params.recipient,
        tokenURI: params.tokenURI,
        value: params.value,
      });
    } else {
      return collection.mintERC1155.mutateAsync({
        collectionAddress: params.collectionAddress,
        recipient: params.recipient,
        tokenId: params.tokenId || '1',
        amount: params.amount || '1',
        tokenURI: params.tokenURI,
        value: params.value,
      });
    }
  }, [collection]);

  // Data fetching with filters
  const fetchListings = useCallback(async () => {
    const filterParams = {
      ...(filters.minPrice && { minPrice: filters.minPrice }),
      ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
      ...(filters.collection && { collection: filters.collection }),
      ...(filters.seller && { seller: filters.seller }),
    };

    return exchange.getListings(filterParams);
  }, [exchange, filters]);

  const fetchAuctions = useCallback(async () => {
    return auction.getAuctions({
      ...(filters.collection && { collection: filters.collection }),
      ...(filters.seller && { seller: filters.seller }),
    });
  }, [auction, filters]);

  const fetchCollections = useCallback(async () => {
    return collection.getCollections({
      ...(filters.seller && { owner: filters.seller }),
    });
  }, [collection, filters]);

  // Computed values
  const isLoading = useMemo(() => {
    return (
      exchange.listNFT.isPending ||
      exchange.buyNFT.isPending ||
      exchange.cancelListing.isPending ||
      auction.createEnglishAuction.isPending ||
      auction.createDutchAuction.isPending ||
      auction.placeBid.isPending ||
      collection.createERC721Collection.isPending ||
      collection.createERC1155Collection.isPending ||
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
    collection.createERC721Collection.isPending,
    collection.createERC1155Collection.isPending,
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
      collection.createERC721Collection.error ||
      collection.createERC1155Collection.error ||
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
    collection.createERC721Collection.error,
    collection.createERC1155Collection.error,
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
      // Fetch user's active listings
      const listings = await marketplace.sdk.exchange.getListings({
        seller: userAddress,
      });
      setUserListings(listings);

      // Fetch user's active auctions
      const auctions = await marketplace.sdk.auction.getAuctions({
        seller: userAddress,
      });
      setUserAuctions(auctions);

      // Fetch user's collections
      const collections = await marketplace.sdk.collection.getCollections({
        owner: userAddress,
      });
      setUserCollections(collections);
    } catch (error) {
      console.error('Failed to fetch user marketplace data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [marketplace.sdk, userAddress]);

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
    isLoading,
    userStats,
    fetchUserData,
    // Re-export marketplace methods
    ...marketplace,
  };
}

/**
 * Hook for real-time marketplace updates
 * This would typically use WebSockets or event listeners
 */
export function useMarketplaceRealtime() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // This is a placeholder for real-time functionality
  // In a real implementation, you'd:
  // 1. Connect to WebSocket/EventSource
  // 2. Listen for contract events
  // 3. Update state based on events

  const subscribeToEvents = useCallback((events: string[]) => {
    // Placeholder: Subscribe to blockchain events
    console.log('Subscribing to events:', events);
    setIsConnected(true);
  }, []);

  const unsubscribeFromEvents = useCallback(() => {
    // Placeholder: Unsubscribe from events
    console.log('Unsubscribing from events');
    setIsConnected(false);
  }, []);

  return {
    updates,
    isConnected,
    subscribeToEvents,
    unsubscribeFromEvents,
  };
}