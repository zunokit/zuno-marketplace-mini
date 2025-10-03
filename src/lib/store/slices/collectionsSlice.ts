import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface Collection {
  address: string
  name: string
  symbol: string
  type: 'ERC721' | 'ERC1155'
  creator?: string
  blockNumber?: number
  transactionHash?: string
  addedAt?: number
  discovered?: boolean
}

export interface CollectionsState {
  items: Collection[]
  loading: boolean
  error: string | null
  lastFetched: number | null
}

const initialState: CollectionsState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
}

// Async thunks will be implemented later with proper service layer
export const fetchAllCollections = createAsyncThunk(
  'collections/fetchAllCollections',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement with service layer
      return []
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error')
    }
  }
)

export const fetchUserCollections = createAsyncThunk(
  'collections/fetchUserCollections',
  async (userAddress: string, { rejectWithValue }) => {
    try {
      // TODO: Implement with service layer
      return []
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error')
    }
  }
)

const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    addCollection: (state, action: PayloadAction<Collection>) => {
      const newCollection = action.payload
      const exists = state.items.find(c => c.address === newCollection.address)
      if (!exists) {
        state.items.push({
          ...newCollection,
          addedAt: Date.now(),
        })
      }
    },
    removeCollection: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(c => c.address !== action.payload)
    },
    clearCollections: (state) => {
      state.items = []
      state.lastFetched = null
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
    addDiscoveredCollection: (state, action: PayloadAction<Omit<Collection, 'addedAt'>>) => {
      const { address, type, name, symbol } = action.payload
      const exists = state.items.find(c => c.address === address)
      if (!exists) {
        state.items.push({
          address,
          type,
          name: name || 'Discovered Collection',
          symbol: symbol || 'DISC',
          addedAt: Date.now(),
          discovered: true,
        })
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCollections.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllCollections.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchAllCollections.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchUserCollections.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserCollections.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchUserCollections.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  addCollection,
  removeCollection,
  clearCollections,
  setError,
  addDiscoveredCollection,
} = collectionsSlice.actions

export default collectionsSlice.reducer