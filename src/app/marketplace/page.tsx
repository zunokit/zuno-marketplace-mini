"use client";

import { useState } from "react";
import { MarketplaceBrowser } from "@/components/features/marketplace/MarketplaceBrowser";
import { CreateListingForm } from "@/components/features/marketplace/CreateListingForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ShoppingCart } from "lucide-react";

export default function MarketplacePage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            NFT Marketplace
          </h1>
          <p className="text-muted-foreground">
            Discover, buy, and sell unique digital assets
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create NFT Listing</DialogTitle>
            </DialogHeader>
            <CreateListingForm onSuccess={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <MarketplaceBrowser />
    </div>
  );
}
