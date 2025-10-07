/**
 * Collection Query Service
 * Query and fetch collection data from blockchain
 */

import { ethers } from "ethers";
import { marketplaceHubService } from "./MarketplaceHubService";
import { listingHistoryTrackerService } from "./ListingHistoryTrackerService";
import { exchangeService } from "./ExchangeService";
import { ERC721Collection_ABI, ERC1155Collection_ABI } from "@/lib/contracts/abis";

export interface CollectionData {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  creator: string;
  type: "ERC721" | "ERC1155";
  totalSupply: string;
  maxSupply?: string;
  royaltyFee?: string;
  verified: boolean;
  createdAt: number;
  stats: {
    totalSupply: number;
    totalOwners: number;
    floorPrice: string;
    totalVolume: string;
    listed: number;
  };
}

export class CollectionQueryService {
  private provider: ethers.Provider | null = null;
  private collectionCache: Map<string, CollectionData> = new Map();

  /**
   * Initialize query service
   */
  async initialize(provider: ethers.Provider): Promise<void> {
    this.provider = provider;
    console.log("✅ CollectionQueryService initialized");
  }

  /**
   * Get all collections created through the marketplace
   */
  async getAllCollections(): Promise<CollectionData[]> {
    if (!this.provider) {
      throw new Error("Service not initialized");
    }

    try {
      // Get factory addresses
      const erc721Factory = marketplaceHubService.getERC721Factory();
      const erc1155Factory = marketplaceHubService.getERC1155Factory();

      console.log("🔍 Querying collections from factories:", {
        erc721Factory,
        erc1155Factory
      });

      // Check if factories are deployed
      if (!erc721Factory || erc721Factory === "0x0000000000000000000000000000000000000000") {
        console.log("⚠️ ERC721 Factory not deployed");
      }
      if (!erc1155Factory || erc1155Factory === "0x0000000000000000000000000000000000000000") {
        console.log("⚠️ ERC1155 Factory not deployed");
      }

      const collections: CollectionData[] = [];

      // Query ERC721 collections
      if (erc721Factory && erc721Factory !== "0x0000000000000000000000000000000000000000") {
        const erc721Collections = await this.getCollectionsFromFactory(erc721Factory, "ERC721");
        collections.push(...erc721Collections);
      }

      // Query ERC1155 collections
      if (erc1155Factory && erc1155Factory !== "0x0000000000000000000000000000000000000000") {
        const erc1155Collections = await this.getCollectionsFromFactory(erc1155Factory, "ERC1155");
        collections.push(...erc1155Collections);
      }

      // Sort by creation date (newest first)
      collections.sort((a, b) => b.createdAt - a.createdAt);

      console.log(`✅ Found ${collections.length} collections`);
      console.log("🔍 Collections details:", collections.map(c => ({
        address: c.address,
        name: c.name,
        symbol: c.symbol,
        totalSupply: c.totalSupply,
        hasValidData: !!(c.address && c.name)
      })));
      
      // Filter out invalid collections (but allow empty names - we'll fix them)
      const validCollections = collections.filter(c => 
        c && 
        c.address && 
        c.address !== "0x0000000000000000000000000000000000000000"
      );
      
      console.log(`✅ Valid collections: ${validCollections.length}`);
      return validCollections;

    } catch (error) {
      console.error("❌ Error fetching collections:", error);
      throw error;
    }
  }

  /**
   * Get collections from a specific factory
   */
  private async getCollectionsFromFactory(
    factoryAddress: string, 
    tokenType: "ERC721" | "ERC1155"
  ): Promise<CollectionData[]> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const collections: CollectionData[] = [];

