# Setup Guide

Complete guide to setting up the Zuno Marketplace frontend application.

## Table of Contents

- [Quick Setup](#quick-setup)
- [Runtime Environment Configuration](#runtime-environment-configuration)
- [Local Development (Real Contracts)](#local-development-real-contracts)
- [Environment Variables](#environment-variables)
- [Logging System](#logging-system)
- [Troubleshooting](#troubleshooting)

## Quick Setup

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm** or **pnpm** package manager
- **Git** for version control
- **MetaMask** browser extension (for blockchain features)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd zuno-marketplace-mini
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

3. **Setup environment variables**

```bash
cp .env.example .env.local
```

4. **Start development server**

```bash
npm run dev
# or
pnpm dev
```

5. **Configure environment variables**

Use the built-in Settings Modal (recommended) or manually edit `.env.local`.

## Runtime Environment Configuration

The marketplace includes a user-friendly Settings Modal for managing environment variables at runtime. This is the **recommended** configuration method.

### Using the Settings Modal

#### Step 1: Open Settings

1. Start the application (`npm run dev`)
2. Click the **⚙️ Settings** button in the header
3. The Environment Configuration modal will open

#### Step 2: Configure Variables

Choose one of three methods:

**Method 1: Import File**

1. Click **Import File** button
2. Select your `.env.local` or `.env` file
3. Variables automatically populate in the form

**Method 2: Paste Content**

1. Click **Paste .env** button
2. Paste your .env file content into the text area
3. Click **Load Variables**
4. All variables auto-populate

Example paste format:

```bash
# Chain configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Method 3: Manual Input**

- Enter each variable value directly in the form
- Required fields are marked with `*`
- Hover over field labels for descriptions

#### Step 3: Save Configuration

1. Review all variables
2. Click **Save & Reload**
3. Configuration saves to `localStorage`
4. Page automatically reloads with new settings

#### Managing Configuration

**Export Configuration**

- Click **Export** button to download current config as `.env.local` file
- Share with team members or use for backup

**Reset to Defaults**

- Click **Reset to Defaults** (visible when using stored config)
- Clears localStorage and uses `.env.local` file values
- Requires confirmation

**View Current Status**

- Header shows "(Using stored config)" when localStorage is active
- Form displays current values from localStorage or `.env.local`

### Configuration Priority

The app uses the following priority order:

1. **localStorage** (set via Settings Modal) - Highest priority
2. **process.env** (build-time .env.local) - Fallback

This allows you to override build-time configuration at runtime, perfect for:

- Deployed apps (Vercel, Netlify, etc.)
- Testing different networks without rebuilding
- Quick environment switching
- Team collaboration with different settings

### Technical Details

**Storage:**

- Key: `zuno-marketplace-env-config`
- Location: Browser localStorage
- Format: JSON
- Persistence: Survives page reloads and browser restarts

**Validation:**

- Required fields must be filled
- Chain ID must be 1, 11155111, or 31337
- Contract addresses must be valid Ethereum addresses (0x + 40 hex chars)
- Real-time error messages guide corrections

**Security:**

- Configuration stored locally in browser only
- Not transmitted to any servers
- Cleared when localStorage is cleared
- Reset button available for instant cleanup

## Local Development (Real Contracts)

For full blockchain integration with deployed smart contracts.

### Option 1: Local Network (Anvil)

Best for development and testing with fast transactions.

#### Step 1: Start Local Blockchain

```bash
# Install Foundry if not already installed
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Start Anvil (Terminal 1)
anvil --port 8545
```

Keep this terminal running. You'll see 10 test accounts with 10,000 ETH each.

#### Step 2: Deploy Contracts

```bash
# Terminal 2 - Navigate to contracts directory
cd ../zuno-marketplace-contracts

# Deploy all contracts
make deploy-all-local
```

**Important**: Copy the `MarketplaceHub` address from the output:

```
MarketplaceHub deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

#### Step 3: Configure Frontend

**Option A: Using Settings Modal (Recommended)**

1. Start the app: `npm run dev`
2. Click ⚙️ Settings in header
3. Enter or paste configuration:
   ```
   NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
   NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
   ```
4. Click **Save & Reload**

**Option B: Edit `.env.local` file**

```bash
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
```

#### Step 4: Extract ABIs

```bash
# Return to frontend directory
cd ../zuno-marketplace-mini

# Extract ABIs from compiled contracts (default paths)
node scripts/extract-abis.js

# Or with custom contracts directory
node scripts/extract-abis.js --contracts-dir /path/to/contracts/out

# Show all options
node scripts/extract-abis.js --help
```

This will extract 23+ contract ABIs and generate TypeScript exports.

**Available options:**

- `--contracts-dir <path>`: Custom contracts output directory (default: `../zuno-marketplace-contracts/out`)
- `--output-dir <path>`: Custom ABIs output directory (default: `./src/lib/contracts/abis`)
- `--help`: Show help message

#### Step 5: Start Frontend

```bash
npm run dev
```

#### Step 6: Connect MetaMask

1. Open MetaMask
2. Add Network:

   - **Network Name**: Anvil Local
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

3. Import test account (use any private key from Anvil output)

### Option 2: Testnet (Sepolia)

For testing in a real blockchain environment.

#### Step 1: Get Testnet ETH

- Visit [Sepolia Faucet](https://sepoliafaucet.com/)
- Request test ETH for your MetaMask address

#### Step 2: Setup Environment Variables

Create `.env` in the contracts directory:

```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### Step 3: Deploy Contracts

```bash
cd ../zuno-marketplace-contracts

forge script script/deploy/DeployAll.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

**Note**: Deployment takes 5-10 minutes. Copy the `MarketplaceHub` address from output.

#### Step 4: Configure Frontend

**Option A: Using Settings Modal (Recommended)**

1. Start the app: `npm run dev`
2. Click ⚙️ Settings in header
3. Enter configuration:
   ```
   NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=0x... # Your deployed address
   NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
   ```
4. Click **Save & Reload**

**Option B: Edit `.env.local` file**

```bash
NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=0x... # Your deployed address
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
```

#### Step 5: Extract ABIs

```bash
cd ../zuno-marketplace-mini
node scripts/extract-abis.js

# Or with custom paths if needed
# node scripts/extract-abis.js --contracts-dir /path/to/contracts/out
```

#### Step 6: Start Frontend

```bash
npm run dev
```

#### Step 7: Connect to Sepolia

1. Open MetaMask
2. Switch to Sepolia network
3. Connect wallet to app

## Environment Variables

### Configuration Methods

1. **Settings Modal (Recommended)**: Click ⚙️ in header, configure visually
2. **`.env.local` file**: Traditional file-based configuration

### Required Variables

| Variable                       | Description                | Example                                 | Required |
| ------------------------------ | -------------------------- | --------------------------------------- | -------- |
| `NEXT_PUBLIC_DEFAULT_CHAIN_ID` | Default blockchain network | `31337` (local) or `11155111` (Sepolia) | Yes      |

### Contract Addresses

| Variable                              | Description                 | When to Use                  | Required |
| ------------------------------------- | --------------------------- | ---------------------------- | -------- |
| `NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL`   | Local network Hub address   | Local development with Anvil | No       |
| `NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA` | Sepolia testnet Hub address | Testnet deployment           | No       |
| `NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET` | Mainnet Hub address         | Production deployment        | No       |

**Note**: At least one contract address must be provided for the network you're using.

### Complete .env.local Examples

**Local Network:**

```bash
# Chain Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337

# Contract Addresses
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Sepolia Testnet:**

```bash
# Chain Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111

# Contract Addresses
NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=0x1234567890123456789012345678901234567890
```

**All Networks (for deployed apps):**

```bash
# Chain Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337

# Contract Addresses - All Networks
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET=0x0987654321098765432109876543210987654321
```

## Logging System

The project uses a production-ready logging system instead of `console.log` statements.

### Features

- **Structured Logging**: Context-aware logging with component and action tracking
- **Performance Tracking**: Built-in timer functionality
- **Production Ready**: Automatic error monitoring integration (Sentry ready)
- **Development/Production Modes**: Different logging behavior per environment
- **ESLint Enforcement**: `no-console: "error"` rule prevents direct console usage

### Usage

```typescript
import { logger } from "@/lib/utils/logger";

// Basic logging with context
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

### Log Levels

- `logger.debug()` - Development debugging (development only)
- `logger.info()` - General information (always logged)
- `logger.warn()` - Warnings (always logged)
- `logger.error()` - Errors (always logged + monitoring)
- `logger.success()` - Success operations (always logged)

### ESLint Configuration

The project enforces clean code with ESLint rules:

```javascript
// eslint.config.mjs
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-console": "error", // Prevents console.log usage
      "no-debugger": "error", // Prevents debugger statements
      // ... other rules
    },
  },
];
```

### Best Practices

```typescript
// ❌ Don't use console.log
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

// ✅ Include context in all log calls
logger.info(
  "User action",
  { userId, action },
  {
    component: "UserProfile",
    action: "updateProfile",
  }
);
```

## Troubleshooting

### Common Issues

#### "Hub not initialized" Error

**Cause**: Services not initialized with provider and signer.

**Solution**:

```typescript
import { initializeServices } from "@/lib/services/contracts";

// After connecting wallet
await initializeServices(provider, signer);
```

#### "Contract address not found" Error

**Cause**: Missing or incorrect MarketplaceHub address.

**Solution**:

**Using Settings Modal (Recommended):**

1. Click ⚙️ Settings in header
2. Import/paste/enter your configuration
3. Ensure correct MarketplaceHub address for your network
4. Click **Save & Reload**

**Using .env.local file:**

1. Check `.env.local` file exists
2. Verify `NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL` or `NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA` is set
3. Ensure address matches deployment output
4. Restart dev server after changing `.env.local`

#### "Chain ID mismatch" Error

**Cause**: MetaMask connected to different network than configured.

**Solution**:

- Local: Switch MetaMask to localhost:8545 (Chain ID: 31337)
- Sepolia: Switch MetaMask to Sepolia (Chain ID: 11155111)
- Update `NEXT_PUBLIC_DEFAULT_CHAIN_ID` to match

#### "Transaction reverted: Not approved" Error

**Cause**: NFT not approved for marketplace contract.

**Solution**:

```typescript
import { collectionService, exchangeService } from "@/lib/services/contracts";

// Approve before listing
await collectionService.setApprovalForAll(
  nftContractAddress,
  exchangeAddress,
  true,
  "ERC721" // or "ERC1155"
);

// Then create listing
await exchangeService.createListing({ ... });
```

#### "ABIs outdated" Error

**Cause**: Contract ABIs don't match deployed contracts.

**Solution**:

```bash
# Re-extract ABIs
node scripts/extract-abis.js

# Or with custom paths
node scripts/extract-abis.js --contracts-dir /path/to/contracts/out

# Restart dev server
npm run dev
```

#### "ESLint no-console error"

**Cause**: Using `console.log` instead of the logger utility.

**Solution**:

```typescript
// ❌ Don't use console.log
console.log("Debug info");

// ✅ Use logger instead
import { logger } from "@/lib/utils/logger";
logger.info("Debug info", data, {
  component: "ComponentName",
  action: "actionName",
});
```

#### MetaMask "Nonce too high" Error

**Cause**: MetaMask transaction nonce out of sync (common with Anvil).

**Solution**:

1. Open MetaMask
2. Settings → Advanced → Clear activity tab data
3. Reconnect wallet

#### Anvil Connection Refused

**Cause**: Anvil not running or wrong port.

**Solution**:

```bash
# Check Anvil is running on port 8545
lsof -i :8545

# Start Anvil if not running
anvil --port 8545
```

### Build Issues

#### TypeScript Errors After ABI Update

**Solution**:

```bash
# Clean build cache
rm -rf .next
npm run build
```

#### Module Not Found Errors

**Solution**:

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Performance Issues

#### Slow Page Load

**Possible causes**:

- Too many contract calls on page load
- Large images not optimized

**Solutions**:

- Use React Query for caching
- Implement pagination
- Optimize images with Next.js Image component
- Reduce initial contract calls

## Advanced Configuration

### Custom RPC Endpoints

**Option A: Settings Modal**

1. Click ⚙️ Settings
2. Add variables manually or via paste
3. Save & Reload

**Option B: .env.local file**

```bash
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

### Multiple Networks

The app automatically detects network and uses corresponding Hub address:

```typescript
// src/lib/contracts/addresses.ts
export const CONTRACT_ADDRESSES = {
  11155111: {
    // Sepolia
    MARKETPLACE_HUB: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA || "",
  },
  31337: {
    // Local
    MARKETPLACE_HUB: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL || "",
  },
};
```

### Development with Real Contracts

1. Deploy contracts locally with Anvil
2. Keep Anvil running in background
3. Configure MarketplaceHub address via Settings Modal or `.env.local`
4. Extract ABIs: `node scripts/extract-abis.js`
5. Benefit from fast transactions and unlimited ETH

### Script Usage

**Extract ABIs:**

```bash
node scripts/extract-abis.js                                    # Default paths
node scripts/extract-abis.js --contracts-dir /custom/path       # Custom contracts dir
node scripts/extract-abis.js --output-dir ./custom/abis         # Custom output dir
node scripts/extract-abis.js --help                             # Show help
```

**Manage Collections (TypeScript):**

```bash
npx tsx scripts/start-mint.ts 0xCollection                      # Progress mint stage
npx tsx scripts/start-mint.ts 0xCollection 2                    # Skip to public mint
npx tsx scripts/manage-allowlist.ts 0xCollection add 0xAddr     # Add to allowlist
npx tsx scripts/manage-allowlist.ts 0xCollection check 0xAddr   # Check allowlist
```

**Create & Mint (JavaScript):**

```bash
node scripts/collections/create-erc721.js                       # Create ERC721
node scripts/nfts/mint-erc721.js 0xCollection 5                # Mint 5 NFTs
```

See [`scripts/README.md`](../scripts/README.md) for complete documentation.

## Next Steps

After successful setup:

1. **Learn the Architecture**: Read [Code Structure Guide](./CODE_STRUCTURE.md)
2. **Understand Contract Integration**: See [Contract Integration Guide](./CONTRACT_INTEGRATION.md)
3. **Review Contract Summary**: Check [README_CONTRACT.md](./README_CONTRACT.md)
4. **Start Development**: Build your features!

## Getting Help

If you encounter issues not covered here:

- Check [Troubleshooting section](#troubleshooting)
- Review [README.md](../README.md)
- Check contract deployment logs
- Verify MetaMask network settings
- Ensure ABIs are up to date

---

**Ready to start building!** Choose your mode and follow the steps above.
