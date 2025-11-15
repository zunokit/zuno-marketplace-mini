# Zuno Marketplace Testing Guide

Comprehensive testing setup for the Zuno Marketplace using Jest and React Testing Library.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage](#coverage)
- [Best Practices](#best-practices)

## Overview

### Testing Stack

- **Jest** - Test framework
- **React Testing Library** - Component testing
- **@testing-library/user-event** - User interaction simulation
- **ts-jest** - TypeScript support for Jest
- **@testing-library/jest-dom** - Custom matchers for DOM assertions

### Test Categories

1. **Unit Tests** - Individual functions, utilities, and services
2. **Integration Tests** - Service initialization and interactions
3. **Component Tests** - React components with Redux

## Getting Started

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Configuration

All Jest configuration is located in `tests/setup/`:

- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Test environment setup (runs before each test suite)
- `test-utils.tsx` - Custom render functions with Redux
- `mock-ethers.ts` - Mock providers, signers, and contracts
- `__mocks__/` - Mock files for CSS and static assets

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (used for CI/CD pipelines)
npm run test:ci

# Run manual integration tests (blockchain scripts)
npm run test:manual
```

### Run Specific Tests

```bash
# Run tests in a specific file
npm test -- logger.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="EnvConfigManager"

# Run tests for a specific folder
npm test -- tests/unit/utils
```

### Watch Mode Options

When running `npm run test:watch`, Jest provides interactive options:

- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename pattern
- Press `t` to filter by test name pattern
- Press `q` to quit watch mode

## Test Structure

```
tests/
├── setup/                      # Test configuration
│   ├── jest.config.js         # Jest configuration
│   ├── jest.setup.js          # Environment setup
│   ├── test-utils.tsx         # Custom render utilities
│   ├── mock-ethers.ts         # Ethers.js mocks
│   └── __mocks__/             # Static asset mocks
├── unit/                       # Unit tests
│   ├── utils/                 # Utility tests
│   │   ├── logger.test.ts
│   │   ├── env-config.test.ts
│   │   └── web3.test.ts
│   ├── services/              # Service tests
│   │   └── MarketplaceHubService.test.ts
│   └── store/                 # Redux tests
│       └── walletSlice.test.ts
└── integration/               # Integration tests
    └── (future tests)
```

## Writing Tests

### Unit Test Example

```typescript
import { logger } from '@/lib/utils/logger'

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should log info messages', () => {
    const consoleSpy = jest.spyOn(console, 'log')

    logger.info('Test message', { data: 'value' })

    expect(consoleSpy).toHaveBeenCalled()
  })
})
```

### Service Test Example

```typescript
import { MarketplaceHubService } from '@/lib/services/contracts/MarketplaceHubService'
import { createMockProvider, createMockSigner } from '../../setup/mock-ethers'

describe('MarketplaceHubService', () => {
  let service: MarketplaceHubService
  let mockProvider: ReturnType<typeof createMockProvider>

  beforeEach(() => {
    service = new MarketplaceHubService()
    mockProvider = createMockProvider()
    jest.clearAllMocks()
  })

  it('should initialize with provider', async () => {
    mockProvider.getCode.mockResolvedValue('0x123456')

    await service.initialize(mockProvider as any)

    expect(service.getAddresses()).toBeDefined()
  })
})
```

### Redux Slice Test Example

```typescript
import walletReducer, { setConnected } from '@/lib/store/slices/walletSlice'

describe('walletSlice', () => {
  it('should set connected state', () => {
    const payload = {
      account: '0x1234567890123456789012345678901234567890',
      balance: '10.0',
    }

    const state = walletReducer(initialState, setConnected(payload))

    expect(state.isConnected).toBe(true)
    expect(state.account).toBe(payload.account)
  })
})
```

### Component Test Example

```typescript
import { renderWithProviders } from '../../setup/test-utils'
import { WalletConnect } from '@/components/features/wallet/WalletConnect'

