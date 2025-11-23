# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zuno Marketplace is a production-ready NFT marketplace built with Next.js 15, TypeScript, and smart contract integration. The project uses the **MarketplaceHub Pattern** - a single contract entry point that provides addresses for all other contracts.

**Sister Repository**: `zuno-marketplace-contracts` (Foundry project with smart contracts)

## Key Architecture Principles

### 0. Zuno Marketplace SDK Integration (v1.1.4)

**IMPORTANT**: This project uses the official `zuno-marketplace-sdk` package (v1.1.4) for all blockchain interactions.

**SDK Features**:
- Built-in Wagmi & React Query integration
- Automatic ABI management with smart caching
- Type-safe React hooks for all marketplace operations
- Standardized transaction responses with `{ tx: TransactionReceipt, ...data }` format
- Complete query methods and mutation methods
- Standardized naming: `collectionAddress` (not `nftAddress`)

**Hook Usage**:
```typescript
// Direct SDK hooks (required)
import { useExchange, useCollection, useAuction } from "zuno-marketplace-sdk/react";

// Hooks provide automatic loading states, error handling, and caching
const { listNFT, buyNFT, cancelListing } = useExchange();
const { createERC721, mintERC721 } = useCollection();
const { createEnglishAuction, placeBid } = useAuction();

// Usage with React Query features
await listNFT.mutateAsync({
  collectionAddress: "0x...",
  tokenId: "1",
  price: "1.5",
  duration: 86400
});

// Access loading and error states
if (listNFT.isPending) return <Loading />;
if (listNFT.isError) return <Error error={listNFT.error} />;
```

**Migration Status**:
- ✅ SDK updated to v1.1.4 (from v1.0.2 → v1.1.3 → v1.1.4)
- ✅ All custom services removed (`exchangeService`, `collectionService`, `auctionService`)
- ✅ All components migrated to SDK hooks
- ✅ Redux store simplified (only wallet and notification slices remain)
- ✅ Full SDK v1.1.4 API usage (query methods, standardized responses)

**SDK Documentation**: See `E:\zuno-marketplace-sdk\docs\API.md`

### 1. MarketplaceHub Pattern

- **Single address per network** - All contract discovery happens through MarketplaceHub
- MarketplaceHub provides `getAllAddresses()` to retrieve all contract addresses dynamically
- Environment only needs one variable per network: `NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL`
- Supports local (chainId: 31337), Sepolia (11155111), and Mainnet (1)

### 2. SDK Architecture Pattern (Replaces Service Layer)

**Note**: The custom service layer has been completely removed in favor of the official SDK.

**SDK Module Architecture**:
- **ExchangeModule** - NFT marketplace trading operations (listings, purchases)
- **AuctionModule** - English and Dutch auction support
- **CollectionModule** - NFT collection creation and minting

**Key SDK Features (v1.1.4)**:
- **React Query Integration**: Automatic caching, refetching, and optimistic updates
- **Wagmi Integration**: Seamless wallet connection and provider management
- **Type Safety**: Full TypeScript support with strict mode
- **Standardized Responses**: All mutations return `{ tx: TransactionReceipt, ...additionalData }`
- **Built-in Error Handling**: User-friendly error messages and recovery
- **Query Methods**: Imperative data fetching alongside hooks

**Usage Pattern**:
```typescript
// All blockchain interactions go through SDK hooks
const { listNFT } = useExchange(); // For mutations
const { data: listings } = useListings(address, page, size); // For queries

// No more custom services needed
// Old: await exchangeService.listNFT(params)
// New: await listNFT.mutateAsync(params)
```

### 3. Contract ABI Management

**Dynamic ABI Loading from API** (Production):

- ABIs are fetched from Zuno Marketplace ABIs API at runtime
- Managed by `ABIManager` in `src/lib/contracts/abi-manager.ts`
- Automatic caching with TanStack React Query (1-hour stale time, 24-hour cache)
- **Configuration**: Set `NEXT_PUBLIC_ZUNO_API_URL` and `NEXT_PUBLIC_ZUNO_API_KEY` in `.env`

