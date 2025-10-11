# Setup Guide

Complete guide to setting up the Zuno Marketplace frontend application.

## Table of Contents

- [Quick Setup](#quick-setup)
- [Local Development (Real Contracts)](#local-development-real-contracts)
- [Environment Variables](#environment-variables)
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

4. **Start local development**

Follow the steps below to set up local blockchain development.

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

Edit `.env.local`:

```bash
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
```

#### Step 4: Extract ABIs

```bash
# Return to frontend directory
cd ../zuno-marketplace-mini

# Extract ABIs from compiled contracts
node scripts/extract-abis.js
```

This will extract 18+ contract ABIs and generate TypeScript exports.

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

Edit `.env.local`:

```bash
NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=0x... # Your deployed address
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
```

#### Step 5: Extract ABIs

```bash
cd ../zuno-marketplace-mini
node scripts/extract-abis.js
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

### Required Variables

| Variable                       | Description                | Example                                 |
| ------------------------------ | -------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_DEFAULT_CHAIN_ID` | Default blockchain network | `31337` (local) or `11155111` (Sepolia) |

### Contract Addresses

| Variable                              | Description                 | When to Use                  |
| ------------------------------------- | --------------------------- | ---------------------------- |
| `NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL`   | Local network Hub address   | Local development with Anvil |
| `NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA` | Sepolia testnet Hub address | Testnet deployment           |

### Complete .env.local Examples

**Local Network:**

```bash
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
```

**Sepolia Testnet:**

```bash
NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
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

**Cause**: Missing or incorrect MarketplaceHub address in `.env.local`.

**Solution**:

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

# Restart dev server
npm run dev
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

Add to `.env.local`:

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
3. Configure MarketplaceHub address in `.env.local`
4. Benefit from fast transactions and unlimited ETH

## Next Steps

After successful setup:

1. **Learn the Architecture**: Read [Code Structure Guide](./docs/CODE_STRUCTURE.md)
2. **Understand Contract Integration**: See [Contract Integration Guide](./docs/CONTRACT_INTEGRATION.md)
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
