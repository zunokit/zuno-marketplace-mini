"use client";

import { logger } from "@/lib/utils/logger";
import { NFTCard } from "./NFTCard";

interface NFT {
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

interface CollectionNFTsProps {
  nfts: NFT[];
}

export function CollectionNFTs({ nfts = [] }: CollectionNFTsProps) {
  const handleLike = (nftId: string) => {
    logger.info("Like NFT", { nftId }, { component: "CollectionNFTs", action: "likeNFT" });
  };

  const handleBuy = (nftId: string) => {
    logger.info("Buy NFT", { nftId }, { component: "CollectionNFTs", action: "buyNFT" });
  };

  const handleMakeOffer = (nftId: string) => {
    logger.info("Make offer", { nftId }, { component: "CollectionNFTs", action: "makeOffer" });
  };

  if (!nfts || nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No NFTs found in this collection</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {nfts.map((nft) => (
        <NFTCard
          key={nft.id}
          nft={nft}
          onLike={() => handleLike(nft.id)}
          onBuy={() => handleBuy(nft.id)}
          onMakeOffer={() => handleMakeOffer(nft.id)}
        />
      ))}
    </div>
  );
}
