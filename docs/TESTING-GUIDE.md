# Testing Guide for Zuno Marketplace

Comprehensive guide for testing contract services, utilities, and frontend components.

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Structure](#test-structure)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing](#e2e-testing)
6. [Test Utilities](#test-utilities)
7. [Best Practices](#best-practices)

---

## Testing Philosophy

### Test Pyramid

```
        /\
       /E2E\          ← Few, slow, expensive
      /------\
     /  INT   \       ← Some, medium speed
    /----------\
   /    UNIT    \     ← Many, fast, cheap
  /--------------\
```

**Target Coverage:**
- Unit Tests: 80%+ coverage
- Integration Tests: Key user flows
- E2E Tests: Critical paths only

---

## Test Structure

### Directory Layout

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── validators.test.ts
│   │   │   ├── crypto-formatter.test.ts
│   │   │   └── contract-errors.test.ts
│   │   ├── services/
│   │   │   ├── ExchangeService.test.ts
│   │   │   └── AuctionService.test.ts
│   │   └── components/
│   │       └── ListingCard.test.tsx
│   ├── integration/
│   │   ├── marketplace-flow.test.ts
│   │   ├── auction-flow.test.ts
│   │   └── bundle-flow.test.ts
│   └── e2e/
│       ├── create-listing.spec.ts
│       ├── buy-nft.spec.ts
│       └── make-offer.spec.ts
└── __mocks__/
    ├── ethers.ts
    ├── contracts.ts
    └── providers.ts
```

---

## Unit Testing

### Testing Utilities (Validators, Formatters)

```typescript
// __tests__/unit/utils/validators.test.ts
import { describe, it, expect } from 'vitest';
import { ContractValidator } from '@/lib/utils/validators';

describe('ContractValidator', () => {
  describe('validateAddress', () => {
    it('should accept valid Ethereum address', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

      expect(() => {
        ContractValidator.validateAddress(validAddress);
      }).not.toThrow();
    });

    it('should reject invalid address format', () => {
      const invalidAddress = 'not-an-address';

      expect(() => {
        ContractValidator.validateAddress(invalidAddress);
      }).toThrow('not a valid Ethereum address');
    });

    it('should reject empty address', () => {
      expect(() => {
        ContractValidator.validateAddress('');
      }).toThrow('Address is required');
    });

    it('should use custom field name in error', () => {
      expect(() => {
        ContractValidator.validateAddress('invalid', 'NFT Contract');
      }).toThrow('NFT Contract is not a valid Ethereum address');
    });
  });

  describe('validatePrice', () => {
    it('should accept valid positive price', () => {
      expect(() => {
        ContractValidator.validatePrice('1.5');
      }).not.toThrow();
    });

    it('should reject negative price', () => {
      expect(() => {
        ContractValidator.validatePrice('-1');
      }).toThrow('must be greater than 0');
    });

    it('should reject non-numeric price', () => {
      expect(() => {
        ContractValidator.validatePrice('abc');
      }).toThrow('must be a valid number');
    });

    it('should reject zero price', () => {
      expect(() => {
        ContractValidator.validatePrice('0');
      }).toThrow('must be greater than 0');
    });
  });
});
```

```typescript
// __tests__/unit/utils/crypto-formatter.test.ts
import { describe, it, expect } from 'vitest';
import { CryptoFormatter } from '@/lib/utils/crypto-formatter';

describe('CryptoFormatter', () => {
  describe('formatPrice', () => {
    it('should format 1 ETH correctly', () => {
      const result = CryptoFormatter.formatPrice(1000000000000000000n, 4);
      expect(result).toBe('1.0000');
    });

    it('should format 0.5 ETH correctly', () => {
      const result = CryptoFormatter.formatPrice(500000000000000000n, 2);
      expect(result).toBe('0.50');
    });

    it('should append ETH unit when requested', () => {
      const result = CryptoFormatter.formatPrice(1500000000000000000n, 4, true);
      expect(result).toBe('1.5000 ETH');
    });

    it('should handle very small amounts', () => {
      const result = CryptoFormatter.formatPrice(1000000000000000n, 6);
      expect(result).toBe('0.001000');
    });
  });

  describe('formatFee', () => {
    it('should format 2.5% fee', () => {
      const result = CryptoFormatter.formatFee(250);
      expect(result).toBe('2.50%');
    });

    it('should format 10% fee', () => {
      const result = CryptoFormatter.formatFee(1000);
      expect(result).toBe('10.00%');
    });

    it('should handle bigint input', () => {
      const result = CryptoFormatter.formatFee(500n);
      expect(result).toBe('5.00%');
    });
  });
});
```

### Testing Services (With Mocks)

```typescript
// __tests__/unit/services/ExchangeService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExchangeService } from '@/lib/services/contracts/trading/ExchangeService';
import { ethers } from 'ethers';

// Mock dependencies
vi.mock('@/lib/contracts/abi-manager');
vi.mock('@/lib/services/contracts/core/UserHubService');

describe('ExchangeService', () => {
  let service: ExchangeService;
  let mockProvider: any;
  let mockSigner: any;
  let mockContract: any;

  beforeEach(() => {
    service = new ExchangeService();

    mockProvider = {
      getNetwork: vi.fn().mockResolvedValue({ chainId: 31337, name: 'localhost' }),
    };

    mockSigner = {
      getAddress: vi.fn().mockResolvedValue('0x123...'),
    };

    mockContract = {
      listNFT: vi.fn(),
      buyNFT: vi.fn(),
      cancelListing: vi.fn(),
      getUserListings: vi.fn(),
    };
  });

  describe('initialize', () => {
    it('should initialize with provider and signer', async () => {
      await service.initialize(mockProvider, mockSigner);

      expect(service.isInitialized()).toBe(true);
      expect(service.hasSigner()).toBe(true);
    });

    it('should initialize with provider only', async () => {
      await service.initialize(mockProvider);

      expect(service.isInitialized()).toBe(true);
      expect(service.hasSigner()).toBe(false);
    });
  });

  describe('listNFT', () => {
    beforeEach(async () => {
      await service.initialize(mockProvider, mockSigner);
    });

    it('should create listing successfully', async () => {
      const listingId = '1';
      mockContract.listNFT.mockResolvedValue({
        wait: vi.fn().mockResolvedValue({
          logs: [{
            eventName: 'NFTListed',
            args: { listingId },
          }],
        }),
      });

      const params = {
        contractAddress: '0x1234...',
        tokenId: '1',
        price: '1.0',
        duration: '86400',
        tokenType: 'ERC721' as const,
      };

      const result = await service.listNFT(params);

      expect(result).toBe(listingId);
      expect(mockContract.listNFT).toHaveBeenCalled();
    });

    it('should throw error if signer not available', async () => {
      await service.initialize(mockProvider); // No signer

      const params = {
        contractAddress: '0x1234...',
        tokenId: '1',
        price: '1.0',
        duration: '86400',
        tokenType: 'ERC721' as const,
      };

      await expect(service.listNFT(params)).rejects.toThrow('Signer not available');
    });

    it('should handle user rejection', async () => {
      mockContract.listNFT.mockRejectedValue({
        code: 'ACTION_REJECTED',
        message: 'User rejected',
      });

      const params = {
        contractAddress: '0x1234...',
        tokenId: '1',
        price: '1.0',
        duration: '86400',
        tokenType: 'ERC721' as const,
      };

      await expect(service.listNFT(params)).rejects.toThrow('Transaction was rejected by user');
    });
  });
});
```

---

## Integration Testing

### Testing Complete Flows

```typescript
// __tests__/integration/marketplace-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ethers } from 'ethers';
import { exchangeService } from '@/lib/services/contracts';
import { setupTestEnvironment, cleanupTestEnvironment } from '../utils/test-helpers';

describe('Marketplace Flow Integration', () => {
  let provider: ethers.Provider;
  let seller: ethers.Signer;
  let buyer: ethers.Signer;
  let nftContract: ethers.Contract;

  beforeAll(async () => {
    // Setup test environment with local blockchain
    const env = await setupTestEnvironment();
    provider = env.provider;
    seller = env.accounts[0];
    buyer = env.accounts[1];
    nftContract = env.contracts.testNFT;

    // Initialize services
    await exchangeService.initialize(provider, seller);
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  it('should complete full listing → purchase flow', async () => {
    // Step 1: Mint NFT to seller
    const mintTx = await nftContract.mint(await seller.getAddress(), 1);
    await mintTx.wait();

    // Step 2: Approve exchange contract
    const exchangeAddress = exchangeService.getExchangeAddress();
    const approveTx = await nftContract.setApprovalForAll(exchangeAddress, true);
    await approveTx.wait();

    // Step 3: Create listing
    const listingId = await exchangeService.listNFT({
      contractAddress: await nftContract.getAddress(),
      tokenId: '1',
      price: '1.0',
      duration: '86400',
      tokenType: 'ERC721',
    });

    expect(listingId).toBeDefined();

    // Step 4: Verify listing exists
    const listing = await exchangeService.getListing(listingId);
    expect(listing.isActive).toBe(true);
    expect(listing.price).toBe(ethers.parseEther('1.0'));

    // Step 5: Buy NFT as buyer
    await exchangeService.initialize(provider, buyer);
    await exchangeService.buyNFT(listingId, { value: ethers.parseEther('1.0') });

    // Step 6: Verify ownership changed
    const newOwner = await nftContract.ownerOf(1);
    expect(newOwner).toBe(await buyer.getAddress());

    // Step 7: Verify listing deactivated
    const updatedListing = await exchangeService.getListing(listingId);
    expect(updatedListing.isActive).toBe(false);
  });
});
```

---

## E2E Testing

### Using Playwright/Cypress

```typescript
// __tests__/e2e/create-listing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Create NFT Listing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000');

    // Connect wallet (MetaMask)
    await page.click('[data-testid="connect-wallet"]');
    await page.click('[data-testid="metamask-option"]');
    // ... wallet connection steps
  });

  test('should create listing with valid inputs', async ({ page }) => {
    // Navigate to create listing page
    await page.click('[data-testid="create-listing"]');

    // Fill in listing form
    await page.fill('[data-testid="nft-address"]', '0x1234...');
    await page.fill('[data-testid="token-id"]', '1');
    await page.fill('[data-testid="price"]', '1.5');
    await page.selectOption('[data-testid="duration"]', '86400');

    // Submit form
    await page.click('[data-testid="submit-listing"]');

    // Wait for transaction confirmation
    await page.waitForSelector('[data-testid="tx-success"]', { timeout: 30000 });

    // Verify success message
    const successMessage = await page.textContent('[data-testid="success-message"]');
    expect(successMessage).toContain('Listing created successfully');

    // Verify listing appears in user's listings
    await page.click('[data-testid="my-listings"]');
    const firstListing = await page.textContent('[data-testid="listing-0"]');
    expect(firstListing).toContain('1.5 ETH');
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.click('[data-testid="create-listing"]');

    // Submit empty form
    await page.click('[data-testid="submit-listing"]');

    // Check for validation errors
    await expect(page.locator('[data-testid="error-nft-address"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-price"]')).toBeVisible();
  });
});
```

---

## Test Utilities

### Mock Helpers

```typescript
// __tests__/utils/mocks.ts
import { vi } from 'vitest';
import { ethers } from 'ethers';

