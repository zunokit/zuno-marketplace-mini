# Zuno Marketplace SDK - Extraction & Architecture Plan

## 📋 Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [SDK Architecture](#sdk-architecture)
4. [API Design](#api-design)
5. [Initialization Patterns](#initialization-patterns)
6. [Frontend vs Backend Usage](#frontend-vs-backend-usage)
7. [Publishing Workflow](#publishing-workflow)
8. [Advanced Features](#advanced-features)
9. [Implementation Phases](#implementation-phases)
10. [Migration Guide](#migration-guide)

---

## Overview

### Goal

Extract a standalone, framework-agnostic SDK from `zuno-marketplace-mini` that can be:
- Published to npm as `zuno-marketplace-sdk`
- Used in both frontend (React, Vue, vanilla JS) and backend (Node.js)
- Shared across multiple projects
- Independently versioned and maintained

### Key Benefits

- ✅ **Reusability**: Use in any JavaScript project
- ✅ **Versioning**: Semantic versioning via npm
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Framework Agnostic**: Works with React, Vue, Node.js, etc.
- ✅ **Maintainability**: Single source of truth
- ✅ **Developer Experience**: Simple API, excellent docs

---

## Current State Analysis

### Assets to Extract

**Services (15 total):**
- `MarketplaceHubService` - Address discovery hub
- `ExchangeService` - ERC721/ERC1155 listings and purchases
- `AuctionService` - English/Dutch auctions
- `BundleService` - NFT bundles
- `OfferService` - NFT and collection offers
- `CollectionService` - Create/mint/manage collections
- `FeeManagerService` - Fee tiers, VIP status
- `RoyaltyManagerService` - ERC2981 royalty management
- `AccessControlService` - Role-based permissions
- `EmergencyManagerService` - Emergency pause/blacklist
- `ListingValidatorService` - Pre-transaction validation
- `ListingHistoryTrackerService` - Analytics and stats
- `CollectionVerifierService` - Collection verification
- `TimelockService` - Timelock operations
- `CollectionQueryService` - Collection queries

**Types & Interfaces:**
- Collection types
- Contract types
- Event types
- Environment config types
- ~20 interfaces & enums

**Utilities:**
- Logger utility
- Contract helpers
- Formatters
- Validators

**Constants:**
- Zero address
- Interface IDs
- Contract constants
- Network configurations

### Dependencies to Handle

**Keep as peer dependencies:**
- `ethers` v6
- `react` (optional - for React integration)
- `react-dom` (optional - for React integration)

**Remove/Refactor:**
- Next.js path aliases (`@/`)
- Next.js-specific imports
- App-specific logic

---

## SDK Architecture

### Project Structure

```
zuno-marketplace-sdk/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── ZunoSDK.ts                  # Core SDK class
│   │
│   ├── core/                       # Core functionality
│   │   ├── provider.ts            # Provider abstraction
│   │   ├── signer.ts              # Signer abstraction
│   │   ├── config.ts              # Configuration management
│   │   └── errors.ts              # Custom error classes
│   │
│   ├── services/                   # Contract services
│   │   ├── MarketplaceHubService.ts
│   │   ├── ExchangeService.ts
│   │   ├── AuctionService.ts
│   │   ├── CollectionService.ts
│   │   ├── BundleService.ts
│   │   ├── OfferService.ts
│   │   ├── FeeManagerService.ts
│   │   ├── RoyaltyManagerService.ts
│   │   ├── AccessControlService.ts
│   │   ├── EmergencyManagerService.ts
│   │   ├── ListingValidatorService.ts
│   │   ├── ListingHistoryTrackerService.ts
│   │   ├── CollectionVerifierService.ts
│   │   ├── TimelockService.ts
│   │   ├── CollectionQueryService.ts
│   │   └── index.ts
│   │
│   ├── types/                      # TypeScript types
│   │   ├── index.ts
│   │   ├── collection.ts
│   │   ├── contract.ts
│   │   ├── events.ts
│   │   ├── marketplace.ts
│   │   └── config.ts
│   │
│   ├── abis/                       # ABI management
│   │   ├── loader.ts              # Dynamic ABI loader
│   │   ├── cache.ts               # ABI caching
│   │   └── registry.ts            # ABI registry
│   │
│   ├── utils/                      # Utilities
│   │   ├── logger.ts              # Production logger
│   │   ├── contract.ts            # Contract helpers
│   │   ├── format.ts              # Formatters
│   │   └── validation.ts          # Validators
│   │
│   ├── constants/                  # Constants
│   │   ├── addresses.ts           # Zero address, etc.
│   │   ├── interfaces.ts          # ERC interface IDs
│   │   └── networks.ts            # Network configs
│   │
│   ├── hooks/                      # React hooks (optional)
│   │   ├── useZunoSDK.tsx
│   │   ├── useCollection.tsx
│   │   ├── useMarketplace.tsx
│   │   ├── useAuction.tsx
│   │   └── index.tsx
│   │
│   └── react/                      # React integration
│       ├── ZunoSDKProvider.tsx    # React Context Provider
│       └── index.tsx
│
├── examples/                       # Usage examples
│   ├── node/                      # Node.js examples
│   ├── react/                     # React examples
│   ├── nextjs/                    # Next.js examples
│   └── vanilla/                   # Vanilla JS examples
│
├── tests/                         # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/                          # Documentation
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── API_REFERENCE.md
│   └── guides/
│
├── package.json
├── tsconfig.json
├── rollup.config.js              # Bundle config
├── .npmignore
└── README.md
```

### Package Configuration

```json
{
  "name": "zuno-marketplace-sdk",
  "version": "1.0.0",
  "description": "Official SDK for Zuno NFT Marketplace",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./services": {
      "import": "./dist/services/index.mjs",
      "require": "./dist/services/index.js",
      "types": "./dist/services/index.d.ts"
    },
    "./react": {
      "import": "./dist/react/index.mjs",
      "require": "./dist/react/index.js",
      "types": "./dist/react/index.d.ts"
    },
    "./server": {
      "import": "./dist/server/index.mjs",
      "require": "./dist/server/index.js",
      "types": "./dist/server/index.d.ts"
    },
    "./types": {
      "types": "./dist/types/index.d.ts"
    }
  },
  "peerDependencies": {
    "ethers": "^6.0.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    },
    "react-dom": {
      "optional": true
    }
  },
  "keywords": [
    "nft",
    "marketplace",
    "web3",
    "ethereum",
    "sdk",
    "zuno",
    "smart-contracts",
    "erc721",
    "erc1155"
  ],
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

---

## API Design

### Core SDK Class

```typescript
import { ZunoSDK } from "zuno-marketplace-sdk"

// Initialize SDK
const sdk = new ZunoSDK({
  // Network configuration
  chainId: 1,
  rpcUrl: "https://mainnet.infura.io/v3/YOUR_KEY",

  // Hub address (required)
  hubAddress: "0x...",

  // ABI configuration (optional)
  abisUrl: "https://api.zuno.io/abis",
  abisApiKey: "your-api-key",

  // Or provide ABIs directly
  abis: {
    MarketplaceHub: [...],
    ERC721Exchange: [...],
  },

  // Optional configurations
  logger: customLogger,
  cacheEnabled: true,
  retryAttempts: 3,
})

// Connect wallet
await sdk.connect(provider, signer)

// Access services
const collection = await sdk.collections.create({
  name: "My Collection",
  symbol: "MYC",
  tokenType: "ERC721",
})

const listing = await sdk.marketplace.listNFT({
  nftContract: collection.address,
  tokenId: "1",
  price: "1000000000000000000", // 1 ETH
})
```

### Service-Level API

```typescript
// Direct service access
import { CollectionService } from "zuno-marketplace-sdk/services"

const collectionService = new CollectionService({
  provider,
  signer,
  hubAddress: "0x...",
})

await collectionService.initialize()
const collection = await collectionService.create({...})
```

### React Integration

```typescript
// App wrapper
import { ZunoSDKProvider } from "zuno-marketplace-sdk/react"

function App({ children }) {
  return (
    <ZunoSDKProvider
      config={{
        chainId: 1,
        rpcUrl: process.env.REACT_APP_RPC_URL!,
        hubAddress: process.env.REACT_APP_HUB_ADDRESS!,
      }}
    >
      {children}
    </ZunoSDKProvider>
  )
}

// Component usage
import { useZunoSDK } from "zuno-marketplace-sdk/react"

function CreateCollection() {
  const { sdk, isConnected } = useZunoSDK()

  const handleCreate = async () => {
    const collection = await sdk.collections.create({
      name: "My NFT",
    })
  }

  return <button onClick={handleCreate}>Create</button>
}
```

### Advanced Hooks

```typescript
import {
  useCollection,
  useMarketplace,
  useAuction
} from "zuno-marketplace-sdk/react"

// Collection hook with caching & auto-refresh
const { collection, isLoading, refresh } = useCollection(address)

// Marketplace listings with pagination
const {
  listings,
  hasMore,
  loadMore
} = useMarketplace({
  collection: address,
  status: "ACTIVE",
})

// Real-time auction data
const {
  auction,
  placeBid,
  timeRemaining
} = useAuction(auctionId)
```

---

## Initialization Patterns

### Frontend Pattern (Singleton + Provider)

**✅ Recommended: React Context Provider**

```typescript
// lib/providers/sdk-provider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { ZunoSDK } from 'zuno-marketplace-sdk'
import { BrowserProvider } from 'ethers'

interface SDKContextValue {
  sdk: ZunoSDK | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const SDKContext = createContext<SDKContextValue>(null!)

// ✅ SINGLETON - Create once
const sdk = new ZunoSDK({
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL!,
  hubAddress: process.env.NEXT_PUBLIC_HUB_ADDRESS!,
})

export function SDKProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)

  const connect = async () => {
    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    await sdk.connect(provider, signer)
    setIsConnected(true)
  }

  const disconnect = () => {
    sdk.disconnect()
    setIsConnected(false)
  }

  return (
    <SDKContext.Provider value={{ sdk, isConnected, connect, disconnect }}>
      {children}
    </SDKContext.Provider>
  )
}

export function useSDK() {
  const context = useContext(SDKContext)
  if (!context) {
    throw new Error('useSDK must be used within SDKProvider')
  }
  return context
}
```

**Usage:**

```typescript
// app/layout.tsx
import { SDKProvider } from '@/lib/providers/sdk-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SDKProvider>
          {children}
        </SDKProvider>
      </body>
    </html>
  )
}

// components/CreateCollection.tsx
import { useSDK } from '@/lib/providers/sdk-provider'

function CreateCollection() {
  const { sdk, isConnected } = useSDK()

  async function handleCreate() {
    if (!sdk || !isConnected) return
    await sdk.collections.create({...})
  }
}
```

**Benefits:**
- ✅ Single instance for entire app
- ✅ ABIs loaded once, cached
- ✅ State shared across components
- ✅ Excellent performance
- ✅ Easy to use (hooks)

---

### Backend Pattern (Factory + Pool)

**Pattern 1: Service/Factory (Recommended)**

```typescript
// services/sdk.service.ts
import { ZunoSDK } from 'zuno-marketplace-sdk'
import { JsonRpcProvider, Wallet } from 'ethers'

export class SDKService {
  private provider: JsonRpcProvider
  private config: {
    chainId: number
    rpcUrl: string
    hubAddress: string
  }

  constructor() {
    this.config = {
      chainId: Number(process.env.CHAIN_ID),
      rpcUrl: process.env.RPC_URL!,
      hubAddress: process.env.HUB_ADDRESS!,
    }

    // Shared provider for all
    this.provider = new JsonRpcProvider(this.config.rpcUrl)
  }

  /**
   * Create SDK instance for specific user
   * Each user gets their own instance
   */
  createUserSDK(privateKey: string): ZunoSDK {
    const sdk = new ZunoSDK(this.config)
    const wallet = new Wallet(privateKey, this.provider)

    sdk.connect(this.provider, wallet)
    return sdk
  }

  /**
   * Get admin SDK singleton
   * For server operations
   */
  private adminSDK: ZunoSDK | null = null

  getAdminSDK(): ZunoSDK {
    if (!this.adminSDK) {
      this.adminSDK = new ZunoSDK(this.config)
      const adminWallet = new Wallet(
        process.env.ADMIN_PRIVATE_KEY!,
        this.provider
      )
      this.adminSDK.connect(this.provider, adminWallet)
    }
    return this.adminSDK
  }
}

export const sdkService = new SDKService()
```

**Usage in API routes:**

```typescript
// routes/collections.ts
import { sdkService } from '../services/sdk.service'

// User creates collection (uses user's wallet)
app.post('/api/collections', async (req, res) => {
  const { userId } = req.user

  // Get user's private key from database
  const user = await db.users.findById(userId)
  const privateKey = decrypt(user.encryptedPrivateKey)

  // Create SDK instance for this user
  const userSDK = sdkService.createUserSDK(privateKey)

  // Create collection
  const collection = await userSDK.collections.create({
    name: req.body.name,
    symbol: req.body.symbol,
    tokenType: 'ERC721',
  })

  res.json({ collection })
})

// Admin verifies collection (uses admin wallet)
app.post('/api/admin/collections/:id/verify', async (req, res) => {
  const adminSDK = sdkService.getAdminSDK()

  await adminSDK.admin.verifyCollection(req.params.id)

  res.json({ success: true })
})
```

**Pattern 2: Connection Pool (High Performance)**

```typescript
// services/sdk-pool.service.ts
import { ZunoSDK } from 'zuno-marketplace-sdk'
import { JsonRpcProvider, Wallet } from 'ethers'

export class SDKPoolService {
  private pool: ZunoSDK[] = []
  private available: ZunoSDK[] = []
  private inUse: Set<ZunoSDK> = new Set()
  private maxPoolSize = 10

  constructor() {
    this.initializePool()
  }

  private async initializePool() {
    const provider = new JsonRpcProvider(process.env.RPC_URL!)

    for (let i = 0; i < this.maxPoolSize; i++) {
      const sdk = new ZunoSDK({
        chainId: Number(process.env.CHAIN_ID),
        rpcUrl: process.env.RPC_URL!,
        hubAddress: process.env.HUB_ADDRESS!,
      })

      const wallet = new Wallet(process.env.SERVER_PRIVATE_KEY!, provider)
      await sdk.connect(provider, wallet)

      this.pool.push(sdk)
      this.available.push(sdk)
    }
  }

  async acquire(): Promise<ZunoSDK> {
    if (this.available.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
      return this.acquire()
    }

    const sdk = this.available.pop()!
    this.inUse.add(sdk)
    return sdk
  }

  release(sdk: ZunoSDK) {
    this.inUse.delete(sdk)
    this.available.push(sdk)
  }

  async withSDK<T>(fn: (sdk: ZunoSDK) => Promise<T>): Promise<T> {
    const sdk = await this.acquire()
    try {
      return await fn(sdk)
    } finally {
      this.release(sdk)
    }
  }
}

export const sdkPool = new SDKPoolService()
```

**Usage:**

```typescript
// routes/listings.ts
import { sdkPool } from '../services/sdk-pool.service'

app.get('/api/listings', async (req, res) => {
  const listings = await sdkPool.withSDK(async (sdk) => {
    return await sdk.marketplace.getListings({
      collection: req.query.collection,
      status: 'ACTIVE',
    })
  })

  res.json({ listings })
})
```

---

## Frontend vs Backend Usage

### Comparison Table

| Aspect | Frontend | Backend |
|--------|----------|---------|
| **Pattern** | Singleton + Provider | Factory + Pool |
| **Instances** | 1 per app | Multiple (per user/request) |
| **Wallet** | Browser wallet (MetaMask) | Private keys |
| **State** | Persistent (session) | Stateless (mostly) |
| **Initialization** | Once at app start | Per request or pooled |
| **Context** | React Context | Service/Factory class |

### Environment-Specific Optimizations

```typescript
class ZunoSDK {
  private isBrowser: boolean
  private isNode: boolean

  constructor(config: SDKConfig) {
    // Auto-detect environment
    this.isBrowser = typeof window !== 'undefined'
    this.isNode = typeof process !== 'undefined'

    if (this.isBrowser) {
      this.setupBrowserOptimizations()
    } else if (this.isNode) {
      this.setupNodeOptimizations()
    }
  }

  private setupBrowserOptimizations() {
    // Use IndexedDB for caching
    this.cache = new IndexedDBCache()

    // Listen to wallet events
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', this.handleAccountChange)
      window.ethereum.on('chainChanged', this.handleChainChange)
    }
  }

  private setupNodeOptimizations() {
    // Use memory cache or Redis
    this.cache = new MemoryCache()

    // Connection pooling
    this.provider = new JsonRpcProvider(this.config.rpcUrl, {
      staticNetwork: true, // Performance boost
    })
  }
}
```

---

## Publishing Workflow

### Step 1: Prepare Package

```bash
cd zuno-marketplace-sdk/

# Build
npm run build

# Test
npm run test

# Lint
npm run lint

# Test package locally
npm pack
```

### Step 2: Publish to npm

```bash
# Login (first time)
npm login

# Publish public package
npm publish --access public

# Or scoped package
npm publish --access public --scope @zuno
```

### Step 3: Install in Projects

```bash
# In any project
npm install zuno-marketplace-sdk

# Or with scope
npm install @zuno/marketplace-sdk
```

### Version Management

**Semantic Versioning:**

```
1.2.3
│ │ └─ PATCH: Bug fixes (backward compatible)
│ └─── MINOR: New features (backward compatible)
└───── MAJOR: Breaking changes
```

**Examples:**

```bash
# Bug fix: 1.0.0 -> 1.0.1
npm version patch

# New feature: 1.0.1 -> 1.1.0
npm version minor

# Breaking change: 1.1.0 -> 2.0.0
npm version major

# Publish
npm publish
```

### Distribution Strategies

1. **NPM Registry (Public)**
   ```bash
   npm publish --access public
   # → https://npmjs.com/package/zuno-marketplace-sdk
   ```

2. **GitHub Packages**
   ```bash
   npm publish --registry=https://npm.pkg.github.com
   # → https://github.com/ZunoKit/zuno-marketplace-sdk/packages
   ```

3. **Git Direct**
   ```json
   {
     "dependencies": {
       "zuno-marketplace-sdk": "github:ZunoKit/zuno-marketplace-sdk#main"
     }
   }
   ```

4. **CDN (Browser)**
   ```html
   <script type="module">
     import { ZunoSDK } from 'https://esm.sh/zuno-marketplace-sdk'
   </script>
   ```

---

## Advanced Features

### 1. Multi-Source ABI Loading

```typescript
const sdk = new ZunoSDK({
  abiStrategy: 'hybrid',
  abiSources: [
    // Priority 1: Local bundle (fastest)
    { type: 'local', abis: {...} },

    // Priority 2: NPM package (versioned)
    { type: 'package', package: '@zuno/abis@1.0.0' },

    // Priority 3: CDN (cached)
    { type: 'cdn', url: 'https://cdn.zuno.io/abis/v1' },

    // Priority 4: API (always latest)
    { type: 'api', url: 'https://api.zuno.io/abis', key: '...' },

    // Priority 5: On-chain (ultimate fallback)
    { type: 'on-chain', resolver: '0x...' }
  ]
})
```

### 2. Plugin System

```typescript
import { AnalyticsPlugin, IPFSPlugin } from '@zuno/plugins'

const sdk = new ZunoSDK({
  plugins: [
    new AnalyticsPlugin({
      trackTransactions: true,
    }),
    new IPFSPlugin({
      gateway: 'https://ipfs.io/ipfs/',
    })
  ]
})

// Use plugins
await sdk.ipfs.uploadMetadata({ name: 'My NFT' })
sdk.analytics.trackEvent('collection_created')
```

### 3. Type-Safe Events

```typescript
// Type-safe event listeners
sdk.collections.on('created', (event: CollectionCreatedEvent) => {
  console.log(event.address)
  console.log(event.creator)
})

// React integration
function AuctionView({ auctionId }) {
  useAuctionEvents(auctionId, {
    onBid: (bid) => updateUI(bid),
    onEnd: (result) => showWinner(result),
  })
}
```

### 4. Transaction Management

```typescript
const { execute, status, error } = useTransaction({
  name: 'Create Collection',
  operation: () => sdk.collections.create({...}),
  retry: { attempts: 3 },
  timeout: 60000,
})

return (
  <button onClick={execute} disabled={status === 'pending'}>
    {status === 'pending' ? 'Creating...' : 'Create'}
  </button>
)
```

### 5. Multi-Network Support

```typescript
const sdk = new ZunoSDK({
  networks: {
    mainnet: { chainId: 1, hubAddress: '0x...' },
    sepolia: { chainId: 11155111, hubAddress: '0x...' },
    local: { chainId: 31337, hubAddress: '0x...' },
  },
  defaultNetwork: 'mainnet',
})

// Switch network
await sdk.switchNetwork('sepolia')
```

### 6. Smart Caching

```typescript
const sdk = new ZunoSDK({
  cache: {
    enabled: true,
    strategies: {
      collections: {
        type: 'lru',
        maxSize: 100,
        ttl: 300000,
      },
      listings: {
        type: 'time-based',
        ttl: 30000,
      },
      auctions: {
        type: 'event-based',
        events: ['BidPlaced', 'AuctionEnded']
      },
    },
  }
})
```

---

## Implementation Phases

### Phase 1: Project Setup & Foundation (Week 1)

- [ ] Create repository structure
- [ ] Setup TypeScript configuration
- [ ] Configure build tools (Rollup/tsup)
- [ ] Setup testing framework (Jest/Vitest)
- [ ] Configure ESLint/Prettier
- [ ] Setup CI/CD (GitHub Actions)

### Phase 2: Core Services Extraction (Week 2-3)

**Priority 1 (Core):**
- [ ] MarketplaceHubService
- [ ] CollectionService
- [ ] ExchangeService

**Priority 2 (Extended):**
- [ ] AuctionService
- [ ] OfferService
- [ ] BundleService

**Priority 3 (Admin/Analytics):**
- [ ] FeeManagerService
- [ ] RoyaltyManagerService
- [ ] AccessControlService
- [ ] EmergencyManagerService
- [ ] ListingValidatorService
- [ ] ListingHistoryTrackerService
- [ ] CollectionVerifierService
- [ ] TimelockService
- [ ] CollectionQueryService

### Phase 3: ABI Management System (Week 3)

- [ ] ABI loader implementation
- [ ] Caching strategy
- [ ] Multi-source resolution
- [ ] Error handling

### Phase 4: React Integration (Week 4)

- [ ] ZunoSDKProvider component
- [ ] useZunoSDK hook
- [ ] useCollection hook
- [ ] useMarketplace hook
- [ ] useAuction hook
- [ ] useTransaction hook

### Phase 5: Documentation & Examples (Week 5)

- [ ] API documentation
- [ ] Getting started guide
- [ ] Node.js examples
- [ ] React examples
- [ ] Next.js examples
- [ ] Migration guide

### Phase 6: Testing & Publishing (Week 6)

- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] Bundle size optimization
- [ ] npm package configuration
- [ ] Publish to npm

---

## Migration Guide

### Before (Current)

```typescript
// ❌ Local services in app
import {
  initializeServices,
  collectionService,
  exchangeService
} from '@/lib/services/contracts'

await initializeServices(provider, signer)
await collectionService.createCollection({...})
```

### After (With SDK)

```typescript
// ✅ npm package
import { ZunoSDK } from 'zuno-marketplace-sdk'

const sdk = new ZunoSDK({
  chainId: 1,
  rpcUrl: process.env.RPC_URL!,
  hubAddress: process.env.HUB_ADDRESS!,
})

await sdk.connect(provider, signer)
await sdk.collections.create({...})
```

### React Migration

**Before:**

```typescript
// Custom initialization
useEffect(() => {
  initializeServices(provider, signer)
}, [provider, signer])
```

**After:**

```typescript
// Provider pattern
<ZunoSDKProvider config={{...}}>
  <App />
</ZunoSDKProvider>

// Use hook
const { sdk } = useZunoSDK()
```

### Benefits After Migration

- ✅ Cleaner code
- ✅ No local service maintenance
- ✅ React hooks included
- ✅ Auto-updates via npm
- ✅ Shared across projects
- ✅ Type-safe
- ✅ Well-documented

---

## Usage Examples

### Node.js Script

```typescript
import { ZunoSDK } from 'zuno-marketplace-sdk'
import { JsonRpcProvider, Wallet } from 'ethers'

const provider = new JsonRpcProvider(process.env.RPC_URL)
const wallet = new Wallet(process.env.PRIVATE_KEY, provider)

const sdk = new ZunoSDK({
  chainId: 1,
  rpcUrl: process.env.RPC_URL!,
  hubAddress: process.env.HUB_ADDRESS!,
})

await sdk.connect(provider, wallet)

const collection = await sdk.collections.create({
  name: 'My Collection',
  symbol: 'MYC',
  tokenType: 'ERC721',
})

console.log('Created:', collection.address)
```

### React App

```typescript
// App.tsx
import { ZunoSDKProvider } from 'zuno-marketplace-sdk/react'

function App() {
  return (
    <ZunoSDKProvider
      config={{
        chainId: 1,
        rpcUrl: process.env.REACT_APP_RPC_URL!,
        hubAddress: process.env.REACT_APP_HUB_ADDRESS!,
      }}
    >
      <MyApp />
    </ZunoSDKProvider>
  )
}

// Component
import { useZunoSDK } from 'zuno-marketplace-sdk/react'

function CreateNFT() {
  const { sdk, isConnected, connect } = useZunoSDK()

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <button onClick={() => sdk.collections.create({...})}>
          Create Collection
        </button>
      )}
    </div>
  )
}
```

### Next.js App

```typescript
// app/providers.tsx
'use client'

