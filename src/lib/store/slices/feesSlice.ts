import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface FeeStructure {
  marketplaceFee: number // percentage
  royaltyFee: number // percentage
  listingFee: string // in wei
  gasFee: string // in wei
}

export interface FeesState {
  structure: FeeStructure
  loading: boolean
  error: string | null
  lastUpdated: number | null
}

const initialState: FeesState = {
  structure: {
    marketplaceFee: 2.5, // 2.5%
    royaltyFee: 5.0, // 5%
    listingFee: '0',
    gasFee: '0',
  },
  loading: false,
  error: null,
  lastUpdated: null,
}

const feesSlice = createSlice({
  name: 'fees',
  initialState,
  reducers: {
    updateFeeStructure: (state, action: PayloadAction<Partial<FeeStructure>>) => {
      state.structure = { ...state.structure, ...action.payload }
      state.lastUpdated = Date.now()
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  updateFeeStructure,
  setLoading,
  setError,
  clearError,
} = feesSlice.actions

export default feesSlice.reducer