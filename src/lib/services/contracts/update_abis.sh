#!/bin/bash

# OfferService.ts
sed -i 's/import { OfferManager_ABI } from "@\/lib\/contracts\/abis";/import { getContractABI } from "@\/lib\/contracts\/abi-manager";/g' OfferService.ts

# CollectionVerifierService.ts  
sed -i 's/import { CollectionVerifier_ABI } from "@\/lib\/contracts\/abis";/import { getContractABI } from "@\/lib\/contracts\/abi-manager";/g' CollectionVerifierService.ts

# AccessControlService.ts
sed -i 's/import { MarketplaceAccessControl_ABI } from "@\/lib\/contracts\/abis";/import { getContractABI } from "@\/lib\/contracts\/abi-manager";/g' AccessControlService.ts

# EmergencyManagerService.ts
sed -i 's/import { EmergencyManager_ABI } from "@\/lib\/contracts\/abis";/import { getContractABI } from "@\/lib\/contracts\/abi-manager";/g' EmergencyManagerService.ts

# ListingValidatorService.ts
sed -i 's/import { ListingValidator_ABI } from "@\/lib\/contracts\/abis";/import { getContractABI } from "@\/lib\/contracts\/abi-manager";/g' ListingValidatorService.ts

# RoyaltyManagerService.ts
sed -i 's/import { AdvancedRoyaltyManager_ABI } from "@\/lib\/contracts\/abis";/import { getContractABI } from "@\/lib\/contracts\/abi-manager";/g' RoyaltyManagerService.ts

# TimelockService.ts
sed -i 's/import { MarketplaceTimelock_ABI } from "@\/lib\/contracts\/abis";/import { getContractABI } from "@\/lib\/contracts\/abi-manager";/g' TimelockService.ts

# ListingHistoryTrackerService.ts
sed -i 's/import { ListingHistoryTracker_ABI } from "@\/lib\/contracts\/abis";/import { getContractABI } from "@\/lib\/contracts\/abi-manager";/g' ListingHistoryTrackerService.ts

echo "Imports updated successfully"
