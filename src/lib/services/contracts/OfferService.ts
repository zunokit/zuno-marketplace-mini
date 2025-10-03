/**
 * Offer Service
 * Ported from frontend-foundry/src/services/contracts/OfferService.js
 * Handles offer creation, acceptance, and cancellation operations
 */

import { ethers } from "ethers";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { contractRegistryService } from "./ContractRegistryService";

export interface NFTOfferParams {
  collection: string;
  tokenId: string;
  price: string;
  expirationTime: number; // Unix timestamp
}

export interface CollectionOfferParams {
  collection: string;
  price: string;
  quantity: number;
  expirationTime: number; // Unix timestamp
}

export interface TraitOfferParams {
  collection: string;
  traits: string[];
  price: string;
  quantity: number;
  expirationTime: number; // Unix timestamp
}

export interface OfferInfo {
  id: string;
  creator: string;
  collection: string;
  tokenId: string;
  price: string;
  quantity: string;
  expirationTime: number;
  status: "ACTIVE" | "ACCEPTED" | "CANCELLED" | "EXPIRED" | "UNKNOWN";
  offerType: "NFT" | "COLLECTION" | "TRAIT" | "UNKNOWN";
  traits?: string[];
}

export class OfferService {
  private offerManagerAddress: string;
  private offerManagerContract: ethers.Contract | null = null;
  private isInitialized = false;

  constructor() {
    const addresses = getContractAddresses();
    this.offerManagerAddress = addresses.OFFER_MANAGER;
  }

  /**
   * Initialize the offer service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.offerManagerContract = contractRegistryService.getContract("OFFER_MANAGER_ABI");
      await this.offerManagerContract.getAddress();
      this.isInitialized = true;
      console.log("✅ OfferService initialized");
    } catch (error) {
      console.error("❌ Failed to initialize OfferService:", error);
      throw error;
    }
  }

  /**
   * Get the offer manager contract instance
   */
  private getOfferManagerContract(): ethers.Contract {
    if (!this.offerManagerContract) {
      throw new Error("OfferService not initialized. Call initialize() first.");
    }
    return this.offerManagerContract;
  }

