/**
 * Wallet Connect Button Component
 * Manages wallet connection with proper state persistence
 */

'use client';

import { useWallet } from '@/providers/WalletProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Copy,
  ExternalLink,
  LogOut,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function WalletConnectButton() {
  const { 
    isConnected, 
    isConnecting, 
    account, 
    chainId, 
    balance, 
    connect, 
    disconnect,
    switchNetwork 
  } = useWallet();
  
  const [copied, setCopied] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openEtherscan = () => {
    if (account) {
      const baseUrl = chainId === 1 ? 'https://etherscan.io' : 
                      chainId === 5 ? 'https://goerli.etherscan.io' :
                      chainId === 31337 ? '#' : 'https://etherscan.io';
      
      if (baseUrl !== '#') {
        window.open(`${baseUrl}/address/${account}`, '_blank');
      }
    }
  };

  const getNetworkName = (chainId: number) => {
    const networks: Record<number, string> = {
      1: 'Ethereum',
      5: 'Goerli',
      31337: 'Localhost',
      // Add more networks as needed
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  const isCorrectNetwork = chainId === parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');

  if (isConnecting) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <Button onClick={connect}>
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {account?.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {formatAddress(account!)}
            </span>
            {balance && (
              <span className="text-xs text-muted-foreground">
                {parseFloat(balance).toFixed(4)} ETH
              </span>
            )}
          </div>

          {!isCorrectNetwork && (
            <Badge variant="destructive" className="ml-2">
              <AlertCircle className="h-3 w-3 mr-1" />
              Wrong Network
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Connected Wallet</p>
            <p className="text-xs text-muted-foreground">
              {formatAddress(account!)}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={copyAddress}>
          {copied ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy Address'}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={openEtherscan}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Network
        </DropdownMenuLabel>
        
        <DropdownMenuItem disabled>
          <div className="flex items-center justify-between w-full">
            <span>{getNetworkName(chainId!)}</span>
            {isCorrectNetwork ? (
              <Badge variant="outline" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="ml-2">
                Wrong
              </Badge>
            )}
          </div>
        </DropdownMenuItem>
        
        {!isCorrectNetwork && (
          <DropdownMenuItem 
            onClick={() => switchNetwork(parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337'))}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Switch Network
          </DropdownMenuItem>
        )}
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Balance
        </DropdownMenuLabel>
        
        <DropdownMenuItem disabled>
          <Wallet className="mr-2 h-4 w-4" />
          {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0 ETH'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={disconnect} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
