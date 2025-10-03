import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface NFT {
  id: string
  tokenId: string
  contractAddress: string
  owner: string
  name: string
  description?: string
  image?: string
  metadata?: any
  type: 'ERC721' | 'ERC1155'
  amount?: number // For ERC1155
}

export interface NFTsState {
  items: NFT[]
  loading: boolean
  error: string | null
  lastFetched: number | null
}

const initialState: NFTsState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
}

export const fetchUserNFTs = createAsyncThunk(
  'nfts/fetchUserNFTs',
  async (userAddress: string, { rejectWithValue }) => {
    try {
      // TODO: Implement with service layer
      return []
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error')
    }
  }
)

const nftsSlice = createSlice({
  name: 'nfts',
  initialState,
  reducers: {
    addNFT: (state, action: PayloadAction<NFT>) => {
      const newNFT = action.payload
      const exists = state.items.find(nft => 
        nft.contractAddress === newNFT.contractAddress && nft.tokenId === newNFT.tokenId
      )
      if (!exists) {
        state.items.push(newNFT)
      }
    },
    removeNFT: (state, action: PayloadAction<{ contractAddress: string; tokenId: string }>) => {
      const { contractAddress, tokenId } = action.payload
      state.items = state.items.filter(nft => 
        !(nft.contractAddress === contractAddress && nft.tokenId === tokenId)
      )
    },
    clearNFTs: (state) => {
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
      .addCase(fetchUserNFTs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserNFTs.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchUserNFTs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  addNFT,
  removeNFT,
  clearNFTs,
  setError,
} = nftsSlice.actions

export default nftsSlice.reducer