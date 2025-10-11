# Contract Integration Summary

Quick reference for smart contract integration in Zuno Marketplace.

## Overview

This document provides a high-level summary of how the frontend integrates with smart contracts. For detailed guides, see:

- [Setup Guide](./SETUP_GUIDE.md) - Complete setup instructions
- [Contract Integration Guide](./CONTRACT_INTEGRATION.md) - Detailed contract integration
- [Code Structure Guide](./CODE_STRUCTURE.md) - Architecture and patterns
## Quick Start

### 1. Deploy Contracts

```bash
# Start local blockchain
anvil --port 8545

# Deploy contracts
cd ../zuno-marketplace-contracts
make deploy-all-local

# Copy MarketplaceHub address from output
# Example: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 2. Configure Frontend

```bash
# Update .env.local
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
```

### 3. Extract ABIs

```bash
# Return to frontend directory
cd ../zuno-marketplace-mini

# Extract ABIs from contracts
node scripts/extract-abis.js
```

### 4. Run Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect MetaMask.

## Architecture

### MarketplaceHub Pattern

The frontend uses a **single address** approach via MarketplaceHub:

```
┌─────────────────────────────────────────────┐
│           NEXT_PUBLIC_MARKETPLACE_HUB       │
│                     ↓                        │
│              MarketplaceHub.sol              │
│                     ↓                        │
│            getAllAddresses()                 │
│                     ↓                        │
├─────────────────────────────────────────────┤
│  ERC721Exchange   │  ERC1155Exchange        │
│  EnglishAuction   │  DutchAuction           │
│  ERC721Factory    │  ERC1155Factory         │
│  BundleManager    │  OfferManager           │
│  FeeManager       │  RoyaltyManager         │
└─────────────────────────────────────────────┘
```

**Benefits**:
- Only 1 address to configure (not 15+)
- Automatic address discovery
- Easy contract upgrades
- Simplified deployment

## Contracts

### Core Marketplace Contracts

| Contract | Purpose | Service |
|----------|---------|---------|
| **MarketplaceHub** | Central registry, provides all addresses | `MarketplaceHubService` |
| **ERC721NFTExchange** | List, buy, sell ERC721 NFTs | `ExchangeService` |
| **ERC1155NFTExchange** | List, buy, sell ERC1155 NFTs | `ExchangeService` |
| **EnglishAuction** | Ascending price auctions | `AuctionService` |
| **DutchAuction** | Descending price auctions | `AuctionService` |
| **BundleManager** | Create and trade NFT bundles | `BundleService` |
| **OfferManager** | Make offers on NFTs/collections | `OfferService` |

### Supporting Contracts

| Contract | Purpose | Service |
|----------|---------|---------|
| **ERC721CollectionFactory** | Deploy ERC721 collections | `CollectionService` |
| **ERC1155CollectionFactory** | Deploy ERC1155 collections | `CollectionService` |
| **AdvancedFeeManager** | Platform fees management | `MarketplaceHubService` |
| **AdvancedRoyaltyManager** | Creator royalties | `MarketplaceHubService` |
| **MarketplaceAccessControl** | Role-based permissions | `MarketplaceHubService` |

### Registry Contracts

| Registry | Contains | Access Via |
|----------|----------|------------|
| **ExchangeRegistry** | ERC721/ERC1155 exchange addresses | `Hub.getAllAddresses()` |
| **CollectionRegistry** | Verified collections | `Hub.getAllAddresses()` |
| **AuctionRegistry** | English/Dutch auction addresses | `Hub.getAllAddresses()` |
| **FeeRegistry** | Fee manager address | `Hub.getAllAddresses()` |

## Service Layer

### Initialization Flow

```typescript
import { initializeServices } from "@/lib/services/contracts";
import { BrowserProvider } from "ethers";

// 1. Connect wallet
const provider = new BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

// 2. Initialize all services (one call)
await initializeServices(provider, signer);

// 3. Services are ready to use
import { exchangeService, auctionService } from "@/lib/services/contracts";
```

### Available Services

```typescript
// Exchange operations
import { exchangeService } from "@/lib/services/contracts";
await exchangeService.createListing({ ... });
await exchangeService.buyListing("1", "ERC721", "1.0");
await exchangeService.cancelListing("1", "ERC721");

// Auction operations
import { auctionService } from "@/lib/services/contracts";
await auctionService.createEnglishAuction({ ... });
await auctionService.placeBid("1", "1.5");
await auctionService.endAuction("1");

// Collection operations
import { collectionService } from "@/lib/services/contracts";
await collectionService.deployCollection({ ... });
await collectionService.setApprovalForAll(nftContract, exchange, true, "ERC721");

// Bundle operations
import { bundleService } from "@/lib/services/contracts";
await bundleService.createBundle({ ... });
await bundleService.buyBundle("1", "5.0");

// Offer operations
import { offerService } from "@/lib/services/contracts";
await offerService.makeOffer({ ... });
await offerService.acceptOffer("1");
await offerService.cancelOffer("1");

