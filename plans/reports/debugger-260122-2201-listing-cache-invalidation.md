# Debug Report: Listing Cache Invalidation Issue

**Date:** 2026-01-22 22:01
**Issue:** Listing cache invalidation not working - NFTs show as "not listed" after successful listing transaction

## Root Cause

**Storage Update Happens Immediately**

Contract's `_createListing()` (BaseNFTExchange.sol:181) updates `s_listingsBySeller[msg.sender].push(m_listingId)` immediately in the same transaction. Data is available as soon as transaction is mined.

**THE ACTUAL ROOT CAUSE: SDK's `listNFT` Mutation NOT Called**

After tracing the code flow, I discovered the real issue:

**File:** `E:\zuno-marketplace-mini\src\app\profile\page.tsx` (line 482, 541)

```typescript
// Line 482: useExchange hook imported from SDK
const { listNFT, batchListNFT } = useExchange();

// Line 541: Inside ListingModal, called directly
await listNFT.mutateAsync({
  collectionAddress,
  tokenId: token.tokenId,
  price,
  duration: parseInt(duration),
  ...(token.isERC1155 && { amount: selectedAmount.toString() }),
});
```

**THE ISSUE:** The SDK's `listNFT` mutation's `onSuccess` callback **IS being called** and **DOES call** `invalidateQueries({ queryKey: ['listings'] })`.

However, the profile page **ALSO** calls `refetchListings()` in its own `onSuccess` callback (line 900):

```typescript
onSuccess={async () => {
  await refetchListings();  // ← This is the problem!
  setSelectedTokens(new Set());
  setListingModalOpen(false);
}}
```

**Why It Fails:**
1. SDK's `listNFT.mutateAsync()` completes → invalidates queries
2. Profile's `onSuccess` fires → calls `refetchListings()` **immediately**
3. **Race condition:** React Query refetch might complete before blockchain state propagates
4. OR: The `invalidateQueries` + `refetch` happen simultaneously, causing double-fetch race

**The Fix:** Remove the manual `refetchListings()` call. The SDK's `invalidateQueries` is sufficient.

### Evidence

**Contract Storage Update (Immediate):**
```solidity
// BaseNFTExchange.sol:181
s_listingsBySeller[msg.sender].push(m_listingId);  // ← Updated same transaction
```

**SDK Invalidation (Correct):**
```typescript
// useExchange.ts:34-39
const listNFT = useMutation({
  mutationFn: (params: ListNFTParams) => sdk.exchange.listNFT(params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['listings'] });  // ✅ This works!
  },
});
```

**Profile Page (Redundant refetch causing race):**
```typescript
// profile/page.tsx:900
onSuccess={async () => {
  await refetchListings();  // ❌ Redundant! Causes race condition
  setSelectedTokens(new Set());
  setListingModalOpen(false);
}}
```

## Why Current Fix Doesn't Work

**File:** `E:\zuno-marketplace-mini\src\app\profile\page.tsx` (line 900)

```typescript
onSuccess={async () => {
  await refetchListings();  // Manual refetch - workaround
  setSelectedTokens(new Set());
  setListingModalOpen(false);
}}
```

The `refetchListings()` manually calls `refetch()`, which fetches from the blockchain. If the contract hasn't fully processed/stored the new listing yet, the refetch returns stale data, causing the visual glitch.

## Query Key Hierarchy

React Query uses **hierarchical matching** for invalidation:

- `invalidateQueries({ queryKey: ['listings'] })` invalidates:
  - ✅ `['listings']`
  - ✅ `['listings', collectionAddress]`
  - ❌ `['listings', 'seller', seller]` ← Only partial match, NOT invalidated

The `['listings', 'seller', seller]` key has **'seller'** as second element, not `collectionAddress`, so it's in a different branch.

## Proposed Fix

### Option 1: Fix SDK (Recommended)

Update `E:\zuno-marketplace-sdk\src\react\hooks\useExchange.ts`:

```typescript
const listNFT = useMutation({
  mutationFn: (params: ListNFTParams) => sdk.exchange.listNFT(params),
  onSuccess: () => {
    // Invalidate ALL listings queries
    queryClient.invalidateQueries({ queryKey: ['listings'] });
  },
});

// Add this to ensure seller listings are also invalidated
const batchListNFT = useMutation({
  mutationFn: (params: BatchListNFTParams) => sdk.exchange.batchListNFT(params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['listings'] });
  },
});
```