**Usage in Services**:
```typescript
import { getContractABI } from "@/lib/contracts/abi-manager";

// Fetch ABI and create contract
const abi = await getContractABI("UserHub");
const contract = new ethers.Contract(address, abi, signer);
```

**Usage in React Components**:
```typescript
import { useContractABIByName } from "@/lib/hooks/useContractABI";

const { data: contractABI, isLoading } = useContractABIByName("UserHub");
```

**Benefits**:
- No hardcoded ABIs in bundle (smaller bundle size)
- Automatic updates when contracts are upgraded
- Single source of truth from API
- Built-in versioning and rollback support

### 4. Development Modes

**Local Development** (requires Anvil + deployed contracts):

```bash
# Terminal 1: Start local blockchain
anvil --port 8545

# Terminal 2: Deploy contracts (in zuno-marketplace-contracts)
cd ../zuno-marketplace-contracts
make deploy-all-local

# Terminal 3: Run the application
cd ../zuno-marketplace-mini
npm run dev:local
```

**Testnet Development**:

```bash
npm run dev:testnet  # Uses Sepolia (chain ID 11155111)
```

### 5. Runtime Environment Configuration

The app includes a Settings Modal for runtime configuration management:

- **Location**: Click ⚙️ Settings button in header
- **Storage**: `localStorage` with key `zuno-marketplace-env-config`
- **Priority**: localStorage > process.env
- **Features**: Import/paste/export .env files, validation, reset to defaults
- **Use Cases**: Deployed apps, quick network switching, team collaboration

**Configuration Manager API**:

```typescript
import { envConfigManager } from "@/lib/utils/env-config";

// Get current config (localStorage > process.env)
const config = envConfigManager.getConfig();

// Set config (saves to localStorage + reloads page)
envConfigManager.setConfig({
  NEXT_PUBLIC_DEFAULT_CHAIN_ID: "31337",
  NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL: "0x...",
  NEXT_PUBLIC_RPC_URL_LOCAL: "http://127.0.0.1:8545",
});

// Get RPC URL for specific chain
const rpcUrl = envConfigManager.getRpcUrl(31337);

// Clear config (removes localStorage + reloads page)
envConfigManager.clearConfig();
```

### 6. Production-Ready Logging System

The project uses a custom logger utility instead of `console.log` statements:

- **ESLint Enforcement**: `no-console: "error"` rule prevents direct console usage
- **Structured Logging**: Context-aware logging with component and action tracking
- **Performance Tracking**: Built-in timer functionality
- **Production Ready**: Automatic error monitoring integration (Sentry ready)
- **Development/Production Modes**: Different logging behavior per environment

### 7. Service Architecture Patterns (Refactored)

The codebase has been refactored to follow modern service architecture patterns:

**BaseContractService Pattern**:
- All services extend `BaseContractService` abstract class
- Standardizes initialization, provider/signer management, contract instantiation
- Eliminates 1,400+ lines of duplicate code across 20+ services
- Located in `src/lib/services/contracts/base/BaseContractService.ts`

**Utility Libraries**:
- `ContractValidator` - Input validation for addresses, prices, token IDs, durations
- `ContractErrorFormatter` - Converts ethers.js errors to user-friendly messages
- `CryptoFormatter` - Standardizes formatting for prices, fees, percentages, timestamps
- `StatusMapper` - Maps numeric contract status codes to human-readable strings
- `BatchQueries` - Performance optimization utilities for parallel operations
- `PerformanceMonitor` - Tracks and analyzes service performance

**Type Safety**:
- Comprehensive type definitions in `src/types/contract-types.ts`
- Zero `any` types - strict TypeScript enforcement
- Type guards for runtime type checking

**Validation Layers**:
- `ContractValidator` - Low-level input validation
- `ServiceValidator` - High-level business logic validation
- Pre-transaction validation prevents failed transactions

