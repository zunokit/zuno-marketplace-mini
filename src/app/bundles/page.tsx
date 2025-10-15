"use client";

import { useState } from "react";
import { BundleBrowser } from "@/components/features/bundle/BundleBrowser";
import { CreateBundleForm } from "@/components/features/bundle/CreateBundleForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Package } from "lucide-react";

export default function BundlesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Package className="h-8 w-8" />
            NFT Bundles
          </h1>
          <p className="text-muted-foreground">
            Buy multiple NFTs at discounted prices in one transaction
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create NFT Bundle</DialogTitle>
            </DialogHeader>
            <CreateBundleForm onSuccess={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <BundleBrowser />
    </div>
  );
}
