"use client";

import { logger } from "@/lib/utils/logger";

/**
 * Fee Management Admin Page
 * Configure platform fees using FeeManagerService
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/lib/store/hooks";
import {
  feeManagerService,
  FeeConfig,
  FeeTierConfig,
} from "@/lib/services/contracts";
import { DollarSign, TrendingUp, Edit, Users, Star } from "lucide-react";

export default function FeeManagementPage() {
  const { toast } = useToast();
  const { account } = useAppSelector((state) => state.wallet);

  const [baseFeeConfig, setBaseFeeConfig] = useState<FeeConfig>({
    makerFee: BigInt(200), // 2%
    takerFee: BigInt(0),
    listingFee: BigInt(0),
    auctionFee: BigInt(50), // 0.5%
    bundleFee: BigInt(25), // 0.25%
    isActive: true,
  });

  const [feeTiers, setFeeTiers] = useState<FeeTierConfig[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Load fee configuration
   */
  useEffect(() => {
    if (account) {
      loadFeeConfig();
    }
  }, [account]);

  const loadFeeConfig = async () => {
    try {
      const config = await feeManagerService.getBaseFeeConfig();
      setBaseFeeConfig(config);

      const tiers = await feeManagerService.getAllFeeTierConfigs();
      setFeeTiers(tiers);
    } catch (error) {
      logger.error("Failed to load fee config", error, {
        component: "AdminFeesPage",
        action: "loadFeeConfig",
      });
    }
  };

  /**
   * Handle update base fee
   */
  const handleUpdateBaseFee = async () => {
    setLoading(true);

    try {
      await feeManagerService.updateBaseFeeConfig(baseFeeConfig);

      toast({
        title: "Fee Updated",
        description: "Base fee configuration has been updated successfully",
      });

      setEditDialogOpen(false);
      await loadFeeConfig();
    } catch (error) {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Failed to update fee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update fee config
   */
  const updateFeeConfig = (field: keyof FeeConfig, value: bigint) => {
    setBaseFeeConfig({ ...baseFeeConfig, [field]: value });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">💰 Fee Management</h2>
        <p className="text-muted-foreground">
          Configure platform fees and view tier discounts
        </p>
      </div>

      {/* Base Fee Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Base Fee Configuration</CardTitle>
              <CardDescription>Platform-wide fee settings</CardDescription>
            </div>
            <Button onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Fees
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Maker Fee (Seller)</Label>
              <p className="text-2xl font-bold">
                {Number(baseFeeConfig.makerFee) / 100}%
              </p>
              <p className="text-sm text-muted-foreground">
                Fee paid by sellers
              </p>
            </div>
            <div>
              <Label>Taker Fee (Buyer)</Label>
              <p className="text-2xl font-bold">
                {Number(baseFeeConfig.takerFee) / 100}%
              </p>
              <p className="text-sm text-muted-foreground">
                Fee paid by buyers
              </p>
            </div>
            <div>
              <Label>Auction Fee</Label>
              <p className="text-2xl font-bold">
                {Number(baseFeeConfig.auctionFee) / 100}%
              </p>
              <p className="text-sm text-muted-foreground">
                Additional auction fee
              </p>
            </div>
            <div>
              <Label>Bundle Fee</Label>
              <p className="text-2xl font-bold">
                {Number(baseFeeConfig.bundleFee) / 100}%
              </p>
              <p className="text-sm text-muted-foreground">Bundle sale fee</p>
            </div>
            <div>
              <Label>Status</Label>
              <Badge variant={baseFeeConfig.isActive ? "default" : "secondary"}>
                {baseFeeConfig.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Fee Tier Discounts
          </CardTitle>
          <CardDescription>
            Volume-based fee discounts for active traders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feeTiers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No fee tiers configured
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feeTiers.map((tier, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{tier.tierName}</CardTitle>
                    <CardDescription>
                      Tier {index} - Volume threshold
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Min Volume
                        </span>
                        <span className="font-medium">
                          {Number(tier.volumeThreshold) / 1e18} ETH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Discount
                        </span>
                        <span className="font-medium">
                          {Number(tier.discountBps) / 100}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status
                        </span>
                        <Badge
                          variant={tier.isActive ? "default" : "secondary"}
                        >
                          {tier.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Fee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Base Fees</DialogTitle>
            <DialogDescription>
              Update platform fee configuration (in basis points, 100 = 1%)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="makerFee">
                Maker Fee (Seller) - Current:{" "}
                {Number(baseFeeConfig.makerFee) / 100}%
              </Label>
              <Input
                id="makerFee"
                type="number"
                value={Number(baseFeeConfig.makerFee)}
                onChange={(e) =>
                  updateFeeConfig("makerFee", BigInt(e.target.value))
                }
              />
            </div>

            <div>
              <Label htmlFor="takerFee">
                Taker Fee (Buyer) - Current:{" "}
                {Number(baseFeeConfig.takerFee) / 100}%
              </Label>
              <Input
                id="takerFee"
                type="number"
                value={Number(baseFeeConfig.takerFee)}
                onChange={(e) =>
                  updateFeeConfig("takerFee", BigInt(e.target.value))
                }
              />
            </div>

            <div>
              <Label htmlFor="auctionFee">
                Auction Fee - Current: {Number(baseFeeConfig.auctionFee) / 100}%
              </Label>
              <Input
                id="auctionFee"
                type="number"
                value={Number(baseFeeConfig.auctionFee)}
                onChange={(e) =>
                  updateFeeConfig("auctionFee", BigInt(e.target.value))
                }
              />
            </div>

            <div>
              <Label htmlFor="bundleFee">
                Bundle Fee - Current: {Number(baseFeeConfig.bundleFee) / 100}%
              </Label>
              <Input
                id="bundleFee"
                type="number"
                value={Number(baseFeeConfig.bundleFee)}
                onChange={(e) =>
                  updateFeeConfig("bundleFee", BigInt(e.target.value))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateBaseFee} disabled={loading}>
              {loading ? "Updating..." : "Update Fees"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
