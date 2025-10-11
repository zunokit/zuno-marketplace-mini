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

interface TrendingCollectionsProps {
  collections: Collection[];
}

export function TrendingCollections({ collections }: TrendingCollectionsProps) {
  const handleFollow = (collectionAddress: string) => {
    console.log("Follow collection:", collectionAddress);
  };

  const handleView = (collectionAddress: string) => {
    console.log("View collection:", collectionAddress);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.address}
          collection={collection}
          variant="featured"
          onFollow={() => handleFollow(collection.address)}
          onView={() => handleView(collection.address)}
        />
      ))}
    </div>
  );
}
