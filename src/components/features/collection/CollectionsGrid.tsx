"use client";

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
  const handleFollow = (collectionAddress: string) => {
    console.log("Follow collection:", collectionAddress);
  };

  const handleView = (collectionAddress: string) => {
    console.log("View collection:", collectionAddress);
  };

  return (
    <div
      className={`grid gap-6 ${
        viewMode === "grid"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
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