**Documentation**:
- JSDoc standards in `docs/JSDOC-STANDARDS.md`
- Testing guide in `docs/TESTING-GUIDE.md`
- Complete refactoring summary in `docs/REFACTORING-SUMMARY.md`
- Migration guides for updating existing services

**Logger Usage**:

```typescript
import { logger } from "@/lib/utils/logger";

// Basic logging
logger.info(
  "User action completed",
  { userId: "0x123..." },
  {
    component: "UserProfile",
    action: "updateProfile",
  }
);

// Performance tracking
logger.startTimer("api-call");
// ... API call
logger.endTimer("api-call", "API call completed");

// Error logging with context
logger.error("Failed to create listing", error, {
  component: "ListingForm",
  action: "createListing",
});

// Context management
logger.setGlobalContext({ userId: "0x123...", sessionId: "abc..." });
```

**Logger Features**:

- ✅ Structured logging with context
- ✅ Performance tracking with timers
- ✅ Production/development mode handling
- ✅ Error monitoring integration (Sentry ready)
- ✅ Log history and filtering
- ✅ ESLint enforcement (no-console rule)

## Common Development Tasks

### Build & Development

```bash
npm run dev              # Development with Turbopack
npm run dev:local        # Start with local network (Chain ID: 31337)
npm run dev:testnet      # Start with Sepolia testnet (Chain ID: 11155111)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run type-check       # TypeScript type checking
```

### Utility Scripts

### Working with Contracts

**When contracts are updated**:

1. Deploy new contracts in `zuno-marketplace-contracts`
2. Copy MarketplaceHub address to `.env.local` or Settings Modal
3. Restart dev server

**Service initialization pattern**:

```typescript
import { initializeServices } from '@/lib/services/contracts';
import { BrowserProvider } from 'ethers';

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Initialize all services (MarketplaceHub must go first)
await initializeServices(provider, signer);

// Now use any service
import { exchangeService } from '@/lib/services/contracts';
await exchangeService.listNFT({ ... });
```

**Common service patterns**:

```typescript
// Pattern 1: Check before transaction
const validation = await listingValidatorService.validateListing(
  listing,
  userAddress
);
if (!validation.isValid) throw new Error(validation.errors);

// Pattern 2: Calculate fees first
const fees = await marketplaceHubService.calculateFees(
  nftAddress,
  tokenId,
  salePrice
);

// Pattern 3: Check permissions
const hasRole = await accessControlService.hasRole(role, userAddress);

// Pattern 4: Use validators before calling services
import { ContractValidator } from '@/lib/utils/validators';
ContractValidator.validateAddress(nftAddress, "NFT Address");
ContractValidator.validatePrice(price, "Listing Price");

// Pattern 5: Format contract data for display
import { CryptoFormatter } from '@/lib/utils/crypto-formatter';
import { StatusMapper } from '@/lib/utils/status-mappers';
const displayPrice = CryptoFormatter.formatPrice(priceInWei, 4, true); // "1.2345 ETH"
const status = StatusMapper.mapListingStatus(statusCode); // "ACTIVE"

// Pattern 6: Handle errors gracefully
import { ContractErrorFormatter } from '@/lib/utils/contract-errors';
try {
  await exchangeService.listNFT({ ... });
} catch (error) {
  const userError = ContractErrorFormatter.format(error);
  throw userError; // User-friendly error message
}

// Pattern 7: Batch queries for performance
import { BatchQueries } from '@/lib/utils/batch-queries';
const results = await BatchQueries.executeParallel(
  listings.map(id => () => exchangeService.getListing(id))
);
```

### Adding a New Feature

1. Create component in `src/components/features/{feature-name}/`
2. Add types in `src/types/`
3. Create/update service in `src/lib/services/contracts/` if contract interaction needed
4. Add Redux slice in `src/lib/store/` if global state needed
5. Create page in `src/app/{route}/page.tsx`

### Testing

**Testing Guide**: See `docs/TESTING-GUIDE.md` for comprehensive testing documentation.

