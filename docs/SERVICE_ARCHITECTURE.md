# Service Architecture Documentation

## 🏗️ Kiến trúc Services

### Overview

Marketplace sử dụng **MarketplaceHub Pattern** - một pattern đơn giản hóa việc tích hợp frontend với smart contracts.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│              13 Service Classes                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MarketplaceHubService (Address Discovery)           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ExchangeService, AuctionService, BundleService      │  │
│  │  OfferService, CollectionService                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  FeeManagerService, RoyaltyManagerService            │  │
│  │  AccessControlService, EmergencyManagerService       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ListingValidatorService, HistoryTrackerService      │  │
│  │  CollectionVerifierService, TimelockService          │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   23 Contract ABIs                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Smart Contracts (Blockchain)                    │
│  - MarketplaceHub (Single Entry Point)                      │
│  - 4 Registries (Address Management)                        │
│  - 18 Core Contracts (Business Logic)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Service Categories

### 1. Core Services (1)

#### MarketplaceHubService

**Purpose**: Single entry point for address discovery

**Key Methods**:

- `initialize()` - Initialize and load all addresses
- `getAddresses()` - Get all contract addresses
- `getBundleManager()` - Get BundleManager address
- `getOfferManager()` - Get OfferManager address
- `calculateFees()` - Calculate fees for a sale
- `verifyCollection()` - Verify collection validity

**Usage**:

```typescript
import { marketplaceHubService } from "@/lib/services/contracts";

// Initialize
await marketplaceHubService.initialize(provider, signer);

// Get all addresses
const addresses = marketplaceHubService.getAddresses();

// Calculate fees
const fees = await marketplaceHubService.calculateFees(
  nftAddress,
  tokenId,
  salePrice
);
```

---

### 2. Trading Services (5)

#### ExchangeService

**Contracts**: ERC721NFTExchange, ERC1155NFTExchange

**Key Methods**:

- `listNFT()` - Create listing
- `buyNFT()` - Purchase NFT
- `cancelListing()` - Cancel listing
- `batchListNFTs()` - Batch create listings
- `getListing()` - Get listing details

#### AuctionService

**Contracts**: EnglishAuction, DutchAuction

**Key Methods**:

- `createEnglishAuction()` - Start English auction
- `createDutchAuction()` - Start Dutch auction
- `placeBid()` - Place bid
- `endAuction()` - End auction
- `getAuctionInfo()` - Get auction details

#### BundleService

**Contracts**: BundleManager

**Key Methods**:

- `createBundle()` - Create NFT bundle
- `purchaseBundle()` - Buy bundle
- `updateBundlePrice()` - Update price
- `cancelBundle()` - Cancel bundle
- `getBundleInfo()` - Get bundle details

#### OfferService

**Contracts**: OfferManager

**Key Methods**:

- `createNFTOffer()` - Make offer on NFT
- `createCollectionOffer()` - Make collection offer
- `acceptOffer()` - Accept offer
- `cancelOffer()` - Cancel offer
- `getOfferInfo()` - Get offer details

#### CollectionService

**Contracts**: ERC721Collection, ERC1155Collection, Factories

**Key Methods**:

- `createCollection()` - Deploy new collection
- `mintNFT()` - Mint NFT
- `setApproval()` - Approve marketplace
- `getCollectionInfo()` - Get collection info

---

### 3. Management Services (2)

#### FeeManagerService

**Contract**: AdvancedFeeManager

**Key Features**:

- Fee tier system (Bronze → Platinum)
- VIP status management
- Volume-based discounts
- Collection-specific fees

**Key Methods**:

- `calculateFees()` - Calculate final fees with discounts
- `getUserFeeTier()` - Get user's current tier
- `getUserVolumeData()` - Get trading volume
- `checkTierUpgradeEligibility()` - Check upgrade eligibility
- `getCollectionFeeOverride()` - Get collection fees
- `updateVIPStatus()` - Update VIP status (admin)

**Fee Tiers**:

```typescript
enum FeeTierName {
  BRONZE = "Bronze", // 0% discount
  SILVER = "Silver", // 5% discount
  GOLD = "Gold", // 10% discount
  PLATINUM = "Platinum", // 15% discount
}
```

#### RoyaltyManagerService

**Contract**: AdvancedRoyaltyManager

**Key Features**:

- ERC2981 standard support
- Multiple royalty recipients
- Custom royalty overrides

**Key Methods**:

- `getRoyaltyInfo()` - Get ERC2981 royalty
- `getAdvancedRoyalty()` - Get advanced settings
- `getRoyaltyRecipients()` - Get all recipients
- `setAdvancedRoyalty()` - Set royalties (admin)
- `calculateAndDistributeRoyalties()` - Distribute royalties

---

### 4. Security Services (3)

#### AccessControlService

