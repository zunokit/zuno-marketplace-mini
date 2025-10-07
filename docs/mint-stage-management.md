# Mint Stage Management

## Problem

The minting error `0xf501eed5` (Collection__MintingNotStarted) was occurring because the mint stage was set to "not_started" but the UI was still showing the mint button as enabled.

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

## Testing

1. Deploy a new collection
2. Try to mint (should fail with "Minting has not started yet")
3. Run the start-mint script or use the UI component
4. Try to mint again (should succeed if in allowlist or public stage)
