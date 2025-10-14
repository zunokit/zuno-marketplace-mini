/**
 * NFT Metadata Service
 * Fetches and caches NFT metadata from IPFS and other sources
 * Handles both ERC721 and ERC1155 metadata standards
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";

// Standard NFT Metadata interface
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
    max_value?: number;
    trait_count?: number;
    rarity?: number;
  }>;
  properties?: Record<string, any>;
  background_color?: string;
}

// Collection metadata
export interface CollectionMetadata {
  name: string;
  description: string;
  image: string;
  banner_image?: string;
  external_link?: string;
  seller_fee_basis_points?: number;
  fee_recipient?: string;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const metadataCache = new Map<string, { data: any; timestamp: number }>();

export class NFTMetadataService {
  private provider: ethers.Provider | null = null;
  private ipfsGateways = [
    "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://gateway.ipfs.io/ipfs/"
  ];

  /**
   * Initialize service
   */
  async initialize(provider: ethers.Provider): Promise<void> {
    this.provider = provider;
    logger.info("NFTMetadataService initialized", null, {
      component: "NFTMetadataService",
      action: "initialize"
    });
  }

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(
    contractAddress: string,
    tokenId: string
  ): Promise<NFTMetadata | null> {
    const cacheKey = `${contractAddress}-${tokenId}`;
    
    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get tokenURI from contract
      const tokenURI = await this.getTokenURI(contractAddress, tokenId);
      if (!tokenURI) return null;

      // Fetch metadata from URI
      const metadata = await this.fetchMetadataFromURI(tokenURI);
      
      // Process and validate metadata
      const processed = this.processNFTMetadata(metadata);
      
      // Cache result
      this.setCache(cacheKey, processed);
      
      return processed;
    } catch (error) {
      logger.error("Failed to get NFT metadata", error, {
        component: "NFTMetadataService",
        action: "getNFTMetadata",
        contractAddress,
        tokenId
      });
      return null;
    }
  }

  /**
   * Get token URI from contract
   */
  private async getTokenURI(
    contractAddress: string,
    tokenId: string
  ): Promise<string | null> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    try {
      // ERC721 tokenURI interface
      const contract = new ethers.Contract(
        contractAddress,
        [
          "function tokenURI(uint256 tokenId) view returns (string)",
          "function uri(uint256 tokenId) view returns (string)" // ERC1155
        ],
        this.provider
      );

      // Try ERC721 tokenURI first
      try {
        const uri = await contract.tokenURI(tokenId);
        return this.resolveURI(uri);
      } catch {
        // Try ERC1155 uri
        try {
          const uri = await contract.uri(tokenId);
          // Replace {id} with actual tokenId for ERC1155
          return this.resolveURI(uri.replace("{id}", tokenId));
        } catch {
          logger.warn("No tokenURI found", null, {
            component: "NFTMetadataService",
            action: "getTokenURI",
            contractAddress,
            tokenId
          });
          return null;
        }
      }
    } catch (error) {
      logger.error("Failed to get tokenURI", error, {
        component: "NFTMetadataService",
        action: "getTokenURI"
      });
      return null;
    }
  }

  /**
   * Resolve URI (handle IPFS, HTTP, data URIs)
   */
  private resolveURI(uri: string): string {
    if (!uri) return "";

    // Handle IPFS URIs
    if (uri.startsWith("ipfs://")) {
      return uri.replace("ipfs://", this.ipfsGateways[0]);
    }

    // Handle IPFS hashes
    if (uri.startsWith("Qm") || uri.startsWith("ba")) {
      return `${this.ipfsGateways[0]}${uri}`;
    }

    // Handle ar:// (Arweave)
    if (uri.startsWith("ar://")) {
      return uri.replace("ar://", "https://arweave.net/");
    }

    // Return as-is for http/https/data URIs
    return uri;
  }

  /**
   * Fetch metadata from URI with fallback gateways
   */
  private async fetchMetadataFromURI(uri: string): Promise<any> {
    // Handle data URIs
    if (uri.startsWith("data:application/json")) {
      const base64 = uri.split(",")[1];
      return JSON.parse(atob(base64));
    }

    // Try each IPFS gateway if needed
    const gatewaysToTry = uri.includes("ipfs") ? this.ipfsGateways : [uri];
    
    for (const gateway of gatewaysToTry) {
      try {
        const finalURI = uri.includes("ipfs") 
          ? uri.replace(/https:\/\/[^\/]+\/ipfs\//, gateway)
          : uri;

        const response = await fetch(finalURI, {
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        // Try next gateway
        continue;
      }
    }

    throw new Error("Failed to fetch metadata from all gateways");
  }

  /**
   * Process and validate NFT metadata
   */
  private processNFTMetadata(raw: any): NFTMetadata {
    const metadata: NFTMetadata = {
      name: raw.name || "Unnamed NFT",
      description: raw.description || "",
      image: this.resolveURI(raw.image || ""),
      external_url: raw.external_url,
      animation_url: raw.animation_url ? this.resolveURI(raw.animation_url) : undefined,
      attributes: raw.attributes || [],
      properties: raw.properties,
      background_color: raw.background_color
    };

    // Process attributes for rarity if not provided
    if (metadata.attributes && metadata.attributes.length > 0) {
      metadata.attributes = metadata.attributes.map(attr => ({
        ...attr,
        value: String(attr.value) // Ensure value is string
      }));
    }

    return metadata;
  }

  /**
   * Get collection metadata
   */
  async getCollectionMetadata(
    contractAddress: string
  ): Promise<CollectionMetadata | null> {
    const cacheKey = `collection-${contractAddress}`;
    
    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const contract = new ethers.Contract(
        contractAddress,
        [
          "function contractURI() view returns (string)",
          "function name() view returns (string)",
          "function symbol() view returns (string)"
        ],
        this.provider!
      );

      // Get contract-level metadata
      let metadata: CollectionMetadata | null = null;

      try {
        const contractURI = await contract.contractURI();
        if (contractURI) {
          const uri = this.resolveURI(contractURI);
          const rawMetadata = await this.fetchMetadataFromURI(uri);
          metadata = this.processCollectionMetadata(rawMetadata);
        }
      } catch {
        // No contractURI, fallback to basic info
      }

      // Fallback to basic contract info if no metadata
      if (!metadata) {
        try {
          const [name, symbol] = await Promise.all([
            contract.name(),
            contract.symbol()
          ]);

          metadata = {
            name: name || "Unknown Collection",
            description: `${name} (${symbol})`,
            image: ""
          };
        } catch {
          return null;
        }
      }

      // Cache result
      this.setCache(cacheKey, metadata);
      
      return metadata;
    } catch (error) {
      logger.error("Failed to get collection metadata", error, {
        component: "NFTMetadataService",
        action: "getCollectionMetadata",
        contractAddress
      });
      return null;
    }
  }

  /**
   * Process collection metadata
   */
  private processCollectionMetadata(raw: any): CollectionMetadata {
    return {
      name: raw.name || "Unknown Collection",
      description: raw.description || "",
      image: this.resolveURI(raw.image || ""),
      banner_image: raw.banner_image ? this.resolveURI(raw.banner_image) : undefined,
      external_link: raw.external_link,
      seller_fee_basis_points: raw.seller_fee_basis_points,
      fee_recipient: raw.fee_recipient
    };
  }

  /**
   * Batch fetch NFT metadata
   */
  async batchGetNFTMetadata(
    items: Array<{ contractAddress: string; tokenId: string }>
  ): Promise<Map<string, NFTMetadata | null>> {
    const results = new Map<string, NFTMetadata | null>();
    
    // Process in parallel with concurrency limit
    const BATCH_SIZE = 10;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const promises = batch.map(item => 
        this.getNFTMetadata(item.contractAddress, item.tokenId)
          .then(metadata => ({
            key: `${item.contractAddress}-${item.tokenId}`,
            metadata
          }))
      );
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ key, metadata }) => {
        results.set(key, metadata);
      });
    }
    
    return results;
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = metadataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    metadataCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    metadataCache.clear();
  }

  /**
   * Get OpenSea-compatible metadata
   */
  formatForOpenSea(metadata: NFTMetadata): any {
    return {
      ...metadata,
      attributes: metadata.attributes?.map(attr => ({
        trait_type: attr.trait_type,
        value: attr.value,
        display_type: attr.display_type
      }))
    };
  }
}

// Export singleton instance
export const nftMetadataService = new NFTMetadataService();
