#!/bin/bash

# CollectionVerifierService.ts
sed -i 's/return new ethers\.Contract(\s*this\.verifierAddress,\s*CollectionVerifier_ABI,/const abi = await getContractABI("CollectionVerifier");\n      return new ethers.Contract(this.verifierAddress, abi,/g' CollectionVerifierService.ts
sed -i 's/private getVerifierContract/private async getVerifierContract/g' CollectionVerifierService.ts
sed -i 's/): ethers\.Contract {$/): Promise<ethers.Contract> {/g' CollectionVerifierService.ts
sed -i 's/const contract = this\.getVerifierContract/const contract = await this.getVerifierContract/g' CollectionVerifierService.ts

# AccessControlService.ts
sed -i 's/return new ethers\.Contract(\s*this\.accessControlAddress,\s*MarketplaceAccessControl_ABI,/const abi = await getContractABI("MarketplaceAccessControl");\n      return new ethers.Contract(this.accessControlAddress, abi,/g' AccessControlService.ts
sed -i 's/private getAccessControlContract/private async getAccessControlContract/g' AccessControlService.ts
sed -i 's/): ethers\.Contract {$/): Promise<ethers.Contract> {/g' AccessControlService.ts
sed -i 's/const contract = this\.getAccessControlContract/const contract = await this.getAccessControlContract/g' AccessControlService.ts

# EmergencyManagerService.ts
sed -i 's/return new ethers\.Contract(\s*this\.emergencyManagerAddress,\s*EmergencyManager_ABI,/const abi = await getContractABI("EmergencyManager");\n      return new ethers.Contract(this.emergencyManagerAddress, abi,/g' EmergencyManagerService.ts
sed -i 's/private getEmergencyManagerContract/private async getEmergencyManagerContract/g' EmergencyManagerService.ts
sed -i 's/const contract = this\.getEmergencyManagerContract/const contract = await this.getEmergencyManagerContract/g' EmergencyManagerService.ts

# ListingValidatorService.ts
sed -i 's/return new ethers\.Contract(\s*this\.validatorAddress,\s*ListingValidator_ABI,/const abi = await getContractABI("ListingValidator");\n      return new ethers.Contract(this.validatorAddress, abi,/g' ListingValidatorService.ts
sed -i 's/private getValidatorContract/private async getValidatorContract/g' ListingValidatorService.ts
sed -i 's/const contract = this\.getValidatorContract/const contract = await this.getValidatorContract/g' ListingValidatorService.ts

# RoyaltyManagerService.ts
sed -i 's/return new ethers\.Contract(\s*this\.royaltyManagerAddress,\s*AdvancedRoyaltyManager_ABI,/const abi = await getContractABI("AdvancedRoyaltyManager");\n      return new ethers.Contract(this.royaltyManagerAddress, abi,/g' RoyaltyManagerService.ts
sed -i 's/private getRoyaltyManagerContract/private async getRoyaltyManagerContract/g' RoyaltyManagerService.ts
sed -i 's/const contract = this\.getRoyaltyManagerContract/const contract = await this.getRoyaltyManagerContract/g' RoyaltyManagerService.ts

# TimelockService.ts
sed -i 's/return new ethers\.Contract(\s*this\.timelockAddress,\s*MarketplaceTimelock_ABI,/const abi = await getContractABI("MarketplaceTimelock");\n      return new ethers.Contract(this.timelockAddress, abi,/g' TimelockService.ts
sed -i 's/private getTimelockContract/private async getTimelockContract/g' TimelockService.ts
sed -i 's/const contract = this\.getTimelockContract/const contract = await this.getTimelockContract/g' TimelockService.ts

# ListingHistoryTrackerService.ts
sed -i 's/return new ethers\.Contract(\s*this\.trackerAddress,\s*ListingHistoryTracker_ABI,/const abi = await getContractABI("ListingHistoryTracker");\n      return new ethers.Contract(this.trackerAddress, abi,/g' ListingHistoryTrackerService.ts
sed -i 's/private getTrackerContract/private async getTrackerContract/g' ListingHistoryTrackerService.ts
sed -i 's/const contract = this\.getTrackerContract/const contract = await this.getTrackerContract/g' ListingHistoryTrackerService.ts

echo "Contract calls updated successfully"
