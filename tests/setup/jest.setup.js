/**
 * Jest Setup File
 * Runs before each test suite
 */

import '@testing-library/jest-dom'

// Mock window.ethereum for Web3 tests
global.window = global.window || {}
global.window.ethereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  isMetaMask: true,
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock window.location.reload
// Note: Can't override window.location in jsdom directly
// Mock location.reload in individual tests if needed:
// jest.spyOn(window.location, 'reload').mockImplementation(() => {})

// Mock console methods to reduce noise in tests
// You can enable them for debugging by commenting out these lines
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  // Keep log for debugging
  log: console.log,
}

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  NEXT_PUBLIC_DEFAULT_CHAIN_ID: '31337',
  NEXT_PUBLIC_MARKETPLACE_HUB_LOCAL: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  NEXT_PUBLIC_RPC_URL_LOCAL: 'http://127.0.0.1:8545',
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Global test utilities
global.flushPromises = () => new Promise(resolve => setImmediate(resolve))