**Contract**: MarketplaceAccessControl

**Roles**:

- `ADMIN_ROLE` - Full admin access
- `MODERATOR_ROLE` - Content moderation
- `OPERATOR_ROLE` - Operations management
- `VERIFIER_ROLE` - Collection verification
- `EMERGENCY_ROLE` - Emergency operations
- `PAUSER_ROLE` - Pause functionality

**Key Methods**:

- `hasRole()` - Check if user has role
- `grantRole()` - Grant role with reason
- `revokeRole()` - Revoke role with reason
- `getActiveRoles()` - Get user's roles
- `batchGrantRoles()` - Batch role operations
- `hasPermission()` - Check specific permission

#### EmergencyManagerService

**Contract**: EmergencyManager

**Key Methods**:

- `emergencyPause()` - Pause marketplace
- `emergencyUnpause()` - Unpause marketplace
- `setContractBlacklist()` - Blacklist contract
- `setUserBlacklist()` - Blacklist user
- `emergencyWithdraw()` - Emergency withdraw funds
- `isContractBlacklisted()` - Check blacklist status

#### TimelockService

**Contract**: MarketplaceTimelock

**Key Methods**:

- `scheduleAction()` - Schedule time-locked action
- `executeAction()` - Execute after timelock
- `cancelAction()` - Cancel pending action
- `getActionData()` - Get action details
- `getPendingActions()` - Get all pending actions

**Timelock Duration**: 48 hours (172800 seconds)

---

### 5. Validation & Analytics Services (3)

#### ListingValidatorService

**Contract**: ListingValidator

**Key Methods**:

- `validateListing()` - Validate before creation
- `validateListingUpdate()` - Validate update
- `canUserCreateListing()` - Check user eligibility
- `getCollectionSettings()` - Get validation rules
- `isUserRateLimited()` - Check rate limits

**Validation Checks**:

- Price range validation
- Duration validation
- Cooldown period check
- User listing limits
- Spam detection

#### ListingHistoryTrackerService

**Contract**: ListingHistoryTracker

**Key Methods**:

- `getNFTHistory()` - Get NFT transaction history
- `getCollectionStats()` - Get collection analytics
- `getUserStats()` - Get user statistics
- `getGlobalStats()` - Get marketplace stats
- `getCollectionPriceHistory()` - Get price trends
- `getTodayVolume()` - Get daily volume

**Analytics Data**:

- Floor price, ceiling price, average price
- Total volume, sales count
- User trading volume
- Daily/hourly trends

#### CollectionVerifierService

**Contract**: CollectionVerifier

**Key Methods**:

- `isCollectionVerified()` - Check verification status
- `requestVerification()` - Request verification
- `getCollectionVerification()` - Get verification details
- `getCollectionMetadata()` - Get metadata
- `processVerificationRequest()` - Process request (admin)

**Verification Tiers**:

- Basic ✓
- Premium ⭐
- Featured 👑

---

## 🔄 Service Initialization

### Initialization Flow

```typescript
import { initializeServices } from "@/lib/services/contracts";
import { ethers } from "ethers";

// 1. Get provider and signer
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 2. Initialize all services
await initializeServices(provider, signer);

// 3. Use services
import {
  marketplaceHubService,
  exchangeService,
  feeManagerService,
} from "@/lib/services/contracts";

// Get addresses
const addresses = marketplaceHubService.getAddresses();

// List NFT
await exchangeService.listNFT({
  collection: "0x...",
  tokenId: 1n,
  price: ethers.parseEther("1.0"),
  duration: 7 * 24 * 3600,
});
```

### Service Dependencies

```
MarketplaceHubService (MUST initialize first)
        ↓
All Other Services (initialize in parallel)
```

---

## 📋 Service Method Patterns

### Standard Method Signatures

#### Read Methods (Query)

```typescript
async getXXX(...params): Promise<ResultType>
```

- No signer required
- Returns data from blockchain
- No gas cost

#### Write Methods (Transaction)

```typescript
async doXXX(...params): Promise<ethers.ContractTransactionResponse>
```

- Requires signer
- Modifies blockchain state
- Costs gas
- Returns transaction receipt

#### Validation Methods

```typescript
async validateXXX(...params): Promise<ValidationResult>
```

- Pre-flight checks
- Client-side or contract validation
- Returns errors if invalid

---

## 🎯 Common Usage Patterns

### Pattern 1: Check before Transaction

```typescript
// 1. Validate
const validation = await listingValidatorService.validateListing(
  listing,
  userAddress
);

if (!validation.isValid) {
  logger.error("Validation errors:", validation.errors, {
    component: "ListingForm",
    action: "validateListing",
  });
  return;
}

// 2. Execute
const tx = await exchangeService.listNFT(params);
await tx.wait();
```