**Testing Framework**:
- **Unit Tests**: Vitest for service and utility testing
- **Integration Tests**: Testing complete user flows with mocked contracts
- **E2E Tests**: Playwright for browser automation
- **Coverage Target**: 80%+ for critical paths

**Quick Testing Examples**:

```typescript
// Unit test - validators
import { ContractValidator } from '@/lib/utils/validators';
describe('ContractValidator', () => {
  it('should validate Ethereum addresses', () => {
    expect(() => ContractValidator.validateAddress('0x123')).toThrow();
    expect(() => ContractValidator.validateAddress('0x' + '1'.repeat(40))).not.toThrow();
  });
});

// Integration test - service operations
import { exchangeService } from '@/lib/services/contracts';
it('should create and retrieve a listing', async () => {
  const listingId = await exchangeService.listNFT({ ... });
  const listing = await exchangeService.getListing(listingId);
  expect(listing.seller).toBe(userAddress);
});
```

**Manual Testing**:
- Use Local Mode with Anvil for contract integration testing
- Verify transactions on Sepolia before mainnet deployment

## Important Notes

### Environment Variables

**Configuration Methods**:

1. **Settings Modal** (Recommended): Click ⚙️ in header, import/paste/enter variables
2. **`.env.local` file**: Traditional file-based configuration

Required variables:

```bash
# Chain Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337  # or 11155111 for Sepolia

# Hub Contract Addresses
NEXT_PUBLIC_USER_HUB_LOCAL=0x...  # From contract deployment
NEXT_PUBLIC_ADMIN_HUB_LOCAL=0x...  # From contract deployment

# Zuno Marketplace ABIs API (for dynamic ABI loading)
NEXT_PUBLIC_ZUNO_API_URL=http://localhost:3000  # URL to Zuno ABIs API
NEXT_PUBLIC_ZUNO_API_KEY=  # Optional API key for authenticated requests
```

**Priority**: localStorage (Settings Modal) > process.env (.env.local)

### Path Aliases

- `@/` maps to `src/`
- Example: `import { Button } from '@/components/ui/button'`

### Contract Naming Standards

- Contracts: PascalCase (e.g., `UserHub`, `ERC721NFTExchange`)
- ABI Manager Names: Contract name without suffix (e.g., `"UserHub"`, `"ERC721NFTExchange"`)
- Services: `{ContractName}Service` class, `{contractName}Service` instance

**Example**:
```typescript
// Fetch ABI by contract name
const abi = await getContractABI("UserHub");

// Use in service
import { userHubService } from "@/lib/services/contracts";
```

### Security Notes

- Contracts are **NOT audited** - testnet use only
- Never use real funds during testing
- Do not deploy to mainnet without professional audit

### File Creation Rules

- **IMPORTANT**: Do NOT create markdown files (\*.md) unless explicitly requested or confirmed by the user
- Only create new files when absolutely necessary
- Prefer editing existing files over creating new ones
- When creating documentation files, always ask for user confirmation first

### Code Style

- TypeScript strict mode enabled
- Use Ethers.js v6 for blockchain interactions
- React 19 with Next.js 15 App Router
- Tailwind CSS v4 for styling
- ESLint for code quality
- **NO console.log statements** - use `logger` utility instead
- **ESLint no-console rule enforced** - prevents direct console usage

### Logging Standards

- **Always use logger instead of console.log**:

  ```typescript
  // ❌ Don't use
  console.log("Debug info");
  console.error("Error occurred");

  // ✅ Use logger instead
  import { logger } from "@/lib/utils/logger";
  logger.info("Debug info", data, {
    component: "ComponentName",
    action: "actionName",
  });
  logger.error("Error occurred", error, {
    component: "ComponentName",
    action: "actionName",
  });
  ```

- **Include context in all log calls**:

  ```typescript
  logger.info(
    "User action",
    { userId, action },
    {
      component: "UserProfile",
      action: "updateProfile",
    }
  );
  ```

