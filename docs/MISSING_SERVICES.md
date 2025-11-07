# Missing Services Documentation

**Last Updated**: 2025-11-06
**Related**: [ABI_COVERAGE.md](../ABI_COVERAGE.md)

## Overview

This document provides detailed information about the 3 missing services identified in the ABI coverage analysis. These services correspond to contracts in the Zuno Marketplace ABIs API that don't have corresponding service implementations.

---

## 1. AdvancedListingManager

**Priority**: MEDIUM
**Status**: Not Implemented
**Contract Source**: [Zuno Marketplace ABIs API](https://zuno-marketplace-abis.vercel.app)

### Purpose
The AdvancedListingManager contract provides advanced listing features beyond basic buy/sell functionality:
- Listing lifecycle management
- Batch operations for multiple listings
- Advanced filtering and search
- Listing metadata and state management

### Why It's Missing
- Core listing functionality already exists in `ExchangeService`
- May be a specialized contract for advanced features not yet needed
- Potentially used for administrative or backend operations

### When to Implement
Consider implementing this service when:
1. Users need advanced listing management features
2. Contract adds functionality beyond basic ExchangeService
3. Administrative panel requires listing lifecycle controls
4. Analytics require detailed listing state tracking

### Implementation Guide
If implementing this service:

```typescript
// src/lib/services/contracts/trading/AdvancedListingManagerService.ts

import { ethers } from "ethers";
import { userHubService } from "../core/UserHubService";
import { logger } from "@/lib/utils/logger";
import { getContractABI } from "@/lib/contracts/abi-manager";

export interface AdvancedListingParams {
  // Define based on contract ABI
  contractAddress: string;
  tokenId: string;
  // ... other params
}

export class AdvancedListingManagerService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    logger.success("AdvancedListingManagerService initialized", null, {
      component: "AdvancedListingManagerService",
      action: "initialize"
    });
  }

  // Implement contract methods here
}

export const advancedListingManagerService = new AdvancedListingManagerService();
```

**Integration Steps**:
1. Create service file in `src/lib/services/contracts/trading/`
2. Add to exports in `index.ts`
3. Add to service initialization array
4. Update ABI_COVERAGE.md

---

## 2. AuctionFactory

**Priority**: LOW
**Status**: Not Implemented
**Contract Source**: [Zuno Marketplace ABIs API](https://zuno-marketplace-abis.vercel.app)

### Purpose
The AuctionFactory contract uses the factory pattern to deploy new auction contracts:
- Creates custom auction contracts on-demand
- Manages auction contract templates
- Handles auction contract deployment
- Tracks deployed auction instances

### Why It's Missing
- Current `AuctionService` handles English/Dutch auctions
- Factory pattern typically used for deploying new contract types
- May be for creating custom auction types per collection/user
- Frontend usually doesn't need to call factory contracts directly

### When to Implement
Consider implementing this service when:
1. Users need to create custom auction contracts
2. Platform supports user-deployed auction types
3. Administrative panel needs to deploy new auction contracts
4. Per-collection auction customization is required

### Implementation Considerations
**Factory Pattern**:
- Factory contracts are usually called by other contracts or backend
- Frontend integration may not be necessary
- Could be integrated into existing `AuctionService`

**Alternative Approach**:
Instead of creating a separate service, consider adding factory methods to `AuctionService`:

```typescript
// In src/lib/services/contracts/trading/AuctionService.ts

/**
 * Deploy a new custom auction contract
 */
async deployCustomAuction(params: {
  auctionType: "English" | "Dutch" | "Custom";
  config: AuctionConfig;
}): Promise<string> {
  // Factory contract interaction
  const factoryAddress = userHubService.getAuctionFactory();
  const abi = await getContractABI("AuctionFactory");
  const factory = new ethers.Contract(factoryAddress, abi, this.signer);

  const tx = await factory.deployAuction(/* params */);
  const receipt = await tx.wait();

  return receipt.contractAddress;
}
```

---

## 3. Fee

**Priority**: LOW
**Status**: Not Implemented
**Contract Source**: [Zuno Marketplace ABIs API](https://zuno-marketplace-abis.vercel.app)

### Purpose
The Fee contract appears to be a basic fee management contract:
- Sets marketplace fee percentages
- Collects fees on transactions
- Manages fee recipients

### Why It's Missing
- `AdvancedFeeManager` already provides fee management
- "Fee" contract may be legacy/deprecated
- Advanced version supersedes basic version
- May be included for backward compatibility in API

### Investigation Needed
Before implementing:
1. **Check contract usage**: Is it actually used on-chain?
2. **Compare with AdvancedFeeManager**: What's the difference?
3. **Check contract dates**: Which was deployed first?
4. **Review contract code**: Is it deprecated?

### Decision Tree

```
Is Fee contract actively used on-chain?
├─ NO → Skip implementation (likely legacy)
└─ YES → Does it provide features beyond AdvancedFeeManager?
    ├─ NO → Skip implementation (use AdvancedFeeManager)
    └─ YES → Implement as separate service
```

### If Implementation Required
If investigation shows this contract is needed:

```typescript
// Option 1: Extend FeeManagerService
// src/lib/services/contracts/management/FeeManagerService.ts

/**
 * Support for basic Fee contract (legacy)
 */
async getBasicFee(): Promise<bigint> {
  // Implement basic fee contract methods
}

// Option 2: Create separate BasicFeeService
// Only if significantly different from AdvancedFeeManager
```

---

## Summary

| Service | Priority | Recommendation |
|---------|----------|----------------|
| AdvancedListingManager | Medium | Monitor contract usage, implement if features needed |
| AuctionFactory | Low | Consider integrating into AuctionService instead |
| Fee | Low | Investigate if legacy contract, use AdvancedFeeManager |

---

## Next Steps

### For Developers
1. **Monitor contract usage**: Track if these contracts are called on-chain
2. **Review contract ABIs**: Understand full functionality
3. **Check with contract team**: Confirm contract purposes and status
4. **Prioritize by user needs**: Implement based on feature requests

### Implementation Checklist
When implementing any missing service:

- [ ] Review contract ABI thoroughly
- [ ] Define TypeScript interfaces for contract types
- [ ] Create service class with proper initialization
- [ ] Add to service exports in index.ts
- [ ] Update ABI_COVERAGE.md
- [ ] Add JSDoc documentation
- [ ] Write integration guide
- [ ] Test with contract on testnet
- [ ] Update CLAUDE.md

---

## Resources

- [ABI Coverage Report](../ABI_COVERAGE.md)
- [Service Architecture](./SERVICE_ARCHITECTURE.md)
- [Zuno Marketplace ABIs API](https://zuno-marketplace-abis.vercel.app)
- [Contract Integration Guide](./CONTRACT_INTEGRATION.md)
