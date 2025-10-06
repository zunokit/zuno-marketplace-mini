"use client";

/**
 * Access Control Admin Page
 * Manage roles and permissions for marketplace access control
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/lib/store/hooks";
import { isMockDataEnabled } from "@/lib/services/mock/mockDataService";
import {
  accessControlService,
  AccessControlService,
  RolePermissions,
} from "@/lib/services/contracts/AccessControlService";
import { Shield, UserPlus, UserMinus, Users, Key } from "lucide-react";

interface RoleMember {
  address: string;
  role: string;
  roleName: string;
}

export default function AccessControlPage() {
  const { toast } = useToast();
  const { account } = useAppSelector((state) => state.wallet);
  const [useMockData] = useState(isMockDataEnabled());

  const [roleMembers, setRoleMembers] = useState<RoleMember[]>([]);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: "ADMIN_ROLE",
      name: "Admin",
      description: "Full administrative access",
    },
    {
      id: "MODERATOR_ROLE",
      name: "Moderator",
      description: "Content moderation",
    },
    { id: "OPERATOR_ROLE", name: "Operator", description: "Operational tasks" },
    {
      id: "VERIFIER_ROLE",
      name: "Verifier",
      description: "Collection verification",
    },
    {
      id: "EMERGENCY_ROLE",
      name: "Emergency",
      description: "Emergency controls",
    },
    { id: "PAUSER_ROLE", name: "Pauser", description: "System pause controls" },
  ];

  /**
   * Load role members
   */
  useEffect(() => {
    if (!useMockData && account) {
      loadRoleMembers();
    }
  }, [account, useMockData]);

  const loadRoleMembers = async () => {
    try {
      const members: RoleMember[] = [];

      for (const role of roles) {
        const roleHash = accessControlService.getRoleHash(role.id);
        const count = await accessControlService.getRoleMemberCount(roleHash);

        for (let i = 0; i < Number(count); i++) {
          const memberAddress = await accessControlService.getRoleMember(
            roleHash,
            BigInt(i)
          );
          members.push({
            address: memberAddress,
            role: roleHash,
            roleName: role.name,
          });
        }
      }

      setRoleMembers(members);
    } catch (error) {
      console.error("Failed to load role members:", error);
    }
  };

  /**
   * Handle grant role
   */
  const handleGrantRole = async () => {
    if (!selectedRole || !selectedAccount || !reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (useMockData) {
        toast({
          title: "Role Granted",
          description: `Successfully granted ${selectedRole} role to ${selectedAccount}`,
        });
        setGrantDialogOpen(false);
      } else {
        const roleHash = accessControlService.getRoleHash(selectedRole);
        await accessControlService.grantRole(roleHash, selectedAccount, reason);

        toast({
          title: "Role Granted",
          description: `Successfully granted ${selectedRole} role`,
        });

        setGrantDialogOpen(false);
        setSelectedRole("");
        setSelectedAccount("");
        setReason("");
        await loadRoleMembers();
      }
    } catch (error) {
      toast({
        title: "Grant Failed",
        description:
          error instanceof Error ? error.message : "Failed to grant role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle revoke role
   */
  const handleRevokeRole = async () => {
    if (!selectedRole || !selectedAccount || !reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(false);

    try {
      if (useMockData) {
        toast({
          title: "Role Revoked",
          description: `Successfully revoked ${selectedRole} role from ${selectedAccount}`,
        });
        setRevokeDialogOpen(false);
      } else {
        const roleHash = accessControlService.getRoleHash(selectedRole);
        await accessControlService.revokeRole(
          roleHash,
          selectedAccount,
          reason
        );

        toast({
          title: "Role Revoked",
          description: `Successfully revoked ${selectedRole} role`,
        });

        setRevokeDialogOpen(false);
        setSelectedRole("");
        setSelectedAccount("");
        setReason("");
        await loadRoleMembers();
      }
    } catch (error) {
      toast({
        title: "Revoke Failed",
        description:
          error instanceof Error ? error.message : "Failed to revoke role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">🛡️ Access Control</h2>
        <p className="text-muted-foreground">
          Manage roles and permissions for marketplace access
        </p>
      </div>

      {useMockData && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ Mock Data Mode - Real contract integration disabled
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <Button onClick={() => setGrantDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Grant Role
        </Button>
        <Button variant="outline" onClick={() => setRevokeDialogOpen(true)}>
          <UserMinus className="h-4 w-4 mr-2" />
          Revoke Role
        </Button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {role.name}
              </CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Members</span>
                <Badge variant="secondary">
                  {roleMembers.filter((m) => m.roleName === role.name).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Role Members
          </CardTitle>
          <CardDescription>Current role assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {roleMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No role members found
            </p>
          ) : (
            <div className="space-y-2">
              {roleMembers.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">
                      {member.address.slice(0, 6)}...{member.address.slice(-4)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.roleName}
                    </p>
                  </div>
                  <Badge>{member.roleName}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant Role Dialog */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Role</DialogTitle>
            <DialogDescription>
              Grant a role to a marketplace participant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="grant-role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="grant-account">Account Address</Label>
              <Input
                id="grant-account"
                placeholder="0x..."
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="grant-reason">Reason</Label>
              <Textarea
                id="grant-reason"
                placeholder="Reason for granting this role..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleGrantRole} disabled={loading}>
              {loading ? "Granting..." : "Grant Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Role Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Role</DialogTitle>
            <DialogDescription>
              Revoke a role from a marketplace participant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="revoke-role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="revoke-account">Account Address</Label>
              <Input
                id="revoke-account"
                placeholder="0x..."
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="revoke-reason">Reason</Label>
              <Textarea
                id="revoke-reason"
                placeholder="Reason for revoking this role..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRevokeRole}
              disabled={loading}
              variant="destructive"
            >
              {loading ? "Revoking..." : "Revoke Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
