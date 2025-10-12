# Contract Integration Guide

Complete guide to integrating smart contracts with the Zuno Marketplace frontend.

## Table of Contents

- [Overview](#overview)
- [MarketplaceHub Pattern](#marketplacehub-pattern)
- [Service Architecture](#service-architecture)
- [Contract Services](#contract-services)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Logging Integration](#logging-integration)
- [Advanced Topics](#advanced-topics)

## Overview

The Zuno Marketplace uses a streamlined contract integration pattern centered around the **MarketplaceHub**. This approach simplifies deployment and configuration by providing a single entry point for all contract addresses.

### Key Concepts

- **Single Address**: Only MarketplaceHub address needed per network
- **Auto-Discovery**: Hub provides all other contract addresses via registries
- **Type-Safe**: Full TypeScript support with auto-generated ABIs
- **Service Layer**: Clean abstraction over contract interactions
- **Singleton Pattern**: Services initialized once and reused
- **Production Logging**: Structured logging with context and performance tracking

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
await provider.send("eth_requestAccounts", []);
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
import { logger } from "@/lib/utils/logger";

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
    
    logger.success("MarketplaceHub initialized from contract", {
      hub: hubAddress,
      chainId,
      addresses: this.addresses,
    }, {
      component: "MarketplaceHubService",
      action: "initialize"
    });
  }

  private async loadAddresses(): Promise<void> {
    if (!this.hub) throw new Error("Hub not initialized");

    try {
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
    } catch (error) {
      logger.error("Failed to load addresses from hub", error, {
        component: "MarketplaceHubService",
        action: "loadAddresses"
      });
      throw error;
    }
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
import { logger } from "@/lib/utils/logger";

export class ExchangeService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    
    logger.success("ExchangeService initialized", null, {
      component: "ExchangeService",
      action: "initialize"
    });
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
    try {
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

      logger.info("Listing created successfully", {
        contractAddress: params.contractAddress,
        tokenId: params.tokenId,
        price: params.price,
        duration: params.duration,
        tokenType: params.tokenType
      }, {
        component: "ExchangeService",
        action: "createListing"
      });

      return tx;
    } catch (error) {
      logger.error("Error creating listing", error, {
        component: "ExchangeService",
        action: "createListing"
      });
      throw error;
    }
  }

  async buyListing(
    listingId: string,
    tokenType: "ERC721" | "ERC1155",
    price: string,
    amount: number = 1
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const exchange = this.getExchangeContract(tokenType);

      const tx = await exchange.buyNFT(listingId, amount, {
        value: ethers.parseEther(price),
      });

      logger.info("NFT purchase initiated", {
        listingId,
        tokenType,
        price,
        amount
      }, {
        component: "ExchangeService",
        action: "buyListing"
      });

      return tx;
    } catch (error) {
      logger.error("Error buying NFT", error, {
        component: "ExchangeService",
        action: "buyListing"
      });
      throw error;
    }
  }

  async cancelListing(
    listingId: string,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const exchange = this.getExchangeContract(tokenType);
      const tx = await exchange.cancelListing(listingId);
      
      logger.info("Listing cancelled", {
        listingId,
        tokenType
      }, {
        component: "ExchangeService",
        action: "cancelListing"
      });
      
      return tx;
    } catch (error) {
      logger.error("Error canceling listing", error, {
        component: "ExchangeService",
        action: "cancelListing"
      });
      throw error;
    }
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
import { logger } from "@/lib/utils/logger";

export class AuctionService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    
    logger.success("AuctionService initialized", null, {
      component: "AuctionService",
      action: "initialize"
    });
  }

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
    try {
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

      logger.info("English auction created", {
        nftContract: params.nftContract,
        tokenId: params.tokenId,
        startingBid: params.startingBid,
        reservePrice: params.reservePrice,
        duration: params.duration
      }, {
        component: "AuctionService",
        action: "createEnglishAuction"
      });

      return tx;
    } catch (error) {
      logger.error("Error creating English auction", error, {
        component: "AuctionService",
        action: "createEnglishAuction"
      });
      throw error;
    }
  }

  async placeBid(
    auctionId: string,
    bidAmount: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const auction = this.getAuctionContract("english");

      const tx = await auction.placeBid(auctionId, {
        value: ethers.parseEther(bidAmount),
      });

      logger.info("Bid placed", {
        auctionId,
        bidAmount
      }, {
        component: "AuctionService",
        action: "placeBid"
      });

      return tx;
    } catch (error) {
      logger.error("Error placing bid", error, {
        component: "AuctionService",
        action: "placeBid"
      });
      throw error;
    }
  }

  async endAuction(
    auctionId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const auction = this.getAuctionContract("english");
      const tx = await auction.endAuction(auctionId);
      
      logger.info("Auction ended", {
        auctionId
      }, {
        component: "AuctionService",
        action: "endAuction"
      });
      
      return tx;
    } catch (error) {
      logger.error("Error ending auction", error, {
        component: "AuctionService",
        action: "endAuction"
      });
      throw error;
    }
  }
}

