"use client";

/**
 * Admin Dashboard Page
 * Main admin dashboard with platform overview
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppSelector } from "@/lib/store/hooks";
import { isMockDataEnabled } from "@/lib/services/mock/mockDataService";
import {
  Shield,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { account } = useAppSelector((state) => state.wallet);
  const [useMockData] = useState(isMockDataEnabled());

  // Mock stats
  const [stats, setStats] = useState({
    totalUsers: 1234,
    totalCollections: 45,
    totalVolume: "2,345.67",
    pendingVerifications: 8,
    activeBans: 3,
    platformFee: "2.0%",
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      type: "verification",
      message: "CryptoPunks collection verified",
      timestamp: Date.now() - 1000 * 60 * 15,
    },
    {
      type: "fee",
      message: "Platform fee updated to 2.0%",
      timestamp: Date.now() - 1000 * 60 * 45,
    },
    {
      type: "emergency",
      message: "Auction contract paused for maintenance",
      timestamp: Date.now() - 1000 * 60 * 120,
    },
  ]);

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

  return (
    <div>
      {useMockData && (
        <Alert className="mb-6">
          <AlertDescription>
            ⚠️ <strong>Mock Data Mode:</strong> This admin panel is displaying mock data.
            Real admin functions will interact with AccessControl, FeeManager, and other
            contracts.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Collections
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCollections}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingVerifications} pending verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolume} ETH</div>
            <p className="text-xs text-muted-foreground">Platform fee: {stats.platformFee}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/admin/collections/verify"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Collection Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Review and approve collections
                  </p>
                </div>
              </div>
              <Badge variant="secondary">{stats.pendingVerifications} pending</Badge>
            </Link>

            <Link
              href="/admin/fees"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Fee Management</p>
                  <p className="text-sm text-muted-foreground">
                    Configure platform fees
                  </p>
                </div>
              </div>
              <Badge variant="outline">{stats.platformFee}</Badge>
            </Link>

            <Link
              href="/admin/emergency"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Emergency Controls</p>
                  <p className="text-sm text-muted-foreground">
                    Pause/unpause contracts
                  </p>
                </div>
              </div>
              {stats.activeBans > 0 && (
                <Badge variant="destructive">{stats.activeBans} active</Badge>
              )}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {activity.type === "verification" && (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  )}
                  {activity.type === "fee" && (
                    <Settings className="h-5 w-5 text-blue-500 mt-0.5" />
                  )}
                  {activity.type === "emergency" && (
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Platform health and contract states</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="font-medium">Marketplace</p>
              </div>
              <p className="text-sm text-muted-foreground">Operational</p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="font-medium">Auctions</p>
              </div>
              <p className="text-sm text-muted-foreground">Operational</p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="font-medium">Offers</p>
              </div>
              <p className="text-sm text-muted-foreground">Operational</p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="font-medium">Bundles</p>
              </div>
              <p className="text-sm text-muted-foreground">Operational</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