// Hub operations
import { marketplaceHubService } from "@/lib/services/contracts";
const addresses = await marketplaceHubService.getAllAddresses();
const platformFee = await marketplaceHubService.getPlatformFee();
```

## File Structure

### Contract Integration Files

```
src/lib/
├── contracts/
│   ├── abis/                      # Auto-generated ABIs
│   │   ├── MarketplaceHub.json
│   │   ├── ERC721NFTExchange.json
│   │   ├── ERC1155NFTExchange.json
│   │   ├── EnglishAuction.json
│   │   ├── DutchAuction.json
│   │   └── index.ts               # TypeScript exports
│   └── addresses.ts               # Contract addresses (1 per network)
│
├── services/contracts/
│   ├── MarketplaceHubService.ts   # Hub service (address discovery)
│   ├── ExchangeService.ts         # NFT trading
│   ├── AuctionService.ts          # Auctions
│   ├── BundleService.ts           # Bundles
│   ├── OfferService.ts            # Offers
│   ├── CollectionService.ts       # Collections
│   └── index.ts                   # Service exports & init
│
└── utils/
    └── web3.ts                    # Web3 utilities

scripts/
└── extract-abis.js                # ABI extraction script
```

### Auto-Generated Files

Run `node scripts/extract-abis.js` to generate:

```typescript
// src/lib/contracts/abis/index.ts (auto-generated)
export { default as MarketplaceHub_ABI } from "./MarketplaceHub.json";
export { default as ERC721NFTExchange_ABI } from "./ERC721NFTExchange.json";
export { default as ERC1155NFTExchange_ABI } from "./ERC1155NFTExchange.json";
export { default as EnglishAuction_ABI } from "./EnglishAuction.json";
export { default as DutchAuction_ABI } from "./DutchAuction.json";
export { default as BundleManager_ABI } from "./BundleManager.json";
export { default as OfferManager_ABI } from "./OfferManager.json";
export { default as ERC721Collection_ABI } from "./ERC721Collection.json";
export { default as ERC1155Collection_ABI } from "./ERC1155Collection.json";
export { default as ERC721CollectionFactory_ABI } from "./ERC721CollectionFactory.json";
export { default as ERC1155CollectionFactory_ABI } from "./ERC1155CollectionFactory.json";
// ... 18+ total exports
```

## Usage Examples

### List an NFT

```typescript
import { exchangeService, collectionService } from "@/lib/services/contracts";

async function listNFT() {
  // 1. Approve NFT
  const exchangeAddress = marketplaceHubService.getERC721Exchange();
  await collectionService.setApprovalForAll(
    "0xYourNFTContract",
    exchangeAddress,
    true,
    "ERC721"
  );

  // 2. Create listing
  const tx = await exchangeService.createListing({
    contractAddress: "0xYourNFTContract",
    tokenId: "1",
    price: "1.0", // 1 ETH
    duration: "7", // 7 days
    tokenType: "ERC721",
  });

  await tx.wait();
}
```

### Create an Auction

```typescript
import { auctionService, collectionService } from "@/lib/services/contracts";

async function createAuction() {
  // 1. Approve NFT
  const auctionAddress = marketplaceHubService.getEnglishAuction();
  await collectionService.setApprovalForAll(
    "0xYourNFTContract",
    auctionAddress,
    true,
    "ERC721"
  );

  // 2. Create auction
  const tx = await auctionService.createEnglishAuction({
    nftContract: "0xYourNFTContract",
    tokenId: "1",
    tokenType: "ERC721",
    startingBid: "0.1",
    reservePrice: "1.0",
    duration: "3", // 3 days
  });

  await tx.wait();
}
```

### Buy an NFT

```typescript
import { exchangeService } from "@/lib/services/contracts";

async function buyNFT() {
  const tx = await exchangeService.buyListing(
    "1", // listing ID
    "ERC721",
    "1.0" // price in ETH
  );

  await tx.wait();
}
```

### Create a Bundle

```typescript
import { bundleService, collectionService } from "@/lib/services/contracts";

async function createBundle() {
  // 1. Approve all NFTs
  const bundleAddress = marketplaceHubService.getBundleManager();
  await collectionService.setApprovalForAll(
    "0xNFTContract1",
    bundleAddress,
    true,
    "ERC721"
  );
  await collectionService.setApprovalForAll(
    "0xNFTContract2",
    bundleAddress,
    true,
    "ERC721"
  );

  // 2. Create bundle
  const tx = await bundleService.createBundle({
    nftContracts: ["0xNFTContract1", "0xNFTContract2"],
    tokenIds: ["1", "5"],
    amounts: [1, 1],
    price: "5.0",
    duration: "7",
  });

  await tx.wait();
}
```

## Type Safety

All services are fully typed:

```typescript
// Service parameters have strict types
interface ListingParams {
  contractAddress: string;
  tokenId: string;
  price: string;
  duration: string;
  tokenType: "ERC721" | "ERC1155";
  amount?: number;
}

// Return types are typed
const tx: ethers.ContractTransactionResponse = await exchangeService.createListing(params);
const receipt: ethers.ContractTransactionReceipt = await tx.wait();

// Domain types
import type { NFT, Listing, Auction, Bundle, Offer } from "@/types";
```

## Environment Variables

Only **one address per network** is needed:

```bash
# .env.local

