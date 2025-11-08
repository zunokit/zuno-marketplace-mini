/**
 * Phase 4: Service Migration Guide
 *
 * This document provides a comprehensive guide for migrating existing contract services
 * to use the BaseContractService class introduced in Phase 1.
 *
 * ⚠️ PREREQUISITE: Phase 1 (Foundation) must be merged first
 *
 * MIGRATION CHECKLIST:
 *
 * 1. Import BaseContractService
 * 2. Extend BaseContractService instead of plain class
 * 3. Implement required abstract properties
 * 4. Implement fetchContractAddress() method
 * 5. Replace provider/signer management with base class
 * 6. Replace getContract/getContractReadOnly with base class methods
 * 7. Remove duplicate initialize() if using base class version
 * 8. Use ContractErrorFormatter from Phase 1 instead of local formatTransactionError
 * 9. Run tests and verify functionality
 *
 * ESTIMATED SAVINGS: ~70 lines per service × 20 services = 1,400 lines
 */

// ============================================================================
// EXAMPLE 1: ExchangeService Migration
// ============================================================================

/**
 * BEFORE: Original ExchangeService (920 lines)
 */
/*
export class ExchangeService {
  public provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  getSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }
    return this.signer;
  }

  async initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    logger.success("ExchangeService initialized", null, {
      component: "ExchangeService",
      action: "initialize",
    });
  }

  private async getExchangeContract(tokenType: "ERC721" | "ERC1155"): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }
    const address = tokenType === "ERC721"
      ? userHubService.getERC721Exchange()
      : userHubService.getERC1155Exchange();
    const abiName = tokenType === "ERC721" ? "ERC721NFTExchange" : "ERC1155NFTExchange";
    const abi = await getContractABI(abiName);
    return new ethers.Contract(address, abi, this.signer);
  }

  private formatTransactionError(error: unknown): Error {
    // 15+ lines of error handling...
  }
}
*/

/**
 * AFTER: Migrated ExchangeService (~850 lines, -70 lines)
 */
/*
import { BaseContractService } from "./base/BaseContractService";
import { ContractErrorFormatter } from "@/lib/utils/contract-errors";

export class ExchangeService extends BaseContractService {
  readonly contractName = "ExchangeService";
  readonly defaultAbiName = "ERC721NFTExchange";

  protected async fetchContractAddress(): Promise<void> {
    // Primary contract address (can be null if service manages multiple contracts)
    this.contractAddress = userHubService.getERC721Exchange();
  }

  // Custom contract getter for dual ERC721/ERC1155 support
  private async getExchangeContract(tokenType: "ERC721" | "ERC1155"): Promise<ethers.Contract> {
    const address = tokenType === "ERC721"
      ? userHubService.getERC721Exchange()
      : userHubService.getERC1155Exchange();
    const abiName = tokenType === "ERC721" ? "ERC721NFTExchange" : "ERC1155NFTExchange";
    return await this.getContract(abiName, address);
  }

  // Business logic methods remain unchanged
  async listNFT(params: ListingParams): Promise<string> {
    try {
      const contract = await this.getExchangeContract(params.tokenType);
      const tx = await contract.listNFT(...);
      return tx.hash;
    } catch (error) {
      throw ContractErrorFormatter.format(error, "Failed to list NFT");
    }
  }
}
*/

// ============================================================================
// EXAMPLE 2: Simple Service Migration (RoyaltyManagerService)
// ============================================================================

/**
 * BEFORE: Original RoyaltyManagerService
 */
/*
export class RoyaltyManagerService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private royaltyManagerAddress: string | null = null;

  async initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    // TODO: Get RoyaltyManager address properly
    logger.success("RoyaltyManagerService initialized", null, {...});
  }

  private async getRoyaltyManagerContract(readOnly: boolean = false): Promise<ethers.Contract> {
    if (!readOnly && !this.signer) {
      throw new Error("Signer not available");
    }
    if (!this.royaltyManagerAddress) {
      throw new Error("RoyaltyManager address not set");
    }
    const abi = await getContractABI("RoyaltyManager");
    return new ethers.Contract(
      this.royaltyManagerAddress,
      abi,
      readOnly ? this.provider : this.signer
    );
  }
}
*/

/**
 * AFTER: Migrated RoyaltyManagerService
 */
/*
export class RoyaltyManagerService extends BaseContractService {
  readonly contractName = "RoyaltyManagerService";
  readonly defaultAbiName = "RoyaltyManager";

  protected async fetchContractAddress(): Promise<void> {
    const addresses = userHubService.getAddresses();
    this.contractAddress = addresses.royaltyManager;
  }

  // All business logic methods remain unchanged, just use base class methods
  async getRoyaltyInfo(collection: string, tokenId: bigint, salePrice: bigint) {
    const contract = await this.getContractReadOnly(); // Uses base class method
    return await contract.getRoyaltyInfo(collection, tokenId, salePrice);
  }

  async setRoyaltyRecipients(collection: string, recipients: RoyaltyRecipient[]) {
    const contract = await this.getContract(); // Uses base class method
    const tx = await contract.setRoyaltyRecipients(collection, recipients);
    return tx;
  }
}
*/

// ============================================================================
// MIGRATION PATTERNS
// ============================================================================

/**
 * Pattern 1: Simple Service (Single Contract)
 * Use case: Most services that interact with one contract
 */
/*
class SimpleService extends BaseContractService {
  readonly contractName = "SimpleService";
  readonly defaultAbiName = "SimpleContract";

  protected async fetchContractAddress(): Promise<void> {
    this.contractAddress = userHubService.getSimpleContractAddress();
  }

  async doSomething() {
    const contract = await this.getContract(); // Write operation
    return await contract.doSomething();
  }

  async readSomething() {
    const contract = await this.getContractReadOnly(); // Read operation
    return await contract.readSomething();
  }
}
*/

