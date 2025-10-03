"use client";

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

export function CollectionNFTs({ nfts }: CollectionNFTsProps) {
  const handleLike = (nftId: string) => {
    console.log("Like NFT:", nftId);
  };

  const handleBuy = (nftId: string) => {
    console.log("Buy NFT:", nftId);
  };

  const handleMakeOffer = (nftId: string) => {
    console.log("Make offer:", nftId);
  };

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
