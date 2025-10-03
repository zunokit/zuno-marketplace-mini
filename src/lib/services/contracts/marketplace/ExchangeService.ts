import { BaseContractService } from '../core/BaseContractService'
import { NFT_EXCHANGE_ABI } from '@/lib/contracts/abis'
import { getContractAddress } from '@/lib/contracts/addresses'
import { ethers } from 'ethers'

export interface Listing {
  id: string
  seller: string
  tokenContract: string
  tokenId: string
  price: string
  currency: string
  active: boolean
}

export class ExchangeService extends BaseContractService {
  constructor(chainId: number = 31337) {
    const contractAddress = getContractAddress('ERC721_EXCHANGE', chainId)
    super(contractAddress, NFT_EXCHANGE_ABI)
  }

  /**
   * Create a new listing
   */
  async createListing(
    tokenContract: string,
    tokenId: string,
    price: string,
    currency: string = ethers.ZeroAddress
  ): Promise<ethers.ContractTransactionResponse> {
    const priceWei = ethers.parseEther(price)
    return await this.sendTransaction(
      'createListing',
      tokenContract,
      tokenId,
      priceWei,
      currency
    )
  }

  /**
   * Buy a listing
   */
  async buyListing(
    listingId: string,
    price: string
  ): Promise<ethers.ContractTransactionResponse> {
    const priceWei = ethers.parseEther(price)
    return await this.sendTransaction('buyListing', listingId, {
      value: priceWei,
    })
  }

  /**
   * Cancel a listing
   */
  async cancelListing(listingId: string): Promise<ethers.ContractTransactionResponse> {
    return await this.sendTransaction('cancelListing', listingId)
  }

  /**
   * Update listing price
   */
  async updateListingPrice(
    listingId: string,
    newPrice: string
  ): Promise<ethers.ContractTransactionResponse> {
    const priceWei = ethers.parseEther(newPrice)
    return await this.sendTransaction('updateListingPrice', listingId, priceWei)
  }

  /**
   * Get listing details
   */
  async getListing(listingId: string): Promise<Listing | null> {
    try {
      const result = await this.callMethod('getListing', listingId)
      if (!result || !result.active) return null

      return {
        id: listingId,
        seller: result.seller,
        tokenContract: result.tokenContract,
        tokenId: result.tokenId.toString(),
        price: ethers.formatEther(result.price),
        currency: result.currency,
        active: result.active,
      }
    } catch (error) {
      console.error('Error getting listing:', error)
      return null
    }
  }

  /**
   * Get active listings
   */
  async getActiveListings(): Promise<string[]> {
    try {
      return await this.callMethod('getActiveListings')
    } catch (error) {
      console.error('Error getting active listings:', error)
      return []
    }
  }

  /**
   * Get listings by user
   */
  async getListingsByUser(userAddress: string): Promise<string[]> {
    try {
      return await this.callMethod('getListingsByUser', userAddress)
    } catch (error) {
      console.error('Error getting user listings:', error)
      return []
    }
  }

  /**
   * Get multiple listings details
   */
  async getMultipleListings(listingIds: string[]): Promise<Listing[]> {
    const listings: Listing[] = []
    
    for (const id of listingIds) {
      const listing = await this.getListing(id)
      if (listing) {
        listings.push(listing)
      }
    }
    
    return listings
  }

  /**
   * Listen to listing events
   */
  onListingCreated(callback: (listingId: string, seller: string, tokenContract: string, tokenId: string, price: string) => void): void {
    this.addEventListener('ListingCreated', (listingId, seller, tokenContract, tokenId, price) => {
      callback(
        listingId.toString(),
        seller,
        tokenContract,
        tokenId.toString(),
        ethers.formatEther(price)
      )
    })
  }

  onListingSold(callback: (listingId: string, buyer: string, price: string) => void): void {
    this.addEventListener('ListingSold', (listingId, buyer, price) => {
      callback(
        listingId.toString(),
        buyer,
        ethers.formatEther(price)
      )
    })
  }

  onListingCancelled(callback: (listingId: string) => void): void {
    this.addEventListener('ListingCancelled', (listingId) => {
      callback(listingId.toString())
    })
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners(): void {
    this.removeAllListeners()
  }
}

// Singleton instance
export const exchangeService = new ExchangeService()