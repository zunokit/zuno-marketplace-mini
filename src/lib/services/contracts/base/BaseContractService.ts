/**
 * Base Contract Service
 * Abstract base class providing common functionality for all contract services
 *
 * Features:
 * - Standardized initialization pattern
 * - Provider/signer management with type safety
 * - Contract instance creation with ABI caching
 * - Consistent error handling
 * - Logging integration
 *
 * @abstract
 */

import { ethers } from "ethers";
import { getContractABI } from "@/lib/contracts/abi-manager";
import { logger } from "@/lib/utils/logger";

export abstract class BaseContractService {
  protected provider: ethers.Provider | null = null;
  protected signer: ethers.Signer | null = null;
  protected contractAddress: string | null = null;

  /**
   * Contract name for logging and identification
   * Must be implemented by derived classes
   */
  abstract readonly contractName: string;

  /**
   * Default ABI name for this service's primary contract
   * Must be implemented by derived classes
   */
  abstract readonly defaultAbiName: string;

  /**
   * Fetch and set the contract address for this service
   * Called during initialization
   * Must be implemented by derived classes
   */
  protected abstract fetchContractAddress(): Promise<void>;

  /**
   * Initialize the service with provider and optional signer
   *
   * @param provider - Ethers provider instance
   * @param signer - Optional signer for write operations
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    try {
      await this.fetchContractAddress();

      logger.success(
        `${this.contractName} initialized`,
        { contractAddress: this.contractAddress },
        {
          component: this.contractName,
          action: "initialize",
        }
      );
    } catch (error) {
      logger.error(
        `Failed to initialize ${this.contractName}`,
        error as Error,
        {
          component: this.contractName,
          action: "initialize",
        }
      );
      throw error;
    }
  }

  /**
   * Get contract instance for write operations (requires signer)
   *
   * @param abiName - Optional ABI name (defaults to defaultAbiName)
   * @param address - Optional contract address (defaults to this.contractAddress)
   * @returns Contract instance with signer
   * @throws Error if signer is not available
   */
  protected async getContract(
    abiName?: string,
    address?: string
  ): Promise<ethers.Contract> {
    const signer = this.getSigner();
    const contractAddress = address || this.getContractAddress();
    const abi = await getContractABI(abiName || this.defaultAbiName);

    return new ethers.Contract(contractAddress, abi, signer);
  }

  /**
   * Get contract instance for read-only operations (uses provider)
   *
   * @param abiName - Optional ABI name (defaults to defaultAbiName)
   * @param address - Optional contract address (defaults to this.contractAddress)
   * @returns Contract instance with provider
   */
  protected async getContractReadOnly(
    abiName?: string,
    address?: string
  ): Promise<ethers.Contract> {
    const provider = this.getProvider();
    const contractAddress = address || this.getContractAddress();
    const abi = await getContractABI(abiName || this.defaultAbiName);

    return new ethers.Contract(contractAddress, abi, provider);
  }

  /**
   * Get signer instance with validation
   *
   * @returns Signer instance
   * @throws Error if signer is not available
   */
  protected getSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }
    return this.signer;
  }

  /**
   * Get provider instance with validation
   *
   * @returns Provider instance
   * @throws Error if provider is not available
   */
  protected getProvider(): ethers.Provider {
    if (!this.provider) {
      throw new Error("Provider not available");
    }
    return this.provider;
  }

  /**
   * Get contract address with validation
   *
   * @returns Contract address
   * @throws Error if address is not set
   */
  protected getContractAddress(): string {
    if (!this.contractAddress) {
      throw new Error(`Contract address not set for ${this.contractName}`);
    }
    return this.contractAddress;
  }

  /**
   * Check if service is initialized
   *
   * @returns True if provider is set
   */
  isInitialized(): boolean {
    return this.provider !== null;
  }

  /**
   * Check if signer is available
   *
   * @returns True if signer is set
   */
  hasSigner(): boolean {
    return this.signer !== null;
  }

  /**
   * Get the current signer address if available
   *
   * @returns Signer address or null
   */
  async getSignerAddress(): Promise<string | null> {
    if (!this.signer) {
      return null;
    }
    return await this.signer.getAddress();
  }
}
