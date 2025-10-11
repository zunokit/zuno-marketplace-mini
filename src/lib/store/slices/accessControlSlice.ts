import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserRole {
  address: string
  roles: string[]
  isAdmin: boolean
  isVerifiedCreator: boolean
  permissions: string[]
}

export interface AccessControlState {
  currentUserRoles: UserRole | null
  allUsers: UserRole[]
  loading: boolean
  error: string | null
}

const initialState: AccessControlState = {
  currentUserRoles: null,
  allUsers: [],
  loading: false,
  error: null,
}

const accessControlSlice = createSlice({
  name: 'accessControl',
  initialState,
  reducers: {
    setCurrentUserRoles: (state, action: PayloadAction<UserRole>) => {
      state.currentUserRoles = action.payload
    },
    updateUserRoles: (state, action: PayloadAction<UserRole>) => {
      const index = state.allUsers.findIndex(user => user.address === action.payload.address)
      if (index !== -1) {
        state.allUsers[index] = action.payload
      } else {
        state.allUsers.push(action.payload)
      }
    },
    removeUserRoles: (state, action: PayloadAction<string>) => {
      state.allUsers = state.allUsers.filter(user => user.address !== action.payload)
      if (state.currentUserRoles?.address === action.payload) {
        state.currentUserRoles = null
      }
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
    clearAccessControl: (state) => {
      state.currentUserRoles = null
      state.allUsers = []
      state.error = null
    },
  },
})

export const {
  setCurrentUserRoles,
  updateUserRoles,
  removeUserRoles,
  setLoading,
  setError,
  clearError,
  clearAccessControl,
} = accessControlSlice.actions

export default accessControlSlice.reducer