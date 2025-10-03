/**
 * Contract Registry Service
 * Ported from frontend-foundry ExchangeService pattern
 * Handles dynamic contract address loading from registry
 */

import { ethers } from "ethers";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { NFTExchangeRegistry_ABI } from "@/lib/contracts/abis";

export interface ExchangeAddresses {
  ERC721?: string;
  ERC1155?: string;
}

export class ContractRegistryService {
  private registry: ethers.Contract | null = null;
  private exchangeAddresses: ExchangeAddresses = {};
  private signer: ethers.Signer | null = null;
  private isInitialized = false;

  constructor(signer?: ethers.Signer) {
    this.signer = signer || null;
  }

  /**
   * Initialize the registry service
   */
  async initialize(signer?: ethers.Signer): Promise<void> {
    if (signer) {
      this.signer = signer;
    }

    if (!this.signer) {
      throw new Error("Signer not provided for ContractRegistryService");
    }

    try {
      await this.loadExchangeAddresses();
      this.isInitialized = true;
      console.log("✅ Contract Registry Service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Contract Registry Service:", error);
      throw error;
    }
  }

  /**
   * Load exchange contract addresses from the registry
   * Ported from frontend-foundry ExchangeService.loadExchangeAddresses()
   */
  private async loadExchangeAddresses(): Promise<void> {
    if (!this.signer) {
      throw new Error("Signer not available");
    }

    try {
      const addresses = getContractAddresses();
      const registryAddress = addresses.NFT_EXCHANGE_REGISTRY;
      
      if (!registryAddress) {
        throw new Error("NFT_EXCHANGE_REGISTRY address not found");
      }

      // Create registry contract instance
      this.registry = new ethers.Contract(
        registryAddress,
        NFTExchangeRegistry_ABI,
        this.signer
      );

      // Load exchange addresses dynamically
      const [erc721Address, erc1155Address] = await this.registry.getExchangeAddresses();

      this.exchangeAddresses = {
        ERC721: erc721Address,
        ERC1155: erc1155Address,
      };

      console.log("✅ Exchange addresses loaded from registry:", {
        ERC721: erc721Address,
        ERC1155: erc1155Address,
      });
    } catch (error) {
      console.error("❌ Error loading exchange addresses from registry:", error);
      throw error;
    }
  }

  /**
   * Get the registry contract instance
   */
  getRegistryContract(): ethers.Contract {
    if (!this.registry) {
      throw new Error("Registry not initialized. Call initialize() first.");
    }
    return this.registry;
  }

  /**
   * Get exchange contract for specific token type
   */
  getExchangeContract(tokenType: "ERC721" | "ERC1155"): ethers.Contract {
    if (!this.signer) {
      throw new Error("Signer not initialized. Call initialize() first.");
    }

    const exchangeAddress = this.exchangeAddresses[tokenType];
    if (!exchangeAddress) {
      throw new Error(`Exchange address not found for token type: ${tokenType}`);
    }

    // Import ABIs dynamically to avoid circular dependencies
    const { ERC721NFTExchange_ABI, ERC1155NFTExchange_ABI } = require("@/lib/contracts/abis");
    const abi = tokenType === "ERC721" ? ERC721NFTExchange_ABI : ERC1155NFTExchange_ABI;

    return new ethers.Contract(exchangeAddress, abi, this.signer);
  }

  /**
   * Get signer instance
   */
  getSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error("Signer not initialized. Call initialize() first.");
    }
    return this.signer;
  }

  /**
   * Get exchange addresses
   */
  getExchangeAddresses(): ExchangeAddresses {
    return { ...this.exchangeAddresses };
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get exchange address for a specific NFT contract
   * Ported from frontend-foundry ExchangeService.getExchangeForNFT()
   */
  async getExchangeForNFT(nftContract: string): Promise<string> {
    if (!this.registry) {
      throw new Error("Registry not initialized");
    }

    try {
      return await this.registry.getExchangeForNFT(nftContract);
    } catch (error) {
      console.error("Error getting exchange for NFT:", error);
      throw error;
    }
  }

  /**
   * Get exchange address by token type
   */
  getExchangeAddress(tokenType: "ERC721" | "ERC1155"): string {
    const address = this.exchangeAddresses[tokenType];
    if (!address) {
      throw new Error(`Exchange address not found for ${tokenType}`);
    }
    return address;
  }

  /**
   * Get all exchange addresses
   */
  getExchangeAddresses(): ExchangeAddresses {
    return { ...this.exchangeAddresses };
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if exchange addresses are loaded
   */
  hasExchangeAddresses(): boolean {
    return !!(this.exchangeAddresses.ERC721 && this.exchangeAddresses.ERC1155);
  }

  /**
   * Validate exchange addresses
   */
  validateExchangeAddresses(): boolean {
    if (!this.hasExchangeAddresses()) {
      return false;
    }

    // Basic address validation
    const isValidAddress = (address: string) => {
      return address && address.length === 42 && address.startsWith('0x');
    };

    return (
      isValidAddress(this.exchangeAddresses.ERC721!) &&
      isValidAddress(this.exchangeAddresses.ERC1155!)
    );
  }
}

// Singleton instance
let contractRegistryServiceInstance: ContractRegistryService | null = null;

/**
 * Get singleton instance of ContractRegistryService
 */
export function getContractRegistryService(): ContractRegistryService {
  if (!contractRegistryServiceInstance) {
    contractRegistryServiceInstance = new ContractRegistryService();
  }
  return contractRegistryServiceInstance;
}

/**
 * Initialize the singleton service
 */
export async function initializeContractRegistry(signer: ethers.Signer): Promise<ContractRegistryService> {
  const service = getContractRegistryService();
  await service.initialize(signer);
  return service;
}
