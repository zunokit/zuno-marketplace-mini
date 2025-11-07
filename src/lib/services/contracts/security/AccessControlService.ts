/**
 * Access Control Service
 * Handles role-based access control and permissions management
 * Based on MarketplaceAccessControl.sol
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";
import { userHubService } from "../core/UserHubService";
import { getContractABI } from "@/lib/contracts/abi-manager";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum MarketplaceRole {
  ADMIN = "ADMIN_ROLE",
  MODERATOR = "MODERATOR_ROLE",
  OPERATOR = "OPERATOR_ROLE",
  VERIFIER = "VERIFIER_ROLE",
  EMERGENCY = "EMERGENCY_ROLE",
  PAUSER = "PAUSER_ROLE",
}

export interface RolePermissions {
  canManageListings: boolean;
  canManageCollections: boolean;
  canManageFees: boolean;
  canManageUsers: boolean;
  canPauseSystem: boolean;
  canModifyRoles: boolean;
  canAccessEmergency: boolean;
  canVerifyCollections: boolean;
}

export interface RoleAssignment {
  role: string;
  account: string;
  assignedBy: string;
  assignedAt: bigint;
  reason: string;
  isActive: boolean;
}

export interface RoleMemberInfo {
  current: bigint; // Current number of members
  maximum: bigint; // Maximum allowed members
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class AccessControlService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private accessControlAddress: string | null = null;

  // Role hashes (keccak256 of role names)
  public readonly ROLES = {
    DEFAULT_ADMIN: ethers.keccak256(ethers.toUtf8Bytes("DEFAULT_ADMIN_ROLE")),
    ADMIN: ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
    MODERATOR: ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")),
    OPERATOR: ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE")),
    VERIFIER: ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE")),
    EMERGENCY: ethers.keccak256(ethers.toUtf8Bytes("EMERGENCY_ROLE")),
    PAUSER: ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE")),
  };

  /**
   * Initialize access control service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Get access control address from hub
    // TODO: Add getAccessControl() to Hub

    logger.success("AccessControlService initialized", null, {
      component: "AccessControlService",
      action: "initialize",
    });
  }

  /**
   * Get access control contract instance
   */
  private async getAccessControlContract(readOnly: boolean = false): Promise<ethers.Contract> {
    const abi = await getContractABI("MarketplaceAccessControl");

    if (readOnly && this.provider) {
      if (!this.accessControlAddress) {
        throw new Error("AccessControl address not configured");
      }
      return new ethers.Contract(
        this.accessControlAddress,
        abi,
        this.provider
      );
    }

    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    if (!this.accessControlAddress) {
      throw new Error("AccessControl address not configured");
    }

    return new ethers.Contract(
      this.accessControlAddress,
      abi,
      this.signer
    );
  }

  // ============================================================================
  // ROLE CHECKS
  // ============================================================================

  /**
   * Check if an account has a specific role
   */
  async hasRole(role: string, account: string): Promise<boolean> {
    const contract = await this.getAccessControlContract(true);
    return await contract.hasRole(role, account);
  }

  /**
   * Check if account has a specific permission
   */
  async hasPermission(account: string, permission: string): Promise<boolean> {
    const contract = await this.getAccessControlContract(true);
    return await contract.hasPermission(account, permission);
  }

  /**
   * Get all active roles for an account
   */
  async getActiveRoles(account: string): Promise<string[]> {
    const contract = await this.getAccessControlContract(true);
    return await contract.getActiveRoles(account);
  }

  /**
   * Get role admin (who can grant/revoke the role)
   */
  async getRoleAdmin(role: string): Promise<string> {
    const contract = await this.getAccessControlContract(true);
    return await contract.getRoleAdmin(role);
  }

  /**
   * Get number of accounts with a role
   */
  async getRoleMemberCount(role: string): Promise<bigint> {
    const contract = await this.getAccessControlContract(true);
    return await contract.getRoleMemberCount(role);
  }

  /**
   * Get role member info (current and max members)
   */
  async getRoleMemberInfo(role: string): Promise<RoleMemberInfo> {
    const contract = await this.getAccessControlContract(true);
    const [current, maximum] = await contract.getRoleMemberInfo(role);

    return { current, maximum };
  }

  /**
   * Get account at specific index in role
   */
  async getRoleMember(role: string, index: bigint): Promise<string> {
    const contract = await this.getAccessControlContract(true);
    return await contract.getRoleMember(role, index);
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  /**
   * Grant a role to an account with reason
   */
  async grantRole(
    role: string,
    account: string,
    reason: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getAccessControlContract();

    const tx = await contract.grantRoleWithReason(role, account, reason);
    await tx.wait();

    return tx;
  }

  /**
   * Revoke a role from an account with reason
   */
  async revokeRole(
    role: string,
    account: string,
    reason: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getAccessControlContract();

    const tx = await contract.revokeRoleWithReason(role, account, reason);
    await tx.wait();

    return tx;
  }

  /**
   * Renounce own role
   */
  async renounceRole(
    role: string,
    account: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getAccessControlContract();

    const tx = await contract.renounceRole(role, account);
    await tx.wait();

    return tx;
  }

  /**
   * Batch grant roles to multiple accounts
   */
  async batchGrantRoles(
    roles: string[],
    accounts: string[],
    reasons: string[]
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getAccessControlContract();

    const tx = await contract.batchGrantRoles(roles, accounts, reasons);
    await tx.wait();

    return tx;
  }

  /**
   * Batch revoke roles from multiple accounts
   */
  async batchRevokeRoles(
    roles: string[],
    accounts: string[],
    reasons: string[]
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getAccessControlContract();

    const tx = await contract.batchRevokeRoles(roles, accounts, reasons);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // ROLE CONFIGURATION
  // ============================================================================

  /**
   * Set role active/inactive status
   */
  async setRoleActive(
    role: string,
    isActive: boolean
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getAccessControlContract();

    const tx = await contract.setRoleActive(role, isActive);
    await tx.wait();

    return tx;
  }

  /**
   * Set maximum members for a role
   */
  async setRoleMemberLimit(
    role: string,
    maxMembers: bigint
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getAccessControlContract();

    const tx = await contract.setRoleMemberLimit(role, maxMembers);
    await tx.wait();

    return tx;
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(
    role: string,
    permissions: RolePermissions
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getAccessControlContract();

    const tx = await contract.updateRolePermissions(role, permissions);
    await tx.wait();

    return tx;
  }

  // ============================================================================
  // ROLE HISTORY
  // ============================================================================

  /**
   * Get role assignment history for an account
   */
  async getRoleHistory(
    role: string,
    account: string
  ): Promise<RoleAssignment[]> {
    const contract = await this.getAccessControlContract(true);
    const history = await contract.getRoleHistory(role, account);

    return history.map((h: any) => ({
      role: h.role,
      account: h.account,
      assignedBy: h.assignedBy,
      assignedAt: h.assignedAt,
      reason: h.reason,
      isActive: h.isActive,
    }));
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get role hash from role name
   */
  getRoleHash(roleName: MarketplaceRole | string): string {
    if (Object.values(MarketplaceRole).includes(roleName as MarketplaceRole)) {
      return (
        this.ROLES[roleName as keyof typeof this.ROLES] ||
        ethers.keccak256(ethers.toUtf8Bytes(roleName))
      );
    }
    return ethers.keccak256(ethers.toUtf8Bytes(roleName));
  }

  /**
   * Get user-friendly role name
   */
  static getRoleName(roleHash: string): string {
    const roleMap: Record<string, string> = {
      [ethers.keccak256(ethers.toUtf8Bytes("DEFAULT_ADMIN_ROLE"))]:
        "Super Admin",
      [ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"))]: "Admin",
      [ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE"))]: "Moderator",
      [ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"))]: "Operator",
      [ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"))]: "Verifier",
      [ethers.keccak256(ethers.toUtf8Bytes("EMERGENCY_ROLE"))]:
        "Emergency Manager",
      [ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"))]: "Pauser",
    };

    return roleMap[roleHash] || "Unknown Role";
  }

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    if (!this.signer) return false;
    const account = await this.signer.getAddress();
    return this.hasRole(this.ROLES.ADMIN, account);
  }

  /**
   * Check if current user is moderator
   */
  async isModerator(): Promise<boolean> {
    if (!this.signer) return false;
    const account = await this.signer.getAddress();
    return this.hasRole(this.ROLES.MODERATOR, account);
  }

  /**
   * Check if current user is operator
   */
  async isOperator(): Promise<boolean> {
    if (!this.signer) return false;
    const account = await this.signer.getAddress();
    return this.hasRole(this.ROLES.OPERATOR, account);
  }

  /**
   * Get all members of a role
   */
  async getAllRoleMembers(role: string): Promise<string[]> {
    const count = await this.getRoleMemberCount(role);
    const members: string[] = [];

    for (let i = 0; i < Number(count); i++) {
      const member = await this.getRoleMember(role, BigInt(i));
      members.push(member);
    }

    return members;
  }

  /**
   * Get current user's roles
   */
  async getMyRoles(): Promise<string[]> {
    if (!this.signer) {
      throw new Error("Signer not available");
    }

    const account = await this.signer.getAddress();
    return this.getActiveRoles(account);
  }

  /**
   * Get current user's permissions
   */
  async getMyPermissions(): Promise<string[]> {
    if (!this.signer) {
      throw new Error("Signer not available");
    }

    const account = await this.signer.getAddress();
    const roles = await this.getActiveRoles(account);

    // Map roles to permissions (you may need to query contract for actual permissions)
    const permissions: string[] = [];

    for (const role of roles) {
      const rolePermissions = await this.getRolePermissions(role);
      permissions.push(...this.permissionsToArray(rolePermissions));
    }

    return [...new Set(permissions)]; // Remove duplicates
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(role: string): Promise<RolePermissions> {
    const contract = await this.getAccessControlContract(true);
    const perms = await contract.rolePermissions(role);

    return {
      canManageListings: perms.canManageListings,
      canManageCollections: perms.canManageCollections,
      canManageFees: perms.canManageFees,
      canManageUsers: perms.canManageUsers,
      canPauseSystem: perms.canPauseSystem,
      canModifyRoles: perms.canModifyRoles,
      canAccessEmergency: perms.canAccessEmergency,
      canVerifyCollections: perms.canVerifyCollections,
    };
  }

  /**
   * Convert permissions object to array of permission strings
   */
  private permissionsToArray(permissions: RolePermissions): string[] {
    const perms: string[] = [];

    if (permissions.canManageListings) perms.push("manage_listings");
    if (permissions.canManageCollections) perms.push("manage_collections");
    if (permissions.canManageFees) perms.push("manage_fees");
    if (permissions.canManageUsers) perms.push("manage_users");
    if (permissions.canPauseSystem) perms.push("pause_system");
    if (permissions.canModifyRoles) perms.push("modify_roles");
    if (permissions.canAccessEmergency) perms.push("access_emergency");
    if (permissions.canVerifyCollections) perms.push("verify_collections");

    return perms;
  }
}

// Export singleton instance
export const accessControlService = new AccessControlService();
