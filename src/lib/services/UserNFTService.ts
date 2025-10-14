/**
 * User NFT Service
 * Queries user's NFT holdings from blockchain
 * Supports both ERC721 and ERC1155 tokens
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";

export interface UserNFT {
  contractAddress: string;
  tokenId: string;
  tokenType: "ERC721" | "ERC1155";
  balance: bigint;
  owner: string;
  tokenURI?: string;
}

// Common ERC165 interface IDs
const ERC721_INTERFACE_ID = "0x80ac58cd";
const ERC1155_INTERFACE_ID = "0xd9b67a26";

export class UserNFTService {
  private provider: ethers.Provider | null = null;

  /**
   * Initialize service
   */
  async initialize(provider: ethers.Provider): Promise<void> {
    this.provider = provider;
    logger.info("UserNFTService initialized", null, {
      component: "UserNFTService",
      action: "initialize"
    });
  }

  /**
   * Get all NFTs owned by a user
   */
  async getUserNFTs(
    userAddress: string,
    collections?: string[]
  ): Promise<UserNFT[]> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    const userNFTs: UserNFT[] = [];

    try {
      // If specific collections provided, query those
      if (collections && collections.length > 0) {
        for (const collection of collections) {
          const nfts = await this.getNFTsFromCollection(userAddress, collection);
          userNFTs.push(...nfts);
        }
      } else {
        // Query from known collections or use event logs
        const nfts = await this.discoverUserNFTs(userAddress);
        userNFTs.push(...nfts);
      }

      logger.info(`Found ${userNFTs.length} NFTs for user`, { userAddress }, {
        component: "UserNFTService",
        action: "getUserNFTs"
      });

      return userNFTs;
    } catch (error) {
      logger.error("Failed to get user NFTs", error, {
        component: "UserNFTService",
        action: "getUserNFTs"
      });
      return [];
    }
  }

  /**
   * Get NFTs from a specific collection
   */
  private async getNFTsFromCollection(
    userAddress: string,
    collectionAddress: string
  ): Promise<UserNFT[]> {
    const tokenType = await this.detectTokenType(collectionAddress);
    
    if (tokenType === "ERC721") {
      return await this.getERC721Tokens(userAddress, collectionAddress);
    } else if (tokenType === "ERC1155") {
      return await this.getERC1155Tokens(userAddress, collectionAddress);
    }
    
    return [];
  }

  /**
   * Detect token type using ERC165
   */
  private async detectTokenType(
    contractAddress: string
  ): Promise<"ERC721" | "ERC1155" | null> {
    if (!this.provider) return null;

    try {
      const contract = new ethers.Contract(
        contractAddress,
        [
          "function supportsInterface(bytes4 interfaceId) view returns (bool)"
        ],
        this.provider
      );

      const [isERC721, isERC1155] = await Promise.all([
        contract.supportsInterface(ERC721_INTERFACE_ID),
        contract.supportsInterface(ERC1155_INTERFACE_ID)
      ]);

      if (isERC721) return "ERC721";
      if (isERC1155) return "ERC1155";
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get ERC721 tokens owned by user
   */
  private async getERC721Tokens(
    userAddress: string,
    contractAddress: string
  ): Promise<UserNFT[]> {
    if (!this.provider) return [];

    try {
      const contract = new ethers.Contract(
        contractAddress,
        [
          "function balanceOf(address owner) view returns (uint256)",
          "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
          "function tokenURI(uint256 tokenId) view returns (string)",
          "function totalSupply() view returns (uint256)"
        ],
        this.provider
      );

      const balance = await contract.balanceOf(userAddress);
      const nfts: UserNFT[] = [];

      // Try enumerable interface first
      try {
        for (let i = 0; i < balance; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          const tokenURI = await contract.tokenURI(tokenId).catch(() => "");
          
          nfts.push({
            contractAddress,
            tokenId: tokenId.toString(),
            tokenType: "ERC721",
            balance: 1n,
            owner: userAddress,
            tokenURI
          });
        }
      } catch {
        // Fallback to event logs if not enumerable
        const transferFilter = contract.filters.Transfer(null, userAddress);
        const transferEvents = await contract.queryFilter(transferFilter);
        
        for (const event of transferEvents) {
          if ((event as any).args) {
            const tokenId = (event as any).args[2];
            // Check current owner
            try {
              const currentOwner = await contract.ownerOf(tokenId);
              if (currentOwner.toLowerCase() === userAddress.toLowerCase()) {
                const tokenURI = await contract.tokenURI(tokenId).catch(() => "");
                nfts.push({
                  contractAddress,
                  tokenId: tokenId.toString(),
                  tokenType: "ERC721",
                  balance: 1n,
                  owner: userAddress,
                  tokenURI
                });
              }
            } catch {
              // Token might be burned or transferred
            }
          }
        }
      }

      return nfts;
    } catch (error) {
      logger.error("Failed to get ERC721 tokens", error, {
        component: "UserNFTService",
        action: "getERC721Tokens"
      });
      return [];
    }
  }

  /**
   * Get ERC1155 tokens owned by user
   */
  private async getERC1155Tokens(
    userAddress: string,
    contractAddress: string
  ): Promise<UserNFT[]> {
    if (!this.provider) return [];

    try {
      const contract = new ethers.Contract(
        contractAddress,
        [
          "function balanceOf(address account, uint256 id) view returns (uint256)",
          "function uri(uint256 id) view returns (string)"
        ],
        this.provider
      );

      const nfts: UserNFT[] = [];

      // Use TransferSingle and TransferBatch events to find token IDs
      const singleFilter = contract.filters.TransferSingle(null, null, userAddress);
      const batchFilter = contract.filters.TransferBatch(null, null, userAddress);
      
      const [singleEvents, batchEvents] = await Promise.all([
        contract.queryFilter(singleFilter),
        contract.queryFilter(batchFilter)
      ]);

      const tokenIds = new Set<string>();

      // Process single transfers
      for (const event of singleEvents) {
        if ((event as any).args) {
          tokenIds.add((event as any).args[3].toString()); // id
        }
      }

      // Process batch transfers
      for (const event of batchEvents) {
        if ((event as any).args) {
          const ids = (event as any).args[3]; // ids array
          for (const id of ids) {
            tokenIds.add(id.toString());
          }
        }
      }

      // Check balance for each token ID
      for (const tokenId of tokenIds) {
        const balance = await contract.balanceOf(userAddress, tokenId);
        if (balance > 0) {
          const uri = await contract.uri(tokenId).catch(() => "");
          nfts.push({
            contractAddress,
            tokenId,
            tokenType: "ERC1155",
            balance,
            owner: userAddress,
            tokenURI: uri
          });
        }
      }

      return nfts;
    } catch (error) {
      logger.error("Failed to get ERC1155 tokens", error, {
        component: "UserNFTService",
        action: "getERC1155Tokens"
      });
      return [];
    }
  }

  /**
   * Discover user NFTs using Transfer events
   */
  private async discoverUserNFTs(userAddress: string): Promise<UserNFT[]> {
    if (!this.provider) return [];

    try {
      // Get recent blocks
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last 10k blocks

      // Query Transfer events TO the user
      const filter = {
        topics: [
          ethers.id("Transfer(address,address,uint256)"),
          null,
          ethers.zeroPadValue(userAddress, 32)
        ],
        fromBlock,
        toBlock: currentBlock
      };

      const logs = await this.provider.getLogs(filter);
      const collections = new Set<string>();

      for (const log of logs) {
        collections.add(log.address);
      }

      const allNFTs: UserNFT[] = [];

      // Query each discovered collection
      for (const collection of collections) {
        const nfts = await this.getNFTsFromCollection(userAddress, collection);
        allNFTs.push(...nfts);
      }

      return allNFTs;
    } catch (error) {
      logger.error("Failed to discover user NFTs", error, {
        component: "UserNFTService",
        action: "discoverUserNFTs"
      });
      return [];
    }
  }

  /**
   * Check if user owns a specific NFT
   */
  async checkNFTOwnership(
    userAddress: string,
    contractAddress: string,
    tokenId: string
  ): Promise<boolean> {
    if (!this.provider) return false;

    try {
      const tokenType = await this.detectTokenType(contractAddress);

      if (tokenType === "ERC721") {
        const contract = new ethers.Contract(
          contractAddress,
          ["function ownerOf(uint256 tokenId) view returns (address)"],
          this.provider
        );
        const owner = await contract.ownerOf(tokenId);
        return owner.toLowerCase() === userAddress.toLowerCase();
      } else if (tokenType === "ERC1155") {
        const contract = new ethers.Contract(
          contractAddress,
          ["function balanceOf(address account, uint256 id) view returns (uint256)"],
          this.provider
        );
        const balance = await contract.balanceOf(userAddress, tokenId);
        return balance > 0;
      }

      return false;
    } catch (error) {
      logger.error("Failed to check NFT ownership", error, {
        component: "UserNFTService",
        action: "checkNFTOwnership"
      });
      return false;
    }
  }

  /**
   * Get NFT approval status
   */
  async getApprovalStatus(
    userAddress: string,
    contractAddress: string,
    spenderAddress: string,
    tokenId?: string
  ): Promise<boolean> {
    if (!this.provider) return false;

    try {
      const tokenType = await this.detectTokenType(contractAddress);

      if (tokenType === "ERC721") {
        const contract = new ethers.Contract(
          contractAddress,
          [
            "function getApproved(uint256 tokenId) view returns (address)",
            "function isApprovedForAll(address owner, address operator) view returns (bool)"
          ],
          this.provider
        );

        // Check both specific approval and operator approval
        const [isApprovedForAll, specificApproval] = await Promise.all([
          contract.isApprovedForAll(userAddress, spenderAddress),
          tokenId ? contract.getApproved(tokenId) : Promise.resolve(ethers.ZeroAddress)
        ]);

        return isApprovedForAll || specificApproval.toLowerCase() === spenderAddress.toLowerCase();
      } else if (tokenType === "ERC1155") {
        const contract = new ethers.Contract(
          contractAddress,
          ["function isApprovedForAll(address account, address operator) view returns (bool)"],
          this.provider
        );
        return await contract.isApprovedForAll(userAddress, spenderAddress);
      }

      return false;
    } catch (error) {
      logger.error("Failed to get approval status", error, {
        component: "UserNFTService",
        action: "getApprovalStatus"
      });
      return false;
    }
  }
}

// Export singleton instance
export const userNFTService = new UserNFTService();
