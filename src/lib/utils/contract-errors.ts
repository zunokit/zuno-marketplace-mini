/**
 * Contract Error Formatter Utility
 * Centralized error handling for smart contract interactions
 *
 * Converts low-level blockchain errors into user-friendly messages.
 * Handles common error cases like user rejection, insufficient funds,
 * and contract reverts.
 */

interface EthersError {
  code?: string;
  message?: string;
  reason?: string;
  data?: {
    message?: string;
  };
}

export class ContractErrorFormatter {
  /**
   * Format a transaction error into a user-friendly Error object
   *
   * @param error - Error from ethers.js transaction
   * @param defaultMessage - Optional default message if error cannot be parsed
   * @returns Formatted Error object with user-friendly message
   *
   * @example
   * ```typescript
   * try {
   *   await contract.transfer(to, amount);
   * } catch (error) {
   *   throw ContractErrorFormatter.format(error);
   * }
   * ```
   */
  static format(error: unknown, defaultMessage = "Transaction failed"): Error {
    // Handle null/undefined
    if (!error) {
      return new Error(defaultMessage);
    }

    // If it's already a formatted Error, return it
    if (error instanceof Error && !this.isEthersError(error)) {
      return error;
    }

    // Handle ethers.js errors
    if (typeof error === "object") {
      const err = error as EthersError;

      // User rejected transaction
      if (err.code === "ACTION_REJECTED") {
        return new Error("Transaction was rejected by user");
      }

      // Insufficient funds
      if (err.code === "INSUFFICIENT_FUNDS") {
        return new Error("Insufficient funds to complete transaction");
      }

      // Network errors
      if (err.code === "NETWORK_ERROR") {
        return new Error("Network error - please check your connection");
      }

      // Timeout errors
      if (err.code === "TIMEOUT") {
        return new Error("Transaction timeout - please try again");
      }

      // Nonce errors
      if (err.code === "NONCE_EXPIRED" || err.code === "REPLACEMENT_UNDERPRICED") {
        return new Error("Transaction nonce error - please try again");
      }

      // Contract execution reverted
      if (err.message?.includes("execution reverted")) {
        // Try to extract revert reason
        const revertReason = this.extractRevertReason(err.message);
        return new Error(revertReason || "Transaction failed: contract execution reverted");
      }

      // Handle call exceptions (view function failures)
      if (err.code === "CALL_EXCEPTION") {
        if (err.reason) {
          return new Error(`Contract call failed: ${err.reason}`);
        }
        if (err.data?.message) {
          return new Error(`Contract call failed: ${err.data.message}`);
        }
        return new Error("Contract call failed");
      }

      // Generic error with message
      if (err.message) {
        return new Error(err.message);
      }

      // Generic error with reason
      if (err.reason) {
        return new Error(err.reason);
      }
    }

    // Fallback for string errors
    if (typeof error === "string") {
      return new Error(error);
    }

    // Ultimate fallback
    return new Error(defaultMessage);
  }

  /**
   * Extract revert reason from error message
   *
   * @param message - Error message containing revert reason
   * @returns Extracted revert reason or null
   */
  private static extractRevertReason(message: string): string | null {
    // Try to extract reason from "execution reverted: <reason>"
    const revertMatch = message.match(/execution reverted:?\s*(.+)/i);
    if (revertMatch && revertMatch[1]) {
      return revertMatch[1].trim();
    }

    // Try to extract from parentheses
    const parenMatch = message.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) {
      return parenMatch[1].trim();
    }

    return null;
  }

  /**
   * Check if error is an ethers.js error
   *
   * @param error - Error to check
   * @returns True if error appears to be from ethers.js
   */
  private static isEthersError(error: unknown): boolean {
    if (typeof error !== "object" || !error) {
      return false;
    }

    const err = error as EthersError;
    return (
      err.code !== undefined ||
      (err.message !== undefined && (
        err.message.includes("execution reverted") ||
        err.message.includes("ethers")
      ))
    );
  }

  /**
   * Format error with additional context
   *
   * @param error - Original error
   * @param context - Additional context to prepend
   * @returns Formatted Error with context
   *
   * @example
   * ```typescript
   * try {
   *   await contract.createListing(...);
   * } catch (error) {
   *   throw ContractErrorFormatter.formatWithContext(
   *     error,
   *     "Failed to create listing"
   *   );
   * }
   * ```
   */
  static formatWithContext(error: unknown, context: string): Error {
    const formattedError = this.format(error);
    return new Error(`${context}: ${formattedError.message}`);
  }

  /**
   * Check if error is a user rejection
   *
   * @param error - Error to check
   * @returns True if user rejected the transaction
   */
  static isUserRejection(error: unknown): boolean {
    if (typeof error === "object" && error !== null) {
      const err = error as EthersError;
      return err.code === "ACTION_REJECTED";
    }
    return false;
  }

  /**
   * Check if error is due to insufficient funds
   *
   * @param error - Error to check
   * @returns True if error is due to insufficient funds
   */
  static isInsufficientFunds(error: unknown): boolean {
    if (typeof error === "object" && error !== null) {
      const err = error as EthersError;
      return err.code === "INSUFFICIENT_FUNDS";
    }
    return false;
  }
}
