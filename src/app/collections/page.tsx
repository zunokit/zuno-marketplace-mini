"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import {
  collectionService,
  listingHistoryTrackerService,
  nftMetadataService,
  userHubService
} from "@/lib/services/contracts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Grid,
  List,
  Search,
  Filter,
  Plus,
  CheckCircle,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Info,
  ExternalLink,
  Copy,
  Loader2,
  ShieldCheck,
  Star,
  Zap,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatEther } from "ethers";

interface Collection {
  address: string;
  name: string;
  symbol: string;
  owner: string;
  tokenType: "ERC721" | "ERC1155";
  isVerified: boolean;
  metadata?: {
    description?: string;
    image?: string;
    website?: string;
    twitter?: string;
  };
  stats?: {
    totalSupply: number;
    floorPrice: bigint;
    totalVolume: bigint;
    totalSales: number;
    averagePrice: bigint;
    activeListings: number;
  };
}

export default function CollectionsPage() {
  const { address, isConnected } = useAccount();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVerified, setFilterVerified] = useState(false);
  const [sortBy, setSortBy] = useState<"volume" | "floor" | "sales">("volume");
  
  // Create collection dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionSymbol, setCollectionSymbol] = useState("");
  const [collectionType, setCollectionType] = useState<"ERC721" | "ERC1155">("ERC721");
  const [maxSupply, setMaxSupply] = useState("10000");
  const [royaltyBps, setRoyaltyBps] = useState("250"); // 2.5%
  const [baseUri, setBaseUri] = useState("");
  const [creating, setCreating] = useState(false);
  
  // Verification dialog
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [verificationData, setVerificationData] = useState({
    website: "",
    twitter: "",
    description: ""
  });
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      logger.info("Fetching collections from blockchain", null, {
        component: "CollectionsPage",
        action: "fetchCollections"
      });

      // Get factory addresses
      const erc721FactoryAddr = await userHubService.getERC721Factory();
      const erc1155FactoryAddr = await userHubService.getERC1155Factory();
      
      // Get factory contracts
      const erc721Factory = await collectionService.getERC721FactoryContract();
      const erc1155Factory = await collectionService.getERC1155FactoryContract();

      // Get created collections from events
      const erc721Filter = erc721Factory.filters.CollectionCreated();
      const erc1155Filter = erc1155Factory.filters.CollectionCreated();
      
      const [erc721Events, erc1155Events] = await Promise.all([
        erc721Factory.queryFilter(erc721Filter),
        erc1155Factory.queryFilter(erc1155Filter)
      ]);

      // Process collections
      const collectionPromises = [
        ...erc721Events.map(async (event) => {
          const collectionAddress = (event as any).args?.[0];
          if (!collectionAddress) return null;
          return fetchCollectionData(collectionAddress, "ERC721");
        }),
        ...erc1155Events.map(async (event) => {
          const collectionAddress = (event as any).args?.[0];
          if (!collectionAddress) return null;
          return fetchCollectionData(collectionAddress, "ERC1155");
        })
      ];

      const collectionData = (await Promise.all(collectionPromises))
        .filter(c => c !== null) as Collection[];

      // Sort collections
      const sorted = sortCollections(collectionData, sortBy);
      setCollections(sorted);
      
      logger.success(`Fetched ${sorted.length} collections`, null, {
        component: "CollectionsPage",
        action: "fetchCollections"
      });
    } catch (error) {
      logger.error("Failed to fetch collections", error, {
        component: "CollectionsPage",
        action: "fetchCollections"
      });
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionData = async (
    collectionAddress: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<Collection | null> => {
    try {
      // Get collection contract
      const contract = new ethers.Contract(
        collectionAddress,
        ["function name() view returns (string)",
         "function symbol() view returns (string)",
         "function owner() view returns (address)",
         "function totalSupply() view returns (uint256)"],
        await collectionService.getProvider()
      );

      const [name, symbol, owner] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.owner()
      ]);

      // Get metadata
      const metadata = await nftMetadataService.getCollectionMetadata(collectionAddress);

      // Get collection stats from history tracker
      let stats;
      try {
        const historyTracker = await listingHistoryTrackerService.getHistoryTrackerContract();
        const collectionStats = await historyTracker.collectionStats(collectionAddress);
        
        stats = {
          totalSupply: 0, // Will update below
          floorPrice: collectionStats.floorPrice,
          totalVolume: collectionStats.totalVolume,
          totalSales: Number(collectionStats.totalSales),
          averagePrice: collectionStats.averagePrice,
          activeListings: Number(collectionStats.activeListings)
        };

        // Try to get total supply
        try {
          const supply = await contract.totalSupply();
          stats.totalSupply = Number(supply);
        } catch {}
      } catch (error) {
        logger.warn("Failed to fetch collection stats", error, {
          component: "CollectionsPage",
          action: "fetchCollectionData",
          collection: collectionAddress
        });
      }

      // Check verification status
      const isVerified = await collectionService.isCollectionVerified(collectionAddress);

      return {
        address: collectionAddress,
        name,
        symbol,
        owner,
        tokenType,
        isVerified,
        metadata: metadata ? {
          description: metadata.description,
          image: metadata.image,
          website: metadata.external_link,
          twitter: (metadata as any).twitter_username || (metadata as any).twitter
        } : undefined,
        stats
      };
    } catch (error) {
      logger.warn("Failed to fetch collection data", error, {
        component: "CollectionsPage",
        action: "fetchCollectionData",
        collection: collectionAddress
      });
      return null;
    }
  };

  const sortCollections = (collections: Collection[], sortBy: string): Collection[] => {
    return [...collections].sort((a, b) => {
      switch (sortBy) {
        case "volume":
          return Number(b.stats?.totalVolume || 0n) - Number(a.stats?.totalVolume || 0n);
        case "floor":
          return Number(b.stats?.floorPrice || 0n) - Number(a.stats?.floorPrice || 0n);
        case "sales":
          return (b.stats?.totalSales || 0) - (a.stats?.totalSales || 0);
        default:
          return 0;
      }
    });
  };

  const handleCreateCollection = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setCreating(true);
      logger.info("Creating new collection", {
        name: collectionName,
        symbol: collectionSymbol,
        type: collectionType
      }, {
        component: "CollectionsPage",
        action: "handleCreateCollection"
      });

      let tx;
      let txHash: string;
      if (collectionType === "ERC721") {
        txHash = await collectionService.createERC721Collection({
          name: collectionName,
          symbol: collectionSymbol,
          baseURI: baseUri || "ipfs://",
          maxSupply: maxSupply.toString(),
          owner: address,
          royaltyFee: royaltyBps.toString()
        });
      } else {
        txHash = await collectionService.createERC1155Collection({
          name: collectionName,
          symbol: collectionSymbol,
          baseURI: baseUri || "ipfs://",
          owner: address
        });
      }

      // Wait for transaction confirmation
      // Note: txHash is a string, not a transaction object
      toast.success("Collection created successfully!");
      setCreateDialogOpen(false);
      
      // Reset form
      setCollectionName("");
      setCollectionSymbol("");
      setBaseUri("");
      setMaxSupply("10000");
      setRoyaltyBps("250");
      
      // Refresh collections
      await fetchCollections();
    } catch (error: any) {
      logger.error("Failed to create collection", error, {
        component: "CollectionsPage",
        action: "handleCreateCollection"
      });
      toast.error(error.message || "Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!selectedCollection || !isConnected) return;

    try {
      setVerifying(true);
      logger.info("Requesting collection verification", {
        collection: selectedCollection.address
      }, {
        component: "CollectionsPage",
        action: "handleRequestVerification"
      });

      const verificationFee = ethers.parseEther("0.01"); // Example fee
      
      const txHash = await collectionService.requestVerification(
        selectedCollection.address,
        {
          description: verificationData.description,
          website: verificationData.website,
          twitter: verificationData.twitter
        }
      );

      // Transaction hash is returned directly
      toast.success("Verification request submitted!");
      setVerifyDialogOpen(false);
      setSelectedCollection(null);
      
      // Reset form
      setVerificationData({
        website: "",
        twitter: "",
        description: ""
      });
    } catch (error: any) {
      logger.error("Failed to request verification", error, {
        component: "CollectionsPage",
        action: "handleRequestVerification"
      });
      toast.error(error.message || "Failed to submit verification request");
    } finally {
      setVerifying(false);
    }
  };

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collection.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerified = !filterVerified || collection.isVerified;
    return matchesSearch && matchesVerified;
  });

  const CollectionCard = ({ collection }: { collection: Collection }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-gray-100">
        {collection.metadata?.image ? (
          <img
            src={collection.metadata.image}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {collection.isVerified && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-500">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </div>
        )}
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2"
        >
          {collection.tokenType}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{collection.name}</h3>
        <p className="text-sm text-gray-500 mb-4">{collection.symbol}</p>
        
        {collection.stats && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <p className="text-xs text-gray-500">Floor Price</p>
              <p className="font-medium">
                {collection.stats.floorPrice > 0n
                  ? `${formatEther(collection.stats.floorPrice)} ETH`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Volume</p>
              <p className="font-medium">
                {formatEther(collection.stats.totalVolume)} ETH
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Items</p>
              <p className="font-medium">{collection.stats.totalSupply || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sales</p>
              <p className="font-medium">{collection.stats.totalSales}</p>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Link href={`/collections/${collection.address}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Collection
            </Button>
          </Link>
          {!collection.isVerified && collection.owner === address && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedCollection(collection);
                setVerifyDialogOpen(true);
              }}
            >
              <ShieldCheck className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">NFT Collections</h1>
            <p className="text-gray-600">Explore and create NFT collections</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Collection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogDescription>
                  Deploy your own NFT collection on the blockchain
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Collection Type</Label>
                  <Tabs value={collectionType} onValueChange={(v) => setCollectionType(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="ERC721">ERC721</TabsTrigger>
                      <TabsTrigger value="ERC1155">ERC1155</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div>
                  <Label htmlFor="name">Collection Name</Label>
                  <Input
                    id="name"
                    placeholder="My NFT Collection"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="MNC"
                    value={collectionSymbol}
                    onChange={(e) => setCollectionSymbol(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="baseUri">Base URI (Metadata)</Label>
                  <Input
                    id="baseUri"
                    placeholder="ipfs://..."
                    value={baseUri}
                    onChange={(e) => setBaseUri(e.target.value)}
                  />
                </div>
                
                {collectionType === "ERC721" && (
                  <>
                    <div>
                      <Label htmlFor="maxSupply">Max Supply</Label>
                      <Input
                        id="maxSupply"
                        type="number"
                        placeholder="10000"
                        value={maxSupply}
                        onChange={(e) => setMaxSupply(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="royalty">Royalty (%)</Label>
                      <Input
                        id="royalty"
                        type="number"
                        placeholder="2.5"
                        value={(parseInt(royaltyBps) / 100).toString()}
                        onChange={(e) => setRoyaltyBps((parseFloat(e.target.value) * 100).toString())}
                        step="0.1"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCollection} disabled={creating || !collectionName || !collectionSymbol}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            className="px-4 py-2 border rounded-md"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="volume">Sort by Volume</option>
            <option value="floor">Sort by Floor Price</option>
            <option value="sales">Sort by Sales</option>
          </select>
          
          <Button
            variant={filterVerified ? "default" : "outline"}
            onClick={() => setFilterVerified(!filterVerified)}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Verified Only
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredCollections.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCollections.map(collection => (
              <CollectionCard key={collection.address} collection={collection} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCollections.map(collection => (
              <Card key={collection.address}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {collection.metadata?.image ? (
                        <img
                          src={collection.metadata.image}
                          alt={collection.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{collection.name}</h3>
                        {collection.isVerified && (
                          <Badge className="bg-blue-500">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="secondary">{collection.tokenType}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{collection.symbol}</p>
                      {collection.metadata?.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {collection.metadata.description}
                        </p>
                      )}
                    </div>
                    
                    {collection.stats && (
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Floor</p>
                          <p className="font-medium">
                            {collection.stats.floorPrice > 0n
                              ? `${formatEther(collection.stats.floorPrice)} ETH`
                              : "—"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Volume</p>
                          <p className="font-medium">
                            {formatEther(collection.stats.totalVolume)} ETH
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Items</p>
                          <p className="font-medium">{collection.stats.totalSupply || "—"}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Sales</p>
                          <p className="font-medium">{collection.stats.totalSales}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Link href={`/collections/${collection.address}`}>
                        <Button variant="outline">View</Button>
                      </Link>
                      {!collection.isVerified && collection.owner === address && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedCollection(collection);
                            setVerifyDialogOpen(true);
                          }}
                        >
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No collections found</p>
        </Card>
      )}

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Verification</DialogTitle>
            <DialogDescription>
              Submit your collection for verification to get the verified badge
            </DialogDescription>
          </DialogHeader>
          
          {selectedCollection && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Verification fee: 0.01 ETH
                </AlertDescription>
              </Alert>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://..."
                  value={verificationData.website}
                  onChange={(e) => setVerificationData({...verificationData, website: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  placeholder="@username"
                  value={verificationData.twitter}
                  onChange={(e) => setVerificationData({...verificationData, twitter: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full p-2 border rounded-md"
                  rows={4}
                  placeholder="Describe your collection..."
                  value={verificationData.description}
                  onChange={(e) => setVerificationData({...verificationData, description: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestVerification} disabled={verifying || !isConnected}>
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
