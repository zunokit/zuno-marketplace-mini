# JSDoc Standards for Zuno Marketplace

This document defines the JSDoc documentation standards for all contract services and utilities.

## 📋 Table of Contents

1. [Basic Template](#basic-template)
2. [Service Methods](#service-methods)
3. [Utility Functions](#utility-functions)
4. [Types & Interfaces](#types--interfaces)
5. [Examples](#examples)
6. [Best Practices](#best-practices)

---

## Basic Template

Every public method should follow this template:

```typescript
/**
 * Brief description of what the method does (one line)
 *
 * Longer description providing context, use cases, and important notes.
 * Can span multiple lines.
 *
 * @param paramName - Description of parameter
 * @param optionalParam - Optional parameter description (optional)
 * @returns Description of return value
 * @throws {ErrorType} Description of when error is thrown
 *
 * @example
 * ```typescript
 * const result = await service.methodName(param1, param2);
 * console.log(result);
 * ```
 */
```

---

## Service Methods

### Read Operations (View Functions)

```typescript
/**
 * Get user's active NFT listings
 *
 * Retrieves all active listings for the specified user address across
 * both ERC721 and ERC1155 exchanges. Results are combined and formatted
 * with consistent structure.
 *
 * @param userAddress - User's wallet address
 * @returns Promise resolving to array of Listing objects
 * @throws {Error} If user address is invalid
 * @throws {Error} If contract call fails
 *
 * @example
 * ```typescript
 * const listings = await exchangeService.getUserListings("0x123...");
 * console.log(`Found ${listings.length} active listings`);
 *
 * listings.forEach(listing => {
 *   console.log(`${listing.tokenType} #${listing.tokenId}: ${listing.price} ETH`);
 * });
 * ```
 */
async getUserListings(userAddress: string): Promise<Listing[]> {
  // Implementation
}
```

### Write Operations (Transactions)

```typescript
/**
 * Create a new NFT listing on the marketplace
 *
 * Lists an NFT for sale at the specified price and duration. The NFT must be
 * approved for the exchange contract before calling this method.
 *
 * **Important:** This is a blockchain transaction that requires gas and user approval.
 *
 * @param params - Listing parameters
 * @param params.contractAddress - NFT contract address (must be valid Ethereum address)
 * @param params.tokenId - Token ID to list (must be numeric string)
 * @param params.price - Sale price in ETH (e.g., "0.1")
 * @param params.duration - Listing duration in seconds (min: 3600, max: 31536000)
 * @param params.tokenType - Token standard ("ERC721" or "ERC1155")
 * @param params.amount - Amount to list (ERC1155 only, optional)
 * @returns Promise resolving to listing ID
 *
 * @throws {Error} If wallet not connected
 * @throws {Error} If NFT not approved for exchange contract
 * @throws {Error} If validation fails
 * @throws {Error} If transaction is rejected by user
 * @throws {Error} If transaction fails on blockchain
 *
 * @example
 * ```typescript
 * // Step 1: Approve NFT for exchange
 * const collection = new ethers.Contract(nftAddress, erc721Abi, signer);
 * await collection.setApprovalForAll(exchangeAddress, true);
 *
 * // Step 2: Create listing
 * const listingId = await exchangeService.listNFT({
 *   contractAddress: "0x1234...",
 *   tokenId: "1",
 *   price: "0.5",
 *   duration: "86400", // 24 hours
 *   tokenType: "ERC721"
 * });
 *
 * console.log(`Listing created with ID: ${listingId}`);
 * ```
 *
 * @see {@link cancelListing} for cancelling listings
 * @see {@link updateListingPrice} for updating price
 */
async listNFT(params: ListingParams): Promise<string> {
  // Implementation
}
```

---

## Utility Functions

### Pure Functions

```typescript
/**
 * Format wei to ETH string with specified decimal places
 *
 * Converts blockchain wei values (smallest ETH unit) to human-readable
 * ETH format with customizable decimal precision.
 *
 * @param wei - Value in wei (bigint)
 * @param decimals - Number of decimal places to show (default: 4)
 * @param showUnit - Whether to append " ETH" suffix (default: false)
 * @returns Formatted ETH value string
 *
 * @example
 * ```typescript
 * CryptoFormatter.formatPrice(1000000000000000000n);
 * // "1.0000"
 *
 * CryptoFormatter.formatPrice(500000000000000000n, 2);
 * // "0.50"
 *
 * CryptoFormatter.formatPrice(1500000000000000000n, 4, true);
 * // "1.5000 ETH"
 * ```
 */
static formatPrice(
  wei: bigint,
  decimals: number = 4,
  showUnit: boolean = false
): string {
  // Implementation
}
```

### Validators

```typescript
/**
 * Validate Ethereum address format
 *
 * Checks if the provided string is a valid Ethereum address using ethers.js
 * validation. Throws descriptive error if validation fails.
 *
 * @param address - Address to validate
 * @param fieldName - Optional field name for error message (default: "Address")
 * @throws {Error} If address is null, undefined, or empty
 * @throws {Error} If address is not a valid Ethereum address format
 *
 * @example
 * ```typescript
 * // Valid address - no error thrown
 * ContractValidator.validateAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
 *
 * // Invalid address - throws error
 * try {
 *   ContractValidator.validateAddress("invalid");
 * } catch (error) {
 *   console.error(error.message);
 *   // "Address is not a valid Ethereum address: invalid"
 * }
 *
 * // Custom field name
 * ContractValidator.validateAddress(addr, "NFT contract");
 * // Error: "NFT contract is not a valid Ethereum address: ..."
 * ```
 */
static validateAddress(address: string, fieldName: string = "Address"): void {
  // Implementation
}
```

---

## Types & Interfaces

### Interfaces

```typescript
/**
 * NFT listing parameters for marketplace
 *
 * Defines all required and optional parameters for creating a new NFT listing.
 * Used by ExchangeService.listNFT() method.
 *
 * @interface
 *
 * @property contractAddress - NFT contract address (ERC721 or ERC1155)
 * @property tokenId - Unique token identifier within the contract
 * @property price - Sale price in ETH as string (e.g., "0.1")
 * @property duration - How long listing stays active (seconds)
 * @property tokenType - Token standard type
 * @property amount - Number of tokens to list (ERC1155 only, optional)
 *
 * @example
 * ```typescript
 * const params: ListingParams = {
 *   contractAddress: "0x1234...",
 *   tokenId: "42",
 *   price: "0.5",
 *   duration: "86400",
 *   tokenType: "ERC721"
 * };
 * ```
 */
export interface ListingParams {
  contractAddress: string;
  tokenId: string;
  price: string;
  duration: string;
  amount?: string;
  tokenType: "ERC721" | "ERC1155";
}
```

### Enums

```typescript
/**
 * Transaction types tracked by ListingHistoryTracker
 *
 * Represents all possible marketplace transaction types that are
 * recorded on-chain for analytics and history tracking.
 *
 * @enum {number}
 *
 * @example
 * ```typescript
 * if (record.txType === TransactionType.SALE_COMPLETED) {
 *   console.log(`Sale: ${record.price} ETH`);
 * }
 * ```
 */
export enum TransactionType {
  /** Listing created on marketplace */
  LISTING_CREATED = 0,
  /** Listing cancelled by seller */
  LISTING_CANCELLED = 1,
  /** NFT sold to buyer */
  SALE_COMPLETED = 2,
  /** Offer made on NFT or collection */
  OFFER_MADE = 3,
  /** Offer accepted by seller */
  OFFER_ACCEPTED = 4,
  /** Auction started */
  AUCTION_STARTED = 5,
  /** Bid placed on auction */
  BID_PLACED = 6,
  /** Auction ended */
  AUCTION_ENDED = 7,
}
```

---

## Examples

### Complex Example with Multiple Scenarios

```typescript
/**
 * Create or update bundle of NFTs
 *
 * Creates a new bundle if `bundleId` is not provided, or updates an existing
 * bundle if `bundleId` is provided. Bundles allow selling multiple NFTs together
 * at a discounted price.
 *
 * @param params - Bundle parameters
 * @param bundleId - Optional existing bundle ID to update
 * @returns Promise resolving to bundle ID
 *
 * @throws {Error} If less than 2 items provided
 * @throws {Error} If more than 10 items provided
 * @throws {Error} If discount percentage invalid (0-100)
 * @throws {Error} If any NFT not approved
 * @throws {Error} If bundle not found (when updating)
 *
 * @example
 * **Creating a new bundle:**
 * ```typescript
 * const bundleId = await bundleService.createBundle({
 *   items: [
 *     { collection: "0xAAA...", tokenId: "1", amount: "1", tokenType: "ERC721" },
 *     { collection: "0xBBB...", tokenId: "5", amount: "1", tokenType: "ERC721" }
 *   ],
 *   totalPrice: "1.0",
 *   discountPercentage: 10,
 *   duration: 86400,
 *   description: "Rare NFT Bundle",
 *   imageUrl: "ipfs://..."
 * });
 * ```
 *
 * @example
 * **Updating existing bundle:**
 * ```typescript
 * await bundleService.updateBundle({
 *   totalPrice: "0.8", // New price
 *   discountPercentage: 20, // Increased discount
 *   // ... other params
 * }, bundleId);
 * ```
 *
 * @example
 * **Error handling:**
 * ```typescript
 * try {
 *   const bundleId = await bundleService.createBundle(params);
 * } catch (error) {
 *   if (error.message.includes("not approved")) {
 *     console.error("Please approve all NFTs first");
 *   } else if (error.message.includes("ACTION_REJECTED")) {
 *     console.log("User cancelled transaction");
 *   } else {
 *     console.error("Bundle creation failed:", error);
 *   }
 * }
 * ```
 */
async createOrUpdateBundle(
  params: BundleParams,
  bundleId?: string
): Promise<string> {
  // Implementation
}
```

---

## Best Practices

### ✅ DO

1. **Always include examples** - Show real-world usage
2. **Document edge cases** - Mention limits, special conditions
3. **List all throws** - Document every error condition
4. **Use type annotations** - `@param {Type}` for inline docs
5. **Link related methods** - Use `@see` for cross-references
6. **Be specific** - "User wallet address" not "address"
7. **Include units** - "Duration in seconds" not "duration"
8. **Show prerequisites** - "NFT must be approved first"
9. **Add warnings** - "⚠️ This requires gas"
10. **Update when code changes** - Keep docs in sync

### ❌ DON'T

1. **Don't be vague** - ❌ "Does something" ✅ "Creates NFT listing"
2. **Don't skip examples** - Every public method needs example
3. **Don't ignore errors** - Document all `@throws`
4. **Don't use jargon** - Explain blockchain terms
5. **Don't duplicate comments** - JSDoc is the source of truth
6. **Don't write novels** - Be concise but complete
7. **Don't use "TODO"** - Fix or file issue instead
8. **Don't leave stale docs** - Remove outdated examples

### Documentation Checklist

Before committing, verify each public method has:

- [ ] Clear one-line summary
- [ ] Detailed description (if complex)
- [ ] All `@param` documented with types
- [ ] `@returns` documented with type
- [ ] All `@throws` conditions listed
- [ ] At least one `@example` with real code
- [ ] Links to related methods (`@see`)
- [ ] Important notes/warnings highlighted
- [ ] Gas cost warnings for transactions
- [ ] Prerequisites mentioned
- [ ] Edge cases documented

---

## Documentation Priority

### High Priority (Document First)
- Public service methods
- API endpoints
- Complex business logic
- Error conditions
- Transaction methods

### Medium Priority
- Utility functions
- Helper methods
- Type definitions
- Constants

### Low Priority
- Private methods (brief comment OK)
- Getters/setters (if simple)
- Trivial functions

---

## Tools & Automation

### Generate Documentation

```bash
# Generate HTML docs from JSDoc
npx typedoc --out docs/api src

# Check JSDoc coverage
npx documentation lint src/**/*.ts
```

### ESLint Rules

```json
{
  "rules": {
    "require-jsdoc": ["error", {
      "require": {
        "FunctionDeclaration": true,
        "MethodDefinition": true,
        "ClassDeclaration": true
      }
    }],
    "valid-jsdoc": ["error", {
      "requireReturn": true,
      "requireReturnType": true,
      "requireParamDescription": true,
      "requireReturnDescription": true
    }]
  }
}
```

---

## Template Quick Reference

**Minimal (Simple getter):**
```typescript
/**
 * Get contract address
 * @returns Contract address
 */
```

**Standard (Most methods):**
```typescript
/**
 * Description
 * @param name - Description
 * @returns Description
 * @throws {Error} When it fails
 * @example
 * ```typescript
 * // code
 * ```
 */
```

**Complete (Complex methods):**
```typescript
/**
 * Brief description
 *
 * Detailed explanation with context.
 *
 * @param name - Description
 * @param optional - Optional param (optional)
 * @returns Description
 * @throws {Error} Condition 1
 * @throws {Error} Condition 2
 * @example
 * ```typescript
 * // Example 1: Basic usage
 * ```
 * @example
 * ```typescript
 * // Example 2: Advanced usage
 * ```
 * @see {@link relatedMethod}
 */
```

---

**Last Updated:** Phase 6 Refactoring
**Applies To:** All contract services, utilities, and public APIs
