"use client";

import { useAuction } from "zuno-marketplace-sdk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gavel } from "lucide-react";

export default function AuctionsPage() {
  const _auction = useAuction();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Gavel className="h-8 w-8" />
          NFT Auctions
        </h1>
        <p className="text-muted-foreground">
          Bid on English auctions or grab Dutch auction deals
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auctions</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Auction functionality coming soon with SDK v1.1.4+</p>
          <Button className="mt-4">Create Auction (Coming Soon)</Button>
        </CardContent>
      </Card>
    </div>
  );
}