    try {
      // Query factory events to find created collections
      // Note: This is a simplified approach - in production you'd want to use event filters
      console.log(`🔍 Querying ${tokenType} collections from factory:`, factoryAddress);

      // Get recent blocks to search for collection creation events
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Search last 10k blocks

      // Query CollectionCreated events (assuming this event exists)
      const filter = {
        address: factoryAddress,
        fromBlock,
        toBlock: 'latest'
      };

      const logs = await this.provider.getLogs(filter);
      console.log(`📋 Found ${logs.length} logs from ${tokenType} factory`);

      // Parse logs to extract collection addresses
      for (const log of logs) {
        try {
          // Try to extract collection address from log topics
          if (log.topics && log.topics.length > 1) {
            const collectionAddress = this.extractAddressFromTopic(log.topics[1]);
            
            if (collectionAddress && collectionAddress !== "0x0000000000000000000000000000000000000000") {
              // Get block timestamp for creation time
              let createdAt = Date.now();
              try {
                if (log.blockNumber) {
                  const block = await this.provider!.getBlock(log.blockNumber);
                  if (block?.timestamp) {
                    createdAt = block.timestamp * 1000; // Convert to milliseconds
                  }
                }
              } catch (e) {
                console.log("⚠️ Could not get block timestamp:", e);
              }

              const collectionInfo = await this.getCollectionInfo(collectionAddress, tokenType, createdAt);
              if (collectionInfo) {
                collections.push(collectionInfo);
              }
            }
          }
        } catch (error) {
          console.log("⚠️ Error parsing log:", error);
          continue;
        }
      }

    } catch (error) {
      console.error(`❌ Error querying ${tokenType} factory:`, error);
    }

