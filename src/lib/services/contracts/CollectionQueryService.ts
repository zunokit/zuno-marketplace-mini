/**
 * Collection Query Service
 * Query and fetch collection data from blockchain
 */

import { ethers } from "ethers";
import { userHubService } from "./UserHubService";
import { logger } from "@/lib/utils/logger";
import { listingHistoryTrackerService } from "./ListingHistoryTrackerService";
import { exchangeService } from "./ExchangeService";
import { getContractABI } from "@/lib/contracts/abi-manager";
import { DEAD_ADDRESS, ZERO_ADDRESS } from "@/lib/constants";

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
    logger.success("CollectionQueryService initialized", null, {
      component: "CollectionQueryService",
      action: "initialize",
    });
  }

  /**
   * Get all collections created through the marketplace
   */
  async getAllCollections(): Promise<CollectionData[]> {
    if (!this.provider) {
      throw new Error("Service not initialized");
    }

    try {
      // Get factory addresses from userHubService
      const addresses = await userHubService.getAddresses();
      const erc721Factory = addresses.erc721Factory;
      const erc1155Factory = addresses.erc1155Factory;

      logger.info(
        "Querying collections from factories",
        {
          erc721Factory,
          erc1155Factory,
        },
        { component: "CollectionQueryService", action: "getAllCollections" }
      );

      // Check if factories are deployed
      if (!erc721Factory || erc721Factory === ZERO_ADDRESS) {
        logger.warn("ERC721 Factory not deployed", null, {
          component: "CollectionQueryService",
          action: "getAllCollections",
        });
      }
      if (!erc1155Factory || erc1155Factory === ZERO_ADDRESS) {
        logger.warn("ERC1155 Factory not deployed", null, {
          component: "CollectionQueryService",
          action: "getAllCollections",
        });
      }

      const collections: CollectionData[] = [];

      // Query ERC721 collections
      if (erc721Factory && erc721Factory !== ZERO_ADDRESS) {
        const erc721Collections = await this.getCollectionsFromFactory(
          erc721Factory,
          "ERC721"
        );
        collections.push(...erc721Collections);
      }

      // Query ERC1155 collections
      if (erc1155Factory && erc1155Factory !== ZERO_ADDRESS) {
        const erc1155Collections = await this.getCollectionsFromFactory(
          erc1155Factory,
          "ERC1155"
        );
        collections.push(...erc1155Collections);
      }

      // Sort by creation date (newest first)
      collections.sort((a, b) => b.createdAt - a.createdAt);

      logger.success(
        `Found ${collections.length} collections`,
        {
          collections: collections.map((c) => ({
            address: c.address,
            name: c.name,
            symbol: c.symbol,
            totalSupply: c.totalSupply,
            hasValidData: !!(c.address && c.name),
          })),
        },
        { component: "CollectionQueryService", action: "getAllCollections" }
      );

      // Filter out invalid collections (but allow empty names - we'll fix them)
      const validCollections = collections.filter(
        (c) => c && c.address && c.address !== ZERO_ADDRESS
      );

      logger.info(
        `Valid collections: ${validCollections.length}`,
        {
          validCount: validCollections.length,
          totalCount: collections.length,
        },
        { component: "CollectionQueryService", action: "getAllCollections" }
      );
      return validCollections;
    } catch (error) {
      logger.error("Error fetching collections", error, {
        component: "CollectionQueryService",
        action: "getAllCollections",
      });
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
      logger.info(
        `Querying ${tokenType} collections from factory: ${factoryAddress}`,
        {
          tokenType,
          factoryAddress,
        },
        { component: "CollectionQueryService", action: "queryFactoryLogs" }
      );

      // Get recent blocks to search for collection creation events
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Search last 10k blocks

      // Query CollectionCreated events (assuming this event exists)
      const filter = {
        address: factoryAddress,
        fromBlock,
        toBlock: "latest",
      };

      const logs = await this.provider.getLogs(filter);
      logger.info(
        `Found ${logs.length} logs from ${tokenType} factory`,
        {
          logCount: logs.length,
          tokenType,
        },
        { component: "CollectionQueryService", action: "queryFactoryLogs" }
      );

      // Parse logs to extract collection addresses
      for (const log of logs) {
        try {
          // Try to extract collection address from log topics
          if (log.topics && log.topics.length > 1) {
            const collectionAddress = this.extractAddressFromTopic(
              log.topics[1]
            );

            if (collectionAddress && collectionAddress !== ZERO_ADDRESS) {
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
                logger.warn("Could not get block timestamp", e, {
                  component: "CollectionQueryService",
                  action: "queryFactoryLogs",
                });
              }

              try {
                const collectionInfo = await this.getCollectionInfo(
                  collectionAddress,
                  tokenType,
                  createdAt
                );
                if (collectionInfo) {
                  collections.push(collectionInfo);
                }
              } catch (infoError: any) {
                logger.error(
                  `Failed to get info for collection ${collectionAddress}`,
                  infoError,
                  {
                    component: "CollectionQueryService",
                    action: "queryFactoryLogs",
                    collectionAddress,
                  }
                );
                // Continue to next collection instead of stopping completely
                continue;
              }
            }
          }
        } catch (error) {
          logger.warn("Error parsing log", error, {
            component: "CollectionQueryService",
            action: "queryFactoryLogs",
          });
          continue;
        }
      }
    } catch (error) {
      logger.error(`Error querying ${tokenType} factory`, error, {
        component: "CollectionQueryService",
        action: "queryFactoryLogs",
        tokenType,
      });
    }

    return collections;
  }

  /**
   * Get detailed info for a specific collection
   */
  async getCollectionInfo(
    address: string,
    tokenType: "ERC721" | "ERC1155",
    createdAt?: number
  ): Promise<CollectionData | null> {
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
        logger.warn(`No contract found at address ${address}`, null, {
          component: "CollectionQueryService",
          action: "getCollectionInfo",
          address,
        });
        return null;
      }

      // Create contract interface using the proper ABIs
      const abiName =
        tokenType === "ERC721" ? "ERC721Collection" : "ERC1155Collection";
      const contractABI = await getContractABI(abiName);

      const contract = new ethers.Contract(address, contractABI, this.provider);

      // Get basic collection info with better error handling
      logger.info(
        `Getting info for ${tokenType} collection at ${address}`,
        {
          tokenType,
          address,
        },
        { component: "CollectionQueryService", action: "getCollectionInfo" }
      );

      let name = "Unknown Collection";
      let symbol = "UNKNOWN";
      let description = "";
      let owner = ZERO_ADDRESS;
      let totalSupply = BigInt(0);

      // Get name - required
      try {
        name = await contract.name();
        if (!name || name.trim() === "") {
          throw new Error(`Collection at ${address} has empty name`);
        }
        // Filter out implementation contracts
        if (
          name.toLowerCase() === "implementation" ||
          name.toLowerCase().includes("impl")
        ) {
          logger.warn(
            `Skipping implementation contract at ${address} with name: ${name}`,
            null,
            {
              component: "CollectionQueryService",
              action: "getCollectionInfo",
              address,
              name,
            }
          );
          return null;
        }
        logger.info(
          `Name: ${name}`,
          { name },
          { component: "CollectionQueryService", action: "getCollectionInfo" }
        );
      } catch (e) {
        logger.error(`Failed to get collection name for ${address}`, e, {
          component: "CollectionQueryService",
          action: "getCollectionInfo",
          address,
        });
        throw e; // Re-throw to see the actual error
      }

      // Get symbol - required
      try {
        symbol = await contract.symbol();
        if (!symbol || symbol.trim() === "") {
          throw new Error(`Collection at ${address} has empty symbol`);
        }
        logger.info(
          `Symbol: ${symbol}`,
          { symbol },
          { component: "CollectionQueryService", action: "getCollectionInfo" }
        );
      } catch (e) {
        logger.error(`Failed to get collection symbol for ${address}`, e, {
          component: "CollectionQueryService",
          action: "getCollectionInfo",
          address,
        });
        throw e; // Re-throw to see the actual error
      }

      // Try to get description
      try {
        description = await contract.getDescription();
        logger.info(
          `Description: ${description}`,
          { description },
          { component: "CollectionQueryService", action: "getCollectionInfo" }
        );
      } catch (e) {
        logger.warn(`Could not get description`, e, {
          component: "CollectionQueryService",
          action: "getCollectionInfo",
        });
      }

      // Try to get owner (might be different method names)
      try {
        owner = await contract.owner();
        logger.info(
          `Owner: ${owner}`,
          { owner },
          { component: "CollectionQueryService", action: "getCollectionInfo" }
        );
        // Filter out contracts with dead address as owner (typically implementation contracts)
        if (owner.toLowerCase() === DEAD_ADDRESS.toLowerCase()) {
          throw new Error(
            `Contract at ${address} has dead address as owner - likely an implementation contract`
          );
        }
      } catch (e: any) {
        // If owner() fails, try creator()
        if (e.message && !e.message.includes("dead address")) {
          try {
            owner = await contract.creator();
            logger.info(
              `Creator: ${owner}`,
              { owner },
              {
                component: "CollectionQueryService",
                action: "getCollectionInfo",
              }
            );
          } catch (e2) {
            logger.error(`Could not get owner/creator for ${address}`, e2, {
              component: "CollectionQueryService",
              action: "getCollectionInfo",
              address,
            });
            throw new Error(
              `Failed to get owner/creator for collection at ${address}`
            );
          }
        } else {
          throw e; // Re-throw if it's our dead address error
        }
      }

      // Get total supply using the correct function name
      try {
        totalSupply = await contract.getTotalMinted();
        logger.info(
          `Total Supply (getTotalMinted): ${totalSupply.toString()}`,
          { totalSupply: totalSupply.toString() },
          { component: "CollectionQueryService", action: "getCollectionInfo" }
        );
      } catch (e) {
        logger.warn(`getTotalMinted() failed`, e, {
          component: "CollectionQueryService",
          action: "getCollectionInfo",
        });
        // Fallback to other methods if needed
        try {
          totalSupply = await contract.totalSupply();
          logger.info(
            `Total Supply (totalSupply): ${totalSupply.toString()}`,
            { totalSupply: totalSupply.toString() },
            { component: "CollectionQueryService", action: "getCollectionInfo" }
          );
        } catch (e2) {
          logger.warn(`Could not get total supply`, e2, {
            component: "CollectionQueryService",
            action: "getCollectionInfo",
          });
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
          logger.warn(`Could not get max supply`, e2, {
            component: "CollectionQueryService",
            action: "getCollectionInfo",
          });
        }
      }

      try {
        royaltyFee = (await contract.getRoyaltyFee()).toString();
        logger.info(
          `Royalty Fee: ${royaltyFee}`,
          { royaltyFee },
          { component: "CollectionQueryService", action: "getCollectionInfo" }
        );
      } catch (e) {
        try {
          const royaltyInfo = await contract.royaltyInfo(
            1,
            ethers.parseEther("1")
          );
          royaltyFee = ((Number(royaltyInfo[1]) / 10000) * 100).toString(); // Convert basis points to percentage
          logger.info(
            `Royalty Fee (royaltyInfo): ${royaltyFee}`,
            { royaltyFee },
            { component: "CollectionQueryService", action: "getCollectionInfo" }
          );
        } catch (e2) {
          // Method might not exist
          logger.warn(`Could not get royalty fee`, e2, {
            component: "CollectionQueryService",
            action: "getCollectionInfo",
          });
        }
      }

      // Use actual values from contract - no fallbacks
      const finalName = name;
      const finalSymbol = symbol;
      const finalDescription = description || "";

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
          totalVolume:
            totalSupply > BigInt(0)
              ? (Number(totalSupply) * 0.05).toFixed(3)
              : "0", // Estimate volume
          listed: Math.floor(Number(totalSupply) * 0.1), // Estimate 10% listed
        },
      };

      // Cache the result
      this.collectionCache.set(address, collectionInfo);

      logger.success(
        `Collection info loaded`,
        {
          address,
          name,
          symbol,
          totalSupply: totalSupply.toString(),
        },
        { component: "CollectionQueryService", action: "getCollectionInfo" }
      );

      return collectionInfo;
    } catch (error: any) {
      logger.error(`Error getting collection info for ${address}`, error, {
        component: "CollectionQueryService",
        action: "getCollectionInfo",
        address,
        tokenType,
        errorMessage: error.message || "Unknown error",
        errorStack: error.stack,
      });

      // Re-throw error so we can see what's actually failing
      throw error;
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
    const address = "0x" + topic.slice(26);
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
      logger.error(`Error getting collection ${address}`, error, {
        component: "CollectionQueryService",
        action: "getCollection",
        address,
      });
      return null;
    }
  }
}

// Export singleton instance
export const collectionQueryService = new CollectionQueryService();
