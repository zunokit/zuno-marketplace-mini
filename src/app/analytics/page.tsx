"use client";

/**
 * Analytics Dashboard Page
 * Migrated from frontend-foundry/src/components/AnalyticsDashboard.jsx
 * Platform metrics, charts, and statistics
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/lib/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { isMockDataEnabled } from "@/lib/services/mock/mockDataService";
import {
  getMockAnalyticsService,
  VolumeDataPoint,
  CollectionStats,
  PlatformStats,
} from "@/lib/services/mock/mockAnalyticsService";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Activity,
  Loader2,
  Download,
} from "lucide-react";

export default function AnalyticsPage() {
  const { toast } = useToast();

  // Redux state
  const { isConnected } = useAppSelector((state) => state.wallet);

  // Local state
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [collectionStats, setCollectionStats] = useState<CollectionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [useMockData] = useState(isMockDataEnabled());

  /**
   * Load analytics data
   */
  useEffect(() => {
    loadAnalytics();
  }, [period]);

  /**
   * Fetch analytics from service
   */
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      if (useMockData) {
        const mockService = getMockAnalyticsService();
        const [stats, volume, collections] = await Promise.all([
          mockService.getPlatformStats(),
          mockService.getVolumeData(period),
          mockService.getCollectionStats(10),
        ]);
        setPlatformStats(stats);
        setVolumeData(volume);
        setCollectionStats(collections);
      } else {
        // Real blockchain data
        // TODO: Implement with ListingHistoryTracker contract
        // 1. Query TransactionRecorded events for platform stats
        // 2. Aggregate volume data by time period
        // 3. Fetch collection-specific stats
        
        toast({
          title: "Blockchain Integration",
          description: "Real analytics coming soon",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error Loading Analytics",
        description:
          error instanceof Error ? error.message : "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export data to CSV
   */
  const handleExport = (type: "volume" | "collections") => {
    try {
      let csvContent = "";
      let filename = "";

      if (type === "volume") {
        csvContent = "Date,Volume (ETH),Sales,Average Price (ETH)\n";
        volumeData.forEach((d) => {
          csvContent += `${d.date},${d.totalVolume},${d.totalSales},${d.averagePrice}\n`;
        });
        filename = `volume_data_${period}.csv`;
      } else {
        csvContent = "Collection,Volume (ETH),Sales,Avg Price (ETH),Floor (ETH)\n";
        collectionStats.forEach((c) => {
          csvContent += `${c.name},${c.volume},${c.sales},${c.averagePrice},${c.floorPrice}\n`;
        });
        filename = "collection_stats.csv";
      }

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          📊 Marketplace Analytics
        </h1>
        <p className="text-muted-foreground">
          Platform statistics and performance metrics
        </p>
        {useMockData && (
          <Badge variant="outline" className="mt-2">
            🎭 Mock Data Mode
          </Badge>
        )}
      </div>

      {/* Platform Stats Cards */}
      {platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.totalVolume} ETH</div>
              <p className="text-xs text-muted-foreground">All time trading volume</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.totalSales}</div>
              <p className="text-xs text-muted-foreground">Completed transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collections</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.totalCollections}</div>
              <p className="text-xs text-muted-foreground">Active collections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.activeUsers24h}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="volume" className="space-y-6">
        <TabsList>
          <TabsTrigger value="volume">Volume & Sales</TabsTrigger>
          <TabsTrigger value="collections">Top Collections</TabsTrigger>
        </TabsList>

        {/* Volume & Sales Tab */}
        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Volume & Sales Trends</CardTitle>
                  <CardDescription>Trading volume over time</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Daily (7 days)</SelectItem>
                      <SelectItem value="week">Weekly (30 days)</SelectItem>
                      <SelectItem value="month">Monthly (90 days)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("volume")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-right p-2">Volume (ETH)</th>
                      <th className="text-right p-2">Sales</th>
                      <th className="text-right p-2">Avg Price (ETH)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volumeData.map((data, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2">{data.date}</td>
                        <td className="text-right p-2 font-semibold">
                          {data.totalVolume}
                        </td>
                        <td className="text-right p-2">{data.totalSales}</td>
                        <td className="text-right p-2">{data.averagePrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="text-2xl font-bold">
                    {volumeData.reduce((sum, d) => sum + d.totalVolume, 0).toFixed(2)} ETH
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">
                    {volumeData.reduce((sum, d) => sum + d.totalSales, 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg Sale Price</p>
                  <p className="text-2xl font-bold">
                    {(
                      volumeData.reduce((sum, d) => sum + d.totalVolume, 0) /
                      volumeData.reduce((sum, d) => sum + d.totalSales, 0)
                    ).toFixed(2)}{" "}
                    ETH
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Collections Tab */}
        <TabsContent value="collections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Collections</CardTitle>
                  <CardDescription>Highest performing collections</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("collections")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collectionStats.map((collection, idx) => (
                  <div
                    key={collection.address}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{collection.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {collection.sales} sales • {collection.uniqueOwners} owners
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {collection.volume} ETH
                        </span>
                        {idx < 3 && (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Floor: {collection.floorPrice} ETH
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

