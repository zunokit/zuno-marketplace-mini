import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface SecurityState {
  marketplaceStatus: {
    isPaused: boolean
    pauseTime?: number
    pauseReason?: string
  }
  blacklistedContracts: Array<{
    address: string
    reason: string
    blacklistTime: number
  }>
  emergencyMode: boolean
  lastSecurityCheck: number | null
}

const initialState: SecurityState = {
  marketplaceStatus: {
    isPaused: false,
  },
  blacklistedContracts: [],
  emergencyMode: false,
  lastSecurityCheck: null,
}

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    pauseMarketplace: (state, action: PayloadAction<string>) => {
      state.marketplaceStatus.isPaused = true
      state.marketplaceStatus.pauseTime = Date.now()
      state.marketplaceStatus.pauseReason = action.payload
    },
    resumeMarketplace: (state) => {
      state.marketplaceStatus.isPaused = false
      state.marketplaceStatus.pauseTime = undefined
      state.marketplaceStatus.pauseReason = undefined
    },
    addBlacklistedContract: (state, action: PayloadAction<{ address: string; reason: string }>) => {
      const { address, reason } = action.payload
      const exists = state.blacklistedContracts.find(contract => contract.address === address)
      if (!exists) {
        state.blacklistedContracts.push({
          address,
          reason,
          blacklistTime: Date.now(),
        })
      }
    },
    removeBlacklistedContract: (state, action: PayloadAction<string>) => {
      state.blacklistedContracts = state.blacklistedContracts.filter(
        contract => contract.address !== action.payload
      )
    },
    setEmergencyMode: (state, action: PayloadAction<boolean>) => {
      state.emergencyMode = action.payload
    },
    updateSecurityCheck: (state) => {
      state.lastSecurityCheck = Date.now()
    },
  },
})

export const {
  pauseMarketplace,
  resumeMarketplace,
  addBlacklistedContract,
  removeBlacklistedContract,
  setEmergencyMode,
  updateSecurityCheck,
} = securitySlice.actions

export default securitySlice.reducer