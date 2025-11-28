/**
 * WalletProvider - Clean Architecture Implementation
 * Manages Web3 wallet connections with proper separation of concerns
 */

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { logger } from "@/lib/utils/sdk-logger";
import { envConfigManager } from "@/lib/utils/env-config";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | null;
  balance: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  error: Error | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "wallet_connection_v2";
const MAX_RECONNECT_ATTEMPTS = 3;

// ============================================================================
// Action Types & Creators
// ============================================================================

enum ActionType {
  CONNECT_START = "CONNECT_START",
  CONNECT_SUCCESS = "CONNECT_SUCCESS",
  CONNECT_ERROR = "CONNECT_ERROR",
  DISCONNECT = "DISCONNECT",
  UPDATE_BALANCE = "UPDATE_BALANCE",
  UPDATE_CHAIN = "UPDATE_CHAIN",
  SET_ERROR = "SET_ERROR",
  CLEAR_ERROR = "CLEAR_ERROR",
}

type Action =
  | { type: ActionType.CONNECT_START }
  | {
      type: ActionType.CONNECT_SUCCESS;
      payload: {
        account: string;
        chainId: number;
        balance: string;
        provider: ethers.BrowserProvider;
        signer: ethers.JsonRpcSigner;
      };
    }
  | { type: ActionType.CONNECT_ERROR; payload: Error }
  | { type: ActionType.DISCONNECT }
  | { type: ActionType.UPDATE_BALANCE; payload: string }
  | { type: ActionType.UPDATE_CHAIN; payload: number }
  | { type: ActionType.SET_ERROR; payload: Error }
  | { type: ActionType.CLEAR_ERROR };

// ============================================================================
// Initial State
// ============================================================================

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  account: null,
  chainId: null,
  balance: null,
  provider: null,
  signer: null,
  error: null,
};

// ============================================================================
// Reducer - Pure Function for State Management
// ============================================================================

function walletReducer(state: WalletState, action: Action): WalletState {
  switch (action.type) {
    case ActionType.CONNECT_START:
      return {
        ...state,
        isConnecting: true,
        error: null,
      };

    case ActionType.CONNECT_SUCCESS:
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        account: action.payload.account,
        chainId: action.payload.chainId,
        balance: action.payload.balance,
        provider: action.payload.provider,
        signer: action.payload.signer,
        error: null,
      };

    case ActionType.CONNECT_ERROR:
      return {
        ...state,
        isConnecting: false,
        error: action.payload,
      };

    case ActionType.DISCONNECT:
      return {
        ...initialState,
      };

    case ActionType.UPDATE_BALANCE:
      return {
        ...state,
        balance: action.payload,
      };

    case ActionType.UPDATE_CHAIN:
      return {
        ...state,
        chainId: action.payload,
      };

    case ActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case ActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// ============================================================================
// Storage Service - Single Responsibility
// ============================================================================

class WalletStorage {
  static save(account: string, chainId: number): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ account, chainId, timestamp: Date.now() })
      );
    } catch (error) {
      logger.warn("Failed to save wallet connection", error);
    }
  }

  static load(): { account: string; chainId: number } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);
      
      // Check if data is not too old (24 hours)
      const dayInMs = 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > dayInMs) {
        this.clear();
        return null;
      }

      return { account: parsed.account, chainId: parsed.chainId };
    } catch (error) {
      logger.warn("Failed to load wallet connection", error);
      this.clear();
      return null;
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.warn("Failed to clear wallet connection", error);
    }
  }
}

// ============================================================================
// Wallet Service - Business Logic
// ============================================================================

class WalletService {
  private static reconnectAttempts = 0;

  static async detectWallet(): Promise<ethers.BrowserProvider> {
    if (!window.ethereum) {
      throw new Error("No Web3 wallet detected. Please install MetaMask.");
    }

    return new ethers.BrowserProvider(window.ethereum);
  }

  static async requestConnection(
    provider: ethers.BrowserProvider
  ): Promise<{
    account: string;
    chainId: number;
    balance: string;
    signer: ethers.JsonRpcSigner;
  }> {
    const accounts = await provider.send("eth_requestAccounts", []);
    
    if (!accounts.length) {
      throw new Error("No accounts available. Please unlock your wallet.");
    }

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const signer = await provider.getSigner();
    const balance = await provider.getBalance(accounts[0]);

    return {
      account: accounts[0],
      chainId,
      balance: ethers.formatEther(balance),
      signer,
    };
  }

