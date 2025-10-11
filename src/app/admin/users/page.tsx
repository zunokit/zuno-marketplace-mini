"use client";

/**
 * User Management Admin Page
 * Manage user roles and permissions
 */

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Shield, Search, X } from "lucide-react";
import { accessControlService } from "@/lib/services/contracts";

enum UserRole {
  ADMIN = "ADMIN",
  MINTER = "MINTER",
  USER = "USER",
}

interface User {
  address: string;
  role: UserRole;
  isActive: boolean;
  lastActivity: number;
  transactions: number;
  volume: string;
}

export default function UserManagementPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [grantDialog, setGrantDialog] = useState(false);
  const [grantForm, setGrantForm] = useState({
    address: "",
    role: UserRole.USER,
  });

  /**
   * Load users from AccessControl contract
   */
  const loadUsers = async () => {
    try {
      // TODO: Implement loading users from AccessControl contract
      // This would require querying role grant events from the blockchain
      // For now, users are managed through direct contract interaction
      console.log("Loading users from contract...");
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  /**
   * Handle grant role
   */
  const handleGrantRole = async () => {
    if (!grantForm.address) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid wallet address",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call AccessControl contract to grant role
      await accessControlService.grantRole(
        accessControlService.getRoleHash(grantForm.role),
        grantForm.address,
        `Granted ${grantForm.role} role via admin panel`
      );

      toast({
        title: "Role Granted",
        description: `Successfully granted ${grantForm.role} role to ${grantForm.address}`,
      });

      setGrantDialog(false);
      setGrantForm({ address: "", role: UserRole.USER });

      // Reload users list
      await loadUsers();
    } catch (error) {
      toast({
        title: "Grant Failed",
        description:
          error instanceof Error ? error.message : "Failed to grant role",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle revoke role
   */
  const handleRevokeRole = async (address: string, role: UserRole) => {
    try {
      // Call AccessControl contract to revoke role
      await accessControlService.revokeRole(
        accessControlService.getRoleHash(role),
        address,
        `Revoked ${role} role via admin panel`
      );

      toast({
        title: "Role Revoked",
        description: `Successfully revoked ${role} role from ${address}`,
      });

      // Reload users list
      await loadUsers();
    } catch (error) {
      toast({
        title: "Revoke Failed",
        description:
          error instanceof Error ? error.message : "Failed to revoke role",
        variant: "destructive",
      });
    }
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: number): string => {
    const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  /**
   * Get role badge
   */
  const getRoleBadge = (role: UserRole) => {
    const variants = {
      [UserRole.ADMIN]: "destructive",
      [UserRole.MINTER]: "default",
      [UserRole.USER]: "secondary",
    } as const;

    return (
      <Badge variant={variants[role] || "secondary"}>
        {role === UserRole.ADMIN && <Shield className="h-3 w-3 mr-1" />}
        {role}
      </Badge>
    );
  };

  /**
   * Filter users
   */
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === UserRole.ADMIN).length,
    minters: users.filter((u) => u.role === UserRole.MINTER).length,
    active: users.filter((u) => u.isActive).length,
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">👥 User Management</h2>
        <p className="text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minters</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.minters}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage platform users and roles</CardDescription>
            </div>
            <Button onClick={() => setGrantDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Grant Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MINTER">Minter</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Volume (ETH)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.address}>
                      <TableCell className="font-mono text-sm">
                        {user.address.slice(0, 6)}...{user.address.slice(-4)}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeAgo(user.lastActivity)}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.transactions}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.volume}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role !== UserRole.USER && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRevokeRole(user.address, user.role)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Grant Role Dialog */}
      <Dialog open={grantDialog} onOpenChange={setGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Role</DialogTitle>
            <DialogDescription>
              Assign a role to a user address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={grantForm.address}
                onChange={(e) =>
                  setGrantForm({ ...grantForm, address: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={grantForm.role}
                onValueChange={(v) =>
                  setGrantForm({ ...grantForm, role: v as UserRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.USER}>User</SelectItem>
                  <SelectItem value={UserRole.MINTER}>Minter</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantRole}>Grant Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
