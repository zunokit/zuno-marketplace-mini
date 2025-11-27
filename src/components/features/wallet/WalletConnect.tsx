"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ExternalLink, Copy, Power } from "lucide-react";
import { useWallet, useBalance } from "zuno-marketplace-sdk/react";
import { toast } from "sonner";

export function WalletConnect() {
  const {
    address: account,
    isConnected,
    isPending: isConnecting,
    connect,
    disconnect,
  } = useWallet();
  const { data: balanceData } = useBalance(account);
  const balance = balanceData ? balanceData.formatted : null;
  const [isOpen, setIsOpen] = useState(false);

  const handleConnect = async () => {
    try {
      connect();
      setIsOpen(false);
      toast.success("Wallet Connected", {
        description: "Successfully connected to your wallet!",
      });
    } catch (error) {
      toast.error("Connection Failed", {
        description:
          error instanceof Error ? error.message : "Failed to connect wallet",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
    toast.success("Wallet Disconnected", {
      description: "Your wallet has been disconnected.",
    });
  };

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast.success("Address Copied", {
        description: "Wallet address copied to clipboard!",
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  if (isConnected && account) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {account && formatAddress(account)}
            <Badge variant="secondary" className="ml-1">
              {balance && formatBalance(balance)} ETH
            </Badge>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Details
            </DialogTitle>
            <DialogDescription>
              Your connected wallet information
            </DialogDescription>
          </DialogHeader>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Account Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                <span className="font-mono text-sm">
                  {formatAddress(account)}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={copyAddress}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a
                      href={`https://etherscan.io/address/${account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Balance:</span>
                <span className="font-medium">
                  {balance && formatBalance(balance)} ETH
                </span>
              </div>

              <Button
                onClick={handleDisconnect}
                variant="destructive"
                className="w-full flex items-center gap-2"
              >
                <Power className="h-4 w-4" />
                Disconnect Wallet
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your wallet to start trading NFTs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                MetaMask
              </CardTitle>
              <CardDescription>Connect using browser wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? "Connecting..." : "Connect MetaMask"}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{typeof error === 'string' ? error : error.message}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            By connecting your wallet, you agree to our terms of service
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
