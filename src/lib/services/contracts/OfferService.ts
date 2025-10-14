/**
 * Offer Service
 * Handles offer creation, acceptance, and cancellation operations
 * Uses MarketplaceHub for address discovery
 */

import { ethers } from "ethers";
import { userHubService } from "./UserHubService";
import { logger } from "@/lib/utils/logger";
import { OfferManager_ABI } from "@/lib/contracts/abis";

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
  expirationTime: string; // Changed from number to string for BigInt compatibility
  status: "ACTIVE" | "ACCEPTED" | "CANCELLED" | "EXPIRED" | "UNKNOWN";
  offerType: "NFT" | "COLLECTION" | "TRAIT" | "UNKNOWN";
  traits?: string[];
}

export class OfferService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private offerManagerAddress: string | null = null;
  
  /**
   * Get offer manager contract for direct interaction
   */
  async getOfferManagerContract(): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }
    if (!this.offerManagerAddress) {
      throw new Error("Offer manager not initialized");
    }
    
    return new ethers.Contract(
      this.offerManagerAddress,
      OfferManager_ABI,
      this.signer
    );
  }
  
  /**
   * Get offer manager address
   */
  getOfferManagerAddress(): string {
    if (!this.offerManagerAddress) {
      throw new Error("Offer manager not initialized");
    }
    return this.offerManagerAddress;
  }

  /**
   * Initialize offer service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;

    // Get offer manager address from hub
    const addresses = userHubService.getAddresses();
    this.offerManagerAddress = addresses.offerManager;

    logger.success(
      "OfferService initialized with OfferManager",
      { offerManagerAddress: this.offerManagerAddress },
      { component: "OfferService", action: "initialize" }
    );
  }



  /**
   * Creates an offer for a specific NFT
   */
  async createNFTOffer(params: NFTOfferParams): Promise<string> {
    try {
      const contract = await this.getOfferManagerContract();
      const priceInWei = ethers.parseEther(params.price);

      const tx = await contract.createNFTOffer(
        params.collection,
        params.tokenId,
        priceInWei,
        params.expirationTime
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
      logger.error("Error creating NFT offer", error, {
        component: "OfferService",
        action: "createNFTOffer",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Creates an offer for a collection
   */
  async createCollectionOffer(params: CollectionOfferParams): Promise<string> {
    try {
      const contract = await this.getOfferManagerContract();
      const priceInWei = ethers.parseEther(params.price);

      const tx = await contract.createCollectionOffer(
        params.collection,
        priceInWei,
        params.quantity,
        params.expirationTime
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
      logger.error("Error creating collection offer", error, {
        component: "OfferService",
        action: "createCollectionOffer",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Creates an offer for NFTs matching specific traits within a collection
   */
  async createTraitOffer(params: TraitOfferParams): Promise<string> {
    try {
      const contract = await this.getOfferManagerContract();
      const priceInWei = ethers.parseEther(params.price);

      const tx = await contract.createTraitOffer(
        params.collection,
        params.traits,
        priceInWei,
        params.quantity,
        params.expirationTime
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
      logger.error("Error creating trait offer", error, {
        component: "OfferService",
        action: "createTraitOffer",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Accepts an offer
   */
  async acceptOffer(
    offerId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = await this.getOfferManagerContract();
      const tx = await contract.acceptOffer(offerId);
      return tx;
    } catch (error) {
      logger.error("Error accepting offer", error, {
        component: "OfferService",
        action: "acceptOffer",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Cancels an offer
   */
  async cancelOffer(
    offerId: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = await this.getOfferManagerContract();
      const tx = await contract.cancelOffer(offerId);
      return tx;
    } catch (error) {
      logger.error("Error canceling offer", error, {
        component: "OfferService",
        action: "cancelOffer",
      });
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Gets offer details
   */
  async getOffer(offerId: string): Promise<OfferInfo> {
    try {
      if (!this.provider) {
        throw new Error("Provider not available");
      }

      if (!this.offerManagerAddress) {
        throw new Error("OfferManager address not loaded from hub");
      }

      const contract = new ethers.Contract(
        this.offerManagerAddress,
        OfferManager_ABI,
        this.provider
      );

      const offer = await contract.getOffer(offerId);

      return {
        id: offerId,
        creator: offer.creator,
        collection: offer.collection,
        tokenId: offer.tokenId.toString(),
        price: ethers.formatEther(offer.price),
        quantity: offer.quantity.toString(),
        expirationTime: offer.expirationTime.toString(),
        status: this.getOfferStatus(offer.status),
        offerType: this.getOfferType(offer.offerType),
        traits: offer.traits,
      };
    } catch (error) {
      logger.error("Error getting offer", error, {
        component: "OfferService",
        action: "getOffer",
      });
      throw error;
    }
  }

  /**
   * Gets all offers for an NFT
   */
  async getNFTOffers(
    collection: string,
    tokenId: string
  ): Promise<OfferInfo[]> {
    try {
      const contract = await this.getOfferManagerContract();
      const offerIds = await contract.getNFTOffers(collection, tokenId);
      return Promise.all(
        offerIds.map((id: bigint) => this.getOffer(id.toString()))
      );
    } catch (error) {
      logger.error("Error getting NFT offers", error, {
        component: "OfferService",
        action: "getNFTOffers",
      });
      throw error;
    }
  }

  /**
   * Gets all offers by a user
   */
  async getUserOffers(userAddress: string): Promise<OfferInfo[]> {
    try {
      const contract = await this.getOfferManagerContract();
      const offerIds = await contract.getUserOffers(userAddress);
      return Promise.all(
        offerIds.map((id: bigint) => this.getOffer(id.toString()))
      );
    } catch (error) {
      logger.error("Error getting user offers", error, {
        component: "OfferService",
        action: "getUserOffers",
      });
      throw error;
    }
  }

  /**
   * Gets all active offers across NFT, Collection, and Trait types
   */
  async getActiveOffers(): Promise<OfferInfo[]> {
    try {
      const contract = await this.getOfferManagerContract();
      const offerTypeCodes = [0, 1, 2]; // NFT, COLLECTION, TRAIT

      const idsByType: string[][] = await Promise.all(
        offerTypeCodes.map(async (typeCode) => {
          const ids: readonly bigint[] = await contract.getActiveOffers(
            typeCode
          );
          return ids.map((id: bigint) => id.toString());
        })
      );

      const allIds = idsByType.flat();
      return Promise.all(allIds.map((id) => this.getOffer(id)));
    } catch (error) {
      logger.error("Error getting active offers", error, {
        component: "OfferService",
        action: "getActiveOffers",
      });
      throw error;
    }
  }

  /**
   * Get offer status from status code
   */
  private getOfferStatus(
    statusCode: number
  ): "ACTIVE" | "ACCEPTED" | "CANCELLED" | "EXPIRED" | "UNKNOWN" {
    const statuses: ("ACTIVE" | "ACCEPTED" | "CANCELLED" | "EXPIRED")[] = [
      "ACTIVE",
      "ACCEPTED",
      "CANCELLED",
      "EXPIRED",
    ];
    return statuses[statusCode] || "UNKNOWN";
  }

  /**
   * Get offer type from type code
   */
  private getOfferType(
    typeCode: number
  ): "NFT" | "COLLECTION" | "TRAIT" | "UNKNOWN" {
    const types: ("NFT" | "COLLECTION" | "TRAIT")[] = [
      "NFT",
      "COLLECTION",
      "TRAIT",
    ];
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
