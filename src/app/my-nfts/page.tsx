"use client";

import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCreatedCollections, useCollectionInfo } from "zuno-marketplace-sdk/react";
import { useAccount } from "wagmi";

interface CollectionWithTokens {
  address: string;
  type: 'ERC721' | 'ERC1155';
  tokens: Array<{ tokenId: string; amount: number }>;
}

function NFTCard({ 
  collectionAddress, 
  tokenId, 
  amount,
  isSelected,
  onSelect,
}: { 
  collectionAddress: string;
  tokenId: string;
  amount: number;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}) {
  const { data: info } = useCollectionInfo(collectionAddress);

  return (
    <Card className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="relative">
        <div className="absolute top-2 left-2 z-10">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onSelect}
            className="bg-background"
          />
        </div>
        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary/30">#{tokenId}</span>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium truncate">{info?.name || 'Loading...'}</p>
          {amount > 1 && <Badge variant="secondary" className="text-xs">x{amount}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {collectionAddress.slice(0, 8)}...{collectionAddress.slice(-6)}
        </p>
      </CardContent>
    </Card>
  );
}

function CollectionGroup({
  collection,
  selectedTokens,
  onSelectToken,
  onSelectAll,
}: {
  collection: CollectionWithTokens;
  selectedTokens: Set<string>;
  onSelectToken: (tokenId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}) {
  const { data: info } = useCollectionInfo(collection.address);
  const allSelected = collection.tokens.every(t => selectedTokens.has(`${collection.address}:${t.tokenId}`));
  const someSelected = collection.tokens.some(t => selectedTokens.has(`${collection.address}:${t.tokenId}`));

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Checkbox 
            checked={allSelected}
            onCheckedChange={onSelectAll}
            className={someSelected && !allSelected ? 'opacity-50' : ''}
          />
          <div>
            <h3 className="font-semibold">{info?.name || 'Loading...'}</h3>
            <p className="text-xs text-muted-foreground font-mono">
              {collection.address.slice(0, 10)}...{collection.address.slice(-8)}
            </p>
          </div>
          <Badge variant="outline">{collection.type}</Badge>
          <Badge variant="secondary">{collection.tokens.length} NFTs</Badge>
        </div>
        <Link href={`/collections/${collection.address}`}>
          <Button variant="ghost" size="sm">View Collection</Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {collection.tokens.map((token) => (
          <NFTCard
            key={`${collection.address}:${token.tokenId}`}
            collectionAddress={collection.address}
            tokenId={token.tokenId}
            amount={token.amount}
            isSelected={selectedTokens.has(`${collection.address}:${token.tokenId}`)}
            onSelect={(selected) => onSelectToken(token.tokenId, selected)}
          />
        ))}
      </div>
    </div>
  );
}

export default function MyNFTsPage() {
  const { address, isConnected } = useAccount();
  const { data: allCollections, isLoading: loadingCollections, refetch } = useCreatedCollections();
  const [userCollections, setUserCollections] = useState<CollectionWithTokens[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!allCollections || !address) return;

    const fetchUserTokens = async () => {
      setIsLoadingTokens(true);
      const results: CollectionWithTokens[] = [];

      for (const col of allCollections) {
        try {
          const res = await fetch(`/api/user-tokens?collection=${col.address}&user=${address}`);
          if (res.ok) {
            const tokens = await res.json();
            if (tokens.length > 0) {
              results.push({ address: col.address, type: col.type, tokens });
            }
          }
        } catch {
          // Skip
        }
      }

      setUserCollections(results);
      setIsLoadingTokens(false);
    };

    fetchUserTokens();
  }, [allCollections, address]);

  const totalNFTs = useMemo(() => {
    return userCollections.reduce((sum, c) => sum + c.tokens.length, 0);
  }, [userCollections]);

  const handleSelectToken = (collectionAddress: string, tokenId: string, selected: boolean) => {
    const key = `${collectionAddress}:${tokenId}`;
    setSelectedTokens(prev => {
      const next = new Set(prev);
      if (selected) next.add(key); else next.delete(key);
      return next;
    });
  };

  const handleSelectAllInCollection = (collection: CollectionWithTokens, selected: boolean) => {
    setSelectedTokens(prev => {
      const next = new Set(prev);
      collection.tokens.forEach(t => {
        const key = `${collection.address}:${t.tokenId}`;
        if (selected) next.add(key); else next.delete(key);
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTokens.size === totalNFTs) {
      setSelectedTokens(new Set());
    } else {
      const all = new Set<string>();
      userCollections.forEach(c => c.tokens.forEach(t => all.add(`${c.address}:${t.tokenId}`)));
      setSelectedTokens(all);
    }
  };

  const isLoading = loadingCollections || isLoadingTokens;

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Connect Wallet</h1>
          <p className="text-muted-foreground">Connect your wallet to view your NFTs</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My NFTs</h1>
            <p className="text-muted-foreground">
              {isLoading ? 'Loading...' : `${totalNFTs} NFTs in ${userCollections.length} collections`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {totalNFTs > 0 && (
              <Button variant="outline" onClick={handleSelectAll}>
                {selectedTokens.size === totalNFTs ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </div>

        {selectedTokens.size > 0 && (
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border rounded-lg p-4 mb-6 flex items-center justify-between">
            <p className="font-medium">{selectedTokens.size} NFT(s) selected</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedTokens(new Set())}>Clear</Button>
              <Button disabled>List for Sale</Button>
              <Button disabled>Transfer</Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading your NFTs...</span>
          </div>
        )}

        {!isLoading && userCollections.length > 0 && userCollections.map((collection) => (
          <CollectionGroup
            key={collection.address}
            collection={collection}
            selectedTokens={selectedTokens}
            onSelectToken={(tokenId, selected) => handleSelectToken(collection.address, tokenId, selected)}
            onSelectAll={(selected) => handleSelectAllInCollection(collection, selected)}
          />
        ))}

        {!isLoading && userCollections.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">No NFTs found</p>
            <Button asChild><Link href="/collections">Browse Collections</Link></Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
