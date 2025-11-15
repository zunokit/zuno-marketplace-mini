/**
 * Test Utilities
 * Custom render functions with Redux and providers
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, PreloadedState } from '@reduxjs/toolkit'
import type { RootState } from '@/lib/store'

// Import reducers
import walletReducer from '@/lib/store/slices/walletSlice'
import listingReducer from '@/lib/store/slices/listingSlice'
import auctionsReducer from '@/lib/store/slices/auctionsSlice'
import offersReducer from '@/lib/store/slices/offersSlice'
import collectionsReducer from '@/lib/store/slices/collectionsSlice'
import nftsReducer from '@/lib/store/slices/nftsSlice'
import feesReducer from '@/lib/store/slices/feesSlice'
import securityReducer from '@/lib/store/slices/securitySlice'
import accessControlReducer from '@/lib/store/slices/accessControlSlice'
import notificationReducer from '@/lib/store/slices/notificationSlice'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>
  store?: ReturnType<typeof setupStore>
}

/**
 * Create a test store with optional preloaded state
 */
export function setupStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      wallet: walletReducer,
      listing: listingReducer,
      auctions: auctionsReducer,
      offers: offersReducer,
      collections: collectionsReducer,
      nfts: nftsReducer,
      fees: feesReducer,
      security: securityReducer,
      accessControl: accessControlReducer,
      notification: notificationReducer,
    },
    preloadedState,
  })
}

/**
 * Custom render function with Redux Provider
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

/**
 * Create mock wallet state
 */
export function createMockWalletState(overrides = {}) {
  return {
    account: '0x1234567890123456789012345678901234567890',
    balance: '10.0',
    isConnected: true,
    isConnecting: false,
    error: null,
    ...overrides,
  }
}

/**
 * Create mock listing state
 */
export function createMockListingState(overrides = {}) {
  return {
    listings: [],
    isLoading: false,
    error: null,
    ...overrides,
  }
}

/**
 * Wait for async updates
 */
export const waitForAsync = () =>
  new Promise(resolve => setTimeout(resolve, 0))

/**
 * Re-export everything from React Testing Library
 */
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
