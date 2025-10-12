/**
 * useWeb3 Hook
 * React hook for Web3 wallet connection management
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { web3Provider, Web3Connection } from "@/lib/services/web3/Web3Provider";
import { getDefaultChainId } from "@/lib/config/networks";
import { logger } from "@/lib/utils/logger";

export function useWeb3() {
  const [connection, setConnection] = useState<Web3Connection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Connect wallet
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const conn = await web3Provider.connect();

      // Check if on correct network
      const defaultChainId = getDefaultChainId();
      if (conn.chainId !== defaultChainId) {
        const shouldSwitch = window.confirm(
          `You are connected to the wrong network (chainId: ${conn.chainId}).\n` +
            `Would you like to switch to the correct network (chainId: ${defaultChainId})?`
        );

        if (shouldSwitch) {
          await web3Provider.switchNetwork(defaultChainId);
          // Re-connect after network switch
          const newConn = await web3Provider.connect();
          setConnection(newConn);
        } else {
          setError("Please switch to the correct network");
        }
      } else {
        setConnection(conn);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      logger.error("Wallet connection error", err, {
        component: "useWeb3",
        action: "connectWallet",
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    web3Provider.disconnect();
    setConnection(null);
    setError(null);
  }, []);

  /**
   * Switch network
   */
  const switchNetwork = useCallback(async (chainId: number) => {
    setError(null);
    try {
      await web3Provider.switchNetwork(chainId);
      const newConn = await web3Provider.connect();
      setConnection(newConn);
    } catch (err: any) {
      setError(err.message || "Failed to switch network");
      logger.error("Network switch error", err, {
        component: "useWeb3",
        action: "switchNetwork",
      });
    }
  }, []);

  /**
   * Check connection on mount (client-side only)
   */
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const existingConnection = web3Provider.getConnection();
      if (existingConnection) {
        setConnection(existingConnection);
      }
    }
  }, []);

  return {
    // State
    isConnected: !!connection,
    isConnecting,
    account: connection?.account || null,
    chainId: connection?.chainId || null,
    walletType: connection?.walletType || null,
    error,

    // Actions
    connect,
    disconnect,
    switchNetwork,
  };
}
