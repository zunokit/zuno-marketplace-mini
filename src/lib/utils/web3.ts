import { ethers, BrowserProvider, JsonRpcProvider } from 'ethers'

export class Web3Utils {
  private provider: BrowserProvider | JsonRpcProvider | null = null
  private signer: ethers.Signer | null = null

  /**
   * Initialize provider
   */
  async initializeProvider(): Promise<void> {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        this.provider = new BrowserProvider(window.ethereum)
        await this.provider.send('eth_requestAccounts', [])
        this.signer = await this.provider.getSigner()
      } catch (error) {
        throw new Error('Failed to initialize Web3 provider')
      }
    } else {
      throw new Error('No Web3 provider found')
    }
  }

  /**
   * Get provider instance
   */
  getProvider(): BrowserProvider | JsonRpcProvider | null {
    return this.provider
  }

  /**
   * Get signer instance
   */
  getSigner(): ethers.Signer | null {
    return this.signer
  }

  /**
   * Get connected account address
   */
  async getAccount(): Promise<string | null> {
    if (!this.signer) return null
    try {
      return await this.signer.getAddress()
    } catch (error) {
      console.error('Failed to get account:', error)
      return null
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address?: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized')
    
    const accountAddress = address || await this.getAccount()
    if (!accountAddress) throw new Error('No account found')

    try {
      const balance = await this.provider.getBalance(accountAddress)
      return ethers.formatEther(balance)
    } catch (error) {
      throw new Error('Failed to get balance')
    }
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<ethers.Network | null> {
    if (!this.provider) return null
    try {
      return await this.provider.getNetwork()
    } catch (error) {
      console.error('Failed to get network:', error)
      return null
    }
  }

  /**
   * Switch network
   */
  async switchNetwork(chainId: string): Promise<void> {
    if (!window.ethereum) throw new Error('No Web3 provider found')
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error('Network not added to wallet')
      }
      throw new Error('Failed to switch network')
    }
  }

  /**
   * Format address for display
   */
  formatAddress(address: string, startLength = 6, endLength = 4): string {
    if (!address || address.length < startLength + endLength) return address
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
  }

  /**
   * Parse ether amount
   */
  parseEther(amount: string): bigint {
    return ethers.parseEther(amount)
  }

  /**
   * Format ether amount
   */
  formatEther(amount: bigint | string): string {
    return ethers.formatEther(amount)
  }

  /**
   * Check if address is valid
   */
  isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address)
    } catch {
      return false
    }
  }

  /**
   * Get contract instance
   */
  getContract(address: string, abi: any[]): ethers.Contract {
    if (!this.provider) throw new Error('Provider not initialized')
    return new ethers.Contract(address, abi, this.signer || this.provider)
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations = 1): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) throw new Error('Provider not initialized')
    try {
      return await this.provider.waitForTransaction(txHash, confirmations)
    } catch (error) {
      throw new Error('Failed to wait for transaction')
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    to: string,
    data: string,
    value?: bigint
  ): Promise<bigint> {
    if (!this.provider) throw new Error('Provider not initialized')
    
    try {
      return await this.provider.estimateGas({
        to,
        data,
        value: value || 0n,
      })
    } catch (error) {
      throw new Error('Failed to estimate gas')
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    if (!this.provider) throw new Error('Provider not initialized')
    try {
      const feeData = await this.provider.getFeeData()
      return feeData.gasPrice || 0n
    } catch (error) {
      throw new Error('Failed to get gas price')
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.provider = null
    this.signer = null
  }
}

// Singleton instance
export const web3Utils = new Web3Utils()

// Window ethereum type declaration
declare global {
  interface Window {
    ethereum?: any
  }
}