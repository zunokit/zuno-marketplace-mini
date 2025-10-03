import { BaseContractService } from "../core/BaseContractService";
import {
  COLLECTION_FACTORY_ABI,
  ERC721_ABI,
  ERC1155_ABI,
} from "@/lib/contracts/abis";
import { getContractAddress } from "@/lib/contracts/addresses";
import { ethers } from "ethers";

export interface Collection {
  address: string;
  name: string;
  symbol: string;
  type: "ERC721" | "ERC1155";
  creator: string;
  baseURI?: string;
}

export class CollectionService extends BaseContractService {
  constructor(chainId: number = 31337) {
    const contractAddress = getContractAddress(
      "COLLECTION_FACTORY_REGISTRY",
      chainId
    );
    super(contractAddress, COLLECTION_FACTORY_ABI);
  }

  /**
   * Create ERC721 collection
   */
  async createERC721Collection(
    name: string,
    symbol: string,
    baseURI: string
  ): Promise<ethers.ContractTransactionResponse> {
    return await this.sendTransaction(
      "createERC721Collection",
      name,
      symbol,
      baseURI
    );
  }

  /**
   * Create ERC1155 collection
   */
  async createERC1155Collection(
    name: string,
    symbol: string,
    baseURI: string
  ): Promise<ethers.ContractTransactionResponse> {
    return await this.sendTransaction(
      "createERC1155Collection",
      name,
      symbol,
      baseURI
    );
  }

  /**
   * Get collections by creator
   */
  async getCollectionsByCreator(creatorAddress: string): Promise<string[]> {
    try {
      return await this.callMethod("getCollectionsByCreator", creatorAddress);
    } catch (error) {
      console.error("Error getting collections by creator:", error);
      return [];
    }
  }

  /**
   * Check if collection is valid
   */
  async isValidCollection(collectionAddress: string): Promise<boolean> {
    try {
      return await this.callMethod("isValidCollection", collectionAddress);
    } catch (error) {
      console.error("Error checking collection validity:", error);
      return false;
    }
  }

  /**
   * Get collection details (ERC721)
   */
  async getERC721CollectionDetails(
    collectionAddress: string
  ): Promise<Collection | null> {
    try {
      if (!this.provider) throw new Error("Provider not initialized");

      const collectionContract = new ethers.Contract(
        collectionAddress,
        ERC721_ABI,
        this.provider
      );

      const [name, symbol] = await Promise.all([
        collectionContract.name(),
        collectionContract.symbol(),
      ]);

      return {
        address: collectionAddress,
        name,
        symbol,
        type: "ERC721",
        creator: "", // Will be filled by caller if needed
      };
    } catch (error) {
      console.error("Error getting ERC721 collection details:", error);
      return null;
    }
  }

  /**
   * Get collection details (ERC1155)
   */
  async getERC1155CollectionDetails(
    collectionAddress: string
  ): Promise<Collection | null> {
    try {
      if (!this.provider) throw new Error("Provider not initialized");

      const collectionContract = new ethers.Contract(
        collectionAddress,
        ERC1155_ABI,
        this.provider
      );

      // ERC1155 might not have name/symbol, try to get them
      let name = "ERC1155 Collection";
      let symbol = "ERC1155";

      try {
        name = await collectionContract.name();
        symbol = await collectionContract.symbol();
      } catch {
        // Fallback if name/symbol not implemented
      }

      return {
        address: collectionAddress,
        name,
        symbol,
        type: "ERC1155",
        creator: "", // Will be filled by caller if needed
      };
    } catch (error) {
      console.error("Error getting ERC1155 collection details:", error);
      return null;
    }
  }

  /**
   * Get all collections from events
   */
  async getAllCollections(): Promise<Collection[]> {
    try {
      const [erc721Events, erc1155Events] = await Promise.all([
        this.getPastEvents("ERC721CollectionCreated"),
        this.getPastEvents("ERC1155CollectionCreated"),
      ]);

      const collections: Collection[] = [];

      // Process ERC721 collections
      for (const event of erc721Events) {
        const collectionAddress = event.args.collection;
        const creator = event.args.creator;
        const name = event.args.name;
        const symbol = event.args.symbol;

        collections.push({
          address: collectionAddress,
          name,
          symbol,
          type: "ERC721",
          creator,
        });
      }

      // Process ERC1155 collections
      for (const event of erc1155Events) {
        const collectionAddress = event.args.collection;
        const creator = event.args.creator;
        const name = event.args.name;
        const symbol = event.args.symbol;

        collections.push({
          address: collectionAddress,
          name,
          symbol,
          type: "ERC1155",
          creator,
        });
      }

      return collections;
    } catch (error) {
      console.error("Error getting all collections:", error);
      return [];
    }
  }

  /**
   * Get user's collections with full details
   */
  async getUserCollectionsWithDetails(
    userAddress: string
  ): Promise<Collection[]> {
    try {
      const collectionAddresses = await this.getCollectionsByCreator(
        userAddress
      );
      const collections: Collection[] = [];

      for (const address of collectionAddresses) {
        // Try ERC721 first
        let collection = await this.getERC721CollectionDetails(address);
        if (!collection) {
          // Try ERC1155
          collection = await this.getERC1155CollectionDetails(address);
        }

        if (collection) {
          collection.creator = userAddress;
          collections.push(collection);
        }
      }

      return collections;
    } catch (error) {
      console.error("Error getting user collections with details:", error);
      return [];
    }
  }

  /**
   * Listen to collection creation events
   */
  onERC721CollectionCreated(
    callback: (
      creator: string,
      collection: string,
      name: string,
      symbol: string
    ) => void
  ): void {
    this.addEventListener("ERC721CollectionCreated", callback);
  }

  onERC1155CollectionCreated(
    callback: (
      creator: string,
      collection: string,
      name: string,
      symbol: string
    ) => void
  ): void {
    this.addEventListener("ERC1155CollectionCreated", callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners(): void {
    this.removeAllListeners();
  }
}

// Singleton instance
export const collectionService = new CollectionService();
