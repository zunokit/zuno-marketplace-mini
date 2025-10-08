# NFT Marketplace Test Scripts

This directory contains test scripts for creating collections and minting NFTs on the Zuno Marketplace.

## Setup

1. Ensure your root `.env` file has the required configuration:
```bash
# Check if .env exists in root
cat ../.env

# Or copy from example if needed
cp ../.env.example ../.env
```

2. The scripts use the same environment variables as the main application:
- `NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL` - Hub address for local network
- `NEXT_PUBLIC_RPC_URL_LOCAL` - RPC URL for local network
- Similar variables for Sepolia and Mainnet

3. Make sure dependencies are installed:
```bash
# In root directory
npm install
# or
pnpm install
```

## Directory Structure

```
scripts/
├── collections/         # Collection creation scripts
│   ├── create-erc721.js
│   └── create-erc1155.js
├── nfts/               # NFT minting scripts
│   ├── mint-erc721.js
│   ├── mint-erc1155.js
│   ├── batch-mint-erc721.js
│   └── batch-mint-erc1155.js
├── utils/              # Shared utilities
│   └── config.js
└── test-all.js         # Run all tests
```

## Usage

### Create Collections

#### ERC721 Collection
```bash
node scripts/collections/create-erc721.js
```

#### ERC1155 Collection
```bash
node scripts/collections/create-erc1155.js
```

### Mint NFTs

#### Single ERC721 NFT
```bash
# Mint 1 NFT
node scripts/nfts/mint-erc721.js 0xCollectionAddress

# Mint 5 NFTs
node scripts/nfts/mint-erc721.js 0xCollectionAddress 5

# Mint to specific address
node scripts/nfts/mint-erc721.js 0xCollectionAddress 1 0xRecipientAddress
```

#### Single ERC1155 Token
```bash
# Mint 100 units of token ID 1
node scripts/nfts/mint-erc1155.js 0xCollectionAddress 1 100

# Mint to specific address
node scripts/nfts/mint-erc1155.js 0xCollectionAddress 1 100 0xRecipientAddress
```

### Batch Mint NFTs

#### Batch ERC721 NFTs
```bash
# Mint 20 NFTs
node scripts/nfts/batch-mint-erc721.js 0xCollectionAddress 20

# Mint to multiple recipients
node scripts/nfts/batch-mint-erc721.js 0xCollectionAddress 10 0xAddress1 0xAddress2
```

#### Batch ERC1155 Tokens
```bash
# Mint multiple token IDs with different amounts
node scripts/nfts/batch-mint-erc1155.js 0xCollectionAddress 1,2,3 100,200,300

# This mints:
# - 100 units of token ID 1
# - 200 units of token ID 2  
# - 300 units of token ID 3
```

### Run All Tests
```bash
# Test everything: create collections and mint NFTs
node scripts/test-all.js
```

## Environment Variables

The scripts use the same environment variables as the main application from the root `.env` file:

```env
# Local Network (required for local testing)
NEXT_PUBLIC_RPC_URL_LOCAL=http://127.0.0.1:8545
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x68B1D87F95878fE05B998F19b66F4baba5De1aed

# Sepolia Testnet (optional)
NEXT_PUBLIC_RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=

# Mainnet (optional)
NEXT_PUBLIC_RPC_URL_MAINNET=https://mainnet.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET=
```

## Features

### Smart Contract Detection
The scripts automatically detect and use the correct mint functions:
- For ERC721: `mint`, `publicMint`, `safeMint`, `mintBatch`, etc.
- For ERC1155: `mint`, `publicMint`, `mintBatch`, etc.

### Error Handling
- Validates addresses and parameters
- Checks mint prices and balances
- Verifies collection metadata
- Handles missing functions gracefully

### Batch Operations
- Batch minting with automatic fallback to sequential minting
- Multiple recipient support
- Supply limit detection and adjustment

### Network Support
- Local network (Anvil/Hardhat)
- Sepolia testnet
- Ethereum mainnet

## Troubleshooting

### "Hub address not configured"
Make sure to set the hub address in your `.env` file for the network you're using.

### "No compatible mint function found"
The collection contract might have different mint function names or requirements. Check the contract's ABI.

### "Collection name or symbol is empty"
This is a known issue with some smart contract implementations. The collection is created but metadata might not be stored correctly.

### Transaction Reverts
- Check you have enough ETH for gas and mint fees
- Verify the collection hasn't reached max supply
- Ensure you're using the correct network

## Development

To add new scripts or modify existing ones:

1. Use the utilities in `utils/config.js` for common operations
2. Follow the existing patterns for error handling
3. Add appropriate console logging for user feedback
4. Test on local network first before testnet/mainnet

## Security

⚠️ **NEVER commit your `.env` file with private keys or API keys!**

The root `.env` file is gitignored by default. Keep your private keys secure.
