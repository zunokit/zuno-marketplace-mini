/**
 * WalletButton Component
 * Handles wallet connection UI
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/hooks/useWeb3';
import { getNetworkConfig } from '@/lib/config/networks';
import { Wallet, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export function WalletButton() {
  // Prevent hydration mismatch by only rendering on client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const {
    isConnected,
    isConnecting,
    account,
    chainId,
    error,
    connect,
    disconnect,
  } = useWeb3();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return 'Unknown Network';
    const config = getNetworkConfig(chainId);
    return config?.name || `Chain ${chainId}`;
  };

  // Don't render on server to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" disabled>
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-500">{error}</span>
        <Button onClick={connect} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <Button disabled variant="outline">
        <Wallet className="mr-2 h-4 w-4 animate-pulse" />
        Connecting...
      </Button>
    );
  }

  if (isConnected && account) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Wallet className="mr-2 h-4 w-4" />
            <span className="mr-2">{formatAddress(account)}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="p-2">
            <p className="text-xs text-muted-foreground">Connected to</p>
            <p className="text-sm font-medium">{getNetworkName(chainId)}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(account)}>
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`https://etherscan.io/address/${account}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Explorer
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnect} className="text-red-600">
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={connect} variant="default">
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