export const auctionService = new AuctionService();
```

### CollectionService

Handles NFT collections and factory operations.

**File**: `src/lib/services/contracts/CollectionService.ts`

```typescript
import { logger } from "@/lib/utils/logger";

export class CollectionService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
  }

  async deployCollection(
    params: DeployCollectionParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
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

      logger.info("Collection deployed", {
        name: params.name,
        symbol: params.symbol,
        tokenType: params.tokenType,
        factoryAddress
      }, {
        component: "CollectionService",
        action: "deployCollection"
      });

      return tx;
    } catch (error) {
      logger.error("Error deploying collection", error, {
        component: "CollectionService",
        action: "deployCollection"
      });
      throw error;
    }
  }

  async setApprovalForAll(
    collectionAddress: string,
    operator: string,
    approved: boolean,
    tokenType: "ERC721" | "ERC1155"
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) throw new Error("Signer required");

      const abi =
        tokenType === "ERC721" ? ERC721Collection_ABI : ERC1155Collection_ABI;

      const collection = new ethers.Contract(collectionAddress, abi, this.signer);
      const tx = await collection.setApprovalForAll(operator, approved);
      
      logger.info("Approval set", {
        collectionAddress,
        operator,
        approved,
        tokenType
      }, {
        component: "CollectionService",
        action: "setApprovalForAll"
      });
      
      return tx;
    } catch (error) {
      logger.error("Error setting approval", error, {
        component: "CollectionService",
        action: "setApprovalForAll"
      });
      throw error;
    }
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
import { logger } from "@/lib/utils/logger";

export class BundleService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    
    logger.success("BundleService initialized with BundleManager", {
      bundleManagerAddress: marketplaceHubService.getBundleManager()
    }, {
      component: "BundleService",
      action: "initialize"
    });
  }

  async createBundle(
    params: CreateBundleParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
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

      logger.info("Bundle created", {
        nftContracts: params.nftContracts,
        tokenIds: params.tokenIds,
        amounts: params.amounts,
        price: params.price,
        duration: params.duration
      }, {
        component: "BundleService",
        action: "createBundle"
      });

      return tx;
    } catch (error) {
      logger.error("Error creating bundle", error, {
        component: "BundleService",
        action: "createBundle"
      });
      throw error;
    }
  }

  async buyBundle(
    bundleId: string,
    price: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
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

      logger.info("Bundle purchased", {
        bundleId,
        price
      }, {
        component: "BundleService",
        action: "buyBundle"
      });

      return tx;
    } catch (error) {
      logger.error("Error purchasing bundle", error, {
        component: "BundleService",
        action: "buyBundle"
      });
      throw error;
    }
  }
}

export const bundleService = new BundleService();
```

### OfferService

Handles offers on NFTs and collections.

**File**: `src/lib/services/contracts/OfferService.ts`

```typescript
import { logger } from "@/lib/utils/logger";

