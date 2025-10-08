"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Play, AlertCircle, CheckCircle } from "lucide-react";
import { collectionService } from "@/lib/services/contracts/CollectionService";
import { useToast } from "@/components/ui/use-toast";
import { ethers } from "ethers";

interface ManageMintStageProps {
  collectionAddress: string;
  tokenType: "ERC721" | "ERC1155";
  owner: string;
  currentStage: string;
  onStageUpdate?: () => void;
}

export function ManageMintStage({
  collectionAddress,
  tokenType,
  owner,
  currentStage,
  onStageUpdate
}: ManageMintStageProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Check if current user is the owner
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  const getStageInfo = () => {
    switch (currentStage) {
      case "not_started":
        return {
          label: "Not Started",
          color: "secondary",
          nextStage: "Allowlist",
          nextAction: "Start Allowlist Mint",
          description: "Minting has not started yet. Start the allowlist phase to allow approved addresses to mint."
        };
      case "allowlist":
        return {
          label: "Allowlist",
          color: "default",
          nextStage: "Public",
          nextAction: "Start Public Mint",
          description: "Only allowlisted addresses can mint. Start the public phase to allow anyone to mint."
        };
      case "public":
        return {
          label: "Public",
          color: "default",
          nextStage: null,
          nextAction: null,
          description: "Public minting is active. Anyone can mint from this collection."
        };
      default:
        return {
          label: "Unknown",
          color: "secondary",
          nextStage: null,
          nextAction: null,
          description: "Unable to determine current mint stage."
        };
    }
  };

  const stageInfo = getStageInfo();

  const handleUpdateStage = async () => {
    if (!isOwner || !stageInfo.nextStage) return;

    setIsUpdating(true);
    setTxHash(null);

    try {
      const tx = await collectionService.updateMintStage(collectionAddress, tokenType);
      setTxHash(tx.hash);
      
      toast({
        title: "Transaction Submitted",
        description: "Updating mint stage..."
      });

      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast({
          title: "Mint Stage Updated",
          description: `Successfully updated to ${stageInfo.nextStage} stage`,
        });

        // Refresh the page or call callback
        if (onStageUpdate) {
          onStageUpdate();
        } else {
          // Refresh after a short delay
          setTimeout(() => window.location.reload(), 2000);
        }
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Error updating mint stage:", error);
      
      let errorMessage = "Failed to update mint stage";
      if (error.reason || error.message) {
        errorMessage = error.reason || error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Mint Stage Management
          <Badge variant={stageInfo.color as any}>
            {stageInfo.label}
          </Badge>
        </CardTitle>
        <CardDescription>
          Control when and how users can mint from your collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {stageInfo.description}
          </AlertDescription>
        </Alert>

        {stageInfo.nextAction && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Progress mint stage to: <span className="font-medium">{stageInfo.nextStage}</span>
            </p>
            
            <Button
              onClick={handleUpdateStage}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {stageInfo.nextAction}
                </>
              )}
            </Button>
          </div>
        )}

        {currentStage === "public" && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              Public minting is active! Your collection is fully open for minting.
            </AlertDescription>
          </Alert>
        )}

        {txHash && (
          <div className="text-xs text-muted-foreground break-all">
            Transaction: {txHash}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
