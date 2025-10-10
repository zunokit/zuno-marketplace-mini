/**
 * useCollection Hook
 * React hook for NFT collection operations
 */

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/providers/WalletProvider";
import { marketplaceHubService } from "@/lib/services/contracts/MarketplaceHubService";
import { collectionService } from "@/lib/services/contracts/CollectionService";
import { transactionService } from "@/lib/services/blockchain/TransactionService";
import { eventService } from "@/lib/services/blockchain/EventService";
import {
  TokenType,
  CreateCollectionParams,
  CollectionInfo,
  MintParams,
  MintInfo,
  MintStage,
  CollectionError,
  MintError,
} from "@/types";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";

interface UseCollectionReturn {
  // State
  isLoading: boolean;
  error: string | null;
  transactionHash: string | null;

  // Collection operations
  createCollection: (
    params: Omit<CreateCollectionParams, "owner">
  ) => Promise<string>;
  getCollectionInfo: (
    address: string,
    tokenType?: TokenType
  ) => Promise<CollectionInfo | null>;

  // Minting operations
  mint: (params: MintParams) => Promise<string>;
  getMintInfo: (collection: string) => Promise<MintInfo | null>;
  updateMintStage: (
    collection: string,
    tokenType?: TokenType
  ) => Promise<string>;

  // Approval operations
  setApprovalForAll: (
    collection: string,
    operator: string,
    approved: boolean
  ) => Promise<string>;
  isApprovedForAll: (
    collection: string,
    owner: string,
    operator: string
  ) => Promise<boolean>;

  // Utils
  clearError: () => void;
}

