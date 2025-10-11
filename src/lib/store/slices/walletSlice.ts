import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface WalletState {
  account: string | null
  balance: string
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

const initialState: WalletState = {
  account: null,
  balance: '0',
  isConnected: false,
  isConnecting: false,
  error: null,
}

interface ConnectedPayload {
  account: string
  balance: string
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload
      state.error = null
    },
    setConnected: (state, action: PayloadAction<ConnectedPayload>) => {
      state.account = action.payload.account
      state.balance = action.payload.balance
      state.isConnected = true
      state.isConnecting = false
      state.error = null
    },
    setDisconnected: (state) => {
      state.account = null
      state.balance = '0'
      state.isConnected = false
      state.isConnecting = false
      state.error = null
    },
    setBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isConnecting = false
    },
  },
})

export const {
  setConnecting,
  setConnected,
  setDisconnected,
  setBalance,
  setError,
} = walletSlice.actions

export default walletSlice.reducer