/**
 * useCollection Hook
 * React hook for NFT collection operations
 */

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/providers/WalletProvider';
import { collectionService } from '@/lib/services/contracts/CollectionService';
import { transactionService } from '@/lib/services/blockchain/TransactionService';
import { eventService } from '@/lib/services/blockchain/EventService';
import {
  TokenType,
  CreateCollectionParams,
  CollectionInfo,
  MintParams,
  MintInfo,
  CollectionError,
  MintError
} from '@/types';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

interface UseCollectionReturn {
  // State
  isLoading: boolean;
  error: string | null;
  transactionHash: string | null;
  
  // Collection operations
  createCollection: (params: Omit<CreateCollectionParams, 'owner'>) => Promise<string>;
  getCollectionInfo: (address: string, tokenType?: TokenType) => Promise<CollectionInfo | null>;
  
  // Minting operations
  mint: (params: MintParams) => Promise<string>;
  getMintInfo: (collection: string) => Promise<MintInfo | null>;
  
  // Approval operations
  setApprovalForAll: (collection: string, operator: string, approved: boolean) => Promise<string>;
  isApprovedForAll: (collection: string, owner: string, operator: string) => Promise<boolean>;
  
  // Utils
  clearError: () => void;
}

export function useCollection(): UseCollectionReturn {
  const { account, isConnected, provider, signer } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Initialize services when wallet connects
  useEffect(() => {
    if (provider && signer) {
      initializeServices();
    }
  }, [provider, signer]);

  const initializeServices = async () => {
    try {
      if (!provider || !signer) return;
      
      await collectionService.initialize(provider, signer);
      await transactionService.initialize(provider, signer);
      await eventService.initialize(provider);
      
      logger.info('Collection services initialized');
    } catch (err) {
      logger.error('Failed to initialize services', err);
    }
  };

  /**
   * Create a new NFT collection
   */
  const createCollection = useCallback(async (
    params: Omit<CreateCollectionParams, 'owner'>
  ): Promise<string> => {
    if (!isConnected || !account) {
      const message = 'Please connect your wallet';
      setError(message);
      toast.error(message);
      throw new CollectionError(message, 'NO_WALLET');
    }

    setIsLoading(true);
    setError(null);
    setTransactionHash(null);

    try {
      toast.loading('Creating collection...');
      
      const collectionAddress = await collectionService.createCollection({
        ...params,
        owner: account
      });

      toast.success('Collection created successfully!', {
        description: `Address: ${collectionAddress}`
      });

      return collectionAddress;
      
    } catch (err: any) {
      const message = err.message || 'Failed to create collection';
      setError(message);
      toast.error(message);
      logger.error('Collection creation failed', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, account]);

  /**
   * Get collection information
   */
  const getCollectionInfo = useCallback(async (
    address: string,
    tokenType: TokenType = TokenType.ERC721
  ): Promise<CollectionInfo | null> => {
    try {
      const info = await collectionService.getCollectionInfo(address, tokenType);
      return info;
    } catch (err: any) {
      logger.error('Failed to get collection info', err);
      return null;
    }
  }, []);

  /**
   * Mint NFTs from a collection
   */
  const mint = useCallback(async (params: MintParams): Promise<string> => {
    if (!isConnected || !account) {
      const message = 'Please connect your wallet';
      setError(message);
      toast.error(message);
      throw new MintError(message, 'NO_WALLET');
    }

    setIsLoading(true);
    setError(null);
    setTransactionHash(null);

    try {
      // Show loading toast
      const toastId = toast.loading(
        `Minting ${params.quantity || 1} NFT${(params.quantity || 1) > 1 ? 's' : ''}...`
      );

      // Mint NFTs
      const txHash = await collectionService.mint({
        ...params,
        to: params.to || account
      });

      setTransactionHash(txHash);

      // Update toast
      toast.success('NFT(s) minted successfully!', {
        id: toastId,
        description: `Transaction: ${txHash.slice(0, 10)}...`
      });

      return txHash;
      
    } catch (err: any) {
      const message = err.message || 'Failed to mint NFT';
      setError(message);
      
      // Show appropriate error message
      if (err.code === 'MINT_LIMIT_EXCEEDED') {
        toast.error('Mint limit exceeded', {
          description: 'You have reached the maximum mint limit for this wallet'
        });
      } else if (err.code === 'MAX_SUPPLY_REACHED') {
        toast.error('Collection sold out', {
          description: 'This collection has reached its maximum supply'
        });
      } else if (err.code === 'INSUFFICIENT_PAYMENT') {
        toast.error('Insufficient payment', {
          description: 'Please send the correct amount of ETH'
        });
      } else if (err.code === 'NOT_IN_ALLOWLIST') {
        toast.error('Not in allowlist', {
          description: 'Your address is not in the allowlist for this collection'
        });
      } else if (err.code === 'USER_REJECTED') {
        toast.error('Transaction cancelled');
      } else {
        toast.error(message);
      }
      
      logger.error('Minting failed', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, account]);

  /**
   * Get mint information for a collection
   */
  const getMintInfo = useCallback(async (
    collection: string
  ): Promise<MintInfo | null> => {
    if (!account) return null;

    try {
      // Detect token type first
      const tokenType = await collectionService['detectTokenType'](collection);
      const info = await collectionService.getMintInfo(collection, account, tokenType);
      return info;
    } catch (err: any) {
      logger.error('Failed to get mint info', err);
      return null;
    }
  }, [account]);

  /**
   * Set approval for marketplace or other operators
   */
  const setApprovalForAll = useCallback(async (
    collection: string,
    operator: string,
    approved: boolean
  ): Promise<string> => {
    if (!isConnected || !account) {
      const message = 'Please connect your wallet';
      setError(message);
      toast.error(message);
      throw new CollectionError(message, 'NO_WALLET');
    }

    setIsLoading(true);
    setError(null);

    try {
      const toastId = toast.loading(
        approved ? 'Approving collection...' : 'Revoking approval...'
      );

      const txHash = await collectionService.setApprovalForAll(
        collection,
        operator,
        approved
      );

      toast.success(
        approved ? 'Collection approved' : 'Approval revoked',
        {
          id: toastId,
          description: `Transaction: ${txHash.slice(0, 10)}...`
        }
      );

      return txHash;
      
    } catch (err: any) {
      const message = err.message || 'Failed to set approval';
      setError(message);
      toast.error(message);
      logger.error('Approval failed', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, account]);

  /**
   * Check if operator is approved
   */
  const isApprovedForAll = useCallback(async (
    collection: string,
    owner: string,
    operator: string
  ): Promise<boolean> => {
    try {
      return await collectionService.isApprovedForAll(collection, owner, operator);
    } catch (err) {
      logger.error('Failed to check approval', err);
      return false;
    }
  }, []);

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
    
    // Approval operations
    setApprovalForAll,
    isApprovedForAll,
    
    // Utils
    clearError
  };
}
