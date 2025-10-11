# Code Structure Guide

Complete guide to the architecture and code organization of Zuno Marketplace.

## Table of Contents

- [Project Overview](#project-overview)
- [Directory Structure](#directory-structure)
- [Architecture Patterns](#architecture-patterns)
- [Component Organization](#component-organization)
- [Service Layer](#service-layer)
- [State Management](#state-management)
- [Type System](#type-system)
- [Utilities](#utilities)
- [Best Practices](#best-practices)

## Project Overview

Zuno Marketplace follows a **feature-based architecture** with clear separation of concerns:

- **Presentation Layer**: React components (UI)
- **Business Logic Layer**: Services and hooks
- **Data Layer**: Redux store and contract integration
- **Type Layer**: TypeScript definitions

### Technology Stack

```
Frontend
├── Next.js 15.5.4 (App Router)
├── TypeScript 5.0 (Strict mode)
├── Tailwind CSS v4
└── React 19

Blockchain
├── Ethers.js v6
├── MetaMask SDK
└── Smart Contracts (Foundry)

State Management
├── Redux Toolkit
└── React Query (planned)

UI Components
├── Radix UI
├── shadcn/ui
└── Lucide Icons
```

## Directory Structure

### Complete Tree

```
zuno-marketplace-mini/
├── public/                      # Static assets
├── scripts/                     # Build and deployment scripts
│   └── extract-abis.js         # ABI extraction from contracts
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── explore/            # Explore page
│   │   ├── collections/        # Collections pages
│   │   ├── nft/                # NFT detail pages
│   │   ├── create/             # Creation pages
│   │   ├── profile/            # User profile
│   │   ├── admin/              # Admin dashboard
│   │   └── api/                # API routes (if needed)
│   ├── components/
│   │   ├── common/             # Shared components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ConnectWallet.tsx
│   │   │   └── ...
│   │   ├── features/           # Feature-specific components
│   │   │   ├── nft/
│   │   │   │   ├── NFTCard.tsx
│   │   │   │   ├── NFTGrid.tsx
│   │   │   │   └── NFTDetail.tsx
│   │   │   ├── marketplace/
│   │   │   │   ├── ListingForm.tsx
│   │   │   │   ├── BuyModal.tsx
│   │   │   │   └── ...
│   │   │   ├── auction/
│   │   │   ├── collection/
│   │   │   ├── offer/
│   │   │   └── bundle/
│   │   └── ui/                 # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── contracts/          # Smart contract integration
│   │   │   ├── abis/          # Auto-generated ABIs
│   │   │   │   ├── MarketplaceHub.json
│   │   │   │   ├── ERC721NFTExchange.json
│   │   │   │   └── index.ts   # TypeScript exports
│   │   │   └── addresses.ts   # Contract addresses
│   │   ├── services/
│   │   │   ├── contracts/     # Contract services
│   │   │   │   ├── MarketplaceHubService.ts
│   │   │   │   ├── ExchangeService.ts
│   │   │   │   ├── AuctionService.ts
│   │   │   │   ├── BundleService.ts
│   │   │   │   ├── OfferService.ts
│   │   │   │   ├── CollectionService.ts
│   │   │   │   └── index.ts   # Service exports & init
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useWeb3.ts
│   │   │   ├── useContract.ts
│   │   │   ├── useNFT.ts
│   │   │   └── index.ts
│   │   ├── utils/             # Utility functions
│   │   │   ├── index.ts       # Main utilities
│   │   │   ├── web3.ts        # Web3 utilities
│   │   │   └── ...
│   │   ├── constants/         # App constants
│   │   │   └── index.ts
│   │   ├── store/             # Redux store
│   │   │   ├── index.ts
│   │   │   ├── slices/
│   │   │   │   ├── walletSlice.ts
│   │   │   │   ├── nftSlice.ts
│   │   │   │   └── ...
│   │   │   └── hooks.ts
│   │   └── config/            # Configuration
│   │       └── web3.ts
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   └── styles/                # Global styles
│       └── globals.css
├── .env.example               # Environment template
├── .env.local                 # Local environment (gitignored)
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

### Key Directories Explained

#### `/src/app` - Application Pages

Next.js 15 App Router structure. Each folder is a route.

```typescript
// src/app/nft/[id]/page.tsx
export default async function NFTDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <NFTDetail tokenId={params.id} />;
}
```

#### `/src/components` - UI Components

Three-tier component organization:

1. **common**: Shared across all features (Header, Footer, etc.)
2. **features**: Domain-specific components (NFT, Marketplace, etc.)
3. **ui**: Base UI components from shadcn/ui

```typescript
// components/features/nft/NFTCard.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NFTCard({ nft }: { nft: NFT }) {
  return <Card>{/* NFT card content */}</Card>;
}
```

#### `/src/lib/contracts` - Contract Integration

Auto-generated ABIs and address configuration.

```typescript
// lib/contracts/abis/index.ts (auto-generated)
export { default as MarketplaceHub_ABI } from "./MarketplaceHub.json";
export { default as ERC721NFTExchange_ABI } from "./ERC721NFTExchange.json";
// ... 16+ more exports

// lib/contracts/addresses.ts
export const CONTRACT_ADDRESSES = {
  11155111: {
    MARKETPLACE_HUB: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA || "",
  },
  31337: {
    MARKETPLACE_HUB: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL || "",
  },
};
```

#### `/src/lib/services` - Business Logic

Contract services for blockchain integration.

```typescript
// lib/services/contracts/index.ts
export { exchangeService } from "./ExchangeService";
export { auctionService } from "./AuctionService";
// ... more exports

export async function initializeServices(provider: any, signer?: any) {
  await marketplaceHubService.initialize(provider, signer);
  await Promise.all([
    exchangeService.initialize(provider, signer),
    auctionService.initialize(provider, signer),
    // ...
  ]);
}
```

#### `/src/lib/hooks` - Custom Hooks

React hooks for common functionality.

```typescript
// lib/hooks/useWeb3.ts
export function useWeb3() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const connect = useCallback(async () => {
    await web3Utils.initializeProvider();
    const acc = await web3Utils.getAccount();
    setAccount(acc);
  }, []);

  return { account, chainId, connect, disconnect };
}
```

#### `/src/types` - Type Definitions

Centralized TypeScript types.

```typescript
// types/index.ts
export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  tokenType: "ERC721" | "ERC1155";
  name: string;
  image: string;
  // ...
}

export interface Listing {
  id: string;
  nftContract: string;
  tokenId: string;
  seller: string;
  price: string;
  status: ListingStatus;
}
```

## Architecture Patterns

### 1. MarketplaceHub Pattern

**Problem**: Managing 15+ contract addresses is complex and error-prone.

**Solution**: Single Hub contract provides all addresses.

```typescript
// Before: 15+ addresses
const ERC721_EXCHANGE = process.env.NEXT_PUBLIC_ERC721_EXCHANGE;
const ERC1155_EXCHANGE = process.env.NEXT_PUBLIC_ERC1155_EXCHANGE;
const ENGLISH_AUCTION = process.env.NEXT_PUBLIC_ENGLISH_AUCTION;
// ... 12+ more

// After: 1 address
const MARKETPLACE_HUB = process.env.NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL;

// Hub provides all addresses
const addresses = await marketplaceHubService.getAllAddresses();
```

### 2. Singleton Services

**Pattern**: Single instance of each service, initialized once.

```typescript
// Service definition
export class ExchangeService {
  private static instance: ExchangeService;
  // ... service methods
}

// Singleton export
export const exchangeService = new ExchangeService();

// Usage anywhere
import { exchangeService } from "@/lib/services/contracts";
await exchangeService.createListing({ ... });
```

### 3. Factory Pattern for Contracts

**Pattern**: Dynamic contract instantiation based on token type.

```typescript
class ExchangeService {
  private getExchangeContract(tokenType: "ERC721" | "ERC1155") {
    const address =
      tokenType === "ERC721"
        ? marketplaceHubService.getERC721Exchange()
        : marketplaceHubService.getERC1155Exchange();

    const abi =
      tokenType === "ERC721" ? ERC721NFTExchange_ABI : ERC1155NFTExchange_ABI;

    return new ethers.Contract(address, abi, this.signer);
  }
}
```

### 4. Provider Pattern for Web3

**Pattern**: Centralized Web3 provider management.

```typescript
// lib/utils/web3.ts
class Web3Utils {
  private provider: BrowserProvider | null = null;
  private signer: Signer | null = null;

  async initializeProvider() {
    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();

    // Initialize all services
    await initializeServices(this.provider, this.signer);
  }
}

export const web3Utils = new Web3Utils();
```

### 5. Hook Pattern for Components

**Pattern**: Custom hooks encapsulate complex logic.

```typescript
// Instead of this in component:
const [account, setAccount] = useState(null);
const [chainId, setChainId] = useState(null);
useEffect(() => {
  // Complex initialization
}, []);

// Use this:
const { account, chainId, connect } = useWeb3();
```

## Component Organization

### Feature-Based Components

Components organized by feature, not by type.

```
✅ Good (Feature-based)
components/
├── features/
│   ├── nft/
│   │   ├── NFTCard.tsx
│   │   ├── NFTGrid.tsx
│   │   ├── NFTDetail.tsx
│   │   └── NFTFilters.tsx
│   ├── marketplace/
│   │   ├── ListingForm.tsx
│   │   ├── ListingCard.tsx
│   │   └── BuyModal.tsx

❌ Bad (Type-based)
components/
├── cards/
│   ├── NFTCard.tsx
│   └── ListingCard.tsx
├── forms/
│   └── ListingForm.tsx
├── modals/
│   └── BuyModal.tsx
```

### Component Structure

Each feature component follows this structure:

```typescript
// components/features/nft/NFTCard.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { NFT } from "@/types";

interface NFTCardProps {
  nft: NFT;
  onBuy?: (nft: NFT) => void;
}

export function NFTCard({ nft, onBuy }: NFTCardProps) {
  return (
    <Card>
      <img src={nft.image} alt={nft.name} />
      <h3>{nft.name}</h3>
      <p>{nft.price} ETH</p>
      {onBuy && <Button onClick={() => onBuy(nft)}>Buy Now</Button>}
    </Card>
  );
}
```

### Server vs Client Components

Next.js 15 App Router distinction:

```typescript
// Server Component (default)
// app/collections/page.tsx
export default async function CollectionsPage() {
  // Can fetch data directly
  const collections = await fetchCollections();
  return <CollectionGrid collections={collections} />;
}

// Client Component (uses hooks, events)
// components/features/marketplace/BuyModal.tsx
("use client");

import { useState } from "react";
import { exchangeService } from "@/lib/services/contracts";

export function BuyModal({ listing }: { listing: Listing }) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    await exchangeService.buyListing(
      listing.id,
      listing.tokenType,
      listing.price
    );
    setLoading(false);
  };

  return (
    <Dialog>
      {/* Modal content */}
      <Button onClick={handleBuy} disabled={loading}>
        {loading ? "Processing..." : "Buy Now"}
      </Button>
    </Dialog>
  );
}
```

## Service Layer

### Service Responsibilities

Each service handles a specific domain:

| Service                 | Responsibility                 |
| ----------------------- | ------------------------------ |
| `MarketplaceHubService` | Address discovery, central hub |
| `ExchangeService`       | NFT listings, buying, selling  |
| `AuctionService`        | English & Dutch auctions       |
| `CollectionService`     | NFT collections, factories     |
| `BundleService`         | NFT bundles                    |
| `OfferService`          | Offers on NFTs/collections     |

### Service Interface

All services follow this interface:

```typescript
interface ContractService {
  initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void>;
  // ... domain-specific methods
}
```

### Service Initialization

Centralized initialization via `initializeServices()`:

```typescript
// lib/services/contracts/index.ts
export async function initializeServices(
  provider: any,
  signer?: any
): Promise<void> {
  // 1. Initialize Hub first (provides addresses)
  await marketplaceHubService.initialize(provider, signer);

  // 2. Initialize all other services in parallel
  await Promise.all([
    exchangeService.initialize(provider, signer),
    auctionService.initialize(provider, signer),
    bundleService.initialize(provider, signer),
    offerService.initialize(provider, signer),
    collectionService.initialize(provider, signer),
  ]);
}
```

### Service Usage Pattern

```typescript
// 1. Import service
import { exchangeService } from "@/lib/services/contracts";

// 2. Use anywhere (after initialization)
async function createListing() {
  try {
    const tx = await exchangeService.createListing({
      contractAddress: "0x...",
      tokenId: "1",
      price: "1.0",
      duration: "7",
      tokenType: "ERC721",
    });

    await tx.wait();
  } catch (error) {
    console.error("Failed to create listing:", error);
  }
}
```

## State Management

### Redux Store Structure

```typescript
// lib/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import walletReducer from "./slices/walletSlice";
import nftReducer from "./slices/nftSlice";
import marketplaceReducer from "./slices/marketplaceSlice";

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    nft: nftReducer,
    marketplace: marketplaceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Example Slice

```typescript
// lib/store/slices/walletSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
}

const initialState: WalletState = {
  account: null,
  chainId: null,
  isConnected: false,
};

export const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setAccount: (state, action: PayloadAction<string | null>) => {
      state.account = action.payload;
      state.isConnected = action.payload !== null;
    },
    setChainId: (state, action: PayloadAction<number | null>) => {
      state.chainId = action.payload;
    },
    disconnect: (state) => {
      state.account = null;
      state.chainId = null;
      state.isConnected = false;
    },
  },
});

export const { setAccount, setChainId, disconnect } = walletSlice.actions;
export default walletSlice.reducer;
```

### Typed Hooks

```typescript
// lib/store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Usage in Components

```typescript
"use client";

import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { setAccount } from "@/lib/store/slices/walletSlice";

export function WalletInfo() {
  const { account, isConnected } = useAppSelector((state) => state.wallet);
  const dispatch = useAppDispatch();

  return (
    <div>
      {isConnected ? (
        <p>Connected: {account}</p>
      ) : (
        <button onClick={() => dispatch(setAccount("0x..."))}>Connect</button>
      )}
    </div>
  );
}
```

## Type System

### Type Organization

All types in `src/types/index.ts`:

```typescript
// NFT Types
export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  tokenType: "ERC721" | "ERC1155";
  name: string;
  description: string;
  image: string;
  owner: string;
  creator: string;
}

// Marketplace Types
export interface Listing {
  id: string;
  nftContract: string;
  tokenId: string;
  seller: string;
  price: string;
  status: ListingStatus;
  expiresAt: number;
}

export enum ListingStatus {
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

// Service Parameter Types
export interface ListingParams {
  contractAddress: string;
  tokenId: string;
  price: string;
  duration: string;
  tokenType: "ERC721" | "ERC1155";
  amount?: number;
}

export interface EnglishAuctionParams {
  nftContract: string;
  tokenId: string;
  tokenType: "ERC721" | "ERC1155";
  startingBid: string;
  reservePrice: string;
  duration: string;
  amount?: number;
}
```

### Type Imports

```typescript
// Always import from central location
import type { NFT, Listing, ListingParams } from "@/types";

// Not from specific files
// ❌ import type { NFT } from "@/types/nft";
```

## Utilities

### Utility Organization

```typescript
// lib/utils/index.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatters
export const formatters = {
  formatEth(amount: bigint | string, decimals = 4): string {
    return parseFloat(ethers.formatEther(amount)).toFixed(decimals);
  },

  formatNumber(num: number | string): string {
    return new Intl.NumberFormat().format(Number(num));
  },

  formatDate(timestamp: number | Date): string {
    return new Date(timestamp).toLocaleDateString();
  },

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },
};

// Validators
export const validators = {
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  },

  isValidTxHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  },
};
```

### Constants

```typescript
// lib/constants/index.ts
export const SUPPORTED_CHAIN_IDS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
  LOCAL: 31337,
} as const;

