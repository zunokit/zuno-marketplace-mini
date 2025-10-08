import { configureStore, combineReducers } from '@reduxjs/toolkit'

// Import slices
import walletReducer from './slices/walletSlice'
import collectionsReducer from './slices/collectionsSlice'
import nftsReducer from './slices/nftsSlice'
import auctionsReducer from './slices/auctionsSlice'
import listingReducer from './slices/listingSlice'
import offersReducer from './slices/offersSlice'
import feesReducer from './slices/feesSlice'
import notificationReducer from './slices/notificationSlice'
import securityReducer from './slices/securitySlice'
import accessControlReducer from './slices/accessControlSlice'

const rootReducer = combineReducers({
  wallet: walletReducer,
  collections: collectionsReducer,
  nfts: nftsReducer,
  auctions: auctionsReducer,
  listing: listingReducer,
  offers: offersReducer,
  fees: feesReducer,
  notifications: notificationReducer,
  security: securityReducer,
  accessControl: accessControlReducer,
})

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActionPaths: ['payload.timestamp', 'payload.error'],
          ignoredPaths: [
            'notifications.items',
            'security.marketplaceStatus.pauseTime',
            'security.blacklistedContracts.blacklistTime',
          ],
        },
      }),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']