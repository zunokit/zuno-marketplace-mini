/**
 * Mint NFT Button Component
 * Reusable button for minting NFTs from collections
 */

'use client';

import { useState, useEffect } from 'react';
import { useCollection } from '@/hooks/useCollection';
import { useWallet } from '@/providers/WalletProvider';
import { TokenType, MintInfo } from '@/types';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Info,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

interface MintNFTButtonProps {
  collectionAddress: string;
  tokenType?: TokenType;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function MintNFTButton({
  collectionAddress,
  tokenType = TokenType.ERC721,
  className,
  variant = 'default',
  size = 'default'
}: MintNFTButtonProps) {
  const { isConnected, account } = useWallet();
  const { mint, getMintInfo, isLoading } = useCollection();
  const [showDialog, setShowDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [mintInfo, setMintInfo] = useState<MintInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Fetch mint info when dialog opens
  useEffect(() => {
    if (showDialog && collectionAddress && account) {
      fetchMintInfo();
    }
  }, [showDialog, collectionAddress, account]);

  const fetchMintInfo = async () => {
    setIsLoadingInfo(true);
    try {
      const info = await getMintInfo(collectionAddress);
      setMintInfo(info);
      
      // Auto-adjust quantity if it exceeds limit
      if (info && info.mintLimitPerWallet > 0n) {
        const remaining = Number(info.mintLimitPerWallet - info.mintedPerWallet);
        if (remaining < quantity) {
          setQuantity(Math.max(1, remaining));
        }
      }
    } catch (error) {
      console.error('Failed to fetch mint info:', error);
      toast.error('Failed to load mint information');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleMint = async () => {
    if (!isConnected || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!mintInfo?.canMint) {
      toast.error('Minting is not available');
      return;
    }

    setIsMinting(true);
    try {
      await mint({
        collection: collectionAddress,
        quantity,
        to: account
      });
      
      setShowDialog(false);
      setQuantity(1);
      
      // Refresh mint info
      fetchMintInfo();
    } catch (error: any) {
      // Error is handled in the hook
      console.error('Mint failed:', error);
    } finally {
      setIsMinting(false);
    }
  };

  const getTotalPrice = () => {
    if (!mintInfo) return '0';
    const totalWei = mintInfo.currentPrice * BigInt(quantity);
    return ethers.formatEther(totalWei);
  };

  const getRemainingMints = () => {
    if (!mintInfo) return 0;
    const walletRemaining = Number(mintInfo.mintLimitPerWallet - mintInfo.mintedPerWallet);
    const supplyRemaining = Number(mintInfo.remainingSupply);
    return Math.min(walletRemaining, supplyRemaining);
  };

  if (!isConnected) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => toast.error('Please connect your wallet')}
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowDialog(true)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" />
        )}
        Mint NFT
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mint NFT</DialogTitle>
            <DialogDescription>
              Choose how many NFTs you want to mint from this collection
            </DialogDescription>
          </DialogHeader>

          {isLoadingInfo ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading mint information...</p>
            </div>
          ) : mintInfo ? (
            <div className="space-y-4">
              {/* Mint Stage */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mint Stage</span>
                <Badge variant={
                  mintInfo.currentStage === 'PUBLIC' ? 'default' :
                  mintInfo.currentStage === 'ALLOWLIST' ? 'secondary' : 'outline'
                }>
                  {mintInfo.currentStage}
                </Badge>
              </div>

              {/* Allowlist Status */}
              {mintInfo.currentStage === 'ALLOWLIST' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {mintInfo.isAllowlisted 
                      ? 'You are on the allowlist! You can mint now.'
                      : 'You are not on the allowlist. Wait for public sale.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Supply Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Minted</span>
                  <span>{mintInfo.totalMinted.toString()} / {mintInfo.maxSupply.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Mints</span>
                  <span>{mintInfo.mintedPerWallet.toString()} / {mintInfo.mintLimitPerWallet.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available to Mint</span>
                  <span className="font-medium">{getRemainingMints()}</span>
                </div>
              </div>

              <Separator />

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={getRemainingMints()}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(getRemainingMints(), parseInt(e.target.value) || 1)))}
                  disabled={!mintInfo.canMint || isMinting}
                />
              </div>

              {/* Price Display */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Price</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{getTotalPrice()} ETH</div>
                    <div className="text-xs text-muted-foreground">
                      {ethers.formatEther(mintInfo.currentPrice)} ETH × {quantity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning for sold out or limit reached */}
              {!mintInfo.canMint && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {mintInfo.remainingSupply === 0n 
                      ? 'This collection is sold out!'
                      : mintInfo.currentStage === 'INACTIVE'
                      ? 'Minting has not started yet.'
                      : mintInfo.mintedPerWallet >= mintInfo.mintLimitPerWallet
                      ? 'You have reached the mint limit for this wallet.'
                      : mintInfo.currentStage === 'ALLOWLIST' && !mintInfo.isAllowlisted
                      ? 'You are not on the allowlist.'
                      : 'Minting is currently unavailable.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load mint information. Please try again.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isMinting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMint}
              disabled={!mintInfo?.canMint || isMinting || isLoadingInfo}
            >
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mint {quantity} NFT{quantity > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
