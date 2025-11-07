"use client";

import { logger } from "@/lib/utils/logger";

/**
 * Listing Validator Settings Admin Page
 * Configure validation rules for marketplace listings
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/lib/store/hooks";
import {
  listingValidatorService,
  ValidationSettings,
} from "@/lib/services/contracts";
import {
  Shield,
  Settings,
  CheckCircle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { ethers } from "ethers";

export default function ValidatorSettingsPage() {
  const { toast } = useToast();
  const { account } = useAppSelector((state) => state.wallet);

  const [globalSettings, setGlobalSettings] = useState<ValidationSettings>({
    minPrice: BigInt(0),
    maxPrice: ethers.parseEther("10000"),
    minDuration: BigInt(3600), // 1 hour
    maxDuration: BigInt(7776000), // 90 days
    cooldownPeriod: BigInt(300), // 5 minutes
    maxListingsPerUser: BigInt(100),
    requireVerifiedCollection: false,
    enableQualityCheck: true,
    isActive: true,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalValidated, setTotalValidated] = useState<bigint>(BigInt(0));

  /**
   * Load validator settings
   */
  useEffect(() => {
    if (account) {
      loadSettings();
    }
  }, [account]);

  const loadSettings = async () => {
    try {
      const settings = await listingValidatorService.getGlobalSettings();
      setGlobalSettings(settings);

      const paused = await listingValidatorService.isPaused();
      setIsPaused(paused);

      const total = await listingValidatorService.getTotalValidatedListings();
      setTotalValidated(total);
    } catch (error) {
      logger.error("Failed to load settings", error, {
        component: "AdminValidatorPage",
        action: "loadSettings",
      });
    }
  };

  /**
   * Handle update settings
   */
  const handleUpdateSettings = async () => {
    setLoading(true);

    try {
      await listingValidatorService.setGlobalSettings(globalSettings);

      toast({
        title: "Settings Updated",
        description: "Validation settings have been updated successfully",
      });

      await loadSettings();
    } catch (error) {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle pause/unpause
   */
  const handleTogglePause = async () => {
    setLoading(true);

    try {
      if (isPaused) {
        await listingValidatorService.unpause();
        toast({
          title: "Validator Unpaused",
          description: "Listing validator has been unpaused",
        });
      } else {
        await listingValidatorService.pause();
        toast({
          title: "Validator Paused",
          description: "Listing validator has been paused",
        });
      }

      await loadSettings();
    } catch (error) {
      toast({
        title: "Operation Failed",
        description:
          error instanceof Error ? error.message : "Failed to toggle pause",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update setting
   */
  const updateSetting = (field: keyof ValidationSettings, value: any) => {
    setGlobalSettings({ ...globalSettings, [field]: value });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">🛡️ Listing Validator</h2>
        <p className="text-muted-foreground">
          Configure validation rules for marketplace listings
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Validator Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Badge variant={isPaused ? "destructive" : "default"}>
                  {isPaused ? "Paused" : "Active"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Total Validated: {totalValidated.toString()}
                </span>
              </div>
            </div>
            <Button
              variant={isPaused ? "default" : "outline"}
              onClick={handleTogglePause}
              disabled={loading}
            >
              {isPaused ? (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Unpause
                </>
              ) : (
                <>
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Price Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Price Validation</CardTitle>
          <CardDescription>
            Minimum and maximum listing price requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minPrice">Minimum Price (ETH)</Label>
              <Input
                id="minPrice"
                type="number"
                step="0.001"
                value={ethers.formatEther(globalSettings.minPrice)}
                onChange={(e) =>
                  updateSetting(
                    "minPrice",
                    ethers.parseEther(e.target.value || "0")
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="maxPrice">Maximum Price (ETH)</Label>
              <Input
                id="maxPrice"
                type="number"
                step="1"
                value={ethers.formatEther(globalSettings.maxPrice)}
                onChange={(e) =>
                  updateSetting(
                    "maxPrice",
                    ethers.parseEther(e.target.value || "10000")
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duration Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Duration Validation</CardTitle>
          <CardDescription>
            Minimum and maximum listing duration requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minDuration">Minimum Duration (hours)</Label>
              <Input
                id="minDuration"
                type="number"
                value={Number(globalSettings.minDuration) / 3600}
                onChange={(e) =>
                  updateSetting(
                    "minDuration",
                    BigInt(Number(e.target.value) * 3600)
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="maxDuration">Maximum Duration (days)</Label>
              <Input
                id="maxDuration"
                type="number"
                value={Number(globalSettings.maxDuration) / 86400}
                onChange={(e) =>
                  updateSetting(
                    "maxDuration",
                    BigInt(Number(e.target.value) * 86400)
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Limits */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Limits</CardTitle>
          <CardDescription>Rate limiting and spam prevention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cooldown">Cooldown Period (seconds)</Label>
              <Input
                id="cooldown"
                type="number"
                value={Number(globalSettings.cooldownPeriod)}
                onChange={(e) =>
                  updateSetting("cooldownPeriod", BigInt(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="maxListings">Max Listings Per User</Label>
              <Input
                id="maxListings"
                type="number"
                value={Number(globalSettings.maxListingsPerUser)}
                onChange={(e) =>
                  updateSetting("maxListingsPerUser", BigInt(e.target.value))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
          <CardDescription>
            Enable or disable validation features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Verified Collections</Label>
              <p className="text-sm text-muted-foreground">
                Only allow listings from verified collections
              </p>
            </div>
            <Switch
              checked={globalSettings.requireVerifiedCollection}
              onCheckedChange={(checked) =>
                updateSetting("requireVerifiedCollection", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Quality Check</Label>
              <p className="text-sm text-muted-foreground">
                Perform quality scoring on listings
              </p>
            </div>
            <Switch
              checked={globalSettings.enableQualityCheck}
              onCheckedChange={(checked) =>
                updateSetting("enableQualityCheck", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Validation Active</Label>
              <p className="text-sm text-muted-foreground">
                Enable validation system
              </p>
            </div>
            <Switch
              checked={globalSettings.isActive}
              onCheckedChange={(checked) => updateSetting("isActive", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleUpdateSettings} disabled={loading}>
          <CheckCircle className="h-4 w-4 mr-2" />
          {loading ? "Updating..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
