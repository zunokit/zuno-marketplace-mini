/**
 * Transaction Service
 * Handles transaction management, retry logic, and gas optimization
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";

export interface TransactionOptions {
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  value?: bigint;
  nonce?: number;
  confirmations?: number;
  timeout?: number;
  retries?: number;
}

export interface TransactionResult {
  hash: string;
  blockNumber: number;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  status: boolean;
  logs: readonly ethers.Log[];
}

export class TransactionService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private defaultOptions: TransactionOptions = {
    confirmations: 1,
    timeout: 60000, // 60 seconds
    retries: 3,
  };

  /**
   * Initialize the service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    logger.info("TransactionService initialized");
  }

  /**
   * Send a transaction with retry logic
   */
  async sendTransaction(
    transaction: ethers.TransactionRequest,
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    if (!this.signer) {
      throw new Error("Signer not available");
    }

    const opts = { ...this.defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 1; attempt <= (opts.retries || 1); attempt++) {
      try {
        logger.info(
          `Sending transaction (attempt ${attempt}/${opts.retries})`,
          {
            to: transaction.to,
            value: transaction.value
              ? ethers.formatEther(transaction.value)
              : "0",
          }
        );

        // Estimate gas if not provided
        if (!transaction.gasLimit) {
          transaction.gasLimit = await this.estimateGas(transaction);
        }

        // Get current gas prices if not provided
        if (!transaction.maxFeePerGas) {
          const feeData = await this.provider!.getFeeData();
          transaction.maxFeePerGas = feeData.maxFeePerGas;
          transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
        }

        // Send transaction
        const tx = await this.signer.sendTransaction(transaction);

        // Wait for confirmation
        const receipt = await this.waitForTransaction(tx.hash, opts);

        return this.formatReceipt(receipt);
      } catch (error: any) {
        lastError = error;
        logger.warn(`Transaction attempt ${attempt} failed`, error);

        // Don't retry on user rejection
        if (error.code === "ACTION_REJECTED" || error.code === 4001) {
          throw error;
        }

        // Wait before retry
        if (attempt < (opts.retries || 1)) {
          await this.delay(2000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    tx: string,
    options: TransactionOptions = {}
  ): Promise<ethers.TransactionReceipt> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const hash = tx;
    const confirmations =
      options.confirmations || this.defaultOptions.confirmations || 1;
    const timeout = options.timeout || this.defaultOptions.timeout || 60000;

    logger.info(`Waiting for transaction ${hash}`);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Transaction timeout after ${timeout}ms`));
      }, timeout);

      this.provider!.waitForTransaction(hash, confirmations)
        .then((receipt) => {
          clearTimeout(timeoutId);

          if (!receipt) {
            reject(new Error("Transaction receipt not found"));
            return;
          }

          if (receipt.status === 0) {
            reject(new Error("Transaction reverted"));
            return;
          }

          logger.success(
            `Transaction confirmed in block ${receipt.blockNumber}`
          );
          resolve(receipt);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: ethers.TransactionRequest): Promise<bigint> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    try {
      const estimated = await this.provider.estimateGas(transaction);
      // Add 20% buffer
      const withBuffer = (estimated * 120n) / 100n;

      logger.debug(`Gas estimated: ${estimated} (with buffer: ${withBuffer})`);

      return withBuffer;
    } catch (error) {
      logger.error("Gas estimation failed", error);
      // Return default gas limit
      return 500000n;
    }
  }

  /**
   * Get current gas prices
   */
  async getGasPrices(): Promise<{
    standard: bigint;
    fast: bigint;
    instant: bigint;
  }> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const feeData = await this.provider.getFeeData();
    const basePrice = feeData.gasPrice || 0n;

    return {
      standard: basePrice,
      fast: (basePrice * 110n) / 100n, // 10% higher
      instant: (basePrice * 125n) / 100n, // 25% higher
    };
  }

  /**
   * Format transaction receipt
   */
  private formatReceipt(receipt: ethers.TransactionReceipt): TransactionResult {
    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.gasPrice || 0n,
      status: receipt.status === 1,
      logs: receipt.logs,
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if transaction is pending
   */
  async isTransactionPending(hash: string): Promise<boolean> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const tx = await this.provider.getTransaction(hash);
    return tx !== null && tx.blockNumber === null;
  }

  /**
   * Cancel transaction by sending with higher gas
   */
  async cancelTransaction(hash: string): Promise<string> {
    if (!this.signer || !this.provider) {
      throw new Error("Signer or provider not available");
    }

    const tx = await this.provider.getTransaction(hash);
    if (!tx || tx.blockNumber !== null) {
      throw new Error("Transaction not pending or already mined");
    }

    const signer = await this.signer.getAddress();

    // Send 0 value transaction to self with same nonce but higher gas
    const feeData = await this.provider.getFeeData();
    const cancelTx = await this.signer.sendTransaction({
      to: signer,
      value: 0n,
      nonce: tx.nonce,
      maxFeePerGas: (feeData.maxFeePerGas || 0n) * 2n, // Double the gas
      maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas || 0n) * 2n,
    });

    logger.info(`Cancellation transaction sent: ${cancelTx.hash}`);

    return cancelTx.hash;
  }

  /**
   * Speed up transaction by sending with higher gas
   */
  async speedUpTransaction(
    hash: string,
    multiplier: number = 1.5
  ): Promise<string> {
    if (!this.signer || !this.provider) {
      throw new Error("Signer or provider not available");
    }

    const tx = await this.provider.getTransaction(hash);
    if (!tx || tx.blockNumber !== null) {
      throw new Error("Transaction not pending or already mined");
    }

    // Resend with higher gas
    const speedUpTx = await this.signer.sendTransaction({
      ...tx,
      maxFeePerGas: tx.maxFeePerGas
        ? (tx.maxFeePerGas * BigInt(Math.floor(multiplier * 100))) / 100n
        : undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas
        ? (tx.maxPriorityFeePerGas * BigInt(Math.floor(multiplier * 100))) /
          100n
        : undefined,
    });

    logger.info(`Speed up transaction sent: ${speedUpTx.hash}`);

    return speedUpTx.hash;
  }
}

// Export singleton instance
export const transactionService = new TransactionService();
