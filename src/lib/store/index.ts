import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import { combineReducers } from '@reduxjs/toolkit'
import storage from 'redux-persist/lib/storage'

// Import slices (will be created next)
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

const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
    'collections',
    'nfts',
    'auctions',
    'listing',
    'offers',
    'fees',
    'notifications',
  ], // Persist main data, not wallet for security
}

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

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
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

export const store = makeStore()
export const persistor = persistStore(store)