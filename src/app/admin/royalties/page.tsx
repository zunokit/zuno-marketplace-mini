"use client";

/**
 * Royalty Management Admin Page
 * Configure advanced royalty settings for NFT collections
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/lib/store/hooks";
import {
  royaltyManagerService,
  RoyaltyRecipient,
  RoyaltyCaps,
} from "@/lib/services/contracts/RoyaltyManagerService";
import { DollarSign, Users, Settings, CheckCircle } from "lucide-react";

interface RoyaltyConfig {
  collection: string;
  recipients: RoyaltyRecipient[];
  totalRoyaltyBps: number;
  useERC2981: boolean;
}

export default function RoyaltyManagementPage() {
  const { toast } = useToast();
  const { account } = useAppSelector((state) => state.wallet);

  const [globalCaps, setGlobalCaps] = useState<RoyaltyCaps>({
    maxTotalRoyalty: BigInt(1000), // 10%
    maxSingleRecipient: BigInt(500), // 5%
    maxRecipients: BigInt(5),
    enforceGlobalCaps: true,
  });

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [collection, setCollection] = useState("");
  const [recipients, setRecipients] = useState<RoyaltyRecipient[]>([
    {
      recipient: "",
      basisPoints: BigInt(250),
      role: "creator",
      isActive: true,
    },
  ]);
  const [useERC2981, setUseERC2981] = useState(true);
  const [loading, setLoading] = useState(false);

  /**
   * Load global caps
   */
  useEffect(() => {
    if (account) {
      loadGlobalCaps();
    }
  }, [account]);

  const loadGlobalCaps = async () => {
    try {
      const caps = await royaltyManagerService.getGlobalCaps();
      setGlobalCaps(caps);
    } catch (error) {
      console.error("Failed to load global caps:", error);
    }
  };

  /**
   * Add recipient
   */
  const addRecipient = () => {
    setRecipients([
      ...recipients,
      {
        recipient: "",
        basisPoints: BigInt(100),
        role: "",
        isActive: true,
      },
    ]);
  };

  /**
   * Remove recipient
   */
  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  /**
   * Update recipient
   */
  const updateRecipient = (
    index: number,
    field: keyof RoyaltyRecipient,
    value: any
  ) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  /**
   * Handle set royalty
   */
  const handleSetRoyalty = async () => {
    if (!collection) {
      toast({
        title: "Validation Error",
        description: "Please enter a collection address",
        variant: "destructive",
      });
      return;
    }

    if (recipients.length === 0 || !recipients[0].recipient) {
      toast({
        title: "Validation Error",
        description: "Please add at least one recipient",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await royaltyManagerService.setAdvancedRoyalty(
        collection,
        recipients,
        useERC2981
      );

      toast({
        title: "Royalty Configured",
        description: "Successfully configured advanced royalty",
      });

      setConfigDialogOpen(false);
      setCollection("");
      setRecipients([
        {
          recipient: "",
          basisPoints: BigInt(250),
          role: "creator",
          isActive: true,
        },
      ]);
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to configure royalty",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate total royalty
   */
  const totalRoyaltyBps = recipients.reduce(
    (sum, r) => sum + Number(r.basisPoints),
    0
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">💎 Royalty Management</h2>
        <p className="text-muted-foreground">
          Configure advanced royalty settings for NFT collections
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6">
        <Button onClick={() => setConfigDialogOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configure Royalty
        </Button>
      </div>

      {/* Global Caps */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Global Royalty Caps
          </CardTitle>
          <CardDescription>Platform-wide royalty limitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Max Total Royalty</Label>
              <p className="text-2xl font-bold">
                {Number(globalCaps.maxTotalRoyalty) / 100}%
              </p>
              <p className="text-sm text-muted-foreground">
                Maximum combined royalty percentage
              </p>
            </div>
            <div>
              <Label>Max Single Recipient</Label>
              <p className="text-2xl font-bold">
                {Number(globalCaps.maxSingleRecipient) / 100}%
              </p>
              <p className="text-sm text-muted-foreground">
                Maximum royalty for one recipient
              </p>
            </div>
            <div>
              <Label>Max Recipients</Label>
              <p className="text-2xl font-bold">
                {Number(globalCaps.maxRecipients)}
              </p>
              <p className="text-sm text-muted-foreground">
                Maximum number of royalty recipients
              </p>
            </div>
            <div>
              <Label>Enforce Caps</Label>
              <Badge
                variant={globalCaps.enforceGlobalCaps ? "default" : "secondary"}
              >
                {globalCaps.enforceGlobalCaps ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ERC2981 Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            ERC2981 Standard
          </CardTitle>
          <CardDescription>
            Royalty standard compliance for NFT collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The platform supports ERC2981 royalty standard, allowing automatic
            royalty discovery by marketplaces. Collections can choose to use
            ERC2981 compliance or custom royalty logic.
          </p>
        </CardContent>
      </Card>

      {/* Configure Royalty Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Collection Royalty</DialogTitle>
            <DialogDescription>
              Set up advanced royalty distribution for a collection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="collection">Collection Address</Label>
              <Input
                id="collection"
                placeholder="0x..."
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>ERC2981 Compliance</Label>
                <p className="text-sm text-muted-foreground">
                  Use ERC2981 standard for royalty reporting
                </p>
              </div>
              <Switch checked={useERC2981} onCheckedChange={setUseERC2981} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Recipients</Label>
                <Button size="sm" variant="outline" onClick={addRecipient}>
                  + Add Recipient
                </Button>
              </div>

              <div className="space-y-3">
                {recipients.map((recipient, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Address</Label>
                            <Input
                              placeholder="0x..."
                              value={recipient.recipient}
                              onChange={(e) =>
                                updateRecipient(
                                  index,
                                  "recipient",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Role</Label>
                            <Input
                              placeholder="creator, platform, charity..."
                              value={recipient.role}
                              onChange={(e) =>
                                updateRecipient(index, "role", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <Label>
                              Royalty (%): {Number(recipient.basisPoints) / 100}
                              %
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="1000"
                              value={Number(recipient.basisPoints)}
                              onChange={(e) =>
                                updateRecipient(
                                  index,
                                  "basisPoints",
                                  BigInt(e.target.value)
                                )
                              }
                            />
                          </div>
                          {recipients.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeRecipient(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Total Royalty: {totalRoyaltyBps / 100}%
                </p>
                {totalRoyaltyBps > Number(globalCaps.maxTotalRoyalty) && (
                  <p className="text-sm text-red-500 mt-1">
                    ⚠️ Exceeds global cap of{" "}
                    {Number(globalCaps.maxTotalRoyalty) / 100}%
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfigDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSetRoyalty} disabled={loading}>
              {loading ? "Configuring..." : "Configure Royalty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