describe('WalletConnect', () => {
  it('should render connect button when disconnected', () => {
    const { getByText } = renderWithProviders(<WalletConnect />)

    expect(getByText('Connect Wallet')).toBeInTheDocument()
  })
})
```

## Coverage

### Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:

- `coverage/` - Detailed HTML coverage report (open `coverage/index.html`)
- Console output - Summary of coverage percentages

### Coverage Thresholds

Minimum coverage thresholds (defined in `jest.config.js`):

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Excluded from Coverage

- Type definition files (`*.d.ts`)
- Auto-generated ABIs (`src/lib/contracts/abis/`)
- Test files and mocks
- Next.js internal files (`src/app/**/_*.{js,jsx,ts,tsx}`)

## Best Practices

### 1. Test Organization

- **One test file per source file**: `logger.ts` → `logger.test.ts`
- **Group related tests** using `describe()` blocks
- **Clear test names** using `it('should...')` format

### 2. Test Independence

```typescript
beforeEach(() => {
  jest.clearAllMocks() // Clear all mocks before each test
})
```

### 3. Mock External Dependencies

```typescript
// Mock the logger to avoid console noise
jest.mock('@/lib/utils/logger')

// Mock specific functions
jest.spyOn(envStorageService, 'load').mockReturnValue(mockConfig)
```

### 4. Test Both Success and Failure Paths

```typescript
it('should handle success case', async () => {
  mockProvider.getCode.mockResolvedValue('0x123456')
  await expect(service.initialize(mockProvider)).resolves.not.toThrow()
})

it('should handle failure case', async () => {
  mockProvider.getCode.mockResolvedValue('0x')
  await expect(service.initialize(mockProvider)).rejects.toThrow()
})
```

### 5. Use Descriptive Assertions

```typescript
// ❌ Bad
expect(result).toBe(true)

// ✅ Good
expect(service.isInitialized()).toBe(true)
```

### 6. Test Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle empty string', () => {
    expect(formatAddress('')).toBe('')
  })

  it('should handle very large numbers', () => {
    expect(parseEther('1000000000')).toBeDefined()
  })
})
```

## Mock Utilities

### Available Mocks

#### `createMockProvider()`
Creates a mock ethers.js provider with common methods.

```typescript
const mockProvider = createMockProvider()
mockProvider.getBalance.mockResolvedValue(ethers.parseEther('10'))
```

#### `createMockSigner()`
Creates a mock ethers.js signer.

```typescript
const mockSigner = createMockSigner()
mockSigner.getAddress.mockResolvedValue('0x1234...')
```

#### `createMockContract()`
Creates a mock contract instance.

```typescript
const mockContract = createMockContract(address, abi)
```

#### `MOCK_MARKETPLACE_ADDRESSES`
Pre-defined mock addresses for all marketplace contracts.

### Redux Testing Utilities

#### `setupStore(preloadedState?)`
Creates a test store with optional initial state.

```typescript
const store = setupStore({
  wallet: { isConnected: true, account: '0x123...' }
})
```

#### `renderWithProviders(component, options?)`
Renders a component with Redux Provider.

```typescript
const { getByText, store } = renderWithProviders(<MyComponent />)
```

## Troubleshooting

### Common Issues

#### TypeScript Errors

If you see TypeScript errors in tests:

```bash
npm run type-check
```

#### Module Resolution Errors

Ensure path aliases are configured in `jest.config.js`:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

#### Coverage Not Generated

Make sure you're running:

```bash
npm run test:coverage
```

Not just `npm test`.

## Next Steps

### Areas to Add Tests

Based on the coverage analysis, prioritize testing:

1. **Contract Services** - All 13 services (ExchangeService, AuctionService, etc.)
2. **Redux Slices** - Remaining 9 slices
3. **React Components** - Critical feature components
4. **Integration Tests** - Service initialization flows

### Recommended Test Files to Create

```
tests/unit/services/
├── ExchangeService.test.ts
├── AuctionService.test.ts
├── FeeManagerService.test.ts
├── RoyaltyManagerService.test.ts
└── ... (other services)

tests/unit/store/
├── listingSlice.test.ts
├── auctionsSlice.test.ts
├── offersSlice.test.ts
└── ... (other slices)

tests/integration/
└── service-initialization.test.ts
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Ensure tests are independent
3. Mock external dependencies
4. Test both success and failure cases
5. Maintain coverage above 70%
6. Run `npm run test:coverage` before committing
