"use client";

/**
 * Admin Layout
 * Shared layout for all admin pages
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/lib/store/hooks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { account, isConnected } = useAppSelector((state) => state.wallet);
  const [isAdmin, setIsAdmin] = useState(true); // Mock - replace with real permission check

  useEffect(() => {
    if (!isConnected || !account) {
      // Redirect to home if not connected
      return;
    }

    // TODO: Check if user has admin role from AccessControl contract
    // const accessControl = getContract(ACCESS_CONTROL_ADDRESS, ACCESS_CONTROL_ABI)
    // const hasAdminRole = await accessControl.hasRole(ADMIN_ROLE, account)
    // setIsAdmin(hasAdminRole)
  }, [account, isConnected]);

  if (!isConnected || !account) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please connect your wallet to access the admin panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Admin Header */}
      <div className="mb-6 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🛡️ Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Platform administration and controls
            </p>
          </div>
          <Badge variant="outline">Admin Access</Badge>
        </div>

        {/* Navigation */}
        <div className="mt-4 flex gap-4 flex-wrap">
          <Link
            href="/admin"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/collections/verify"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Collections
          </Link>
          <Link
            href="/admin/fees"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Fees
          </Link>
          <Link
            href="/admin/royalties"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Royalties
          </Link>
          <Link
            href="/admin/access-control"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Access Control
          </Link>
          <Link
            href="/admin/validator"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Validator
          </Link>
          <Link
            href="/admin/timelock"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Timelock
          </Link>
          <Link
            href="/admin/emergency"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Emergency
          </Link>
          <Link
            href="/admin/users"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Users
          </Link>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
