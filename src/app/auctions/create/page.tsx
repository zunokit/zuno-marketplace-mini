"use client";

// Force dynamic rendering to avoid SSR issues with wagmi/query
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Gavel, TrendingDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuction, useWallet } from "zuno-marketplace-sdk/react";
import { toast } from "sonner";

export default function CreateAuctionPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const { createEnglishAuction, createDutchAuction } = useAuction();

  const [auctionType, setAuctionType] = useState<"english" | "dutch">("english");
  const [formData, setFormData] = useState({
    collectionAddress: "",
    tokenId: "",
    startingBid: "",
    reservePrice: "",
    startPrice: "",
    endPrice: "",
    duration: "7",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);
    try {
      const durationSeconds = parseInt(formData.duration) * 24 * 60 * 60;

      if (auctionType === "english") {
        const result = await createEnglishAuction.mutateAsync({
          collectionAddress: formData.collectionAddress,
          tokenId: formData.tokenId,
          startingBid: formData.startingBid,
          reservePrice: formData.reservePrice || undefined,
          duration: durationSeconds,
        });
        toast.success(`English auction created! ID: ${result.auctionId}`);
        router.push(`/auctions/${result.auctionId}`);
      } else {
        const result = await createDutchAuction.mutateAsync({
          collectionAddress: formData.collectionAddress,
          tokenId: formData.tokenId,
          startPrice: formData.startPrice,
          endPrice: formData.endPrice,
          duration: durationSeconds,
        });
        toast.success(`Dutch auction created! ID: ${result.auctionId}`);
        router.push(`/auctions/${result.auctionId}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create auction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/auctions" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Auctions
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-6 w-6" />
              Create Auction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Auction Type */}
              <div className="space-y-3">
                <Label>Auction Type</Label>
                <RadioGroup
                  value={auctionType}
                  onValueChange={(v) => setAuctionType(v as "english" | "dutch")}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="english"
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      auctionType === "english" ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`}
                  >
                    <RadioGroupItem value="english" id="english" />
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <Gavel className="h-4 w-4" />
                        English
                      </div>
                      <p className="text-xs text-muted-foreground">Ascending price, highest bid wins</p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="dutch"
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      auctionType === "dutch" ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`}
                  >
                    <RadioGroupItem value="dutch" id="dutch" />
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <TrendingDown className="h-4 w-4" />
                        Dutch
                      </div>
                      <p className="text-xs text-muted-foreground">Descending price, first buyer wins</p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* NFT Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collectionAddress">Collection Address</Label>
                  <Input
                    id="collectionAddress"
                    name="collectionAddress"
                    placeholder="0x..."
                    value={formData.collectionAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenId">Token ID</Label>
                  <Input
                    id="tokenId"
                    name="tokenId"
                    placeholder="1"
                    value={formData.tokenId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* English Auction Fields */}
              {auctionType === "english" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startingBid">Starting Bid (ETH)</Label>
                    <Input
                      id="startingBid"
                      name="startingBid"
                      type="number"
                      step="0.001"
                      placeholder="0.1"
                      value={formData.startingBid}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reservePrice">Reserve Price (ETH)</Label>
                    <Input
                      id="reservePrice"
                      name="reservePrice"
                      type="number"
                      step="0.001"
                      placeholder="1.0 (optional)"
                      value={formData.reservePrice}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Dutch Auction Fields */}
              {auctionType === "dutch" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startPrice">Start Price (ETH)</Label>
                    <Input
                      id="startPrice"
                      name="startPrice"
                      type="number"
                      step="0.001"
                      placeholder="10.0"
                      value={formData.startPrice}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endPrice">End Price (ETH)</Label>
                    <Input
                      id="endPrice"
                      name="endPrice"
                      type="number"
                      step="0.001"
                      placeholder="1.0"
                      value={formData.endPrice}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="7"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !isConnected}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Gavel className="h-4 w-4 mr-2" />
                    Create {auctionType === "english" ? "English" : "Dutch"} Auction
                  </>
                )}
              </Button>

              {!isConnected && (
                <p className="text-sm text-center text-muted-foreground">
                  Please connect your wallet to create an auction
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
