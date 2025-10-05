/**
 * useWeb3 Hook
 * React hook for Web3 functionality
 */

import { useState, useEffect, useCallback } from "react";
import { web3Utils } from "@/lib/utils/web3";
import type { ethers } from "ethers";

interface UseWeb3Return {
  account: string | null;
  chainId: number | null;
  balance: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: string) => Promise<void>;
  getProvider: () => ethers.BrowserProvider | ethers.JsonRpcProvider | null;
  getSigner: () => ethers.Signer | null;
}

export function useWeb3(): UseWeb3Return {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!account;

  /**
   * Connect wallet
   */
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await web3Utils.initializeProvider();
      const acc = await web3Utils.getAccount();
      const network = await web3Utils.getNetwork();
      const bal = await web3Utils.getBalance();

      setAccount(acc);
      setChainId(network ? Number(network.chainId) : null);
      setBalance(bal);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      console.error("Wallet connection error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    web3Utils.disconnect();
    setAccount(null);
    setChainId(null);
    setBalance(null);
    setError(null);
  }, []);

  /**
   * Switch network
   */
  const switchNetwork = useCallback(async (targetChainId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await web3Utils.switchNetwork(targetChainId);
      // Wait a bit for network to switch
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const network = await web3Utils.getNetwork();
      setChainId(network ? Number(network.chainId) : null);
    } catch (err: any) {
      setError(err.message || "Failed to switch network");
      console.error("Network switch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get provider
   */
  const getProvider = useCallback(() => {
    return web3Utils.getProvider();
  }, []);

  /**
   * Get signer
   */
  const getSigner = useCallback(() => {
    return web3Utils.getSigner();
  }, []);

  /**
   * Update balance
   */
  const updateBalance = useCallback(async () => {
    if (!account) return;
    try {
      const bal = await web3Utils.getBalance();
      setBalance(bal);
    } catch (err) {
      console.error("Failed to update balance:", err);
    }
  }, [account]);

  /**
   * Listen for account changes
   */
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        updateBalance();
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
      updateBalance();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect, updateBalance]);

  /**
   * Auto-connect if previously connected
   */
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          await connect();
        }
      } catch (err) {
        console.error("Auto-connect failed:", err);
      }
    };

    autoConnect();
  }, [connect]);

  return {
    account,
    chainId,
    balance,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    switchNetwork,
    getProvider,
    getSigner,
  };
}
