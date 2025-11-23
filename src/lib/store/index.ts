import { configureStore, combineReducers } from '@reduxjs/toolkit'

// Import only essential slices (others handled by SDK's React Query)
import walletReducer from './slices/walletSlice'
import notificationReducer from './slices/notificationSlice'

const rootReducer = combineReducers({
  wallet: walletReducer,
  notifications: notificationReducer,
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