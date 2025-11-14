/**
 * Web3 Utilities
 * Centralized Web3/Ethereum utilities using MarketplaceHub pattern
 */

import { ethers, BrowserProvider, JsonRpcProvider } from "ethers";
import { envConfigManager } from "@/lib/utils/env-config";
import { logger } from "./logger";

export class Web3Utils {
  private provider: BrowserProvider | JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize provider
   * Note: SDK services are automatically initialized by ZunoProvider
   */
  async initializeProvider(): Promise<void> {
    try {
      // Check for MetaMask or other Web3 provider
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          this.provider = new ethers.BrowserProvider(window.ethereum);
          await this.provider.send("eth_requestAccounts", []);
          this.signer = await this.provider.getSigner();
        } catch (error) {
          logger.error("Failed to connect to MetaMask", error, {
            component: "Web3Utils",
            action: "initializeProvider",
          });
          // Fall back to JSON-RPC provider
          this.initializeFallbackProvider();
        }
      } else {
        // No MetaMask, use JSON-RPC provider for read-only operations
        logger.info("No MetaMask detected, using fallback RPC provider", null, {
          component: "Web3Utils",
          action: "initializeProvider",
        });
        this.initializeFallbackProvider();
      }

      logger.info("Web3 provider initialized - SDK services handled by ZunoProvider", null, {
        component: "Web3Utils",
        action: "initializeProvider",
      });
    } catch (error) {
      logger.error("Failed to initialize Web3 provider", error, {
        component: "Web3Utils",
        action: "initializeProvider",
      });
      throw new Error(
        "Failed to initialize Web3 provider: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  /**
   * Initialize fallback JSON-RPC provider for read-only operations
   */
  private initializeFallbackProvider(): void {
    const chainIdNum = envConfigManager.getDefaultChainId();
    const chainId = chainIdNum.toString();
    let rpcUrl = "";

    // Determine RPC URL based on chain ID
    switch (chainId) {
      case "31337": // Local development
        rpcUrl =
          process.env.NEXT_PUBLIC_RPC_URL_LOCAL || "http://127.0.0.1:8545";
        break;
      case "1": // Ethereum Mainnet
        rpcUrl =
          process.env.NEXT_PUBLIC_RPC_URL_MAINNET ||
          "https://eth-mainnet.alchemyapi.io/v2/YOUR-API-KEY";
        break;
      case "11155111": // Sepolia Testnet
        rpcUrl =
          process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA ||
          "https://sepolia.infura.io/v3/YOUR-PROJECT-ID";
        break;
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    logger.info(
      `Connecting to RPC: ${rpcUrl} (Chain ID: ${chainId})`,
      {
        rpcUrl,
        chainId,
      },
      { component: "Web3Utils", action: "initializeFallbackProvider" }
    );
    this.provider = new JsonRpcProvider(rpcUrl);
    this.signer = null; // No signer for read-only provider
  }

  /**
   * Get provider instance
   */
  getProvider(): BrowserProvider | JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * Get signer instance
   */
  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  /**
   * Force connect to MetaMask (for transactions)
   */
  async connectMetaMask(): Promise<void> {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not detected. Please install MetaMask.");
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);
      this.signer = await this.provider.getSigner();
      logger.success("MetaMask connected for transactions", null, {
        component: "Web3Utils",
        action: "connectWallet",
      });
    } catch (error) {
      throw new Error(
        "Failed to connect MetaMask: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  /**
   * Get connected account address
   */
  async getAccount(): Promise<string | null> {
    if (!this.signer) return null;
    try {
      return await this.signer.getAddress();
    } catch (error) {
      logger.error("Failed to get account", error, {
        component: "Web3Utils",
        action: "getAccount",
      });
      return null;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address?: string): Promise<string> {
    if (!this.provider) throw new Error("Provider not initialized");

    const accountAddress = address || (await this.getAccount());
    if (!accountAddress) throw new Error("No account found");

    try {
      const balance = await this.provider.getBalance(accountAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error("Failed to get balance");
    }
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<ethers.Network | null> {
    if (!this.provider) return null;
    try {
      return await this.provider.getNetwork();
    } catch (error) {
      logger.error("Failed to get network", error, {
        component: "Web3Utils",
        action: "getNetwork",
      });
      return null;
    }
  }

  /**
   * Switch network
   */
  async switchNetwork(chainId: string): Promise<void> {
    if (!window.ethereum) throw new Error("No Web3 provider found");

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error("Network not added to wallet");
      }
      throw new Error("Failed to switch network");
    }
  }

  /**
   * Format address for display
   */
  formatAddress(address: string, startLength = 6, endLength = 4): string {
    if (!address || address.length < startLength + endLength) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  }

  /**
   * Parse ether amount
   */
  parseEther(amount: string): bigint {
    return ethers.parseEther(amount);
  }

  /**
   * Format ether amount
   */
  formatEther(amount: bigint | string): string {
    return ethers.formatEther(amount);
  }

  /**
   * Check if address is valid
   */
  isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Get contract instance
   */
  getContract(address: string, abi: any[]): ethers.Contract {
    if (!this.provider) throw new Error("Provider not initialized");
    return new ethers.Contract(address, abi, this.signer || this.provider);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations = 1
  ): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) throw new Error("Provider not initialized");
    try {
      return await this.provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      throw new Error("Failed to wait for transaction");
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(to: string, data: string, value?: bigint): Promise<bigint> {
    if (!this.provider) throw new Error("Provider not initialized");

    try {
      return await this.provider.estimateGas({
        to,
        data,
        value: value || BigInt(0),
      });
    } catch (error) {
      throw new Error("Failed to estimate gas");
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    if (!this.provider) throw new Error("Provider not initialized");
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      throw new Error("Failed to get gas price");
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.provider = null;
    this.signer = null;
  }
}

// Singleton instance
export const web3Utils = new Web3Utils();

// Window ethereum type declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}
