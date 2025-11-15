/**
 * Tests for walletSlice Redux store
 */

import walletReducer, {
  setConnecting,
  setConnected,
  setDisconnected,
  setBalance,
  setError,
  WalletState,
} from '@/lib/store/slices/walletSlice'

describe('walletSlice', () => {
  const initialState: WalletState = {
    account: null,
    balance: '0',
    isConnected: false,
    isConnecting: false,
    error: null,
  }

  describe('initial state', () => {
    it('should return initial state when state is undefined', () => {
      const state = walletReducer(undefined, { type: 'unknown' })

      expect(state).toEqual(initialState)
    })
  })

  describe('setConnecting', () => {
    it('should set isConnecting to true', () => {
      const state = walletReducer(initialState, setConnecting(true))

      expect(state.isConnecting).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should set isConnecting to false', () => {
      const connectingState = {
        ...initialState,
        isConnecting: true,
      }
      const state = walletReducer(connectingState, setConnecting(false))

      expect(state.isConnecting).toBe(false)
    })

    it('should clear error when setting connecting', () => {
      const errorState = {
        ...initialState,
        error: 'Previous error',
      }
      const state = walletReducer(errorState, setConnecting(true))

      expect(state.error).toBeNull()
    })
  })

  describe('setConnected', () => {
    it('should set connected state with account and balance', () => {
      const payload = {
        account: '0x1234567890123456789012345678901234567890',
        balance: '10.5',
      }
      const state = walletReducer(initialState, setConnected(payload))

      expect(state.account).toBe(payload.account)
      expect(state.balance).toBe(payload.balance)
      expect(state.isConnected).toBe(true)
      expect(state.isConnecting).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should update existing connection with new account', () => {
      const existingState = {
        ...initialState,
        account: '0xOldAddress',
        balance: '5.0',
        isConnected: true,
      }
      const payload = {
        account: '0x1234567890123456789012345678901234567890',
        balance: '10.5',
      }
      const state = walletReducer(existingState, setConnected(payload))

      expect(state.account).toBe(payload.account)
      expect(state.balance).toBe(payload.balance)
    })

    it('should clear any previous errors', () => {
      const errorState = {
        ...initialState,
        error: 'Connection failed',
      }
      const payload = {
        account: '0x1234567890123456789012345678901234567890',
        balance: '10.5',
      }
      const state = walletReducer(errorState, setConnected(payload))

      expect(state.error).toBeNull()
    })
  })

  describe('setDisconnected', () => {
    it('should reset to initial state', () => {
      const connectedState = {
        account: '0x1234567890123456789012345678901234567890',
        balance: '10.5',
        isConnected: true,
        isConnecting: false,
        error: null,
      }
      const state = walletReducer(connectedState, setDisconnected())

      expect(state).toEqual(initialState)
    })

    it('should clear account information', () => {
      const connectedState = {
        ...initialState,
        account: '0x1234567890123456789012345678901234567890',
        balance: '10.5',
        isConnected: true,
      }
      const state = walletReducer(connectedState, setDisconnected())

      expect(state.account).toBeNull()
      expect(state.balance).toBe('0')
      expect(state.isConnected).toBe(false)
    })

    it('should clear errors when disconnecting', () => {
      const errorState = {
        ...initialState,
        error: 'Some error',
        isConnected: true,
      }
      const state = walletReducer(errorState, setDisconnected())

      expect(state.error).toBeNull()
    })
  })

  describe('setBalance', () => {
    it('should update balance', () => {
      const state = walletReducer(initialState, setBalance('25.5'))

      expect(state.balance).toBe('25.5')
    })

    it('should update balance while maintaining other state', () => {
      const connectedState = {
        account: '0x1234567890123456789012345678901234567890',
        balance: '10.0',
        isConnected: true,
        isConnecting: false,
        error: null,
      }
      const state = walletReducer(connectedState, setBalance('15.0'))

      expect(state.balance).toBe('15.0')
      expect(state.account).toBe(connectedState.account)
      expect(state.isConnected).toBe(true)
    })

    it('should handle zero balance', () => {
      const connectedState = {
        ...initialState,
        balance: '10.0',
      }
      const state = walletReducer(connectedState, setBalance('0'))

      expect(state.balance).toBe('0')
    })

    it('should handle large balance values', () => {
      const state = walletReducer(initialState, setBalance('1000000.123456789'))

      expect(state.balance).toBe('1000000.123456789')
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Connection failed'
      const state = walletReducer(initialState, setError(errorMessage))

      expect(state.error).toBe(errorMessage)
      expect(state.isConnecting).toBe(false)
    })

    it('should clear isConnecting when error occurs', () => {
      const connectingState = {
        ...initialState,
        isConnecting: true,
      }
      const state = walletReducer(connectingState, setError('Error occurred'))

      expect(state.isConnecting).toBe(false)
      expect(state.error).toBe('Error occurred')
    })

    it('should overwrite previous error', () => {
      const errorState = {
        ...initialState,
        error: 'Old error',
      }
      const state = walletReducer(errorState, setError('New error'))

      expect(state.error).toBe('New error')
    })

    it('should maintain connection state when error occurs', () => {
      const connectedState = {
        account: '0x1234567890123456789012345678901234567890',
        balance: '10.0',
        isConnected: true,
        isConnecting: false,
        error: null,
      }
      const state = walletReducer(
        connectedState,
        setError('Transaction failed')
      )

      expect(state.error).toBe('Transaction failed')
      expect(state.isConnected).toBe(true)
      expect(state.account).toBe(connectedState.account)
      expect(state.balance).toBe(connectedState.balance)
    })
  })

  describe('State Transitions', () => {
    it('should handle complete connection flow', () => {
      // Start connecting
      let state = walletReducer(initialState, setConnecting(true))
      expect(state.isConnecting).toBe(true)

      // Connect successfully
      state = walletReducer(
        state,
        setConnected({
          account: '0x1234567890123456789012345678901234567890',
          balance: '10.0',
        })
      )
      expect(state.isConnected).toBe(true)
      expect(state.isConnecting).toBe(false)

      // Update balance
      state = walletReducer(state, setBalance('15.0'))
      expect(state.balance).toBe('15.0')

      // Disconnect
      state = walletReducer(state, setDisconnected())
      expect(state).toEqual(initialState)
    })

    it('should handle failed connection flow', () => {
      // Start connecting
      let state = walletReducer(initialState, setConnecting(true))
      expect(state.isConnecting).toBe(true)

      // Connection fails
      state = walletReducer(state, setError('User rejected connection'))
      expect(state.error).toBe('User rejected connection')
      expect(state.isConnecting).toBe(false)
      expect(state.isConnected).toBe(false)
    })

    it('should handle account switch', () => {
      // Initial connection
      let state = walletReducer(
        initialState,
        setConnected({
          account: '0x1111111111111111111111111111111111111111',
          balance: '5.0',
        })
      )

      // Switch account
      state = walletReducer(
        state,
        setConnected({
          account: '0x2222222222222222222222222222222222222222',
          balance: '10.0',
        })
      )

      expect(state.account).toBe('0x2222222222222222222222222222222222222222')
      expect(state.balance).toBe('10.0')
    })

    it('should handle reconnection after error', () => {
      // Connection fails
      let state = walletReducer(
        initialState,
        setError('Initial connection failed')
      )

      // Try again
      state = walletReducer(state, setConnecting(true))
      expect(state.error).toBeNull()

      // Success
      state = walletReducer(
        state,
        setConnected({
          account: '0x1234567890123456789012345678901234567890',
          balance: '10.0',
        })
      )

      expect(state.isConnected).toBe(true)
      expect(state.error).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty account address', () => {
      const state = walletReducer(
        initialState,
        setConnected({ account: '', balance: '0' })
      )

      expect(state.account).toBe('')
      expect(state.isConnected).toBe(true)
    })

    it('should handle negative balance string', () => {
      const state = walletReducer(initialState, setBalance('-5.0'))

      expect(state.balance).toBe('-5.0')
    })

    it('should handle empty error message', () => {
      const state = walletReducer(initialState, setError(''))

      expect(state.error).toBe('')
    })

    it('should maintain state immutability', () => {
      const state1 = walletReducer(
        initialState,
        setConnected({
          account: '0x1234567890123456789012345678901234567890',
          balance: '10.0',
        })
      )
      const state2 = walletReducer(state1, setBalance('15.0'))

      // Original state should not be mutated
      expect(state1.balance).toBe('10.0')
      expect(state2.balance).toBe('15.0')
      expect(state1).not.toBe(state2)
    })
  })
})
