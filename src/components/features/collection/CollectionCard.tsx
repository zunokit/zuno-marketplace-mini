'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreVertical, 
  ExternalLink, 
  Share2, 
  Heart, 
  Users, 
  Package,
  TrendingUp,
  Verified
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CollectionCardProps {
  collection: {
    address: string
    name: string
    symbol: string
    description?: string
    image?: string
    bannerImage?: string
    creator: string
    verified?: boolean
    type: 'ERC721' | 'ERC1155'
    stats?: {
      totalSupply: number
      totalOwners: number
      floorPrice?: string
      totalVolume?: string
      listed?: number
    }
    socialLinks?: {
      website?: string
      twitter?: string
      discord?: string
    }
    createdAt?: number
  }
  className?: string
  variant?: 'default' | 'featured' | 'compact'
  showStats?: boolean
  onFollow?: () => void
  onView?: () => void
  isFollowing?: boolean
}

export function CollectionCard({
  collection,
  className,
  variant = 'default',
  showStats = true,
  onFollow,
  onView,
  isFollowing = false,
}: CollectionCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatPrice = (price: string) => {
    const num = parseFloat(price)
    return num.toFixed(3)
  }

  const getListedPercentage = () => {
    if (!collection.stats?.listed || !collection.stats?.totalSupply) return 0
    return (collection.stats.listed / collection.stats.totalSupply) * 100
  }

  if (variant === 'compact') {
    return (
      <Card className={cn("group overflow-hidden transition-all hover:shadow-md", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Collection Image */}
            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
              {collection.image && !imageError ? (
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                  <div className="flex flex-col items-center gap-1">
                    <Package className="h-6 w-6 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-600">
                      {collection.symbol}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Collection Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/collections/${collection.address}`}>
                  <h3 className="font-medium truncate hover:text-primary transition-colors">
                    {collection.name}
                  </h3>
                </Link>
                {collection.verified && (
                  <Verified className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {collection.stats?.totalSupply || 0} items
              </p>
            </div>

            {/* Quick Stats */}
            {collection.stats?.floorPrice && (
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatPrice(collection.stats.floorPrice)} ETH
                </p>
                <p className="text-xs text-muted-foreground">Floor</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "group overflow-hidden transition-all hover:shadow-lg",
      variant === 'featured' && "md:col-span-2",
      className
    )}>
      {/* Banner/Header Image */}
      {variant === 'featured' && collection.bannerImage && (
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          <Image
            src={collection.bannerImage}
            alt={`${collection.name} banner`}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      <CardHeader className={cn("p-4", variant === 'featured' && "relative -mt-8")}>
        <div className="flex items-start gap-4">
          {/* Collection Avatar */}
          <div className={cn(
            "relative overflow-hidden rounded-xl bg-background border-4 border-background",
            variant === 'featured' ? "h-16 w-16" : "h-12 w-12"
          )}>
            {collection.image && !imageError ? (
              <Image
                src={collection.image}
                alt={collection.name}
                fill
                className={cn(
                  "object-cover transition-transform group-hover:scale-105",
                  imageLoading && "blur-sm"
                )}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true)
                  setImageLoading(false)
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 to-pink-100">
                <div className="flex flex-col items-center gap-1">
                  <Package className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-600">
                    {collection.symbol.slice(0, 3)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Collection Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/collections/${collection.address}`}>
                <h3 className={cn(
                  "font-semibold truncate hover:text-primary transition-colors",
                  variant === 'featured' ? "text-lg" : "text-base"
                )}>
                  {collection.name}
                </h3>
              </Link>
              {collection.verified && (
                <Verified className="h-5 w-5 text-blue-500 flex-shrink-0" />
              )}
              <Badge variant="outline" className="text-xs">
                {collection.type}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>by</span>
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs">
                  {collection.creator.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link 
                href={`/profile/${collection.creator}`}
                className="hover:text-primary transition-colors"
              >
                {formatAddress(collection.creator)}
              </Link>
            </div>

            {collection.description && variant === 'featured' && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {collection.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onFollow}
              className={cn(isFollowing && "text-red-500")}
            >
              <Heart className={cn("h-4 w-4", isFollowing && "fill-current")} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link 
                    href={`https://etherscan.io/address/${collection.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Etherscan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Collection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {showStats && collection.stats && (
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Floor Price</p>
              <p className="font-semibold">
                {collection.stats.floorPrice ? (
                  `${formatPrice(collection.stats.floorPrice)} ETH`
                ) : (
                  'No listings'
                )}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="font-semibold">
                {collection.stats.totalVolume ? (
                  `${formatPrice(collection.stats.totalVolume)} ETH`
                ) : (
                  '0 ETH'
                )}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" />
                Items
              </p>
              <p className="font-semibold">
                {formatNumber(collection.stats.totalSupply)}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Owners
              </p>
              <p className="font-semibold">
                {formatNumber(collection.stats.totalOwners)}
              </p>
            </div>
          </div>

          {/* Listed Percentage */}
          {collection.stats.listed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Listed for Sale</span>
                <span className="font-medium">
                  {collection.stats.listed} ({getListedPercentage().toFixed(1)}%)
                </span>
              </div>
              <Progress value={getListedPercentage()} className="h-2" />
            </div>
          )}
        </CardContent>
      )}

      <CardFooter className="p-4 pt-0">
        <div className="w-full flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onView}>
            View Collection
          </Button>
          <Button className="flex-1" asChild>
            <Link href={`/collections/${collection.address}`}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Explore
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}