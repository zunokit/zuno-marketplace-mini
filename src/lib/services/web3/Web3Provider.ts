/**
 * Web3 Provider Service
 * Handles wallet connections across different networks
 * Supports MetaMask, WalletConnect, and other Web3 wallets
 */

import { ethers } from 'ethers';
import { getNetworkConfig } from '@/lib/config/networks';
import { ProviderFactory } from './provider-factory';

export enum WalletType {
  METAMASK = 'metamask',
  WALLET_CONNECT = 'walletconnect',
  COINBASE = 'coinbase',
  INJECTED = 'injected'
}

export interface Web3Connection {
  provider: ethers.Provider;
  signer: ethers.Signer;
  account: string;
  chainId: number;
  walletType: WalletType;
}

export class Web3Provider {
  private connection: Web3Connection | null = null;

  /**
   * Connect to Web3 wallet
   */
  async connect(preferredWallet?: WalletType): Promise<Web3Connection> {
    // If already connected, return existing connection
    if (this.connection) {
      return this.connection;
    }

    // Detect and connect to wallet
    const wallet = preferredWallet || this.detectWallet();
    
    switch (wallet) {
      case WalletType.METAMASK:
      case WalletType.INJECTED:
        return this.connectInjectedWallet();
      default:
        throw new Error(`Wallet type ${wallet} not yet supported`);
    }
  }

  /**
   * Detect available wallet
   */
  private detectWallet(): WalletType {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No Web3 wallet detected. Please install MetaMask.');
    }

    if (window.ethereum.isMetaMask) {
      return WalletType.METAMASK;
    }
    
    return WalletType.INJECTED;
  }

  /**
   * Connect to injected wallet (MetaMask, etc.)
   */
  private async connectInjectedWallet(): Promise<Web3Connection> {
    if (!window.ethereum) {
      throw new Error('No injected Web3 provider found');
    }

    const provider = ProviderFactory.createBrowserProvider();
    await provider.send('eth_requestAccounts', []);

    const signer = await provider.getSigner();
    const account = await signer.getAddress();
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Validate network is supported
    const networkConfig = getNetworkConfig(chainId);
    if (!networkConfig) {
      throw new Error(`Network with chainId ${chainId} is not supported`);
    }

    this.connection = {
      provider,
      signer,
      account,
      chainId,
      walletType: window.ethereum.isMetaMask ? WalletType.METAMASK : WalletType.INJECTED
    };

    // Listen for account changes (only in browser)
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          // Reconnect with new account
          this.connection = null;
          this.connectInjectedWallet();
        }
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        // Reload the page to reset state
        window.location.reload();
      });
    }

    return this.connection;
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(targetChainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No Web3 wallet available');
    }

    const networkConfig = getNetworkConfig(targetChainId);
    if (!networkConfig) {
      throw new Error(`Network ${targetChainId} not configured`);
    }

    const chainIdHex = `0x${targetChainId.toString(16)}`;

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: any) {
      // If network doesn't exist in wallet, add it
      if (error.code === 4902) {
        await this.addNetwork(targetChainId);
        // Try switching again
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } else {
        throw error;
      }
    }

    // Reconnect with new network
    this.connection = null;
    await this.connect();
  }

  /**
   * Add network to wallet
   */
  private async addNetwork(chainId: number): Promise<void> {
    const networkConfig = getNetworkConfig(chainId);
    if (!networkConfig) {
      throw new Error(`Network ${chainId} not configured`);
    }

    const params = {
      chainId: `0x${chainId.toString(16)}`,
      chainName: networkConfig.name,
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: [networkConfig.rpcUrl],
      blockExplorerUrls: networkConfig.blockExplorer ? [networkConfig.blockExplorer] : undefined,
    };

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [params],
    });
  }

  /**
   * Get current connection
   */
  getConnection(): Web3Connection | null {
    return this.connection;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get current account
   */
  getAccount(): string | null {
    return this.connection?.account || null;
  }

  /**
   * Get current chain ID
   */
  getChainId(): number | null {
    return this.connection?.chainId || null;
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.connection = null;
  }

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.connection?.signer) {
      throw new Error('No signer available');
    }
    return this.connection.signer.signMessage(message);
  }
}

// Export singleton instance
export const web3Provider = new Web3Provider();

// Window ethereum type
declare global {
  interface Window {
    ethereum?: any;
  }
}
