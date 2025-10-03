'use client'
import { useState, useMemo } from 'react'
import { MainLayout } from '@/components/common/layout/MainLayout'
import { CollectionCard } from '@/components/features/collection/CollectionCard'
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
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Plus, 
  TrendingUp, 
  Filter,
  Grid3X3,
  List
} from 'lucide-react'
import Link from 'next/link'

// Mock collections data
const collections = [
  {
    address: '0x123...',
    name: 'Cosmic Warriors',
    symbol: 'CW',
    description: 'A collection of 10,000 unique cosmic warriors ready for battle across the metaverse.',
    image: 'https://picsum.photos/200/200?random=1',
    bannerImage: 'https://picsum.photos/800/200?random=1',
    creator: '0x742d35cc6bb5c57e4f6a8c5c3d4b2a0f8e6d9b5c',
    verified: true,
    type: 'ERC721' as const,
    stats: {
      totalSupply: 10000,
      totalOwners: 5432,
      floorPrice: '1.2',
      totalVolume: '12500.5',
      listed: 234,
    },
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  },
  {
    address: '0x456...',
    name: 'Digital Dreams',
    symbol: 'DD',
    description: 'Surreal digital art pieces that blur the line between reality and imagination.',
    image: 'https://picsum.photos/200/200?random=2',
    creator: '0x853e46dc7bb6d8c4f5b9d8c5c3d4b2a0f8e6d9b5c',
    verified: false,
    type: 'ERC721' as const,
    stats: {
      totalSupply: 5000,
      totalOwners: 2876,
      floorPrice: '0.8',
      totalVolume: '8750.2',
      listed: 156,
    },
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
  },
  {
    address: '0x789...',
    name: 'Neon Nights',
    symbol: 'NN',
    description: 'Cyberpunk-inspired collectibles featuring neon aesthetics and futuristic themes.',
    image: 'https://picsum.photos/200/200?random=3',
    creator: '0x964f57ed8cc7e9d5f6c0e9d6c4d5b3a1f9e7d0c6c',
    verified: true,
    type: 'ERC1155' as const,
    stats: {
      totalSupply: 2500,
      totalOwners: 1892,
      floorPrice: '2.1',
      totalVolume: '15320.8',
      listed: 89,
    },
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  },
  {
    address: '0xABC...',
    name: 'Abstract Emotions',
    symbol: 'AE',
    description: 'Abstract art pieces that capture the essence of human emotions through color and form.',
    image: 'https://picsum.photos/200/200?random=4',
    creator: '0x123456789abcdef123456789abcdef123456789a',
    verified: false,
    type: 'ERC721' as const,
    stats: {
      totalSupply: 1000,
      totalOwners: 678,
      floorPrice: '3.5',
      totalVolume: '4500.2',
      listed: 45,
    },
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
  },
]

const sortOptions = [
  { value: 'volume_desc', label: 'Highest Volume' },
  { value: 'volume_asc', label: 'Lowest Volume' },
  { value: 'floor_desc', label: 'Highest Floor' },
  { value: 'floor_asc', label: 'Lowest Floor' },
  { value: 'newest', label: 'Recently Created' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'A to Z' },
  { value: 'name_desc', label: 'Z to A' },
]

const filterOptions = [
  { value: 'all', label: 'All Collections' },
  { value: 'verified', label: 'Verified Only' },
  { value: 'ERC721', label: 'ERC721' },
  { value: 'ERC1155', label: 'ERC1155' },
]

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('volume_desc')
  const [filterBy, setFilterBy] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(false)

  // Filter and sort collections
  const filteredAndSortedCollections = useMemo(() => {
    let filtered = collections.filter(collection => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = collection.name.toLowerCase().includes(query)
        const matchesSymbol = collection.symbol.toLowerCase().includes(query)
        const matchesDescription = collection.description?.toLowerCase().includes(query)
        
        if (!matchesName && !matchesSymbol && !matchesDescription) {
          return false
        }
      }

      // Type/Verification filter
      if (filterBy === 'verified' && !collection.verified) {
        return false
      }
      if (filterBy === 'ERC721' && collection.type !== 'ERC721') {
        return false
      }
      if (filterBy === 'ERC1155' && collection.type !== 'ERC1155') {
        return false
      }

      return true
    })

    // Sort collections
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'volume_desc':
          return parseFloat(b.stats?.totalVolume || '0') - parseFloat(a.stats?.totalVolume || '0')
        case 'volume_asc':
          return parseFloat(a.stats?.totalVolume || '0') - parseFloat(b.stats?.totalVolume || '0')
        case 'floor_desc':
          return parseFloat(b.stats?.floorPrice || '0') - parseFloat(a.stats?.floorPrice || '0')
        case 'floor_asc':
          return parseFloat(a.stats?.floorPrice || '0') - parseFloat(b.stats?.floorPrice || '0')
        case 'newest':
          return (b.createdAt || 0) - (a.createdAt || 0)
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0)
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, sortBy, filterBy])

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="text-muted-foreground">
              Discover amazing NFT collections from creators worldwide
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/collections/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <TrendingUp className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `${filteredAndSortedCollections.length} collections found`}
          </p>
          
          {(searchQuery || filterBy !== 'all') && (
            <div className="flex items-center gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filterBy !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Filter: {filterOptions.find(f => f.value === filterBy)?.label}
                  <button
                    onClick={() => setFilterBy('all')}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collections Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedCollections.length > 0 ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 max-w-4xl mx-auto'
        }`}>
          {filteredAndSortedCollections.map((collection) => (
            <CollectionCard
              key={collection.address}
              collection={collection}
              variant={viewMode === 'list' ? 'featured' : 'default'}
              onFollow={() => console.log('Follow collection:', collection.address)}
              onView={() => console.log('View collection:', collection.address)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No collections found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setFilterBy('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  )
}