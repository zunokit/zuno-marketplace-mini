/**
 * Emergency Manager Service
 * Handles emergency security operations including pause, blacklist, and withdrawals
 * Based on EmergencyManager.sol
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { marketplaceHubService } from "./MarketplaceHubService";
import { EmergencyManager_ABI } from "@/lib/contracts/abis";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BlacklistInfo {
  address: string;
  isBlacklisted: boolean;
  reason: string;
  timestamp: bigint;
}

export interface EmergencyStatus {
  isPaused: boolean;
  pausedAt: bigint;
  pauseReason: string;
  cooldownRemaining: bigint;
}

export interface NFTResetParams {
  nftContract: string;
  tokenId: bigint;
  owner: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class EmergencyManagerService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private emergencyManagerAddress: string | null = null;

  /**
   * Initialize emergency manager service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Get emergency manager address from hub
    // TODO: Add getEmergencyManager() to Hub

    logger.success("EmergencyManagerService initialized", null, {
      component: "EmergencyManagerService",
      action: "initialize",
    });
  }

  /**
   * Get emergency manager contract instance
   */
  private getEmergencyManagerContract(
    readOnly: boolean = false
  ): ethers.Contract {
    if (readOnly && this.provider) {
      if (!this.emergencyManagerAddress) {
        throw new Error("EmergencyManager address not configured");
      }
      return new ethers.Contract(
        this.emergencyManagerAddress,
        EmergencyManager_ABI,
        this.provider
      );
    }

    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    if (!this.emergencyManagerAddress) {
      throw new Error("EmergencyManager address not configured");
    }

    return new ethers.Contract(
      this.emergencyManagerAddress,
      EmergencyManager_ABI,
      this.signer
    );
  }

  // ============================================================================
  // EMERGENCY PAUSE
  // ============================================================================

  /**
   * Emergency pause the entire marketplace
   * @param reason Reason for the emergency pause
   */
  async emergencyPause(
    reason: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getEmergencyManagerContract();

    const tx = await contract.emergencyPause(reason);
    await tx.wait();

    return tx;
  }

  /**
   * Unpause the marketplace after emergency
   */
  async emergencyUnpause(): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getEmergencyManagerContract();

    const tx = await contract.emergencyUnpause();
    await tx.wait();

    return tx;
  }

  /**
   * Get remaining pause cooldown time
   */
  async getPauseCooldownRemaining(): Promise<bigint> {
    const contract = this.getEmergencyManagerContract(true);
    return await contract.getPauseCooldownRemaining();
  }

  /**
   * Check if marketplace is paused
   */
  async isPaused(): Promise<boolean> {
    const contract = this.getEmergencyManagerContract(true);
    return await contract.paused();
  }

  /**
   * Get emergency status
   */
  async getEmergencyStatus(): Promise<EmergencyStatus> {
    const contract = this.getEmergencyManagerContract(true);

    const isPaused = await contract.paused();
    const cooldownRemaining = await contract.getPauseCooldownRemaining();

    return {
      isPaused,
      pausedAt: BigInt(0), // You may need to track this separately
      pauseReason: "", // You may need to track this separately
      cooldownRemaining,
    };
  }

  // ============================================================================
  // BLACKLIST MANAGEMENT
  // ============================================================================

  /**
   * Set contract blacklist status
   * @param contractAddr Contract address to blacklist/whitelist
   * @param isBlacklisted True to blacklist, false to whitelist
   * @param reason Reason for the action
   */
  async setContractBlacklist(
    contractAddr: string,
    isBlacklisted: boolean,
    reason: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getEmergencyManagerContract();

    const tx = await contract.setContractBlacklist(
      contractAddr,
      isBlacklisted,
      reason
    );
    await tx.wait();

    return tx;
  }

  /**
   * Set user blacklist status
   * @param userAddr User address to blacklist/whitelist
   * @param isBlacklisted True to blacklist, false to whitelist
   * @param reason Reason for the action
   */
  async setUserBlacklist(
    userAddr: string,
    isBlacklisted: boolean,
    reason: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getEmergencyManagerContract();

    const tx = await contract.setUserBlacklist(userAddr, isBlacklisted, reason);
    await tx.wait();

    return tx;
  }

  /**
   * Batch set contract blacklist status
   * @param contractAddrs Array of contract addresses
   * @param isBlacklisted True to blacklist, false to whitelist
   * @param reason Reason for the action
   */
  async batchSetContractBlacklist(
    contractAddrs: string[],
    isBlacklisted: boolean,
    reason: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getEmergencyManagerContract();

    const tx = await contract.batchSetContractBlacklist(
      contractAddrs,
      isBlacklisted,
      reason
    );
    await tx.wait();

    return tx;
  }

  /**
   * Check if contract is blacklisted
   */
  async isContractBlacklisted(contractAddr: string): Promise<boolean> {
    const contract = this.getEmergencyManagerContract(true);
    return await contract.isContractBlacklisted(contractAddr);
  }

  /**
   * Check if user is blacklisted
   */
  async isUserBlacklisted(userAddr: string): Promise<boolean> {
    const contract = this.getEmergencyManagerContract(true);
    return await contract.isUserBlacklisted(userAddr);
  }

  // ============================================================================
  // NFT RECOVERY
  // ============================================================================

  /**
   * Emergency bulk reset NFT status
   * Used to recover stuck NFTs in emergency situations
   */
  async emergencyBulkResetNFTStatus(
    nftContracts: string[],
    tokenIds: bigint[],
    owners: string[],
    reason: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getEmergencyManagerContract();

    const tx = await contract.emergencyBulkResetNFTStatus(
      nftContracts,
      tokenIds,
      owners,
      reason
    );
    await tx.wait();

    return tx;
  }

  /**
   * Emergency reset collection
   * Reset multiple NFTs from the same collection
   */
  async emergencyResetCollection(
    nftContract: string,
    tokenIds: bigint[],
    owners: string[]
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getEmergencyManagerContract();

    const tx = await contract.emergencyResetCollection(
      nftContract,
      tokenIds,
      owners
    );
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // EMERGENCY WITHDRAWALS
  // ============================================================================

  /**
   * Emergency withdraw funds
   * @param recipient Address to receive the funds
   * @param amount Amount to withdraw (in wei)
   * @param reason Reason for the withdrawal
   */
  async emergencyWithdraw(
    recipient: string,
    amount: bigint,
    reason: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getEmergencyManagerContract();

    const tx = await contract.emergencyWithdraw(recipient, amount, reason);
    await tx.wait();

    return tx;
  }

  /**
   * Get contract balance
   */
  async getContractBalance(): Promise<bigint> {
    if (!this.provider || !this.emergencyManagerAddress) {
      throw new Error("Provider or address not available");
    }

    return await this.provider.getBalance(this.emergencyManagerAddress);
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Format emergency reason
   */
  static formatReason(reason: string, maxLength: number = 100): string {
    if (reason.length <= maxLength) return reason;
    return reason.substring(0, maxLength - 3) + "...";
  }

  /**
   * Format cooldown time
   */
  static formatCooldown(seconds: bigint): string {
    const secs = Number(seconds);
    if (secs === 0) return "Ready";

    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = secs % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

    return parts.join(" ");
  }

  /**
   * Check if action is available (not in cooldown)
   */
  async canPause(): Promise<boolean> {
    const cooldown = await this.getPauseCooldownRemaining();
    return cooldown === BigInt(0);
  }

  /**
   * Validate addresses
   */
  static validateAddresses(addresses: string[]): boolean {
    return addresses.every((addr) => ethers.isAddress(addr));
  }

  /**
   * Validate NFT reset params
   */
  static validateNFTResetParams(params: NFTResetParams[]): boolean {
    return params.every(
      (p) =>
        ethers.isAddress(p.nftContract) &&
        ethers.isAddress(p.owner) &&
        p.tokenId >= BigInt(0)
    );
  }

  /**
   * Check if current user has emergency role
   */
  async hasEmergencyRole(): Promise<boolean> {
    if (!this.signer) return false;

    try {
      const contract = this.getEmergencyManagerContract(true);
      const owner = await contract.owner();
      const userAddress = await this.signer.getAddress();

      return owner.toLowerCase() === userAddress.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Get emergency events from logs
   */
  async getEmergencyEvents(
    fromBlock: number | "latest" = "latest",
    toBlock: number | "latest" = "latest"
  ): Promise<ethers.Log[]> {
    if (!this.provider || !this.emergencyManagerAddress) {
      throw new Error("Provider or address not available");
    }

    const contract = this.getEmergencyManagerContract(true);

    const filter = {
      address: this.emergencyManagerAddress,
      fromBlock,
      toBlock,
    };

    return await this.provider.getLogs(filter);
  }

  /**
   * Parse emergency event
   */
  parseEmergencyEvent(log: ethers.Log): ethers.LogDescription | null {
    const contract = this.getEmergencyManagerContract(true);
    try {
      return contract.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
    } catch {
      return null;
    }
  }

  /**
   * Monitor for emergency events
   */
  async monitorEmergencyEvents(
    callback: (event: ethers.LogDescription) => void
  ): Promise<void> {
    if (!this.provider || !this.emergencyManagerAddress) {
      throw new Error("Provider or address not available");
    }

    const contract = this.getEmergencyManagerContract(true);

    // Listen for EmergencyPaused event
    contract.on("EmergencyPaused", (...args) => {
      const event = args[args.length - 1];
      callback(event);
    });

    // Listen for EmergencyUnpaused event
    contract.on("EmergencyUnpaused", (...args) => {
      const event = args[args.length - 1];
      callback(event);
    });

    // Listen for ContractBlacklisted event
    contract.on("ContractBlacklisted", (...args) => {
      const event = args[args.length - 1];
      callback(event);
    });

    // Listen for UserBlacklisted event
    contract.on("UserBlacklisted", (...args) => {
      const event = args[args.length - 1];
      callback(event);
    });

    // Listen for EmergencyWithdraw event
    contract.on("EmergencyWithdraw", (...args) => {
      const event = args[args.length - 1];
      callback(event);
    });
  }

  /**
   * Stop monitoring events
   */
  async stopMonitoring(): Promise<void> {
    const contract = this.getEmergencyManagerContract(true);
    contract.removeAllListeners();
  }
}

// Export singleton instance
export const emergencyManagerService = new EmergencyManagerService();
