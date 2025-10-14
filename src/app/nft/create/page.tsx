"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/utils/logger";
import { ethers } from "ethers";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/lib/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Loader2, 
  Info, 
  Wallet,
  Package,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { collectionService } from "@/lib/services/contracts/CollectionService";
import { ProviderFactory } from "@/lib/services/web3/provider-factory";

// Types
interface MintPageState {
  selectedCollection: string;
  mintAmount: number;
  recipient: string;
  isMinting: boolean;
  isLoadingInfo: boolean;
  collectionInfo: {
    name: string;
    symbol: string;
    type: "ERC721" | "ERC1155";
  } | null;
  mintInfo: {
    currentMintPrice: string;
    mintStage: string;
    canMint: boolean;
    mintedPerWallet: string;
    mintLimitPerWallet: string;
    totalMinted: string;
    maxSupply: string;
    isAllowlisted: boolean;
  } | null;
}

export default function MintNFTPage() {
  const { toast } = useToast();
  const { account, isConnected } = useAppSelector((state) => state.wallet);
  const { items: collections } = useAppSelector((state) => state.collections);

  // Consolidated state
  const [state, setState] = useState<MintPageState>({
    selectedCollection: "",
    mintAmount: 1,
    recipient: "",
    isMinting: false,
    isLoadingInfo: false,
    collectionInfo: null,
    mintInfo: null,
  });

  // Initialize recipient with connected account
  useEffect(() => {
    if (account) {
      setState(prev => ({ ...prev, recipient: account }));
    }
  }, [account]);

  // Load collection info when selection changes
  useEffect(() => {
    if (state.selectedCollection && account) {
      loadCollectionInfo();
    }
  }, [state.selectedCollection, account]);

  /**
   * Load collection and mint information
   */
  const loadCollectionInfo = useCallback(async () => {
    if (!state.selectedCollection || !window.ethereum) return;

    setState(prev => ({ ...prev, isLoadingInfo: true }));

    try {
      const collection = collections.find(
        c => c.address === state.selectedCollection
      );
      if (!collection) throw new Error("Collection not found");

      const provider = ProviderFactory.createBrowserProvider();
      await collectionService.initialize(provider);

      const tokenType = collection.type as "ERC721" | "ERC1155";
      
      // Fetch collection info
      const collectionData = await collectionService.getCollectionInfo(
        state.selectedCollection,
        tokenType
      );

      // Fetch mint info for current user
      const signer = await provider.getSigner();
      const userAddress = account || await signer.getAddress();
      const mintData = await collectionService.getMintInfo(
        state.selectedCollection,
        userAddress,
        tokenType
      );

      setState(prev => ({
        ...prev,
        collectionInfo: {
          name: collectionData.name,
          symbol: collectionData.symbol,
          type: tokenType,
        },
        mintInfo: mintData,
        isLoadingInfo: false,
      }));
    } catch (error: any) {
      await ProviderFactory.handleProviderError(error).catch((err) => {
        logger.error("Error loading collection info", err, {
          component: "NFTCreatePage",
          action: "loadCollectionInfo"
        });
        toast({
          title: "Error",
          description: err.message || "Failed to load collection information",
          variant: "destructive",
        });
      });
      setState(prev => ({ ...prev, isLoadingInfo: false }));
    }
  }, [state.selectedCollection, collections, account, toast]);

  /**
   * Validate mint inputs
   */
  const validateMintInputs = (): boolean => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return false;
    }

    if (!state.selectedCollection) {
      toast({
        title: "No Collection Selected",
        description: "Please select a collection",
        variant: "destructive",
      });
      return false;
    }

    if (!ethers.isAddress(state.recipient)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid recipient address",
        variant: "destructive",
      });
      return false;
    }

    if (state.mintAmount < 1 || state.mintAmount > 50) {
      toast({
        title: "Invalid Amount",
        description: "Mint amount must be between 1 and 50",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  /**
   * Handle mint NFT
   */
  const handleMint = async (isBatch: boolean = false) => {
    if (!validateMintInputs() || !state.mintInfo || !state.collectionInfo) return;

    // Additional batch validation
    if (isBatch && state.mintAmount < 2) {
      toast({
        title: "Invalid Batch Amount",
        description: "Batch mint requires at least 2 NFTs",
        variant: "destructive",
      });
      return;
    }

    // Check if minting is allowed
    if (!state.mintInfo.canMint) {
      toast({
        title: "Cannot Mint",
        description: getMintErrorMessage(state.mintInfo),
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ ...prev, isMinting: true }));

    try {
      const provider = ProviderFactory.createBrowserProvider();
      const signer = await provider.getSigner();
      await collectionService.initialize(provider, signer);

      const tokenType = state.collectionInfo.type;
      let tx;

      if (isBatch && tokenType === "ERC1155") {
        // Batch mint for ERC1155
        const amounts = Array(state.mintAmount).fill("1");
        const totalPrice = (
          parseFloat(state.mintInfo.currentMintPrice) * state.mintAmount
        ).toString();

        tx = await collectionService.batchMint({
          collection: state.selectedCollection,
          to: state.recipient,
          quantity: amounts.length,
          tokenType: "ERC1155"
        });
      } else if (isBatch && tokenType === "ERC721") {
        // Multiple single mints for ERC721
        const promises = [];
        for (let i = 0; i < state.mintAmount; i++) {
          const promise = collectionService.mint({
            collection: state.selectedCollection,
            to: state.recipient,
            tokenType,
            value: state.mintInfo.currentMintPrice,
          }).then(async (tx) => {
            toast({
              title: "Transaction Sent",
              description: `Minting NFT ${i + 1}/${state.mintAmount}...`,
            });
            return tx.wait();
          });
          promises.push(promise);
        }
        await Promise.all(promises);
      } else {
        // Single mint
        tx = await collectionService.mint({
          collection: state.selectedCollection,
          to: state.recipient,
          amount: tokenType === "ERC1155" ? state.mintAmount.toString() : undefined,
          tokenType,
          value: state.mintInfo.currentMintPrice,
        });
      }

      if (tx) {
        toast({
          title: "Transaction Sent",
          description: "Waiting for confirmation...",
        });

        // Handle both string and ContractTransactionResponse types
        const receipt = typeof tx === 'string' ? null : await tx.wait();
        
        toast({
          title: "Success! 🎉",
          description: `Successfully minted ${
            isBatch ? state.mintAmount : 1
          } NFT${state.mintAmount > 1 ? "s" : ""}`,
        });

        // Refresh collection info
        await loadCollectionInfo();
        
        // Reset amount
        setState(prev => ({ ...prev, mintAmount: 1 }));
      }
    } catch (error: any) {
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        toast({
          title: "Transaction Cancelled",
          description: "You rejected the transaction",
        });
      } else {
        await ProviderFactory.handleProviderError(error).catch((err) => {
          logger.error("Minting error", err, {
            component: "NFTCreatePage",
            action: "mintNFT"
          });
          toast({
            title: "Minting Failed",
            description: err.message || "Failed to mint NFT",
            variant: "destructive",
          });
        });
      }
    } finally {
      setState(prev => ({ ...prev, isMinting: false }));
    }
  };

  /**
   * Get mint error message
   */
  const getMintErrorMessage = (mintInfo: any): string => {
    if (mintInfo.mintStage === "not_started") {
      return "Minting has not started yet";
    }
    if (parseInt(mintInfo.mintedPerWallet) >= parseInt(mintInfo.mintLimitPerWallet)) {
      return `You've reached your mint limit (${mintInfo.mintLimitPerWallet} NFTs)`;
    }
    if (parseInt(mintInfo.totalMinted) >= parseInt(mintInfo.maxSupply)) {
      return "Collection is sold out";
    }
    if (mintInfo.mintStage === "allowlist" && !mintInfo.isAllowlisted) {
      return "You are not on the allowlist";
    }
    return "Cannot mint at this time";
  };

  /**
   * Calculate total mint cost
   */
  const getTotalCost = (): string => {
    if (!state.mintInfo) return "0";
    return (parseFloat(state.mintInfo.currentMintPrice) * state.mintAmount).toFixed(4);
  };

  // Not connected state
  if (!isConnected || !account) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertTitle>Connect Wallet</AlertTitle>
          <AlertDescription>
            Please connect your wallet to mint NFTs
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No collections state
  if (collections.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle>No Collections</AlertTitle>
          <AlertDescription>
            Create a collection first before minting NFTs
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mint NFTs</h1>
        <p className="text-muted-foreground">
          Create new NFTs from your collections
        </p>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle>Mint Configuration</CardTitle>
          <CardDescription>
            Select a collection and configure mint parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collection Selector */}
          <div className="space-y-2">
            <Label htmlFor="collection">Collection</Label>
            <Select
              value={state.selectedCollection}
              onValueChange={(value) => setState(prev => ({ 
                ...prev, 
                selectedCollection: value,
                collectionInfo: null,
                mintInfo: null 
              }))}
              disabled={state.isMinting}
            >
              <SelectTrigger id="collection">
                <SelectValue placeholder="Select a collection..." />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.address} value={collection.address}>
                    <div className="flex items-center gap-2">
                      <span>{collection.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {collection.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {state.isLoadingInfo && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {/* Collection Info */}
          {state.collectionInfo && !state.isLoadingInfo && (
            <>
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Collection</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{state.collectionInfo.name}</span>
                      <Badge variant="secondary">{state.collectionInfo.symbol}</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <Badge>{state.collectionInfo.type}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price per NFT</span>
                    <span className="font-semibold">
                      {state.mintInfo?.currentMintPrice || "0"} ETH
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Mint Status */}
              {state.mintInfo && (
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Mint Stage</span>
                      <Badge 
                        variant={state.mintInfo.canMint ? "default" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {state.mintInfo.mintStage === "public" && <TrendingUp className="h-3 w-3" />}
                        {state.mintInfo.mintStage === "allowlist" && <Sparkles className="h-3 w-3" />}
                        {state.mintInfo.mintStage === "public" ? "Public Sale" : 
                         state.mintInfo.mintStage === "allowlist" ? "Allowlist" : 
                         "Not Started"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Your Progress</span>
                      <span className="font-semibold">
                        {state.mintInfo.mintedPerWallet} / {state.mintInfo.mintLimitPerWallet}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Supply</span>
                      <span className="font-semibold">
                        {state.mintInfo.totalMinted} / {state.mintInfo.maxSupply}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(parseInt(state.mintInfo.totalMinted) / parseInt(state.mintInfo.maxSupply)) * 100}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {Math.round((parseInt(state.mintInfo.totalMinted) / parseInt(state.mintInfo.maxSupply)) * 100)}% Minted
                      </p>
                    </div>

                    {!state.mintInfo.canMint && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Cannot Mint</AlertTitle>
                        <AlertDescription>
                          {getMintErrorMessage(state.mintInfo)}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Mint Controls */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      type="text"
                      value={state.recipient}
                      onChange={(e) => setState(prev => ({ ...prev, recipient: e.target.value }))}
                      placeholder="0x..."
                      disabled={state.isMinting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={state.mintAmount}
                      onChange={(e) => setState(prev => ({ 
                        ...prev, 
                        mintAmount: Math.min(50, Math.max(1, parseInt(e.target.value) || 1))
                      }))}
                      min={1}
                      max={50}
                      disabled={state.isMinting}
                    />
                  </div>
                </div>

                {/* Cost Summary */}
                {state.mintInfo && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Total Cost</AlertTitle>
                    <AlertDescription>
                      {state.mintAmount} NFT{state.mintAmount > 1 ? "s" : ""} × {state.mintInfo.currentMintPrice} ETH = {" "}
                      <span className="font-bold">{getTotalCost()} ETH</span>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleMint(false)}
                    disabled={state.isMinting || !state.mintInfo?.canMint}
                    className="flex-1"
                  >
                    {state.isMinting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      "Mint Single NFT"
                    )}
                  </Button>

                  {state.collectionInfo?.type === "ERC1155" && (
                    <Button
                      onClick={() => handleMint(true)}
                      disabled={state.isMinting || !state.mintInfo?.canMint || state.mintAmount < 2}
                      variant="secondary"
                      className="flex-1"
                    >
                      {state.isMinting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Minting...
                        </>
                      ) : (
                        `Batch Mint ${state.mintAmount} NFTs`
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