export function useCollection(): UseCollectionReturn {
  const { account, isConnected, provider, signer } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [servicesInitialized, setServicesInitialized] = useState(false);

  // Initialize services when wallet connects
  useEffect(() => {
    if (provider && signer) {
      initializeServices();
    } else {
      // Reset initialization state when wallet disconnects
      setServicesInitialized(false);
    }
  }, [provider, signer]);

  const initializeServices = async () => {
    try {
      if (!provider || !signer) return;

      // Skip if already initialized with same provider/signer
      if (servicesInitialized) return;

      // Initialize MarketplaceHub first (required for all other services)
      await marketplaceHubService.initialize(provider, signer);
      
      // Then initialize dependent services
      await collectionService.initialize(provider, signer);
      await transactionService.initialize(provider, signer);
      await eventService.initialize(provider);

      setServicesInitialized(true);
      logger.info("Collection services initialized");
    } catch (err) {
      logger.error("Failed to initialize services", err);
      // Don't throw - allow app to run in limited mode
      toast.error("Contract services initialization failed. Some features may be unavailable.");
    }
  };

  /**
   * Create a new NFT collection
   */
  const createCollection = useCallback(
    async (params: CreateCollectionParams): Promise<string> => {
      if (!isConnected || !account) {
        const message = "Please connect your wallet";
        setError(message);
        toast.error(message);
        throw new CollectionError(message, "NO_WALLET");
      }

      setIsLoading(true);
      setError(null);
      setTransactionHash(null);

      try {
        toast.loading("Creating collection...");

        // Ensure mintStartTime is a string for the service
        const serviceParams = {
          ...params,
          mintStartTime: params.mintStartTime?.toString()
        };

        const collectionAddress = await collectionService.createCollection(
          serviceParams
        );

        toast.success("Collection created successfully!", {
          description: `Address: ${collectionAddress}`,
        });

        return collectionAddress;
      } catch (err: any) {
        const message = err.message || "Failed to create collection";
        setError(message);
        toast.error(message);
        logger.error("Collection creation failed", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, account]
  );

  /**
   * Get collection information
   */
  const getCollectionInfo = useCallback(
    async (
      address: string,
      tokenType: TokenType = TokenType.ERC721
    ): Promise<CollectionInfo | null> => {
      try {
        // Wait for services to be initialized if not ready
        if (!provider || !signer) {
          logger.warn("Provider not ready, skipping collection info fetch");
          return null;
        }

        // Ensure services are initialized
        await initializeServices();

        const rawInfo = await collectionService.getCollectionInfo(
          address,
          tokenType
        );
        
        if (!rawInfo) return null;
        
        // Transform the raw info to match the expected CollectionInfo type
        const info: CollectionInfo = {
          address: rawInfo.address,
          tokenType: tokenType,
          metadata: {
            name: rawInfo.name || "",
            symbol: rawInfo.symbol || "",
            description: "",
            image: "",
            banner: "",
            website: "",
            twitter: "",
            discord: "",
            category: ""
          },
          config: {
            mintPrice: rawInfo.mintPrice ? ethers.parseEther(rawInfo.mintPrice) : BigInt(0),
            royaltyFee: 0,
            maxSupply: rawInfo.maxSupply ? BigInt(rawInfo.maxSupply) : BigInt(0),
            mintLimitPerWallet: BigInt(0),
            baseTokenURI: rawInfo.baseURI || "",
            revealed: true
          },
          stats: {
            totalMinted: rawInfo.totalSupply ? BigInt(rawInfo.totalSupply) : BigInt(0),
            maxSupply: rawInfo.maxSupply ? BigInt(rawInfo.maxSupply) : BigInt(0),
            owners: 0,
            floorPrice: undefined,
            volume24h: undefined,
            volumeTotal: undefined
          }
        };
        
        // Get additional mint info if account is connected
        if (account) {
          try {
            const mintInfo = await collectionService.getMintInfo(address, account, tokenType);
            if (mintInfo) {
              info.mintInfo = {
                currentStage: mintInfo.mintStage === "allowlist" ? MintStage.ALLOWLIST : 
                             mintInfo.mintStage === "public" ? MintStage.PUBLIC : MintStage.INACTIVE,
                // currentMintPrice is already in wei from CollectionService
                currentPrice: BigInt(mintInfo.currentMintPrice || "0"),
                isAllowlisted: mintInfo.isAllowlisted,
                mintedPerWallet: BigInt(mintInfo.mintedPerWallet || 0),
                mintLimitPerWallet: BigInt(mintInfo.mintLimitPerWallet || 0),
                canMint: mintInfo.canMint,
                remainingSupply: BigInt(mintInfo.maxSupply || 0) - BigInt(mintInfo.totalMinted || 0)
              };
            }
          } catch (err) {
            logger.warn("Failed to get mint info", err);
          }
        }
        
        return info;
      } catch (err: any) {
        logger.error("Failed to get collection info", err);
        return null;
      }
    },
    [provider, signer, account]
  );

  /**
   * Mint NFTs from a collection
   */
  const mint = useCallback(
    async (params: MintParams): Promise<string> => {
      if (!isConnected || !account) {
        const message = "Please connect your wallet";
        setError(message);
        toast.error(message);
        throw new MintError(message, "NO_WALLET");
      }

      setIsLoading(true);
      setError(null);
      setTransactionHash(null);

      try {
        // Show loading toast
        const toastId = toast.loading(
          `Minting ${params.quantity || 1} NFT${
            (params.quantity || 1) > 1 ? "s" : ""
          }...`
        );

        // Detect token type first
        const tokenType = params.tokenIds && params.tokenIds.length > 0 ? "ERC1155" : "ERC721";
        
        // Mint NFTs
        const txResponse = await collectionService.mint({
          ...params,
          to: params.to || account,
          tokenType: tokenType,
          amount: params.quantity?.toString() || "1"
        });

        const txHash = typeof txResponse === 'string' ? txResponse : txResponse.hash;
        setTransactionHash(txHash);

        // Update toast
        toast.success("NFT(s) minted successfully!", {
          id: toastId,
          description: `Transaction: ${typeof txHash === 'string' ? txHash.slice(0, 10) : 'Pending'}...`,
        });

        return txHash || '';
      } catch (err: any) {
        const message = err.message || "Failed to mint NFT";
        setError(message);

        // Show appropriate error message
        if (err.code === "MINT_LIMIT_EXCEEDED") {
          toast.error("Mint limit exceeded", {
            description:
              "You have reached the maximum mint limit for this wallet",
          });
        } else if (err.code === "MAX_SUPPLY_REACHED") {
          toast.error("Collection sold out", {
            description: "This collection has reached its maximum supply",
          });
        } else if (err.code === "INSUFFICIENT_PAYMENT") {
          toast.error("Insufficient payment", {
            description: "Please send the correct amount of ETH",
          });
        } else if (err.code === "NOT_IN_ALLOWLIST") {
          toast.error("Not in allowlist", {
            description:
              "Your address is not in the allowlist for this collection",
          });
        } else if (err.code === "USER_REJECTED") {
          toast.error("Transaction cancelled");
        } else {
          toast.error(message);
        }

        logger.error("Minting failed", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, account]
  );

  /**
   * Get mint information for a collection
   */
  const getMintInfo = useCallback(
    async (collection: string): Promise<MintInfo | null> => {
      if (!account) return null;

      try {
        // Try both token types to detect which one it is
        let tokenType: "ERC721" | "ERC1155" = "ERC721";
        let rawMintInfo;
        
        try {
          rawMintInfo = await collectionService.getMintInfo(collection, account, "ERC721");
          tokenType = "ERC721";
        } catch {
          try {
            rawMintInfo = await collectionService.getMintInfo(collection, account, "ERC1155");
            tokenType = "ERC1155";
          } catch {
            return null;
          }
        }
        
        if (!rawMintInfo) return null;
        
        // Transform to MintInfo type
        // Map mint stages correctly
        let currentStage = MintStage.INACTIVE;
        if (rawMintInfo.mintStage === "public") {
          currentStage = MintStage.PUBLIC;
        } else if (rawMintInfo.mintStage === "allowlist") {
          currentStage = MintStage.ALLOWLIST;
        }
        // If stage is "not_started" or "unknown", it remains INACTIVE
        
        const info: MintInfo = {
          currentStage,
          currentPrice: ethers.parseEther(rawMintInfo.currentMintPrice || "0"),
          isAllowlisted: rawMintInfo.isAllowlisted,
          mintedPerWallet: BigInt(rawMintInfo.mintedPerWallet || 0),
          mintLimitPerWallet: BigInt(rawMintInfo.mintLimitPerWallet || 0),
          canMint: rawMintInfo.canMint,
          remainingSupply: BigInt(rawMintInfo.maxSupply || 0) - BigInt(rawMintInfo.totalMinted || 0)
        };
        
        return info;
      } catch (err: any) {
        logger.error("Failed to get mint info", err);
        return null;
      }
    },
    [account]
  );

  /**
   * Set approval for marketplace or other operators
   */
  const setApprovalForAll = useCallback(
    async (
      collection: string,
      operator: string,
      approved: boolean
    ): Promise<string> => {
      if (!isConnected || !account) {
        const message = "Please connect your wallet";
        setError(message);
        toast.error(message);
        throw new CollectionError(message, "NO_WALLET");
      }

      setIsLoading(true);
      setError(null);

      try {
        const toastId = toast.loading(
          approved ? "Approving collection..." : "Revoking approval..."
        );

        // Try both token types to detect which one it is
        let tokenType: "ERC721" | "ERC1155" = "ERC721";
        try {
          // Try ERC721 first
          await collectionService.getCollectionInfo(collection, "ERC721");
        } catch {
          tokenType = "ERC1155";
        }

        const txResponse = await collectionService.setApprovalForAll(
          collection,
          operator,
          approved,
          tokenType
        );

        const txHash = typeof txResponse === 'string' ? txResponse : (txResponse.hash || '');

        toast.success(approved ? "Collection approved" : "Approval revoked", {
          id: toastId,
          description: `Transaction: ${txHash ? txHash.slice(0, 10) : 'Pending'}...`,
        });

        return txHash || '';
      } catch (err: any) {
        const message = err.message || "Failed to set approval";
        setError(message);
        toast.error(message);
        logger.error("Approval failed", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, account]
  );

  /**
   * Update mint stage for a collection (owner only)
   */
  const updateMintStage = useCallback(
    async (
      collection: string,
      tokenType: TokenType = TokenType.ERC721
    ): Promise<string> => {
      if (!isConnected || !account) {
        const message = "Please connect your wallet";
        setError(message);
        toast.error(message);
        throw new CollectionError(message, "NO_WALLET");
      }

      setIsLoading(true);
      setError(null);

      try {
        const toastId = toast.loading("Updating mint stage...");

        const txResponse = await collectionService.updateMintStage(
          collection,
          tokenType === TokenType.ERC721 ? "ERC721" : "ERC1155"
        );

        const txHash = typeof txResponse === 'string' ? txResponse : (txResponse.hash || '');

        toast.success("Mint stage updated successfully!", {
          id: toastId,
          description: `Transaction: ${txHash ? txHash.slice(0, 10) : 'Pending'}...`,
        });

        return txHash || '';
      } catch (err: any) {
        const message = err.message || "Failed to update mint stage";
        setError(message);
        toast.error(message);
        logger.error("Mint stage update failed", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, account]
  );

  /**
   * Check if operator is approved
   */
  const isApprovedForAll = useCallback(
    async (
      collection: string,
      owner: string,
      operator: string
    ): Promise<boolean> => {
      try {
        // Try both token types to detect which one it is
        let tokenType: "ERC721" | "ERC1155" = "ERC721";
        try {
          await collectionService.getCollectionInfo(collection, "ERC721");
        } catch {
          tokenType = "ERC1155";
        }
        
        return await collectionService.isApprovedForAll(
          collection,
          owner,
          operator,
          tokenType
        );
      } catch (err) {
        logger.error("Failed to check approval", err);
        return false;
      }
    },
    []
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    transactionHash,

    // Collection operations
    createCollection,
    getCollectionInfo,

    // Minting operations
    mint,
    getMintInfo,
    updateMintStage,

    // Approval operations
    setApprovalForAll,
    isApprovedForAll,

    // Utils
    clearError,
  };
}
