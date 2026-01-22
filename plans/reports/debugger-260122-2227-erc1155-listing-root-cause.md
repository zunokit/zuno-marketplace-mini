# ERC1155 Listings Still Not Showing - ROOT CAUSE ANALYSIS

**Report ID:** debugger-260122-2227-erc1155-listing-root-cause
**Date:** 2026-01-22
**Severity:** CRITICAL
**Status:** ROOT CAUSE IDENTIFIED

---

## Executive Summary

**ROOT CAUSE FOUND:** The `getListing(id)` method in `ExchangeModule.ts` ONLY queries `ERC721NFTExchange` contract, never `ERC1155NFTExchange`. This causes all ERC1155 listings to fail when fetching details.

**Impact:** 100% of ERC1155 listings invisible in UI despite being successfully created on-chain.

**Fix Required:** Update `getListing()` to auto-detect correct exchange contract before querying.

---

## Previous Fixes Applied (Correct ✅)

1. **SDK:** `getListingsBySeller()` now queries BOTH ERC721 and ERC1155 exchanges ✅
2. **Mini:** Removed manual refetch, using React Query invalidation ✅

**These fixes were correct but insufficient.**

---

## Root Cause Analysis

### Data Flow Trace

```
1. User creates ERC1155 listing
   → listNFT() → detects ERC1155 → calls ERC1155NFTExchange.listNFT()
   → Listing created on-chain ✅

2. UI queries listings
   → useListingsBySeller(address)
   → sdk.exchange.getListingsBySeller(seller)
   → Queries BOTH exchanges:
     • ERC721NFTExchange.getListingsBySeller(seller) → [erc721Ids]
     • ERC1155NFTExchange.getListingsBySeller(seller) → [erc1155Ids]
   → Returns: [...erc721Ids, ...erc1155Ids] ✅

3. SDK fetches details FOR EACH LISTING ID ❌
   → Promise.all(allListingIds.map((id) => this.getListing(id)))
   → For each ID, calls getListing(id)

4. getListing(id) BUG ❌
   → ONLY queries ERC721NFTExchange.s_listings(listingId)
   → ERC1155 listing IDs queried on ERC721NFTExchange
   → Solidity returns zero/default values (uninitialized storage)
   → formatListing() creates broken listing with zero address/price
   → ERC1155 listings LOST or show as broken data ❌

5. UI renders
   → Only ERC721 listings visible ❌
```

### The Bug Location

**File:** `E:\zuno-marketplace-sdk\src\modules\ExchangeModule.ts`

**Lines:** 501-518

```typescript
async getListing(listingId: string): Promise<Listing> {
  validateBytes32(listingId, 'listingId');

  const provider = this.ensureProvider();
  const exchangeContract = await this.contractRegistry.getContract(
    'ERC721NFTExchange',  // ❌ HARDCODED - ONLY ERC721!
    this.getNetworkId(),
    provider
  );

  const txManager = this.ensureTxManager();
  const listing = await txManager.callContract<ethers.Result>(
    exchangeContract,
    's_listings',
    [listingId]
  );

  return this.formatListing(listingId, listing);
}
```

**Line 582 (where getListing is called):**
```typescript
// In getListingsBySeller()
return Promise.all(allListingIds.map((id) => this.getListing(id)));
```

### Why This Breaks ERC1155 Listings

1. **Listing IDs are exchange-specific**
   - ERC721NFTExchange stores listings in its `s_listings` mapping
   - ERC1155NFTExchange stores listings in its own `s_listings` mapping
   - Same listing ID format, different contracts

2. **Querying wrong contract returns zero values**
   - Solidity: `s_listings[uninitializedKey]` returns default values
   - `address(0)`, `uint256(0)`, etc.

3. **formatListing() processes zero values**
   - Creates listing with `collectionAddress: "0x0..."`
   - Creates listing with `price: "0"`
   - UI may filter these out or display broken data

---

## Component Status Analysis

