"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { 
  exchangeService,
  auctionService,
  bundleService,
  collectionService,
  nftMetadataService,
  userHubService
} from "@/lib/services/contracts";
import { userNFTService } from "@/lib/services/UserNFTService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ShoppingCart, 
  Gavel, 
  Package, 
  Plus,
  X,
  Upload,
  AlertCircle,
  Info,
  Clock,
  DollarSign,
  Hash,
  Image as ImageIcon,
  Loader2,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { parseEther } from "ethers";

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

interface BundleItem extends NFTAsset {
  id: string;
}

export default function CreateListingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"listing" | "auction" | "bundle">("listing");
  
  // Listing States
  const [listingType, setListingType] = useState<"fixed" | "auction">("fixed");
  const [selectedNFT, setSelectedNFT] = useState<NFTAsset | null>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [listingDuration, setListingDuration] = useState("7");
  const [listingAmount, setListingAmount] = useState("1");
  
  // Auction States  
  const [auctionType, setAuctionType] = useState<"english" | "dutch">("english");
  const [startingPrice, setStartingPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [endingPrice, setEndingPrice] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("3");
  const [bidIncrement, setBidIncrement] = useState("0.01");
  const [enableBuyNow, setEnableBuyNow] = useState(false);
  const [buyNowPrice, setBuyNowPrice] = useState("");
  
  // Bundle States
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [bundlePrice, setBundlePrice] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  const [bundleDuration, setBundleDuration] = useState("7");
  const [bundleDiscount, setBundleDiscount] = useState("10");
  
  // User's NFTs
  const [userNFTs, setUserNFTs] = useState<NFTAsset[]>([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserNFTs();
    }
  }, [isConnected, address]);

  const fetchUserNFTs = async () => {
    if (!address) return;
    
    try {
      setLoadingNFTs(true);
      logger.info("Fetching user NFTs from blockchain", { address }, {
        component: "CreateListingPage",
        action: "fetchUserNFTs"
      });

      // Get user's NFTs from blockchain
      const userNFTsData = await userNFTService.getUserNFTs(address);
      
      // Fetch metadata for each NFT
      const nftsWithMetadata: NFTAsset[] = await Promise.all(
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
            logger.warn("Failed to fetch metadata for NFT", error, {
              component: "CreateListingPage",
              action: "fetchUserNFTs",
              nft
            });
            
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
      logger.success(`Fetched ${nftsWithMetadata.length} NFTs from blockchain`, null, {
        component: "CreateListingPage",
        action: "fetchUserNFTs"
      });
    } catch (error) {
      logger.error("Failed to fetch user NFTs", error, {
        component: "CreateListingPage",
        action: "fetchUserNFTs"
      });
      toast.error("Failed to load your NFTs");
      setUserNFTs([]);
    } finally {
      setLoadingNFTs(false);
    }
  };

  const handleCreateListing = async () => {
    if (!selectedNFT || !listingPrice || !listingDuration) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      logger.info("Creating fixed-price listing", {
        nft: selectedNFT,
        price: listingPrice,
        duration: listingDuration
      }, {
        component: "CreateListingPage",
        action: "handleCreateListing"
      });

      const tx = await exchangeService.createListing({
        contractAddress: selectedNFT.contractAddress,
        tokenId: selectedNFT.tokenId,
        price: listingPrice,
        duration: listingDuration,
        amount: selectedNFT.tokenType === "ERC1155" ? listingAmount : undefined,
        tokenType: selectedNFT.tokenType
      });

      toast.success("Listing created successfully!");
      router.push(`/nft/${selectedNFT.contractAddress}/${selectedNFT.tokenId}`);
    } catch (error) {
      logger.error("Failed to create listing", error, {
        component: "CreateListingPage",
        action: "handleCreateListing"
      });
      toast.error("Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuction = async () => {
    if (!selectedNFT || !startingPrice || !auctionDuration) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      logger.info("Creating auction", {
        type: auctionType,
        nft: selectedNFT,
        startingPrice,
        reservePrice,
        duration: auctionDuration
      }, {
        component: "CreateListingPage",
        action: "handleCreateAuction"
      });

      // Approve NFT for auction factory
      const auctionFactoryAddress = await userHubService.getAuctionFactory();
      const isApprovedForAuction = await userNFTService.getApprovalStatus(
        address!,
        selectedNFT.contractAddress,
        auctionFactoryAddress,
        selectedNFT.tokenId
      );
      
      if (!isApprovedForAuction) {
        const nftContract = new ethers.Contract(
          selectedNFT.contractAddress,
          selectedNFT.tokenType === "ERC721"
            ? ["function approve(address to, uint256 tokenId)"]
            : ["function setApprovalForAll(address operator, bool approved)"],
          await exchangeService.getSigner()
        );
        
        if (selectedNFT.tokenType === "ERC721") {
          await nftContract.approve(auctionFactoryAddress, selectedNFT.tokenId);
        } else {
          await nftContract.setApprovalForAll(auctionFactoryAddress, true);
        }
      }
      
      if (auctionType === "english") {
        await auctionService.createEnglishAuction({
          nftContract: selectedNFT.contractAddress,
          tokenId: selectedNFT.tokenId,
          amount: selectedNFT.tokenType === "ERC1155" ? listingAmount : "1",
          startPrice: startingPrice,
          reservePrice: reservePrice || "0",
          duration: parseInt(auctionDuration)
        });
      } else {
        await auctionService.createDutchAuction({
          nftContract: selectedNFT.contractAddress,
          tokenId: selectedNFT.tokenId,
          amount: selectedNFT.tokenType === "ERC1155" ? listingAmount : "1",
          startPrice: startingPrice,
          reservePrice: endingPrice || "0",
          duration: parseInt(auctionDuration),
          priceDropPerHour: ((parseFloat(startingPrice) - parseFloat(endingPrice || "0")) / (parseInt(auctionDuration) * 24)).toString()
        });
      }

      toast.success("Auction created successfully!");
      router.push(`/nft/${selectedNFT.contractAddress}/${selectedNFT.tokenId}`);
    } catch (error) {
      logger.error("Failed to create auction", error, {
        component: "CreateListingPage",
        action: "handleCreateAuction"
      });
      toast.error("Failed to create auction");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBundle = async () => {
    if (bundleItems.length < 2 || !bundlePrice || !bundleDuration) {
      toast.error("Please add at least 2 items and fill in all fields");
      return;
    }

    try {
      setLoading(true);
      logger.info("Creating bundle", {
        items: bundleItems,
        price: bundlePrice,
        duration: bundleDuration
      }, {
        component: "CreateListingPage",
        action: "handleCreateBundle"
      });

      await bundleService.createBundle({
        items: bundleItems.map(item => ({
          collection: item.contractAddress,
          tokenId: item.tokenId,
          amount: item.amount || "1",
          tokenType: item.tokenType
        })),
        totalPrice: bundlePrice,
        discountPercentage: parseInt(bundleDiscount),
        duration: parseInt(bundleDuration) * 86400,
        description: bundleDescription,
        imageUrl: ""
      });

      toast.success("Bundle created successfully!");
      router.push("/marketplace?tab=bundles");
    } catch (error) {
      logger.error("Failed to create bundle", error, {
        component: "CreateListingPage",
        action: "handleCreateBundle"
      });
      toast.error("Failed to create bundle");
    } finally {
      setLoading(false);
    }
  };

  const addToBundleBundle = (nft: NFTAsset) => {
    if (bundleItems.some(item => 
      item.contractAddress === nft.contractAddress && 
      item.tokenId === nft.tokenId
    )) {
      toast.error("This NFT is already in the bundle");
      return;
    }

    setBundleItems([...bundleItems, {
      ...nft,
      id: `${nft.contractAddress}-${nft.tokenId}-${Date.now()}`
    }]);
    toast.success("Added to bundle");
  };

  const removeFromBundle = (itemId: string) => {
    setBundleItems(bundleItems.filter(item => item.id !== itemId));
  };

  const calculateBundleValue = () => {
    // In a real implementation, this would fetch current floor prices
    const estimatedValue = bundleItems.length * 0.5;
    const discountedPrice = estimatedValue * (1 - parseInt(bundleDiscount) / 100);
    return discountedPrice.toFixed(3);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-500">Please connect your wallet to create listings</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Listing</h1>
        <p className="text-gray-600">List your NFTs for sale, create auctions, or bundle multiple items</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listing">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Fixed Price
          </TabsTrigger>
          <TabsTrigger value="auction">
            <Gavel className="w-4 h-4 mr-2" />
            Auction
          </TabsTrigger>
          <TabsTrigger value="bundle">
            <Package className="w-4 h-4 mr-2" />
            Bundle
          </TabsTrigger>
        </TabsList>

        {/* Fixed Price Listing */}
        <TabsContent value="listing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Fixed Price Listing</CardTitle>
              <CardDescription>
                Set a fixed price for your NFT and let buyers purchase it instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* NFT Selection */}
              <div>
                <Label htmlFor="nft-select">Select NFT</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {loadingNFTs ? (
                    <div className="col-span-full flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : userNFTs.length > 0 ? (
                    userNFTs.map((nft) => (
                      <Card
                        key={`${nft.contractAddress}-${nft.tokenId}`}
                        className={`cursor-pointer transition-all ${
                          selectedNFT?.tokenId === nft.tokenId 
                            ? "ring-2 ring-primary" 
                            : "hover:shadow-md"
                        }`}
                        onClick={() => setSelectedNFT(nft)}
                      >
                        <CardContent className="p-3">
                          <div className="aspect-square bg-gray-100 rounded mb-2">
                            {nft.metadata?.image ? (
                              <img 
                                src={nft.metadata.image} 
                                alt={nft.metadata.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">
                            {nft.metadata?.name || `Token #${nft.tokenId}`}
                          </p>
                          <p className="text-xs text-gray-500">{nft.tokenType}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">No NFTs found in your wallet</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedNFT && (
                <>
                  {/* Amount (for ERC1155) */}
                  {selectedNFT.tokenType === "ERC1155" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="listing-amount">Amount to List</Label>
                        <Input
                          id="listing-amount"
                          type="number"
                          placeholder="1"
                          value={listingAmount}
                          onChange={(e) => setListingAmount(e.target.value)}
                          min="1"
                          max={selectedNFT.amount}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {selectedNFT.amount}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Price and Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="listing-price">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Price (ETH)
                      </Label>
                      <Input
                        id="listing-price"
                        type="number"
                        placeholder="0.0"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        step="0.001"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="listing-duration">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Duration (Days)
                      </Label>
                      <Select value={listingDuration} onValueChange={setListingDuration}>
                        <SelectTrigger id="listing-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="3">3 Days</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="14">14 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Fee Information */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Platform fee: 2.5% | Creator royalty: 5% (if applicable)
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={handleCreateListing} 
                    disabled={loading || !selectedNFT || !listingPrice}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Listing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Create Listing
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auction */}
        <TabsContent value="auction" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Auction</CardTitle>
              <CardDescription>
                Start an English or Dutch auction for your NFT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auction Type Selection */}
              <div>
                <Label>Auction Type</Label>
                <RadioGroup value={auctionType} onValueChange={(v) => setAuctionType(v as any)} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="english" id="english" />
                    <Label htmlFor="english" className="cursor-pointer">
                      <div>
                        <p className="font-medium">English Auction</p>
                        <p className="text-sm text-gray-500">Price goes up with bids</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dutch" id="dutch" />
                    <Label htmlFor="dutch" className="cursor-pointer">
                      <div>
                        <p className="font-medium">Dutch Auction</p>
                        <p className="text-sm text-gray-500">Price decreases over time</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* NFT Selection (reuse from listing) */}
              <div>
                <Label>Select NFT</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {userNFTs.map((nft) => (
                    <Card
                      key={`${nft.contractAddress}-${nft.tokenId}`}
                      className={`cursor-pointer transition-all ${
                        selectedNFT?.tokenId === nft.tokenId 
                          ? "ring-2 ring-primary" 
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedNFT(nft)}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-square bg-gray-100 rounded mb-2">
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {nft.metadata?.name || `Token #${nft.tokenId}`}
                        </p>
                        <p className="text-xs text-gray-500">{nft.tokenType}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedNFT && (
                <>
                  {/* Auction-specific fields */}
                  {auctionType === "english" ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Starting Price (ETH)</Label>
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={startingPrice}
                            onChange={(e) => setStartingPrice(e.target.value)}
                            step="0.001"
                          />
                        </div>
                        <div>
                          <Label>Reserve Price (ETH)</Label>
                          <Input
                            type="number"
                            placeholder="Optional"
                            value={reservePrice}
                            onChange={(e) => setReservePrice(e.target.value)}
                            step="0.001"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Minimum Bid Increment (ETH)</Label>
                        <Input
                          type="number"
                          placeholder="0.01"
                          value={bidIncrement}
                          onChange={(e) => setBidIncrement(e.target.value)}
                          step="0.001"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Starting Price (ETH)</Label>
                          <Input
                            type="number"
                            placeholder="High price"
                            value={startingPrice}
                            onChange={(e) => setStartingPrice(e.target.value)}
                            step="0.001"
                          />
                        </div>
                        <div>
                          <Label>Ending Price (ETH)</Label>
                          <Input
                            type="number"
                            placeholder="Low price"
                            value={endingPrice}
                            onChange={(e) => setEndingPrice(e.target.value)}
                            step="0.001"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Auction Duration</Label>
                    <Select value={auctionDuration} onValueChange={setAuctionDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="5">5 Days</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleCreateAuction} 
                    disabled={loading || !selectedNFT || !startingPrice}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Auction...
                      </>
                    ) : (
                      <>
                        <Gavel className="w-4 h-4 mr-2" />
                        Create Auction
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bundle */}
        <TabsContent value="bundle" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Bundle</CardTitle>
              <CardDescription>
                Bundle multiple NFTs together and offer them at a discounted price
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bundle Items */}
              <div>
                <Label>Bundle Items ({bundleItems.length})</Label>
                {bundleItems.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {bundleItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gray-100 rounded" />
                          <div>
                            <p className="text-sm font-medium">
                              {item.metadata?.name || `Token #${item.tokenId}`}
                            </p>
                            <p className="text-xs text-gray-500">{item.tokenType}</p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFromBundle(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add NFTs to Bundle */}
              <div>
                <Label>Add NFTs to Bundle</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {userNFTs.map((nft) => {
                    const isInBundle = bundleItems.some(item => 
                      item.contractAddress === nft.contractAddress && 
                      item.tokenId === nft.tokenId
                    );
                    return (
                      <Card
                        key={`${nft.contractAddress}-${nft.tokenId}`}
                        className={`cursor-pointer transition-all ${
                          isInBundle ? "opacity-50" : "hover:shadow-md"
                        }`}
                        onClick={() => !isInBundle && addToBundleBundle(nft)}
                      >
                        <CardContent className="p-3">
                          <div className="aspect-square bg-gray-100 rounded mb-2 relative">
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            {isInBundle && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">
                            {nft.metadata?.name || `Token #${nft.tokenId}`}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {bundleItems.length >= 2 && (
                <>
                  <div>
                    <Label>Bundle Description</Label>
                    <Textarea
                      placeholder="Describe your bundle..."
                      value={bundleDescription}
                      onChange={(e) => setBundleDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bundle Price (ETH)</Label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={bundlePrice}
                        onChange={(e) => setBundlePrice(e.target.value)}
                        step="0.001"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Suggested: {calculateBundleValue()} ETH
                      </p>
                    </div>
                    <div>
                      <Label>Discount %</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={bundleDiscount}
                        onChange={(e) => setBundleDiscount(e.target.value)}
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Bundle Duration</Label>
                    <Select value={bundleDuration} onValueChange={setBundleDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleCreateBundle} 
                    disabled={loading || bundleItems.length < 2 || !bundlePrice}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Bundle...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4 mr-2" />
                        Create Bundle
                      </>
                    )}
                  </Button>
                </>
              )}

              {bundleItems.length < 2 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Add at least 2 NFTs to create a bundle
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
