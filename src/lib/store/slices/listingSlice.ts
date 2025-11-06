import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Listing {
  id: string;
  seller: string;
  tokenContract: string;
  tokenId: string;
  price: string;
  currency: string;
  status: "ACTIVE" | "SOLD" | "CANCELLED";
  tokenType?: "ERC721" | "ERC1155"; // Token standard type
  amount?: string; // For ERC1155 listings
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
      const { exchangeService } = await import("@/lib/services/contracts");
      const { nftMetadataService } = await import("@/lib/services/NFTMetadataService");

      // Fetch active listings from ERC721 and ERC1155 exchanges
      const erc721Listings = await exchangeService.getAllActiveListings("ERC721", 50, 0);
      const erc1155Listings = await exchangeService.getAllActiveListings("ERC1155", 50, 0);

      // Combine and enrich with metadata
      const allListings = [...erc721Listings, ...erc1155Listings];

      // Fetch metadata for each NFT and map to slice Listing type
      const enrichedListings = await Promise.all(
        allListings.map(async (listing): Promise<Listing> => {
          try {
            const metadata = await nftMetadataService.getNFTMetadata(
              listing.contractAddress,
              listing.tokenId.toString()
            );

            return {
              id: listing.listingId,
              seller: listing.seller,
              tokenContract: listing.contractAddress,
              tokenId: listing.tokenId.toString(),
              price: listing.price.toString(),
              currency: listing.paymentToken,
              status: listing.isActive ? "ACTIVE" : "CANCELLED",
              tokenType: listing.tokenType,
              amount: listing.amount.toString(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              nft: {
                name: metadata?.name,
                image: metadata?.image,
                collection: {
                  name: listing.contractAddress, // Use contract address as fallback
                  verified: false, // TODO: Implement verification check
                },
              },
            };
          } catch (error) {
            // Return minimal listing without metadata if fetch fails
            return {
              id: listing.listingId,
              seller: listing.seller,
              tokenContract: listing.contractAddress,
              tokenId: listing.tokenId.toString(),
              price: listing.price.toString(),
              currency: listing.paymentToken,
              status: listing.isActive ? "ACTIVE" : "CANCELLED",
              tokenType: listing.tokenType,
              amount: listing.amount.toString(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
          }
        })
      );

      return enrichedListings;
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