export const CHAIN_NAMES = {
  [SUPPORTED_CHAIN_IDS.MAINNET]: "Ethereum Mainnet",
  [SUPPORTED_CHAIN_IDS.SEPOLIA]: "Sepolia Testnet",
  [SUPPORTED_CHAIN_IDS.LOCAL]: "Local Network",
} as const;

export const BPS_DENOMINATOR = 10000;
export const DEFAULT_PLATFORM_FEE_BPS = 200; // 2%

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet",
  WRONG_NETWORK: "Please switch to the correct network",
  TRANSACTION_FAILED: "Transaction failed",
  INSUFFICIENT_BALANCE: "Insufficient balance",
} as const;
```

## Best Practices

### 1. File Naming

```
✅ Good
- PascalCase for components: NFTCard.tsx, ListingForm.tsx
- camelCase for utilities: web3.ts, formatters.ts
- lowercase for configs: next.config.js, tailwind.config.ts

❌ Bad
- nft-card.tsx, listing_form.tsx (inconsistent casing)
```

### 2. Import Organization

```typescript
// 1. External libraries
import { useState, useEffect } from "react";
import { ethers } from "ethers";

// 2. Internal absolute imports (using @/)
import { Button } from "@/components/ui/button";
import { exchangeService } from "@/lib/services/contracts";
import type { NFT } from "@/types";