Wait, this won't work either! The issue is that `['listings']` with `type: 'all'` or fuzzy matching should work, but React Query's default is **exact: false** which should match all queries starting with `['listings']`.

Let me re-check the React Query docs...

### Option 2: Use Fuzzy Matching (Correct Fix)

Actually, `invalidateQueries({ queryKey: ['listings'] })` **SHOULD** invalidate all queries starting with `['listings']` by default (exact: false). The real issue might be:

1. **Multiple Query Clients** - Check if there are separate QueryClient instances
2. **Race Condition** - Invalidation happens before blockchain confirms
3. **Query Client Context** - SDK and app might use different QueryClient instances

### Option 3: Explicitly Match Seller Queries

If fuzzy matching isn't working, explicitly invalidate seller queries:

```typescript
const listNFT = useMutation({
  mutationFn: (params: ListNFTParams) => sdk.exchange.listNFT(params),
  onSuccess: async (_data, variables) => {
    // Invalidate general listings
    queryClient.invalidateQueries({ queryKey: ['listings'] });

    // Also invalidate seller-specific listings
    // Get seller address from wallet or SDK
    const seller = await sdk.getSignerAddress();
    if (seller) {
      queryClient.invalidateQueries({
        queryKey: ['listings', 'seller', seller]
      });
    }
  },
});
```

But this requires access to wallet address in SDK, which creates coupling.

### Option 4: Use Query Key Prefix with Fuzzy Match

The actual fix - ensure invalidation uses fuzzy matching properly:

```typescript
// In SDK mutations
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ['listings'],
    type: 'all'  // This should match ['listings', ...]
  });
}
```

If this still doesn't work, the issue is likely **multiple QueryClient instances**.

## Investigation Needed

1. **Check for multiple QueryClient instances** in the app
2. **Verify QueryClientProvider setup** - is SDK using same QueryClient as app?
3. **Add console.log** in mutation onSuccess to verify invalidation fires
4. **Check React Query DevTools** to see actual query keys and cache state

## Verified Architecture

**QueryClient Setup:**
- `ZunoProvider` (line 31-48) creates single QueryClient instance
- QueryClient passed to `ZunoContextProvider` (line 73)
- All hooks use `useQueryClient()` to access same instance
- ✅ **No multiple QueryClient instances**

**React Query Default Behavior:**
- `invalidateQueries({ queryKey: ['listings'] })` uses `exact: false` by default
- This **should** invalidate all queries starting with `['listings']`
- Includes: `['listings']`, `['listings', collectionAddress]`, `['listings', 'seller', seller]`

## Root Cause Analysis

After verification, the SDK setup is correct. The issue is likely:

### Hypothesis 1: Timing/Race Condition
- Transaction confirms on blockchain
- `onSuccess` fires immediately after transaction hash
- Backend API hasn't indexed the new listing yet
- `refetchListings()` fetches from API but gets stale data
- **Result:** NFT shows as "not listed" because backend hasn't caught up

### Hypothesis 2: Backend Cache
- Backend API might be caching responses
- Even after blockchain confirms, API returns cached data
- Frontend refetch gets stale API response

## Verification Steps

Add logging to confirm:

```typescript
// In useExchange.ts SDK
const listNFT = useMutation({
  mutationFn: (params: ListNFTParams) => sdk.exchange.listNFT(params),
  onSuccess: () => {
    console.log('[DEBUG] listNFT onSuccess - invalidating queries');
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    console.log('[DEBUG] Invalidation complete');
  },
});

// In profile/page.tsx
onSuccess={async () => {
  console.log('[DEBUG] Modal onSuccess - calling refetchListings');
  await refetchListings();
  console.log('[DEBUG] Refetch complete, data:', userListings);
  setSelectedTokens(new Set());
  setListingModalOpen(false);
}}
```

## Unresolved Questions

1. **Is there a delay between blockchain confirmation and backend indexing?**
2. **Does backend API have response caching enabled?**
3. **Is the invalidateQueries actually firing?** (Need logging to confirm)
4. **What does React Query DevTools show for query cache state?**

## Next Steps

1. Add logging to verify invalidation is called
2. Check React Query DevTools for query key structure
3. Verify QueryClient is shared between SDK and app
4. Test if `invalidateQueries({ queryKey: ['listings'], exact: false })` works explicitly
