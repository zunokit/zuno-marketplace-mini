"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { 
  exchangeService, 
  auctionService, 
  offerService,
  listingHistoryTrackerService,
  nftMetadataService,
  userHubService,
  type Listing
} from "@/lib/services/contracts";
import { userNFTService } from "@/lib/services/UserNFTService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ShoppingCart, 
  Gavel, 
  HandshakeIcon, 
  History,
  ExternalLink,
  Copy,
  Heart,
  Share2,
  MoreHorizontal,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import { formatEther, parseEther } from "ethers";
import { toast } from "sonner";

interface NFTDetails {
  contractAddress: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  owner: string;
  creator: string;
  tokenType: "ERC721" | "ERC1155";
  totalSupply?: string;
  attributes: Array<{ trait_type: string; value: string; rarity?: number }>;
  royalty: {
    recipient: string;
    percentage: number;
  };
}

interface ListingInfo {
  listingId: string;
  seller: string;
  price: bigint;
  expirationTime: bigint;
  isActive: boolean;
}

interface AuctionInfo {
  auctionId: string;
  seller: string;
  startPrice: bigint;
  currentPrice: bigint;
  reservePrice: bigint;
  highestBid: bigint;
  highestBidder: string;
  endTime: bigint;
  auctionType: "ENGLISH" | "DUTCH";
  isActive: boolean;
}

interface OfferInfo {
  offerId: string;
  offerer: string;
  amount: bigint;
  expirationTime: bigint;
  isActive: boolean;
}

interface PriceHistory {
  price: bigint;
  timestamp: bigint;
  buyer: string;
  seller: string;
  txHash: string;
}

