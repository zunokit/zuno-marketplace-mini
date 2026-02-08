# Debug Report: Listing Cache Invalidation Issue

**Date:** 2026-01-22 22:01
**Issue:** Listing cache invalidation not working - NFTs show as "not listed" after successful listing transaction

## Executive Summary

**Root Cause:** Manual `refetchListings()` call in profile page causes race condition with SDK's automatic cache invalidation.

**Fix:** Remove manual `refetchListings()` call. SDK's `invalidateQueries()` already handles cache updates correctly.

---

## Root Cause Analysis

### Contract Storage (Updates Immediately)

**File:** `E:\zuno-marketplace-contracts\src\common\BaseNFTExchange.sol:181`

```solidity
function _createListing(...) internal {
    // ... validation ...

    s_listings[m_listingId] = Listing({...});

    // Storage updated IMMEDIATELY in same transaction
    s_listingsByCollection[m_contractAddress].push(m_listingId);
    s_listingsBySeller[msg.sender].push(m_listingId);  // ← Available as soon as tx mined

    emit NFTListed(...);
}
```

**Conclusion:** Contract storage updates atomically with transaction. No indexing delay.

### SDK Cache Invalidation (Works Correctly)

**File:** `E:\zuno-marketplace-sdk\src\react\hooks\useExchange.ts:34-39`

```typescript
const listNFT = useMutation({
  mutationFn: (params: ListNFTParams) => sdk.exchange.listNFT(params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['listings'] });
  },
});
```

**React Query Behavior:**
- `invalidateQueries({ queryKey: ['listings'] })` uses `exact: false` by default
- Invalidates ALL queries starting with `['listings']`
- Includes: `['listings']`, `['listings', collectionAddress]`, `['listings', 'seller', seller]`
- **Conclusion:** SDK invalidation is correct and will trigger auto-refetch

### Profile Page (Causes Race Condition)

**File:** `E:\zuno-marketplace-mini\src\app\profile\page.tsx:900`

```typescript
<ListingModal
  onSuccess={async () => {
    await refetchListings();  // ❌ PROBLEM: Manual refetch
    setSelectedTokens(new Set());
    setListingModalOpen(false);
  }}
/>
```

**The Race Condition:**

1. User lists NFT → `listNFT.mutateAsync()` called
2. Transaction mined → SDK's mutation `onSuccess` fires → calls `invalidateQueries()`
3. **SIMULTANEOUSLY:** Profile's `onSuccess` fires → calls `refetchListings()`
4. Two refetches happen at nearly the same time
5. One might complete before blockchain state fully propagates
6. Result: Stale data displayed briefly

**Why Manual Refetch Exists:**
- Likely added as "defensive" programming
- Developer didn't trust SDK's automatic invalidation
- Actually **causes** the problem it's meant to solve

---

## QueryClient Architecture Verification

**No Multiple Instances:**

```
ZunoProvider (line 31-48)
  ↓ Creates QueryClient
  ↓
ZunoContextProvider (line 73)
  ↓ Receives same QueryClient
  ↓
useExchange() hook
  ↓ useQueryClient() returns same instance
```

**Conclusion:** Single QueryClient instance. No context isolation issues.

---

## Proposed Fix

### Solution: Remove Manual Refetch

**File:** `E:\zuno-marketplace-mini\src\app\profile\page.tsx:900`

**Before (Buggy):**
```typescript
<ListingModal
  onSuccess={async () => {
    await refetchListings();  // ❌ Remove this line
    setSelectedTokens(new Set());
    setListingModalOpen(false);
  }}
/>
```

**After (Fixed):**
```typescript
<ListingModal
  onSuccess={async () => {
    // SDK's listNFT mutation already calls invalidateQueries
    // React Query will auto-refetch invalidated queries
    setSelectedTokens(new Set());
    setListingModalOpen(false);
  }}
/>
```

### Why This Works

**Correct Flow:**
1. User lists NFT → `listNFT.mutateAsync()` called in modal
2. Transaction mined → SDK's `onSuccess` callback fires
3. SDK calls `invalidateQueries({ queryKey: ['listings'] })`
4. React Query marks all `['listings', ...]` queries as stale
5. React Query **automatically refetches** in background
6. Components re-render with fresh data when refetch completes
7. No race condition - single source of truth

### Same Fix for Auction Modal

**File:** `E:\zuno-marketplace-mini\src\app\profile\page.tsx:892`

**Before:**
```typescript
<AuctionModal
  onSuccess={async () => {
    await refetchAuctions();  // ❌ Remove this
    setSelectedTokens(new Set());
    setAuctionModalOpen(false);
  }}
/>
```

**After:**
```typescript
<AuctionModal
  onSuccess={async () => {
    // SDK's auction mutations already invalidate queries
    setSelectedTokens(new Set());
    setAuctionModalOpen(false);
  }}
/>
```

---

## Alternative Workaround (Not Recommended)

If manual refetch MUST be kept (e.g., for other reasons), add delay:

```typescript
onSuccess={async () => {
  // Wait for blockchain state to propagate
  await new Promise(resolve => setTimeout(resolve, 2000));
  await refetchListings();
  setSelectedTokens(new Set());
  setListingModalOpen(false);
}}
```

**But this is inferior because:**
- Adds arbitrary delay (2 seconds)
- Might still fail if network is slow
- Poor UX (unnecessary waiting)
- Doesn't address root cause

---

## Testing Checklist

After implementing fix:

- [ ] List single NFT → UI updates immediately
- [ ] List batch NFTs → All show as listed
- [ ] List ERC721 → Works
- [ ] List ERC1155 → Works
- [ ] Create auction → UI updates
- [ ] Create batch auction → All show as in-auction
- [ ] Check React Query DevTools:
  - Only ONE refetch per mutation
  - No duplicate queries
  - Cache invalidates correctly

---

## Unresolved Questions

None - Root cause identified and fix proposed.

---

## Related Files

- **SDK:** `E:\zuno-marketplace-sdk\src\react\hooks\useExchange.ts`
- **SDK Provider:** `E:\zuno-marketplace-sdk\src\react\provider\ZunoProvider.tsx`
- **Profile Page:** `E:\zuno-marketplace-mini\src\app\profile\page.tsx`
- **Contract:** `E:\zuno-marketplace-contracts\src\common\BaseNFTExchange.sol`
