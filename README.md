# 🎨 Zuno Marketplace

A modern, production-ready NFT marketplace built with Next.js 15, TypeScript, and smart contract integration.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Features

### Core Functionality

- 🏪 **NFT Trading** - List, buy, and sell ERC721/ERC1155 NFTs
- 🎯 **Auctions** - English & Dutch auction support
- 🎁 **Bundles** - Create and trade NFT bundles
- 💎 **Offers** - Make offers on individual NFTs or entire collections
- 🏗️ **Collection Management** - Create and manage NFT collections

### Technical Features

- ⚡ **MarketplaceHub Pattern** - Single address for all contracts
- 🔐 **Type-Safe** - Full TypeScript with auto-generated types
- 📱 **Responsive Design** - Mobile-first UI with dark mode
- 🔄 **Real-Time Updates** - Live blockchain event listening
- 📊 **Analytics Dashboard** - Platform metrics and insights
- 👑 **Admin Panel** - Marketplace management and controls
- ⚙️ **Runtime Configuration** - In-app environment settings with localStorage persistence

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- MetaMask (for blockchain features)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd zuno-marketplace-mini

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Runtime Environment Configuration (Recommended)

The marketplace includes a built-in environment configuration modal for easy setup:

1. **Start the app** (no .env.local needed initially)

   ```bash
   npm run dev
   ```

2. **Open Settings Modal**

   - Click the ⚙️ Settings button in the right bottom side

3. **Configure Variables**

   - **Import File**: Upload your `.env.local` file directly
   - **Paste Content**: Copy-paste .env variables (Vercel-style)
   - **Manual Input**: Enter each variable individually

4. **Save & Reload**
   - Configuration saves to localStorage
   - Page automatically reloads with new settings
   - Settings persist across sessions

**Features:**

- ✅ No need to manually edit `.env.local` files
- ✅ Import/export .env files with one click
- ✅ Validation with helpful error messages
- ✅ Reset to defaults anytime
- ✅ Dark mode support
- ✅ Works with deployed apps (e.g., Vercel)

### Local Network Development

```bash
# Terminal 1 - Start Anvil
anvil --port 8545

# Terminal 2 - Deploy contracts
cd ../zuno-marketplace-contracts
make deploy-all-local

# Copy MarketplaceHub address from output
# Configure via Settings Modal or .env.local:
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x...

# Extract ABIs
npm run extract-abis
# Or with custom paths:
# node scripts/extract-abis.js --contracts-dir /path/to/contracts/out

# Start app
npm run dev:local
```

### Testnet (Sepolia) Development

```bash
# Deploy contracts
cd ../zuno-marketplace-contracts
forge script script/deploy/DeployAll.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify

# Configure via Settings Modal or .env.local:
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=0x...

# Extract ABIs
npm run extract-abis

# Start app
npm run dev:testnet
```

### Working with Scripts

The project includes utility scripts for various tasks:

**Extract ABIs from Contracts:**

```bash
# Using npm scripts (recommended)
npm run extract-abis              # Default paths
npm run extract-abis:help         # Show help

# Direct usage with custom paths
node scripts/extract-abis.js --contracts-dir /path/to/contracts/out
node scripts/extract-abis.js --output-dir ./custom/abis
```

**Manage Mint Stages (TypeScript):**

```bash
# Progress to next stage
npx tsx scripts/start-mint.ts 0xCollectionAddress

# Skip to public mint
npx tsx scripts/start-mint.ts 0xCollectionAddress 2
```

**Manage Allowlist (TypeScript):**

```bash
# Add addresses to allowlist
npx tsx scripts/manage-allowlist.ts 0xCollectionAddress add 0xAddress1 0xAddress2

# Check if address is allowlisted
npx tsx scripts/manage-allowlist.ts 0xCollectionAddress check 0xAddress
```

See [`scripts/README.md`](./scripts/README.md) for complete documentation.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── common/            # Shared components
│   ├── features/          # Feature-specific components
│   │   ├── env-config/   # Runtime environment configuration
│   │   ├── collection/   # Collection management
│   │   ├── marketplace/  # Marketplace features
│   │   └── nft/          # NFT features
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── contracts/         # Smart contract integration
│   │   ├── abis/         # Auto-generated ABIs
│   │   └── addresses.ts  # Contract addresses
│   ├── services/
│   │   ├── contracts/    # Contract services
│   │   ├── blockchain/   # Blockchain utilities
│   │   ├── web3/         # Web3 provider
│   │   └── env-storage.service.ts  # Environment persistence
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   │   └── env-config.ts # Environment configuration manager
│   ├── constants/        # App constants
│   ├── store/            # Redux store
│   └── config/           # Configuration
├── types/                 # TypeScript types
│   └── env-config.ts     # Environment configuration types
└── styles/               # Global styles
```

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js 15.5.4 with App Router
- **Language:** TypeScript 5.0
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI + shadcn/ui
- **State Management:** Redux Toolkit
- **Form Handling:** React Hook Form + Zod

### Blockchain

- **Web3 Library:** Ethers.js v6
- **Wallet:** MetaMask SDK
- **Contract Pattern:** MarketplaceHub (single entry point)
- **Standards:** ERC721, ERC1155, EIP-2981

### Development

- **Build Tool:** Turbopack
- **Type Safety:** TypeScript strict mode
- **Code Quality:** ESLint + Prettier
- **Icons:** Lucide React
- **Charts:** Recharts

## 📚 Documentation

- [**Setup Guide**](./docs/SETUP_GUIDE.md) - Detailed setup instructions
- [**Contract Integration**](./docs/CONTRACT_INTEGRATION.md) - Smart contract integration guide
- [**Code Structure**](./docs/CODE_STRUCTURE.md) - Architecture and patterns
- [**Contract Summary**](./docs/README_CONTRACT.md) - Contract integration overview
- [**Format Name Contracts and ABIs**](./docs/CONTRACT_NAMING_STANDARD.md) - Required for name
- [**Architecture**](./docs/SERVICE_ARCHITECTURE.md) - Architecture

## 🎯 Key Concepts

### Runtime Environment Configuration

```typescript
// Access configuration anywhere in the app
import { envConfigManager } from "@/lib/utils/env-config";