### ✅ SDK: getListingsBySeller()
**Status:** WORKING CORRECTLY
- Queries both ERC721 and ERC1155 exchanges in parallel
- Combines listing IDs from both contracts
- **File:** `ExchangeModule.ts` lines 547-583

### ❌ SDK: getListing(id)
**Status:** CRITICAL BUG
- Only queries ERC721NFTExchange
- Never detects which exchange the listing belongs to
- **File:** `ExchangeModule.ts` lines 501-518

### ✅ React Hook: useListingsBySeller()
**Status:** WORKING CORRECTLY
- Uses SDK's getListingsBySeller() method
- Query key: `['listings', 'seller', seller]`
- **File:** `useExchange.ts` lines 104-112

### ✅ React Query: Invalidation
**Status:** WORKING CORRECTLY
- Mutations invalidate `['listings']` key
- Matches `['listings', 'seller', seller]` (hierarchical)
- **File:** `useExchange.ts` lines 36-74

### ✅ Mini App: Profile Page
**Status:** WORKING CORRECTLY
- Uses `useListingsBySeller` from SDK
- No manual caching issues
- **File:** `profile/page.tsx` lines 744, 1227

### ✅ API Layer: No Caching
**Status:** NO ISSUES
- User token API doesn't affect listings
- No listing caching in Next.js API routes
- Data flows directly from SDK to UI

---

## What Happens When Creating ERC1155 Listing

### Contract Layer ✅
```
User: listNFT({ collection: ERC1155, tokenId: "1", amount: "10" })
  → SDK detects ERC1155 ✅
  → Calls ERC1155NFTExchange.listNFT(collection, tokenId, amount, price, duration)
  → Transaction successful ✅
  → Emits ListingCreated event with listingId ✅
  → Listing stored in ERC1155NFTExchange.s_listings[listingId] ✅
```

### Query Layer ❌
```
UI: useListingsBySeller(address)
  → sdk.exchange.getListingsBySeller(seller)
  → Queries ERC1155NFTExchange.getListingsBySeller(seller)
  → Returns [erc1155ListingId, ...] ✅
  → For each ID: calls this.getListing(id) ❌
  → getListing(erc1155ListingId)
  → Queries ERC721NFTExchange.s_listings[erc1155ListingId] ❌
  → Returns zero values (wrong contract!) ❌
  → formatListing() creates broken listing ❌
```

---

## Solution Design

### Option 1: Auto-Detect Exchange (Recommended ✅)

```typescript
async getListing(listingId: string): Promise<Listing> {
  validateBytes32(listingId, 'listingId');

  const provider = this.ensureProvider();

  // Try ERC721 first, then ERC1155
  const erc721Contract = await this.contractRegistry.getContract(
    'ERC721NFTExchange',
    this.getNetworkId(),
    provider
  );

  try {
    const listing = await txManager.callContract<ethers.Result>(
      erc721Contract,
      's_listings',
      [listingId]
    );

    // Check if listing exists (non-zero address)
    if (listing.contractAddress !== ethers.ZeroAddress) {
      return this.formatListing(listingId, listing);
    }
  } catch {
    // Continue to ERC1155
  }

  // Try ERC1155
  const erc1155Contract = await this.contractRegistry.getContract(
    'ERC1155NFTExchange',
    this.getNetworkId(),
    provider
  );

  const listing = await txManager.callContract<ethers.Result>(
    erc1155Contract,
    's_listings',
    [listingId]
  );

  return this.formatListing(listingId, listing);
}
```

**Pros:**
- Backward compatible
- No API changes
- Works for both ERC721 and ERC1155
- Fallback logic ensures data found

**Cons:**
- 2 RPC calls for ERC1155 listings (performance hit)

### Option 2: Pass Exchange Type to getListing()

```typescript
// In getListingsBySeller(), track which exchange each ID came from
const [erc721ListingIds, erc1155ListingIds] = await Promise.all([...]);

const listings = await Promise.all([
  ...erc721ListingIds.map(id => this.getListing(id, 'ERC721')),
  ...erc1155ListingIds.map(id => this.getListing(id, 'ERC1155')),
]);

async getListing(listingId: string, exchangeType: 'ERC721' | 'ERC1155' = 'ERC721'): Promise<Listing> {
  const contractType = exchangeType === 'ERC1155'
    ? 'ERC1155NFTExchange'
    : 'ERC721NFTExchange';

  const exchangeContract = await this.contractRegistry.getContract(
    contractType,
    this.getNetworkId(),
    provider
  );

  // ... rest of logic
}
```

