'use client';

/**
 * My NFTs Gallery Page
 * Migrated from frontend-foundry/src/components/NFTGallery.jsx
 * Simplified version with core features
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { useToast } from '@/hooks/use-toast';
import { ENV } from '@/lib/config/env';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Grid3x3,
  List,
  Filter
} from 'lucide-react';

interface NFTMetadata {
  tokenId: string;
  collectionAddress: string;
  collectionName: string;
  collectionSymbol: string;
  collectionType: 'ERC721' | 'ERC1155';
  owner: string;
  tokenURI: string;
  amount: string;
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  isListed?: boolean;
  listingPrice?: string;
}

export default function NFTGalleryPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // Redux state
  const { account, isConnected } = useAppSelector((state) => state.wallet);
  const { items: collections } = useAppSelector((state) => state.collections);
  const { items: nfts, loading: nftsLoading } = useAppSelector(
    (state) => state.nfts
  );

  // Local state
  const [allNFTs, setAllNFTs] = useState<NFTMetadata[]>([]);
  const [filteredNFTs, setFilteredNFTs] = useState<NFTMetadata[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ERC721' | 'ERC1155'>(
    'all'
  );
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'listed' | 'unlisted'
  >('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Load NFTs from Redux
   */
  useEffect(() => {
    loadNFTs();
  }, [nfts, collections, account]);

  /**
   * Apply filters
   */
  useEffect(() => {
    applyFilters();
  }, [
    allNFTs,
    selectedCollection,
    searchTerm,
    sortBy,
    typeFilter,
    statusFilter
  ]);

  /**
   * Load NFTs
   */
  const loadNFTs = async () => {
    try {
      // Real contract data from Redux
      const safeNfts = nfts || {};
      const safeCollections = Array.isArray(collections) ? collections : [];

      const loadedNFTs: NFTMetadata[] = Object.entries(safeNfts).flatMap(
        ([collectionAddress, nftList]) => {
          const collection = safeCollections.find(
            (c) => c.address === collectionAddress
          );
          if (!Array.isArray(nftList) || !collection) return [];

          return nftList.map((nft) => ({
            tokenId: nft.tokenId,
            collectionAddress,
            collectionName:
              collection.name || `Collection ${collectionAddress.slice(0, 6)}`,
            collectionSymbol: collection.symbol || 'NFT',
            collectionType: collection.type || 'ERC721',
            owner: nft.owner,
            tokenURI: nft.tokenURI || '',
            amount: nft.amount || '1',
            name: nft.name,
            description: nft.description,
            image: nft.image,
            attributes: nft.attributes,
            isListed: nft.isListed,
            listingPrice: nft.listingPrice
          }));
        }
      );

      setAllNFTs(loadedNFTs);
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast({
        title: 'Error Loading NFTs',
        description:
          error instanceof Error ? error.message : 'Failed to load NFTs',
        variant: 'destructive'
      });
    }
  };

  /**
   * Apply filters to NFTs
   */
  const applyFilters = () => {
    let filtered = [...allNFTs];

    // Collection filter
    if (selectedCollection !== 'all') {
      filtered = filtered.filter(
        (nft) => nft.collectionAddress === selectedCollection
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((nft) => nft.collectionType === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((nft) =>
        statusFilter === 'listed' ? nft.isListed : !nft.isListed
      );
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (nft) =>
          nft.name?.toLowerCase().includes(term) ||
          nft.description?.toLowerCase().includes(term) ||
          nft.tokenId.includes(term) ||
          nft.collectionName.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return parseInt(b.tokenId) - parseInt(a.tokenId);
        case 'oldest':
          return parseInt(a.tokenId) - parseInt(b.tokenId);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

    setFilteredNFTs(filtered);
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadNFTs();
      toast({
        title: 'Refreshed',
        description: 'NFT gallery has been refreshed'
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description:
          error instanceof Error ? error.message : 'Failed to refresh',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if wallet is connected
  if (!isConnected || !account) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to view your NFTs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My NFTs</h1>
            <p className="text-muted-foreground">
              View and manage your NFT collection
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              variant="outline"
              size="sm"
            >
              {viewMode === 'grid' ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3x3 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search NFTs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Collection Filter */}
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
              >
                <SelectTrigger id="collection">
                  <SelectValue placeholder="All Collections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collections</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem
                      key={collection.address}
                      value={collection.address}
                    >
                      {collection.name} ({collection.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={typeFilter}
                onValueChange={(v: any) => setTypeFilter(v)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ERC721">ERC721</SelectItem>
                  <SelectItem value="ERC1155">ERC1155</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v: any) => setStatusFilter(v)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="listed">Listed</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-4">
            <Label htmlFor="sort">Sort By:</Label>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger id="sort" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* NFT Grid/List */}
      {nftsLoading || isRefreshing ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNFTs.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No NFTs Found</AlertTitle>
          <AlertDescription>
            {searchTerm ||
            selectedCollection !== 'all' ||
            typeFilter !== 'all' ||
            statusFilter !== 'all'
              ? 'Try adjusting your filters or search term.'
              : "You don't have any NFTs yet. Start by minting some!"}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredNFTs.length} of {allNFTs.length} NFTs
          </div>

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {filteredNFTs.map((nft) => (
              <Card
                key={`${nft.collectionAddress}-${nft.tokenId}`}
                className="overflow-hidden"
              >
                {viewMode === 'grid' && nft.image && (
                  <div className="relative w-full h-64 bg-muted">
                    <Image
                      src={nft.image}
                      alt={nft.name || `NFT #${nft.tokenId}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {nft.name || `NFT #${nft.tokenId}`}
                      </CardTitle>
                      <CardDescription>
                        {nft.collectionName} ({nft.collectionSymbol})
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary">{nft.collectionType}</Badge>
                      {nft.isListed && <Badge variant="default">Listed</Badge>}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {nft.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {nft.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token ID:</span>
                      <span className="font-mono">#{nft.tokenId}</span>
                    </div>
                    {nft.amount !== '1' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span>{nft.amount}</span>
                      </div>
                    )}
                    {nft.isListed && nft.listingPrice && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-semibold">
                          {nft.listingPrice} ETH
                        </span>
                      </div>
                    )}
                  </div>

                  {nft.attributes && nft.attributes.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Attributes
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {nft.attributes.slice(0, 3).map((attr, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {attr.trait_type}: {attr.value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>

                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  {!nft.isListed && (
                    <Button size="sm" className="flex-1">
                      List for Sale
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