import { ZunoSDKProvider } from 'zuno-marketplace-sdk/react'

export function Providers({ children }) {
  return (
    <ZunoSDKProvider
      config={{
        chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID),
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL!,
        hubAddress: process.env.NEXT_PUBLIC_HUB_ADDRESS!,
      }}
    >
      {children}
    </ZunoSDKProvider>
  )
}

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## Checklist Before Publishing

- [ ] All 15 services extracted & tested
- [ ] Types & interfaces documented
- [ ] React hooks working
- [ ] Node.js support verified
- [ ] Examples functional
- [ ] README.md complete
- [ ] API documentation generated
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests passed
- [ ] Bundle size optimized (<100KB gzipped)
- [ ] Tree-shaking verified
- [ ] TypeScript declarations correct
- [ ] Peer dependencies configured
- [ ] License added (MIT)
- [ ] CHANGELOG.md started
- [ ] npm package configured
- [ ] GitHub repo setup
- [ ] CI/CD pipeline ready

---

## Success Metrics

### Technical

- ✅ Zero Next.js dependencies
- ✅ Works in Node.js & Browser
- ✅ Bundle size < 100KB gzipped
- ✅ Full TypeScript support
- ✅ Tree-shakeable exports

### Developer Experience

- ✅ Simple API (< 10 lines to start)
- ✅ Excellent documentation
- ✅ React hooks included
- ✅ Clear error messages
- ✅ Active examples

### Distribution

- ✅ Published on npm
- ✅ Semantic versioning
- ✅ Regular updates
- ✅ Migration guides
- ✅ Community support

---

## Conclusion

This plan provides a comprehensive roadmap for extracting the Zuno Marketplace SDK from the current monolithic application into a standalone, reusable npm package. The SDK will support both frontend and backend use cases with optimized patterns for each environment.

**Key Takeaways:**

1. **Frontend**: Use singleton pattern with React Provider
2. **Backend**: Use factory/pool patterns for multi-user scenarios
3. **Publishing**: Semantic versioning via npm
4. **Flexibility**: Support multiple environments and frameworks
5. **Developer Experience**: Simple API, excellent docs, React hooks

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Author:** Claude Code
**Status:** Planning Phase