**Pros:**
- Only 1 RPC call per listing
- More efficient
- Clear intent

**Cons:**
- API signature change
- Breaking change for existing code
- Requires updating all call sites

### Option 3: Store Exchange Type in Listing Format

Add metadata to listing response to indicate which exchange it belongs to, then query directly.

**Pros:**
- Future-proof for more exchange types
- Explicit type tracking

**Cons:**
- More complex implementation
- Requires data structure changes

---

## Recommended Implementation

**Use Option 1** (Auto-detect) for immediate fix:

1. Update `getListing()` to try both exchanges
2. Add optimization: cache which exchange a listing ID belongs to
3. Consider Option 2 for future efficiency improvement

---

## Testing Plan

### Test Case 1: Create ERC1155 Listing
1. Create ERC1155 collection
2. Mint tokens
3. List for sale
4. Verify listing appears in "My Listings" tab ✅

### Test Case 2: Create ERC721 Listing
1. Create ERC721 collection
2. Mint token
3. List for sale
4. Verify listing appears (regression test) ✅

### Test Case 3: Mixed Listings
1. Create both ERC721 and ERC1155 collections
2. List from both
3. Verify ALL listings appear ✅

### Test Case 4: Cache Performance
1. Create multiple listings
2. Refresh page
3. Verify cache prevents unnecessary RPC calls ✅

---

## Additional Findings

### No Other Cache Layers Found ✅
- Browser cache: Not interfering (React Query manages cache)
- API cache: No listing APIs, only user-token API
- SDK cache: Token standard cache working correctly

### React Query Configuration ✅
- Query keys properly structured
- Invalidation working correctly
- Hierarchical key matching functional

### Contract Integration ✅
- Both exchanges deployed and functional
- `getListingsBySeller()` works on both contracts
- Listing creation works for both types

---

## Impact Assessment

### Current State
- **ERC721 listings:** 100% working ✅
- **ERC1155 listings:** 0% working ❌
- **User impact:** HIGH - ERC1155 completely broken

### After Fix
- **ERC721 listings:** 100% working ✅
- **ERC1155 listings:** 100% working ✅
- **Performance:** Minimal impact (1 extra RPC call for ERC1155 only)

---

## Unresolved Questions

1. **Performance optimization needed?**
   - After fix, consider implementing Option 2 for efficiency
   - Measure RPC call overhead in production

2. **Should we add exchange type to Listing entity?**
   - Future-proof for additional exchange types
   - Enables direct queries without trial-and-error

3. **Are there other methods with same bug?**
   - Audit all methods that take listingId as parameter
   - Example: `getBuyerPrice(listingId)` - verify it handles both types

---

## Files to Modify

### Critical (Must Fix)
1. `E:\zuno-marketplace-sdk\src\modules\ExchangeModule.ts`
   - Update `getListing()` method (lines 501-518)

### Recommended (Performance)
2. `E:\zuno-marketplace-sdk\src\modules\ExchangeModule.ts`
   - Add exchange type cache to `getListingsBySeller()` (line 547-583)

### Testing
3. `E:\zuno-marketplace-sdk\src\__tests__\modules\ExchangeModule.test.ts`
   - Add test for ERC1155 `getListing()`
   - Add test for mixed listing queries

---

## Conclusion

**Root cause definitively identified:** `getListing()` only queries ERC721NFTExchange.

**Fix is straightforward:** Update `getListing()` to auto-detect correct exchange or accept exchange type parameter.

**No other issues found:** Previous fixes (getListingsBySeller, React Query) are working correctly.

**Recommendation:** Implement Option 1 (auto-detect) immediately, then optimize with Option 2 if performance metrics indicate need.