export function createMockProvider() {
  return {
    getNetwork: vi.fn().mockResolvedValue({ chainId: 31337, name: 'localhost' }),
    getCode: vi.fn().mockResolvedValue('0x1234'),
    getBlock: vi.fn(),
    getTransaction: vi.fn(),
  };
}

export function createMockSigner(address = '0x1234567890123456789012345678901234567890') {
  return {
    getAddress: vi.fn().mockResolvedValue(address),
    signMessage: vi.fn(),
    signTransaction: vi.fn(),
  };
}

export function createMockContract() {
  return {
    listNFT: vi.fn(),
    buyNFT: vi.fn(),
    cancelListing: vi.fn(),
    getUserListings: vi.fn().mockResolvedValue([]),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn(),
    interface: {
      parseLog: vi.fn(),
    },
  };
}
```

### Test Fixtures

```typescript
// __tests__/fixtures/listings.ts
export const mockListing = {
  listingId: '1',
  seller: '0x1234567890123456789012345678901234567890',
  contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  tokenId: 42n,
  amount: 1n,
  price: 1000000000000000000n, // 1 ETH
  paymentToken: '0x0000000000000000000000000000000000000000',
  expirationTime: BigInt(Date.now() / 1000 + 86400),
  isActive: true,
  tokenType: 'ERC721' as const,
};

