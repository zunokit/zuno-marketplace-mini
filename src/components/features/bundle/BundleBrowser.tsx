"use client";

import { useState, useEffect, useMemo } from "react";
import { logger } from "@/lib/utils/logger";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BundleCard } from "./BundleCard";
import { Search, Grid3X3, List, RefreshCw, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/providers/WalletProvider";
import { useBundle } from "@/hooks/use-bundle";

export function BundleBrowser() {
  const { account } = useWallet();
  const { getActiveBundles, buyBundle, cancelBundle } = useBundle();
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBundles = async () => {
    setLoading(true);
    setError(null);
    try {
      logger.startTimer("fetch-bundles");
      const data = await getActiveBundles();
      setBundles(data);
      logger.endTimer("fetch-bundles", `Fetched ${data.length} bundles`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch bundles";
      setError(errorMsg);
      logger.error("Failed to fetch bundles", err, {
        component: "BundleBrowser",
        action: "fetchBundles",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  const filteredBundles = useMemo(() => {
    return bundles.filter((bundle) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return bundle.id.toLowerCase().includes(query);
      }
      return true;
    });
  }, [bundles, searchQuery]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Failed to load bundles</p>
        <Button variant="outline" onClick={fetchBundles}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            NFT Bundles
          </h1>
          <p className="text-muted-foreground">Buy multiple NFTs in one transaction</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search bundles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {loading ? "Loading..." : `${filteredBundles.length} bundles`}
      </p>

      {loading ? (
        <div
          className={cn(
            "grid gap-6",
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          )}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredBundles.length > 0 ? (
        <div
          className={cn(
            "grid gap-6",
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 max-w-2xl mx-auto"
          )}
        >
          {filteredBundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              isOwner={bundle.seller === account}
              onBuy={async () => {
                try {
                  await buyBundle(bundle.id);
                  await fetchBundles();
                } catch (error) {
                  logger.error("Failed to buy bundle", error, {
                    component: "BundleBrowser",
                    action: "buyBundle",
                  });
                }
              }}
              onCancel={async () => {
                try {
                  await cancelBundle(bundle.id);
                  await fetchBundles();
                } catch (error) {
                  logger.error("Failed to cancel bundle", error, {
                    component: "BundleBrowser",
                    action: "cancelBundle",
                  });
                }
              }}
              onView={() => {
                window.location.href = `/bundles/${bundle.id}`;
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No bundles found</h3>
          <p className="text-muted-foreground">Try adjusting your search</p>
        </div>
      )}
    </div>
  );
}
