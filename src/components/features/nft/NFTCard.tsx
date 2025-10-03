'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Heart, MoreVertical, ExternalLink, Share2, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NFTCardProps {
  nft: {
    id: string
    tokenId: string
    contractAddress: string
    name: string
    description?: string
    image: string
    price?: string
    currency?: string
    seller?: string
    owner: string
    collection?: {
      name: string
      verified?: boolean
    }
    rarity?: 'common' | 'rare' | 'epic' | 'legendary'
    isListed?: boolean
    isAuction?: boolean
    auctionEndTime?: number
  }
  className?: string
  showPrice?: boolean
  showOwner?: boolean
  onLike?: () => void
  onBuy?: () => void
  onMakeOffer?: () => void
  isLiked?: boolean
  likeCount?: number
}

export function NFTCard({
  nft,
  className,
  showPrice = true,
  showOwner = true,
  onLike,
  onBuy,
  onMakeOffer,
  isLiked = false,
  likeCount = 0,
}: NFTCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatPrice = (price: string) => {
    const num = parseFloat(price)
    return num.toFixed(4)
  }

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500'
      case 'epic':
        return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'rare':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500'
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600'
    }
  }

  return (
    <Card className={cn("group overflow-hidden transition-all hover:shadow-lg", className)}>
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {!imageError ? (
          <Image
            src={nft.image}
            alt={nft.name}
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
          <div className="flex h-full items-center justify-center bg-muted">
            <div className="text-muted-foreground">No Image</div>
          </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20">
          <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link 
                    href={`https://etherscan.io/token/${nft.contractAddress}?a=${nft.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Etherscan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Rarity Badge */}
          {nft.rarity && nft.rarity !== 'common' && (
            <div className="absolute top-2 left-2">
              <Badge className={cn("capitalize text-white", getRarityColor(nft.rarity))}>
                {nft.rarity}
              </Badge>
            </div>
          )}

          {/* Auction Timer */}
          {nft.isAuction && nft.auctionEndTime && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="destructive">
                Auction Ending Soon
              </Badge>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Collection Info */}
        {nft.collection && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{nft.collection.name}</span>
            {nft.collection.verified && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                ✓
              </Badge>
            )}
          </div>
        )}

        {/* NFT Name */}
        <Link href={`/nft/${nft.contractAddress}/${nft.tokenId}`}>
          <h3 className="font-semibold truncate hover:text-primary transition-colors">
            {nft.name}
          </h3>
        </Link>

        {/* Owner Info */}
        {showOwner && (
          <div className="mt-2 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {nft.owner.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {formatAddress(nft.owner)}
            </span>
          </div>
        )}

        {/* Price */}
        {showPrice && nft.price && (
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {nft.isAuction ? 'Current Bid' : 'Price'}
              </p>
              <p className="font-semibold">
                {formatPrice(nft.price)} {nft.currency || 'ETH'}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {/* Like Button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 px-2"
          onClick={onLike}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
          {likeCount > 0 && <span className="text-sm">{likeCount}</span>}
        </Button>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {nft.isListed && onBuy && (
            <Button size="sm" onClick={onBuy}>
              {nft.isAuction ? 'Place Bid' : 'Buy Now'}
            </Button>
          )}
          {!nft.isListed && onMakeOffer && (
            <Button variant="outline" size="sm" onClick={onMakeOffer}>
              Make Offer
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}