/**
 * Pattern 2: Multi-Contract Service
 * Use case: Services that interact with multiple contracts (Exchange, Auction)
 */
/*
class MultiContractService extends BaseContractService {
  readonly contractName = "MultiContractService";
  readonly defaultAbiName = "PrimaryContract";

  protected async fetchContractAddress(): Promise<void> {
    this.contractAddress = userHubService.getPrimaryAddress();
  }

  private async getSecondaryContract(type: string): Promise<ethers.Contract> {
    const address = type === "A"
      ? userHubService.getContractA()
      : userHubService.getContractB();
    const abiName = type === "A" ? "ContractA" : "ContractB";
    return await this.getContract(abiName, address);
  }

  async operationOnPrimary() {
    const contract = await this.getContract(); // Uses default
    return await contract.operate();
  }

  async operationOnSecondary(type: string) {
    const contract = await this.getSecondaryContract(type);
    return await contract.operate();
  }
}
*/

/**
 * Pattern 3: Service with No Primary Contract
 * Use case: Utility services that orchestrate multiple contracts
 */
/*
class OrchestratorService extends BaseContractService {
  readonly contractName = "OrchestratorService";
  readonly defaultAbiName = ""; // Not used

  protected async fetchContractAddress(): Promise<void> {
    // No primary contract, this.contractAddress stays null
  }

  async orchestrate() {
    // Get contracts as needed
    const contractA = await this.getContract("ContractA", addressA);
    const contractB = await this.getContract("ContractB", addressB);

    // Orchestrate operations
    await contractA.doA();
    await contractB.doB();
  }
}
*/

// ============================================================================
// STEP-BY-STEP MIGRATION GUIDE
// ============================================================================

/**
 * Step 1: Add imports
 */
// import { BaseContractService } from "./base/BaseContractService";
// import { ContractErrorFormatter } from "@/lib/utils/contract-errors";

/**
 * Step 2: Change class declaration
 */
// Before: export class MyService {
// After:  export class MyService extends BaseContractService {

/**
 * Step 3: Add required properties
 */
// readonly contractName = "MyService";
// readonly defaultAbiName = "MyContract";

/**
 * Step 4: Implement fetchContractAddress()
 */
// protected async fetchContractAddress(): Promise<void> {
//   this.contractAddress = userHubService.getMyContractAddress();
// }

/**
 * Step 5: Remove duplicate fields
 */
// Remove: private provider: ethers.Provider | null = null;
// Remove: private signer: ethers.Signer | null = null;
// Remove: private contractAddress: string | null = null;

/**
 * Step 6: Remove duplicate methods
 */
// Remove: getSigner(), getProvider()
// Remove: initialize() (unless custom logic needed)
// Remove: getContract(), getContractReadOnly()
// Remove: isInitialized(), hasSigner()

/**
 * Step 7: Update contract getters
 */
// Before: const contract = new ethers.Contract(address, abi, this.signer);
// After:  const contract = await this.getContract(abiName, address);

/**
 * Step 8: Replace error formatting
 */
// Before: throw this.formatTransactionError(error);
// After:  throw ContractErrorFormatter.format(error, "Context message");

/**
 * Step 9: Update error handling
 */
// Before: if (!this.signer) throw new Error("...");
// After:  const signer = this.getSigner(); // Built-in validation

/**
 * Step 10: Test thoroughly
 */
// - Run all existing tests
// - Verify initialization works
// - Check read/write operations
// - Validate error handling

// ============================================================================
// MIGRATION PRIORITY ORDER
// ============================================================================

/**
 * Recommended migration order (based on complexity and usage):
 *
 * 1. ✅ Simple services first (single contract, minimal logic)
 *    - RoyaltyManagerService
 *    - FeeManagerService
 *    - CollectionVerifierService
 *
 * 2. ✅ Medium complexity (single contract, more methods)
 *    - ListingHistoryTrackerService
 *    - ListingValidatorService
 *    - AccessControlService
 *    - EmergencyManagerService
 *
 * 3. ✅ Complex services (multiple contracts)
 *    - ExchangeService (ERC721 + ERC1155)
 *    - AuctionService (English + Dutch)
 *    - BundleService
 *    - OfferService
 *
 * 4. ✅ Core services last (most critical)
 *    - UserHubService
 *    - AdminHubService
 *    - CollectionService
 */

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/**
 * After migration, verify each service:
 *
 * □ Service initializes correctly
 * □ Read operations work (getContractReadOnly)
 * □ Write operations work (getContract)
 * □ Error handling works (ContractErrorFormatter)
 * □ Signer validation works (getSigner throws when not available)
 * □ Provider validation works (getProvider throws when not available)
 * □ Multiple contract support works (if applicable)
 * □ No regressions in existing functionality
 * □ TypeScript compiles without errors
 * □ ESLint passes without errors
 */

// ============================================================================
// COMMON ISSUES & SOLUTIONS
// ============================================================================

/**
 * Issue 1: "Cannot read property of null"
 * Solution: Ensure fetchContractAddress() sets this.contractAddress
 *
 * Issue 2: "Signer not available"
 * Solution: Use getContract() only for write operations, getContractReadOnly() for reads
 *
 * Issue 3: "Contract address not set"
 * Solution: Call initialize() before using service methods
 *
 * Issue 4: TypeScript errors on getSigner()
 * Solution: Remove local getSigner() method, use this.getSigner() from base
 *
 * Issue 5: ABI not found
 * Solution: Verify defaultAbiName matches contract name in ABI manager
 */

export {};