// Get current configuration
const config = envConfigManager.getConfig();

// Update configuration (saves to localStorage + reloads page)
envConfigManager.setConfig({
  NEXT_PUBLIC_DEFAULT_CHAIN_ID: "31337",
  NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL: "0x...",
});

// Clear configuration (resets to .env defaults + reloads page)
envConfigManager.clearConfig();
```

**How it works:**

- Configuration stored in `localStorage` with key `zuno-marketplace-env-config`
- Priority: `localStorage` > `process.env` (build-time variables)
- Settings persist across sessions and page reloads
- Perfect for deployed apps where `.env.local` isn't accessible
- Supports Vercel, Netlify, and other deployment platforms

### MarketplaceHub Pattern

```typescript
// Only 1 address needed per network
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x...

// Hub automatically provides:
// ✅ ERC721/ERC1155 Exchanges
// ✅ Auction contracts (English/Dutch)
// ✅ Collection factories
// ✅ Fee & royalty registries
```

### Auto-Generated ABIs

```bash
# After deploying contracts (default paths)
node scripts/extract-abis.js

# With custom paths
node scripts/extract-abis.js --contracts-dir /path/to/contracts/out --output-dir ./abis

# Automatically:
# ✅ Extracts 23+ contract ABIs
# ✅ Generates TypeScript exports
# ✅ Creates type-safe ABI access
# ✅ Validates directories before extraction
```

### Type-Safe Services

```typescript
import { initializeServices, exchangeService } from "@/lib/services/contracts";

// Initialize once
await initializeServices(provider, signer);

// Use anywhere with full type safety
const tx = await exchangeService.createListing({
  contractAddress: "0x...",
  tokenId: "1",
  price: "1.0",
  duration: "7",
  tokenType: "ERC721",
});
```

## 🧪 Development Workflow

### Adding a New Feature

1. Create component in `components/features/`
2. Add service in `lib/services/contracts/` (if needed)
3. Define types in `types/`
4. Add Redux slice (if global state needed)
5. Create page in `app/`

### Updating Contracts

1. Deploy new contracts
2. Copy MarketplaceHub address
3. Update `.env.local`
4. Run `node scripts/extract-abis.js`
5. Restart dev server

## 📝 Scripts

### Development Scripts

```bash
npm run dev              # Start development server (Turbopack)
npm run dev:local        # Start with local network (Chain ID: 31337)
npm run dev:testnet      # Start with Sepolia testnet (Chain ID: 11155111)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run type-check       # TypeScript type checking
```

### Utility Scripts (via npm)

```bash
# Extract ABIs from contracts
npm run extract-abis              # Extract with default paths
npm run extract-abis:help         # Show help and options

# Test all scripts
npm run test:all                  # Run all test scripts
```

### Direct Script Usage

For more control, run scripts directly:

```bash
# Extract ABIs with custom paths
node scripts/extract-abis.js --contracts-dir /path/to/contracts/out
node scripts/extract-abis.js --output-dir ./custom/abis

# Manage mint stages (TypeScript - requires tsx)
npx tsx scripts/start-mint.ts <collection-address> [stage]

# Manage collection allowlist (TypeScript - requires tsx)
npx tsx scripts/manage-allowlist.ts <collection-address> <action> <addresses...>

# Collection creation
node scripts/collections/create-erc721.js
node scripts/collections/create-erc1155.js

# NFT minting
node scripts/nfts/mint-erc721.js <collection-address> [quantity] [recipient]
node scripts/nfts/mint-erc1155.js <collection-address> <token-id> <amount> [recipient]
```

See [`scripts/README.md`](./scripts/README.md) for detailed documentation.

## 🐛 Troubleshooting

### Common Issues

**"Hub not initialized"**

```typescript
import { initializeServices } from "@/lib/services/contracts";
await initializeServices(provider, signer);
```

**"Contract address not found"**

1. **Using Settings Modal** (Recommended):

   - Click ⚙️ Settings button in header
   - Import your `.env.local` file or paste variables
   - Save & Reload

2. **Using .env.local file**:

```bash
# Check .env.local exists and has correct variables
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x...

# Verify correct network
# Local = 31337, Sepolia = 11155111

# Restart dev server
npm run dev
```

**"Transaction reverted: Not approved"**

```typescript
// Approve NFT before listing
await collectionService.setApprovalForAll(
  nftContract,
  exchangeAddress,
  true,
  tokenType
);
```

**"ABIs outdated"**

```bash
node scripts/extract-abis.js
npm run dev
```

## 🔐 Security

⚠️ **Important Security Notes:**

- Smart contracts are **NOT audited**
- Use only on **testnets** (Sepolia, etc.)
- Do **NOT** deploy to mainnet without professional audit
- Never use **real funds** during testing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Ethers.js](https://docs.ethers.org/) - Ethereum library
- [Radix UI](https://www.radix-ui.com/) - Primitives
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## 📞 Support

For issues and questions:

- 📖 Check [documentation](./docs/)
- 🐛 Open an [issue](../../issues)
- 💬 Start a [discussion](../../discussions)

---

**Built with ❤️ using Next.js and Ethereum**
