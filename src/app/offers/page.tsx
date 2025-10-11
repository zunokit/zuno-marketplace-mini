"use client";

/**
 * Offers Page
 * Migrated from frontend-foundry/src/components/OfferManager.jsx
 * Make, accept, and manage offers on NFTs
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/lib/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { offerService } from "@/lib/services/contracts/OfferService";
import {
  AlertCircle,
  Loader2,
  Clock,
  Check,
  X,
  TrendingUp,
} from "lucide-react";

// Offer types enum
enum OfferType {
  NFT = 0,
  COLLECTION = 1,
  TRAIT = 2,
}

enum OfferStatus {
  ACTIVE = "ACTIVE",
  ACCEPTED = "ACCEPTED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

interface Offer {
  id: string;
  type: OfferType;
  nftContract: string;
  tokenId?: string;
  collectionName: string;
  offerPrice: string;
  quantity: number;
  status: OfferStatus;
  creator: string;
  expirationTime: number;
  expiresAt: number;
  createdAt: number;
  traits?: string[];
  nftImage?: string;
  nftName?: string;
}

export default function OffersPage() {
  const { toast } = useToast();

  // Redux state
  const { account, isConnected } = useAppSelector((state) => state.wallet);

  // Local state
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [userOffers, setUserOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);

  // Offer creation state
  const [offerType, setOfferType] = useState<
    "nft" | "collection" | "trait" | null
  >(null);
  const [nftOffer, setNftOffer] = useState({
    collection: "",
    tokenId: "",
    price: "",
    expirationDays: "7",
  });
  const [collectionOffer, setCollectionOffer] = useState({
    collection: "",
    price: "",
    expirationDays: "7",
  });
  const [traitOffer, setTraitOffer] = useState({
    collection: "",
    traits: "",
    price: "",
    expirationDays: "7",
  });

  /**
   * Load offers and subscribe to events
   */
  useEffect(() => {
    if (account) {
      loadOffers();

      // TODO: Subscribe to real-time events
      // Requires provider to be available in component
    }
  }, [account]);

  /**
   * Load offers from blockchain
   */
  const loadOffers = async () => {
    if (!account) return;

    setLoading(true);
    try {
      // Real blockchain data
      const [active, user] = await Promise.all([
        offerService.getActiveOffers(),
        offerService.getUserOffers(account),
      ]);

      // Convert OfferInfo to Offer format for compatibility
      const convertOfferInfo = (offerInfo: any) => ({
        id: offerInfo.id,
        type: offerInfo.offerType,
        nftContract: offerInfo.collection,
        tokenId: offerInfo.tokenId,
        collectionName: `Collection ${offerInfo.collection.slice(0, 6)}...`,
        offerPrice: offerInfo.price,
        quantity: offerInfo.quantity,
        status: offerInfo.status,
        creator: offerInfo.creator,
        expirationTime: offerInfo.expirationTime,
        expiresAt: offerInfo.expirationTime,
        createdAt: Date.now(),
        traits: offerInfo.traits || [],
      });

      setActiveOffers(active.map(convertOfferInfo));
      setUserOffers(user.map(convertOfferInfo));
    } catch (error) {
      console.error("Error loading offers:", error);
      toast({
        title: "Error Loading Offers",
        description:
          error instanceof Error ? error.message : "Failed to load offers",
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
    const hours = Math.floor(
      (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  /**
   * Get offer type badge
   */
  const getOfferTypeBadge = (type: OfferType) => {
    switch (type) {
      case OfferType.NFT:
        return <Badge variant="default">NFT Offer</Badge>;
      case OfferType.COLLECTION:
        return <Badge variant="secondary">Collection Offer</Badge>;
      case OfferType.TRAIT:
        return <Badge variant="outline">Trait Offer</Badge>;
    }
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status: OfferStatus) => {
    switch (status) {
      case OfferStatus.ACTIVE:
        return (
          <Badge variant="default" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Active
          </Badge>
        );
      case OfferStatus.ACCEPTED:
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <Check className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case OfferStatus.CANCELLED:
        return (
          <Badge variant="destructive" className="gap-1">
            <X className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      case OfferStatus.EXPIRED:
        return <Badge variant="secondary">Expired</Badge>;
    }
  };

  /**
   * Handle accept offer
   */
  const handleAcceptOffer = async (offerId: string) => {
    try {
      // Real contract interaction
      await offerService.acceptOffer(offerId);
      toast({
        title: "Offer Accepted!",
        description: "You have successfully accepted the offer",
      });
      loadOffers();
    } catch (error) {
      toast({
        title: "Accept Failed",
        description:
          error instanceof Error ? error.message : "Failed to accept offer",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle cancel offer
   */
  const handleCancelOffer = async (offerId: string) => {
    try {
      // Real contract interaction
      await offerService.cancelOffer(offerId);
      toast({
        title: "Offer Cancelled",
        description: "Your offer has been cancelled",
      });
      loadOffers();
    } catch (error) {
      toast({
        title: "Cancel Failed",
        description:
          error instanceof Error ? error.message : "Failed to cancel offer",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle create NFT offer
   */
  const handleCreateNFTOffer = async () => {
    try {
      await offerService.createNFTOffer({
        collection: nftOffer.collection,
        tokenId: nftOffer.tokenId,
        price: nftOffer.price,
        expirationTime:
          Math.floor(Date.now() / 1000) +
          parseInt(nftOffer.expirationDays) * 24 * 60 * 60,
      });
      toast({
        title: "NFT Offer Created",
        description: "Your NFT offer has been created successfully",
      });
      setNftOffer({
        collection: "",
        tokenId: "",
        price: "",
        expirationDays: "7",
      });
      loadOffers();
    } catch (error) {
      toast({
        title: "Create Offer Failed",
        description:
          error instanceof Error ? error.message : "Failed to create NFT offer",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle create collection offer
   */
  const handleCreateCollectionOffer = async () => {
    try {
      await offerService.createCollectionOffer({
        collection: collectionOffer.collection,
        price: collectionOffer.price,
        quantity: 1, // Default quantity
        expirationTime:
          Math.floor(Date.now() / 1000) +
          parseInt(collectionOffer.expirationDays) * 24 * 60 * 60,
      });
      toast({
        title: "Collection Offer Created",
        description: "Your collection offer has been created successfully",
      });
      setCollectionOffer({ collection: "", price: "", expirationDays: "7" });
      loadOffers();
    } catch (error) {
      toast({
        title: "Create Offer Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create collection offer",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle create trait offer
   */
  const handleCreateTraitOffer = async () => {
    try {
      const traits = traitOffer.traits
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
      await offerService.createTraitOffer({
        collection: traitOffer.collection,
        traits,
        price: traitOffer.price,
        quantity: 1, // Default quantity
        expirationTime:
          Math.floor(Date.now() / 1000) +
          parseInt(traitOffer.expirationDays) * 24 * 60 * 60,
      });
      toast({
        title: "Trait Offer Created",
        description: "Your trait offer has been created successfully",
      });
      setTraitOffer({
        collection: "",
        traits: "",
        price: "",
        expirationDays: "7",
      });
      loadOffers();
    } catch (error) {
      toast({
        title: "Create Offer Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create trait offer",
        variant: "destructive",
      });
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
            Please connect your wallet to view and manage offers.
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
          💰 NFT Offers
        </h1>
        <p className="text-muted-foreground">Make and manage offers on NFTs</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">
            Browse Offers
            {activeOffers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeOffers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-offers">
            My Offers
            {userOffers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {userOffers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="create">Make Offer</TabsTrigger>
        </TabsList>

        {/* Browse Offers */}
        <TabsContent value="browse">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeOffers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Active Offers</AlertTitle>
              <AlertDescription>
                There are no active offers at the moment.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOffers.map((offer) => (
                <Card key={offer.id}>
                  {offer.type === OfferType.NFT && offer.nftImage && (
                    <div className="relative w-full h-48 bg-muted">
                      <Image
                        src={offer.nftImage}
                        alt={offer.nftName || "NFT"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-2 right-2">
                        {getOfferTypeBadge(offer.type)}
                      </div>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {offer.nftName || offer.collectionName}
                        </CardTitle>
                        <CardDescription>
                          {offer.type === OfferType.NFT
                            ? offer.collectionName
                            : `${offer.quantity} NFTs`}
                        </CardDescription>
                      </div>
                      {offer.type !== OfferType.NFT && (
                        <div>{getOfferTypeBadge(offer.type)}</div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Offer Price</span>
                      <span className="font-semibold text-lg">
                        {offer.offerPrice} ETH
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Expires in {formatTimeRemaining(offer.expiresAt)}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleAcceptOffer(offer.id)}
                    >
                      Accept Offer
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Offers */}
        <TabsContent value="my-offers">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userOffers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Offers Made</AlertTitle>
              <AlertDescription>
                You haven't made any offers yet. Go to the Make Offer tab to get
                started!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {userOffers.map((offer) => (
                <Card key={offer.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {offer.nftName || offer.collectionName}
                          </h3>
                          {getOfferTypeBadge(offer.type)}
                          {getStatusBadge(offer.status)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mt-4">
                          <div>
                            <p className="text-muted-foreground">Offer Price</p>
                            <p className="font-semibold">
                              {offer.offerPrice} ETH
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created</p>
                            <p className="font-semibold">
                              {new Date(offer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Expires</p>
                            <p className="font-semibold">
                              {formatTimeRemaining(offer.expiresAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {offer.status === OfferStatus.ACTIVE && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOffer(offer.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Make Offer */}
        <TabsContent value="create">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Make an Offer</h2>
              <p className="text-muted-foreground mb-6">
                Create offers for specific NFTs, entire collections, or NFTs
                with specific traits.
              </p>
            </div>

            {/* Offer Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="font-semibold mb-2">NFT Offer</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Make an offer for a specific NFT
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setOfferType("nft")}
                    >
                      Create NFT Offer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🏛️</div>
                    <h3 className="font-semibold mb-2">Collection Offer</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Make an offer for any NFT in a collection
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setOfferType("collection")}
                    >
                      Create Collection Offer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="font-semibold mb-2">Trait Offer</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Make an offer for NFTs with specific traits
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setOfferType("trait")}
                    >
                      Create Trait Offer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Offer Creation Forms */}
            {offerType === "nft" && (
              <Card>
                <CardHeader>
                  <CardTitle>NFT Offer</CardTitle>
                  <CardDescription>
                    Make an offer for a specific NFT
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nft-collection">Collection Address</Label>
                      <Input
                        id="nft-collection"
                        placeholder="0x..."
                        value={nftOffer.collection}
                        onChange={(e) =>
                          setNftOffer({
                            ...nftOffer,
                            collection: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="nft-tokenId">Token ID</Label>
                      <Input
                        id="nft-tokenId"
                        placeholder="123"
                        value={nftOffer.tokenId}
                        onChange={(e) =>
                          setNftOffer({ ...nftOffer, tokenId: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nft-price">Price (ETH)</Label>
                      <Input
                        id="nft-price"
                        placeholder="0.1"
                        value={nftOffer.price}
                        onChange={(e) =>
                          setNftOffer({ ...nftOffer, price: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="nft-expiration">Expiration (days)</Label>
                      <Input
                        id="nft-expiration"
                        placeholder="7"
                        value={nftOffer.expirationDays}
                        onChange={(e) =>
                          setNftOffer({
                            ...nftOffer,
                            expirationDays: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateNFTOffer}
                    disabled={
                      !nftOffer.collection ||
                      !nftOffer.tokenId ||
                      !nftOffer.price
                    }
                    className="w-full"
                  >
                    Create NFT Offer
                  </Button>
                </CardContent>
              </Card>
            )}

            {offerType === "collection" && (
              <Card>
                <CardHeader>
                  <CardTitle>Collection Offer</CardTitle>
                  <CardDescription>
                    Make an offer for any NFT in a collection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="collection-address">
                      Collection Address
                    </Label>
                    <Input
                      id="collection-address"
                      placeholder="0x..."
                      value={collectionOffer.collection}
                      onChange={(e) =>
                        setCollectionOffer({
                          ...collectionOffer,
                          collection: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="collection-price">Price (ETH)</Label>
                      <Input
                        id="collection-price"
                        placeholder="0.1"
                        value={collectionOffer.price}
                        onChange={(e) =>
                          setCollectionOffer({
                            ...collectionOffer,
                            price: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="collection-expiration">
                        Expiration (days)
                      </Label>
                      <Input
                        id="collection-expiration"
                        placeholder="7"
                        value={collectionOffer.expirationDays}
                        onChange={(e) =>
                          setCollectionOffer({
                            ...collectionOffer,
                            expirationDays: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateCollectionOffer}
                    disabled={
                      !collectionOffer.collection || !collectionOffer.price
                    }
                    className="w-full"
                  >
                    Create Collection Offer
                  </Button>
                </CardContent>
              </Card>
            )}

            {offerType === "trait" && (
              <Card>
                <CardHeader>
                  <CardTitle>Trait Offer</CardTitle>
                  <CardDescription>
                    Make an offer for NFTs with specific traits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="trait-collection">Collection Address</Label>
                    <Input
                      id="trait-collection"
                      placeholder="0x..."
                      value={traitOffer.collection}
                      onChange={(e) =>
                        setTraitOffer({
                          ...traitOffer,
                          collection: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="trait-traits">
                      Traits (comma-separated)
                    </Label>
                    <Input
                      id="trait-traits"
                      placeholder="Background: Blue, Eyes: Green"
                      value={traitOffer.traits}
                      onChange={(e) =>
                        setTraitOffer({ ...traitOffer, traits: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="trait-price">Price (ETH)</Label>
                      <Input
                        id="trait-price"
                        placeholder="0.1"
                        value={traitOffer.price}
                        onChange={(e) =>
                          setTraitOffer({
                            ...traitOffer,
                            price: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="trait-expiration">
                        Expiration (days)
                      </Label>
                      <Input
                        id="trait-expiration"
                        placeholder="7"
                        value={traitOffer.expirationDays}
                        onChange={(e) =>
                          setTraitOffer({
                            ...traitOffer,
                            expirationDays: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateTraitOffer}
                    disabled={
                      !traitOffer.collection ||
                      !traitOffer.traits ||
                      !traitOffer.price
                    }
                    className="w-full"
                  >
                    Create Trait Offer
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
