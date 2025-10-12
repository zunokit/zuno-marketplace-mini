import { ethers, BrowserProvider } from "ethers";
import { logger } from "@/lib/utils/logger";

export class ProviderFactory {
  private static readonly NETWORK_ANY = "any";

  static createBrowserProvider(
    ethereum: any = window.ethereum
  ): BrowserProvider {
    if (!ethereum) {
      throw new Error("No Web3 wallet detected");
    }

    return new BrowserProvider(ethereum, this.NETWORK_ANY);
  }

  static async handleProviderError(error: any): Promise<void> {
    const isBlockOutOfRange =
      error.message?.includes("BlockOutOfRangeError") ||
      error.message?.includes("block height");

    if (isBlockOutOfRange) {
      logger.warn("Blockchain state reset detected", {
        error: error.message,
        action: "clearing_cache",
      });

      localStorage.removeItem("wallet_connection");

      throw new Error(
        "Blockchain was reset. Please refresh the page and reconnect your wallet."
      );
    }

    throw error;
  }
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
