"use client";

// Force dynamic rendering to avoid SSR issues with wagmi/query
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCollectionInfo, useZuno, useCollection, useIsAllowlistOnly, useWallet } from "zuno-marketplace-sdk/react";
import { toast } from "sonner";
import { handleSdkError } from "@/lib/utils/error-handler";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Package,
  DollarSign,
  Percent,
  Users,
  User,
  Hash,
  ExternalLink,
  Coins,
  FolderOpen,
  Shield,
  UserPlus,
  UserMinus,
  Loader2,
  Check,
  X
} from "lucide-react";
import Link from "next/link";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address: userAddress } = useWallet();
  const collectionAddress = params.id as string;
  const { data: collection, isLoading, error } = useCollectionInfo(collectionAddress);
  const sdk = useZuno();
  const { addToAllowlist, removeFromAllowlist, setAllowlistOnly } = useCollection();
  const { data: isAllowlistOnlyFromHook } = useIsAllowlistOnly(collectionAddress);

  const [allowlistAddresses, setAllowlistAddresses] = useState("");
  const [removeAddresses, setRemoveAddresses] = useState("");
  const [checkAddress, setCheckAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [allowlistOnlyMode, setAllowlistOnlyMode] = useState(false);
  const [isLoadingAllowlistMode, setIsLoadingAllowlistMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isOwner = collection?.owner?.toLowerCase() === userAddress?.toLowerCase();

  // Sync allowlist-only mode from hook
  useEffect(() => {
    if (isAllowlistOnlyFromHook !== undefined) {
      setAllowlistOnlyMode(isAllowlistOnlyFromHook);
    }
  }, [isAllowlistOnlyFromHook]);

  const handleMint = () => {
    router.push(`/mint/${collectionAddress}`);
  };

  const handleViewExplorer = () => {
    const config = sdk.getConfig();
    const network = config.network;

    let explorerUrl = "";
    if (network === "mainnet" || network === 1) {
      explorerUrl = `https://etherscan.io/address/${collectionAddress}`;
    } else if (network === "sepolia" || network === 11155111) {
      explorerUrl = `https://sepolia.etherscan.io/address/${collectionAddress}`;
    } else if (network === 31337) {
      toast.info("No explorer available for local network");
      return;
    } else {
      explorerUrl = `https://etherscan.io/address/${collectionAddress}`;
    }

    window.open(explorerUrl, "_blank");
  };

  const handleAddToAllowlist = async () => {
    if (!allowlistAddresses.trim()) {
      toast.error("Please enter addresses");
      return;
    }

    const addresses = allowlistAddresses
      .split(/[\n,]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    if (addresses.length === 0) {
      toast.error("No valid addresses found");
      return;
    }

    setIsProcessing(true);
    try {
      await addToAllowlist.mutateAsync({
        collectionAddress,
        addresses,
      });
      toast.success(`Added ${addresses.length} address(es) to allowlist!`);
      setAllowlistAddresses("");
    } catch (err) {
      handleSdkError(err, "Failed to add addresses");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFromAllowlist = async () => {
    if (!removeAddresses.trim()) {
      toast.error("Please enter addresses");
      return;
    }

    const addresses = removeAddresses
      .split(/[\n,]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    if (addresses.length === 0) {
      toast.error("No valid addresses found");
      return;
    }

    setIsProcessing(true);
    try {
      await removeFromAllowlist.mutateAsync({
        collectionAddress,
        addresses,
      });
      toast.success(`Removed ${addresses.length} address(es) from allowlist!`);
      setRemoveAddresses("");
    } catch (err) {
      handleSdkError(err, "Failed to remove addresses");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckAllowlist = async () => {
    if (!checkAddress.trim()) {
      toast.error("Please enter an address");
      return;
    }

    setIsChecking(true);
    setCheckResult(null);
    try {
      const result = await sdk.collection.isInAllowlist(
        collectionAddress,
        checkAddress.trim()
      );
      setCheckResult(result);
      toast.success(result ? "Address is in allowlist ✓" : "Address not in allowlist");
    } catch (err) {
      handleSdkError(err, "Failed to check address");
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggleAllowlistOnly = async () => {
    setIsLoadingAllowlistMode(true);
    try {
      await setAllowlistOnly.mutateAsync({
        collectionAddress,
        enabled: !allowlistOnlyMode,
      });
      setAllowlistOnlyMode(!allowlistOnlyMode);
      toast.success(`Allowlist-only mode ${!allowlistOnlyMode ? "enabled" : "disabled"}!`);
    } catch (err) {
      handleSdkError(err, "Failed to update mode");
    } finally {
      setIsLoadingAllowlistMode(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Error loading collection</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const totalMinted = Number(collection?.totalSupply || 0);
  const maxSupply = Number(collection?.maxSupply || 0);
  const mintProgress = maxSupply > 0 ? (totalMinted / maxSupply) * 100 : 0;

  const formatAddress = (addr: string) => 
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{collection?.name || "Collection"}</h1>
          <Badge variant="secondary">{collection?.tokenType}</Badge>
          {allowlistOnlyMode && (
            <Badge variant="outline" className="border-primary text-primary">
              <Shield className="h-3 w-3 mr-1" />
              Allowlist Only
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground font-mono text-sm">{collectionAddress}</p>
        {collection?.description && (
          <p className="mt-2 text-muted-foreground">{collection.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Supply */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Supply
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {totalMinted.toLocaleString()} / {maxSupply.toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  {mintProgress.toFixed(1)}%
                </span>
              </div>
              <Progress value={mintProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Mint Price */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Mint Price
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {collection?.mintPrice || "0"} ETH
            </p>
          </CardContent>
        </Card>

        {/* Royalty */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Royalty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {((collection?.royaltyFee || 0) / 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        {/* Mint Limit */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mint Limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {collection?.mintLimitPerWallet || 0}
            </p>
            <p className="text-xs text-muted-foreground">Per wallet</p>
          </CardContent>
        </Card>

        {/* Symbol */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Symbol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{collection?.symbol}</p>
          </CardContent>
        </Card>

        {/* Owner */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Owner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">
              {formatAddress(collection?.owner || '')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleMint}>
            <Coins className="mr-2 h-4 w-4" />
            Mint NFT
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile">
              <FolderOpen className="mr-2 h-4 w-4" />
              My NFTs
            </Link>
          </Button>
          <Button variant="outline" onClick={handleViewExplorer}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </Button>
        </CardContent>
      </Card>

      {/* Allowlist Management - Owner Only */}
      {isOwner && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Allowlist Management</CardTitle>
                <Badge variant="secondary">Owner Only</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="allowlist-mode" className="text-sm">
                  Allowlist-Only Mode
                </Label>
                <Switch
                  id="allowlist-mode"
                  checked={allowlistOnlyMode}
                  onCheckedChange={handleToggleAllowlistOnly}
                  disabled={isLoadingAllowlistMode}
                />
              </div>
            </div>
            <CardDescription>
              Manage who can mint from this collection. Allowlist-only mode restricts minting to allowlisted addresses only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add to Allowlist */}
            <div className="space-y-2">
              <Label htmlFor="add-addresses" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Addresses to Allowlist
              </Label>
              <Textarea
                id="add-addresses"
                placeholder="Enter addresses (one per line or comma-separated)&#10;0x1234...&#10;0x5678..."
                value={allowlistAddresses}
                onChange={(e) => setAllowlistAddresses(e.target.value)}
                className="font-mono text-sm min-h-[100px]"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Max 100 addresses per batch
                </p>
                <Button
                  onClick={handleAddToAllowlist}
                  disabled={isProcessing || !allowlistAddresses.trim()}
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add to Allowlist
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Remove from Allowlist */}
            <div className="space-y-2">
              <Label htmlFor="remove-addresses" className="flex items-center gap-2">
                <UserMinus className="h-4 w-4" />
                Remove Addresses from Allowlist
              </Label>
              <Textarea
                id="remove-addresses"
                placeholder="Enter addresses to remove (one per line or comma-separated)"
                value={removeAddresses}
                onChange={(e) => setRemoveAddresses(e.target.value)}
                className="font-mono text-sm min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleRemoveFromAllowlist}
                  disabled={isProcessing || !removeAddresses.trim()}
                  variant="destructive"
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove from Allowlist
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Check Address */}
            <div className="space-y-2">
              <Label htmlFor="check-address" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Check Allowlist Status
              </Label>
              <div className="flex gap-2">
                <Input
                  id="check-address"
                  placeholder="0x..."
                  value={checkAddress}
                  onChange={(e) => setCheckAddress(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleCheckAllowlist}
                  disabled={isChecking || !checkAddress.trim()}
                  variant="outline"
                  size="sm"
                >
                  {isChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Check"
                  )}
                </Button>
              </div>
              {checkResult !== null && (
                <div
                  className={`flex items-center gap-2 text-sm p-2 rounded ${
                    checkResult
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {checkResult ? (
                    <>
                      <Check className="h-4 w-4" />
                      Address is in allowlist
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Address not in allowlist
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </MainLayout>
  );
}