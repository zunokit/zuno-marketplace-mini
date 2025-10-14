"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import {
  bundleService,
  nftMetadataService,
  userNFTService,
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Plus,
  ShoppingCart,
  Clock,
  DollarSign,
  Percent,
  User,
  Loader2,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Grid,
  List,
  Search,
  Filter,
  Zap
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatEther, parseEther } from "ethers";

interface BundleItem {
  nftContract: string;
  tokenId: string;
  amount: string;
  tokenType: "ERC721" | "ERC1155";
  metadata?: {
    name: string;
    image: string;
  };
}

interface Bundle {
  bundleId: string;
  creator: string;
  items: BundleItem[];
  totalPrice: bigint;
  discountPercentage: number;
  expirationTime: bigint;
  status: "ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED";
  description?: string;
  imageUrl?: string;
}

interface NFTAsset {
  contractAddress: string;
  tokenId: string;
  tokenType: "ERC721" | "ERC1155";
  amount?: string;
  metadata?: {
    name: string;
    image: string;
  };
}

export default function BundlesPage() {
  const { address, isConnected } = useAccount();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("active");
  
  // Create bundle dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userNFTs, setUserNFTs] = useState<NFTAsset[]>([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<NFTAsset[]>([]);
  const [bundleDescription, setBundleDescription] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [bundleDiscount, setBundleDiscount] = useState("10");
  const [bundleDuration, setBundleDuration] = useState("7");
  const [creating, setCreating] = useState(false);
  
  // Purchase dialog
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchBundles();
  }, [filterStatus]);

  useEffect(() => {
    if (createDialogOpen && isConnected && address) {
      fetchUserNFTs();
    }
  }, [createDialogOpen, isConnected, address]);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      logger.info("Fetching bundles from blockchain", null, {
        component: "BundlesPage",
        action: "fetchBundles"
      });

      const bundleManager = await bundleService.getBundleManagerContract();
      
      // Get bundle events
      const filter = bundleManager.filters.BundleCreated();
      const events = await bundleManager.queryFilter(filter);
      
      const bundlePromises = events.map(async (event) => {
        try {
          const bundleId = (event as any).args?.[0];
          if (!bundleId) return null;

          // Get bundle details
          const bundle = await bundleManager.getBundle(bundleId);
          
          // Check status
          const now = BigInt(Math.floor(Date.now() / 1000));
          const isExpired = bundle.expirationTime <= now;
          const status = bundle.status === 0 ? (isExpired ? "EXPIRED" : "ACTIVE") :
                        bundle.status === 1 ? "SOLD" : "CANCELLED";
          
          // Apply filters
          if (filterStatus === "active" && status !== "ACTIVE") return null;
          if (filterStatus === "expired" && (status !== "EXPIRED" && status !== "SOLD")) return null;

          // Get items with metadata
          const itemsWithMetadata = await Promise.all(
            bundle.items.map(async (item: any) => {
              try {
                const metadata = await nftMetadataService.getNFTMetadata(
                  item.nftContract,
                  item.tokenId.toString()
                );
                
                return {
                  nftContract: item.nftContract,
                  tokenId: item.tokenId.toString(),
                  amount: item.amount.toString(),
                  tokenType: item.tokenType === 0 ? "ERC721" : "ERC1155",
                  metadata: metadata ? {
                    name: metadata.name,
                    image: metadata.image
                  } : undefined
                };
              } catch (error) {
                logger.warn("Failed to fetch item metadata", error, {
                  component: "BundlesPage",
                  action: "fetchBundles"
                });
                return {
                  nftContract: item.nftContract,
                  tokenId: item.tokenId.toString(),
                  amount: item.amount.toString(),
                  tokenType: item.tokenType === 0 ? "ERC721" : "ERC1155"
                };
              }
            })
          );

          return {
            bundleId,
            creator: bundle.creator,
            items: itemsWithMetadata,
            totalPrice: bundle.totalPrice,
            discountPercentage: Number(bundle.discountPercentage || 0),
            expirationTime: bundle.expirationTime,
            status,
            description: bundle.description || "",
            imageUrl: bundle.imageUrl || ""
          } as Bundle;
        } catch (error) {
          logger.warn("Failed to fetch bundle data", error, {
            component: "BundlesPage",
            action: "fetchBundles"
          });
          return null;
        }
      });

      const bundleData = (await Promise.all(bundlePromises))
        .filter(b => b !== null) as Bundle[];

      setBundles(bundleData);
      logger.success(`Fetched ${bundleData.length} bundles`, null, {
        component: "BundlesPage",
        action: "fetchBundles"
      });
    } catch (error) {
      logger.error("Failed to fetch bundles", error, {
        component: "BundlesPage",
        action: "fetchBundles"
      });
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNFTs = async () => {
    if (!address) return;
    
    try {
      setLoadingNFTs(true);
      logger.info("Fetching user NFTs for bundle creation", { address }, {
        component: "BundlesPage",
        action: "fetchUserNFTs"
      });

      const userNFTsData = await userNFTService.getUserNFTs(address);
      
      const nftsWithMetadata = await Promise.all(
        userNFTsData.map(async (nft) => {
          try {
            const metadata = await nftMetadataService.getNFTMetadata(
              nft.contractAddress,
              nft.tokenId
            );
            
            return {
              contractAddress: nft.contractAddress,
              tokenId: nft.tokenId,
              tokenType: nft.tokenType,
              amount: nft.balance.toString(),
              metadata: metadata ? {
                name: metadata.name,
                image: metadata.image
              } : {
                name: `Token #${nft.tokenId}`,
                image: ""
              }
            };
          } catch (error) {
            return {
              contractAddress: nft.contractAddress,
              tokenId: nft.tokenId,
              tokenType: nft.tokenType,
              amount: nft.balance.toString(),
              metadata: {
                name: `Token #${nft.tokenId}`,
                image: ""
              }
            };
          }
        })
      );

      setUserNFTs(nftsWithMetadata);
    } catch (error) {
      logger.error("Failed to fetch user NFTs", error, {
        component: "BundlesPage",
        action: "fetchUserNFTs"
      });
      setUserNFTs([]);
    } finally {
      setLoadingNFTs(false);
    }
  };

  const handleCreateBundle = async () => {
    if (!isConnected || !address || selectedNFTs.length < 2) {
      toast.error("Please select at least 2 NFTs for the bundle");
      return;
    }

    try {
      setCreating(true);
      logger.info("Creating bundle", {
        items: selectedNFTs.length,
        price: bundlePrice,
        discount: bundleDiscount
      }, {
        component: "BundlesPage",
        action: "handleCreateBundle"
      });

      // Approve all NFTs
      const bundleManagerAddress = await userHubService.getBundleManager();
      
      for (const nft of selectedNFTs) {
        const isApproved = await userNFTService.getApprovalStatus(
          address,
          nft.contractAddress,
          bundleManagerAddress,
          nft.tokenId
        );
        
        if (!isApproved) {
          const nftContract = new ethers.Contract(
            nft.contractAddress,
            nft.tokenType === "ERC721"
              ? ["function approve(address to, uint256 tokenId)"]
              : ["function setApprovalForAll(address operator, bool approved)"],
            await bundleService.getSigner()
          );
          
          if (nft.tokenType === "ERC721") {
            await nftContract.approve(bundleManagerAddress, nft.tokenId);
          } else {
            await nftContract.setApprovalForAll(bundleManagerAddress, true);
          }
        }
      }

      // Create bundle
      const tx = await bundleService.createBundle({
        items: selectedNFTs.map(nft => ({
          collection: nft.contractAddress,
          tokenId: nft.tokenId,
          amount: nft.amount || "1",
          tokenType: nft.tokenType
        })),
        totalPrice: bundlePrice,
        discountPercentage: parseInt(bundleDiscount),
        duration: parseInt(bundleDuration) * 86400,
        description: bundleDescription,
        imageUrl: ""
      });

      toast.success("Bundle created successfully!");
      setCreateDialogOpen(false);
      
      // Reset form
      setSelectedNFTs([]);
      setBundleDescription("");
      setBundlePrice("");
      setBundleDiscount("10");
      setBundleDuration("7");
      
      // Refresh bundles
      await fetchBundles();
    } catch (error: any) {
      logger.error("Failed to create bundle", error, {
        component: "BundlesPage",
        action: "handleCreateBundle"
      });
      toast.error(error.message || "Failed to create bundle");
    } finally {
      setCreating(false);
    }
  };

  const handlePurchaseBundle = async () => {
    if (!selectedBundle || !isConnected) return;

    try {
      setPurchasing(true);
      logger.info("Purchasing bundle", {
        bundleId: selectedBundle.bundleId,
        price: formatEther(selectedBundle.totalPrice)
      }, {
        component: "BundlesPage",
        action: "handlePurchaseBundle"
      });

      const tx = await bundleService.purchaseBundle(
        selectedBundle.bundleId,
        formatEther(selectedBundle.totalPrice)
      );

      await tx.wait();
      toast.success("Bundle purchased successfully!");
      setSelectedBundle(null);
      await fetchBundles();
    } catch (error) {
      logger.error("Failed to purchase bundle", error, {
        component: "BundlesPage",
        action: "handlePurchaseBundle"
      });
      toast.error("Failed to purchase bundle");
    } finally {
      setPurchasing(false);
    }
  };

  const handleCancelBundle = async (bundleId: string) => {
    try {
      logger.info("Cancelling bundle", { bundleId }, {
        component: "BundlesPage",
        action: "handleCancelBundle"
      });

      const tx = await bundleService.cancelBundle(bundleId);
      await tx.wait();
      
      toast.success("Bundle cancelled successfully!");
      await fetchBundles();
    } catch (error) {
      logger.error("Failed to cancel bundle", error, {
        component: "BundlesPage",
        action: "handleCancelBundle"
      });
      toast.error("Failed to cancel bundle");
    }
  };

  const calculateSavings = (bundle: Bundle) => {
    const itemsValue = bundle.items.length * parseFloat(formatEther(bundle.totalPrice)) * 1.2; // Estimate
    const bundleValue = parseFloat(formatEther(bundle.totalPrice));
    return ((itemsValue - bundleValue) / itemsValue * 100).toFixed(0);
  };

  const formatTimeLeft = (expiration: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const diff = Number(expiration - now);
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const filteredBundles = bundles.filter(bundle => {
    const matchesSearch = bundle.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bundle.bundleId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const BundleCard = ({ bundle }: { bundle: Bundle }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <div className="grid grid-cols-2 gap-1 p-2 bg-gray-100 aspect-square">
          {bundle.items.slice(0, 4).map((item, idx) => (
            <div key={idx} className="bg-white rounded overflow-hidden">
              {item.metadata?.image ? (
                <img
                  src={item.metadata.image}
                  alt={item.metadata.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge variant="secondary">
            {bundle.items.length} Items
          </Badge>
          {bundle.discountPercentage > 0 && (
            <Badge variant="default" className="bg-green-500">
              -{bundle.discountPercentage}%
            </Badge>
          )}
        </div>
        
        {bundle.status === "ACTIVE" && (
          <Badge className="absolute top-2 right-2 bg-blue-500">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimeLeft(bundle.expirationTime)}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">
          {bundle.description || `Bundle #${bundle.bundleId.slice(0, 8)}`}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Bundle Price</span>
            <span className="font-bold text-lg">
              {formatEther(bundle.totalPrice)} ETH
            </span>
          </div>
          
          {bundle.discountPercentage > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">You Save</span>
              <span className="text-green-600 font-medium">
                ~{calculateSavings(bundle)}%
              </span>
            </div>
          )}
          
          <div className="flex items-center text-xs text-gray-500">
            <User className="w-3 h-3 mr-1" />
            {bundle.creator.slice(0, 6)}...{bundle.creator.slice(-4)}
          </div>
        </div>

        <div className="flex gap-2">
          {bundle.status === "ACTIVE" && (
            <>
              {bundle.creator === address ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleCancelBundle(bundle.bundleId)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={() => setSelectedBundle(bundle)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Bundle
                </Button>
              )}
            </>
          )}
          <Link href={`/bundles/${bundle.bundleId}`}>
            <Button variant="outline">View Details</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">NFT Bundles</h1>
            <p className="text-gray-600">Buy multiple NFTs at discounted prices</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Bundle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create NFT Bundle</DialogTitle>
                <DialogDescription>
                  Bundle multiple NFTs and offer them at a discounted price
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Bundle Name</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Starter Pack"
                    value={bundleDescription}
                    onChange={(e) => setBundleDescription(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Describe your bundle..."
                    value={bundleDescription}
                    onChange={(e) => setBundleDescription(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Select NFTs ({selectedNFTs.length} selected)</Label>
                  {loadingNFTs ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
                      {userNFTs.map((nft) => {
                        const isSelected = selectedNFTs.some(
                          s => s.contractAddress === nft.contractAddress && s.tokenId === nft.tokenId
                        );
                        return (
                          <div
                            key={`${nft.contractAddress}-${nft.tokenId}`}
                            className={`border rounded p-2 cursor-pointer transition-all ${
                              isSelected ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedNFTs(selectedNFTs.filter(
                                  s => !(s.contractAddress === nft.contractAddress && s.tokenId === nft.tokenId)
                                ));
                              } else {
                                setSelectedNFTs([...selectedNFTs, nft]);
                              }
                            }}
                          >
                            {nft.metadata?.image ? (
                              <img src={nft.metadata.image} alt="" className="w-full aspect-square object-cover rounded" />
                            ) : (
                              <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <p className="text-xs mt-1 truncate">{nft.metadata?.name || `#${nft.tokenId}`}</p>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-blue-500 mt-1" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Total Price (ETH)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={bundlePrice}
                      onChange={(e) => setBundlePrice(e.target.value)}
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      placeholder="10"
                      value={bundleDiscount}
                      onChange={(e) => setBundleDiscount(e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="7"
                    value={bundleDuration}
                    onChange={(e) => setBundleDuration(e.target.value)}
                  />
                </div>
                
                {selectedNFTs.length > 0 && bundlePrice && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Bundle contains {selectedNFTs.length} NFTs for {bundlePrice} ETH
                      {bundleDiscount && ` with ${bundleDiscount}% discount advertised`}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBundle}
                  disabled={creating || selectedNFTs.length < 2 || !bundlePrice}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Bundle
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            className="px-4 py-2 border rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Bundles</option>
            <option value="active">Active Only</option>
            <option value="expired">Sold/Expired</option>
          </select>
          
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
      ) : filteredBundles.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBundles.map(bundle => (
              <BundleCard key={bundle.bundleId} bundle={bundle} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBundles.map(bundle => (
              <Card key={bundle.bundleId}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="grid grid-cols-2 gap-1 w-32 h-32 flex-shrink-0">
                      {bundle.items.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="bg-gray-100 rounded overflow-hidden">
                          {item.metadata?.image ? (
                            <img src={item.metadata.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {bundle.description || `Bundle #${bundle.bundleId.slice(0, 8)}`}
                        </h3>
                        <Badge variant="secondary">{bundle.items.length} Items</Badge>
                        {bundle.discountPercentage > 0 && (
                          <Badge variant="default" className="bg-green-500">
                            -{bundle.discountPercentage}%
                          </Badge>
                        )}
                        {bundle.status === "ACTIVE" && (
                          <Badge className="bg-blue-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTimeLeft(bundle.expirationTime)}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        Bundle by {bundle.creator.slice(0, 6)}...{bundle.creator.slice(-4)}
                      </p>
                      
                      <div className="flex items-center gap-6 mb-3">
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="font-bold text-lg">{formatEther(bundle.totalPrice)} ETH</p>
                        </div>
                        {bundle.discountPercentage > 0 && (
                          <div>
                            <p className="text-sm text-gray-500">You Save</p>
                            <p className="text-green-600 font-medium">~{calculateSavings(bundle)}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {bundle.status === "ACTIVE" && (
                        <>
                          {bundle.creator === address ? (
                            <Button
                              variant="outline"
                              onClick={() => handleCancelBundle(bundle.bundleId)}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <Button onClick={() => setSelectedBundle(bundle)}>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Buy
                            </Button>
                          )}
                        </>
                      )}
                      <Link href={`/bundles/${bundle.bundleId}`}>
                        <Button variant="outline">Details</Button>
                      </Link>
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
          <p className="text-gray-500">No bundles found</p>
        </Card>
      )}

      {/* Purchase Dialog */}
      {selectedBundle && (
        <Dialog open={!!selectedBundle} onOpenChange={() => setSelectedBundle(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase Bundle</DialogTitle>
              <DialogDescription>
                Review and confirm your bundle purchase
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Bundle Items ({selectedBundle.items.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedBundle.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {item.metadata?.image && (
                        <img src={item.metadata.image} alt="" className="w-8 h-8 rounded" />
                      )}
                      <span className="text-sm">
                        {item.metadata?.name || `Token #${item.tokenId}`}
                      </span>
                      {item.tokenType === "ERC1155" && item.amount !== "1" && (
                        <Badge variant="outline" className="ml-auto">x{item.amount}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bundle Price</span>
                  <span className="font-bold">{formatEther(selectedBundle.totalPrice)} ETH</span>
                </div>
                {selectedBundle.discountPercentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>{selectedBundle.discountPercentage}% OFF</span>
                  </div>
                )}
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You will receive all {selectedBundle.items.length} NFTs in this bundle
                </AlertDescription>
              </Alert>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedBundle(null)}>
                Cancel
              </Button>
              <Button onClick={handlePurchaseBundle} disabled={purchasing || !isConnected}>
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Purchasing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Purchase for {formatEther(selectedBundle.totalPrice)} ETH
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
