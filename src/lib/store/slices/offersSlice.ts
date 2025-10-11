import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Offer {
  id: string
  offerer: string
  tokenContract: string
  tokenId: string
  price: string
  currency: string
  expiresAt: number
  status: 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  createdAt: number
}

export interface OffersState {
  items: Offer[]
  loading: boolean
  error: string | null
}

const initialState: OffersState = {
  items: [],
  loading: false,
  error: null,
}

const offersSlice = createSlice({
  name: 'offers',
  initialState,
  reducers: {
    addOffer: (state, action: PayloadAction<Offer>) => {
      const newOffer = action.payload
      const exists = state.items.find(offer => offer.id === newOffer.id)
      if (!exists) {
        state.items.push(newOffer)
      }
    },
    updateOffer: (state, action: PayloadAction<Partial<Offer> & { id: string }>) => {
      const index = state.items.findIndex(offer => offer.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload }
      }
    },
    removeOffer: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(offer => offer.id !== action.payload)
    },
    clearOffers: (state) => {
      state.items = []
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
  },
})

export const {
  addOffer,
  updateOffer,
  removeOffer,
  clearOffers,
  setLoading,
  setError,
} = offersSlice.actions

export default offersSlice.reducer