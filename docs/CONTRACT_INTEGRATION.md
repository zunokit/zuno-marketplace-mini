# Contract Integration Guide

Complete guide to integrating smart contracts with the Zuno Marketplace frontend.

## Table of Contents

- [Overview](#overview)
- [MarketplaceHub Pattern](#marketplacehub-pattern)
- [Service Architecture](#service-architecture)
- [Contract Services](#contract-services)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Advanced Topics](#advanced-topics)

## Overview

The Zuno Marketplace uses a streamlined contract integration pattern centered around the **MarketplaceHub**. This approach simplifies deployment and configuration by providing a single entry point for all contract addresses.

### Key Concepts

- **Single Address**: Only MarketplaceHub address needed per network
- **Auto-Discovery**: Hub provides all other contract addresses via registries
- **Type-Safe**: Full TypeScript support with auto-generated ABIs
- **Service Layer**: Clean abstraction over contract interactions
- **Singleton Pattern**: Services initialized once and reused

### Architecture Overview

```
Frontend Application
        ↓
  initializeServices()
        ↓
MarketplaceHubService
        ↓
   getAllAddresses()
        ↓
┌─────────────────────────────────┐
│  Exchange | Auction | Collection │
│  Bundle   | Offer   | Fees       │
└─────────────────────────────────┘
        ↓
  Smart Contracts
```

## MarketplaceHub Pattern

### What is MarketplaceHub?

MarketplaceHub is the central registry contract that maintains addresses for all marketplace contracts. Instead of configuring 15+ addresses, you only need one.

### Hub Responsibilities

1. **Address Registry**: Stores addresses for all core contracts
2. **Access Control**: Manages admin and operator roles
3. **Verification**: Provides contract verification methods
4. **Upgradability**: Central point for contract updates

### Hub Contract Structure

```solidity
// MarketplaceHub.sol (simplified)
contract MarketplaceHub {
    // Registries
    ExchangeRegistry public exchangeRegistry;
    CollectionRegistry public collectionRegistry;
    AuctionRegistry public auctionRegistry;
    FeeRegistry public feeRegistry;

    // Get all addresses at once
    function getAllAddresses() external view returns (
        address erc721Exchange,
        address erc1155Exchange,
        address erc721Factory,
        address erc1155Factory,
        address englishAuction,
        address dutchAuction,
        // ... more addresses
    );
}
```

### Frontend Integration

```typescript
// src/lib/contracts/addresses.ts
import { MarketplaceHub_ABI } from "./abis";

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

export function getMarketplaceHubAddress(chainId: number = 31337): string {
  const addresses = getContractAddresses(chainId);
  const address = addresses.MARKETPLACE_HUB;

  if (!address) {
    throw new Error(`MarketplaceHub address not found for chain ${chainId}`);
  }

  return address;
}
```

## Service Architecture

### Service Layer Overview

Services provide a clean, type-safe interface for contract interactions. Each service handles a specific domain (exchanges, auctions, etc.).

### Service Initialization Flow

```typescript
// 1. User connects wallet
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 2. Initialize all services
import { initializeServices } from "@/lib/services/contracts";
await initializeServices(provider, signer);

// 3. Use services anywhere
import { exchangeService } from "@/lib/services/contracts";
await exchangeService.createListing({ ... });
```

### MarketplaceHubService

Central service that loads all contract addresses from Hub.

**File**: `src/lib/services/contracts/MarketplaceHubService.ts`

```typescript
export class MarketplaceHubService {
  private hub: ethers.Contract | null = null;
  private addresses: MarketplaceAddresses | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const hubAddress = getMarketplaceHubAddress(chainId);

    this.hub = new ethers.Contract(
      hubAddress,
      MarketplaceHub_ABI,
      signer || provider
    );

    await this.loadAddresses();
  }

  private async loadAddresses(): Promise<void> {
    if (!this.hub) throw new Error("Hub not initialized");

    const result = await this.hub.getAllAddresses();

    this.addresses = {
      hub: await this.hub.getAddress(),
      erc721Exchange: result[0],
      erc1155Exchange: result[1],
      erc721Factory: result[2],
      erc1155Factory: result[3],
      englishAuction: result[4],
      dutchAuction: result[5],
      feeManager: result[6],
      royaltyManager: result[7],
      accessControl: result[8],
    };
  }

  // Getters for each address
  getERC721Exchange(): string {
    if (!this.addresses) throw new Error("Hub not initialized");
    return this.addresses.erc721Exchange;
  }

  getERC1155Exchange(): string {
    if (!this.addresses) throw new Error("Hub not initialized");
    return this.addresses.erc1155Exchange;
  }

  // ... more getters
}

// Singleton instance
export const marketplaceHubService = new MarketplaceHubService();
```

## Contract Services

### ExchangeService

Handles NFT listing, buying, and selling for both ERC721 and ERC1155 tokens.

**File**: `src/lib/services/contracts/ExchangeService.ts`

```typescript
export class ExchangeService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
  }

  private getExchangeContract(
    tokenType: "ERC721" | "ERC1155"
  ): ethers.Contract {
    if (!this.signer) throw new Error("Signer required");

    const address =
      tokenType === "ERC721"
        ? marketplaceHubService.getERC721Exchange()
        : marketplaceHubService.getERC1155Exchange();

    const abi =
      tokenType === "ERC721" ? ERC721NFTExchange_ABI : ERC1155NFTExchange_ABI;

    return new ethers.Contract(address, abi, this.signer);
  }

  async createListing(
    params: ListingParams
  ): Promise<ethers.ContractTransactionResponse> {
    const exchange = this.getExchangeContract(params.tokenType);

    const amount = params.tokenType === "ERC1155" ? params.amount || 1 : 1;
    const durationInSeconds = parseInt(params.duration) * 24 * 60 * 60;

    const tx = await exchange.listNFT(
      params.contractAddress,
      params.tokenId,
      amount,
      ethers.parseEther(params.price),
      durationInSeconds
    );

    return tx;
  }

  async buyListing(
    listingId: string,
    tokenType: "ERC721" | "ERC1155",
    price: string,
    amount: number = 1
  ): Promise<ethers.ContractTransactionResponse> {
    const exchange = this.getExchangeContract(tokenType);

    const tx = await exchange.buyNFT(listingId, amount, {
      value: ethers.parseEther(price),
    });

    return tx;
  }

  async cancelListing(
    listingId: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    const exchange = this.getExchangeContract(tokenType);
    return await exchange.cancelListing(listingId);
  }

  async getActiveListing(
    listingId: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<any> {
    const exchange = this.getExchangeContract(tokenType);
    return await exchange.getActiveListing(listingId);
  }
}

export const exchangeService = new ExchangeService();
```

### AuctionService

Manages English and Dutch auctions.

**File**: `src/lib/services/contracts/AuctionService.ts`

```typescript
export class AuctionService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  private getAuctionContract(
    auctionType: "english" | "dutch"
  ): ethers.Contract {
    if (!this.signer) throw new Error("Signer required");

    const address =
      auctionType === "english"
        ? marketplaceHubService.getEnglishAuction()
        : marketplaceHubService.getDutchAuction();

    const abi =
      auctionType === "english" ? EnglishAuction_ABI : DutchAuction_ABI;

    return new ethers.Contract(address, abi, this.signer);
  }

  async createEnglishAuction(
    params: EnglishAuctionParams
  ): Promise<ethers.ContractTransactionResponse> {
    const auction = this.getAuctionContract("english");

    const tx = await auction.createAuction(
      params.nftContract,
      params.tokenId,
      params.tokenType === "ERC721" ? 0 : 1,
      params.tokenType === "ERC1155" ? params.amount || 1 : 1,
      ethers.parseEther(params.startingBid),
      ethers.parseEther(params.reservePrice),
      Math.floor(Date.now() / 1000) + parseInt(params.duration) * 24 * 60 * 60
    );

    return tx;
  }

  async placeBid(
    auctionId: string,
    bidAmount: string
  ): Promise<ethers.ContractTransactionResponse> {
    const auction = this.getAuctionContract("english");

    const tx = await auction.placeBid(auctionId, {
      value: ethers.parseEther(bidAmount),
    });

    return tx;
  }

  async endAuction(
    auctionId: string
  ): Promise<ethers.ContractTransactionResponse> {
    const auction = this.getAuctionContract("english");
    return await auction.endAuction(auctionId);
  }
}

export const auctionService = new AuctionService();
```

### CollectionService

Handles NFT collections and factory operations.

**File**: `src/lib/services/contracts/CollectionService.ts`

```typescript
export class CollectionService {
  async deployCollection(
    params: DeployCollectionParams
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required");

    const factoryAddress =
      params.tokenType === "ERC721"
        ? marketplaceHubService.getERC721Factory()
        : marketplaceHubService.getERC1155Factory();

    const factoryABI =
      params.tokenType === "ERC721"
        ? ERC721CollectionFactory_ABI
        : ERC1155CollectionFactory_ABI;

    const factory = new ethers.Contract(
      factoryAddress,
      factoryABI,
      this.signer
    );

    const tx = await factory.createCollection(
      params.name,
      params.symbol,
      params.baseURI || "",
      params.royaltyBps || 0
    );

    return tx;
  }

  async setApprovalForAll(
    collectionAddress: string,
    operator: string,
    approved: boolean,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required");

    const abi =
      tokenType === "ERC721" ? ERC721Collection_ABI : ERC1155Collection_ABI;

    const collection = new ethers.Contract(collectionAddress, abi, this.signer);
    return await collection.setApprovalForAll(operator, approved);
  }

  async isApprovedForAll(
    collectionAddress: string,
    owner: string,
    operator: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<boolean> {
    if (!this.provider) throw new Error("Provider required");

    const abi =
      tokenType === "ERC721" ? ERC721Collection_ABI : ERC1155Collection_ABI;

    const collection = new ethers.Contract(
      collectionAddress,
      abi,
      this.provider
    );
    return await collection.isApprovedForAll(owner, operator);
  }
}

export const collectionService = new CollectionService();
```

### BundleService

Manages NFT bundles (multiple NFTs sold together).

**File**: `src/lib/services/contracts/BundleService.ts`

```typescript
export class BundleService {
  async createBundle(
    params: CreateBundleParams
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required");

    const bundleAddress = marketplaceHubService.getBundleManager();
    const bundle = new ethers.Contract(
      bundleAddress,
      BundleManager_ABI,
      this.signer
    );

    const tx = await bundle.createBundle(
      params.nftContracts,
      params.tokenIds,
      params.amounts,
      ethers.parseEther(params.price),
      Math.floor(Date.now() / 1000) + parseInt(params.duration) * 24 * 60 * 60
    );

    return tx;
  }

  async buyBundle(
    bundleId: string,
    price: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required");

    const bundleAddress = marketplaceHubService.getBundleManager();
    const bundle = new ethers.Contract(
      bundleAddress,
      BundleManager_ABI,
      this.signer
    );

    const tx = await bundle.buyBundle(bundleId, {
      value: ethers.parseEther(price),
    });

    return tx;
  }
}

export const bundleService = new BundleService();
```

### OfferService

Handles offers on NFTs and collections.

**File**: `src/lib/services/contracts/OfferService.ts`

```typescript
export class OfferService {
  async makeOffer(
    params: MakeOfferParams
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required");

    const offerAddress = marketplaceHubService.getOfferManager();
    const offer = new ethers.Contract(
      offerAddress,
      OfferManager_ABI,
      this.signer
    );

    const expirationTime =
      Math.floor(Date.now() / 1000) + parseInt(params.duration) * 24 * 60 * 60;

    const tx = await offer.makeOffer(
      params.nftContract,
      params.tokenId,
      params.tokenType === "ERC721" ? 0 : 1,
      ethers.parseEther(params.offerPrice),
      expirationTime,
      { value: ethers.parseEther(params.offerPrice) }
    );

    return tx;
  }

  async acceptOffer(
    offerId: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required");

    const offerAddress = marketplaceHubService.getOfferManager();
    const offer = new ethers.Contract(
      offerAddress,
      OfferManager_ABI,
      this.signer
    );

    return await offer.acceptOffer(offerId);
  }

  async cancelOffer(
    offerId: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required");

    const offerAddress = marketplaceHubService.getOfferManager();
    const offer = new ethers.Contract(
      offerAddress,
      OfferManager_ABI,
      this.signer
    );

    return await offer.cancelOffer(offerId);
  }
}

export const offerService = new OfferService();
```

## Usage Examples

### Complete Flow: Listing an NFT

```typescript
import {
  initializeServices,
  exchangeService,
  collectionService,
} from "@/lib/services/contracts";
import { BrowserProvider } from "ethers";

async function listNFT() {
  // 1. Connect wallet
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  // 2. Initialize services
  await initializeServices(provider, signer);

  // 3. Approve NFT for exchange
  const exchangeAddress = marketplaceHubService.getERC721Exchange();

  await collectionService.setApprovalForAll(
    "0xYourNFTContract",
    exchangeAddress,
    true,
    "ERC721"
  );

  // 4. Create listing
  const tx = await exchangeService.createListing({
    contractAddress: "0xYourNFTContract",
    tokenId: "1",
    price: "1.0", // 1 ETH
    duration: "7", // 7 days
    tokenType: "ERC721",
  });

  // 5. Wait for confirmation
  await tx.wait();
  console.log("NFT listed successfully!");
}
```

### Complete Flow: Creating an Auction

```typescript
import { auctionService, collectionService } from "@/lib/services/contracts";

async function createAuction() {
  // Assume services are initialized

  // 1. Approve NFT for auction contract
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
  console.log("Auction created!");
}
```

### Listening to Events

```typescript
import { exchangeService } from "@/lib/services/contracts";
import { ERC721NFTExchange_ABI } from "@/lib/contracts/abis";

async function listenToListings() {
  const exchangeAddress = marketplaceHubService.getERC721Exchange();
  const exchange = new ethers.Contract(
    exchangeAddress,
    ERC721NFTExchange_ABI,
    provider
  );

  // Listen for new listings
  exchange.on(
    "NFTListed",
    (listingId, seller, nftContract, tokenId, price, event) => {
      console.log("New listing:", {
        listingId: listingId.toString(),
        seller,
        nftContract,
        tokenId: tokenId.toString(),
        price: ethers.formatEther(price),
      });
    }
  );

  // Listen for sales
  exchange.on("NFTSold", (listingId, buyer, seller, price, event) => {
    console.log("NFT sold:", {
      listingId: listingId.toString(),
      buyer,
      seller,
      price: ethers.formatEther(price),
    });
  });
}
```

## Best Practices

### 1. Always Initialize Services

```typescript
// ❌ Bad
await exchangeService.createListing({ ... }); // May fail if not initialized

// ✅ Good
await initializeServices(provider, signer);
await exchangeService.createListing({ ... });
```

### 2. Handle Errors Properly

```typescript
try {
  const tx = await exchangeService.createListing(params);
  await tx.wait();
  // Success handling
} catch (error: any) {
  if (error.code === "ACTION_REJECTED") {
    console.log("User rejected transaction");
  } else if (error.message.includes("Not approved")) {
    console.log("NFT not approved for marketplace");
  } else {
    console.error("Transaction failed:", error);
  }
}
```

### 3. Check Approvals Before Transactions

```typescript
const isApproved = await collectionService.isApprovedForAll(
  nftContract,
  userAddress,
  exchangeAddress,
  "ERC721"
);

if (!isApproved) {
  await collectionService.setApprovalForAll(
    nftContract,
    exchangeAddress,
    true,
    "ERC721"
  );
}

// Now safe to create listing
await exchangeService.createListing({ ... });
```

### 4. Use TypeScript Types

```typescript
import type { ListingParams, EnglishAuctionParams } from "@/types";

const params: ListingParams = {
  contractAddress: "0x...",
  tokenId: "1",
  price: "1.0",
  duration: "7",
  tokenType: "ERC721",
};
```

### 5. Centralized Error Messages

```typescript
import { ERROR_MESSAGES } from "@/lib/constants";

if (!signer) {
  throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
}

if (chainId !== SUPPORTED_CHAIN_IDS.SEPOLIA) {
  throw new Error(ERROR_MESSAGES.WRONG_NETWORK);
}
```

## Real-Time Events

### Event Subscription

The marketplace provides real-time blockchain event monitoring through the `RealTimeEventsService`:

```typescript
import { useRealTimeEvents } from "@/hooks/useRealTimeEvents";
import { EventHandler } from "@/lib/services/contracts/RealTimeEvents";

export default function MyComponent() {
  const handlers: EventHandler = {
    onListingCreated: (event) => {
      console.log("New listing:", event);
      // Refresh UI
    },
    onListingPurchased: (event) => {
      console.log("NFT sold:", event);
      // Update listings
    },
    onOfferCreated: (event) => {
      console.log("New offer:", event);
    },
    // ... more handlers
  };

  const { isInitialized } = useRealTimeEvents(handlers, {
    includeListings: true,
    includeOffers: true,
    includeAuctions: true,
    includeBundles: true,
  });

  return <div>Event monitoring active: {isInitialized ? "Yes" : "No"}</div>;
}
```

### Available Events

- **Listings**: `NFTListed`, `NFTSold`, `ListingCancelled`
- **Offers**: `OfferMade`, `OfferAccepted`, `OfferCancelled`
- **Auctions**: `AuctionCreated`, `BidPlaced`, `AuctionEnded`
- **Bundles**: `BundleCreated`, `BundlePurchased`, `BundleCancelled`

## Admin Features

### Fee Management

Configure platform fees and tier discounts:

```typescript
import { feeManagerService } from "@/lib/services/contracts";

// Get current fee config
const config = await feeManagerService.getBaseFeeConfig();
console.log("Maker fee:", Number(config.makerFee) / 100, "%");

// Update fees (admin only)
await feeManagerService.updateBaseFeeConfig({
  makerFee: BigInt(200), // 2%
  takerFee: BigInt(0),
  listingFee: BigInt(0),
  auctionFee: BigInt(50), // 0.5%
  bundleFee: BigInt(25), // 0.25%
  isActive: true,
});
```

### Access Control

Manage roles and permissions:

```typescript
import { accessControlService } from "@/lib/services/contracts";

// Grant admin role
const roleHash = accessControlService.getRoleHash("ADMIN_ROLE");
await accessControlService.grantRole(
  roleHash,
  userAddress,
  "Granted admin access"
);

// Check user roles
const roles = await accessControlService.getActiveRoles(userAddress);
```

### Emergency Controls

Pause marketplace and manage blacklists:

```typescript
import { emergencyManagerService } from "@/lib/services/contracts";

// Emergency pause
await emergencyManagerService.emergencyPause("Security incident detected");

// Blacklist malicious contract
await emergencyManagerService.setContractBlacklist(
  contractAddress,
  true,
  "Malicious contract detected"
);

// Check status
const status = await emergencyManagerService.getEmergencyStatus();
```

### Collection Verification

Verify NFT collections:

```typescript
import { collectionVerifierService } from "@/lib/services/contracts";

// Process verification
await collectionVerifierService.processVerificationRequest(
  collectionAddress,
  true, // approved
  "premium", // tier: basic, premium, featured
  "Verified authentic collection"
);

// Get verification status
const verification = await collectionVerifierService.getCollectionVerification(
  collectionAddress
);
```

### Royalty Management

Configure advanced royalties:

```typescript
import { royaltyManagerService } from "@/lib/services/contracts";

// Set royalties with multiple recipients
await royaltyManagerService.setAdvancedRoyalty(
  collectionAddress,
  [
    {
      recipient: creatorAddress,
      basisPoints: BigInt(250), // 2.5%
      role: "creator",
      isActive: true,
    },
    {
      recipient: platformAddress,
      basisPoints: BigInt(50), // 0.5%
      role: "platform",
      isActive: true,
    },
  ],
  true // useERC2981
);
```

### Timelock Actions

Schedule time-delayed admin actions:

```typescript
import { timelockService } from "@/lib/services/contracts";

// Schedule an action
const { actionId } = await timelockService.scheduleAction(
  targetContract,
  encodedCalldata,
  BigInt(0), // value
  "Update platform fee to 2%"
);

// Execute when ready
await timelockService.executeAction(actionId);
```

### Listing Validation

Configure listing validation rules:

```typescript
import { listingValidatorService } from "@/lib/services/contracts";

// Update global settings
await listingValidatorService.setGlobalSettings({
  minPrice: ethers.parseEther("0.001"),
  maxPrice: ethers.parseEther("10000"),
  minDuration: BigInt(3600), // 1 hour
  maxDuration: BigInt(7776000), // 90 days
  cooldownPeriod: BigInt(300), // 5 minutes
  maxListingsPerUser: BigInt(100),
  requireVerifiedCollection: false,
  enableQualityCheck: true,
  isActive: true,
});
```

## Analytics & History

### Marketplace Analytics

Track marketplace metrics:

```typescript
import { listingHistoryTrackerService } from "@/lib/services/contracts";

// Get global stats
const stats = await listingHistoryTrackerService.getGlobalStats();
console.log("Total volume:", stats.totalVolume);
console.log("Total sales:", stats.totalSales);

// Get collection stats
const collectionStats = await listingHistoryTrackerService.getCollectionStats(
  collectionAddress
);
console.log("Floor price:", collectionStats.floorPrice);

// Get user stats
const userStats = await listingHistoryTrackerService.getUserStats(userAddress);
console.log("User volume:", userStats.totalVolumeAsSeller);
```

## Environment Configuration

### .env.example

```bash
# Mode
NEXT_PUBLIC_USE_MOCK_DATA=false

# Network
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337

# Hub Addresses (One per network - all other addresses auto-discovered)
NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA=0x...
NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET=0x...
```

**Important**: Do NOT add individual contract addresses. The Hub provides all addresses.

## Advanced Topics

### Custom Service Creation

```typescript
// src/lib/services/contracts/CustomService.ts
import { ethers } from "ethers";
import { marketplaceHubService } from "./MarketplaceHubService";
import { CustomContract_ABI } from "@/lib/contracts/abis";

export class CustomService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
  }

  private getContract(): ethers.Contract {
    if (!this.signer) throw new Error("Signer required");

    const address = marketplaceHubService.getCustomContract();
    return new ethers.Contract(address, CustomContract_ABI, this.signer);
  }

  async customMethod(params: any): Promise<any> {
    const contract = this.getContract();
    return await contract.customFunction(params);
  }
}

export const customService = new CustomService();
```

### Adding to initializeServices

```typescript
// src/lib/services/contracts/index.ts
import { customService } from "./CustomService";

export async function initializeServices(
  provider: any,
  signer?: any
): Promise<void> {
  await marketplaceHubService.initialize(provider, signer);

  await Promise.all([
    exchangeService.initialize(provider, signer),
    auctionService.initialize(provider, signer),
    // ... existing services
    customService.initialize(provider, signer), // Add new service
  ]);
}
```

### Transaction Monitoring

```typescript
async function monitorTransaction(tx: ethers.ContractTransactionResponse) {
  console.log("Transaction sent:", tx.hash);

  // Wait for 1 confirmation
  const receipt = await tx.wait(1);
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  // Parse logs
  const exchange = new ethers.Contract(
    exchangeAddress,
    ERC721NFTExchange_ABI,
    provider
  );

  const logs = receipt.logs
    .map((log) => {
      try {
        return exchange.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .filter((log) => log !== null);

  console.log("Events emitted:", logs);
}
```

### Gas Estimation

```typescript
async function createListingWithGasEstimate(params: ListingParams) {
  const exchange = exchangeService["getExchangeContract"](params.tokenType);

  // Estimate gas
  const gasEstimate = await exchange.listNFT.estimateGas(
    params.contractAddress,
    params.tokenId,
    1,
    ethers.parseEther(params.price),
    parseInt(params.duration) * 24 * 60 * 60
  );

  console.log("Estimated gas:", gasEstimate.toString());

  // Send with custom gas limit
  const tx = await exchange.listNFT(
    params.contractAddress,
    params.tokenId,
    1,
    ethers.parseEther(params.price),
    parseInt(params.duration) * 24 * 60 * 60,
    { gasLimit: (gasEstimate * 120n) / 100n } // 20% buffer
  );

  return tx;
}
```

## Summary

The contract integration layer provides:

- **Single Address Configuration**: Only MarketplaceHub needed
- **Type-Safe Services**: Full TypeScript support
- **Clean Architecture**: Separation of concerns
- **Easy Testing**: Mock mode for development
- **Extensible**: Add new services easily

For architecture details, see [Code Structure Guide](./CODE_STRUCTURE.md).

For setup instructions, see [Setup Guide](./SETUP_GUIDE.md).
