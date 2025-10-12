# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zuno Marketplace is a production-ready NFT marketplace built with Next.js 15, TypeScript, and smart contract integration. The project uses the **MarketplaceHub Pattern** - a single contract entry point that provides addresses for all other contracts.

**Sister Repository**: `zuno-marketplace-contracts` (Foundry project with smart contracts)

## Key Architecture Principles

### 1. MarketplaceHub Pattern

- **Single address per network** - All contract discovery happens through MarketplaceHub
- MarketplaceHub provides `getAllAddresses()` to retrieve all contract addresses dynamically
- Environment only needs one variable per network: `NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL`
- Supports local (chainId: 31337), Sepolia (11155111), and Mainnet (1)

### 2. Service Layer Architecture

- **13 service classes** wrapping 23 smart contracts
- All services initialize through `initializeServices(provider, signer)`
- Services auto-discover contract addresses via MarketplaceHubService
- Each service is a singleton instance (e.g., `marketplaceHubService`, `exchangeService`)
- Service naming: `{ContractName}Service` class, `{contractName}Service` instance

**Core Services**:

- `MarketplaceHubService` - Address discovery (MUST initialize first)
- `ExchangeService` - ERC721/ERC1155 listings and purchases
- `AuctionService` - English/Dutch auctions
- `BundleService` - NFT bundles
- `OfferService` - NFT and collection offers
- `CollectionService` - Create/mint/manage collections
- `FeeManagerService` - Fee tiers, VIP status, volume discounts
- `RoyaltyManagerService` - ERC2981 royalty management
- `AccessControlService` - Role-based permissions
- `EmergencyManagerService` - Emergency pause/blacklist
- `ListingValidatorService` - Pre-transaction validation
- `ListingHistoryTrackerService` - Analytics and stats
- `CollectionVerifierService` - Collection verification

See `docs/SERVICE_ARCHITECTURE.md` for complete service documentation.

### 3. Contract ABI Management

- ABIs stored in `src/lib/contracts/abis/`
- Auto-generated from Foundry artifacts using `node scripts/extract-abis.js`
- ABI exports follow pattern: `{ContractName}_ABI`
- Import from: `import { MarketplaceHub_ABI } from '@/lib/contracts/abis'`
- **Never manually edit ABI files** - always regenerate from contracts

### 4. Development Modes

**Local Development** (requires Anvil + deployed contracts):

```bash
# Terminal 1: Start local blockchain
anvil --port 8545

# Terminal 2: Deploy contracts (in zuno-marketplace-contracts)
cd ../zuno-marketplace-contracts
make deploy-all-local

# Terminal 3: Extract ABIs and run
cd ../zuno-marketplace-mini
node scripts/extract-abis.js
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
});

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

**Via npm (recommended)**:

```bash
npm run extract-abis         # Extract ABIs with default paths
npm run extract-abis:help    # Show help and options
npm run test:all             # Run all test scripts
```

**Direct usage**:

```bash
# Extract ABIs (supports custom paths)
node scripts/extract-abis.js [--contracts-dir <path>] [--output-dir <path>]

# Manage mint stages (TypeScript - requires tsx)
npx tsx scripts/start-mint.ts <collection-address> [target-stage]

# Manage allowlist (TypeScript - requires tsx)
npx tsx scripts/manage-allowlist.ts <collection-address> <add|remove|check> <addresses...>

# Collection creation (JavaScript)
node scripts/collections/create-erc721.js
node scripts/collections/create-erc1155.js

# NFT minting (JavaScript)
node scripts/nfts/mint-erc721.js <collection-address> [quantity] [recipient]
node scripts/nfts/mint-erc1155.js <collection-address> <token-id> <amount> [recipient]
```

See `scripts/README.md` for complete script documentation.

### Working with Contracts

**When contracts are updated**:

1. Deploy new contracts in `zuno-marketplace-contracts`
2. Copy MarketplaceHub address to `.env.local` or Settings Modal
3. Run extract-abis to update ABIs
   - Via npm: `npm run extract-abis`
   - With custom paths: `node scripts/extract-abis.js --contracts-dir /path/to/contracts/out`
   - Show help: `npm run extract-abis:help`
4. Restart dev server

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
```

### Adding a New Feature

1. Create component in `src/components/features/{feature-name}/`
2. Add types in `src/types/`
3. Create/update service in `src/lib/services/contracts/` if contract interaction needed
4. Add Redux slice in `src/lib/store/` if global state needed
5. Create page in `src/app/{route}/page.tsx`

### Testing

The project doesn't have formal tests yet. When testing manually:

- Use Local Mode with Anvil for contract integration testing
- Verify transactions on Sepolia before mainnet deployment

## Important Notes

### Environment Variables

**Configuration Methods**:

1. **Settings Modal** (Recommended): Click ⚙️ in header, import/paste/enter variables
2. **`.env.local` file**: Traditional file-based configuration

Required variables:

```bash
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337  # or 11155111 for Sepolia
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x...  # From contract deployment
```

**Priority**: localStorage (Settings Modal) > process.env (.env.local)

### Path Aliases

- `@/` maps to `src/`
- Example: `import { Button } from '@/components/ui/button'`

### Contract Naming Standards

- Contracts: PascalCase (e.g., `MarketplaceHub`)
- ABIs: `{ContractName}_ABI` (e.g., `MarketplaceHub_ABI`)
- Services: `{ContractName}Service` class, `{contractName}Service` instance
- See `docs/CONTRACT_NAMING_STANDARD.md` for complete standards

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
│   │   ├── blockchain/    # Blockchain utilities
│   │   ├── web3/          # Web3 provider
│   │   └── env-storage.service.ts  # Environment localStorage service
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Redux store and slices
│   ├── utils/             # Utility functions
│   │   ├── env-config.ts # Environment configuration manager
│   │   └── logger.ts     # Production-ready logger utility
│   ├── constants/         # App constants
│   └── config/            # Configuration
├── types/                  # TypeScript type definitions
│   ├── index.ts           # Main type exports
│   ├── env-config.ts      # Environment configuration types
│   └── events.ts          # Event-related types
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

**"ABIs outdated"**

- Run `node scripts/extract-abis.js` to regenerate ABIs from latest contracts

**"ESLint no-console error"**

- Replace `console.log` with `logger.info()` and add context
- Replace `console.error` with `logger.error()` and add context
- Import logger: `import { logger } from "@/lib/utils/logger"`

## Additional Documentation

- `docs/SETUP_GUIDE.md` - Detailed setup instructions
- `docs/CONTRACT_INTEGRATION.md` - Smart contract integration guide
- `docs/CODE_STRUCTURE.md` - Architecture and patterns
- `docs/SERVICE_ARCHITECTURE.md` - Complete service documentation
- `docs/CONTRACT_NAMING_STANDARD.md` - Naming conventions
