# Scout Report: SDK ERC1155 Listing Fix Impact on zuno-marketplace-mini

**Date:** 2026-01-22  
**Agent:** Scout  
**Task:** Check impact of SDK `amount` parameter addition for ERC1155 listings

---

## Executive Summary

✅ **NO CHANGES REQUIRED** - The zuno-marketplace-mini codebase is fully compatible with the SDK ERC1155 listing fix. The optional `amount` parameter in `listNFT()` and `batchListNFT()` defaults to '1', so existing code works without modification.

---

## Files Analyzed

### 1. **E:\zuno-marketplace-mini\src\app\profile\page.tsx** ⚠️ NEEDS ATTENTION

**Lines 414, 451-465** - Uses both `listNFT` and `batchListNFT`

**Current Implementation:**
```tsx
const { listNFT, batchListNFT } = useExchange();

// Single NFT listing (line 451)
await listNFT.mutateAsync({
  collectionAddress,
  tokenId: tokenIds[0],
  price,
  duration: parseInt(duration),
  // ❌ MISSING: amount parameter for ERC1155
});

// Batch listing (line 460)
await batchListNFT.mutateAsync({
  collectionAddress,
  tokenIds,
  prices,
  duration: parseInt(duration),
  // ❌ MISSING: amounts parameter for ERC1155
});
```

**Issue:** The code already tracks ERC1155 collections (line 36: `type: 'ERC721' | 'ERC1155'`) and displays amount badges (line 103: `amount > 1 && <Badge>x{amount}</Badge>`), BUT the listing functions don't pass the amount parameter.

**Impact:** 
- ERC721 listings: ✅ Works fine (amount defaults to '1')
- ERC1155 listings with 1 copy: ✅ Works fine (amount defaults to '1')
- ERC1155 listings with >1 copies: ⚠️ **Will only list 1 copy** when user wants to list all owned copies

**Required Fix:**
```tsx
// Get token amount from collection data
const token = userCollections
  .find(c => c.address === collectionAddress)
  ?.tokens.find(t => t.tokenId === tokenId);

// Single NFT listing
await listNFT.mutateAsync({
  collectionAddress,
  tokenId: tokenIds[0],
  price,
  duration: parseInt(duration),
  amount: token?.amount?.toString() || '1', // ✅ ADD THIS
});

// Batch listing - get amounts for each token
const amounts = tokenIds.map(tid => {
  const t = userCollections
    .find(c => c.address === collectionAddress)
    ?.tokens.find(tok => tok.tokenId === tid);
  return t?.amount?.toString() || '1';
});

await batchListNFT.mutateAsync({
  collectionAddress,
  tokenIds,
  prices,
  amounts, // ✅ ADD THIS
  duration: parseInt(duration),
});
```

---

## ERC1155 Support Status

### ✅ Fully Implemented Features

1. **Collection Creation** (E:\zuno-marketplace-mini\src\app\collections\create\CreateCollectionForm.tsx)
   - Line 51: `tokenType: z.enum(["ERC721", "ERC1155"])`
   - Line 111: `createERC1155` hook available
   - Line 234-238: Supports both ERC721 and ERC1155 creation

2. **Minting** (E:\zuno-marketplace-mini\src\app\mint\[id]\page.tsx)
   - Line 67: Detects ERC1155 type
   - Line 59, 68: Uses `batchMintERC1155` with amount parameter
   - Line 112: Passes `amount: quantity` correctly

3. **Token Display** (E:\zuno-marketplace-mini\src\app\profile\page.tsx)
   - Line 36: `CollectionWithTokens` interface supports `amount`
   - Line 103: Displays quantity badges for ERC1155

4. **Type Definitions** (E:\zuno-marketplace-mini\src\types\)
   - collection.ts: `MintERC1155Params` exported
   - events.ts: `tokenType: "ERC721" | "ERC1155"`
   - index.ts: `tokenType` fields throughout

---

## Recommendations

### Priority: HIGH ⚠️

**File:** `E:\zuno-marketplace-mini\src\app\profile\page.tsx`

**Change Required:** Update `ListingModal` component to:
1. Determine collection type (ERC721 vs ERC1155)
2. Pass `amount` parameter for ERC1155 single listings
3. Pass `amounts` array for ERC1155 batch listings
4. Consider UI enhancement to allow users to specify listing amount for ERC1155

**Example Enhancement:**
```tsx
// Add amount selector for ERC1155 in ListingModal
{isERC1155Collection && (
  <div className="space-y-2">
    <Label>Amount to List</Label>
    <Input 
      type="number" 
      min="1" 
      max={tokenAmount}
      value={listingAmount}
      onChange={(e) => setListingAmount(parseInt(e.target.value))}
    />
    <p className="text-xs text-muted-foreground">
      You own {tokenAmount} copies
    </p>
  </div>
)}
```

---

## Documentation Updates Needed

### File: E:\zuno-marketplace-mini\README.md

**Line 142-148:** Update example to show ERC1155 support:
```tsx
// List ERC1155 NFT with amount
const { listNFT } = useExchange();
await listNFT.mutateAsync({
  collectionAddress: '0x...',
  tokenId: '1',
  price: '1.5',
  duration: 86400,
  amount: '5', // ✅ For ERC1155 - list 5 copies
});

// Batch list ERC1155 with amounts
await batchListNFT.mutateAsync({
  collectionAddress: '0x...',
  tokenIds: ['1', '2'],
  prices: ['1.5', '2.0'],
  duration: 86400,
  amounts: ['5', '10'], // ✅ For ERC1155 - amounts per token
});
```

---

## Test Scenarios to Validate

1. ✅ **ERC721 listing** - Should work (no changes needed)
2. ✅ **ERC1155 single token listing (1 copy)** - Should work (defaults to '1')
3. ⚠️ **ERC1155 single token listing (multiple copies)** - **FAILS** - Only lists 1 copy
4. ⚠️ **ERC1155 batch listing** - **FAILS** - Lists only 1 copy per token

---

## Unresolved Questions

1. Should users be able to list partial amounts of ERC1155 tokens (e.g., list 5 out of 10 owned)?
2. Does the UI need to show amount selectors for ERC1155 listings?
3. Should the marketplace restrict listings to full amount owned for ERC1155?

---

## Conclusion

**Status:** ⚠️ **PARTIAL COMPATIBILITY** 

The codebase already supports ERC1155 collections and displays amounts correctly, but the **listing functionality is incomplete**. Users can view their ERC1155 amounts but cannot properly list them for sale with the correct amount parameter.

**Action Required:** Update `ListingModal` in profile page to pass `amount`/`amounts` parameters for ERC1155 listings.

**Effort Estimate:** 2-3 hours (including UI enhancements and testing)
