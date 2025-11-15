/**
 * Mock Ethers.js Utilities
 * Mocks for providers, signers, and contracts
 */

import { ethers } from 'ethers'

/**
 * Mock Provider
 */
export class MockProvider {
  getNetwork = jest.fn().mockResolvedValue({
    chainId: 31337n,
    name: 'localhost',
  })

  getBalance = jest.fn().mockResolvedValue(ethers.parseEther('10'))

  getBlock = jest.fn().mockResolvedValue({
    number: 1,
    timestamp: Math.floor(Date.now() / 1000),
  })

  getBlockNumber = jest.fn().mockResolvedValue(1)

  getCode = jest.fn().mockResolvedValue('0x')

  getTransaction = jest.fn().mockResolvedValue({
    hash: '0x123',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x0987654321098765432109876543210987654321',
  })

  getTransactionReceipt = jest.fn().mockResolvedValue({
    status: 1,
    blockNumber: 1,
    logs: [],
  })

  waitForTransaction = jest.fn().mockResolvedValue({
    status: 1,
    blockNumber: 1,
    logs: [],
  })

  estimateGas = jest.fn().mockResolvedValue(BigInt(21000))

  getFeeData = jest.fn().mockResolvedValue({
    gasPrice: ethers.parseUnits('20', 'gwei'),
    maxFeePerGas: ethers.parseUnits('30', 'gwei'),
    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
  })

  call = jest.fn().mockResolvedValue('0x')

  send = jest.fn().mockResolvedValue([])
}

/**
 * Mock Signer
 */
export class MockSigner {
  provider: MockProvider

  constructor(provider?: MockProvider) {
    this.provider = provider || new MockProvider()
  }

  getAddress = jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')

  getBalance = jest.fn().mockResolvedValue(ethers.parseEther('10'))

  signMessage = jest.fn().mockResolvedValue('0xsignature')

  signTransaction = jest.fn().mockResolvedValue('0xsignedtx')

  sendTransaction = jest.fn().mockResolvedValue({
    hash: '0xtxhash',
    wait: jest.fn().mockResolvedValue({
      status: 1,
      blockNumber: 1,
      logs: [],
    }),
  })

  estimateGas = jest.fn().mockResolvedValue(BigInt(21000))

  call = jest.fn().mockResolvedValue('0x')
}

/**
 * Mock Contract
 */
export class MockContract {
  address: string
  interface: any
  runner: MockSigner | MockProvider

  constructor(
    address: string,
    abi: any[],
    runner?: MockSigner | MockProvider
  ) {
    this.address = address
    this.interface = new ethers.Interface(abi)
    this.runner = runner || new MockProvider()
  }

  // Generic method that can be customized per test
  [key: string]: any
}

/**
 * Create a mock provider
 */
export function createMockProvider(): MockProvider {
  return new MockProvider()
}

/**
 * Create a mock signer
 */
export function createMockSigner(provider?: MockProvider): MockSigner {
  return new MockSigner(provider)
}

/**
 * Create a mock contract
 */
export function createMockContract(
  address: string,
  abi: any[],
  runner?: MockSigner | MockProvider
): MockContract {
  return new MockContract(address, abi, runner)
}

/**
 * Mock contract call response
 */
export function mockContractCall<T>(returnValue: T) {
  return jest.fn().mockResolvedValue(returnValue)
}

/**
 * Mock contract transaction
 */
export function mockContractTransaction(
  receipt?: Partial<ethers.TransactionReceipt>
) {
  return jest.fn().mockResolvedValue({
    hash: '0xtxhash',
    wait: jest.fn().mockResolvedValue({
      status: 1,
      blockNumber: 1,
      logs: [],
      ...receipt,
    }),
  })
}

/**
 * Mock MarketplaceHub addresses
 */
export const MOCK_MARKETPLACE_ADDRESSES = {
  erc721Exchange: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  erc1155Exchange: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  englishAuction: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  dutchAuction: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  bundleMarketplace: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  nftOffer: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  collectionOffer: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  traitOffer: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  erc721Factory: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  erc1155Factory: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  feeManager: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
  royaltyManager: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
  accessControl: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
  emergencyManager: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
  listingValidator: '0x9A676e781A523b5d0C0e43731313A708CB607508',
  listingHistoryTracker: '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
  collectionVerifier: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
  timelockController: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
}

/**
 * Mock error for reverted transactions
 */
export class MockContractError extends Error {
  code: string
  reason?: string

  constructor(message: string, code: string = 'CALL_EXCEPTION', reason?: string) {
    super(message)
    this.code = code
    this.reason = reason
    this.name = 'MockContractError'
  }
}

/**
 * Create mock transaction receipt with logs
 */
export function createMockReceipt(logs: any[] = []) {
  return {
    status: 1,
    blockNumber: 1,
    blockHash: '0xblockhash',
    transactionHash: '0xtxhash',
    logs,
    gasUsed: BigInt(21000),
    cumulativeGasUsed: BigInt(21000),
    from: '0x1234567890123456789012345678901234567890',
    to: '0x0987654321098765432109876543210987654321',
    contractAddress: null,
  }
}