  /**
   * Creates an offer for a specific NFT
   */
  async createNFTOffer(params: NFTOfferParams): Promise<string> {
    try {
      const contract = this.getOfferManagerContract();
      
      const tx = await contract.createOffer(
        params.collection,
        params.tokenId,
        ethers.parseEther(params.price),
        Math.floor(params.expirationTime / 1000),
        { value: ethers.parseEther(params.price) }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === "OfferCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        return parsed?.args.offerId.toString();
      }
      
      throw new Error("OfferCreated event not found");
    } catch (error) {
      console.error("Error creating NFT offer:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Creates a collection-wide offer
   */
  async createCollectionOffer(params: CollectionOfferParams): Promise<string> {
    try {
      const contract = this.getOfferManagerContract();
      const totalValue = parseFloat(params.price) * params.quantity;
      
      const tx = await contract.createCollectionOffer(
        params.collection,
        ethers.parseEther(params.price),
        params.quantity,
        Math.floor(params.expirationTime / 1000),
        { value: ethers.parseEther(totalValue.toString()) }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === "CollectionOfferCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        return parsed?.args.offerId.toString();
      }
      
      throw new Error("CollectionOfferCreated event not found");
    } catch (error) {
      console.error("Error creating collection offer:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Creates a trait-based offer
   */
  async createTraitOffer(params: TraitOfferParams): Promise<string> {
    try {
      const contract = this.getOfferManagerContract();
      const totalValue = parseFloat(params.price) * params.quantity;
      
      const tx = await contract.createTraitOffer(
        params.collection,
        params.traits,
        ethers.parseEther(params.price),
        params.quantity,
        Math.floor(params.expirationTime / 1000),
        { value: ethers.parseEther(totalValue.toString()) }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === "TraitOfferCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        return parsed?.args.offerId.toString();
      }
      
      throw new Error("TraitOfferCreated event not found");
    } catch (error) {
      console.error("Error creating trait offer:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Accepts an offer
   */
  async acceptOffer(offerId: string): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = this.getOfferManagerContract();
      const tx = await contract.acceptOffer(offerId);
      return tx;
    } catch (error) {
      console.error("Error accepting offer:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Cancels an offer
   */
  async cancelOffer(offerId: string): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = this.getOfferManagerContract();
      const tx = await contract.cancelOffer(offerId);
      return tx;
    } catch (error) {
      console.error("Error canceling offer:", error);
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Gets offer details
   */
  async getOffer(offerId: string): Promise<OfferInfo> {
    try {
      const contract = this.getOfferManagerContract();
      const offer = await contract.getOffer(offerId);
      
      return {
        id: offerId,
        creator: offer.creator,
        collection: offer.collection,
        tokenId: offer.tokenId.toString(),
        price: ethers.formatEther(offer.price),
        quantity: offer.quantity.toString(),
        expirationTime: offer.expirationTime.toNumber(),
        status: this.getOfferStatus(offer.status),
        offerType: this.getOfferType(offer.offerType),
        traits: offer.traits || [],
      };
    } catch (error) {
      console.error("Error getting offer:", error);
      throw error;
    }
  }

  /**
   * Gets all offers for a specific NFT
   */
  async getNFTOffers(collection: string, tokenId: string): Promise<OfferInfo[]> {
    try {
      const contract = this.getOfferManagerContract();
      const offerIds = await contract.getNFTOffers(collection, tokenId);
      return Promise.all(offerIds.map((id: bigint) => this.getOffer(id.toString())));
    } catch (error) {
      console.error("Error getting NFT offers:", error);
      throw error;
    }
  }

  /**
   * Gets all collection offers
   */
  async getCollectionOffers(collection: string): Promise<OfferInfo[]> {
    try {
      const contract = this.getOfferManagerContract();
      const offerIds = await contract.getCollectionOffers(collection);
      return Promise.all(offerIds.map((id: bigint) => this.getOffer(id.toString())));
    } catch (error) {
      console.error("Error getting collection offers:", error);
      throw error;
    }
  }

  /**
   * Gets user's active offers
   */
  async getUserOffers(userAddress: string): Promise<OfferInfo[]> {
    try {
      const contract = this.getOfferManagerContract();
      const offerIds = await contract.getUserOffers(userAddress);
      return Promise.all(offerIds.map((id: bigint) => this.getOffer(id.toString())));
    } catch (error) {
      console.error("Error getting user offers:", error);
      throw error;
    }
  }

  /**
   * Gets offers made on user's NFTs
   */
  async getOffersOnUserNFTs(userAddress: string): Promise<OfferInfo[]> {
    try {
      const contract = this.getOfferManagerContract();
      const offerIds = await contract.getOffersOnUserNFTs(userAddress);
      return Promise.all(offerIds.map((id: bigint) => this.getOffer(id.toString())));
    } catch (error) {
      console.error("Error getting offers on user NFTs:", error);
      throw error;
    }
  }

  /**
   * Get offer status from status code
   */
  private getOfferStatus(statusCode: number): "ACTIVE" | "ACCEPTED" | "CANCELLED" | "EXPIRED" | "UNKNOWN" {
    const statuses = ["ACTIVE", "ACCEPTED", "CANCELLED", "EXPIRED"];
    return statuses[statusCode] || "UNKNOWN";
  }

  /**
   * Get offer type from type code
   */
  private getOfferType(typeCode: number): "NFT" | "COLLECTION" | "TRAIT" | "UNKNOWN" {
    const types = ["NFT", "COLLECTION", "TRAIT"];
    return types[typeCode] || "UNKNOWN";
  }

  /**
   * Format transaction error for user-friendly messages
   */
  private formatTransactionError(error: any): Error {
    if (error.code === "ACTION_REJECTED") {
      return new Error("Transaction was rejected by user");
    }
    if (error.code === "INSUFFICIENT_FUNDS") {
      return new Error("Insufficient funds to complete transaction");
    }
    if (error.message?.includes("execution reverted")) {
      const revertReason = error.message.split("execution reverted: ")[1];
      return new Error(revertReason || "Transaction failed");
    }
    return new Error(error.message || "Transaction failed");
  }
}

// Export singleton instance
export const offerService = new OfferService();
