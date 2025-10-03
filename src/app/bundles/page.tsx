"use client";

/**
 * Bundles Page
 * Migrated from frontend-foundry/src/components/BundleManager.jsx
 * Create, buy, and manage NFT bundles
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppSelector } from "@/lib/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { isMockDataEnabled } from "@/lib/services/mock/mockDataService";
import {
  getMockBundleService,
  Bundle,
  BundleStatus,
} from "@/lib/services/mock/mockBundleService";
import {
  AlertCircle,
  Loader2,
  Clock,
  Package,
  TrendingDown,
  Check,
  X,
} from "lucide-react";

export default function BundlesPage() {
  const { toast } = useToast();

  // Redux state
  const { account, isConnected } = useAppSelector((state) => state.wallet);
  const nfts = useAppSelector((state) => state.nfts.nfts);

  // Local state
  const [activeBundles, setActiveBundles] = useState<Bundle[]>([]);
  const [userBundles, setUserBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [useMockData] = useState(isMockDataEnabled());

  // Create bundle form state
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([]);
  const [bundleForm, setBundleForm] = useState({
    name: "",
    description: "",
    bundlePrice: "",
    duration: "7", // days
  });

  /**
   * Load bundles on mount
   */
  useEffect(() => {
    if (account) {
      loadBundles();
    }
  }, [account]);

  /**
   * Load bundles from service
   */
  const loadBundles = async () => {
    if (!account) return;

    setLoading(true);
    try {
      if (useMockData) {
        const mockService = getMockBundleService();
        const [active, user] = await Promise.all([
          mockService.getActiveBundles(),
          mockService.getUserBundles(account),
        ]);
        setActiveBundles(active);
        setUserBundles(user);
      } else {
        // Real blockchain data
        // TODO: Fetch from BundleManager contract
        // const bundleManager = getContract(BUNDLE_MANAGER_ADDRESS, BUNDLE_MANAGER_ABI)
        // const bundles = await bundleManager.getActiveBundles()
        
        toast({
          title: "Blockchain Integration",
          description: "Real bundle system coming soon",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error loading bundles:", error);
      toast({
        title: "Error Loading Bundles",
        description:
          error instanceof Error ? error.message : "Failed to load bundles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle NFT selection for bundle
   */
  const toggleNFTSelection = (nftId: string) => {
    setSelectedNFTs((prev) => {
      if (prev.includes(nftId)) {
        return prev.filter((id) => id !== nftId);
      } else {
        if (prev.length >= 10) {
          toast({
            title: "Maximum Limit",
            description: "A bundle can contain maximum 10 NFTs",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, nftId];
      }
    });
  };

  /**
   * Calculate suggested bundle price (with 10% discount)
   */
  const getSuggestedPrice = (): string => {
    if (selectedNFTs.length === 0) return "0";
    
    // Mock calculation - in real app, fetch actual NFT prices
    const avgPrice = 1.5;
    const totalValue = selectedNFTs.length * avgPrice;
    const discountedPrice = totalValue * 0.9; // 10% discount
    
    return discountedPrice.toFixed(2);
  };

  /**
   * Handle create bundle
   */
  const handleCreateBundle = async () => {
    if (selectedNFTs.length < 2) {
      toast({
        title: "Invalid Bundle",
        description: "Please select at least 2 NFTs",
        variant: "destructive",
      });
      return;
    }

    if (!bundleForm.name || !bundleForm.bundlePrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (useMockData) {
        const mockService = getMockBundleService();
        
        // Mock NFT data
        const items = selectedNFTs.map((nftId) => ({
          nftContract: "0xMockContract",
          tokenId: nftId,
        }));

        await mockService.createBundle({
          name: bundleForm.name,
          description: bundleForm.description,
          items,
          bundlePrice: bundleForm.bundlePrice,
          duration: parseInt(bundleForm.duration),
        });

        toast({
          title: "Bundle Created!",
          description: `Successfully created bundle "${bundleForm.name}"`,
        });

        // Reset form
        setSelectedNFTs([]);
        setBundleForm({
          name: "",
          description: "",
          bundlePrice: "",
          duration: "7",
        });

        loadBundles();
      } else {
        // Real contract interaction
        // TODO: Implement with BundleManager
        // 1. Approve all NFTs for BundleManager
        // 2. Call bundleManager.createBundle(nftContracts, tokenIds, amounts, price, duration, name, desc)
        // 3. Wait for transaction and extract bundleId from events
        
        toast({
          title: "Contract Integration",
          description: "Real bundle creation coming soon",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Create Failed",
        description:
          error instanceof Error ? error.message : "Failed to create bundle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle buy bundle
   */
  const handleBuyBundle = async (bundleId: string, price: string) => {
    setLoading(true);
    try {
      if (useMockData) {
        const mockService = getMockBundleService();
        await mockService.buyBundle(bundleId);
        
        toast({
          title: "Bundle Purchased!",
          description: `Successfully bought bundle for ${price} ETH`,
        });

        loadBundles();
      } else {
        // Real contract interaction
        // await bundleManager.buyBundle(bundleId, { value: parseEther(price) })
        
        toast({
          title: "Contract Integration",
          description: "Real bundle purchase coming soon",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description:
          error instanceof Error ? error.message : "Failed to buy bundle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel bundle
   */
  const handleCancelBundle = async (bundleId: string) => {
    setLoading(true);
    try {
      if (useMockData) {
        const mockService = getMockBundleService();
        await mockService.cancelBundle(bundleId);
        
        toast({
          title: "Bundle Cancelled",
          description: "Your bundle has been cancelled",
        });

        loadBundles();
      } else {
        // Real contract interaction
        // await bundleManager.cancelBundle(bundleId)
        
        toast({
          title: "Contract Integration",
          description: "Real bundle cancellation coming soon",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Cancel Failed",
        description:
          error instanceof Error ? error.message : "Failed to cancel bundle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format time remaining
   */
  const formatTimeRemaining = (expiresAt: number): string => {
    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) return "Expired";

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} days`;

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    return `${hours} hours`;
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status: BundleStatus) => {
    switch (status) {
      case BundleStatus.ACTIVE:
        return <Badge variant="default">Active</Badge>;
      case BundleStatus.SOLD:
        return (
          <Badge variant="default" className="bg-green-500">
            <Check className="h-3 w-3 mr-1" />
            Sold
          </Badge>
        );
      case BundleStatus.CANCELLED:
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case BundleStatus.EXPIRED:
        return <Badge variant="secondary">Expired</Badge>;
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
            Please connect your wallet to view and manage bundles.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          📦 NFT Bundles
        </h1>
        <p className="text-muted-foreground">
          Create and buy discounted NFT packages
        </p>
        {useMockData && (
          <Badge variant="outline" className="mt-2">
            🎭 Mock Data Mode
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">
            Browse Bundles
            {activeBundles.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeBundles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-bundles">
            My Bundles
            {userBundles.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {userBundles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="create">Create Bundle</TabsTrigger>
        </TabsList>

        {/* Browse Bundles */}
        <TabsContent value="browse">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeBundles.length === 0 ? (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertTitle>No Active Bundles</AlertTitle>
              <AlertDescription>
                There are no active bundles at the moment. Check back later!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeBundles.map((bundle) => (
                <Card key={bundle.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{bundle.name}</CardTitle>
                        <CardDescription>
                          {bundle.items.length} NFTs
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {bundle.discountPercentage}% OFF
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Preview images */}
                    <div className="grid grid-cols-2 gap-2">
                      {bundle.items.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square bg-muted rounded-md overflow-hidden"
                        >
                          <Image
                            src={item.nftImage}
                            alt={item.nftName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>

                    {/* Pricing */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Individual Value
                        </span>
                        <span className="line-through text-muted-foreground">
                          {bundle.totalValue} ETH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Bundle Price</span>
                        <span className="text-xl font-bold text-primary">
                          {bundle.bundlePrice} ETH
                        </span>
                      </div>
                    </div>

                    {/* Time remaining */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Expires in {formatTimeRemaining(bundle.expiresAt)}</span>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleBuyBundle(bundle.id, bundle.bundlePrice)}
                      disabled={loading}
                    >
                      Buy Bundle
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Bundles */}
        <TabsContent value="my-bundles">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userBundles.length === 0 ? (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertTitle>No Bundles Created</AlertTitle>
              <AlertDescription>
                You haven't created any bundles yet. Go to the Create Bundle tab!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {userBundles.map((bundle) => (
                <Card key={bundle.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{bundle.name}</h3>
                          {getStatusBadge(bundle.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {bundle.description}
                        </p>
                      </div>
                      {bundle.status === BundleStatus.ACTIVE && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBundle(bundle.id)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p className="font-semibold">{bundle.items.length} NFTs</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-semibold">{bundle.bundlePrice} ETH</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Discount</p>
                        <p className="font-semibold">{bundle.discountPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-semibold">
                          {new Date(bundle.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create Bundle */}
        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Bundle Details</CardTitle>
                <CardDescription>
                  Select NFTs and set bundle price (minimum 2 NFTs, max 10)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bundle Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Starter Pack"
                    value={bundleForm.name}
                    onChange={(e) =>
                      setBundleForm({ ...bundleForm, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your bundle..."
                    value={bundleForm.description}
                    onChange={(e) =>
                      setBundleForm({ ...bundleForm, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Bundle Price (ETH) *
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0 text-xs"
                        onClick={() =>
                          setBundleForm({
                            ...bundleForm,
                            bundlePrice: getSuggestedPrice(),
                          })
                        }
                      >
                        Suggest: {getSuggestedPrice()} ETH
                      </Button>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={bundleForm.bundlePrice}
                      onChange={(e) =>
                        setBundleForm({ ...bundleForm, bundlePrice: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="30"
                      value={bundleForm.duration}
                      onChange={(e) =>
                        setBundleForm({ ...bundleForm, duration: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* NFT Selection */}
                <div className="space-y-2">
                  <Label>Select NFTs ({selectedNFTs.length}/10)</Label>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      NFT selection UI will be enhanced in next iteration. For now,
                      use mock NFT IDs.
                    </AlertDescription>
                  </Alert>
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateBundle}
                  disabled={loading || selectedNFTs.length < 2}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Bundle"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Bundle Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">NFTs Selected</span>
                    <span className="font-semibold">{selectedNFTs.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Value</span>
                    <span className="font-semibold">
                      {(selectedNFTs.length * 1.5).toFixed(2)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bundle Price</span>
                    <span className="font-semibold">
                      {bundleForm.bundlePrice || "0.00"} ETH
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-semibold text-green-600">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

