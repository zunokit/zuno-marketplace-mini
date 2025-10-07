# Mint Stage Management

## Problem

The minting error `0xf501eed5` (Collection__MintingNotStarted) was occurring due to two issues:
1. The mint stage enum value (BigInt) wasn't being properly compared with regular numbers
2. When in allowlist stage, addresses need to be added to the allowlist first

## Solution

We've implemented a complete mint stage management system that includes:

### 1. Fixed Mint Validation
- Updated `CollectionService.ts` to properly validate mint stages
- Users can only mint when:
  - The mint stage is "allowlist" (and they are allowlisted)
  - The mint stage is "public"
  - There is supply remaining
  - They haven't exceeded their wallet limit

### 2. Improved Error Handling
- Added proper decoding for custom contract errors
- Clear user-friendly error messages for common mint errors:
  - `0xf501eed5`: "Minting has not started yet"
  - Mint limit exceeded
  - Insufficient payment
  - Not in allowlist

### 3. Mint Stage Management Tools

#### For Developers/Admins

**Script to Start Minting:**
```bash
# Start allowlist mint (progresses to next stage)
npx tsx scripts/start-mint.ts 0xYourCollectionAddress

# Skip directly to public mint (stage 2)
npx tsx scripts/start-mint.ts 0xYourCollectionAddress 2
```

**Script to Manage Allowlist:**
```bash
# Add addresses to allowlist (required for allowlist stage)
npx tsx scripts/manage-allowlist.ts 0xCollectionAddress add 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

# Add multiple addresses
npx tsx scripts/manage-allowlist.ts 0xCollectionAddress add 0xAddr1 0xAddr2 0xAddr3

# Remove from allowlist
npx tsx scripts/manage-allowlist.ts 0xCollectionAddress remove 0xAddress

# Check if address is in allowlist
npx tsx scripts/manage-allowlist.ts 0xCollectionAddress check 0xAddress
```

#### For Collection Owners

**UI Component:**
The `ManageMintStage` component can be added to collection pages to allow owners to manage their mint stages directly from the UI.

**Programmatic Access:**
```typescript
import { useCollection } from '@/hooks/useCollection';

// In your component
const { updateMintStage } = useCollection();

// Update mint stage
await updateMintStage(collectionAddress, TokenType.ERC721);
```

## Mint Stages

Collections have three mint stages:

1. **Not Started (0)**: No minting allowed
2. **Allowlist (1)**: Only allowlisted addresses can mint
3. **Public (2)**: Anyone can mint

The `updateMintStage()` function progresses through these stages sequentially:
- Not Started → Allowlist → Public

## Files Modified

- `src/lib/services/contracts/CollectionService.ts`: Fixed mint validation and error handling
- `src/hooks/useCollection.ts`: Added updateMintStage function
- `src/components/features/collection/ManageMintStage.tsx`: Created UI component for owners
- `scripts/start-mint.ts`: Created script for starting mints

## Usage Example

```typescript
// Check if user can mint
const mintInfo = await getMintInfo(collectionAddress);
if (mintInfo.canMint) {
  // Show mint button
} else {
  // Show appropriate message based on mintInfo.currentStage
}

// For collection owners - update mint stage
if (isOwner) {
  await updateMintStage(collectionAddress);
}
```

## Complete Setup Guide

To enable minting for your collection, follow these steps:

### For Allowlist Stage:
1. Deploy a new collection
2. Update mint stage to allowlist: `npx tsx scripts/start-mint.ts 0xCollectionAddress`
3. Add addresses to allowlist: `npx tsx scripts/manage-allowlist.ts 0xCollectionAddress add 0xYourWalletAddress`
4. Now allowlisted addresses can mint

### For Public Stage:
1. Deploy a new collection
2. Update mint stage to public: `npx tsx scripts/start-mint.ts 0xCollectionAddress 2`
3. Now anyone can mint

### Testing Steps:
1. Check current mint stage in console logs (look for "🔍 Mint stage enum value")
2. If stage is 1 (allowlist), ensure your address is allowlisted
3. If stage is 2 (public), anyone can mint
4. The UI will now properly show if you can mint based on stage and allowlist status
