"use client";

import { useState } from "react";
import { AuctionBrowser } from "@/components/features/auction/AuctionBrowser";
import { CreateAuctionForm } from "@/components/features/auction/CreateAuctionForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Gavel } from "lucide-react";

export default function AuctionsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Gavel className="h-8 w-8" />
            NFT Auctions
          </h1>
          <p className="text-muted-foreground">
            Bid on English auctions or grab Dutch auction deals
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Auction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Auction</DialogTitle>
            </DialogHeader>
            <CreateAuctionForm onSuccess={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <AuctionBrowser />
    </div>
  );
}
