"use client";

/**
 * Fee Management Admin Page
 * Configure platform fees and royalties
 */

import { useState } from "react";
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
import { DollarSign, TrendingUp, Edit, Check, X } from "lucide-react";

export default function FeeManagementPage() {
  const { toast } = useToast();

  const [platformFee, setPlatformFee] = useState("2.0");
  const [editingFee, setEditingFee] = useState(false);
  const [newFeeValue, setNewFeeValue] = useState("");

  const [feeStats] = useState({
    last7Days: {
      volume: "123.45",
      fees: "2.47",
      transactions: 156,
    },
    last30Days: {
      volume: "567.89",
      fees: "11.36",
      transactions: 689,
    },
    allTime: {
      volume: "2345.67",
      fees: "46.91",
      transactions: 2834,
    },
  });

  /**
   * Handle update platform fee
   */
  const handleUpdateFee = async () => {
    const feeValue = parseFloat(newFeeValue);

    if (isNaN(feeValue) || feeValue < 0 || feeValue > 10) {
      toast({
        title: "Invalid Fee",
        description: "Platform fee must be between 0% and 10%",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mock - in real app, call FeeManager contract
      // await feeManager.updatePlatformFee(feeValue * 100) // Convert to basis points

      setPlatformFee(newFeeValue);
      setEditingFee(false);
      setNewFeeValue("");

      toast({
        title: "Fee Updated",
        description: `Platform fee updated to ${newFeeValue}%`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Failed to update fee",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">💰 Fee Management</h2>
        <p className="text-muted-foreground">
          Configure platform fees and view revenue statistics
        </p>
      </div>

      {/* Current Fee */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Platform Fee</CardTitle>
          <CardDescription>
            Current fee charged on all marketplace transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold">{platformFee}%</span>
                <Badge variant="outline">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Fee is applied to sale price before royalties
              </p>
            </div>
            <Button onClick={() => {
              setNewFeeValue(platformFee);
              setEditingFee(true);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Update Fee
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fee Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Volume</p>
              <p className="text-2xl font-bold">{feeStats.last7Days.volume} ETH</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Platform Fees</p>
              <p className="text-xl font-semibold text-green-600">
                {feeStats.last7Days.fees} ETH
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {feeStats.last7Days.transactions} transactions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Volume</p>
              <p className="text-2xl font-bold">{feeStats.last30Days.volume} ETH</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Platform Fees</p>
              <p className="text-xl font-semibold text-green-600">
                {feeStats.last30Days.fees} ETH
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {feeStats.last30Days.transactions} transactions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">All Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Volume</p>
              <p className="text-2xl font-bold">{feeStats.allTime.volume} ETH</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Platform Fees</p>
              <p className="text-xl font-semibold text-green-600">
                {feeStats.allTime.fees} ETH
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {feeStats.allTime.transactions} transactions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Fee distribution across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Platform Fees</p>
                <p className="text-sm text-muted-foreground">
                  {platformFee}% of transaction value
                </p>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {feeStats.allTime.fees} ETH
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Creator Royalties</p>
                <p className="text-sm text-muted-foreground">
                  Varies by collection (typically 2.5-10%)
                </p>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {(parseFloat(feeStats.allTime.fees) * 3).toFixed(2)} ETH
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Fee Dialog */}
      <Dialog open={editingFee} onOpenChange={setEditingFee}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Platform Fee</DialogTitle>
            <DialogDescription>
              Set the new platform fee percentage (0% - 10%)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fee">Platform Fee (%)</Label>
              <Input
                id="fee"
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="2.0"
                value={newFeeValue}
                onChange={(e) => setNewFeeValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Current fee: {platformFee}%
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">Example Impact:</p>
              <p className="text-sm text-muted-foreground">
                For a 10 ETH sale, platform fee would be{" "}
                <strong>
                  {newFeeValue ? (10 * parseFloat(newFeeValue) / 100).toFixed(2) : "0.00"} ETH
                </strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFee(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFee}>
              <Check className="h-4 w-4 mr-2" />
              Update Fee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

