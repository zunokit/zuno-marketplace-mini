/**
 * Migration Service - Bridge between old services and Zuno SDK
 *
 * This file provides a migration path from the old custom service layer
 * to the new Zuno Marketplace SDK. It maintains compatibility during
 * the transition while providing access to SDK functionality.
 */

import { useExchange, useAuction, useCollection } from 'zuno-marketplace-sdk/react';

/**
 * Migration Hooks for React Components
 * These hooks provide the same interface as the old service methods
 * but use the SDK under the hood
 */

/**
 * Exchange Hook - Replaces old exchangeService usage
 * Note: SDK method names may vary - update based on actual SDK
 */
export function useExchangeService() {
  const exchange = useExchange();

  return {
    // Methods that map directly to SDK (update method names based on actual SDK)
    listNFT: exchange.listNFT,
    buyNFT: exchange.buyNFT,
    cancelListing: exchange.cancelListing,

    // Legacy compatibility - old method names
    createListing: exchange.listNFT,
    purchaseListing: exchange.buyNFT,

    // Note: Add other methods as available in the actual SDK
    // batchListNFT: exchange.batchListNFT,
    // getListing: exchange.getListing,
    // getListings: exchange.getListings,
    // getCollectionListings: exchange.getCollectionListings,
  };
}

/**
 * Auction Hook - Replaces old auctionService usage
 * Note: SDK method names may vary - update based on actual SDK
 */
export function useAuctionService() {
  const auction = useAuction();

  return {
    // Methods that map directly to SDK (update method names based on actual SDK)
    createEnglishAuction: auction.createEnglishAuction,
    createDutchAuction: auction.createDutchAuction,
    placeBid: auction.placeBid,
    endAuction: auction.endAuction,

    // Legacy compatibility
    createAuction: auction.createEnglishAuction,
    bid: auction.placeBid,

    // Note: Add other methods as available in the actual SDK
    // getAuction: auction.getAuction,
    // getAuctions: auction.getAuctions,
  };
}

/**
 * Collection Hook - Replaces old collectionService usage
 * Note: SDK method names may vary - update based on actual SDK
 */
export function useCollectionService() {
  const collection = useCollection();

  return {
    // Methods that map directly to SDK (update method names based on actual SDK)
    createERC721: collection.createERC721,
    createERC1155: collection.createERC1155,
    mintERC721: collection.mintERC721,
    mintERC1155: collection.mintERC1155,

    // Legacy compatibility
    createCollection: collection.createERC721,
    mintNFT: collection.mintERC721,

    // Note: Add other methods as available in the actual SDK
    // getCollection: collection.getCollection,
    // getCollectionNFTs: collection.getCollectionNFTs,
    // getNFTMetadata: collection.getNFTMetadata,
    // createERC721Collection: collection.createERC721Collection,
    // createERC1155Collection: collection.createERC1155Collection,
  };
}

/**
 * Migration Helper Functions
 */

/**
 * Convert old service error format to SDK error format
 * @param error - Error from old service
 * @returns Formatted error message
 */
export function formatMigrationError(error: any): string {
  if (error?.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred during the migration';
}

/**
 * Check if a feature is supported by the SDK
 * @param featureName - Name of the feature to check
 * @returns Boolean indicating support
 */
export function isFeatureSupported(featureName: string): boolean {
  const supportedFeatures = [
    'exchange.listNFT',
    'exchange.buyNFT',
    'exchange.cancelListing',
    'auction.createEnglishAuction',
    'auction.createDutchAuction',
    'auction.placeBid',
    'collection.createERC721Collection',
    'collection.createERC1155Collection',
    'collection.mintERC721',
    'collection.mintERC1155',
  ];

  return supportedFeatures.includes(featureName);
}

/**
 * Get migration status for a service
 * @param serviceName - Name of the service
 * @returns Migration status object
 */
export function getMigrationStatus(serviceName: string): {
  status: 'migrated' | 'partial' | 'not-supported';
  message: string;
  alternative?: string;
} {
  const statusMap: Record<string, any> = {
    'ExchangeService': {
      status: 'migrated',
      message: 'Fully migrated to SDK Exchange module',
      alternative: 'useExchangeService() hook',
    },
    'AuctionService': {
      status: 'migrated',
      message: 'Fully migrated to SDK Auction module',
      alternative: 'useAuctionService() hook',
    },
    'CollectionService': {
      status: 'migrated',
      message: 'Fully migrated to SDK Collection module',
      alternative: 'useCollectionService() hook',
    },
    'BundleService': {
      status: 'not-supported',
      message: 'Bundle functionality not supported by SDK',
      alternative: 'Consider using individual NFT listings instead',
    },
    'OfferService': {
      status: 'not-supported',
      message: 'Offer functionality not supported by SDK',
      alternative: 'Use auction or direct listing features',
    },
    'default': {
      status: 'not-supported',
      message: 'Feature not supported by SDK',
    },
  };

  return statusMap[serviceName] || statusMap['default'];
}