# Local network (Anvil)
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Sepolia testnet
NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=0x1234567890123456789012345678901234567890

# Default network
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
```

## Workflow

### Development Workflow

```bash
# 1. Start local blockchain
anvil --port 8545

# 2. Deploy contracts (in contracts repo)
cd ../zuno-marketplace-contracts
make deploy-all-local
# Copy MarketplaceHub address

# 3. Configure frontend
cd ../zuno-marketplace-mini
# Update .env.local with Hub address

# 4. Extract ABIs
node scripts/extract-abis.js

# 5. Start frontend
npm run dev
```

### Update Workflow (when contracts change)

```bash
# 1. Deploy new contracts
cd ../zuno-marketplace-contracts
make deploy-all-local
# Copy new MarketplaceHub address

# 2. Update frontend
cd ../zuno-marketplace-mini
# Update .env.local with new address

# 3. Re-extract ABIs
node scripts/extract-abis.js

# 4. Restart dev server
npm run dev
```

## Network Support

### Supported Networks

| Network | Chain ID | Hub Env Var |
|---------|----------|-------------|
| Local (Anvil) | 31337 | `NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL` |
| Sepolia Testnet | 11155111 | `NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA` |

### Adding New Networks

1. Deploy contracts to new network
2. Add Hub address to `CONTRACT_ADDRESSES` in `src/lib/contracts/addresses.ts`
3. Add environment variable to `.env.example`
4. Update chain ID constants in `src/lib/constants/index.ts`

```typescript
// src/lib/contracts/addresses.ts
export const CONTRACT_ADDRESSES = {
  11155111: { MARKETPLACE_HUB: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA || "" },
  31337: { MARKETPLACE_HUB: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL || "" },
  80001: { MARKETPLACE_HUB: process.env.NEXT_PUBLIC_MARKETPLACE_HUB_MUMBAI || "" }, // New network
};
```

## Troubleshooting

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "Hub not initialized" | Services not initialized | Call `await initializeServices(provider, signer)` |
| "Contract address not found" | Missing Hub address in .env | Check `.env.local` has correct `NEXT_PUBLIC_MARKETPLACE_HUB_*` |
| "Transaction reverted: Not approved" | NFT not approved | Call `setApprovalForAll()` before listing/auctioning |
| "ABIs outdated" | ABIs don't match contracts | Run `node scripts/extract-abis.js` |

### Quick Fixes

```bash
# Reset everything
rm -rf .next node_modules
npm install
node scripts/extract-abis.js
npm run dev

# Update ABIs only
node scripts/extract-abis.js
npm run dev

# Check environment
cat .env.local
```

## Testing

### Local Contracts

For full integration testing:

```bash
# .env.local
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x...
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
```

Uses real contract services with local Anvil node.

## Performance

### Optimization Tips

1. **Parallel Service Initialization**: All services initialize in parallel via `Promise.all()`
2. **Single Hub Call**: `getAllAddresses()` fetches all addresses in one transaction
3. **Service Singletons**: Services instantiated once and reused
4. **Lazy Loading**: Components load on demand with Next.js dynamic imports
5. **Static ABI Imports**: ABIs bundled at build time, not fetched

### Gas Optimization

Services use efficient contract calls:

```typescript
// ✅ Good: Single multicall
const addresses = await hub.getAllAddresses();

// ❌ Bad: Multiple calls
const erc721 = await hub.getERC721Exchange();
const erc1155 = await hub.getERC1155Exchange();
// ... 15+ more calls
```

## Security

### Important Notes

⚠️ **Smart contracts are NOT audited**

- Use only on testnets (Sepolia, Mumbai, etc.)
- Do NOT deploy to mainnet without professional audit
- Never use real funds during testing
- Review all transactions in MetaMask before signing

### Best Practices

1. Always verify contract addresses
2. Check approvals before transactions
3. Use hardware wallets for mainnet (when audited)
4. Implement transaction limits for safety
5. Monitor for suspicious activity

## Resources

### Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Detailed setup instructions
- [Contract Integration Guide](./docs/CONTRACT_INTEGRATION.md) - Deep dive into integration
- [Code Structure Guide](./docs/CODE_STRUCTURE.md) - Architecture and patterns
- [Main README](./README.md) - Project overview

### External Resources

- [Ethers.js Documentation](https://docs.ethers.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Foundry Book](https://book.getfoundry.sh/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Contract Repository

The smart contracts are in a separate repository:

```bash
cd ../zuno-marketplace-contracts
```

See contract README for deployment and testing instructions.

## Summary

The contract integration provides:

- ✅ **Simplified Configuration**: 1 address per network (not 15+)
- ✅ **Type-Safe Services**: Full TypeScript support
- ✅ **Auto-Generated ABIs**: Sync with contracts automatically
- ✅ **Clean Architecture**: Service layer abstraction
- ✅ **Production Ready**: Optimized for real deployments

**Quick start**: Deploy contracts → Copy Hub address → Extract ABIs → Run app!

---

For questions or issues, see the [Troubleshooting](#troubleshooting) section or check the detailed guides.
