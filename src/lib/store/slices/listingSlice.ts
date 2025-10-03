import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Listing {
  id: string;
  seller: string;
  tokenContract: string;
  tokenId: string;
  price: string;
  currency: string;
  status: "ACTIVE" | "SOLD" | "CANCELLED";
  nft?: {
    name?: string;
    image?: string;
    collection?: {
      name?: string;
      verified?: boolean;
    };
  };
  createdAt: number;
  updatedAt: number;
}

export interface ListingState {
  items: Listing[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: ListingState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchActiveListings = createAsyncThunk(
  "listing/fetchActiveListings",
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement with service layer
      return [];
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

const listingSlice = createSlice({
  name: "listing",
  initialState,
  reducers: {
    addListing: (state, action: PayloadAction<Listing>) => {
      const newListing = action.payload;
      const exists = state.items.find(
        (listing) => listing.id === newListing.id
      );
      if (!exists) {
        state.items.push(newListing);
      }
    },
    updateListing: (
      state,
      action: PayloadAction<Partial<Listing> & { id: string }>
    ) => {
      const index = state.items.findIndex(
        (listing) => listing.id === action.payload.id
      );
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    removeListing: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (listing) => listing.id !== action.payload
      );
    },
    clearListings: (state) => {
      state.items = [];
      state.lastFetched = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveListings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchActiveListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addListing,
  updateListing,
  removeListing,
  clearListings,
  setError,
} = listingSlice.actions;

export default listingSlice.reducer;
