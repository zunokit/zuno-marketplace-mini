"use client";

import { useRouter } from "next/navigation";
import { logger } from "@/lib/utils/logger";
import { CollectionCard } from "./CollectionCard";

interface Collection {
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

interface CollectionsGridProps {
  collections: Collection[];
  viewMode?: "grid" | "list";
}

export function CollectionsGrid({
  collections,
  viewMode = "grid",
}: CollectionsGridProps) {
  const router = useRouter();

  logger.info(
    "CollectionsGrid received collections",
    { count: collections.length, firstCollection: collections[0] },
    { component: "CollectionsGrid", action: "render" }
  );

  const handleFollow = (collectionAddress: string) => {
    logger.info(
      "Follow collection",
      { collectionAddress },
      { component: "CollectionsGrid", action: "followCollection" }
    );
  };

  const handleView = (collectionAddress: string) => {
    logger.info(
      "View collection",
      { collectionAddress },
      { component: "CollectionsGrid", action: "viewCollection" }
    );
    router.push(`/collections/${collectionAddress}`);
  };

  return (
    <div
      className={`grid gap-4 sm:gap-6 ${
        viewMode === "grid"
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1 max-w-4xl mx-auto"
      }`}
    >
      {collections.map((collection) => (
        <CollectionCard
          key={collection.address}
          collection={collection}
          variant={viewMode === "list" ? "featured" : "default"}
          onFollow={() => handleFollow(collection.address)}
          onView={() => handleView(collection.address)}
        />
      ))}
    </div>
  );
}
