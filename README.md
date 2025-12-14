# Zuno Marketplace Mini

A modern NFT marketplace built with Next.js 15, TypeScript, and Zuno Marketplace SDK.

## Features

- **NFT Trading** - List, buy, and sell ERC721/ERC1155 NFTs
- **Auctions** - English & Dutch auction support
- **Collection Management** - Create and manage NFT collections
- **Allowlist Support** - Restrict minting to allowlisted addresses
- **Wallet Integration** - MetaMask and other Web3 wallets

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **SDK:** [zuno-marketplace-sdk](../zuno-marketplace-sdk)
- **Web3:** ethers.js v6

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MetaMask wallet

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Copy `.env` and modify as needed:

```bash
# Required: Zuno API
NEXT_PUBLIC_ZUNO_API_URL=https://zuno-marketplace-abis.vercel.app/api
NEXT_PUBLIC_ZUNO_API_KEY=your-api-key

# Network Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Optional: Default allowlist (comma-separated)
# NEXT_PUBLIC_DEFAULT_ALLOWLIST=0x123...,0x456...
```

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ZUNO_API_URL` | Zuno API endpoint | required |
| `NEXT_PUBLIC_ZUNO_API_KEY` | Zuno API key | required |
| `NEXT_PUBLIC_DEFAULT_CHAIN_ID` | Chain ID | `31337` |
| `NEXT_PUBLIC_RPC_URL` | RPC endpoint | `http://127.0.0.1:8545` |
| `NEXT_PUBLIC_DEFAULT_ALLOWLIST` | Allowlist addresses | - |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auctions/          # Auction pages
│   ├── collections/       # Collection pages
│   ├── mint/              # Minting pages
│   └── profile/           # User profile
├── components/
│   ├── features/          # Feature components
│   ├── ui/                # shadcn/ui components
│   └── wallet/            # Wallet components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── config/           # SDK & network config
│   ├── store/            # State management
│   └── utils/            # Utility functions
├── providers/            # React providers
└── types/                # TypeScript types
```

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript type checking
```

## Local Development

1. Start local blockchain (Anvil):
   ```bash
   anvil --port 8545
   ```

2. Deploy contracts:
   ```bash
   cd ../zuno-marketplace-contracts
   make deploy-all-local
   ```

3. Start Zuno API:
   ```bash
   cd ../zuno-api
   pnpm dev
   ```

4. Start the app:
   ```bash
   pnpm dev
   ```

## SDK Integration

The app uses `zuno-marketplace-sdk` for all blockchain operations:

```tsx
import { useCollection, useExchange, useAuction } from 'zuno-marketplace-sdk/react';

// Create collection
const { createERC721Collection } = useCollection();
await createERC721Collection.mutateAsync({
  name: 'My Collection',
  symbol: 'MC',
  maxSupply: 10000,
  // ...
});

// List NFT
const { listNFT } = useExchange();
await listNFT.mutateAsync({
  collectionAddress: '0x...',
  tokenId: '1',
  price: '1.5',
  duration: 86400,
});

// Create auction
const { createEnglishAuction } = useAuction();
await createEnglishAuction.mutateAsync({
  collectionAddress: '0x...',
  tokenId: '1',
  startingBid: '1.0',
  duration: 86400 * 7,
});
```

## License

MIT
