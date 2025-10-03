import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface Auction {
  id: string
  seller: string
  tokenContract: string
  tokenId: string
  startPrice: string
  currentPrice: string
  endTime: number
  startTime: number
  highestBidder?: string
  bidCount: number
  status: 'ACTIVE' | 'ENDED' | 'CANCELLED'
  type: 'ENGLISH' | 'DUTCH'
}

export interface AuctionsState {
  items: Auction[]
  loading: boolean
  error: string | null
  lastFetched: number | null
}

const initialState: AuctionsState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
}

export const fetchActiveAuctions = createAsyncThunk(
  'auctions/fetchActiveAuctions',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement with service layer
      return []
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error')
    }
  }
)

const auctionsSlice = createSlice({
  name: 'auctions',
  initialState,
  reducers: {
    addAuction: (state, action: PayloadAction<Auction>) => {
      const newAuction = action.payload
      const exists = state.items.find(auction => auction.id === newAuction.id)
      if (!exists) {
        state.items.push(newAuction)
      }
    },
    updateAuction: (state, action: PayloadAction<Partial<Auction> & { id: string }>) => {
      const index = state.items.findIndex(auction => auction.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload }
      }
    },
    removeAuction: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(auction => auction.id !== action.payload)
    },
    clearAuctions: (state) => {
      state.items = []
      state.lastFetched = null
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveAuctions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchActiveAuctions.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchActiveAuctions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  addAuction,
  updateAuction,
  removeAuction,
  clearAuctions,
  setError,
} = auctionsSlice.actions

export default auctionsSlice.reducer