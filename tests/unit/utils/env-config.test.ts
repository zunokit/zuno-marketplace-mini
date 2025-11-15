/**
 * Tests for EnvConfigManager
 */

import { envConfigManager } from '@/lib/utils/env-config'
import { envStorageService } from '@/lib/services/env-storage.service'
import type { EnvConfig } from '@/types/env-config'

// Mock dependencies
jest.mock('@/lib/services/env-storage.service')
jest.mock('@/lib/utils/logger')

describe('EnvConfigManager', () => {
  const mockConfig: EnvConfig = {
    NEXT_PUBLIC_DEFAULT_CHAIN_ID: '31337',
    NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    NEXT_PUBLIC_RPC_URL_LOCAL: 'http://127.0.0.1:8545',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear cached config
    envConfigManager['cachedConfig'] = null
  })

  describe('get()', () => {
    it('should get environment variable from localStorage', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(mockConfig)

      const value = envConfigManager.get('NEXT_PUBLIC_DEFAULT_CHAIN_ID')

      expect(value).toBe('31337')
    })

    it('should fallback to process.env when localStorage is empty', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(null)

      const value = envConfigManager.get('NEXT_PUBLIC_DEFAULT_CHAIN_ID')

      expect(value).toBe(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID)
    })

    it('should return undefined for non-existent keys', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(mockConfig)

      const value = envConfigManager.get('NON_EXISTENT_KEY')

      expect(value).toBeUndefined()
    })
  })

  describe('getConfig()', () => {
    it('should return cached config if available', () => {
      const cachedConfig = { ...mockConfig }
      envConfigManager['cachedConfig'] = cachedConfig

      const config = envConfigManager.getConfig()

      expect(config).toBe(cachedConfig)
      expect(envStorageService.load).not.toHaveBeenCalled()
    })

    it('should load from localStorage and cache it', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(mockConfig)

      const config = envConfigManager.getConfig()

      expect(config).toEqual(mockConfig)
      expect(envStorageService.load).toHaveBeenCalledTimes(1)

      // Second call should use cache
      const config2 = envConfigManager.getConfig()
      expect(config2).toBe(config)
      expect(envStorageService.load).toHaveBeenCalledTimes(1)
    })

    it('should fallback to process.env when localStorage is empty', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(null)

      const config = envConfigManager.getConfig()

      expect(config.NEXT_PUBLIC_DEFAULT_CHAIN_ID).toBe(
        process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID
      )
    })
  })

  describe('setConfig()', () => {
    it('should validate config before saving', () => {
      const invalidConfig = {
        NEXT_PUBLIC_DEFAULT_CHAIN_ID: 'invalid',
      } as EnvConfig

      jest.spyOn(envStorageService, 'validate').mockReturnValue({
        isValid: false,
        errors: ['Invalid chain ID'],
      })

      expect(() => envConfigManager.setConfig(invalidConfig)).toThrow(
        'Invalid configuration'
      )
    })

    it('should save valid config to localStorage', () => {
      jest.spyOn(envStorageService, 'validate').mockReturnValue({
        isValid: true,
        errors: [],
      })
      jest.spyOn(envStorageService, 'save').mockImplementation()

      // Mock window.location.reload to prevent actual reload
      const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation()

      envConfigManager.setConfig(mockConfig)

      expect(envStorageService.save).toHaveBeenCalledWith(mockConfig)
      expect(reloadSpy).toHaveBeenCalled()

      reloadSpy.mockRestore()
    })

    it('should update cached config', () => {
      jest.spyOn(envStorageService, 'validate').mockReturnValue({
        isValid: true,
        errors: [],
      })
      jest.spyOn(envStorageService, 'save').mockImplementation()
      const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation()

      envConfigManager.setConfig(mockConfig)

      expect(envConfigManager['cachedConfig']).toEqual(mockConfig)

      reloadSpy.mockRestore()
    })
  })

  describe('clearConfig()', () => {
    it('should clear localStorage and cache', () => {
      jest.spyOn(envStorageService, 'clear').mockImplementation()
      const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation()

      envConfigManager['cachedConfig'] = mockConfig

      envConfigManager.clearConfig()

      expect(envStorageService.clear).toHaveBeenCalled()
      expect(envConfigManager['cachedConfig']).toBeNull()
      expect(reloadSpy).toHaveBeenCalled()

      reloadSpy.mockRestore()
    })
  })

  describe('isUsingStoredConfig()', () => {
    it('should return true when localStorage has config', () => {
      jest.spyOn(envStorageService, 'hasStoredConfig').mockReturnValue(true)

      const result = envConfigManager.isUsingStoredConfig()

      expect(result).toBe(true)
    })

    it('should return false when localStorage is empty', () => {
      jest.spyOn(envStorageService, 'hasStoredConfig').mockReturnValue(false)

      const result = envConfigManager.isUsingStoredConfig()

      expect(result).toBe(false)
    })
  })

  describe('getMarketplaceHubAddress()', () => {
    beforeEach(() => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(mockConfig)
      jest.spyOn(envStorageService, 'hasStoredConfig').mockReturnValue(true)
    })

    it('should return local hub address for chain ID 31337', () => {
      const address = envConfigManager.getMarketplaceHubAddress(31337)

      expect(address).toBe(mockConfig.NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL)
    })

    it('should return Sepolia hub address for chain ID 11155111', () => {
      const sepoliaConfig = {
        ...mockConfig,
        NEXT_PUBLIC_MARKETPLACE_HUB_SEPOLIA: '0xSepoliaAddress',
      }
      jest.spyOn(envStorageService, 'load').mockReturnValue(sepoliaConfig)
      envConfigManager['cachedConfig'] = null

      const address = envConfigManager.getMarketplaceHubAddress(11155111)

      expect(address).toBe('0xSepoliaAddress')
    })

    it('should return mainnet hub address for chain ID 1', () => {
      const mainnetConfig = {
        ...mockConfig,
        NEXT_PUBLIC_MARKETPLACE_HUB_MAINNET: '0xMainnetAddress',
      }
      jest.spyOn(envStorageService, 'load').mockReturnValue(mainnetConfig)
      envConfigManager['cachedConfig'] = null

      const address = envConfigManager.getMarketplaceHubAddress(1)

      expect(address).toBe('0xMainnetAddress')
    })

    it('should return undefined for unsupported chain ID', () => {
      const address = envConfigManager.getMarketplaceHubAddress(999)

      expect(address).toBeUndefined()
    })
  })

  describe('getDefaultChainId()', () => {
    it('should return chain ID as number', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(mockConfig)

      const chainId = envConfigManager.getDefaultChainId()

      expect(chainId).toBe(31337)
      expect(typeof chainId).toBe('number')
    })

    it('should default to 31337 if not set', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue({
        NEXT_PUBLIC_DEFAULT_CHAIN_ID: '',
      } as EnvConfig)
      envConfigManager['cachedConfig'] = null

      const chainId = envConfigManager.getDefaultChainId()

      expect(chainId).toBe(31337)
    })
  })

  describe('isConfiguredForChain()', () => {
    it('should return true when hub address exists for chain', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(mockConfig)
      jest.spyOn(envStorageService, 'hasStoredConfig').mockReturnValue(true)
      envConfigManager['cachedConfig'] = null

      const result = envConfigManager.isConfiguredForChain(31337)

      expect(result).toBe(true)
    })

    it('should return false when hub address is missing', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue({
        NEXT_PUBLIC_DEFAULT_CHAIN_ID: '31337',
      } as EnvConfig)
      jest.spyOn(envStorageService, 'hasStoredConfig').mockReturnValue(true)
      envConfigManager['cachedConfig'] = null

      const result = envConfigManager.isConfiguredForChain(31337)

      expect(result).toBe(false)
    })

    it('should return false when hub address is empty string', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue({
        NEXT_PUBLIC_DEFAULT_CHAIN_ID: '31337',
        NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL: '',
      } as EnvConfig)
      jest.spyOn(envStorageService, 'hasStoredConfig').mockReturnValue(true)
      envConfigManager['cachedConfig'] = null

      const result = envConfigManager.isConfiguredForChain(31337)

      expect(result).toBe(false)
    })
  })

  describe('getAllowlistAddresses()', () => {
    it('should parse comma-separated addresses', () => {
      const configWithAllowlist = {
        ...mockConfig,
        NEXT_PUBLIC_DEFAULT_ALLOWLIST: '0xAddress1,0xAddress2,0xAddress3',
      }
      jest.spyOn(envStorageService, 'load').mockReturnValue(configWithAllowlist)
      envConfigManager['cachedConfig'] = null

      const addresses = envConfigManager.getAllowlistAddresses()

      expect(addresses).toEqual(['0xAddress1', '0xAddress2', '0xAddress3'])
    })

    it('should trim whitespace from addresses', () => {
      const configWithAllowlist = {
        ...mockConfig,
        NEXT_PUBLIC_DEFAULT_ALLOWLIST: '  0xAddress1  ,  0xAddress2  ',
      }
      jest.spyOn(envStorageService, 'load').mockReturnValue(configWithAllowlist)
      envConfigManager['cachedConfig'] = null

      const addresses = envConfigManager.getAllowlistAddresses()

      expect(addresses).toEqual(['0xAddress1', '0xAddress2'])
    })

    it('should return empty array when allowlist is undefined', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(mockConfig)
      envConfigManager['cachedConfig'] = null

      const addresses = envConfigManager.getAllowlistAddresses()

      expect(addresses).toEqual([])
    })

    it('should return empty array when allowlist is empty string', () => {
      const configWithEmptyAllowlist = {
        ...mockConfig,
        NEXT_PUBLIC_DEFAULT_ALLOWLIST: '',
      }
      jest.spyOn(envStorageService, 'load').mockReturnValue(configWithEmptyAllowlist)
      envConfigManager['cachedConfig'] = null

      const addresses = envConfigManager.getAllowlistAddresses()

      expect(addresses).toEqual([])
    })

    it('should filter out empty addresses', () => {
      const configWithAllowlist = {
        ...mockConfig,
        NEXT_PUBLIC_DEFAULT_ALLOWLIST: '0xAddress1,,0xAddress2,  ,0xAddress3',
      }
      jest.spyOn(envStorageService, 'load').mockReturnValue(configWithAllowlist)
      envConfigManager['cachedConfig'] = null

      const addresses = envConfigManager.getAllowlistAddresses()

      expect(addresses).toEqual(['0xAddress1', '0xAddress2', '0xAddress3'])
    })
  })

  describe('getRpcUrl()', () => {
    it('should return local RPC URL for chain ID 31337', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(mockConfig)
      envConfigManager['cachedConfig'] = null

      const rpcUrl = envConfigManager.getRpcUrl(31337)

      expect(rpcUrl).toBe('http://127.0.0.1:8545')
    })

    it('should return Sepolia RPC URL for chain ID 11155111', () => {
      const sepoliaConfig = {
        ...mockConfig,
        NEXT_PUBLIC_RPC_URL_SEPOLIA: 'https://sepolia.infura.io',
      }
      jest.spyOn(envStorageService, 'load').mockReturnValue(sepoliaConfig)
      envConfigManager['cachedConfig'] = null

      const rpcUrl = envConfigManager.getRpcUrl(11155111)

      expect(rpcUrl).toBe('https://sepolia.infura.io')
    })

    it('should return mainnet RPC URL for chain ID 1', () => {
      const mainnetConfig = {
        ...mockConfig,
        NEXT_PUBLIC_RPC_URL_MAINNET: 'https://mainnet.infura.io',
      }
      jest.spyOn(envStorageService, 'load').mockReturnValue(mainnetConfig)
      envConfigManager['cachedConfig'] = null

      const rpcUrl = envConfigManager.getRpcUrl(1)

      expect(rpcUrl).toBe('https://mainnet.infura.io')
    })

    it('should return undefined for unsupported chain ID', () => {
      jest.spyOn(envStorageService, 'load').mockReturnValue(mockConfig)
      envConfigManager['cachedConfig'] = null

      const rpcUrl = envConfigManager.getRpcUrl(999)

      expect(rpcUrl).toBeUndefined()
    })
  })
})
