# Mint Timing Issue Explanation

## Problem
When creating collections through the web app, minting was failing with `require(false)` error, but scripts were working fine.

## Root Cause
The smart contract has a validation in `BaseCollection.sol`:

```solidity
// Check if minting is active
if (block.timestamp < s_mintStartTime) {
    revert Collection__MintingNotActive();
}
```

This check ensures that minting can only start after `mintStartTime`.

## Why Scripts Work

### 1. Different Parameter Handling
Scripts might:
- Use pre-deployed collections with `mintStartTime` already in the past
- Pass explicit `mintStartTime` values when creating collections
- Run after collections have been deployed for a while

### 2. Contract State
When using scripts:
- `updateMintStage()` is called which updates the stage based on current time
- Scripts might be testing with collections where `mintStartTime` was set long ago

### 3. The Real Issue
The web app was setting:
```javascript
mintStartTime: Math.floor(Date.now() / 1000) // Current timestamp
```

This means:
- Collection is created with `mintStartTime` = now
- When trying to mint immediately after, `block.timestamp` might still equal `mintStartTime`
- Due to block timing, the condition `block.timestamp < s_mintStartTime` could be true
- Even worse, local development blockchains might have timestamp issues

## Solution

We now set `mintStartTime` to 1 hour in the past:
```javascript
const MINT_START_TIME_OFFSET = 3600; // 1 hour in seconds
mintStartTime: Math.floor(Date.now() / 1000) - MINT_START_TIME_OFFSET
```

This ensures:
- Minting is immediately active when collection is created
- No timing issues between creation and first mint
- Works consistently in development environment

## Additional Context

### Stage Calculation
The contract calculates stages based on timestamps:
```solidity
function _calculateCurrentStage() internal view returns (MintStage) {
    if (block.timestamp < s_mintStartTime) {
        return MintStage.INACTIVE;
    } else if (block.timestamp < s_allowlistStageEnd) {
        return MintStage.ALLOWLIST;
    } else {
        return MintStage.PUBLIC;
    }
}
```

With our fix:
- `mintStartTime` = now - 1 hour (always in the past)
- `allowlistStageEnd` = mintStartTime + 24 hours = now + 23 hours
- Current stage will be ALLOWLIST for the next 23 hours
- Then automatically transition to PUBLIC

### updateMintStage() Confusion
The `updateMintStage()` function doesn't actually change the timestamps. It only updates `s_currentStage` based on the current time:
```solidity
function updateMintStage() public {
    MintStage newStage = _calculateCurrentStage();
    if (newStage != s_currentStage) {
        s_currentStage = newStage;
        emit StageUpdated(s_currentStage, block.timestamp);
    }
}
```

This is why calling `updateMintStage()` from scripts doesn't actually "fix" the timing - it just synchronizes the stored stage with what it should be based on current time.

## Best Practices for Production

1. **Set mintStartTime appropriately**:
   - For immediate minting: Use past timestamp
   - For scheduled launch: Use future timestamp

2. **Consider timezone and block timing**:
   - Blockchain timestamps can vary slightly
   - Always add buffer time for immediate operations

3. **Test thoroughly**:
   - Test collection creation and immediate minting
   - Test with different network conditions
   - Verify stage transitions work as expected
