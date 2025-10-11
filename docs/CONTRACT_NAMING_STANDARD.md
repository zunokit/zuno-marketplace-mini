# Contract Naming Standards

## 📋Name Format for Contracts & ABIs

### 1. Naming Convention

#### Contract Names (Solidity)
```
Format: PascalCase
Examples:
  - MarketplaceHub
  - ERC721NFTExchange
  - AdvancedFeeManager
```

#### ABI Export Names (TypeScript)
```
Format: {ContractName}_ABI
Examples:
  - MarketplaceHub_ABI
  - ERC721NFTExchange_ABI
  - AdvancedFeeManager_ABI
```

#### ABI File Names
```
Format: {ContractName}.json
Examples:
  - MarketplaceHub.json
  - ERC721NFTExchange.json
  - AdvancedFeeManager.json
```

---

## 📦 Danh sách Contracts chuẩn

### Core Contracts (1)

| Contract Name | ABI Export | File Path |
|--------------|------------|-----------|
| `MarketplaceHub` | `MarketplaceHub_ABI` | `MarketplaceHub.json` |

### Exchange Contracts (2)

| Contract Name | ABI Export | File Path |
|--------------|------------|-----------|
| `ERC721NFTExchange` | `ERC721NFTExchange_ABI` | `ERC721NFTExchange.json` |
| `ERC1155NFTExchange` | `ERC1155NFTExchange_ABI` | `ERC1155NFTExchange.json` |

### Auction Contracts (2)

| Contract Name | ABI Export | File Path |
|--------------|------------|-----------|
| `EnglishAuction` | `EnglishAuction_ABI` | `EnglishAuction.json` |
| `DutchAuction` | `DutchAuction_ABI` | `DutchAuction.json` |

### Feature Contracts (2)

| Contract Name | ABI Export | File Path |
|--------------|------------|-----------|
| `BundleManager` | `BundleManager_ABI` | `BundleManager.json` |
| `OfferManager` | `OfferManager_ABI` | `OfferManager.json` |

### Collection Contracts (4)

| Contract Name | ABI Export | File Path |
|--------------|------------|-----------|
| `ERC721Collection` | `ERC721Collection_ABI` | `ERC721Collection.json` |
| `ERC1155Collection` | `ERC1155Collection_ABI` | `ERC1155Collection.json` |
| `ERC721CollectionFactory` | `ERC721CollectionFactory_ABI` | `ERC721CollectionFactory.json` |
| `ERC1155CollectionFactory` | `ERC1155CollectionFactory_ABI` | `ERC1155CollectionFactory.json` |

### Registry Contracts (4)

| Contract Name | ABI Export | File Path |
|--------------|------------|-----------|
| `ExchangeRegistry` | `ExchangeRegistry_ABI` | `ExchangeRegistry.json` |
| `CollectionRegistry` | `CollectionRegistry_ABI` | `CollectionRegistry.json` |
| `AuctionRegistry` | `AuctionRegistry_ABI` | `AuctionRegistry.json` |
| `FeeRegistry` | `FeeRegistry_ABI` | `FeeRegistry.json` |

### Fee & Royalty Management (2)

| Contract Name | ABI Export | File Path |
|--------------|------------|-----------|
| `AdvancedFeeManager` | `AdvancedFeeManager_ABI` | `AdvancedFeeManager.json` |
| `AdvancedRoyaltyManager` | `AdvancedRoyaltyManager_ABI` | `AdvancedRoyaltyManager.json` |

### Access Control & Security (3)

| Contract Name | ABI Export | File Path |
|--------------|------------|-----------|
| `MarketplaceAccessControl` | `MarketplaceAccessControl_ABI` | `MarketplaceAccessControl.json` |
| `EmergencyManager` | `EmergencyManager_ABI` | `EmergencyManager.json` |
| `MarketplaceTimelock` | `MarketplaceTimelock_ABI` | `MarketplaceTimelock.json` |

### Validation & Analytics (3)

| Contract Name | ABI Export | File Path |
|--------------|------------|-----------|
| `ListingValidator` | `ListingValidator_ABI` | `ListingValidator.json` |
| `ListingHistoryTracker` | `ListingHistoryTracker_ABI` | `ListingHistoryTracker.json` |
| `CollectionVerifier` | `CollectionVerifier_ABI` | `CollectionVerifier.json` |

---

## 🔧 Service Naming Standards

### Service Class Names
```
Format: {ContractName}Service
Examples:
  - MarketplaceHubService
  - FeeManagerService
  - AccessControlService
```

### Service Instance Names
```
Format: {contractName}Service (camelCase)
Examples:
  - marketplaceHubService
  - feeManagerService
  - accessControlService
```

### Service File Names
```
Format: {ContractName}Service.ts
Examples:
  - MarketplaceHubService.ts
  - FeeManagerService.ts
  - AccessControlService.ts
```

---

## 📊 Contract-Service Mapping

