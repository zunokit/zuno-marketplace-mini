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
import { isMockDataEnabled } from "@/lib/services/mock/mockDataService";
import {
  getMockOfferService,
  Offer,
  OfferType,
  OfferStatus,
} from "@/lib/services/mock/mockOfferService";
import {
  AlertCircle,
  Loader2,
  Clock,
  Check,
  X,
  TrendingUp,
} from "lucide-react";

export default function OffersPage() {
  const { toast } = useToast();

  // Redux state
  const { account, isConnected } = useAppSelector((state) => state.wallet);

  // Local state
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [userOffers, setUserOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [useMockData] = useState(isMockDataEnabled());

  /**
   * Load offers
   */
  useEffect(() => {
    if (account) {
      loadOffers();
    }
  }, [account]);

  /**
   * Load offers from mock service or blockchain
   */
  const loadOffers = async () => {
    if (!account) return;

    setLoading(true);
    try {
      if (useMockData) {
        const mockService = getMockOfferService();
        const [active, user] = await Promise.all([
          mockService.getActiveOffers(),
          mockService.getUserOffers(account),
        ]);
        setActiveOffers(active);
        setUserOffers(user);
      } else {
        // Real blockchain data
        // TODO: Fetch from OfferManager contract
        // const offerManager = getContract(OFFER_MANAGER_ADDRESS, OFFER_MANAGER_ABI)
        // const offers = await offerManager.getActiveOffers()

        toast({
          title: "Blockchain Integration",
          description: "Real offer system coming soon",
          variant: "default",
        });
      }
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
      if (useMockData) {
        const mockService = getMockOfferService();
        await mockService.acceptOffer(offerId);
        toast({
          title: "Offer Accepted!",
          description: "You have successfully accepted the offer",
        });
        loadOffers();
      } else {
        // Real contract interaction
        // await offerManager.acceptOffer(offerId)
        toast({
          title: "Contract Integration",
          description: "Real offer acceptance coming soon",
          variant: "default",
        });
      }
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
      if (useMockData) {
        const mockService = getMockOfferService();
        await mockService.cancelOffer(offerId);
        toast({
          title: "Offer Cancelled",
          description: "Your offer has been cancelled",
        });
        loadOffers();
      } else {
        // Real contract interaction
        // await offerManager.cancelOffer(offerId)
        toast({
          title: "Contract Integration",
          description: "Real offer cancellation coming soon",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Cancel Failed",
        description:
          error instanceof Error ? error.message : "Failed to cancel offer",
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Make Offer</AlertTitle>
            <AlertDescription>
              Offer creation form will be implemented next. You'll be able to
              make NFT, collection, and trait-based offers.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
