'use client'
import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import {
  setConnecting,
  setConnected,
  setDisconnected,
  setBalance,
  setError,
} from '@/lib/store/slices/walletSlice'
import { web3Utils } from '@/lib/utils/web3'

export const useWallet = () => {
  const dispatch = useAppDispatch()
  const wallet = useAppSelector((state) => state.wallet)

  /**
   * Connect to wallet
   */
  const connect = useCallback(async () => {
    try {
      dispatch(setConnecting(true))
      
      await web3Utils.initializeProvider()
      const account = await web3Utils.getAccount()
      const balance = await web3Utils.getBalance()

      if (account) {
        dispatch(setConnected({ account, balance }))
      } else {
        throw new Error('No account found')
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      dispatch(setError(error instanceof Error ? error.message : 'Failed to connect wallet'))
    }
  }, [dispatch])

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    web3Utils.disconnect()
    dispatch(setDisconnected())
  }, [dispatch])

  /**
   * Update balance
   */
  const updateBalance = useCallback(async () => {
    try {
      if (wallet.account) {
        const balance = await web3Utils.getBalance(wallet.account)
        dispatch(setBalance(balance))
      }
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }, [wallet.account, dispatch])

  /**
   * Switch network
   */
  const switchNetwork = useCallback(async (chainId: string) => {
    try {
      await web3Utils.switchNetwork(chainId)
      // Re-fetch account info after network switch
      await connect()
    } catch (error) {
      console.error('Failed to switch network:', error)
      dispatch(setError(error instanceof Error ? error.message : 'Failed to switch network'))
    }
  }, [connect, dispatch])

  /**
   * Get current network
   */
  const getCurrentNetwork = useCallback(async () => {
    try {
      return await web3Utils.getNetwork()
    } catch (error) {
      console.error('Failed to get network:', error)
      return null
    }
  }, [])

  /**
   * Check if wallet is connected on component mount
   */
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          const provider = web3Utils.getProvider()
          if (provider) {
            const account = await web3Utils.getAccount()
            if (account) {
              const balance = await web3Utils.getBalance(account)
              dispatch(setConnected({ account, balance }))
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }

    checkConnection()
  }, [dispatch])

  /**
   * Listen to account and network changes
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          // Account changed, reconnect
          connect()
        }
      }

      const handleChainChanged = () => {
        // Network changed, reconnect
        connect()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [connect, disconnect])

  return {
    ...wallet,
    connect,
    disconnect,
    updateBalance,
    switchNetwork,
    getCurrentNetwork,
    web3Utils,
  }
}