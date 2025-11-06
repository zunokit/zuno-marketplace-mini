"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import {
  offerService,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Gift,
  Package,
  Tag,
  DollarSign,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  TrendingUp,
  AlertCircle,
  Heart,
  Zap,
  Filter
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatEther, parseEther } from "ethers";

interface Offer {
  offerId: string;
  offerType: "NFT" | "COLLECTION" | "TRAIT";
  offerer: string;
  collection: string;
  tokenId?: string;
  traitType?: string;
  traitValue?: string;
  offerAmount: bigint;
  paymentToken: string;
  quantity?: number;
  expirationTime: bigint;
  status: "ACTIVE" | "ACCEPTED" | "CANCELLED" | "EXPIRED";
  metadata?: {
    collectionName?: string;
    nftName?: string;
    image?: string;
  };
}

export default function OffersPage() {
  const { account: address, isConnected } = useWallet();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"nft" | "collection" | "trait">("nft");
  
  // Create offer dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [offerType, setOfferType] = useState<"nft" | "collection" | "trait">("nft");
  const [targetCollection, setTargetCollection] = useState("");
  const [targetTokenId, setTargetTokenId] = useState("");
  const [traitType, setTraitType] = useState("");
  const [traitValue, setTraitValue] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [paymentToken, setPaymentToken] = useState("ETH");
  const [quantity, setQuantity] = useState("1");
  const [duration, setDuration] = useState("7"); // days
  const [creating, setCreating] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("active");
  const [filterMine, setFilterMine] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, [activeTab, filterStatus, filterMine, address]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      logger.info(`Fetching ${activeTab} offers from blockchain`, null, {
        component: "OffersPage",
        action: "fetchOffers"
      });

      const offerManager = await offerService.getOfferManagerContract();
      
      // Get offers based on type
      let filter;
      switch (activeTab) {
        case "nft":
          filter = offerManager.filters.NFTOfferCreated();
          break;
        case "collection":
          filter = offerManager.filters.CollectionOfferCreated();
          break;
        case "trait":
          filter = offerManager.filters.TraitOfferCreated();
          break;
      }

      const events = await offerManager.queryFilter(filter);
      
      const offerPromises = events.map(async (event) => {
        try {
          const offerId = (event as any).args?.[0];
          if (!offerId) return null;

          // Get offer details from contract
          const offer = await offerManager.getOffer(offerId);
          
          // Check status
          const now = BigInt(Math.floor(Date.now() / 1000));
          const isExpired = offer.expirationTime <= now;
          const status = offer.status === 0 ? (isExpired ? "EXPIRED" : "ACTIVE") :
                        offer.status === 1 ? "ACCEPTED" : "CANCELLED";
          
          // Apply filters
          if (filterStatus === "active" && status !== "ACTIVE") return null;
          if (filterStatus === "expired" && status !== "EXPIRED") return null;
          if (filterMine && offer.offerer !== address) return null;

          // Get metadata
          const metadata: any = {};
          try {
            if (activeTab === "nft" && offer.tokenId) {
              const nftMeta = await nftMetadataService.getNFTMetadata(
                offer.collection,
                offer.tokenId.toString()
              );
              metadata.nftName = nftMeta?.name;
              metadata.image = nftMeta?.image;
            }
            
            const collectionMeta = await nftMetadataService.getCollectionMetadata(
              offer.collection
            );
            metadata.collectionName = collectionMeta?.name;
          } catch {}

          return {
            offerId,
            offerType: activeTab.toUpperCase() as "NFT" | "COLLECTION" | "TRAIT",
            offerer: offer.offerer,
            collection: offer.collection,
            tokenId: offer.tokenId?.toString(),
            traitType: offer.traitType,
            traitValue: offer.traitValue,
            offerAmount: offer.offerAmount,
            paymentToken: offer.paymentToken,
            quantity: offer.quantity ? Number(offer.quantity) : undefined,
            expirationTime: offer.expirationTime,
            status,
            metadata
          } as Offer;
        } catch (error) {
          logger.warn("Failed to fetch offer data", error, {
            component: "OffersPage",
            action: "fetchOffers"
          });
          return null;
        }
      });

      const offerData = (await Promise.all(offerPromises))
        .filter(o => o !== null) as Offer[];

      setOffers(offerData);
      logger.success(`Fetched ${offerData.length} ${activeTab} offers`, null, {
        component: "OffersPage",
        action: "fetchOffers"
      });
    } catch (error) {
      logger.error("Failed to fetch offers", error, {
        component: "OffersPage",
        action: "fetchOffers"
      });
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setCreating(true);
      const amount = parseEther(offerAmount);
      const durationInSeconds = parseInt(duration) * 86400; // days to seconds
      
      logger.info("Creating offer", {
        type: offerType,
        collection: targetCollection,
        amount: offerAmount
      }, {
        component: "OffersPage",
        action: "handleCreateOffer"
      });

      let tx;
      let txHash: string;
      if (offerType === "nft") {
        txHash = await offerService.createNFTOffer({
          collection: targetCollection,
          tokenId: targetTokenId,
          price: amount.toString(),
          expirationTime: Math.floor(Date.now() / 1000) + durationInSeconds
        });
      } else if (offerType === "collection") {
        txHash = await offerService.createCollectionOffer({
          collection: targetCollection,
          price: amount.toString(),
          quantity: parseInt(quantity),
          expirationTime: Math.floor(Date.now() / 1000) + durationInSeconds
        });
      } else {
        txHash = await offerService.createTraitOffer({
          collection: targetCollection,
          traits: [traitType, traitValue],
          price: amount.toString(),
          quantity: parseInt(quantity),
          expirationTime: Math.floor(Date.now() / 1000) + durationInSeconds
        });
      }

      // Transaction hash is returned, no need to wait
      toast.success("Offer created successfully!");
      setCreateDialogOpen(false);
      
      // Reset form
      setTargetCollection("");
      setTargetTokenId("");
      setTraitType("");
      setTraitValue("");
      setOfferAmount("");
      setQuantity("1");
      setDuration("7");
      
      // Refresh offers
      await fetchOffers();
    } catch (error: any) {
      logger.error("Failed to create offer", error, {
        component: "OffersPage",
        action: "handleCreateOffer"
      });
      toast.error(error.message || "Failed to create offer");
    } finally {
      setCreating(false);
    }
  };

  const handleCancelOffer = async (offerId: string) => {
    try {
      logger.info("Cancelling offer", { offerId }, {
        component: "OffersPage",
        action: "handleCancelOffer"
      });

      const tx = await offerService.cancelOffer(offerId);
      await tx.wait();
      
      toast.success("Offer cancelled successfully!");
      await fetchOffers();
    } catch (error) {
      logger.error("Failed to cancel offer", error, {
        component: "OffersPage",
        action: "handleCancelOffer"
      });
      toast.error("Failed to cancel offer");
    }
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

  const OfferCard = ({ offer }: { offer: Offer }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {offer.offerType === "NFT" 
                ? (offer.metadata?.nftName || `Token #${offer.tokenId}`)
                : offer.offerType === "COLLECTION"
                ? (offer.metadata?.collectionName || "Collection Offer")
                : `${offer.traitType}: ${offer.traitValue}`}
            </CardTitle>
            <CardDescription>
              {offer.metadata?.collectionName && offer.offerType === "NFT" && (
                <span>{offer.metadata.collectionName}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={offer.offerType === "NFT" ? "default" : 
                          offer.offerType === "COLLECTION" ? "secondary" : "outline"}>
              {offer.offerType === "NFT" ? <Gift className="w-3 h-3 mr-1" /> :
               offer.offerType === "COLLECTION" ? <Package className="w-3 h-3 mr-1" /> :
               <Tag className="w-3 h-3 mr-1" />}
              {offer.offerType}
            </Badge>
            {offer.status === "ACTIVE" ? (
              <Badge variant="default" className="bg-green-500">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimeLeft(offer.expirationTime)}
              </Badge>
            ) : (
              <Badge variant="secondary">{offer.status}</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {offer.metadata?.image && (
          <div className="mb-4">
            <img
              src={offer.metadata.image}
              alt=""
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Offer Amount</span>
            <span className="font-bold text-lg">
              {formatEther(offer.offerAmount)} {offer.paymentToken === ethers.ZeroAddress ? "ETH" : "Token"}
            </span>
          </div>

          {offer.quantity && offer.quantity > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Quantity</span>
              <span className="font-medium">{offer.quantity} NFTs</span>
            </div>
          )}

          {offer.offerType === "TRAIT" && (
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-sm">
                <span className="font-medium">{offer.traitType}:</span> {offer.traitValue}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">From</span>
            <span className="font-mono">
              {offer.offerer.slice(0, 6)}...{offer.offerer.slice(-4)}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            {offer.status === "ACTIVE" && (
              <>
                {offer.offerer === address ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleCancelOffer(offer.offerId)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                ) : offer.offerType === "NFT" ? (
                  <Link href={`/nft/${offer.collection}/${offer.tokenId}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View NFT
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/collections/${offer.collection}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Collection
                    </Button>
                  </Link>
                )}
              </>
            )}
            {offer.offerType === "COLLECTION" && offer.status === "ACTIVE" && offer.offerer !== address && (
              <Button className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept with NFT
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">NFT Offers</h1>
            <p className="text-gray-600">Make and manage offers on NFTs, collections, and traits</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Gift className="w-4 h-4 mr-2" />
                Make Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Offer</DialogTitle>
                <DialogDescription>
                  Make an offer on NFTs, collections, or specific traits
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Offer Type</Label>
                  <Tabs value={offerType} onValueChange={(v) => setOfferType(v as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="nft">NFT</TabsTrigger>
                      <TabsTrigger value="collection">Collection</TabsTrigger>
                      <TabsTrigger value="trait">Trait</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div>
                  <Label htmlFor="collection">Collection Address</Label>
                  <Input
                    id="collection"
                    placeholder="0x..."
                    value={targetCollection}
                    onChange={(e) => setTargetCollection(e.target.value)}
                  />
                </div>
                
                {offerType === "nft" && (
                  <div>
                    <Label htmlFor="tokenId">Token ID</Label>
                    <Input
                      id="tokenId"
                      placeholder="1"
                      value={targetTokenId}
                      onChange={(e) => setTargetTokenId(e.target.value)}
                    />
                  </div>
                )}
                
                {offerType === "trait" && (
                  <>
                    <div>
                      <Label htmlFor="traitType">Trait Type</Label>
                      <Input
                        id="traitType"
                        placeholder="Background"
                        value={traitType}
                        onChange={(e) => setTraitType(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="traitValue">Trait Value</Label>
                      <Input
                        id="traitValue"
                        placeholder="Blue"
                        value={traitValue}
                        onChange={(e) => setTraitValue(e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                {(offerType === "collection" || offerType === "trait") && (
                  <div>
                    <Label htmlFor="quantity">Quantity (Max NFTs)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      max={offerType === "collection" ? "100" : "50"}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="amount">
                    {offerType === "nft" ? "Offer Amount (ETH)" : "Price per NFT (ETH)"}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.1"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    step="0.01"
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="7"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                
                {(offerType === "collection" || offerType === "trait") && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Total offer value: {parseFloat(offerAmount || "0") * parseInt(quantity || "1")} ETH
                      for up to {quantity} NFTs
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateOffer} 
                  disabled={creating || !targetCollection || !offerAmount ||
                           (offerType === "nft" && !targetTokenId) ||
                           (offerType === "trait" && (!traitType || !traitValue))}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Create Offer
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="nft">
                <Gift className="w-4 h-4 mr-2" />
                NFT Offers
              </TabsTrigger>
              <TabsTrigger value="collection">
                <Package className="w-4 h-4 mr-2" />
                Collection Offers
              </TabsTrigger>
              <TabsTrigger value="trait">
                <Tag className="w-4 h-4 mr-2" />
                Trait Offers
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <select
                className="px-4 py-2 border rounded-md"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired</option>
              </select>
              
              <Button
                variant={filterMine ? "default" : "outline"}
                onClick={() => setFilterMine(!filterMine)}
              >
                <User className="w-4 h-4 mr-2" />
                My Offers
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map(offer => (
                <OfferCard key={offer.offerId} offer={offer} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No {activeTab} offers found</p>
              {filterMine && (
                <p className="text-sm text-gray-400 mt-2">
                  Try removing the "My Offers" filter
                </p>
              )}
            </Card>
          )}
        </Tabs>
      </div>
    </div>
  );
}