### Pattern 2: Check Permissions

```typescript
// Check if user has admin role
const isAdmin = await accessControlService.hasRole(
  accessControlService.ROLES.ADMIN,
  userAddress
);

if (!isAdmin) {
  throw new Error("Admin access required");
}

// Execute admin action
await feeManagerService.updateBaseFeeConfig(newConfig);
```

### Pattern 3: Calculate Fees First

```typescript
// Get fee breakdown
const fees = await marketplaceHubService.calculateFees(
  nftAddress,
  tokenId,
  salePrice
);

logger.info(
  "Fee breakdown",
  {
    platformFee: ethers.formatEther(fees.platformFee),
    royalty: ethers.formatEther(fees.royaltyFee),
    total: ethers.formatEther(fees.totalFees),
  },
  {
    component: "FeeCalculator",
    action: "calculateFees",
  }
);

// Show to user before transaction
```

### Pattern 4: Monitor Events

```typescript
// Listen for emergency events
await emergencyManagerService.monitorEmergencyEvents((event) => {
  if (event.name === "EmergencyPaused") {
    logger.warn("Marketplace paused!", null, {
      component: "EmergencyMonitor",
      action: "handleEmergencyPause",
    });
    alert("Marketplace paused!");
  }
});

// Cleanup when done
await emergencyManagerService.stopMonitoring();
```

---

## 🚨 Error Handling

### Service Errors

```typescript
try {
  await exchangeService.listNFT(params);
} catch (error) {
  if (error.code === "ACTION_REJECTED") {
    // User rejected transaction
    logger.warn("Transaction rejected by user", null, {
      component: "ExchangeService",
      action: "listNFT",
    });
  } else if (error.code === "INSUFFICIENT_FUNDS") {
    // Not enough gas
    logger.error("Insufficient funds for transaction", error, {
      component: "ExchangeService",
      action: "listNFT",
    });
  } else if (error.message.includes("NOT_APPROVED")) {
    // NFT not approved for marketplace
    logger.error("NFT not approved for marketplace", error, {
      component: "ExchangeService",
      action: "listNFT",
    });
  }
}
```

### Common Error Codes

- `ACTION_REJECTED` - User rejected transaction
- `INSUFFICIENT_FUNDS` - Insufficient balance
- `UNPREDICTABLE_GAS_LIMIT` - Gas estimation failed
- `CALL_EXCEPTION` - Contract revert

---

## 📊 Service Statistics

| Category   | Services | Contracts | Methods (avg) |
| ---------- | -------- | --------- | ------------- |
| Core       | 1        | 1         | 10            |
| Trading    | 5        | 8         | 15            |
| Management | 2        | 2         | 20            |
| Security   | 3        | 3         | 15            |
| Validation | 3        | 3         | 12            |
| **Total**  | **13**   | **23**    | **~180**      |

---

## 🔗 Service Dependencies

```
All Services depend on:
  - ethers.js
  - Contract ABIs
  - MarketplaceHubService (for addresses)
  - Logger utility (for structured logging)

No circular dependencies
Each service is independent
```

---

## 📝 Logging Integration

### Service Logging Standards

All services use the custom logger utility for structured logging:

```typescript
import { logger } from "@/lib/utils/logger";

// Service initialization logging
logger.success("ExchangeService initialized", null, {
  component: "ExchangeService",
  action: "initialize",
});

// Method execution logging
logger.info(
  "Creating listing",
  {
    contractAddress: params.contractAddress,
    tokenId: params.tokenId,
    price: params.price,
  },
  {
    component: "ExchangeService",
    action: "listNFT",
  }
);

// Error logging
logger.error("Failed to create listing", error, {
  component: "ExchangeService",
  action: "listNFT",
});

// Success logging
logger.success(
  "Listing created successfully",
  {
    listingId: result.listingId,
    transactionHash: result.transactionHash,
  },
  {
    component: "ExchangeService",
    action: "listNFT",
  }
);
```

### Logging Context

Each service method should include:

- **component**: Service name (e.g., "ExchangeService")
- **action**: Method name (e.g., "listNFT")
- **data**: Relevant method parameters and results
- **error**: Error details for error logs

### Performance Tracking

```typescript
// Start timer for performance tracking
logger.startTimer("service-method");

try {
  // Service method execution
  const result = await this.contract.method();

  // End timer with success message
  logger.endTimer("service-method", "Service method completed", {
    component: "ServiceName",
    action: "methodName",
  });

  return result;
} catch (error) {
  // End timer with error message
  logger.endTimer("service-method", "Service method failed", {
    component: "ServiceName",
    action: "methodName",
  });

  throw error;
}
```

---

_Last updated: 2025-01-06_
_Total Services: 13_
_Total Methods: ~180_
_Logging: Production-ready structured logging with context_
