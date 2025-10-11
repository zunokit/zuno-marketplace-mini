/**
 * Collection Stats Component
 * Displays collection statistics in a clean format
 */

'use client';

import { ethers } from 'ethers';
import { CollectionInfo } from '@/types';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Package,
  TrendingUp,
  DollarSign,
  Percent,
  Hash,
  Clock,
  CheckCircle
} from 'lucide-react';

interface CollectionStatsProps {
  collectionInfo: CollectionInfo;
}

export function CollectionStats({ collectionInfo }: CollectionStatsProps) {
  const { stats, config, mintInfo } = collectionInfo;
  
  const mintProgress = stats.maxSupply > 0n 
    ? (Number(stats.totalMinted) / Number(stats.maxSupply)) * 100 
    : 0;

  const formatNumber = (value: bigint | number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Mint Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Supply
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {formatNumber(stats.totalMinted)} / {formatNumber(stats.maxSupply)}
              </span>
              <span className="text-muted-foreground">
                {mintProgress.toFixed(1)}%
              </span>
            </div>
            <Progress value={mintProgress} className="h-2" />
            {stats.totalMinted === stats.maxSupply && (
              <Badge variant="secondary" className="w-full justify-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Sold Out
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mint Price */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Mint Price
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {ethers.formatEther(config.mintPrice)} ETH
            </p>
            {mintInfo && (
              <p className="text-xs text-muted-foreground">
                Stage: {mintInfo.currentStage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Owners */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Owners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {formatNumber(stats.owners || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Unique holders
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Royalty */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Royalty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {(config.royaltyFee / 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Creator fee
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Floor Price */}
      {stats.floorPrice && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Floor Price
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {ethers.formatEther(stats.floorPrice)} ETH
              </p>
              <p className="text-xs text-muted-foreground">
                Lowest listing
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 24h Volume */}
      {stats.volume24h && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              24h Volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {ethers.formatEther(stats.volume24h)} ETH
              </p>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Volume */}
      {stats.volumeTotal && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Total Volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {ethers.formatEther(stats.volumeTotal)} ETH
              </p>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mint Limit */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mint Limit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {formatNumber(config.mintLimitPerWallet)}
            </p>
            <p className="text-xs text-muted-foreground">
              Per wallet
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