export default function NFTDetailPage() {
  const params = useParams();
  const { address, isConnected } = useAccount();
  const [nftDetails, setNftDetails] = useState<NFTDetails | null>(null);
  const [listing, setListing] = useState<ListingInfo | null>(null);
  const [auction, setAuction] = useState<AuctionInfo | null>(null);
  const [offers, setOffers] = useState<OfferInfo[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Form states
  const [bidAmount, setBidAmount] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [listingDuration, setListingDuration] = useState("7");

  const contractAddress = params.contract as string;
  const tokenId = params.tokenId as string;

  useEffect(() => {
    if (contractAddress && tokenId) {
      fetchNFTData();
    }
  }, [contractAddress, tokenId]);

  const fetchNFTData = async () => {
    try {
      setLoading(true);
      logger.info("Fetching NFT details from blockchain", { contractAddress, tokenId }, {
        component: "NFTDetailPage",
        action: "fetchNFTData"
      });

      // Fetch NFT metadata
      const metadata = await nftMetadataService.getNFTMetadata(contractAddress, tokenId);
      if (!metadata) {
        throw new Error("Failed to fetch NFT metadata");
      }

      // Detect token type
      const exchangeAddress = await userHubService.getExchangeFor(contractAddress);
      const isERC721 = exchangeAddress === userHubService.getERC721Exchange();
      const tokenType = isERC721 ? "ERC721" : "ERC1155";

      // Get owner information
      const ownerInfo = await userNFTService.checkNFTOwnership(
        address || ethers.ZeroAddress,
        contractAddress,
        tokenId
      );

      // Get contract info for creator and royalty
      const contract = new ethers.Contract(
        contractAddress,
        [
          "function owner() view returns (address)",
          "function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address, uint256)"
        ],
        exchangeService.provider
      );

      let creator = ethers.ZeroAddress;
      let royaltyInfo = { recipient: ethers.ZeroAddress, percentage: 0 };
      
      try {
        creator = await contract.owner();
      } catch {
        // Contract might not have owner function
      }

      try {
        const [recipient, amount] = await contract.royaltyInfo(tokenId, parseEther("1"));
        royaltyInfo = {
          recipient,
          percentage: Number(amount * 10000n / parseEther("1")) / 100
        };
      } catch {
        // Contract might not support royalties
      }

      const nft: NFTDetails = {
        contractAddress,
        tokenId,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        owner: address || ethers.ZeroAddress,
        creator,
        tokenType,
        attributes: metadata.attributes?.map(attr => ({
          trait_type: attr.trait_type,
          value: String(attr.value),
          rarity: attr.rarity
        })) || [],
        royalty: royaltyInfo
      };

      setNftDetails(nft);

      // Fetch listing information
      const listingData = await exchangeService.getListingByNFT(
        contractAddress,
        tokenId,
        tokenType
      );

      if (listingData) {
        setListing({
          listingId: listingData.listingId,
          seller: listingData.seller,
          price: listingData.price,
          expirationTime: listingData.expirationTime,
          isActive: listingData.isActive
        });
      } else {
        setListing(null);
      }

      // Fetch offers
      try {
        const offerManager = await offerService.getOfferManagerContract();
        const nftOffers = await offerManager.getNFTOffers(contractAddress, tokenId);
        
        const formattedOffers: OfferInfo[] = nftOffers
          .filter((offer: any) => offer.isActive)
          .map((offer: any) => ({
            offerId: offer.offerId,
            offerer: offer.offerer,
            amount: offer.amount,
            expirationTime: offer.expirationTime,
            isActive: offer.isActive
          }));
        
        setOffers(formattedOffers);
      } catch (error) {
        logger.warn("Failed to fetch offers", error, {
          component: "NFTDetailPage",
          action: "fetchNFTData"
        });
        setOffers([]);
      }

      // Fetch price history
      try {
        const history = await listingHistoryTrackerService.getNFTHistory(
          contractAddress,
          BigInt(tokenId),
          10 // last 10 transactions
        );
        
        const formattedHistory: PriceHistory[] = history
          .filter((tx: any) => tx.txType === "SALE_COMPLETED")
          .map((tx: any) => ({
            price: tx.price,
            timestamp: tx.timestamp,
            buyer: tx.buyer,
            seller: tx.seller,
            txHash: tx.listingId // Using listingId as txHash reference
          }));
        
        setPriceHistory(formattedHistory);
      } catch (error) {
        logger.warn("Failed to fetch price history", error, {
          component: "NFTDetailPage",
          action: "fetchNFTData"
        });
        setPriceHistory([]);
      }

      logger.success("NFT data fetched successfully from blockchain", null, {
        component: "NFTDetailPage",
        action: "fetchNFTData"
      });
    } catch (error) {
      logger.error("Failed to fetch NFT data", error, {
        component: "NFTDetailPage",
        action: "fetchNFTData"
      });
      toast.error("Failed to load NFT details");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!listing) return;

    try {
      logger.info("Buying NFT", { listingId: listing.listingId }, {
        component: "NFTDetailPage",
        action: "handleBuyNow"
      });

      // Calculate total price with fees
      const fees = await exchangeService.calculateFees(
        nftDetails!.contractAddress,
        nftDetails!.tokenId,
        formatEther(listing.price),
        address
      );
      
      const tx = await exchangeService.buyListing(
        contractAddress,
        tokenId,
        "1",
        nftDetails?.tokenType || "ERC721"
      );

      toast.success("NFT purchased successfully!");
      await fetchNFTData(); // Refresh data
    } catch (error) {
      logger.error("Failed to buy NFT", error, {
        component: "NFTDetailPage",
        action: "handleBuyNow"
      });
      toast.error("Failed to purchase NFT");
    }
  };

  const handleMakeOffer = async () => {
    if (!offerAmount) return;

    try {
      logger.info("Making offer", { amount: offerAmount }, {
        component: "NFTDetailPage",
        action: "handleMakeOffer"
      });

      const offerManager = await offerService.getOfferManagerContract();
      const duration = 7 * 24 * 60 * 60; // 7 days in seconds
      
      await offerManager.createNFTOffer(
        contractAddress,
        tokenId,
        parseEther(offerAmount),
        duration,
        { value: parseEther(offerAmount) }
      );

      toast.success("Offer submitted successfully!");
      setOfferAmount("");
      await fetchNFTData();
    } catch (error) {
      logger.error("Failed to make offer", error, {
        component: "NFTDetailPage",
        action: "handleMakeOffer"
      });
      toast.error("Failed to submit offer");
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      logger.info("Accepting offer", { offerId }, {
        component: "NFTDetailPage",
        action: "handleAcceptOffer"
      });

      // First approve the NFT
      const nftContract = new ethers.Contract(
        contractAddress,
        ["function approve(address to, uint256 tokenId)"],
        await exchangeService.getSigner()
      );
      
      const offerManagerAddress = await offerService.getOfferManagerAddress();
      await nftContract.approve(offerManagerAddress, tokenId);
      
      // Then accept the offer
      const offerManager = await offerService.getOfferManagerContract();
      await offerManager.acceptNFTOffer(offerId);
      toast.success("Offer accepted!");
      await fetchNFTData();
    } catch (error) {
      logger.error("Failed to accept offer", error, {
        component: "NFTDetailPage",
        action: "handleAcceptOffer"
      });
      toast.error("Failed to accept offer");
    }
  };

  const handleCreateListing = async () => {
    if (!listingPrice || !listingDuration) return;

    try {
      logger.info("Creating listing", { price: listingPrice, duration: listingDuration }, {
        component: "NFTDetailPage",
        action: "handleCreateListing"
      });

      await exchangeService.createListing({
        contractAddress,
        tokenId,
        price: listingPrice,
        duration: listingDuration,
        tokenType: nftDetails?.tokenType || "ERC721"
      });

      toast.success("Listing created successfully!");
      setListingPrice("");
      await fetchNFTData();
    } catch (error) {
      logger.error("Failed to create listing", error, {
        component: "NFTDetailPage",
        action: "handleCreateListing"
      });
      toast.error("Failed to create listing");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const calculateTimeLeft = (timestamp: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const diff = Number(timestamp - now);
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    return `${hours} hour${hours > 1 ? 's' : ''} left`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-lg">Loading NFT details...</div>
        </div>
      </div>
    );
  }

  if (!nftDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg">NFT not found</p>
        </Card>
      </div>
    );
  }

  const isOwner = address?.toLowerCase() === nftDetails.owner.toLowerCase();
  const canBuy = listing?.isActive && !isOwner && isConnected;
  const canMakeOffer = !isOwner && isConnected;
  const canList = isOwner && !listing?.isActive;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Image */}
        <div>
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={nftDetails.image}
                alt={nftDetails.name}
                fill
                className="object-contain"
              />
            </div>
          </Card>

          {/* Properties */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {nftDetails.attributes.map((attr, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase">{attr.trait_type}</p>
                    <p className="font-semibold">{attr.value}</p>
                    {attr.rarity && (
                      <p className="text-xs text-blue-500">{attr.rarity}% rarity</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Title and Actions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge className="mb-2">{nftDetails.tokenType}</Badge>
                  <CardTitle className="text-2xl">{nftDetails.name}</CardTitle>
                  <CardDescription className="mt-2">
                    Token ID: #{nftDetails.tokenId}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{nftDetails.description}</p>
              
              <Separator className="my-4" />
              
              {/* Owner Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Owner</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>{formatAddress(nftDetails.owner).slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-mono text-sm">{formatAddress(nftDetails.owner)}</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(nftDetails.owner)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Creator</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>{formatAddress(nftDetails.creator).slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-mono text-sm">{formatAddress(nftDetails.creator)}</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(nftDetails.creator)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Royalty</span>
                  <span className="text-sm">{nftDetails.royalty.percentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price and Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Price & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {listing?.isActive ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Current Price</p>
                      <p className="text-3xl font-bold">{formatEther(listing.price)} ETH</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Expires in</p>
                      <p className="text-sm font-medium flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {calculateTimeLeft(listing.expirationTime)}
                      </p>
                    </div>
                  </div>

                  {canBuy && (
                    <Button onClick={handleBuyNow} className="w-full" size="lg">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Buy Now for {formatEther(listing.price)} ETH
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">Not currently for sale</p>
                </div>
              )}

              {canMakeOffer && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Make an Offer</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter offer amount in ETH"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      step="0.01"
                    />
                    <Button onClick={handleMakeOffer} variant="outline">
                      <HandshakeIcon className="w-4 h-4 mr-2" />
                      Offer
                    </Button>
                  </div>
                </div>
              )}

              {canList && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Create Listing</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Price in ETH"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      step="0.01"
                    />
                    <Input
                      type="number"
                      placeholder="Days"
                      value={listingDuration}
                      onChange={(e) => setListingDuration(e.target.value)}
                      className="w-24"
                    />
                    <Button onClick={handleCreateListing}>
                      List NFT
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Additional Info */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="offers">Offers</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="offers" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Offers</CardTitle>
                </CardHeader>
                <CardContent>
                  {offers.length > 0 ? (
                    <div className="space-y-3">
                      {offers.map((offer) => (
                        <div key={offer.offerId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-semibold">{formatEther(offer.amount)} ETH</p>
                            <p className="text-sm text-gray-500">
                              From {formatAddress(offer.offerer)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {calculateTimeLeft(offer.expirationTime)}
                            </p>
                          </div>
                          {isOwner && offer.isActive && (
                            <Button
                              size="sm"
                              onClick={() => handleAcceptOffer(offer.offerId)}
                            >
                              Accept
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No active offers</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Price History</CardTitle>
                </CardHeader>
                <CardContent>
                  {priceHistory.length > 0 ? (
                    <div className="space-y-3">
                      {priceHistory.map((history, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <div>
                              <p className="font-semibold">{formatEther(history.price)} ETH</p>
                              <p className="text-sm text-gray-500">
                                {new Date(Number(history.timestamp) * 1000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`https://etherscan.io/tx/${history.txHash}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No price history available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Token Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">Contract Address</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{formatAddress(contractAddress)}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(contractAddress)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">Token ID</span>
                    <span className="font-mono text-sm">{tokenId}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">Token Standard</span>
                    <span className="text-sm">{nftDetails.tokenType}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">Blockchain</span>
                    <span className="text-sm">Ethereum</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
