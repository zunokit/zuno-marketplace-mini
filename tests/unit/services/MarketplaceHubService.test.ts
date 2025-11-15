/**
 * Tests for MarketplaceHubService
 */

import { MarketplaceHubService } from '@/lib/services/contracts/MarketplaceHubService'
import {
  createMockProvider,
  createMockSigner,
  MOCK_MARKETPLACE_ADDRESSES,
} from '../../setup/mock-ethers'
import { ZERO_ADDRESS } from '@/lib/constants'

// Mock dependencies
jest.mock('@/lib/config/networks', () => ({
  getHubAddress: jest.fn(),
}))
jest.mock('@/lib/utils/logger')
jest.mock('@/lib/utils/env-config')

import { getHubAddress } from '@/lib/config/networks'

describe('MarketplaceHubService', () => {
  let service: MarketplaceHubService
  let mockProvider: ReturnType<typeof createMockProvider>
  let mockSigner: ReturnType<typeof createMockSigner>

  beforeEach(() => {
    service = new MarketplaceHubService()
    mockProvider = createMockProvider()
    mockSigner = createMockSigner(mockProvider)
    jest.clearAllMocks()
  })

  describe('initialize()', () => {
    it('should throw error when hub address not configured', async () => {
      ;(getHubAddress as jest.Mock).mockReturnValue(ZERO_ADDRESS)

      await expect(service.initialize(mockProvider as any)).rejects.toThrow(
        'MarketplaceHub not configured'
      )
    })

    it('should throw error when no contract at hub address', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)
      mockProvider.getCode.mockResolvedValue('0x')

      await expect(service.initialize(mockProvider as any)).rejects.toThrow(
        'No contract deployed at MarketplaceHub address'
      )
    })

    it('should initialize successfully with provider only', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)
      mockProvider.getCode.mockResolvedValue('0x123456') // Contract exists

      // Mock getAllAddresses call
      const mockHub = {
        getAddress: jest.fn().mockResolvedValue(hubAddress),
        getAllAddresses: jest.fn().mockResolvedValue([
          MOCK_MARKETPLACE_ADDRESSES.erc721Exchange,
          MOCK_MARKETPLACE_ADDRESSES.erc1155Exchange,
          MOCK_MARKETPLACE_ADDRESSES.erc721Factory,
          MOCK_MARKETPLACE_ADDRESSES.erc1155Factory,
          MOCK_MARKETPLACE_ADDRESSES.englishAuction,
          MOCK_MARKETPLACE_ADDRESSES.dutchAuction,
          MOCK_MARKETPLACE_ADDRESSES.auctionFactory,
          MOCK_MARKETPLACE_ADDRESSES.feeManager,
          MOCK_MARKETPLACE_ADDRESSES.bundleMarketplace,
          MOCK_MARKETPLACE_ADDRESSES.nftOffer,
        ]),
      }

      // Mock ethers.Contract constructor
      jest.spyOn(require('ethers'), 'Contract').mockImplementation(() => mockHub)

      await service.initialize(mockProvider as any)

      expect(mockProvider.getNetwork).toHaveBeenCalled()
      expect(mockProvider.getCode).toHaveBeenCalledWith(hubAddress)
    })

    it('should initialize successfully with provider and signer', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)
      mockProvider.getCode.mockResolvedValue('0x123456')

      const mockHub = {
        getAddress: jest.fn().mockResolvedValue(hubAddress),
        getAllAddresses: jest.fn().mockResolvedValue([
          MOCK_MARKETPLACE_ADDRESSES.erc721Exchange,
          MOCK_MARKETPLACE_ADDRESSES.erc1155Exchange,
          MOCK_MARKETPLACE_ADDRESSES.erc721Factory,
          MOCK_MARKETPLACE_ADDRESSES.erc1155Factory,
          MOCK_MARKETPLACE_ADDRESSES.englishAuction,
          MOCK_MARKETPLACE_ADDRESSES.dutchAuction,
          MOCK_MARKETPLACE_ADDRESSES.auctionFactory,
          MOCK_MARKETPLACE_ADDRESSES.feeManager,
          MOCK_MARKETPLACE_ADDRESSES.bundleMarketplace,
          MOCK_MARKETPLACE_ADDRESSES.nftOffer,
        ]),
      }

      jest.spyOn(require('ethers'), 'Contract').mockImplementation(() => mockHub)

      await service.initialize(mockProvider as any, mockSigner as any)

      expect(mockProvider.getNetwork).toHaveBeenCalled()
    })

    it('should handle BlockOutOfRangeError specifically', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)
      mockProvider.getCode.mockResolvedValue('0x123456')

      const mockHub = {
        getAddress: jest.fn().mockResolvedValue(hubAddress),
        getAllAddresses: jest
          .fn()
          .mockRejectedValue(new Error('BlockOutOfRangeError: block height')),
      }

      jest.spyOn(require('ethers'), 'Contract').mockImplementation(() => mockHub)

      await expect(service.initialize(mockProvider as any)).rejects.toThrow(
        'Blockchain synchronization error'
      )
    })

    it('should handle generic initialization errors', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)
      mockProvider.getCode.mockResolvedValue('0x123456')

      const mockHub = {
        getAddress: jest.fn().mockResolvedValue(hubAddress),
        getAllAddresses: jest.fn().mockRejectedValue(new Error('Generic error')),
      }

      jest.spyOn(require('ethers'), 'Contract').mockImplementation(() => mockHub)

      await expect(service.initialize(mockProvider as any)).rejects.toThrow(
        'Failed to initialize MarketplaceHub'
      )
    })
  })

  describe('getAddresses()', () => {
    it('should throw error when not initialized', () => {
      expect(() => service.getAddresses()).toThrow(
        'Hub not initialized - call initialize() first'
      )
    })

    it('should return addresses after initialization', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)
      mockProvider.getCode.mockResolvedValue('0x123456')

      const mockHub = {
        getAddress: jest.fn().mockResolvedValue(hubAddress),
        getAllAddresses: jest.fn().mockResolvedValue([
          MOCK_MARKETPLACE_ADDRESSES.erc721Exchange,
          MOCK_MARKETPLACE_ADDRESSES.erc1155Exchange,
          MOCK_MARKETPLACE_ADDRESSES.erc721Factory,
          MOCK_MARKETPLACE_ADDRESSES.erc1155Factory,
          MOCK_MARKETPLACE_ADDRESSES.englishAuction,
          MOCK_MARKETPLACE_ADDRESSES.dutchAuction,
          MOCK_MARKETPLACE_ADDRESSES.auctionFactory,
          MOCK_MARKETPLACE_ADDRESSES.feeManager,
          MOCK_MARKETPLACE_ADDRESSES.bundleMarketplace,
          MOCK_MARKETPLACE_ADDRESSES.nftOffer,
        ]),
      }

      jest.spyOn(require('ethers'), 'Contract').mockImplementation(() => mockHub)

      await service.initialize(mockProvider as any)
      const addresses = service.getAddresses()

      expect(addresses).toHaveProperty('hub', hubAddress)
      expect(addresses).toHaveProperty(
        'erc721Exchange',
        MOCK_MARKETPLACE_ADDRESSES.erc721Exchange
      )
      expect(addresses).toHaveProperty(
        'erc1155Exchange',
        MOCK_MARKETPLACE_ADDRESSES.erc1155Exchange
      )
    })
  })

  describe('getHub()', () => {
    it('should throw error when not initialized', () => {
      expect(() => service.getHub()).toThrow('Hub not initialized')
    })

    it('should return hub contract after initialization', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)
      mockProvider.getCode.mockResolvedValue('0x123456')

      const mockHub = {
        getAddress: jest.fn().mockResolvedValue(hubAddress),
        getAllAddresses: jest.fn().mockResolvedValue([
          MOCK_MARKETPLACE_ADDRESSES.erc721Exchange,
          MOCK_MARKETPLACE_ADDRESSES.erc1155Exchange,
          MOCK_MARKETPLACE_ADDRESSES.erc721Factory,
          MOCK_MARKETPLACE_ADDRESSES.erc1155Factory,
          MOCK_MARKETPLACE_ADDRESSES.englishAuction,
          MOCK_MARKETPLACE_ADDRESSES.dutchAuction,
          MOCK_MARKETPLACE_ADDRESSES.auctionFactory,
          MOCK_MARKETPLACE_ADDRESSES.feeManager,
          MOCK_MARKETPLACE_ADDRESSES.bundleMarketplace,
          MOCK_MARKETPLACE_ADDRESSES.nftOffer,
        ]),
      }

      jest.spyOn(require('ethers'), 'Contract').mockImplementation(() => mockHub)

      await service.initialize(mockProvider as any)
      const hub = service.getHub()

      expect(hub).toBe(mockHub)
    })
  })

  describe('Address Loading', () => {
    it('should load all 10 contract addresses from hub', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)
      mockProvider.getCode.mockResolvedValue('0x123456')

      const mockHub = {
        getAddress: jest.fn().mockResolvedValue(hubAddress),
        getAllAddresses: jest.fn().mockResolvedValue([
          MOCK_MARKETPLACE_ADDRESSES.erc721Exchange,
          MOCK_MARKETPLACE_ADDRESSES.erc1155Exchange,
          MOCK_MARKETPLACE_ADDRESSES.erc721Factory,
          MOCK_MARKETPLACE_ADDRESSES.erc1155Factory,
          MOCK_MARKETPLACE_ADDRESSES.englishAuction,
          MOCK_MARKETPLACE_ADDRESSES.dutchAuction,
          MOCK_MARKETPLACE_ADDRESSES.auctionFactory,
          MOCK_MARKETPLACE_ADDRESSES.feeManager,
          MOCK_MARKETPLACE_ADDRESSES.bundleMarketplace,
          MOCK_MARKETPLACE_ADDRESSES.nftOffer,
        ]),
      }

      jest.spyOn(require('ethers'), 'Contract').mockImplementation(() => mockHub)

      await service.initialize(mockProvider as any)
      const addresses = service.getAddresses()

      // Verify all addresses are loaded
      expect(addresses.hub).toBe(hubAddress)
      expect(addresses.erc721Exchange).toBe(
        MOCK_MARKETPLACE_ADDRESSES.erc721Exchange
      )
      expect(addresses.erc1155Exchange).toBe(
        MOCK_MARKETPLACE_ADDRESSES.erc1155Exchange
      )
      expect(addresses.erc721Factory).toBe(
        MOCK_MARKETPLACE_ADDRESSES.erc721Factory
      )
      expect(addresses.erc1155Factory).toBe(
        MOCK_MARKETPLACE_ADDRESSES.erc1155Factory
      )
      expect(addresses.englishAuction).toBe(
        MOCK_MARKETPLACE_ADDRESSES.englishAuction
      )
      expect(addresses.dutchAuction).toBe(
        MOCK_MARKETPLACE_ADDRESSES.dutchAuction
      )
      expect(addresses.auctionFactory).toBe(
        MOCK_MARKETPLACE_ADDRESSES.auctionFactory
      )
      expect(addresses.feeRegistry).toBe(MOCK_MARKETPLACE_ADDRESSES.feeManager)
      expect(addresses.bundleManager).toBe(
        MOCK_MARKETPLACE_ADDRESSES.bundleMarketplace
      )
      expect(addresses.offerManager).toBe(MOCK_MARKETPLACE_ADDRESSES.nftOffer)
    })
  })

  describe('Chain ID Handling', () => {
    it('should work with local chain (31337)', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)

      mockProvider.getNetwork.mockResolvedValue({
        chainId: 31337n,
        name: 'localhost',
      } as any)
      mockProvider.getCode.mockResolvedValue('0x123456')

      const mockHub = {
        getAddress: jest.fn().mockResolvedValue(hubAddress),
        getAllAddresses: jest.fn().mockResolvedValue(
          Array(10).fill('0x' + '1'.repeat(40))
        ),
      }

      jest.spyOn(require('ethers'), 'Contract').mockImplementation(() => mockHub)

      await service.initialize(mockProvider as any)

      expect(getHubAddress).toHaveBeenCalledWith(31337)
    })

    it('should work with Sepolia (11155111)', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)

      mockProvider.getNetwork.mockResolvedValue({
        chainId: 11155111n,
        name: 'sepolia',
      } as any)
      mockProvider.getCode.mockResolvedValue('0x123456')

      const mockHub = {
        getAddress: jest.fn().mockResolvedValue(hubAddress),
        getAllAddresses: jest.fn().mockResolvedValue(
          Array(10).fill('0x' + '1'.repeat(40))
        ),
      }

      jest.spyOn(require('ethers'), 'Contract').mockImplementation(() => mockHub)

      await service.initialize(mockProvider as any)

      expect(getHubAddress).toHaveBeenCalledWith(11155111)
    })

    it('should work with mainnet (1)', async () => {
      const hubAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      ;(getHubAddress as jest.Mock).mockReturnValue(hubAddress)

      mockProvider.getNetwork.mockResolvedValue({
        chainId: 1n,
        name: 'mainnet',
      } as any)
      mockProvider.getCode.mockResolvedValue('0x123456')

      const mockHub = {
        getAddress: jest.fn().mockResolvedValue(hubAddress),
        getAllAddresses: jest.fn().mockResolvedValue(
          Array(10).fill('0x' + '1'.repeat(40))
        ),
      }

      jest.spyOn(require('ethers'), 'Contract').mockImplementation(() => mockHub)

      await service.initialize(mockProvider as any)

      expect(getHubAddress).toHaveBeenCalledWith(1)
    })
  })
})
