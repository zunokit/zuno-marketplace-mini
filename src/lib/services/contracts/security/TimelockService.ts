/**
 * Timelock Service
 * Handles time-locked admin operations for security
 * Based on MarketplaceTimelock.sol
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { userHubService } from "../core/UserHubService";
import { getContractABI } from "@/lib/contracts/abi-manager";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum ActionStatus {
  PENDING = 0,
  EXECUTED = 1,
  CANCELLED = 2,
  EXPIRED = 3,
}

export interface ActionData {
  target: string; // Target contract address
  data: string; // Encoded function calldata
  value: bigint; // ETH value to send
  scheduledAt: bigint; // When action was scheduled
  executionTime: bigint; // When action can be executed
  executed: boolean; // Whether action was executed
  cancelled: boolean; // Whether action was cancelled
  proposer: string; // Who proposed the action
  description: string; // Human-readable description
}

export interface PendingAction {
  id: string;
  action: ActionData;
  timeRemaining: bigint;
  isReady: boolean;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class TimelockService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private timelockAddress: string | null = null;

  // Default timelock duration (48 hours)
  public readonly DEFAULT_TIMELOCK_DURATION = 172800;

  /**
   * Initialize timelock service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Get timelock address from hub
    // TODO: Add getTimelock() to Hub

    logger.success("TimelockService initialized", null, {
      component: "TimelockService",
      action: "initialize",
    });
  }

  /**
   * Get timelock contract instance
   */
  private async getTimelockContract(readOnly: boolean = false): Promise<ethers.Contract> {
    const abi = await getContractABI("MarketplaceTimelock");

    if (readOnly && this.provider) {
      if (!this.timelockAddress) {
        throw new Error("MarketplaceTimelock address not configured");
      }
      return new ethers.Contract(
        this.timelockAddress,
        abi,
        this.provider
      );
    }

    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    if (!this.timelockAddress) {
      throw new Error("MarketplaceTimelock address not configured");
    }

    return new ethers.Contract(
      this.timelockAddress,
      abi,
      this.signer
    );
  }

  // ============================================================================
  // ACTION SCHEDULING
  // ============================================================================

  /**
   * Schedule a time-locked action
   * @param target Target contract address
   * @param data Encoded function calldata
   * @param value ETH value to send (default 0)
   * @param description Human-readable description
   */
  async scheduleAction(
    target: string,
    data: string,
    value: bigint = BigInt(0),
    description: string = ""
  ): Promise<{
    tx: ethers.ContractTransactionResponse;
    actionId: string;
  }> {
    const contract = await this.getTimelockContract();

    const tx = await contract.scheduleAction(target, data, value, description);
    const receipt = await tx.wait();

    // Get actionId from event
    const event = receipt?.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === "ActionScheduled");

    const actionId = event?.args?.actionId || "";

    return { tx, actionId };
  }

  /**
   * Execute a time-locked action
   * @param actionId Action identifier
   */
  async executeAction(
    actionId: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getTimelockContract();

    const tx = await contract.executeAction(actionId);
    await tx.wait();

    return tx;
  }

  /**
   * Cancel a pending action
   * @param actionId Action identifier
   */
  async cancelAction(
    actionId: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getTimelockContract();

    const tx = await contract.cancelAction(actionId);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // ACTION QUERIES
  // ============================================================================

  /**
   * Get action data
   */
  async getActionData(actionId: string): Promise<ActionData> {
    const contract = await this.getTimelockContract(true);
    const action = await contract.getActionData(actionId);

    return {
      target: action.target,
      data: action.data,
      value: action.value,
      scheduledAt: action.scheduledAt,
      executionTime: action.executionTime,
      executed: action.executed,
      cancelled: action.cancelled,
      proposer: action.proposer,
      description: action.description,
    };
  }

  /**
   * Get time remaining until action can be executed
   */
  async getTimeRemaining(actionId: string): Promise<bigint> {
    const contract = await this.getTimelockContract(true);
    return await contract.getTimeRemaining(actionId);
  }

  /**
   * Check if action is ready to execute
   */
  async isActionReady(actionId: string): Promise<boolean> {
    const contract = await this.getTimelockContract(true);
    return await contract.isActionReady(actionId);
  }

  /**
   * Get current timelock duration
   */
  async getTimelockDuration(): Promise<bigint> {
    const contract = await this.getTimelockContract(true);
    return await contract.timelockDuration();
  }

  /**
   * Get action status
   */
  async getActionStatus(actionId: string): Promise<ActionStatus> {
    const action = await this.getActionData(actionId);

    if (action.cancelled) return ActionStatus.CANCELLED;
    if (action.executed) return ActionStatus.EXECUTED;

    const now = BigInt(Math.floor(Date.now() / 1000));
    const timeRemaining = await this.getTimeRemaining(actionId);

    if (timeRemaining === BigInt(0) && action.executionTime > now) {
      return ActionStatus.EXPIRED;
    }

    return ActionStatus.PENDING;
  }

  // ============================================================================
  // ADMIN FUNCTIONS
  // ============================================================================

  /**
   * Update timelock duration (requires timelock)
   */
  async updateTimelockDuration(newDuration: bigint): Promise<{
    tx: ethers.ContractTransactionResponse;
    actionId: string;
  }> {
    const contract = await this.getTimelockContract();

    // Encode the function call
    const iface = contract.interface;
    const data = iface.encodeFunctionData("updateTimelockDuration", [
      newDuration,
    ]);

    // Schedule the action through timelock
    return this.scheduleAction(
      await contract.getAddress(),
      data,
      BigInt(0),
      `Update timelock duration to ${newDuration} seconds`
    );
  }

  // ============================================================================
  // HELPER FUNCTIONS FOR COMMON OPERATIONS
  // ============================================================================

  /**
   * Schedule fee update (example)
   */
  async scheduleFeeUpdate(
    feeManagerAddress: string,
    newFee: bigint
  ): Promise<{ tx: ethers.ContractTransactionResponse; actionId: string }> {
    // Encode setFee function call
    const iface = new ethers.Interface(["function setFee(uint256 newFee)"]);
    const data = iface.encodeFunctionData("setFee", [newFee]);

    return this.scheduleAction(
      feeManagerAddress,
      data,
      BigInt(0),
      `Update fee to ${ethers.formatEther(newFee)} ETH`
    );
  }

  /**
   * Schedule role grant (example)
   */
  async scheduleRoleGrant(
    accessControlAddress: string,
    role: string,
    account: string
  ): Promise<{ tx: ethers.ContractTransactionResponse; actionId: string }> {
    const iface = new ethers.Interface([
      "function grantRole(bytes32 role, address account)",
    ]);
    const data = iface.encodeFunctionData("grantRole", [role, account]);

    return this.scheduleAction(
      accessControlAddress,
      data,
      BigInt(0),
      `Grant role ${role} to ${account}`
    );
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Generate action ID
   */
  static generateActionId(
    target: string,
    data: string,
    value: bigint,
    timestamp: bigint
  ): string {
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "bytes", "uint256", "uint256"],
        [target, data, value, timestamp]
      )
    );
  }

  /**
   * Format time remaining
   */
  static formatTimeRemaining(seconds: bigint): string {
    const secs = Number(seconds);
    if (secs === 0) return "Ready";
    if (secs < 0) return "Expired";

    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Get action status name
   */
  static getStatusName(status: ActionStatus): string {
    const names: Record<ActionStatus, string> = {
      [ActionStatus.PENDING]: "Pending",
      [ActionStatus.EXECUTED]: "Executed",
      [ActionStatus.CANCELLED]: "Cancelled",
      [ActionStatus.EXPIRED]: "Expired",
    };

    return names[status] || "Unknown";
  }

  /**
   * Decode function call
   */
  static decodeFunctionCall(
    data: string,
    abi: any[]
  ): { name: string; args: any[] } | null {
    try {
      const iface = new ethers.Interface(abi);
      const decoded = iface.parseTransaction({ data });

      return decoded
        ? {
            name: decoded.name,
            args: Array.from(decoded.args),
          }
        : null;
    } catch {
      return null;
    }
  }

  /**
   * Format action description
   */
  static formatActionDescription(action: ActionData): string {
    if (action.description) return action.description;

    return `Action on ${action.target} with ${ethers.formatEther(
      action.value
    )} ETH`;
  }

  /**
   * Get execution time as Date
   */
  static getExecutionDate(executionTime: bigint): Date {
    return new Date(Number(executionTime) * 1000);
  }

  /**
   * Check if action is expired
   */
  static isExpired(
    action: ActionData,
    expiryWindow: bigint = BigInt(604800)
  ): boolean {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now > action.executionTime + expiryWindow;
  }

  /**
   * Get all pending actions (via events)
   */
  async getPendingActions(): Promise<PendingAction[]> {
    if (!this.provider || !this.timelockAddress) {
      throw new Error("Provider or address not available");
    }

    const contract = await this.getTimelockContract(true);

    // Get ActionScheduled events
    const filter = contract.filters.ActionScheduled();
    const events = await contract.queryFilter(filter);

    const pendingActions: PendingAction[] = [];

    // Type guard for ethers v6 EventLog vs Log
    const isEventLog = (
      log: ethers.Log | ethers.EventLog
    ): log is ethers.EventLog => {
      return (log as ethers.EventLog).args !== undefined;
    };

    for (const event of events) {
      if (!isEventLog(event)) continue;
      const actionId = (event.args as any)?.actionId as string | undefined;
      if (!actionId) continue;

      try {
        const action = await this.getActionData(actionId);
        const timeRemaining = await this.getTimeRemaining(actionId);
        const isReady = await this.isActionReady(actionId);

        // Only include if not executed or cancelled
        if (!action.executed && !action.cancelled) {
          pendingActions.push({
            id: actionId,
            action,
            timeRemaining,
            isReady,
          });
        }
      } catch {
        // Skip if action doesn't exist or errored
        continue;
      }
    }

    return pendingActions;
  }

  /**
   * Monitor for timelock events
   */
  async monitorTimelockEvents(
    callback: (eventName: string, event: ethers.LogDescription) => void
  ): Promise<void> {
    const contract = await this.getTimelockContract(true);

    contract.on("ActionScheduled", (...args) => {
      const event = args[args.length - 1];
      callback("ActionScheduled", event);
    });

    contract.on("ActionExecuted", (...args) => {
      const event = args[args.length - 1];
      callback("ActionExecuted", event);
    });

    contract.on("ActionCancelled", (...args) => {
      const event = args[args.length - 1];
      callback("ActionCancelled", event);
    });
  }

  /**
   * Stop monitoring events
   */
  async stopMonitoring(): Promise<void> {
    const contract = await this.getTimelockContract(true);
    contract.removeAllListeners();
  }
}

// Export singleton instance
export const timelockService = new TimelockService();
