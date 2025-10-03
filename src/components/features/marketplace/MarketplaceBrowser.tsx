'use client'
import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { ListingCard } from './ListingCard'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMarketplace } from '@/hooks/useMarketplace'
import { useWallet } from '@/hooks/useWallet'

interface FilterOptions {
  priceMin: string
  priceMax: string
  currency: string
  collection: string
  status: string
}

interface SortOption {
  value: string
  label: string
  icon?: any
}

const sortOptions: SortOption[] = [
  { value: 'price_asc', label: 'Price: Low to High', icon: SortAsc },
  { value: 'price_desc', label: 'Price: High to Low', icon: SortDesc },
  { value: 'newest', label: 'Recently Listed' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'ending_soon', label: 'Ending Soon' },
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function MarketplaceBrowser() {
  const { items: listings, loading, error } = useMarketplace()
  const { account } = useWallet()
  
  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filters, setFilters] = useState<FilterOptions>({
    priceMin: '',
    priceMax: '',
    currency: 'all',
    collection: 'all',
    status: 'ACTIVE',
  })

  // Mock collections for filter (in real app, this would come from collections state)
  const collections = [
    { value: 'all', label: 'All Collections' },
    { value: '0x123...', label: 'CryptoPunks' },
    { value: '0x456...', label: 'Bored Apes' },
  ]

  // Filter and sort listings
  const filteredAndSortedListings = useMemo(() => {
    let filtered = listings.filter(listing => {
      // Status filter
      if (filters.status !== 'all' && listing.status !== filters.status) {
        return false
      }

      // Price range filter
      if (filters.priceMin && parseFloat(listing.price) < parseFloat(filters.priceMin)) {
        return false
      }
      if (filters.priceMax && parseFloat(listing.price) > parseFloat(filters.priceMax)) {
        return false
      }

      // Collection filter
      if (filters.collection !== 'all' && listing.tokenContract !== filters.collection) {
        return false
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = listing.nft?.name?.toLowerCase().includes(query)
        const matchesCollection = listing.nft?.collection?.name?.toLowerCase().includes(query)
        const matchesTokenId = listing.tokenId.includes(query)
        
        if (!matchesName && !matchesCollection && !matchesTokenId) {
          return false
        }
      }

      return true
    })

    // Sort listings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return parseFloat(a.price) - parseFloat(b.price)
        case 'price_desc':
          return parseFloat(b.price) - parseFloat(a.price)
        case 'newest':
          return b.createdAt - a.createdAt
        case 'oldest':
          return a.createdAt - b.createdAt
        case 'ending_soon':
          // For auctions, sort by end time (not implemented in this example)
          return 0
        default:
          return 0
      }
    })

    return filtered
  }, [listings, filters, searchQuery, sortBy])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.priceMin || filters.priceMax) count++
    if (filters.currency !== 'all') count++
    if (filters.collection !== 'all') count++
    if (filters.status !== 'ACTIVE') count++
    return count
  }, [filters])

  const clearFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      currency: 'all',
      collection: 'all',
      status: 'ACTIVE',
    })
    setSearchQuery('')
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Failed to load marketplace</p>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            Discover, buy, and sell extraordinary NFTs
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, collection, or token ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.icon && <option.icon className="h-4 w-4" />}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filters */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Refine your search with these filters
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, status: value }))
                }>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium">Price Range (ETH)</label>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.priceMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.priceMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  />
                </div>
              </div>

              {/* Collection Filter */}
              <div>
                <label className="text-sm font-medium">Collection</label>
                <Select value={filters.collection} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, collection: value }))
                }>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection.value} value={collection.value}>
                        {collection.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear All Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${filteredAndSortedListings.length} items`}
        </p>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
          </Button>
        )}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1"
        )}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedListings.length > 0 ? (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1 max-w-2xl mx-auto"
        )}>
          {filteredAndSortedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isOwner={listing.seller === account}
              onBuy={() => {
                // Handle buy logic
                console.log('Buy listing:', listing.id)
              }}
              onEdit={() => {
                // Handle edit logic
                console.log('Edit listing:', listing.id)
              }}
              onCancel={() => {
                // Handle cancel logic
                console.log('Cancel listing:', listing.id)
              }}
              onView={() => {
                // Handle view logic
                console.log('View listing:', listing.id)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No listings found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}