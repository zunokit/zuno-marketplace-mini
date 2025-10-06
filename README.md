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
- 🎭 **Mock Mode** - Develop without deploying contracts
- 📱 **Responsive Design** - Mobile-first UI with dark mode
- 🔄 **Real-Time Updates** - Live blockchain event listening
- 📊 **Analytics Dashboard** - Platform metrics and insights
- 👑 **Admin Panel** - Marketplace management and controls

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

### Development Mode (Mock Data)

Perfect for UI development without contracts:

```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_DATA=true
```

```bash
npm run dev
```

### Production Mode (Real Contracts)

#### Local Network

```bash
# Terminal 1 - Start Anvil
anvil --port 8545

# Terminal 2 - Deploy contracts
cd ../zuno-marketplace-contracts
make deploy-all-local

# Copy MarketplaceHub address from output
# Update .env.local
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x...

# Extract ABIs
node scripts/extract-abis.js

# Start app
npm run dev
```

#### Testnet (Sepolia)

```bash
# Deploy contracts
cd ../zuno-marketplace-contracts
forge script script/deploy/DeployAll.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify

# Update .env.local
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=0x...

# Extract ABIs
node scripts/extract-abis.js

# Deploy
npm run build
vercel deploy
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── common/            # Shared components
│   ├── features/          # Feature-specific components
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── contracts/         # Smart contract integration
│   │   ├── abis/         # Auto-generated ABIs
│   │   └── addresses.ts  # Contract addresses
│   ├── services/
│   │   ├── contracts/    # Contract services
│   │   └── mock/         # Mock services
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── constants/        # App constants
│   ├── store/            # Redux store
│   └── config/           # Configuration
├── types/                 # TypeScript types
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
# After deploying contracts
node scripts/extract-abis.js

# Automatically:
# ✅ Extracts 18+ contract ABIs
# ✅ Generates TypeScript exports
# ✅ Updates type definitions
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

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🐛 Troubleshooting

### Common Issues

**"Hub not initialized"**

```typescript
import { initializeServices } from "@/lib/services/contracts";
await initializeServices(provider, signer);
```

**"Contract address not found"**

```bash
# Check .env.local
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x...

# Verify correct network
# Local = 31337, Sepolia = 11155111
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
