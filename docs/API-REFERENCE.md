# API Reference - Zuno Marketplace

Complete API reference for all services, utilities, and types in the Zuno Marketplace codebase.

---

## Table of Contents

1. [Utility Classes](#utility-classes)
   - [ContractValidator](#contractvalidator)
   - [ContractErrorFormatter](#contracterrorformatter)
   - [CryptoFormatter](#cryptoformatter)
   - [StatusMapper](#statusmapper)
   - [BatchQueries](#batchqueries)
   - [PerformanceMonitor](#performancemonitor)
2. [Service Validators](#service-validators)
   - [ServiceValidator](#servicevalidator)
3. [Base Classes](#base-classes)
   - [BaseContractService](#basecontractservice)
4. [Type Definitions](#type-definitions)
   - [Contract Types](#contract-types)
5. [Core Services](#core-services)
   - [MarketplaceHubService](#marketplacehubservice)
   - [ExchangeService](#exchangeservice)
   - [AuctionService](#auctionservice)

---

## Utility Classes

### ContractValidator

Location: `src/lib/utils/validators.ts`

Input validation for all contract parameters. Prevents invalid data from reaching the blockchain.

#### Methods

**`validateAddress(address: string, fieldName?: string): void`**
- Validates Ethereum address format
- Throws if address is invalid or empty
- Example:
  ```typescript
  ContractValidator.validateAddress('0x123...', 'Seller Address');
  ```

**`validatePrice(price: string, fieldName?: string): void`**
- Validates price is positive and parseable as ETH
- Throws if price is invalid, negative, or zero
- Example:
  ```typescript
  ContractValidator.validatePrice('1.5', 'Listing Price');
  ```

**`validateTokenId(tokenId: string | number | bigint, fieldName?: string): void`**
- Validates token ID is non-negative
- Accepts string, number, or bigint
- Example:
  ```typescript
  ContractValidator.validateTokenId(BigInt(1), 'Token ID');
  ```

**`validateDuration(durationInSeconds: number, fieldName?: string): void`**
- Validates duration is positive
- Duration must be in seconds
- Example:
  ```typescript
  ContractValidator.validateDuration(86400, 'Auction Duration');
  ```

**`validatePercentage(value: number, fieldName?: string): void`**
- Validates percentage is between 0 and 100
- Example:
  ```typescript
  ContractValidator.validatePercentage(2.5, 'Royalty Percentage');
  ```

**`validateBasisPoints(basisPoints: number, fieldName?: string): void`**
- Validates basis points are between 0 and 10000
- 100 basis points = 1%
- Example:
  ```typescript
  ContractValidator.validateBasisPoints(250, 'Fee (basis points)');
  ```

**`validateNonZero(value: bigint | number, fieldName?: string): void`**
- Validates value is not zero
- Example:
  ```typescript
  ContractValidator.validateNonZero(amount, 'Amount');
  ```

**`validateArrayNotEmpty<T>(array: T[], fieldName?: string): void`**
- Validates array is not empty
- Example:
  ```typescript
  ContractValidator.validateArrayNotEmpty(tokenIds, 'Token IDs');
  ```

**`validateMultiple(validators: Record<string, () => void>): ValidationResult`**
- Runs multiple validators and collects all errors
- Returns `{ isValid: boolean, errors: string[] }`
- Example:
  ```typescript
  const result = ContractValidator.validateMultiple({
    address: () => ContractValidator.validateAddress(addr),
    price: () => ContractValidator.validatePrice(price),
  });
  if (!result.isValid) throw new Error(result.errors.join(', '));
  ```

---

### ContractErrorFormatter

Location: `src/lib/utils/contract-errors.ts`

Converts ethers.js errors into user-friendly messages.

#### Methods

**`format(error: unknown, defaultMessage?: string): Error`**
- Converts ethers.js error to user-friendly error
- Handles common errors: ACTION_REJECTED, INSUFFICIENT_FUNDS, NONCE_EXPIRED, etc.
- Extracts revert reasons from contract errors
- Returns Error object with formatted message
- Example:
  ```typescript
  try {
    await contract.listNFT(...);
  } catch (error) {
    const userError = ContractErrorFormatter.format(error);
    showErrorToast(userError.message);
  }
  ```

**`isActionRejected(error: unknown): boolean`**
- Type guard for user-rejected transactions
- Returns true if user clicked "Reject" in wallet
- Example:
  ```typescript
  if (ContractErrorFormatter.isActionRejected(error)) {
    // Don't show error toast, user intentionally cancelled
  }
  ```

**`isInsufficientFunds(error: unknown): boolean`**
- Type guard for insufficient balance errors
- Example:
  ```typescript
  if (ContractErrorFormatter.isInsufficientFunds(error)) {
    showError('You do not have enough ETH for this transaction');
  }
  ```

**`extractRevertReason(message: string): string | null`**
- Extracts custom revert reason from contract error
- Parses "execution reverted: {reason}" format
- Returns null if no reason found
- Example:
  ```typescript
  const reason = ContractErrorFormatter.extractRevertReason(error.message);
  // Returns: "Listing expired" or null
  ```

#### Supported Error Types

- `ACTION_REJECTED` - User rejected transaction in wallet
- `INSUFFICIENT_FUNDS` - Not enough ETH/tokens for transaction
- `NONCE_EXPIRED` - Transaction nonce already used (re-submit)
- `REPLACEMENT_UNDERPRICED` - Gas price too low for replacement
- `UNPREDICTABLE_GAS_LIMIT` - Gas estimation failed (likely revert)
- `NETWORK_ERROR` - Network connection issues
- `TIMEOUT` - Transaction took too long
- Contract revert reasons (extracted from execution reverted)

---

### CryptoFormatter

Location: `src/lib/utils/crypto-formatter.ts`

Standardizes formatting for cryptocurrency values, fees, and timestamps.

#### Methods

**`formatPrice(wei: bigint, decimals?: number, showUnit?: boolean): string`**
- Formats Wei to ETH with specified decimals
- Default: 4 decimals, no unit
- Example:
  ```typescript
  CryptoFormatter.formatPrice(ethers.parseEther('1.234567'), 4, true);
  // Returns: "1.2346 ETH"
  ```

**`formatPriceWithSymbol(wei: bigint, symbol?: string, decimals?: number): string`**
- Formats Wei with custom token symbol
- Default: "ETH", 4 decimals
- Example:
  ```typescript
  CryptoFormatter.formatPriceWithSymbol(amount, 'USDC', 2);
  // Returns: "123.45 USDC"
  ```

**`formatFee(basisPoints: number | bigint, decimals?: number, showSymbol?: boolean): string`**
- Converts basis points to percentage
- 100 basis points = 1%
- Default: 2 decimals, show %
- Example:
  ```typescript
  CryptoFormatter.formatFee(250, 2, true);
  // Returns: "2.50%"
  ```

**`formatPercentage(value: number, decimals?: number, showSymbol?: boolean): string`**
- Formats percentage with specified decimals
- Default: 2 decimals, show %
- Example:
  ```typescript
  CryptoFormatter.formatPercentage(12.345, 1, true);
  // Returns: "12.3%"
  ```

**`formatTimestamp(timestamp: bigint | number, format?: 'date' | 'datetime' | 'relative'): string`**
- Formats Unix timestamp to human-readable format
- Supports date, datetime, or relative ("2 hours ago")
- Example:
  ```typescript
  CryptoFormatter.formatTimestamp(Date.now() / 1000, 'datetime');
  // Returns: "Jan 15, 2025 3:45 PM"
  ```

**`formatDuration(seconds: number | bigint): string`**
- Formats duration in seconds to human-readable format
- Example:
  ```typescript
  CryptoFormatter.formatDuration(86400);
  // Returns: "1 day"
  CryptoFormatter.formatDuration(7200);
  // Returns: "2 hours"
  ```

**`formatAddress(address: string, format?: 'short' | 'medium' | 'full'): string`**
- Formats Ethereum address for display
- short: `0x123...789` (6 + 3 chars)
- medium: `0x1234...7890` (8 + 4 chars)
- full: full address
- Example:
  ```typescript
  CryptoFormatter.formatAddress('0x1234567890abcdef...', 'short');
  // Returns: "0x1234...cdef"
  ```

**`formatTokenAmount(amount: bigint, decimals: number, maxDecimals?: number): string`**
- Formats token amount with custom decimals
- Example:
  ```typescript
  CryptoFormatter.formatTokenAmount(BigInt(1234567), 6, 2);
  // Returns: "1.23" (USDC with 6 decimals)
  ```

**`formatCompactNumber(value: number): string`**
- Formats large numbers in compact notation
- Example:
  ```typescript
  CryptoFormatter.formatCompactNumber(1234567);
  // Returns: "1.23M"
  ```

---

### StatusMapper

Location: `src/lib/utils/status-mappers.ts`

Maps numeric status codes from contracts to human-readable strings.

#### Methods

**`mapBundleStatus(statusCode: number): BundleStatus`**
- Maps bundle status code to string
- Values: `ACTIVE` (0), `SOLD` (1), `CANCELLED` (2), `EXPIRED` (3), `UNKNOWN`
- Example:
  ```typescript
  StatusMapper.mapBundleStatus(0);
  // Returns: "ACTIVE"
  ```

**`mapOfferStatus(statusCode: number): OfferStatus`**
- Maps offer status code to string
- Values: `ACTIVE` (0), `ACCEPTED` (1), `CANCELLED` (2), `EXPIRED` (3), `UNKNOWN`
- Example:
  ```typescript
  StatusMapper.mapOfferStatus(1);
  // Returns: "ACCEPTED"
  ```

**`mapAuctionStatus(statusCode: number): AuctionStatus`**
- Maps auction status code to string
- Values: `ACTIVE` (0), `ENDED` (1), `CANCELLED` (2), `UNKNOWN`
- Example:
  ```typescript
  StatusMapper.mapAuctionStatus(0);
  // Returns: "ACTIVE"
  ```

**`mapListingStatus(statusCode: number): ListingStatus`**
- Maps listing status code to string
- Values: `ACTIVE` (0), `SOLD` (1), `CANCELLED` (2), `EXPIRED` (3), `UNKNOWN`
- Example:
  ```typescript
  StatusMapper.mapListingStatus(2);
  // Returns: "CANCELLED"
  ```

**`mapTransactionType(typeCode: number): TransactionType`**
- Maps transaction type code to string
- Values: `LISTING` (0), `SALE` (1), `OFFER` (2), `AUCTION` (3), `BUNDLE` (4), `UNKNOWN`
- Example:
  ```typescript
  StatusMapper.mapTransactionType(1);
  // Returns: "SALE"
  ```

**`getStatusColor(status: string): string`**
- Returns Tailwind CSS color class for status
- Useful for UI status badges
- Example:
  ```typescript
  StatusMapper.getStatusColor('ACTIVE');
  // Returns: "text-green-600 bg-green-50"
  ```

**`getStatusIcon(status: string): string`**
- Returns icon name for status (e.g., for Icon component)
- Example:
  ```typescript
  StatusMapper.getStatusIcon('SOLD');
  // Returns: "check-circle"
  ```

**`isActiveStatus(status: string): boolean`**
- Type guard for active statuses
- Returns true for ACTIVE status
- Example:
  ```typescript
  if (StatusMapper.isActiveStatus(status)) {
    // Show "Purchase" button
  }
  ```

---

### BatchQueries

Location: `src/lib/utils/batch-queries.ts`

Performance optimization utilities for parallel blockchain queries.

#### Methods

**`executeParallel<T>(queries: Array<() => Promise<T>>, config?: BatchQueryConfig): Promise<BatchQueryResult<T>>`**
- Executes queries in parallel with configurable batch size
- Prevents overwhelming RPC with too many simultaneous requests
- Returns results, errors, success/error counts
- Config:
  - `maxBatchSize`: Max parallel queries (default: 10)
  - `delayBetweenBatches`: Delay in ms between batches (default: 0)
  - `stopOnError`: Stop execution on first error (default: false)
- Example:
  ```typescript
  const queries = listingIds.map(id => () => exchangeService.getListing(id));
  const result = await BatchQueries.executeParallel(queries, { maxBatchSize: 5 });
  console.log(`Success: ${result.successCount}, Errors: ${result.errorCount}`);
  ```

**`executeSequential<T>(queries: Array<() => Promise<T>>, delayMs?: number): Promise<BatchQueryResult<T>>`**
- Executes queries one at a time
- Optional delay between queries
- Useful for rate-limited APIs
- Example:
  ```typescript
  const result = await BatchQueries.executeSequential(queries, 100); // 100ms delay
  ```

**`retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>`**
- Retries failed operations with exponential backoff
- Options:
  - `maxRetries`: Max retry attempts (default: 3)
  - `delayMs`: Initial delay (default: 1000ms)
  - `backoffMultiplier`: Backoff multiplier (default: 2)
  - `shouldRetry`: Custom retry condition function
- Example:
  ```typescript
  const listing = await BatchQueries.retry(
    () => exchangeService.getListing(id),
    { maxRetries: 5, delayMs: 500 }
  );
  ```

**`asyncMap<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>, config?: BatchQueryConfig): Promise<R[]>`**
- Maps array with async function in parallel batches
- Replacement for `Promise.all(items.map(fn))`
- Respects batch size limits
- Example:
  ```typescript
  const listings = await asyncMap(
    listingIds,
    (id) => exchangeService.getListing(id),
    { maxBatchSize: 10 }
  );
  ```

**`asyncFilter<T>(items: T[], predicate: (item: T, index: number) => Promise<boolean>): Promise<T[]>`**
- Filters array with async predicate
- Example:
  ```typescript
  const activeListings = await asyncFilter(
    listings,
    async (l) => (await exchangeService.getListingStatus(l.id)) === 0
  );
  ```

**`chunk<T>(array: T[], size: number): T[][]`**
- Splits array into chunks of specified size
- Example:
  ```typescript
  const batches = BatchQueries.chunk(listingIds, 10);
  // [[1,2,3,...10], [11,12,...20], ...]
  ```

#### Types

```typescript
interface BatchQueryConfig {
  maxBatchSize?: number;
  delayBetweenBatches?: number;
  stopOnError?: boolean;
}

interface BatchQueryResult<T> {
  results: T[];
  errors: Array<{ index: number; error: Error }>;
  successCount: number;
  errorCount: number;
}

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}
```

---

### PerformanceMonitor

Location: `src/lib/utils/performance-monitor.ts`

Tracks and analyzes service performance for optimization.

#### Methods

**`recordMetric(operation: string, duration: number, metadata?: Record<string, unknown>): void`**
- Records performance metric for an operation
- Duration in milliseconds
- Example:
  ```typescript
  const start = Date.now();
  await exchangeService.listNFT({ ... });
  performanceMonitor.recordMetric('listNFT', Date.now() - start, { userId: '0x123' });
  ```

**`startTimer(operationId: string): void`**
- Starts a timer for an operation
- Use with `endTimer()` for automatic duration tracking
- Example:
  ```typescript
  performanceMonitor.startTimer('fetch-listings');
  const listings = await fetchListings();
  performanceMonitor.endTimer('fetch-listings', 'Fetched listings');
  ```

**`endTimer(operationId: string, operation?: string, metadata?: Record<string, unknown>): number`**
- Ends timer and records metric
- Returns duration in milliseconds
- Example:
  ```typescript
  const duration = performanceMonitor.endTimer('fetch-listings');
  console.log(`Operation took ${duration}ms`);
  ```

**`getMetrics(operation?: string): PerformanceMetric[]`**
- Gets all recorded metrics, optionally filtered by operation
- Example:
  ```typescript
  const listNFTMetrics = performanceMonitor.getMetrics('listNFT');
  ```

**`getAverageTime(operation: string): number`**
- Gets average duration for an operation
- Returns 0 if no metrics found
- Example:
  ```typescript
  const avgTime = performanceMonitor.getAverageTime('getListing');
  console.log(`Average: ${avgTime}ms`);
  ```

**`getSlowOperations(thresholdMs?: number): PerformanceMetric[]`**
- Gets operations slower than threshold
- Default threshold: 2000ms (2 seconds)
- Example:
  ```typescript
  const slowOps = performanceMonitor.getSlowOperations(1000);
  slowOps.forEach(op => console.log(`Slow: ${op.operation} (${op.duration}ms)`));
  ```

**`clearMetrics(): void`**
- Clears all recorded metrics
- Example:
  ```typescript
  performanceMonitor.clearMetrics();
  ```

**`getRecommendations(): string[]`**
- Analyzes metrics and provides optimization recommendations
- Detects N+1 patterns, slow operations, cache opportunities
- Example:
  ```typescript
  const recommendations = performanceMonitor.getRecommendations();
  recommendations.forEach(rec => console.log(rec));
  // "Consider batch loading for getListing (called 50 times)"
  ```

**`exportMetrics(): string`**
- Exports metrics as JSON string
- Useful for debugging and analysis
- Example:
  ```typescript
  const json = performanceMonitor.exportMetrics();
  downloadFile('metrics.json', json);
  ```

#### Configuration

```typescript
const monitor = new PerformanceMonitor({
  slowQueryThreshold: 2000,  // Consider operations > 2s as slow
  maxMetrics: 1000,          // Keep max 1000 metrics in memory
  enableLogging: true,       // Log slow queries automatically
});
```

#### Types

```typescript
interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
```

---

## Service Validators

### ServiceValidator

Location: `src/lib/services/contracts/validators/ServiceValidator.ts`

High-level business logic validation combining ContractValidator with domain rules.

#### Methods

**`validateListingParams(params: ListingParams): ValidationResult`**
- Validates NFT listing parameters
- Checks: contract address, token ID, price, duration, payment token
- Example:
  ```typescript
  const result = ServiceValidator.validateListingParams({
    contractAddress: '0x123...',
    tokenId: '1',
    price: '1.5',
    duration: 86400,
  });
  if (!result.isValid) throw new Error(result.errors.join(', '));
  ```

**`validateOfferParams(params: OfferParams): ValidationResult`**
- Validates offer parameters
- Checks: collection address, token ID (optional), price, expiration
- Validates expiration is in future
- Example:
  ```typescript
  const result = ServiceValidator.validateOfferParams({
    collectionAddress: '0x123...',
    offerPrice: '2.0',
    expirationTime: Math.floor(Date.now() / 1000) + 86400,
  });
  ```

**`validateAuctionParams(params: AuctionParams): ValidationResult`**
- Validates auction parameters
- Checks: contract address, token ID, starting price, duration, reserve price
- Validates reserve >= starting price
- Example:
  ```typescript
  const result = ServiceValidator.validateAuctionParams({
    contractAddress: '0x123...',
    tokenId: '1',
    startingPrice: '1.0',
    reservePrice: '2.0',
    duration: 86400,
  });
  ```

**`validateBundleParams(params: BundleParams): ValidationResult`**
- Validates bundle parameters
- Checks: items array, price, duration
- Validates all items have valid addresses and token IDs
- Example:
  ```typescript
  const result = ServiceValidator.validateBundleParams({
    items: [
      { contractAddress: '0x123...', tokenId: '1', amount: 1 },
      { contractAddress: '0x456...', tokenId: '2', amount: 1 },
    ],
    price: '5.0',
    duration: 86400,
  });
  ```

**`validateBidParams(params: BidParams): ValidationResult`**
- Validates auction bid parameters
- Checks: auction ID, bid amount
- Example:
  ```typescript
  const result = ServiceValidator.validateBidParams({
    auctionId: '1',
    bidAmount: '3.0',
  });
  ```

**`validateRoyaltyParams(params: RoyaltyParams): ValidationResult`**
- Validates royalty configuration
- Checks: collection address, recipient, royalty percentage (0-100%)
- Example:
  ```typescript
  const result = ServiceValidator.validateRoyaltyParams({
    collectionAddress: '0x123...',
    recipient: '0x456...',
    royaltyPercentage: 5,
  });
  ```

#### Types

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ListingParams {
  contractAddress: string;
  tokenId: string | number | bigint;
  price: string;
  duration: number;
  paymentToken?: string;
}

interface OfferParams {
  collectionAddress: string;
  tokenId?: string | number | bigint;
  offerPrice: string;
  expirationTime: number;
  paymentToken?: string;
}

// ... (other param interfaces)
```

---

## Base Classes

### BaseContractService

Location: `src/lib/services/contracts/base/BaseContractService.ts`

Abstract base class for all contract services. Standardizes initialization, provider/signer management, and contract instantiation.

#### Properties

```typescript
protected provider: ethers.Provider | null = null;
protected signer: ethers.Signer | null = null;
protected contractAddress: string | null = null;

abstract readonly contractName: string;
abstract readonly defaultAbiName: string;
```

#### Methods

**`abstract initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void>`**
- Must be implemented by subclasses
- Initializes the service with provider and signer
- Example implementation:
  ```typescript
  async initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    await this.fetchContractAddress();
  }
  ```

**`protected abstract fetchContractAddress(): Promise<void>`**
- Must be implemented by subclasses
- Fetches contract address from MarketplaceHub or other source
- Example implementation:
  ```typescript
  protected async fetchContractAddress(): Promise<void> {
    const addresses = await userHubService.getAddresses();
    this.contractAddress = addresses.erc721Exchange;
  }
  ```

**`protected async getContract(abiName?: string, address?: string): Promise<ethers.Contract>`**
- Gets contract instance with ABI and signer
- Uses default ABI name if not specified
- Uses stored contract address if not specified
- Example:
  ```typescript
  const contract = await this.getContract(); // Uses defaults
  const otherContract = await this.getContract('OtherABI', '0x123...');
  ```

**`protected getSigner(): ethers.Signer`**
- Gets signer or throws if not available
- Use this instead of directly accessing `this.signer`
- Example:
  ```typescript
  const signer = this.getSigner();
  const contract = new ethers.Contract(address, abi, signer);
  ```

**`protected getProvider(): ethers.Provider`**
- Gets provider or throws if not available
- Example:
  ```typescript
  const provider = this.getProvider();
  const blockNumber = await provider.getBlockNumber();
  ```

**`protected getContractAddress(): string`**
- Gets contract address or throws if not set
- Example:
  ```typescript
  const address = this.getContractAddress();
  console.log(`Contract at ${address}`);
  ```

**`isInitialized(): boolean`**
- Checks if service is initialized
- Example:
  ```typescript
  if (!exchangeService.isInitialized()) {
    await initializeServices(provider, signer);
  }
  ```

#### Usage Example

```typescript
export class ExchangeService extends BaseContractService {
  readonly contractName = "ERC721NFTExchange";
  readonly defaultAbiName = "ERC721NFTExchange";

  async initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    await this.fetchContractAddress();
    logger.success(`${this.contractName} initialized`);
  }

  protected async fetchContractAddress(): Promise<void> {
    const addresses = await userHubService.getAddresses();
    this.contractAddress = addresses.erc721Exchange;
  }

  async listNFT(params: ListingParams): Promise<string> {
    // Use inherited methods
    const contract = await this.getContract();
    const signer = this.getSigner();

    // Call contract
    const tx = await contract.listNFT(...);
    await tx.wait();
    return tx.hash;
  }
}

export const exchangeService = new ExchangeService();
```

---

## Type Definitions

### Contract Types

Location: `src/types/contract-types.ts`

Comprehensive type definitions for all contract interactions.

#### Core Types

**`ContractLog`**
```typescript
interface ContractLog {
  eventName?: string;
  args?: Record<string, unknown>;
  topics: string[];
  data: string;
  index: number;
  blockNumber: number;
  transactionHash: string;
  address: string;
}
```

**`RawContractListing`**
```typescript
interface RawContractListing {
  listingId: bigint;
  seller: string;
  contractAddress: string;
  tokenId: bigint;
  amount: bigint;
  price: bigint;
  paymentToken: string;
  expirationTime: bigint;
  isActive: boolean;
}
```

**`RawContractOffer`**
```typescript
interface RawContractOffer {
  offerId: bigint;
  buyer: string;
  collectionAddress: string;
  tokenId: bigint;
  offerPrice: bigint;
  paymentToken: string;
  expirationTime: bigint;
  status: number;
}
```

**`RawContractBid`**
```typescript
interface RawContractBid {
  bidder: string;
  amount: bigint;
  timestamp: bigint;
}
```

**`RawContractAuction`**
```typescript
interface RawContractAuction {
  auctionId: bigint;
  seller: string;
  contractAddress: string;
  tokenId: bigint;
  startingPrice: bigint;
  reservePrice: bigint;
  currentBid: bigint;
  currentBidder: string;
  startTime: bigint;
  endTime: bigint;
  status: number;
}
```

**`RawBundleItem`**
```typescript
interface RawBundleItem {
  contractAddress: string;
  tokenId: bigint;
  amount: bigint;
  tokenType: number; // 721 or 1155
}
```

**`RawContractBundle`**
```typescript
interface RawContractBundle {
  bundleId: bigint;
  seller: string;
  items: RawBundleItem[];
  price: bigint;
  paymentToken: string;
  expirationTime: bigint;
  status: number;
}
```

**`RawFeeConfig`**
```typescript
interface RawFeeConfig {
  platformFeeBps: bigint;
  minPlatformFee: bigint;
  maxPlatformFee: bigint;
}
```

**`RawRoyaltyRecipient`**
```typescript
interface RawRoyaltyRecipient {
  recipient: string;
  basisPoints: bigint;
}
```

**`RawTransactionRecord`**
```typescript
interface RawTransactionRecord {
  transactionId: bigint;
  transactionType: number;
  buyer: string;
  seller: string;
  contractAddress: string;
  tokenId: bigint;
  price: bigint;
  timestamp: bigint;
}
```

**`RawPricePoint`**
```typescript
interface RawPricePoint {
  price: bigint;
  timestamp: bigint;
}
```

#### Type Guards

```typescript
function isContractLog(obj: unknown): obj is ContractLog;
function isRawContractListing(obj: unknown): obj is RawContractListing;
function isRawContractOffer(obj: unknown): obj is RawContractOffer;
function isRawContractAuction(obj: unknown): obj is RawContractAuction;
function isRawContractBundle(obj: unknown): obj is RawContractBundle;
```

#### Status Enums

```typescript
type BundleStatus = "ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED" | "UNKNOWN";
type OfferStatus = "ACTIVE" | "ACCEPTED" | "CANCELLED" | "EXPIRED" | "UNKNOWN";
type AuctionStatus = "ACTIVE" | "ENDED" | "CANCELLED" | "UNKNOWN";
type ListingStatus = "ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED" | "UNKNOWN";
type TransactionType = "LISTING" | "SALE" | "OFFER" | "AUCTION" | "BUNDLE" | "UNKNOWN";
```

---

## Core Services

### MarketplaceHubService

Location: `src/lib/services/contracts/core/MarketplaceHubService.ts`

Central hub for address discovery and fee calculations. **Must be initialized first**.

#### Methods

**`initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void>`**
- Initializes the hub service
- Example:
  ```typescript
  await marketplaceHubService.initialize(provider, signer);
  ```

**`getAddresses(): Promise<ContractAddresses>`**
- Gets all contract addresses from hub
- Returns object with all contract addresses
- Example:
  ```typescript
  const addresses = await marketplaceHubService.getAddresses();
  console.log(addresses.erc721Exchange);
  ```

**`calculateFees(nftAddress: string, tokenId: string, salePrice: string): Promise<FeeBreakdown>`**
- Calculates all fees for a transaction
- Returns platform fee, royalty, net amount
- Example:
  ```typescript
  const fees = await marketplaceHubService.calculateFees(
    '0x123...',
    '1',
    '10.0'
  );
  console.log(`Platform fee: ${fees.platformFee} ETH`);
  console.log(`Royalty: ${fees.royalty} ETH`);
  console.log(`Seller receives: ${fees.netAmount} ETH`);
  ```

**`isPaused(): Promise<boolean>`**
- Checks if marketplace is paused
- Example:
  ```typescript
  const paused = await marketplaceHubService.isPaused();
  if (paused) showError('Marketplace is paused');
  ```

**`getVersion(): Promise<string>`**
- Gets hub contract version
- Example:
  ```typescript
  const version = await marketplaceHubService.getVersion();
  console.log(`Hub version: ${version}`);
  ```

---

### ExchangeService

Location: `src/lib/services/contracts/core/ExchangeService.ts`

Handles NFT listings and purchases for ERC721 and ERC1155 tokens.

#### Methods

**`listNFT(params: ListingParams): Promise<string>`**
- Creates a new NFT listing
- Returns transaction hash
- Example:
  ```typescript
  const txHash = await exchangeService.listNFT({
    contractAddress: '0x123...',
    tokenId: '1',
    price: '1.5',
    duration: 86400, // 1 day
    paymentToken: ethers.ZeroAddress, // ETH
  });
  ```

**`purchaseNFT(listingId: string, price: string): Promise<string>`**
- Purchases an NFT from a listing
- Returns transaction hash
- Example:
  ```typescript
  const txHash = await exchangeService.purchaseNFT('42', '1.5');
  ```

**`cancelListing(listingId: string): Promise<string>`**
- Cancels an active listing
- Returns transaction hash
- Example:
  ```typescript
  const txHash = await exchangeService.cancelListing('42');
  ```

**`getListing(listingId: string): Promise<ListingData>`**
- Gets listing details
- Returns formatted listing data
- Example:
  ```typescript
  const listing = await exchangeService.getListing('42');
  console.log(`Price: ${listing.price} ETH`);
  console.log(`Seller: ${listing.seller}`);
  ```

**`getActiveListings(limit?: number, offset?: number): Promise<ListingData[]>`**
- Gets all active listings with pagination
- Example:
  ```typescript
  const listings = await exchangeService.getActiveListings(20, 0);
  ```

**`getUserListings(userAddress: string): Promise<ListingData[]>`**
- Gets all listings created by a user
- Example:
  ```typescript
  const myListings = await exchangeService.getUserListings(address);
  ```

**`getListingsByCollection(collectionAddress: string): Promise<ListingData[]>`**
- Gets all listings for a collection
- Example:
  ```typescript
  const listings = await exchangeService.getListingsByCollection('0x123...');
  ```

---

### AuctionService

Location: `src/lib/services/contracts/core/AuctionService.ts`

Handles English and Dutch auction creation, bidding, and settlement.

#### Methods

**`createAuction(params: AuctionParams): Promise<string>`**
- Creates a new auction
- Returns transaction hash
- Example:
  ```typescript
  const txHash = await auctionService.createAuction({
    contractAddress: '0x123...',
    tokenId: '1',
    startingPrice: '1.0',
    reservePrice: '2.0',
    duration: 86400,
  });
  ```

**`placeBid(auctionId: string, bidAmount: string): Promise<string>`**
- Places a bid on an auction
- Returns transaction hash
- Example:
  ```typescript
  const txHash = await auctionService.placeBid('42', '3.0');
  ```

**`endAuction(auctionId: string): Promise<string>`**
- Ends an auction (anyone can call after end time)
- Returns transaction hash
- Example:
  ```typescript
  const txHash = await auctionService.endAuction('42');
  ```

**`cancelAuction(auctionId: string): Promise<string>`**
- Cancels an auction (only seller, before first bid)
- Returns transaction hash
- Example:
  ```typescript
  const txHash = await auctionService.cancelAuction('42');
  ```

**`getAuction(auctionId: string): Promise<AuctionData>`**
- Gets auction details
- Returns formatted auction data
- Example:
  ```typescript
  const auction = await auctionService.getAuction('42');
  console.log(`Current bid: ${auction.currentBid} ETH`);
  console.log(`Bidder: ${auction.currentBidder}`);
  ```

**`getAuctionBids(auctionId: string): Promise<BidData[]>`**
- Gets all bids for an auction
- Returns array of bids
- Example:
  ```typescript
  const bids = await auctionService.getAuctionBids('42');
  bids.forEach(bid => console.log(`${bid.bidder}: ${bid.amount} ETH`));
  ```

**`getActiveAuctions(): Promise<AuctionData[]>`**
- Gets all active auctions
- Example:
  ```typescript
  const auctions = await auctionService.getActiveAuctions();
  ```

---

## Constants

### Contract Constants

Location: `src/lib/constants/contracts.ts`

```typescript
export const CONTRACT_CONSTANTS = {
  BASIS_POINTS: 10000,        // 100% = 10000 basis points
  MAX_ROYALTY_BPS: 1000,      // Max 10% royalty
  MAX_PLATFORM_FEE_BPS: 500,  // Max 5% platform fee
  MIN_LISTING_DURATION: 3600, // 1 hour
  MAX_LISTING_DURATION: 31536000, // 1 year
  ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
} as const;
```

---

## Usage Patterns

### Pattern 1: Initialize All Services

```typescript
import { initializeServices } from '@/lib/services/contracts';
import { BrowserProvider } from 'ethers';

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

await initializeServices(provider, signer);
```

### Pattern 2: Validate Before Transaction

```typescript
import { ServiceValidator } from '@/lib/services/contracts/validators/ServiceValidator';
import { ContractErrorFormatter } from '@/lib/utils/contract-errors';

// Validate input
const validation = ServiceValidator.validateListingParams(params);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}

// Call service
try {
  const txHash = await exchangeService.listNFT(params);
} catch (error) {
  const userError = ContractErrorFormatter.format(error);
  showErrorToast(userError.message);
}
```

### Pattern 3: Format and Display Data

```typescript
import { CryptoFormatter } from '@/lib/utils/crypto-formatter';
import { StatusMapper } from '@/lib/utils/status-mappers';

const listing = await exchangeService.getListing(listingId);

const displayData = {
  price: CryptoFormatter.formatPrice(listing.priceInWei, 4, true),
  status: StatusMapper.mapListingStatus(listing.statusCode),
  statusColor: StatusMapper.getStatusColor(listing.status),
  expiration: CryptoFormatter.formatTimestamp(listing.expirationTime, 'relative'),
  seller: CryptoFormatter.formatAddress(listing.seller, 'short'),
};
```

### Pattern 4: Batch Operations

```typescript
import { BatchQueries } from '@/lib/utils/batch-queries';

// Fetch multiple listings in parallel
const listings = await asyncMap(
  listingIds,
  (id) => exchangeService.getListing(id),
  { maxBatchSize: 10 }
);

// With retry logic
const listingsWithRetry = await Promise.all(
  listingIds.map(id =>
    BatchQueries.retry(() => exchangeService.getListing(id), { maxRetries: 3 })
  )
);
```

### Pattern 5: Performance Monitoring

```typescript
import { performanceMonitor } from '@/lib/utils/performance-monitor';

performanceMonitor.startTimer('fetch-user-listings');
const listings = await exchangeService.getUserListings(address);
performanceMonitor.endTimer('fetch-user-listings', 'Fetched user listings');

// Later, analyze performance
const avgTime = performanceMonitor.getAverageTime('fetch-user-listings');
const recommendations = performanceMonitor.getRecommendations();
```

---

## Error Handling

### Standard Error Pattern

```typescript
import { ContractErrorFormatter } from '@/lib/utils/contract-errors';
import { logger } from '@/lib/utils/logger';

try {
  await exchangeService.listNFT(params);
} catch (error) {
  // Log error with context
  logger.error('Failed to create listing', error, {
    component: 'ListingForm',
    action: 'createListing',
  });

  // Format for user
  const userError = ContractErrorFormatter.format(error);

  // Handle specific errors
  if (ContractErrorFormatter.isActionRejected(error)) {
    // User cancelled - don't show error
    return;
  }

  if (ContractErrorFormatter.isInsufficientFunds(error)) {
    showError('Insufficient ETH for this transaction');
    return;
  }

  // Show generic error
  showError(userError.message);
}
```

---

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { ContractValidator } from '@/lib/utils/validators';

describe('ContractValidator', () => {
  describe('validateAddress', () => {
    it('should accept valid addresses', () => {
      expect(() =>
        ContractValidator.validateAddress('0x' + '1'.repeat(40))
      ).not.toThrow();
    });

    it('should reject invalid addresses', () => {
      expect(() => ContractValidator.validateAddress('0x123')).toThrow(
        'not a valid Ethereum address'
      );
    });
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { exchangeService } from '@/lib/services/contracts';

describe('ExchangeService', () => {
  beforeAll(async () => {
    // Setup test provider and initialize
    await initializeServices(testProvider, testSigner);
  });

  it('should create and retrieve a listing', async () => {
    const txHash = await exchangeService.listNFT({
      contractAddress: TEST_NFT_ADDRESS,
      tokenId: '1',
      price: '1.0',
      duration: 86400,
    });

    expect(txHash).toBeTruthy();

    const listing = await exchangeService.getListing(listingId);
    expect(listing.seller).toBe(await testSigner.getAddress());
  });
});
```

---

## Documentation Standards

See `docs/JSDOC-STANDARDS.md` for complete JSDoc documentation standards.

### Basic JSDoc Template

```typescript
/**
 * Brief one-line description of what this function does
 *
 * @param paramName - Description of the parameter
 * @returns Description of what is returned
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * ```typescript
 * const result = await myFunction('value');
 * ```
 */
```

---

## Additional Resources

- **Testing Guide**: `docs/TESTING-GUIDE.md`
- **JSDoc Standards**: `docs/JSDOC-STANDARDS.md`
- **Migration Guide**: `docs/PHASE-4-MIGRATION-GUIDE.md`
- **Refactoring Summary**: `docs/REFACTORING-SUMMARY.md`
- **Main Documentation**: `CLAUDE.md`

---

*Last updated: Phase 6 - Documentation & Testing*
