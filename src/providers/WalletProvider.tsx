/**
 * Wallet Provider
 * Manages wallet connection with persistence
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";
import { envConfigManager } from "@/lib/utils/env-config";

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | null;
  balance: string | null;

  // Provider & Signer
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;

  // Utils
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = "wallet_connection";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // Load saved connection on mount
  useEffect(() => {
    const savedConnection = localStorage.getItem(STORAGE_KEY);
    if (savedConnection) {
      const { account: savedAccount, chainId: savedChainId } =
        JSON.parse(savedConnection);
      if (savedAccount) {
        // Auto-reconnect
        reconnectWallet();
      }
    }

    // Setup event listeners
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("disconnect", handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, []);

  // Handle account change
  const handleAccountsChanged = useCallback(
    (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        refreshBalance();
        saveConnection(accounts[0], chainId);
      }
    },
    [account, chainId]
  );

  // Handle chain change
  const handleChainChanged = useCallback(
    (newChainId: string) => {
      const chainIdNum = parseInt(newChainId, 16);
      setChainId(chainIdNum);

      const supportedChainId = envConfigManager.getDefaultChainId();
      if (chainIdNum !== supportedChainId) {
        toast.warning(
          `Please switch to the correct network (Chain ID: ${supportedChainId})`
        );
      }

      if (account) {
        saveConnection(account, chainIdNum);
      }

      // Reload to reset state properly
      window.location.reload();
    },
    [account]
  );

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, []);

  // Save connection to localStorage
  const saveConnection = (account: string | null, chainId: number | null) => {
    if (account) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ account, chainId }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Reconnect wallet from saved state
  const reconnectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("No wallet found");
      }

      setIsConnecting(true);

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_accounts", []);

      if (accounts.length > 0) {
        const network = await web3Provider.getNetwork();
        const signer = await web3Provider.getSigner();
        const balance = await web3Provider.getBalance(accounts[0]);

        setProvider(web3Provider);
        setSigner(signer);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));
        setBalance(ethers.formatEther(balance));
        setIsConnected(true);

        logger.info("Wallet reconnected", { account: accounts[0] });
      }
    } catch (error) {
      logger.error("Failed to reconnect wallet", error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect wallet
  const connect = async () => {
    try {
      if (!window.ethereum) {
        toast.error("Please install MetaMask or another Web3 wallet");
        throw new Error("No wallet found");
      }

      setIsConnecting(true);

      const web3Provider = new ethers.BrowserProvider(window.ethereum);

      // Request account access
      const accounts = await web3Provider.send("eth_requestAccounts", []);

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const network = await web3Provider.getNetwork();
      const currentChainId = Number(network.chainId);

      // Check if on correct network
      const supportedChainId = envConfigManager.getDefaultChainId();
      if (currentChainId !== supportedChainId) {
        const shouldSwitch = confirm(
          `You are on the wrong network (Chain ID: ${currentChainId}).\n` +
            `Would you like to switch to the correct network (Chain ID: ${supportedChainId})?`
        );

        if (shouldSwitch) {
          await switchNetwork(supportedChainId);
          // Re-run connect after network switch
          return connect();
        }
      }

      const signer = await web3Provider.getSigner();
      const balance = await web3Provider.getBalance(accounts[0]);

      setProvider(web3Provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(currentChainId);
      setBalance(ethers.formatEther(balance));
      setIsConnected(true);

      // Save connection
      saveConnection(accounts[0], currentChainId);

      toast.success("Wallet connected successfully");
      logger.info("Wallet connected", {
        account: accounts[0],
        chainId: currentChainId,
      });
    } catch (error: any) {
      logger.error("Failed to connect wallet", error);

      if (error.code === 4001) {
        toast.error("Connection rejected by user");
      } else {
        toast.error(error.message || "Failed to connect wallet");
      }

      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setBalance(null);
    setIsConnected(false);

    // Clear saved connection
    localStorage.removeItem(STORAGE_KEY);

    toast.info("Wallet disconnected");
    logger.info("Wallet disconnected");
  };

  // Switch network
  const switchNetwork = async (targetChainId: number) => {
    try {
      if (!window.ethereum) {
        throw new Error("No wallet found");
      }

      const chainIdHex = `0x${targetChainId.toString(16)}`;

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          // Try to add the network
          await addNetwork(targetChainId);
        } else {
          throw switchError;
        }
      }

      toast.success("Network switched successfully");
    } catch (error: any) {
      logger.error("Failed to switch network", error);
      toast.error("Failed to switch network");
      throw error;
    }
  };

  // Add network to wallet
  const addNetwork = async (chainId: number) => {
    // Get RPC URL from config
    const rpcUrl = envConfigManager.getRpcUrl(chainId);

    // Define network parameters based on chainId
    const networks: Record<number, any> = {
      31337: {
        chainId: "0x7a69",
        chainName: "Local Network",
        nativeCurrency: {
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: [rpcUrl || "http://127.0.0.1:8545"],
        blockExplorerUrls: [],
      },
      11155111: {
        chainId: "0xaa36a7",
        chainName: "Sepolia",
        nativeCurrency: {
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: [rpcUrl || "https://rpc.sepolia.org"],
        blockExplorerUrls: ["https://sepolia.etherscan.io"],
      },
      1: {
        chainId: "0x1",
        chainName: "Ethereum",
        nativeCurrency: {
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: [rpcUrl || "https://eth.public-rpc.com"],
        blockExplorerUrls: ["https://etherscan.io"],
      },
    };

    const networkParams = networks[chainId];

    if (!networkParams) {
      throw new Error(`Unknown network: ${chainId}`);
    }

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [networkParams],
    });
  };

  // Refresh balance
  const refreshBalance = async () => {
    if (provider && account) {
      try {
        const balance = await provider.getBalance(account);
        setBalance(ethers.formatEther(balance));
      } catch (error) {
        logger.error("Failed to refresh balance", error);
      }
    }
  };

  // Auto-refresh balance periodically
  useEffect(() => {
    if (isConnected && account) {
      const interval = setInterval(refreshBalance, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, account, provider]);

  const value: WalletContextType = {
    isConnected,
    isConnecting,
    account,
    chainId,
    balance,
    provider,
    signer,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