- **Use appropriate log levels**:
  - `logger.debug()` - Development debugging
  - `logger.info()` - General information
  - `logger.warn()` - Warnings
  - `logger.error()` - Errors
  - `logger.success()` - Success operations

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── marketplace/       # Marketplace listings
│   ├── collections/       # Collection browsing/creation
│   ├── auctions/          # Auction pages
│   ├── bundles/           # Bundle trading
│   ├── offers/            # Offer management
│   ├── admin/             # Admin dashboard
│   ├── analytics/         # Analytics dashboard
│   └── app-provider.tsx   # Client-side app wrapper with providers
├── components/
│   ├── common/            # Shared components (Header, Footer, etc.)
│   ├── features/          # Feature-specific components
│   │   ├── env-config/   # Runtime environment configuration modal
│   │   ├── collection/   # Collection management
│   │   ├── marketplace/  # Marketplace features
│   │   └── nft/          # NFT features
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── contracts/
│   │   ├── abis/          # Auto-generated contract ABIs
│   │   └── addresses.ts   # Contract address configuration
│   ├── services/
│   │   ├── contracts/     # Contract service classes (13 services)
│   │   │   ├── base/      # BaseContractService abstract class
│   │   │   ├── core/      # Core services (Hub, Exchange, Auction)
│   │   │   ├── utils/     # Utility services (Validator, Tracker)
│   │   │   └── validators/ # ServiceValidator for business logic
│   │   ├── blockchain/    # Blockchain utilities
│   │   ├── web3/          # Web3 provider
│   │   └── env-storage.service.ts  # Environment localStorage service
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Redux store and slices
│   ├── utils/             # Utility functions
│   │   ├── contract-errors.ts    # Error formatting
│   │   ├── crypto-formatter.ts   # Price/fee formatting
│   │   ├── status-mappers.ts     # Status code mapping
│   │   ├── validators.ts         # Input validation
│   │   ├── batch-queries.ts      # Performance utilities
│   │   ├── performance-monitor.ts # Performance tracking
│   │   ├── env-config.ts         # Environment configuration manager
│   │   └── logger.ts             # Production-ready logger utility
│   ├── constants/         # App constants
│   └── config/            # Configuration
├── types/                  # TypeScript type definitions
│   ├── index.ts           # Main type exports
│   ├── contract-types.ts  # Contract interaction types
│   ├── env-config.ts      # Environment configuration types
│   └── events.ts          # Event-related types
├── docs/                   # Documentation
│   ├── JSDOC-STANDARDS.md      # JSDoc templates and standards
│   ├── TESTING-GUIDE.md        # Testing guide and examples
│   ├── REFACTORING-SUMMARY.md  # Complete refactoring overview
│   └── PHASE-4-MIGRATION-GUIDE.md  # Service migration guide
└── styles/                # Global styles
```

## Troubleshooting

**"Hub not initialized"**

- Ensure `initializeServices()` is called before using services
- Check that `NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL` is set (Settings Modal or `.env.local`)

**"Contract address not found"**

1. Using Settings Modal (Recommended):
   - Click ⚙️ Settings in header
   - Import/paste/enter configuration
   - Save & Reload
2. Using `.env.local`:
   - Verify `NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL` or `NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA` is set
   - Verify correct chain ID (31337 = local, 11155111 = Sepolia)
   - Ensure contracts are deployed on the target network
   - Restart dev server

**"Transaction reverted: Not approved"**

- NFT must be approved before listing: `await collectionService.setApprovalForAll(...)`

**"ESLint no-console error"**

- Replace `console.log` with `logger.info()` and add context
- Replace `console.error` with `logger.error()` and add context
- Import logger: `import { logger } from "@/lib/utils/logger"`

**"BlockOutOfRangeError: block height is X but requested was Y"**

- This error occurs when the blockchain is out of sync or restarted
- **Solution**: Check your RPC URL configuration in Settings Modal
- For local networks: Restart Anvil and redeploy contracts
- For testnets: Ensure RPC endpoint is fully synchronized
- Update RPC URLs via Settings Modal if using custom endpoints