  static async reconnect(): Promise<{
    account: string;
    chainId: number;
    balance: string;
    provider: ethers.BrowserProvider;
    signer: ethers.JsonRpcSigner;
  } | null> {
    try {
      if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        logger.warn("Max reconnect attempts reached");
        return null;
      }

      this.reconnectAttempts++;

      const savedConnection = WalletStorage.load();
      if (!savedConnection) return null;

      const provider = await this.detectWallet();
      const accounts = await provider.send("eth_accounts", []);
      
      if (!accounts.length) return null;

      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const signer = await provider.getSigner();
      const balance = await provider.getBalance(accounts[0]);

      this.reconnectAttempts = 0;

      return {
        account: accounts[0],
        chainId,
        balance: ethers.formatEther(balance),
        provider,
        signer,
      };
    } catch (error) {
      logger.error("Reconnection failed", error);
      return null;
    }
  }

  static validateNetwork(currentChainId: number): boolean {
    const expectedChainId = envConfigManager.getDefaultChainId();
    return currentChainId === expectedChainId;
  }

  static async switchNetwork(
    provider: ethers.BrowserProvider,
    targetChainId: number
  ): Promise<void> {
    const hexChainId = `0x${targetChainId.toString(16)}`;
    
    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: hexChainId },
      ]);
    } catch (error) {
      // Chain not added to wallet, try to add it
      if ((error as { code?: number }).code === 4902) {
        throw new Error(
          `Chain ${targetChainId} not configured in wallet. Please add it manually.`
        );
      }
      throw error;
    }
  }
}