export class OfferService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    
    logger.success("OfferService initialized with OfferManager", {
      offerManagerAddress: marketplaceHubService.getOfferManager()
    }, {
      component: "OfferService",
      action: "initialize"
    });
  }

  async makeOffer(
    params: MakeOfferParams
  ): Promise<ethers.ContractTransactionResponse> {
    try {
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

      logger.info("Offer made", {
        nftContract: params.nftContract,
        tokenId: params.tokenId,
        tokenType: params.tokenType,
        offerPrice: params.offerPrice,
        duration: params.duration
      }, {
        component: "OfferService",
        action: "makeOffer"
      });

      return tx;
    } catch (error) {
      logger.error("Error making offer", error, {
        component: "OfferService",
        action: "makeOffer"
      });
      throw error;
    }
  }

  async acceptOffer(
    offerId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) throw new Error("Signer required");

      const offerAddress = marketplaceHubService.getOfferManager();
      const offer = new ethers.Contract(
        offerAddress,
        OfferManager_ABI,
        this.signer
      );

      const tx = await offer.acceptOffer(offerId);
      
      logger.info("Offer accepted", {
        offerId
      }, {
        component: "OfferService",
        action: "acceptOffer"
      });
      
      return tx;
    } catch (error) {
      logger.error("Error accepting offer", error, {
        component: "OfferService",
        action: "acceptOffer"
      });
      throw error;
    }
  }

  async cancelOffer(
    offerId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) throw new Error("Signer required");

      const offerAddress = marketplaceHubService.getOfferManager();
      const offer = new ethers.Contract(
        offerAddress,
        OfferManager_ABI,
        this.signer
      );

      const tx = await offer.cancelOffer(offerId);
      
      logger.info("Offer cancelled", {
        offerId
      }, {
        component: "OfferService",
        action: "cancelOffer"
      });
      
      return tx;
    } catch (error) {
      logger.error("Error canceling offer", error, {
        component: "OfferService",
        action: "cancelOffer"
      });
      throw error;
    }
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
import { logger } from "@/lib/utils/logger";

async function listNFT() {
  try {
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
    
    logger.success("NFT listed successfully!", {
      transactionHash: tx.hash,
      contractAddress: "0xYourNFTContract",
      tokenId: "1"
    }, {
      component: "ListingFlow",
      action: "listNFT"
    });
  } catch (error) {
    logger.error("Failed to list NFT", error, {
      component: "ListingFlow",
      action: "listNFT"
    });
    throw error;
  }
}
```

### Complete Flow: Creating an Auction

```typescript
import { auctionService, collectionService } from "@/lib/services/contracts";
import { logger } from "@/lib/utils/logger";