// 3. Relative imports (if necessary)
import { localHelper } from "./helpers";
```

### 3. Component Props

```typescript
// ✅ Good: Interface for props
interface NFTCardProps {
  nft: NFT;
  onBuy?: (nft: NFT) => void;
  variant?: "default" | "compact";
}

export function NFTCard({ nft, onBuy, variant = "default" }: NFTCardProps) {
  // ...
}

// ❌ Bad: Inline props
export function NFTCard({
  nft,
  onBuy,
  variant = "default",
}: {
  nft: NFT;
  onBuy?: (nft: NFT) => void;
  variant?: "default" | "compact";
}) {
  // ...
}
```

### 4. Error Handling

```typescript
// ✅ Good: Specific error handling
try {
  const tx = await exchangeService.createListing(params);
  await tx.wait();
} catch (error: any) {
  if (error.code === "ACTION_REJECTED") {
    toast.error("Transaction rejected");
  } else if (error.message.includes("insufficient funds")) {
    toast.error("Insufficient balance");
  } else {
    toast.error("Transaction failed");
    console.error(error);
  }
}

// ❌ Bad: Generic error handling
try {
  const tx = await exchangeService.createListing(params);
  await tx.wait();
} catch (error) {
  console.log("Error:", error);
}
```

### 5. Async/Await

```typescript
// ✅ Good: Proper async/await
async function buyNFT(listingId: string) {
  const tx = await exchangeService.buyListing(listingId, "ERC721", "1.0");
  await tx.wait();
  console.log("Purchase complete");
}

// ❌ Bad: Promise chains
function buyNFT(listingId: string) {
  exchangeService
    .buyListing(listingId, "ERC721", "1.0")
    .then((tx) => tx.wait())
    .then(() => console.log("Purchase complete"));
}
```

### 6. Type Safety

```typescript
// ✅ Good: Full type annotations
const nfts: NFT[] = await fetchNFTs();
const listing: Listing | null = await getListingById(id);

// ❌ Bad: Any types
const nfts: any = await fetchNFTs();
const listing = await getListingById(id);
```

## Summary

The code structure follows these principles:

1. **Feature-Based Organization**: Group by domain, not by type
2. **Separation of Concerns**: Clear layers (UI, logic, data)
3. **Type Safety**: Full TypeScript coverage
4. **Singleton Services**: Initialize once, use everywhere
5. **Centralized Configuration**: Single source of truth
6. **Clean Architecture**: Easy to test and maintain

For contract integration details, see [Contract Integration Guide](./CONTRACT_INTEGRATION.md).

For setup instructions, see [Setup Guide](./SETUP_GUIDE.md).
