# Zuno Marketplace Mini

A modern marketplace application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 Modern UI components with shadcn/ui
- 🌙 Dark mode support
- 📱 Responsive design
- ⚡ Fast development with Turbopack
- 🔧 TypeScript for type safety
- 🎭 Web3 integration with MetaMask SDK
- 📊 Chart components with Recharts
- 🔄 State management with Redux Toolkit
- 🏪 NFT Marketplace with listings, auctions, offers, and bundles
- 🎭 Mock data mode for development and testing
- ⛓️ Real blockchain integration with smart contracts
- 📈 Analytics dashboard with platform metrics
- 👑 Admin panel for marketplace management

## Tech Stack

- **Framework**: Next.js 15.5.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives with shadcn/ui
- **Icons**: Lucide React
- **Web3**: MetaMask SDK, Ethers.js
- **Charts**: Recharts
- **State Management**: Redux Toolkit
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zuno-marketplace-mini
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your configuration
```

4. Run the development server:
```bash
pnpm dev
# or
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Configuration

### Mock Data Mode (Development)

The application supports a single environment variable to switch between mock data and real blockchain interactions:

```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_DATA=true  # Use mock data for development
NEXT_PUBLIC_USE_MOCK_DATA=false # Use real blockchain contracts
```

### Real Blockchain Mode (Production)

When `NEXT_PUBLIC_USE_MOCK_DATA=false`, the application connects to real smart contracts. Configure the following environment variables:

#### Local Development Network
```bash
# Local Anvil/Hardhat network (default)
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
NEXT_PUBLIC_NFT_EXCHANGE_REGISTRY_LOCAL=0xa722bda6968f50778b973ae2701e90200c564b49
NEXT_PUBLIC_COLLECTION_FACTORY_REGISTRY_LOCAL=0x942ed2fa862887dc698682cc6a86355324f0f01e
NEXT_PUBLIC_LISTING_MANAGER_LOCAL=0x0fe4223ad99df788a6dcad148eb4086e6389ceb6
NEXT_PUBLIC_AUCTION_FACTORY_LOCAL=0xc7cdb7a2e5dda1b7a0e792fe1ef08ed20a6f56d4
NEXT_PUBLIC_OFFER_MANAGER_LOCAL=0x71a0b8a2245a9770a4d887ce1e4ecc6c1d4ff28c
NEXT_PUBLIC_BUNDLE_MANAGER_LOCAL=0xb185e9f6531ba9877741022c92ce858cdcc5760e
```

#### Sepolia Testnet
```bash
# Sepolia testnet configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
NEXT_PUBLIC_NFT_EXCHANGE_REGISTRY_SEPOLIA=your_sepolia_address
NEXT_PUBLIC_COLLECTION_FACTORY_REGISTRY_SEPOLIA=your_sepolia_address
# ... (add other contract addresses for Sepolia)
```

### Required Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_USE_MOCK_DATA` | Enable mock data mode | `true` | No |
| `NEXT_PUBLIC_DEFAULT_CHAIN_ID` | Default blockchain network | `31337` | No |
| `NEXT_PUBLIC_*_LOCAL` | Local network contract addresses | See addresses.ts | For local |
| `NEXT_PUBLIC_*_SEPOLIA` | Sepolia network contract addresses | `""` | For Sepolia |

## Smart Contract Integration

The application integrates with the following smart contracts:

### Core Contracts
- **NFTExchangeRegistry**: Central registry for all NFT exchanges
- **CollectionFactoryRegistry**: Factory for creating new NFT collections
- **ListingManager**: Manages NFT listings and purchases

### Advanced Features
- **AuctionFactory**: Creates and manages English/Dutch auctions
- **OfferManager**: Handles NFT offers (individual, collection, trait-based)
- **BundleManager**: Manages NFT bundles for bulk transactions

### Admin Contracts
- **FeeManager**: Platform fee management
- **AccessControl**: User role and permission management
- **EmergencyManager**: Emergency pause/unpause functionality
- **CollectionVerifier**: Collection verification system

## Development Workflow

### Mock Data Mode
1. Set `NEXT_PUBLIC_USE_MOCK_DATA=true`
2. Start development server
3. All blockchain interactions use mock data
4. No wallet connection required
5. Perfect for UI development and testing

### Real Contract Mode
1. Set `NEXT_PUBLIC_USE_MOCK_DATA=false`
2. Deploy contracts to local network (Anvil/Hardhat)
3. Configure contract addresses in `.env.local`
4. Connect MetaMask to local network
5. Test with real blockchain interactions

## Contract Services

The application includes specialized services for each contract type:

- **ExchangeService**: NFT listing, buying, and cancellation
- **AuctionService**: Auction creation, bidding, and settlement
- **OfferService**: Offer creation, acceptance, and cancellation
- **BundleService**: Bundle creation, purchasing, and management
- **CollectionService**: Basic ERC721/ERC1155 operations
- **RealTimeEventsService**: Blockchain event subscriptions

## API Documentation

### Service Methods

#### ExchangeService
```typescript
await exchangeService.createListing(params)
await exchangeService.buyNFT(contractAddress, tokenId, amount, tokenType)
await exchangeService.cancelListing(contractAddress, tokenId, tokenType)
```

#### AuctionService
```typescript
await auctionService.createEnglishAuction(params)
await auctionService.createDutchAuction(params)
await auctionService.placeBid(auctionId, bidAmount)
await auctionService.buyNow(auctionId, price)
```

#### OfferService
```typescript
await offerService.createNFTOffer(params)
await offerService.createCollectionOffer(params)
await offerService.acceptOffer(offerId)
await offerService.cancelOffer(offerId)
```

#### BundleService
```typescript
await bundleService.createBundle(params)
await bundleService.purchaseBundle(bundleId, price)
await bundleService.cancelBundle(bundleId)
```

## Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks
└── lib/               # Utility functions
```

## Development

This project uses:
- **Turbopack** for fast development builds
- **shadcn/ui** for consistent UI components
- **Tailwind CSS v4** for styling
- **TypeScript** for type safety

### Adding New Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com/new):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Deploy automatically

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.