export const mockOffer = {
  id: '1',
  creator: '0x9876543210987654321098765432109876543210',
  collection: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  tokenId: '42',
  price: '0.5',
  quantity: '1',
  expirationTime: String(Date.now() / 1000 + 86400),
  status: 'ACTIVE' as const,
  offerType: 'NFT' as const,
};
```

---

## Best Practices

### ✅ DO

1. **Test behavior, not implementation**
   ```typescript
   // ✅ Good - tests behavior
   it('should prevent listing without approval', async () => {
     await expect(service.listNFT(params)).rejects.toThrow('Not approved');
   });

   // ❌ Bad - tests implementation
   it('should call checkApproval method', async () => {
     await service.listNFT(params);
     expect(service.checkApproval).toHaveBeenCalled();
   });
   ```

2. **Use descriptive test names**
   ```typescript
   // ✅ Good
   it('should reject negative prices when creating listing');

   // ❌ Bad
   it('price validation');
   ```

3. **Arrange-Act-Assert pattern**
   ```typescript
   it('should format 1 ETH correctly', () => {
     // Arrange
     const wei = 1000000000000000000n;

     // Act
     const result = CryptoFormatter.formatPrice(wei);

     // Assert
     expect(result).toBe('1.0000');
   });
   ```

4. **Test edge cases**
   ```typescript
   it.each([
     ['0', 'must be greater than 0'],
     ['-1', 'must be greater than 0'],
     ['abc', 'must be a valid number'],
     ['', 'is required'],
   ])('should reject invalid price: %s', (price, expectedError) => {
     expect(() => ContractValidator.validatePrice(price))
       .toThrow(expectedError);
   });
   ```

5. **Mock external dependencies**
   ```typescript
   vi.mock('ethers', () => ({
     ethers: {
       Contract: vi.fn(),
       formatEther: vi.fn(),
     },
   }));
   ```

### ❌ DON'T

1. **Don't test implementation details**
2. **Don't write flaky tests** (timing-dependent)
3. **Don't test third-party libraries** (ethers.js)
4. **Don't make tests depend on each other**
5. **Don't skip cleanup** (`afterEach`, `afterAll`)

### Coverage Goals

- **Utilities:** 90%+ (pure functions, easy to test)
- **Services:** 80%+ (core business logic)
- **Components:** 70%+ (UI components)
- **Integration:** Key user flows covered
- **E2E:** Critical paths covered

---

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm test:unit

# Run integration tests
npm test:integration

# Run E2E tests
npm test:e2e

# Run with coverage
npm test:coverage

# Run specific test file
npm test ExchangeService

# Watch mode
npm test:watch
```

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

---

**Last Updated:** Phase 6 Refactoring
**Test Framework:** Vitest + Playwright
**Coverage Target:** 80%+ for critical paths
