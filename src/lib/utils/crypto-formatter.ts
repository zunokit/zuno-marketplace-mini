/**
 * Crypto Formatter Utility
 * Centralized formatting for cryptocurrency values, fees, and percentages
 *
 * Provides consistent formatting between blockchain data (wei, basis points)
 * and user-friendly display formats (ETH, percentages).
 */

import { ethers } from "ethers";
import { CONTRACT_CONSTANTS } from "@/lib/constants";

export class CryptoFormatter {
  /**
   * Format wei to ETH string with specified decimal places
   *
   * @param wei - Value in wei (bigint)
   * @param decimals - Number of decimal places to show (default: 4)
   * @param showUnit - Whether to append " ETH" (default: false)
   * @returns Formatted ETH value string
   *
   * @example
   * ```typescript
   * CryptoFormatter.formatPrice(1000000000000000000n); // "1.0000"
   * CryptoFormatter.formatPrice(500000000000000000n, 2); // "0.50"
   * CryptoFormatter.formatPrice(1500000000000000000n, 4, true); // "1.5000 ETH"
   * ```
   */
  static formatPrice(
    wei: bigint,
    decimals: number = 4,
    showUnit: boolean = false
  ): string {
    const ethValue = ethers.formatEther(wei);
    const formatted = parseFloat(ethValue).toFixed(decimals);
    return showUnit ? `${formatted} ETH` : formatted;
  }

  /**
   * Format wei to ETH with variable precision (removes trailing zeros)
   *
   * @param wei - Value in wei (bigint)
   * @param maxDecimals - Maximum decimal places (default: 6)
   * @param showUnit - Whether to append " ETH" (default: false)
   * @returns Formatted ETH value string
   *
   * @example
   * ```typescript
   * CryptoFormatter.formatPriceVariable(1000000000000000000n); // "1"
   * CryptoFormatter.formatPriceVariable(1500000000000000000n); // "1.5"
   * CryptoFormatter.formatPriceVariable(1234560000000000000n); // "1.23456"
   * ```
   */
  static formatPriceVariable(
    wei: bigint,
    maxDecimals: number = 6,
    showUnit: boolean = false
  ): string {
    const ethValue = ethers.formatEther(wei);
    const num = parseFloat(ethValue);

    // Remove trailing zeros
    let formatted = num.toFixed(maxDecimals);
    formatted = formatted.replace(/\.?0+$/, "");

    // If result is "0" but original was not zero, show minimal value
    if (formatted === "0" && num > 0) {
      formatted = `< 0.${"0".repeat(maxDecimals - 1)}1`;
    }

    return showUnit ? `${formatted} ETH` : formatted;
  }

  /**
   * Format large volume values with unit suffixes (K, M, B)
   *
   * @param wei - Value in wei (bigint)
   * @param showUnit - Whether to append " ETH" (default: true)
   * @returns Formatted volume string
   *
   * @example
   * ```typescript
   * CryptoFormatter.formatVolume(1500000000000000000000n); // "1.5K ETH"
   * CryptoFormatter.formatVolume(2500000000000000000000000n); // "2.5M ETH"
   * ```
   */
  static formatVolume(wei: bigint, showUnit: boolean = true): string {
    const ethValue = parseFloat(ethers.formatEther(wei));

    let formatted: string;
    if (ethValue >= 1_000_000_000) {
      formatted = `${(ethValue / 1_000_000_000).toFixed(2)}B`;
    } else if (ethValue >= 1_000_000) {
      formatted = `${(ethValue / 1_000_000).toFixed(2)}M`;
    } else if (ethValue >= 1_000) {
      formatted = `${(ethValue / 1_000).toFixed(2)}K`;
    } else if (ethValue >= 1) {
      formatted = ethValue.toFixed(2);
    } else if (ethValue > 0) {
      formatted = ethValue.toFixed(4);
    } else {
      formatted = "0";
    }

    return showUnit ? `${formatted} ETH` : formatted;
  }

  /**
   * Format basis points to percentage string
   *
   * @param basisPoints - Value in basis points (100 = 1%)
   * @param decimals - Number of decimal places (default: 2)
   * @param showSymbol - Whether to append "%" (default: true)
   * @returns Formatted percentage string
   *
   * @example
   * ```typescript
   * CryptoFormatter.formatFee(250); // "2.50%"
   * CryptoFormatter.formatFee(1000); // "10.00%"
   * CryptoFormatter.formatFee(50, 1); // "0.5%"
   * ```
   */
  static formatFee(
    basisPoints: number | bigint,
    decimals: number = 2,
    showSymbol: boolean = true
  ): string {
    const bp = typeof basisPoints === "bigint" ? Number(basisPoints) : basisPoints;
    const percentage = (bp / CONTRACT_CONSTANTS.BASIS_POINTS) * 100;
    const formatted = percentage.toFixed(decimals);
    return showSymbol ? `${formatted}%` : formatted;
  }

