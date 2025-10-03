import { ethers, Contract, Provider, Signer } from 'ethers'

export abstract class BaseContractService {
  protected contract: Contract | null = null
  protected provider: Provider | null = null
  protected signer: Signer | null = null
  protected contractAddress: string
  protected contractABI: any[]

  constructor(contractAddress: string, contractABI: any[]) {
    this.contractAddress = contractAddress
    this.contractABI = contractABI
  }

  /**
   * Initialize the contract with provider
   */
  async initialize(provider: Provider, signer?: Signer): Promise<void> {
    this.provider = provider
    this.signer = signer || null

    if (!this.contractAddress || this.contractAddress === ethers.ZeroAddress) {
      throw new Error(`Invalid contract address: ${this.contractAddress}`)
    }

    try {
      this.contract = new Contract(
        this.contractAddress,
        this.contractABI,
        signer || provider
      )
    } catch (error) {
      throw new Error(`Failed to initialize contract: ${error}`)
    }
  }

  /**
   * Check if contract is initialized
   */
  protected ensureInitialized(): void {
    if (!this.contract || !this.provider) {
      throw new Error('Contract not initialized. Call initialize() first.')
    }
  }

  /**
   * Get contract instance
   */
  getContract(): Contract {
    this.ensureInitialized()
    return this.contract!
  }

  /**
   * Get contract address
   */
  getAddress(): string {
    return this.contractAddress
  }

  /**
   * Update signer (for transactions)
   */
  updateSigner(signer: Signer): void {
    this.signer = signer
    if (this.contract) {
      this.contract = this.contract.connect(signer)
    }
  }

  /**
   * Call a read-only contract method
   */
  protected async callMethod(methodName: string, ...args: any[]): Promise<any> {
    this.ensureInitialized()
    try {
      return await this.contract![methodName](...args)
    } catch (error) {
      throw new Error(`Failed to call ${methodName}: ${error}`)
    }
  }

  /**
   * Send a transaction to contract method
   */
  protected async sendTransaction(
    methodName: string,
    ...args: any[]
  ): Promise<ethers.ContractTransactionResponse> {
    this.ensureInitialized()
    if (!this.signer) {
      throw new Error('Signer required for transactions')
    }

    try {
      const tx = await this.contract![methodName](...args)
      return tx
    } catch (error) {
      throw new Error(`Failed to send transaction ${methodName}: ${error}`)
    }
  }

  /**
   * Listen to contract events
   */
  protected addEventListener(
    eventName: string,
    listener: (...args: any[]) => void
  ): void {
    this.ensureInitialized()
    this.contract!.on(eventName, listener)
  }

  /**
   * Remove event listener
   */
  protected removeEventListener(
    eventName: string,
    listener: (...args: any[]) => void
  ): void {
    this.ensureInitialized()
    this.contract!.off(eventName, listener)
  }

  /**
   * Remove all event listeners
   */
  protected removeAllListeners(eventName?: string): void {
    this.ensureInitialized()
    this.contract!.removeAllListeners(eventName)
  }

  /**
   * Get past events
   */
  protected async getPastEvents(
    eventName: string,
    fromBlock: number | string = 0,
    toBlock: number | string = 'latest'
  ): Promise<any[]> {
    this.ensureInitialized()
    try {
      const filter = this.contract!.filters[eventName]()
      return await this.contract!.queryFilter(filter, fromBlock, toBlock)
    } catch (error) {
      throw new Error(`Failed to get past events ${eventName}: ${error}`)
    }
  }
}