| Contract | Service Class | Service Instance | File |
|----------|--------------|------------------|------|
| `MarketplaceHub` | `MarketplaceHubService` | `marketplaceHubService` | `MarketplaceHubService.ts` |
| `ERC721NFTExchange` | `ExchangeService` | `exchangeService` | `ExchangeService.ts` |
| `ERC1155NFTExchange` | `ExchangeService` | `exchangeService` | `ExchangeService.ts` |
| `EnglishAuction` | `AuctionService` | `auctionService` | `AuctionService.ts` |
| `DutchAuction` | `AuctionService` | `auctionService` | `AuctionService.ts` |
| `BundleManager` | `BundleService` | `bundleService` | `BundleService.ts` |
| `OfferManager` | `OfferService` | `offerService` | `OfferService.ts` |
| `ERC721Collection` | `CollectionService` | `collectionService` | `CollectionService.ts` |
| `ERC1155Collection` | `CollectionService` | `collectionService` | `CollectionService.ts` |
| `AdvancedFeeManager` | `FeeManagerService` | `feeManagerService` | `FeeManagerService.ts` |
| `AdvancedRoyaltyManager` | `RoyaltyManagerService` | `royaltyManagerService` | `RoyaltyManagerService.ts` |
| `MarketplaceAccessControl` | `AccessControlService` | `accessControlService` | `AccessControlService.ts` |
| `EmergencyManager` | `EmergencyManagerService` | `emergencyManagerService` | `EmergencyManagerService.ts` |
| `ListingValidator` | `ListingValidatorService` | `listingValidatorService` | `ListingValidatorService.ts` |
| `ListingHistoryTracker` | `ListingHistoryTrackerService` | `listingHistoryTrackerService` | `ListingHistoryTrackerService.ts` |
| `CollectionVerifier` | `CollectionVerifierService` | `collectionVerifierService` | `CollectionVerifierService.ts` |
| `MarketplaceTimelock` | `TimelockService` | `timelockService` | `TimelockService.ts` |

---

## 📝 Usage Examples

### Import ABIs
```typescript
// Individual import
import { MarketplaceHub_ABI } from '@/lib/contracts/abis';

// Multiple imports
import {
  MarketplaceHub_ABI,
  ERC721NFTExchange_ABI,
  AdvancedFeeManager_ABI
} from '@/lib/contracts/abis';

// All ABIs via object
import { ABIS } from '@/lib/contracts/abis';
const hubABI = ABIS.MarketplaceHub;
```

### Import Services
```typescript
// Individual service
import { marketplaceHubService } from '@/lib/services/contracts';

// Multiple services
import {
  marketplaceHubService,
  feeManagerService,
  accessControlService
} from '@/lib/services/contracts';

// Service classes
import {
  MarketplaceHubService,
  FeeManagerService
} from '@/lib/services/contracts';
```

### Create Contract Instance
```typescript
import { ethers } from 'ethers';
import { MarketplaceHub_ABI } from '@/lib/contracts/abis';

const provider = new ethers.BrowserProvider(window.ethereum);
const hubContract = new ethers.Contract(
  hubAddress,
  MarketplaceHub_ABI,
  provider
);
```

---

## ✅ Checklist for Adding New Contract

- [ ] Contract name in PascalCase
- [ ] ABI file named `{ContractName}.json`
- [ ] Added to `extract-abis.js` script
- [ ] Run `node scripts/extract-abis.js`
- [ ] Service class created as `{ContractName}Service.ts`
- [ ] Service instance exported as `{contractName}Service`
- [ ] Added to `src/lib/services/contracts/index.ts`
- [ ] Added to `initializeServices()` function
- [ ] Update this documentation

---

## 🚫 Common Mistakes to Avoid

### ❌ Wrong
```typescript
// Wrong ABI import name
import { marketplaceHub } from '@/lib/contracts/abis';

// Wrong service instance name
import { MarketplaceHub } from '@/lib/services/contracts';

// Wrong file name
MarketplaceHubservice.ts
marketplace-hub-service.ts
```

### ✅ Correct
```typescript
// Correct ABI import
import { MarketplaceHub_ABI } from '@/lib/contracts/abis';

// Correct service import
import { marketplaceHubService } from '@/lib/services/contracts';

// Correct file name
MarketplaceHubService.ts
```

---

## 📖 Quick Reference

### Total Counts
- **Total Contracts**: 23
- **Total Services**: 13
- **Total ABIs**: 23

### Categories
- Core: 1
- Exchange: 2
- Auction: 2
- Features: 2
- Collections: 4
- Registries: 4
- Management: 2
- Security: 3
- Validation: 3

---

## 🔄 Update Process

When contracts are updated in `zuno-marketplace-contracts`:

1. Build contracts: `cd zuno-marketplace-contracts && forge build`
2. Extract ABIs: `cd zuno-marketplace-mini && node scripts/extract-abis.js`
3. Verify all ABIs extracted successfully
4. Update services if contract interface changed
5. Update this documentation if new contracts added

---

*Last updated: 2025-01-06*
*Total Contracts: 23*
*Total Services: 13*
