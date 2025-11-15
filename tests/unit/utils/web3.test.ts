/**
 * Tests for Web3Utils
 */

import { Web3Utils } from '@/lib/utils/web3'
import { ethers } from 'ethers'
import { createMockProvider, createMockSigner } from '../../setup/mock-ethers'

// Mock dependencies
jest.mock('@/lib/services/contracts', () => ({
  initializeServices: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/utils/logger')
jest.mock('@/lib/utils/env-config')
jest.mock('@/lib/services/web3/provider-factory')

describe('Web3Utils', () => {
  let web3Utils: Web3Utils

  beforeEach(() => {
    web3Utils = new Web3Utils()
    jest.clearAllMocks()
  })

  describe('formatAddress()', () => {
    it('should format address with default lengths', () => {
      const address = '0x1234567890123456789012345678901234567890'
      const formatted = web3Utils.formatAddress(address)

      expect(formatted).toBe('0x1234...7890')
    })

    it('should format address with custom lengths', () => {
      const address = '0x1234567890123456789012345678901234567890'
      const formatted = web3Utils.formatAddress(address, 8, 6)

      expect(formatted).toBe('0x123456...567890')
    })

    it('should return original address if too short', () => {
      const address = '0x1234'
      const formatted = web3Utils.formatAddress(address)

      expect(formatted).toBe('0x1234')
    })

    it('should handle empty address', () => {
      const formatted = web3Utils.formatAddress('')

      expect(formatted).toBe('')
    })
  })

  describe('parseEther()', () => {
    it('should parse ether amount correctly', () => {
      const amount = '1.5'
      const parsed = web3Utils.parseEther(amount)

      expect(parsed).toBe(ethers.parseEther('1.5'))
    })

    it('should handle zero amount', () => {
      const amount = '0'
      const parsed = web3Utils.parseEther(amount)

      expect(parsed).toBe(BigInt(0))
    })

    it('should handle large amounts', () => {
      const amount = '1000000'
      const parsed = web3Utils.parseEther(amount)

      expect(parsed).toBe(ethers.parseEther('1000000'))
    })
  })

  describe('formatEther()', () => {
    it('should format bigint to ether string', () => {
      const amount = ethers.parseEther('1.5')
      const formatted = web3Utils.formatEther(amount)

      expect(formatted).toBe('1.5')
    })

    it('should format string to ether', () => {
      const amount = ethers.parseEther('1.5').toString()
      const formatted = web3Utils.formatEther(amount)

      expect(formatted).toBe('1.5')
    })

    it('should handle zero', () => {
      const formatted = web3Utils.formatEther(BigInt(0))

      expect(formatted).toBe('0.0')
    })
  })

  describe('isValidAddress()', () => {
    it('should return true for valid Ethereum address', () => {
      const address = '0x1234567890123456789012345678901234567890'
      const isValid = web3Utils.isValidAddress(address)

      expect(isValid).toBe(true)
    })

    it('should return false for invalid address', () => {
      const address = '0xinvalid'
      const isValid = web3Utils.isValidAddress(address)

      expect(isValid).toBe(false)
    })

    it('should return false for empty string', () => {
      const isValid = web3Utils.isValidAddress('')

      expect(isValid).toBe(false)
    })

    it('should return false for non-checksummed address', () => {
      // ethers.isAddress accepts both checksummed and non-checksummed
      const address = '0x1234567890123456789012345678901234567890'
      const isValid = web3Utils.isValidAddress(address)

      expect(isValid).toBe(true)
    })
  })

  describe('getProvider()', () => {
    it('should return null when not initialized', () => {
      const provider = web3Utils.getProvider()

      expect(provider).toBeNull()
    })

    it('should return provider after initialization', async () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      const provider = web3Utils.getProvider()

      expect(provider).toBe(mockProvider)
    })
  })

  describe('getSigner()', () => {
    it('should return null when not initialized', () => {
      const signer = web3Utils.getSigner()

      expect(signer).toBeNull()
    })

    it('should return signer after initialization', async () => {
      const mockSigner = createMockSigner()
      web3Utils['signer'] = mockSigner as any

      const signer = web3Utils.getSigner()

      expect(signer).toBe(mockSigner)
    })
  })

  describe('disconnect()', () => {
    it('should clear provider and signer', () => {
      web3Utils['provider'] = createMockProvider() as any
      web3Utils['signer'] = createMockSigner() as any

      web3Utils.disconnect()

      expect(web3Utils['provider']).toBeNull()
      expect(web3Utils['signer']).toBeNull()
    })
  })

  describe('getContract()', () => {
    it('should throw error when provider not initialized', () => {
      const address = '0x1234567890123456789012345678901234567890'
      const abi = [{ type: 'function', name: 'test' }]

      expect(() => web3Utils.getContract(address, abi)).toThrow(
        'Provider not initialized'
      )
    })

    it('should create contract with signer when available', () => {
      const mockProvider = createMockProvider()
      const mockSigner = createMockSigner()
      web3Utils['provider'] = mockProvider as any
      web3Utils['signer'] = mockSigner as any

      const address = '0x1234567890123456789012345678901234567890'
      const abi = [{ type: 'function', name: 'test' }]

      const contract = web3Utils.getContract(address, abi)

      expect(contract).toBeDefined()
      expect(contract.target).toBe(address)
    })

    it('should create contract with provider when signer not available', () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      const address = '0x1234567890123456789012345678901234567890'
      const abi = [{ type: 'function', name: 'test' }]

      const contract = web3Utils.getContract(address, abi)

      expect(contract).toBeDefined()
      expect(contract.target).toBe(address)
    })
  })

  describe('getBalance()', () => {
    it('should throw error when provider not initialized', async () => {
      const address = '0x1234567890123456789012345678901234567890'

      await expect(web3Utils.getBalance(address)).rejects.toThrow(
        'Provider not initialized'
      )
    })

    it('should get balance for provided address', async () => {
      const mockProvider = createMockProvider()
      const mockSigner = createMockSigner()
      web3Utils['provider'] = mockProvider as any
      web3Utils['signer'] = mockSigner as any

      const address = '0x1234567890123456789012345678901234567890'
      mockProvider.getBalance.mockResolvedValue(ethers.parseEther('10'))

      const balance = await web3Utils.getBalance(address)

      expect(balance).toBe('10.0')
      expect(mockProvider.getBalance).toHaveBeenCalledWith(address)
    })

    it('should get balance for connected account when no address provided', async () => {
      const mockProvider = createMockProvider()
      const mockSigner = createMockSigner()
      web3Utils['provider'] = mockProvider as any
      web3Utils['signer'] = mockSigner as any

      mockSigner.getAddress.mockResolvedValue(
        '0x1234567890123456789012345678901234567890'
      )
      mockProvider.getBalance.mockResolvedValue(ethers.parseEther('5'))

      const balance = await web3Utils.getBalance()

      expect(balance).toBe('5.0')
    })

    it('should throw error when no account found', async () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      await expect(web3Utils.getBalance()).rejects.toThrow('No account found')
    })
  })

  describe('getAccount()', () => {
    it('should return null when no signer', async () => {
      const account = await web3Utils.getAccount()

      expect(account).toBeNull()
    })

    it('should return account address from signer', async () => {
      const mockSigner = createMockSigner()
      web3Utils['signer'] = mockSigner as any

      const expectedAddress = '0x1234567890123456789012345678901234567890'
      mockSigner.getAddress.mockResolvedValue(expectedAddress)

      const account = await web3Utils.getAccount()

      expect(account).toBe(expectedAddress)
    })

    it('should return null on error', async () => {
      const mockSigner = createMockSigner()
      web3Utils['signer'] = mockSigner as any

      mockSigner.getAddress.mockRejectedValue(new Error('Test error'))

      const account = await web3Utils.getAccount()

      expect(account).toBeNull()
    })
  })

  describe('getNetwork()', () => {
    it('should return null when provider not initialized', async () => {
      const network = await web3Utils.getNetwork()

      expect(network).toBeNull()
    })

    it('should return network information', async () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      const expectedNetwork = { chainId: 31337n, name: 'localhost' }
      mockProvider.getNetwork.mockResolvedValue(expectedNetwork as any)

      const network = await web3Utils.getNetwork()

      expect(network).toEqual(expectedNetwork)
    })

    it('should return null on error', async () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      mockProvider.getNetwork.mockRejectedValue(new Error('Network error'))

      const network = await web3Utils.getNetwork()

      expect(network).toBeNull()
    })
  })

  describe('waitForTransaction()', () => {
    it('should throw error when provider not initialized', async () => {
      const txHash = '0xtxhash'

      await expect(web3Utils.waitForTransaction(txHash)).rejects.toThrow(
        'Provider not initialized'
      )
    })

    it('should wait for transaction with default confirmations', async () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      const txHash = '0xtxhash'
      const mockReceipt = { status: 1, blockNumber: 1, logs: [] }
      mockProvider.waitForTransaction.mockResolvedValue(mockReceipt as any)

      const receipt = await web3Utils.waitForTransaction(txHash)

      expect(receipt).toEqual(mockReceipt)
      expect(mockProvider.waitForTransaction).toHaveBeenCalledWith(txHash, 1)
    })

    it('should wait for transaction with custom confirmations', async () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      const txHash = '0xtxhash'
      const confirmations = 3
      mockProvider.waitForTransaction.mockResolvedValue({} as any)

      await web3Utils.waitForTransaction(txHash, confirmations)

      expect(mockProvider.waitForTransaction).toHaveBeenCalledWith(
        txHash,
        confirmations
      )
    })
  })

  describe('estimateGas()', () => {
    it('should throw error when provider not initialized', async () => {
      await expect(web3Utils.estimateGas('0xto', '0xdata')).rejects.toThrow(
        'Provider not initialized'
      )
    })

    it('should estimate gas for transaction', async () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      const to = '0x1234567890123456789012345678901234567890'
      const data = '0xdata'
      const expectedGas = BigInt(21000)

      mockProvider.estimateGas.mockResolvedValue(expectedGas)

      const gas = await web3Utils.estimateGas(to, data)

      expect(gas).toBe(expectedGas)
      expect(mockProvider.estimateGas).toHaveBeenCalledWith({
        to,
        data,
        value: BigInt(0),
      })
    })

    it('should estimate gas with value', async () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      const to = '0x1234567890123456789012345678901234567890'
      const data = '0xdata'
      const value = ethers.parseEther('1')

      mockProvider.estimateGas.mockResolvedValue(BigInt(21000))

      await web3Utils.estimateGas(to, data, value)

      expect(mockProvider.estimateGas).toHaveBeenCalledWith({
        to,
        data,
        value,
      })
    })
  })

  describe('getGasPrice()', () => {
    it('should throw error when provider not initialized', async () => {
      await expect(web3Utils.getGasPrice()).rejects.toThrow(
        'Provider not initialized'
      )
    })

    it('should get current gas price', async () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      const expectedGasPrice = ethers.parseUnits('20', 'gwei')
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: expectedGasPrice,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      })

      const gasPrice = await web3Utils.getGasPrice()

      expect(gasPrice).toBe(expectedGasPrice)
    })

    it('should return 0 when gasPrice is null', async () => {
      const mockProvider = createMockProvider()
      web3Utils['provider'] = mockProvider as any

      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      })

      const gasPrice = await web3Utils.getGasPrice()

      expect(gasPrice).toBe(BigInt(0))
    })
  })
})