    return collections;
  }

  /**
   * Get detailed info for a specific collection
   */
  async getCollectionInfo(address: string, tokenType: "ERC721" | "ERC1155", createdAt?: number): Promise<CollectionData | null> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    // Check cache first
    if (this.collectionCache.has(address)) {
      return this.collectionCache.get(address)!;
    }

    try {
      // First, try to determine if this is actually a valid contract
      const code = await this.provider.getCode(address);
      if (code === "0x") {
        console.log(`⚠️ No contract found at address ${address}`);
        return null;
      }

      // Create contract interface using the proper ABIs
      const contractABI = tokenType === "ERC721" ? ERC721Collection_ABI : ERC1155Collection_ABI;

      const contract = new ethers.Contract(address, contractABI, this.provider);

      // Get basic collection info with better error handling
      console.log(`🔍 Getting info for ${tokenType} collection at ${address}`);
      
      let name = "Unknown Collection";
      let symbol = "UNKNOWN";
      let description = "";
      let owner = "0x0000000000000000000000000000000000000000";
      let totalSupply = BigInt(0);

      // Try to get name
      try {
        name = await contract.name();
        if (!name || name.trim() === "") {
          name = `Collection ${address.slice(0, 8)}`;
          console.log(`⚠️ Empty name, using fallback: ${name}`);
        } else {
          console.log(`✅ Name: ${name}`);
        }
      } catch (e) {
        name = `Collection ${address.slice(0, 8)}`;
        console.log(`⚠️ Could not get name, using fallback: ${name}`, e);
      }

      // Try to get symbol
      try {
        symbol = await contract.symbol();
        if (!symbol || symbol.trim() === "") {
          symbol = `COL${address.slice(2, 6).toUpperCase()}`;
          console.log(`⚠️ Empty symbol, using fallback: ${symbol}`);
        } else {
          console.log(`✅ Symbol: ${symbol}`);
        }
      } catch (e) {
        symbol = `COL${address.slice(2, 6).toUpperCase()}`;
        console.log(`⚠️ Could not get symbol, using fallback: ${symbol}`, e);
      }

      // Try to get description
      try {
        description = await contract.getDescription();
        console.log(`✅ Description: ${description}`);
      } catch (e) {
        console.log(`⚠️ Could not get description:`, e);
      }

      // Try to get owner (might be different method names)
      try {
        owner = await contract.owner();
        console.log(`✅ Owner: ${owner}`);
      } catch (e) {
        try {
          // Some contracts use creator() instead of owner()
          owner = await contract.creator();
          console.log(`✅ Creator: ${owner}`);
        } catch (e2) {
          console.log(`⚠️ Could not get owner/creator:`, e2);
        }
      }

      // Get total supply using the correct function name
      try {
        totalSupply = await contract.getTotalMinted();
        console.log(`✅ Total Supply (getTotalMinted): ${totalSupply.toString()}`);
      } catch (e) {
        console.log(`⚠️ getTotalMinted() failed:`, e);
        // Fallback to other methods if needed
        try {
          totalSupply = await contract.totalSupply();
          console.log(`✅ Total Supply (totalSupply): ${totalSupply.toString()}`);
        } catch (e2) {
          console.log(`⚠️ Could not get total supply:`, e2);
          totalSupply = BigInt(0);
        }
      }

      // Get additional info if available
      let maxSupply = "0";
      let royaltyFee = "0";
      
      try {
        maxSupply = (await contract.getMaxSupply()).toString();
      } catch (e) {
        try {
          maxSupply = (await contract.maxSupply()).toString();
        } catch (e2) {
          // Method might not exist
          console.log(`⚠️ Could not get max supply:`, e2);
        }
      }

      try {
        royaltyFee = (await contract.getRoyaltyFee()).toString();
        console.log(`✅ Royalty Fee: ${royaltyFee}`);
      } catch (e) {
        try {
          const royaltyInfo = await contract.royaltyInfo(1, ethers.parseEther("1"));
          royaltyFee = ((Number(royaltyInfo[1]) / 10000) * 100).toString(); // Convert basis points to percentage
          console.log(`✅ Royalty Fee (royaltyInfo): ${royaltyFee}`);
        } catch (e2) {
          // Method might not exist
          console.log(`⚠️ Could not get royalty fee:`, e2);
        }
      }

      // Ensure we have valid name and symbol
      const finalName = name && name.trim() !== "" ? name : `Collection ${address.slice(0, 8)}`;
      const finalSymbol = symbol && symbol.trim() !== "" ? symbol : `COL${address.slice(2, 6).toUpperCase()}`;
      const finalDescription = description && description.trim() !== "" ? description : `A unique NFT collection deployed at ${address}`;

      // Create collection info with more complete data
      const collectionInfo: CollectionData = {
        address,
        name: finalName,
        symbol: finalSymbol,
        description: finalDescription,
        creator: owner,
        type: tokenType,
        totalSupply: totalSupply.toString(),
        maxSupply: maxSupply !== "0" ? maxSupply : undefined,
        royaltyFee: royaltyFee !== "0" ? royaltyFee : undefined,
        verified: false, // TODO: Implement verification system
        createdAt: createdAt || Date.now(),
        stats: {
          totalSupply: Number(totalSupply),
          totalOwners: Math.floor(Number(totalSupply) * 0.7), // Estimate 70% unique owners
          floorPrice: totalSupply > BigInt(0) ? "0.001" : "0", // Set a demo floor price
          totalVolume: totalSupply > BigInt(0) ? (Number(totalSupply) * 0.05).toFixed(3) : "0", // Estimate volume
          listed: Math.floor(Number(totalSupply) * 0.1) // Estimate 10% listed
        }
      };

      // Cache the result
      this.collectionCache.set(address, collectionInfo);
      
      console.log(`✅ Collection info loaded:`, {
        address,
        name,
        symbol,
        totalSupply: totalSupply.toString()
      });

      return collectionInfo;

    } catch (error) {
      console.error(`❌ Error getting collection info for ${address}:`, error);
      return null;
    }
  }

  /**
   * Extract address from log topic
   */
  private extractAddressFromTopic(topic: string): string | null {
    if (!topic || topic.length !== 66) {
      return null;
    }
    
    // Remove '0x' and take last 40 characters (20 bytes = 40 hex chars)
    const address = '0x' + topic.slice(26);
    return address;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.collectionCache.clear();
  }

  /**
   * Get collection by address (with caching)
   */
  async getCollection(address: string): Promise<CollectionData | null> {
    // First try to determine token type
    // This is a simplified approach - you might want to store this info
    try {
      // Try ERC721 first
      let collectionInfo = await this.getCollectionInfo(address, "ERC721");
      if (collectionInfo) {
        return collectionInfo;
      }

      // Try ERC1155
      collectionInfo = await this.getCollectionInfo(address, "ERC1155");
      return collectionInfo;

    } catch (error) {
      console.error(`❌ Error getting collection ${address}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const collectionQueryService = new CollectionQueryService();