  /**
   * Format royalty basis points to percentage string
   * Alias for formatFee with royalty-specific defaults
   *
   * @param basisPoints - Royalty in basis points
   * @param decimals - Number of decimal places (default: 2)
   * @param showSymbol - Whether to append "%" (default: true)
   * @returns Formatted royalty percentage string
   *
   * @example
   * ```typescript
   * CryptoFormatter.formatRoyalty(500); // "5.00%"
   * CryptoFormatter.formatRoyalty(250); // "2.50%"
   * ```
   */
  static formatRoyalty(
    basisPoints: number | bigint,
    decimals: number = 2,
    showSymbol: boolean = true
  ): string {
    return this.formatFee(basisPoints, decimals, showSymbol);
  }

  /**
   * Parse ETH string to wei
   *
   * @param ethValue - ETH value as string (e.g., "1.5")
   * @returns Value in wei (bigint)
   * @throws Error if value is invalid
   *
   * @example
   * ```typescript
   * CryptoFormatter.parsePrice("1.5"); // 1500000000000000000n
   * CryptoFormatter.parsePrice("0.001"); // 1000000000000000n
   * ```
   */
  static parsePrice(ethValue: string): bigint {
    try {
      return ethers.parseEther(ethValue);
    } catch (error) {
      throw new Error(`Invalid ETH value: ${ethValue}`);
    }
  }

  /**
   * Parse percentage string to basis points
   *
   * @param percentage - Percentage as string or number (e.g., "2.5" or 2.5)
   * @returns Basis points (number)
   *
   * @example
   * ```typescript
   * CryptoFormatter.parseFee("2.5"); // 250
   * CryptoFormatter.parseFee(10); // 1000
   * ```
   */
  static parseFee(percentage: string | number): number {
    const pct = typeof percentage === "string" ? parseFloat(percentage) : percentage;
    if (isNaN(pct)) {
      throw new Error(`Invalid percentage: ${percentage}`);
    }
    return Math.round((pct / 100) * CONTRACT_CONSTANTS.BASIS_POINTS);
  }

  /**
   * Format token amount with custom decimals
   *
   * @param amount - Token amount in smallest unit
   * @param decimals - Token decimals (default: 18)
   * @param showDecimals - Number of decimal places to show (default: 4)
   * @returns Formatted token amount
   *
   * @example
   * ```typescript
   * CryptoFormatter.formatTokenAmount(1000000n, 6); // "1.0000" (USDC)
   * CryptoFormatter.formatTokenAmount(1000000000000000000n, 18); // "1.0000" (ETH-like)
   * ```
   */
  static formatTokenAmount(
    amount: bigint,
    decimals: number = 18,
    showDecimals: number = 4
  ): string {
    const formatted = ethers.formatUnits(amount, decimals);
    return parseFloat(formatted).toFixed(showDecimals);
  }

  /**
   * Parse token amount with custom decimals
   *
   * @param amount - Token amount as string
   * @param decimals - Token decimals (default: 18)
   * @returns Amount in smallest unit (bigint)
   *
   * @example
   * ```typescript
   * CryptoFormatter.parseTokenAmount("1.5", 6); // 1500000n (USDC)
   * CryptoFormatter.parseTokenAmount("1.5", 18); // 1500000000000000000n
   * ```
   */
  static parseTokenAmount(amount: string, decimals: number = 18): bigint {
    try {
      return ethers.parseUnits(amount, decimals);
    } catch (error) {
      throw new Error(`Invalid token amount: ${amount}`);
    }
  }

  /**
   * Format timestamp to human-readable date string
   *
   * @param timestamp - Unix timestamp (seconds or bigint)
   * @param includeTime - Whether to include time (default: true)
   * @returns Formatted date string
   *
   * @example
   * ```typescript
   * CryptoFormatter.formatTimestamp(1700000000); // "Nov 14, 2023, 10:13 PM"
   * CryptoFormatter.formatTimestamp(1700000000n, false); // "Nov 14, 2023"
   * ```
   */
  static formatTimestamp(
    timestamp: number | bigint,
    includeTime: boolean = true
  ): string {
    const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
    const date = new Date(ts * 1000);

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(includeTime && {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    return date.toLocaleDateString("en-US", options);
  }

  /**
   * Format duration in seconds to human-readable string
   *
   * @param seconds - Duration in seconds
   * @returns Formatted duration string
   *
   * @example
   * ```typescript
   * CryptoFormatter.formatDuration(3600); // "1h"
   * CryptoFormatter.formatDuration(86400); // "1d"
   * CryptoFormatter.formatDuration(90); // "1m 30s"
   * ```
   */
  static formatDuration(seconds: number | bigint): string {
    const s = typeof seconds === "bigint" ? Number(seconds) : seconds;

    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const secs = s % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(" ");
  }

  /**
   * Format address to shortened format (0x1234...5678)
   *
   * @param address - Ethereum address
   * @param prefixLength - Length of prefix (default: 6)
   * @param suffixLength - Length of suffix (default: 4)
   * @returns Shortened address
   *
   * @example
   * ```typescript
   * CryptoFormatter.formatAddress("0x1234567890abcdef1234567890abcdef12345678");
   * // "0x1234...5678"
   * ```
   */
  static formatAddress(
    address: string,
    prefixLength: number = 6,
    suffixLength: number = 4
  ): string {
    if (!address || address.length < prefixLength + suffixLength) {
      return address;
    }

    return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
  }
}
