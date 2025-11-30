"use client";

import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Package, RefreshCw, Gavel, Palette, User, XCircle, Clock, TrendingDown, Tag } from "lucide-react";
import Link from "next/link";
import { useCreatedCollections, useCollectionInfo, useAuction, useExchange, useListingsBySeller } from "zuno-marketplace-sdk/react";
import { useAuctionsBySeller } from "@/hooks/useAuctionQueries";
import { useAccount } from "wagmi";
import { toast } from "sonner";

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
  isInAuction,
}: { 
  collectionAddress: string;
  tokenId: string;
  amount: number;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  isInAuction?: boolean;
}) {
  const { data: info } = useCollectionInfo(collectionAddress);

  return (
    <Card className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${isInAuction ? 'opacity-60' : ''}`}>
      <div className="relative">
        <div className="absolute top-2 left-2 z-10">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onSelect}
            className="bg-background"
            disabled={isInAuction}
          />
        </div>
        {isInAuction && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="destructive" className="text-xs">
              <Gavel className="h-3 w-3 mr-1" />
              In Auction
            </Badge>
          </div>
        )}
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
  auctionedNFTs,
}: {
  collection: CollectionWithTokens;
  selectedTokens: Set<string>;
  onSelectToken: (tokenId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  auctionedNFTs: Set<string>;
}) {
  const { data: info } = useCollectionInfo(collection.address);
  const availableTokens = collection.tokens.filter(t => !auctionedNFTs.has(`${collection.address.toLowerCase()}:${t.tokenId}`));
  const allSelected = availableTokens.length > 0 && availableTokens.every(t => selectedTokens.has(`${collection.address}:${t.tokenId}`));
  const someSelected = availableTokens.some(t => selectedTokens.has(`${collection.address}:${t.tokenId}`));

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Checkbox 
            checked={allSelected}
            onCheckedChange={onSelectAll}
            className={someSelected && !allSelected ? 'opacity-50' : ''}
            disabled={availableTokens.length === 0}
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
        {collection.tokens.map((token) => {
          const isInAuction = auctionedNFTs.has(`${collection.address.toLowerCase()}:${token.tokenId}`);
          return (
            <NFTCard
              key={`${collection.address}:${token.tokenId}`}
              collectionAddress={collection.address}
              tokenId={token.tokenId}
              amount={token.amount}
              isSelected={selectedTokens.has(`${collection.address}:${token.tokenId}`)}
              onSelect={(selected) => onSelectToken(token.tokenId, selected)}
              isInAuction={isInAuction}
            />
          );
        })}
      </div>
    </div>
  );
}

function AuctionModal({
  open,
  onClose,
  selectedTokens,
  userCollections,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  selectedTokens: Set<string>;
  userCollections: CollectionWithTokens[];
  onSuccess: () => void;
}) {
  const { createEnglishAuction, createDutchAuction, batchCreateEnglishAuction, batchCreateDutchAuction } = useAuction();
  const [auctionType, setAuctionType] = useState<'english' | 'dutch'>('english');
  const [startPrice, setStartPrice] = useState('0.1');
  const [reservePrice, setReservePrice] = useState('0.05');
  const [duration, setDuration] = useState('86400');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Group selected tokens by collection for batch processing
  const groupedByCollection = useMemo(() => {
    const groups: Map<string, { tokenIds: string[]; type: 'ERC721' | 'ERC1155' }> = new Map();
    selectedTokens.forEach(key => {
      const [collection, tokenId] = key.split(':');
      const col = userCollections.find(c => c.address === collection);
      if (col) {
        const existing = groups.get(collection);
        if (existing) {
          existing.tokenIds.push(tokenId);
        } else {
          groups.set(collection, { tokenIds: [tokenId], type: col.type });
        }
      }
    });
    return groups;
  }, [selectedTokens, userCollections]);

  const totalNFTs = useMemo(() => {
    let count = 0;
    groupedByCollection.forEach(g => count += g.tokenIds.length);
    return count;
  }, [groupedByCollection]);

  const handleCreateAuctions = async () => {
    if (groupedByCollection.size === 0) return;
    
    setIsProcessing(true);
    setProgress({ current: 0, total: groupedByCollection.size });

    try {
      let completedGroups = 0;
      let totalCreated = 0;

      for (const [collectionAddress, group] of groupedByCollection) {
        try {
          if (group.tokenIds.length === 1) {
            // Single NFT - use individual creation
            if (auctionType === 'english') {
              await createEnglishAuction.mutateAsync({
                collectionAddress,
                tokenId: group.tokenIds[0],
                amount: 1,
                startingBid: startPrice,
                reservePrice: reservePrice,
                duration: parseInt(duration),
              });
            } else {
              await createDutchAuction.mutateAsync({
                collectionAddress,
                tokenId: group.tokenIds[0],
                amount: 1,
                startPrice: startPrice,
                endPrice: reservePrice,
                duration: parseInt(duration),
              });
            }
            totalCreated += 1;
            toast.success(`Auction created for #${group.tokenIds[0]}`);
          } else {
            // Multiple NFTs from same collection - use batch creation (1 tx!)
            if (auctionType === 'english') {
              const result = await batchCreateEnglishAuction.mutateAsync({
                collectionAddress,
                tokenIds: group.tokenIds,
                startingBid: startPrice,
                reservePrice: reservePrice,
                duration: parseInt(duration),
              });
              totalCreated += result.auctionIds.length;
              toast.success(`Batch created ${result.auctionIds.length} English auctions!`);
            } else {
              const result = await batchCreateDutchAuction.mutateAsync({
                collectionAddress,
                tokenIds: group.tokenIds,
                startPrice: startPrice,
                endPrice: reservePrice,
                duration: parseInt(duration),
              });
              totalCreated += result.auctionIds.length;
              toast.success(`Batch created ${result.auctionIds.length} Dutch auctions!`);
            }
          }
          completedGroups++;
          setProgress({ current: completedGroups, total: groupedByCollection.size });
        } catch (err) {
          const tokenList = group.tokenIds.length > 3 
            ? `${group.tokenIds.slice(0, 3).join(', ')}...` 
            : group.tokenIds.join(', ');
          toast.error(`Failed for collection tokens [${tokenList}]: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (totalCreated === totalNFTs) {
        toast.success(`All ${totalCreated} auctions created successfully!`);
        onSuccess();
      } else if (totalCreated > 0) {
        toast.warning(`${totalCreated}/${totalNFTs} auctions created`);
        onSuccess();
      }
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isBatchMode = totalNFTs > 1;
  const numTransactions = groupedByCollection.size;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isBatchMode ? `Batch Auction (${totalNFTs} NFTs)` : 'Create Auction'}
          </DialogTitle>
        </DialogHeader>

        {isBatchMode && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium text-primary">
              {numTransactions === 1 
                ? '1 transaction required' 
                : `${numTransactions} transactions required`}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              NFTs grouped by collection for efficient batch creation
            </p>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Auction Type</Label>
            <Select value={auctionType} onValueChange={(v: 'english' | 'dutch') => setAuctionType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English Auction (Ascending)</SelectItem>
                <SelectItem value="dutch">Dutch Auction (Descending)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{auctionType === 'english' ? 'Starting Bid' : 'Start Price'} (ETH)</Label>
            <Input type="number" step="0.01" value={startPrice} onChange={(e) => setStartPrice(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{auctionType === 'english' ? 'Reserve Price' : 'End Price'} (ETH)</Label>
            <Input type="number" step="0.01" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3600">1 Hour</SelectItem>
                <SelectItem value="21600">6 Hours</SelectItem>
                <SelectItem value="43200">12 Hours</SelectItem>
                <SelectItem value="86400">1 Day</SelectItem>
                <SelectItem value="259200">3 Days</SelectItem>
                <SelectItem value="604800">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isProcessing && (
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{progress.current} / {progress.total} completed</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleCreateAuctions} disabled={isProcessing}>
            {isProcessing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
            ) : (
              <><Gavel className="h-4 w-4 mr-2" />{isBatchMode ? `Create ${totalNFTs} Auctions` : 'Create Auction'}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CollectionCard({ address, type }: { address: string; type: "ERC721" | "ERC1155" }) {
  const { data: info, isLoading } = useCollectionInfo(address);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="h-32 bg-muted animate-pulse" />
        <CardContent className="p-4">
          <div className="h-4 bg-muted rounded animate-pulse mb-2" />
          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/collections/${address}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Palette className="h-12 w-12 text-primary/30" />
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold truncate">{info?.name || "Unknown"}</h3>
            <Badge variant="outline">{type}</Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate">{address}</p>
          {info && (
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>Supply: {info.totalSupply?.toString() || 0}/{info.maxSupply?.toString() || '∞'}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function MyNFTsTab() {
  const { address } = useAccount();
  const { data: allCollections, isLoading: loadingCollections, refetch } = useCreatedCollections();
  const { data: userAuctions, refetch: refetchAuctions } = useAuctionsBySeller(address, 1, 100);
  const [userCollections, setUserCollections] = useState<CollectionWithTokens[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [auctionModalOpen, setAuctionModalOpen] = useState(false);

  const auctionedNFTs = useMemo(() => {
    const set = new Set<string>();
    if (userAuctions?.items) {
      userAuctions.items.filter(a => a.status === 'active').forEach(auction => {
        set.add(`${auction.collectionAddress.toLowerCase()}:${auction.tokenId}`);
      });
    }
    return set;
  }, [userAuctions]);

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
        } catch { /* Skip */ }
      }

      setUserCollections(results);
      setIsLoadingTokens(false);
    };

    fetchUserTokens();
  }, [allCollections, address]);

  const totalNFTs = useMemo(() => userCollections.reduce((sum, c) => sum + c.tokens.length, 0), [userCollections]);
  const availableNFTs = useMemo(() => {
    return userCollections.reduce((sum, c) => {
      return sum + c.tokens.filter(t => !auctionedNFTs.has(`${c.address.toLowerCase()}:${t.tokenId}`)).length;
    }, 0);
  }, [userCollections, auctionedNFTs]);

  const handleSelectToken = (collectionAddress: string, tokenId: string, selected: boolean) => {
    if (auctionedNFTs.has(`${collectionAddress.toLowerCase()}:${tokenId}`)) return;
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
        if (auctionedNFTs.has(`${collection.address.toLowerCase()}:${t.tokenId}`)) return;
        const key = `${collection.address}:${t.tokenId}`;
        if (selected) next.add(key); else next.delete(key);
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTokens.size === availableNFTs) {
      setSelectedTokens(new Set());
    } else {
      const all = new Set<string>();
      userCollections.forEach(c => c.tokens.forEach(t => {
        if (!auctionedNFTs.has(`${c.address.toLowerCase()}:${t.tokenId}`)) {
          all.add(`${c.address}:${t.tokenId}`);
        }
      }));
      setSelectedTokens(all);
    }
  };

  const isLoading = loadingCollections || isLoadingTokens;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-muted-foreground">
          {isLoading ? 'Loading...' : `${totalNFTs} NFTs in ${userCollections.length} collections`}
          {auctionedNFTs.size > 0 && ` (${auctionedNFTs.size} in auction)`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetch(); refetchAuctions(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          {availableNFTs > 0 && (
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedTokens.size === availableNFTs ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
      </div>

      {selectedTokens.size > 0 && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="font-medium">{selectedTokens.size} NFT(s) selected</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedTokens(new Set())}>Clear</Button>
            <Button size="sm" onClick={() => setAuctionModalOpen(true)}>
              <Gavel className="h-4 w-4 mr-2" />
              {selectedTokens.size > 1 ? 'Batch Auction' : 'Create Auction'}
            </Button>
          </div>
        </div>
      )}

      <AuctionModal
        open={auctionModalOpen}
        onClose={() => setAuctionModalOpen(false)}
        selectedTokens={selectedTokens}
        userCollections={userCollections}
        onSuccess={() => { setSelectedTokens(new Set()); setAuctionModalOpen(false); refetchAuctions(); }}
      />

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
          auctionedNFTs={auctionedNFTs}
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
  );
}

function MyCollectionsTab() {
  const { address } = useAccount();
  const { data: allCollections, isLoading, refetch } = useCreatedCollections();

  const myCollections = useMemo(() => {
    if (!allCollections || !address) return [];
    return allCollections.filter(c => c.creator?.toLowerCase() === address.toLowerCase());
  }, [allCollections, address]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {isLoading ? 'Loading...' : `${myCollections.length} collections created`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/collections/create">Create Collection</Link>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && myCollections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {myCollections.map((col) => (
            <CollectionCard key={col.address} address={col.address} type={col.type} />
          ))}
        </div>
      )}

      {!isLoading && myCollections.length === 0 && (
        <div className="text-center py-12">
          <Palette className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground mb-4">No collections created</p>
          <Button asChild><Link href="/collections/create">Create Collection</Link></Button>
        </div>
      )}
    </div>
  );
}

interface AuctionItem {
  id: string;
  collectionAddress: string;
  tokenId: string;
  type: 'english' | 'dutch';
  status: string;
  startPrice?: string;
  currentBid?: string;
  endTime: number;
}

function AuctionCard({
  auction,
  isSelected,
  onSelect,
}: {
  auction: AuctionItem;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}) {
  const { data: info } = useCollectionInfo(auction.collectionAddress);
  const timeLeft = Math.max(0, auction.endTime - Math.floor(Date.now() / 1000));
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);

  return (
    <Card className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-destructive' : ''}`}>
      <div className="relative">
        <div className="absolute top-2 left-2 z-10">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onSelect}
            className="bg-background"
          />
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Badge variant={auction.type === 'english' ? 'default' : 'secondary'} className="text-xs">
            {auction.type === 'english' ? <Gavel className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {auction.type}
          </Badge>
        </div>
        <div className="h-28 bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center">
          <span className="text-2xl font-bold text-orange-500/30">#{auction.tokenId}</span>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate mb-1">{info?.name || 'Loading...'}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeLeft > 0 ? `${hours}h ${minutes}m` : 'Ended'}
          </span>
          <span>{auction.currentBid || auction.startPrice} ETH</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MyAuctionsTab() {
  const { address } = useAccount();
  const { data: userAuctions, isLoading, refetch } = useAuctionsBySeller(address, 1, 100);
  const { cancelAuction, batchCancelAuction } = useAuction();
  const [selectedAuctions, setSelectedAuctions] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const activeAuctions = useMemo(() => {
    if (!userAuctions?.items) return [];
    return userAuctions.items.filter((a: AuctionItem) => a.status === 'active');
  }, [userAuctions]);

  const handleSelectAuction = (auctionId: string, selected: boolean) => {
    setSelectedAuctions(prev => {
      const next = new Set(prev);
      if (selected) next.add(auctionId); else next.delete(auctionId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedAuctions.size === activeAuctions.length) {
      setSelectedAuctions(new Set());
    } else {
      setSelectedAuctions(new Set(activeAuctions.map((a: AuctionItem) => a.id)));
    }
  };

  const handleCancelSelected = async () => {
    if (selectedAuctions.size === 0) return;
    
    const toCancel = Array.from(selectedAuctions);
    setIsProcessing(true);

    try {
      const { cancelledCount } = await batchCancelAuction.mutateAsync(toCancel);
      toast.success(`${cancelledCount} auction(s) cancelled in 1 transaction!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel auctions');
    }

    setSelectedAuctions(new Set());
    setIsProcessing(false);
    refetch();
  };

  const handleCancelSingle = async (auctionId: string) => {
    try {
      await cancelAuction.mutateAsync({ auctionId });
      toast.success('Auction cancelled!');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel auction');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-muted-foreground">
          {isLoading ? 'Loading...' : `${activeAuctions.length} active auctions`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          {activeAuctions.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedAuctions.size === activeAuctions.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
      </div>

      {selectedAuctions.size > 0 && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border border-destructive/50 rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="font-medium text-destructive">{selectedAuctions.size} auction(s) selected</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedAuctions(new Set())}>Clear</Button>
            <Button variant="destructive" size="sm" onClick={handleCancelSelected} disabled={isProcessing}>
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cancelling...</>
              ) : (
                <><XCircle className="h-4 w-4 mr-2" />Cancel {selectedAuctions.size} Auction{selectedAuctions.size > 1 ? 's' : ''} (1 tx)</>
              )}
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading your auctions...</span>
        </div>
      )}

      {!isLoading && activeAuctions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {activeAuctions.map((auction: AuctionItem) => (
            <div key={auction.id} className="relative group">
              <AuctionCard
                auction={auction}
                isSelected={selectedAuctions.has(auction.id)}
                onSelect={(selected) => handleSelectAuction(auction.id, selected)}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                <Button size="sm" variant="secondary" asChild>
                  <Link href={`/auctions/${auction.id}`}>View</Link>
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleCancelSingle(auction.id)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && activeAuctions.length === 0 && (
        <div className="text-center py-12">
          <Gavel className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground mb-4">No active auctions</p>
          <Button asChild><Link href="/profile">Create Auction from My NFTs</Link></Button>
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  isSelected,
  onSelect,
}: {
  listing: { id: string; collectionAddress: string; tokenId: string; price: string; endTime: number; status: string };
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}) {
  const { data: info } = useCollectionInfo(listing.collectionAddress);
  const timeLeft = Math.max(0, listing.endTime - Math.floor(Date.now() / 1000));
  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);

  return (
    <Card className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-destructive' : ''}`}>
      <div className="relative">
        <div className="absolute top-2 left-2 z-10">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onSelect}
            className="bg-background"
          />
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="text-xs bg-background">
            <Tag className="h-3 w-3 mr-1" />
            Listed
          </Badge>
        </div>
        <div className="h-28 bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
          <span className="text-2xl font-bold text-green-500/30">#{listing.tokenId}</span>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate mb-1">{info?.name || 'Loading...'}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeLeft > 0 ? (days > 0 ? `${days}d ${hours}h` : `${hours}h`) : 'Expired'}
          </span>
          <span className="font-medium text-foreground">{listing.price} ETH</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MyListingsTab() {
  const { address } = useAccount();
  const { data, isLoading, refetch } = useListingsBySeller(address);
  const userListings = (data || []) as Array<{ id: string; collectionAddress: string; tokenId: string; price: string; endTime: number; status: string }>;
  const { cancelListing, batchCancelListing } = useExchange();
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const activeListings = useMemo(() => {
    return userListings.filter((l) => l.status === 'active');
  }, [userListings]);

  const handleSelectListing = (listingId: string, selected: boolean) => {
    setSelectedListings(prev => {
      const next = new Set(prev);
      if (selected) next.add(listingId); else next.delete(listingId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedListings.size === activeListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(activeListings.map((l: ListingItem) => l.id)));
    }
  };

  const handleCancelSelected = async () => {
    if (selectedListings.size === 0) return;
    
    const toCancel = Array.from(selectedListings);
    setIsProcessing(true);

    try {
      if (toCancel.length === 1) {
        await cancelListing.mutateAsync({ listingId: toCancel[0] });
        toast.success('Listing cancelled!');
      } else {
        await batchCancelListing.mutateAsync({ listingIds: toCancel });
        toast.success(`${toCancel.length} listing(s) cancelled in 1 transaction!`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel listings');
    }

    setSelectedListings(new Set());
    setIsProcessing(false);
    refetch();
  };

  const handleCancelSingle = async (listingId: string) => {
    try {
      await cancelListing.mutateAsync({ listingId });
      toast.success('Listing cancelled!');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel listing');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-muted-foreground">
          {isLoading ? 'Loading...' : `${activeListings.length} active listings`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          {activeListings.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedListings.size === activeListings.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
      </div>

      {selectedListings.size > 0 && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border border-destructive/50 rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="font-medium text-destructive">{selectedListings.size} listing(s) selected</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedListings(new Set())}>Clear</Button>
            <Button variant="destructive" size="sm" onClick={handleCancelSelected} disabled={isProcessing}>
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cancelling...</>
              ) : (
                <><XCircle className="h-4 w-4 mr-2" />Cancel {selectedListings.size} Listing{selectedListings.size > 1 ? 's' : ''} {selectedListings.size > 1 ? '(1 tx)' : ''}</>
              )}
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading your listings...</span>
        </div>
      )}

      {!isLoading && activeListings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {activeListings.map((listing: ListingItem) => (
            <div key={listing.id} className="relative group">
              <ListingCard
                listing={listing}
                isSelected={selectedListings.has(listing.id)}
                onSelect={(selected) => handleSelectListing(listing.id, selected)}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleCancelSingle(listing.id)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && activeListings.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground mb-4">No active listings</p>
          <Button asChild><Link href="/profile">List NFTs from My NFTs</Link></Button>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Connect Wallet</h1>
          <p className="text-muted-foreground">Connect your wallet to view your profile</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <User className="h-8 w-8" />
            My Profile
          </h1>
          <p className="text-muted-foreground font-mono">{address}</p>
        </div>

        <Tabs defaultValue="nfts" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="nfts" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              My NFTs
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              My Listings
            </TabsTrigger>
            <TabsTrigger value="auctions" className="flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              My Auctions
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              My Collections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nfts">
            <MyNFTsTab />
          </TabsContent>

          <TabsContent value="listings">
            <MyListingsTab />
          </TabsContent>

          <TabsContent value="auctions">
            <MyAuctionsTab />
          </TabsContent>

          <TabsContent value="collections">
            <MyCollectionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