// ============================================================================
// Context & Provider Component
// ============================================================================

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // ------------------------------------------------------------------------
  // Event Handlers
  // ------------------------------------------------------------------------

  const handleAccountsChanged = useCallback(
    (accounts: string[]) => {
      if (!accounts.length) {
        dispatch({ type: ActionType.DISCONNECT });
        WalletStorage.clear();
        return;
      }

      if (accounts[0] !== state.account) {
        // Account changed, update state and refresh balance
        if (state.provider && accounts[0]) {
          state.provider.getBalance(accounts[0]).then(balance => {
            dispatch({
              type: ActionType.UPDATE_BALANCE,
              payload: ethers.formatEther(balance),
            });
          }).catch(err => {
            logger.error("Failed to refresh balance on account change", err);
          });
        }
        if (state.chainId) {
          WalletStorage.save(accounts[0], state.chainId);
        }
      }
    },
    [state.account, state.chainId, state.provider]
  );

  const handleChainChanged = useCallback((newChainIdHex: string) => {
    const newChainId = parseInt(newChainIdHex, 16);
    dispatch({ type: ActionType.UPDATE_CHAIN, payload: newChainId });

    if (!WalletService.validateNetwork(newChainId)) {
      toast.warning(
        `Network mismatch. Please switch to chain ${envConfigManager.getDefaultChainId()}`
      );
    }

    // Reload page to ensure clean state
    window.location.reload();
  }, []);

  const handleDisconnect = useCallback(() => {
    dispatch({ type: ActionType.DISCONNECT });
    WalletStorage.clear();
  }, []);

  // ------------------------------------------------------------------------
  // Public Actions
  // ------------------------------------------------------------------------

  const connect = useCallback(async () => {
    try {
      dispatch({ type: ActionType.CONNECT_START });

      const provider = await WalletService.detectWallet();
      const connectionData = await WalletService.requestConnection(provider);

      // Validate network
      if (!WalletService.validateNetwork(connectionData.chainId)) {
        const expectedChainId = envConfigManager.getDefaultChainId();
        
        const shouldSwitch = window.confirm(
          `You're on the wrong network (Chain ID: ${connectionData.chainId}).\n` +
          `Would you like to switch to chain ${expectedChainId}?`
        );

        if (shouldSwitch) {
          await WalletService.switchNetwork(provider, expectedChainId);
          // Connection will be handled by chain change event
          return;
        }
      }

      dispatch({
        type: ActionType.CONNECT_SUCCESS,
        payload: { ...connectionData, provider },
      });

      WalletStorage.save(connectionData.account, connectionData.chainId);

      // SDK services are automatically initialized by ZunoProvider
      logger.info("Wallet connected - SDK services ready");

      toast.success(`Connected to ${connectionData.account.slice(0, 6)}...${connectionData.account.slice(-4)}`);

      logger.info("Wallet connected", {
        account: connectionData.account,
        chainId: connectionData.chainId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet";
      dispatch({ type: ActionType.CONNECT_ERROR, payload: error instanceof Error ? error : new Error(errorMessage) });
      toast.error(errorMessage);
      logger.error("Connection failed", error);
    }
  }, []);

  const disconnect = useCallback(() => {
    dispatch({ type: ActionType.DISCONNECT });
    WalletStorage.clear();
    toast.info("Wallet disconnected");
    logger.info("Wallet disconnected");
  }, []);

  const switchNetwork = useCallback(
    async (targetChainId: number) => {
      if (!state.provider) {
        throw new Error("No wallet connected");
      }

      try {
        await WalletService.switchNetwork(state.provider, targetChainId);
        toast.success(`Switched to chain ${targetChainId}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to switch network");
        throw error;
      }
    },
    [state.provider]
  );

  const refreshBalance = useCallback(async () => {
    if (!state.provider || !state.account) return;

    try {
      const balance = await state.provider.getBalance(state.account);
      dispatch({
        type: ActionType.UPDATE_BALANCE,
        payload: ethers.formatEther(balance),
      });
    } catch (error) {
      logger.error("Failed to refresh balance", error);
    }
  }, [state.provider, state.account]);

  // ------------------------------------------------------------------------
  // Effects
  // ------------------------------------------------------------------------

  // Setup event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const ethereum = window.ethereum;

    const accountsHandler = (accounts: unknown) => handleAccountsChanged(accounts as string[]);
    const chainHandler = (chainId: unknown) => handleChainChanged(chainId as string);
    const disconnectHandler = () => handleDisconnect();

    ethereum.on("accountsChanged", accountsHandler);
    ethereum.on("chainChanged", chainHandler);
    ethereum.on("disconnect", disconnectHandler);

    return () => {
      ethereum.removeListener("accountsChanged", accountsHandler);
      ethereum.removeListener("chainChanged", chainHandler);
      ethereum.removeListener("disconnect", disconnectHandler);
    };
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

  // Auto-reconnect on mount
  useEffect(() => {
    let mounted = true;

    const attemptReconnect = async () => {
      if (!mounted || state.isConnected || state.isConnecting) return;

      const connectionData = await WalletService.reconnect();

      if (connectionData && mounted) {
        dispatch({
          type: ActionType.CONNECT_SUCCESS,
          payload: connectionData,
        });

        // SDK services are automatically initialized by ZunoProvider
        logger.info("Auto-reconnected to wallet with SDK services ready");
      }
    };

    // Delay reconnect to avoid race conditions
    const timeoutId = setTimeout(attemptReconnect, 500);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Refresh balance periodically
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(refreshBalance, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [state.isConnected, refreshBalance]);

  // ------------------------------------------------------------------------
  // Context Value
  // ------------------------------------------------------------------------

  const contextValue = useMemo<WalletContextType>(
    () => ({
      ...state,
      connect,
      disconnect,
      switchNetwork,
      refreshBalance,
    }),
    [state, connect, disconnect, switchNetwork, refreshBalance]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

// Default context value for SSR/prerendering
const defaultContextValue: WalletContextType = {
  ...initialState,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {},
  refreshBalance: async () => {},
};

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);

  // Return default value during SSR/prerendering instead of throwing
  if (!context) {
    return defaultContextValue;
  }

  return context;
}

// ============================================================================
// Utility Hooks
// ============================================================================

export function useIsWalletReady(): boolean {
  const { isConnected, provider, signer } = useWallet();
  return isConnected && !!provider && !!signer;
}

export function useWalletAddress(): string {
  const { account } = useWallet();
  
  if (!account) {
    throw new Error("No wallet connected");
  }
  
  return account;
}

export function useChainId(): number {
  const { chainId } = useWallet();
  
  if (!chainId) {
    throw new Error("No chain ID available");
  }
  
  return chainId;
}
