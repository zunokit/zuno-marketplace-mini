"use client";

import { useQuery } from "@tanstack/react-query";
import { useZuno } from "zuno-marketplace-sdk/react";
import type { Auction } from "zuno-marketplace-sdk";

/**
 * Custom hook to fetch all active auctions
 * Calls AuctionFactory.getAllAuctions() and filters active ones
 */
export function useActiveAuctions(page = 1, pageSize = 20) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ["auctions", "active", page, pageSize],
    queryFn: async () => {
      const provider = sdk.getProvider();
      if (!provider) return { items: [], total: 0, page, pageSize, hasMore: false };

      const factory = await sdk.contractRegistry.getContract(
        "AuctionFactory",
        String(sdk.getConfig().network),
        provider
      );

      const auctionIds: string[] = await factory.getAllAuctions();
      if (!auctionIds.length) return { items: [], total: 0, page, pageSize, hasMore: false };

      const auctions = await Promise.all(
        auctionIds.map(async (id) => {
          try {
            return await sdk.auction.getAuctionFromFactory(id);
          } catch {
            return null;
          }
        })
      );

      const activeAuctions = auctions
        .filter((a): a is Auction => a !== null && a.status === "active")
        .sort((a, b) => b.startTime - a.startTime);

      const total = activeAuctions.length;
      const start = (page - 1) * pageSize;
      const items = activeAuctions.slice(start, start + pageSize);

      return { items, total, page, pageSize, hasMore: start + pageSize < total };
    },
  });
}

/**
 * Custom hook to fetch auctions by seller
 * Calls AuctionFactory.getUserAuctions(seller)
 */
export function useAuctionsBySeller(seller?: string, page = 1, pageSize = 20) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ["auctions", "seller", seller, page, pageSize],
    queryFn: async () => {
      if (!seller) return { items: [], total: 0, page, pageSize, hasMore: false };

      const provider = sdk.getProvider();
      if (!provider) return { items: [], total: 0, page, pageSize, hasMore: false };

      const factory = await sdk.contractRegistry.getContract(
        "AuctionFactory",
        String(sdk.getConfig().network),
        provider
      );

      const auctionIds: string[] = await factory.getUserAuctions(seller);
      if (!auctionIds.length) return { items: [], total: 0, page, pageSize, hasMore: false };

      const total = auctionIds.length;
      const start = (page - 1) * pageSize;
      const paginatedIds = auctionIds.slice(start, start + pageSize);

      const auctions = await Promise.all(
        paginatedIds.map(async (id) => {
          try {
            return await sdk.auction.getAuctionFromFactory(id);
          } catch {
            return null;
          }
        })
      );

      const items = auctions
        .filter((a): a is Auction => a !== null)
        .sort((a, b) => b.startTime - a.startTime);

      return { items, total, page, pageSize, hasMore: start + pageSize < total };
    },
    enabled: !!seller,
  });
}