async function createAuction() {
  try {
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
    
    logger.success("Auction created successfully!", {
      transactionHash: tx.hash,
      nftContract: "0xYourNFTContract",
      tokenId: "1"
    }, {
      component: "AuctionFlow",
      action: "createAuction"
    });
  } catch (error) {
    logger.error("Failed to create auction", error, {
      component: "AuctionFlow",
      action: "createAuction"
    });
    throw error;
  }
}
```

### Listening to Events

```typescript
import { exchangeService } from "@/lib/services/contracts";
import { ERC721NFTExchange_ABI } from "@/lib/contracts/abis";
import { logger } from "@/lib/utils/logger";

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
      logger.info("New listing detected", {
        listingId: listingId.toString(),
        seller,
        nftContract,
        tokenId: tokenId.toString(),
        price: ethers.formatEther(price),
        transactionHash: event.transactionHash
      }, {
        component: "EventMonitor",
        action: "handleNFTListed"
      });
    }
  );

  // Listen for sales
  exchange.on("NFTSold", (listingId, buyer, seller, price, event) => {
    logger.info("NFT sold", {
      listingId: listingId.toString(),
      buyer,
      seller,
      price: ethers.formatEther(price),
      transactionHash: event.transactionHash
    }, {
      component: "EventMonitor",
      action: "handleNFTSold"
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

### 2. Handle Errors Properly with Logging

```typescript
import { logger } from "@/lib/utils/logger";

try {
  const tx = await exchangeService.createListing(params);
  await tx.wait();
  // Success handling
} catch (error: any) {
  if (error.code === "ACTION_REJECTED") {
    logger.warn("User rejected transaction", null, {
      component: "ExchangeService",
      action: "createListing"
    });
  } else if (error.message.includes("Not approved")) {
    logger.warn("NFT not approved for marketplace", null, {
      component: "ExchangeService",
      action: "createListing"
    });
  } else {
    logger.error("Transaction failed", error, {
      component: "ExchangeService",
      action: "createListing"
    });
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
  logger.info("Setting approval for marketplace", {
    nftContract,
    exchangeAddress
  }, {
    component: "ApprovalFlow",
    action: "setApproval"
  });
  
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
import { logger } from "@/lib/utils/logger";

if (!signer) {
  logger.error("Wallet not connected", null, {
    component: "WalletCheck",
    action: "validateConnection"
  });
  throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
}

if (chainId !== SUPPORTED_CHAIN_IDS.SEPOLIA) {
  logger.error("Wrong network", { chainId, expected: SUPPORTED_CHAIN_IDS.SEPOLIA }, {
    component: "NetworkCheck",
    action: "validateNetwork"
  });
  throw new Error(ERROR_MESSAGES.WRONG_NETWORK);
}
```

## Logging Integration

### Service Logging Standards

All services use the custom logger utility for structured logging:

```typescript
import { logger } from "@/lib/utils/logger";

// Service initialization logging
logger.success("ExchangeService initialized", null, {
  component: "ExchangeService",
  action: "initialize"
});

// Method execution logging
logger.info("Creating listing", {
  contractAddress: params.contractAddress,
  tokenId: params.tokenId,
  price: params.price
}, {
  component: "ExchangeService",
  action: "createListing"
});

// Error logging
logger.error("Failed to create listing", error, {
  component: "ExchangeService",
  action: "createListing"
});

// Success logging
logger.success("Listing created successfully", {
  listingId: result.listingId,
  transactionHash: result.transactionHash
}, {
  component: "ExchangeService",
  action: "createListing"
});
```

### Logging Context

Each service method should include:
- **component**: Service name (e.g., "ExchangeService")
- **action**: Method name (e.g., "createListing")
- **data**: Relevant method parameters and results
- **error**: Error details for error logs

### Performance Tracking

```typescript
import { logger } from "@/lib/utils/logger";

// Start timer for performance tracking
logger.startTimer("service-method");

try {
  // Service method execution
  const result = await this.contract.method();
  
  // End timer with success message
  logger.endTimer("service-method", "Service method completed", {
    component: "ServiceName",
    action: "methodName"
  });
  
  return result;
} catch (error) {
  // End timer with error message
  logger.endTimer("service-method", "Service method failed", {
    component: "ServiceName",
    action: "methodName"
  });
  
  throw error;
}
```

### Event Logging

```typescript
// Listen for blockchain events with logging
exchange.on("NFTListed", (listingId, seller, nftContract, tokenId, price, event) => {
  logger.info("NFT listed event", {
    listingId: listingId.toString(),
    seller,
    nftContract,
    tokenId: tokenId.toString(),
    price: ethers.formatEther(price),
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash
  }, {
    component: "EventMonitor",
    action: "handleNFTListed"
  });
});
```

## Real-Time Events

### Event Subscription

The marketplace provides real-time blockchain event monitoring through the `RealTimeEventsService`:

```typescript
import { useRealTimeEvents } from "@/hooks/useRealTimeEvents";
import { EventHandler } from "@/lib/services/contracts/RealTimeEvents";
import { logger } from "@/lib/utils/logger";

export default function MyComponent() {
  const handlers: EventHandler = {
    onListingCreated: (event) => {
      logger.info("New listing created", event, {
        component: "EventMonitor",
        action: "onListingCreated"
      });
      // Refresh UI
    },
    onListingPurchased: (event) => {
      logger.info("NFT purchased", event, {
        component: "EventMonitor",
        action: "onListingPurchased"
      });
      // Update listings
    },
    onOfferCreated: (event) => {
      logger.info("New offer created", event, {
        component: "EventMonitor",
        action: "onOfferCreated"
      });
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
import { logger } from "@/lib/utils/logger";

// Get current fee config
const config = await feeManagerService.getBaseFeeConfig();
logger.info("Current fee configuration", {
  makerFee: Number(config.makerFee) / 100,
  takerFee: Number(config.takerFee) / 100,
  listingFee: Number(config.listingFee) / 100
}, {
  component: "FeeManager",
  action: "getBaseFeeConfig"
});

// Update fees (admin only)
await feeManagerService.updateBaseFeeConfig({
  makerFee: BigInt(200), // 2%
  takerFee: BigInt(0),
  listingFee: BigInt(0),
  auctionFee: BigInt(50), // 0.5%
  bundleFee: BigInt(25), // 0.25%
  isActive: true,
});

logger.success("Fee configuration updated", {
  makerFee: "2%",
  takerFee: "0%",
  listingFee: "0%",
  auctionFee: "0.5%",
  bundleFee: "0.25%"
}, {
  component: "FeeManager",
  action: "updateBaseFeeConfig"
});
```

### Access Control

Manage roles and permissions:

```typescript
import { accessControlService } from "@/lib/services/contracts";
import { logger } from "@/lib/utils/logger";

// Grant admin role
const roleHash = accessControlService.getRoleHash("ADMIN_ROLE");
await accessControlService.grantRole(
  roleHash,
  userAddress,
  "Granted admin access"
);

logger.info("Admin role granted", {
  userAddress,
  role: "ADMIN_ROLE",
  reason: "Granted admin access"
}, {
  component: "AccessControl",
  action: "grantRole"
});

// Check user roles
const roles = await accessControlService.getActiveRoles(userAddress);
logger.info("User roles retrieved", {
  userAddress,
  roles: roles.map(role => role.name)
}, {
  component: "AccessControl",
  action: "getActiveRoles"
});
```

### Emergency Controls

Pause marketplace and manage blacklists:

```typescript
import { emergencyManagerService } from "@/lib/services/contracts";
import { logger } from "@/lib/utils/logger";

// Emergency pause
await emergencyManagerService.emergencyPause("Security incident detected");

logger.warn("Emergency pause activated", {
  reason: "Security incident detected"
}, {
  component: "EmergencyManager",
  action: "emergencyPause"
});

// Blacklist malicious contract
await emergencyManagerService.setContractBlacklist(
  contractAddress,
  true,
  "Malicious contract detected"
);

logger.warn("Contract blacklisted", {
  contractAddress,
  reason: "Malicious contract detected"
}, {
  component: "EmergencyManager",
  action: "setContractBlacklist"
});

// Check status
const status = await emergencyManagerService.getEmergencyStatus();
logger.info("Emergency status checked", status, {
  component: "EmergencyManager",
  action: "getEmergencyStatus"
});
```

### Collection Verification

Verify NFT collections:

```typescript
import { collectionVerifierService } from "@/lib/services/contracts";
import { logger } from "@/lib/utils/logger";

// Process verification
await collectionVerifierService.processVerificationRequest(
  collectionAddress,
  true, // approved
  "premium", // tier: basic, premium, featured
  "Verified authentic collection"
);

logger.success("Collection verification processed", {
  collectionAddress,
  approved: true,
  tier: "premium",
  reason: "Verified authentic collection"
}, {
  component: "CollectionVerifier",
  action: "processVerificationRequest"
});

// Get verification status
const verification = await collectionVerifierService.getCollectionVerification(
  collectionAddress
);

logger.info("Collection verification status", verification, {
  component: "CollectionVerifier",
  action: "getCollectionVerification"
});
```

### Royalty Management

Configure advanced royalties:

```typescript
import { royaltyManagerService } from "@/lib/services/contracts";
import { logger } from "@/lib/utils/logger";

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

logger.success("Advanced royalties configured", {
  collectionAddress,
  recipients: [
    { recipient: creatorAddress, basisPoints: "2.5%", role: "creator" },
    { recipient: platformAddress, basisPoints: "0.5%", role: "platform" }
  ],
  useERC2981: true
}, {
  component: "RoyaltyManager",
  action: "setAdvancedRoyalty"
});
```

### Timelock Actions

Schedule time-delayed admin actions:

```typescript
import { timelockService } from "@/lib/services/contracts";
import { logger } from "@/lib/utils/logger";

// Schedule an action
const { actionId } = await timelockService.scheduleAction(
  targetContract,
  encodedCalldata,
  BigInt(0), // value
  "Update platform fee to 2%"
);

logger.info("Timelock action scheduled", {
  actionId,
  targetContract,
  reason: "Update platform fee to 2%"
}, {
  component: "TimelockService",
  action: "scheduleAction"
});

// Execute when ready
await timelockService.executeAction(actionId);

logger.success("Timelock action executed", {
  actionId
}, {
  component: "TimelockService",
  action: "executeAction"
});
```

### Listing Validation

Configure listing validation rules:

```typescript
import { listingValidatorService } from "@/lib/services/contracts";
import { logger } from "@/lib/utils/logger";

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

logger.success("Global validation settings updated", {
  minPrice: "0.001 ETH",
  maxPrice: "10000 ETH",
  minDuration: "1 hour",
  maxDuration: "90 days",
  cooldownPeriod: "5 minutes",
  maxListingsPerUser: 100,
  requireVerifiedCollection: false,
  enableQualityCheck: true
}, {
  component: "ListingValidator",
  action: "setGlobalSettings"
});
```

## Analytics & History

### Marketplace Analytics

Track marketplace metrics:

```typescript
import { listingHistoryTrackerService } from "@/lib/services/contracts";
import { logger } from "@/lib/utils/logger";

// Get global stats
const stats = await listingHistoryTrackerService.getGlobalStats();
logger.info("Global marketplace stats", {
  totalVolume: stats.totalVolume,
  totalSales: stats.totalSales,
  averagePrice: stats.averagePrice
}, {
  component: "Analytics",
  action: "getGlobalStats"
});

// Get collection stats
const collectionStats = await listingHistoryTrackerService.getCollectionStats(
  collectionAddress
);
logger.info("Collection stats", {
  collectionAddress,
  floorPrice: collectionStats.floorPrice,
  ceilingPrice: collectionStats.ceilingPrice,
  averagePrice: collectionStats.averagePrice,
  totalVolume: collectionStats.totalVolume
}, {
  component: "Analytics",
  action: "getCollectionStats"
});

// Get user stats
const userStats = await listingHistoryTrackerService.getUserStats(userAddress);
logger.info("User stats", {
  userAddress,
  totalVolumeAsSeller: userStats.totalVolumeAsSeller,
  totalVolumeAsBuyer: userStats.totalVolumeAsBuyer,
  totalSales: userStats.totalSales,
  totalPurchases: userStats.totalPurchases
}, {
  component: "Analytics",
  action: "getUserStats"
});
```

## Environment Configuration

### .env.example

```bash
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
import { logger } from "@/lib/utils/logger";

export class CustomService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    
    logger.success("CustomService initialized", null, {
      component: "CustomService",
      action: "initialize"
    });
  }

  private getContract(): ethers.Contract {
    if (!this.signer) throw new Error("Signer required");

    const address = marketplaceHubService.getCustomContract();
    return new ethers.Contract(address, CustomContract_ABI, this.signer);
  }

  async customMethod(params: any): Promise<any> {
    try {
      const contract = this.getContract();
      const result = await contract.customFunction(params);
      
      logger.info("Custom method executed", {
        params,
        result
      }, {
        component: "CustomService",
        action: "customMethod"
      });
      
      return result;
    } catch (error) {
      logger.error("Custom method failed", error, {
        component: "CustomService",
        action: "customMethod"
      });
      throw error;
    }
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
import { logger } from "@/lib/utils/logger";

async function monitorTransaction(tx: ethers.ContractTransactionResponse) {
  logger.info("Transaction sent", {
    transactionHash: tx.hash
  }, {
    component: "TransactionMonitor",
    action: "monitorTransaction"
  });

  // Wait for 1 confirmation
  const receipt = await tx.wait(1);
  logger.success("Transaction confirmed", {
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString()
  }, {
    component: "TransactionMonitor",
    action: "monitorTransaction"
  });

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

  logger.info("Transaction events parsed", {
    transactionHash: tx.hash,
    eventCount: logs.length,
    events: logs.map(log => log.name)
  }, {
    component: "TransactionMonitor",
    action: "parseEvents"
  });
}
```

### Gas Estimation

```typescript
import { logger } from "@/lib/utils/logger";

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

  logger.info("Gas estimation completed", {
    estimatedGas: gasEstimate.toString(),
    gasPrice: "auto"
  }, {
    component: "GasEstimator",
    action: "estimateGas"
  });

  // Send with custom gas limit
  const tx = await exchange.listNFT(
    params.contractAddress,
    params.tokenId,
    1,
    ethers.parseEther(params.price),
    parseInt(params.duration) * 24 * 60 * 60,
    { gasLimit: (gasEstimate * 120n) / 100n } // 20% buffer
  );

  logger.info("Transaction sent with gas buffer", {
    transactionHash: tx.hash,
    gasLimit: ((gasEstimate * 120n) / 100n).toString(),
    buffer: "20%"
  }, {
    component: "GasEstimator",
    action: "sendTransaction"
  });

  return tx;
}
```

## Summary

The contract integration layer provides:

- **Single Address Configuration**: Only MarketplaceHub needed
- **Type-Safe Services**: Full TypeScript support
- **Clean Architecture**: Separation of concerns
- **Extensible**: Add new services easily
- **Production Logging**: Structured logging with context and performance tracking
- **ESLint Enforcement**: No console.log statements allowed

For architecture details, see [Code Structure Guide](./CODE_STRUCTURE.md).

For setup instructions, see [Setup Guide](./SETUP_GUIDE.md).