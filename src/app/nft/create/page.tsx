"use client";

/**
 * Mint NFT Page
 * Migrated from frontend-foundry/src/components/MintNFT.jsx
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
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { ENV } from "@/lib/config/env";
import { isMockDataEnabled } from "@/lib/services/mock/mockDataService";
import { getMockDataService } from "@/lib/services/mock/mockDataService";
import { AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";

interface CollectionInfo {
  name: string;
  symbol: string;
  mintPrice: string;
  type: "ERC721" | "ERC1155";
}

interface MintDebugInfo {
  currentTime: number;
  mintStartTime: number;
  allowlistStageEnd: number;
  currentStage: number;
  currentMintPrice: string;
  allowlistPrice: string;
  publicPrice: string;
  totalMinted: number;
  maxSupply: number;
  mintedPerWallet: number;
  mintLimitPerWallet: number;
  isInAllowlist: boolean;
  stageNames: string[];
  timeUntilStart: number;
  timeUntilPublic: number;
  canMint: boolean;
  mintingIssues: string[];
}

export default function MintNFTPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // Redux state
  const { account, isConnected } = useAppSelector((state) => state.wallet);
  const { items: collections } = useAppSelector((state) => state.collections);

  // Local state
  const [selectedCollection, setSelectedCollection] = useState("");
  const [mintAmount, setMintAmount] = useState(1);
  const [recipient, setRecipient] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(
    null
  );
  const [debugInfo, setDebugInfo] = useState<MintDebugInfo | null>(null);
  const [useMockData] = useState(isMockDataEnabled());

  // Set recipient to connected account
  useEffect(() => {
    if (account) {
      setRecipient(account);
    }
  }, [account]);

  // Load collection info when selection changes
  useEffect(() => {
    if (selectedCollection) {
      loadCollectionInfo();
    }
  }, [selectedCollection, account]);

  /**
   * Load collection information
   */
  const loadCollectionInfo = async () => {
    if (!selectedCollection) return;

    try {
      const collection = collections.find(
        (c) => c.address === selectedCollection
      );
      if (!collection) return;

      if (useMockData) {
        // Mock data
        const mockService = getMockDataService();
        const mockCollection = await mockService.getCollection(
          selectedCollection
        );

        if (mockCollection) {
          setCollectionInfo({
            name: mockCollection.name,
            symbol: mockCollection.symbol,
            mintPrice: mockCollection.mintPrice,
            type: mockCollection.type,
          });
        }
      } else {
        // Real contract interaction
        // TODO: Implement real contract interaction
        toast({
          title: "Contract Integration",
          description: "Real contract integration coming soon",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error loading collection info:", error);
      toast({
        title: "Error",
        description: `Failed to load collection information: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle mint NFT
   */
  const handleMint = async (isBatch: boolean = false) => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCollection) {
      toast({
        title: "No Collection Selected",
        description: "Please select a collection",
        variant: "destructive",
      });
      return;
    }

    if (!recipient || !recipient.startsWith("0x") || recipient.length !== 42) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid recipient address",
        variant: "destructive",
      });
      return;
    }

    if (isBatch && mintAmount < 2) {
      toast({
        title: "Invalid Amount",
        description: "Batch mint requires at least 2 NFTs",
        variant: "destructive",
      });
      return;
    }

    setIsMinting(true);

    try {
      if (useMockData) {
        // Mock minting
        const mockService = getMockDataService();
        const mintedNFTs = await mockService.mintNFT(
          selectedCollection,
          recipient,
          isBatch ? mintAmount : 1
        );

        toast({
          title: "Minting Successful!",
          description: `Successfully minted ${mintedNFTs.length} NFT${
            mintedNFTs.length > 1 ? "s" : ""
          }`,
        });

        // Refresh collection info
        await loadCollectionInfo();
      } else {
        // Real contract interaction
        // TODO: Implement real minting
        toast({
          title: "Contract Integration",
          description: "Real contract minting coming soon",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      toast({
        title: "Minting Failed",
        description:
          error instanceof Error ? error.message : "Failed to mint NFT",
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  };

  // Check if wallet is connected
  if (!isConnected || !account) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to mint NFTs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if collections exist
  if (collections.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Collections Found</AlertTitle>
          <AlertDescription>
            Please create a collection first before minting NFTs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mint NFT</h1>
        <p className="text-muted-foreground">
          Mint new NFTs from your collections
        </p>
        {useMockData && (
          <Badge variant="outline" className="mt-2">
            🎭 Mock Data Mode
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mint Configuration</CardTitle>
          <CardDescription>
            Select a collection and configure minting parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collection Selection */}
          <div className="space-y-2">
            <Label htmlFor="collection">Select Collection</Label>
            <Select
              value={selectedCollection}
              onValueChange={setSelectedCollection}
              disabled={isMinting}
            >
              <SelectTrigger id="collection">
                <SelectValue placeholder="Choose a collection..." />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem
                    key={collection.address}
                    value={collection.address}
                  >
                    {collection.name} ({collection.symbol}) - {collection.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Collection Info */}
          {collectionInfo && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {collectionInfo.name} ({collectionInfo.symbol})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="secondary">{collectionInfo.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mint Price:</span>
                  <span className="font-semibold">
                    {collectionInfo.mintPrice} ETH
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug Info - Only show in mock mode */}
          {debugInfo && useMockData && (
            <Card
              className={
                debugInfo.canMint ? "border-green-500" : "border-red-500"
              }
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🔧 Debug Info{" "}
                  {debugInfo.canMint ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {debugInfo.mintingIssues.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Minting Issues</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-2">
                        {debugInfo.mintingIssues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Stage:</p>
                    <p className="font-semibold">
                      {debugInfo.stageNames[debugInfo.currentStage]} (
                      {debugInfo.currentStage})
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Price:</p>
                    <p className="font-semibold">
                      {debugInfo.currentMintPrice} ETH
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Minted:</p>
                    <p className="font-semibold">
                      {debugInfo.totalMinted} / {debugInfo.maxSupply}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Your Minted:</p>
                    <p className="font-semibold">
                      {debugInfo.mintedPerWallet} /{" "}
                      {debugInfo.mintLimitPerWallet}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Recipient Address */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              disabled={isMinting}
            />
          </div>

          {/* Mint Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (for batch minting)</Label>
            <Input
              id="amount"
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(parseInt(e.target.value) || 1)}
              min={1}
              max={50}
              disabled={isMinting}
            />
          </div>

          {/* Price Info */}
          {collectionInfo && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Single Mint Cost:
                  </span>
                  <span className="font-semibold">
                    {collectionInfo.mintPrice} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Batch Mint Cost ({mintAmount} NFTs):
                  </span>
                  <span className="font-semibold">
                    {(
                      parseFloat(collectionInfo.mintPrice) * mintAmount
                    ).toFixed(6)}{" "}
                    ETH
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => handleMint(false)}
              disabled={isMinting || !selectedCollection}
              className="flex-1"
            >
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                "Mint Single NFT"
              )}
            </Button>

            <Button
              onClick={() => handleMint(true)}
              disabled={isMinting || !selectedCollection || mintAmount < 2}
              variant="secondary"
              className="flex-1"
            >
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                `Batch Mint ${mintAmount} NFTs`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
