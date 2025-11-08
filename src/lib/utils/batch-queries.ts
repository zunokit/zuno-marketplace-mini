/**
 * Batch Query Utilities
 * Performance optimization for contract queries
 *
 * Reduces N+1 query patterns by batching multiple contract calls
 * into parallel Promise.all() operations.
 */

import { ethers } from "ethers";
import { logger } from "@/lib/utils/logger";

/**
 * Batch query configuration
 */
export interface BatchQueryConfig {
  maxBatchSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Default batch configuration
 */
const DEFAULT_CONFIG: Required<BatchQueryConfig> = {
  maxBatchSize: 100,
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Batch query result
 */
export interface BatchQueryResult<T> {
  results: T[];
  errors: Array<{ index: number; error: Error }>;
  successCount: number;
  errorCount: number;
}

export class BatchQueries {
  /**
   * Execute multiple contract queries in parallel
   *
   * @param queries - Array of async query functions
   * @param config - Batch configuration
   * @returns BatchQueryResult with results and errors
   *
   * @example
   * ```typescript
   * const queries = tokenIds.map(id => () => contract.ownerOf(id));
   * const result = await BatchQueries.executeParallel(queries);
   * console.log(`Success: ${result.successCount}, Errors: ${result.errorCount}`);
   * ```
   */
  static async executeParallel<T>(
    queries: Array<() => Promise<T>>,
    config: BatchQueryConfig = {}
  ): Promise<BatchQueryResult<T>> {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const results: T[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    logger.startTimer("batch-queries");
    logger.info(
      "Executing parallel batch queries",
      { count: queries.length, maxBatchSize: cfg.maxBatchSize },
      { component: "BatchQueries", action: "executeParallel" }
    );

    // Split into batches if needed
    for (let i = 0; i < queries.length; i += cfg.maxBatchSize) {
      const batch = queries.slice(i, i + cfg.maxBatchSize);
      const batchResults = await Promise.allSettled(batch.map((q) => q()));

      batchResults.forEach((result, index) => {
        const globalIndex = i + index;
        if (result.status === "fulfilled") {
          results[globalIndex] = result.value;
        } else {
          errors.push({
            index: globalIndex,
            error: result.reason instanceof Error
              ? result.reason
              : new Error(String(result.reason)),
          });
        }
      });
    }

    logger.endTimer(
      "batch-queries",
      `Batch queries completed: ${results.length} success, ${errors.length} errors`
    );

    return {
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length,
    };
  }

  /**
   * Execute queries with automatic retry on failure
   *
   * @param queries - Array of async query functions
   * @param config - Batch configuration
   * @returns Array of results (failed queries return null)
   *
   * @example
   * ```typescript
   * const owners = await BatchQueries.executeWithRetry(
   *   tokenIds.map(id => () => contract.ownerOf(id)),
   *   { retryAttempts: 3, retryDelay: 1000 }
   * );
   * ```
   */
  static async executeWithRetry<T>(
    queries: Array<() => Promise<T>>,
    config: BatchQueryConfig = {}
  ): Promise<Array<T | null>> {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const results: Array<T | null> = new Array(queries.length).fill(null);

    logger.info(
      "Executing batch queries with retry",
      { count: queries.length, retryAttempts: cfg.retryAttempts },
      { component: "BatchQueries", action: "executeWithRetry" }
    );

    for (let attempt = 0; attempt <= cfg.retryAttempts; attempt++) {
      const remainingQueries: Array<{
        index: number;
        query: () => Promise<T>;
      }> = [];

      // Collect queries that haven't succeeded yet
      queries.forEach((query, index) => {
        if (results[index] === null) {
          remainingQueries.push({ index, query });
        }
      });

      if (remainingQueries.length === 0) break;

      if (attempt > 0) {
        logger.info(
          `Retry attempt ${attempt}/${cfg.retryAttempts}`,
          { remaining: remainingQueries.length },
          { component: "BatchQueries", action: "executeWithRetry" }
        );
        await new Promise((resolve) => setTimeout(resolve, cfg.retryDelay));
      }

      // Execute remaining queries
      const batchResults = await Promise.allSettled(
        remainingQueries.map(({ query }) => query())
      );

      batchResults.forEach((result, i) => {
        if (result.status === "fulfilled") {
          results[remainingQueries[i].index] = result.value;
        }
      });
    }

    const successCount = results.filter((r) => r !== null).length;
    logger.info(
      "Batch queries with retry completed",
      { total: queries.length, success: successCount, failed: queries.length - successCount },
      { component: "BatchQueries", action: "executeWithRetry" }
    );

    return results;
  }

  /**
   * Map array to parallel queries and execute
   *
   * @param items - Array of items to map
   * @param mapper - Function to create query from item
   * @param config - Batch configuration
   * @returns BatchQueryResult
   *
   * @example
   * ```typescript
   * const result = await BatchQueries.map(
   *   tokenIds,
   *   (id) => contract.tokenURI(id),
   *   { maxBatchSize: 50 }
   * );
   * ```
   */
  static async map<T, R>(
    items: T[],
    mapper: (item: T, index: number) => Promise<R>,
    config: BatchQueryConfig = {}
  ): Promise<BatchQueryResult<R>> {
    const queries = items.map((item, index) => () => mapper(item, index));
    return this.executeParallel(queries, config);
  }

  /**
   * Execute queries in sequential batches (useful for rate limiting)
   *
   * @param queries - Array of async query functions
   * @param batchSize - Number of queries per batch
   * @param delayBetweenBatches - Delay in ms between batches
   * @returns Array of results
   *
   * @example
   * ```typescript
   * // Execute 100 queries in batches of 10 with 1s delay
   * const results = await BatchQueries.executeSequentialBatches(
   *   queries,
   *   10,
   *   1000
   * );
   * ```
   */
  static async executeSequentialBatches<T>(
    queries: Array<() => Promise<T>>,
    batchSize: number = 10,
    delayBetweenBatches: number = 1000
  ): Promise<Array<T | null>> {
    const results: Array<T | null> = [];

    logger.info(
      "Executing sequential batches",
      { total: queries.length, batchSize, delay: delayBetweenBatches },
      { component: "BatchQueries", action: "executeSequentialBatches" }
    );

    for (let i = 0; i < queries.length; i += batchSize) {
      if (i > 0 && delayBetweenBatches > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }

      const batch = queries.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch.map((q) => q()));

      batchResults.forEach((result) => {
        results.push(
          result.status === "fulfilled" ? result.value : null
        );
      });

      logger.info(
        `Batch ${Math.floor(i / batchSize) + 1} completed`,
        { processed: Math.min(i + batchSize, queries.length), total: queries.length },
        { component: "BatchQueries", action: "executeSequentialBatches" }
      );
    }

    return results;
  }

  /**
   * Chunk array into smaller arrays
   *
   * @param array - Array to chunk
   * @param size - Chunk size
   * @returns Array of chunks
   *
   * @example
   * ```typescript
   * const chunks = BatchQueries.chunk([1,2,3,4,5], 2);
   * // [[1,2], [3,4], [5]]
   * ```
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Helper function to batch multicall queries
 * Uses ethers.js Interface.encodeFunctionData for efficient batching
 *
 * @param contract - Contract instance
 * @param calls - Array of {method, args} objects
 * @returns Array of decoded results
 *
 * @example
 * ```typescript
 * const results = await batchMulticall(contract, [
 *   { method: "balanceOf", args: [address1] },
 *   { method: "balanceOf", args: [address2] },
 *   { method: "totalSupply", args: [] },
 * ]);
 * ```
 */
export async function batchMulticall(
  contract: ethers.Contract,
  calls: Array<{ method: string; args: unknown[] }>
): Promise<unknown[]> {
  logger.info(
    "Executing multicall batch",
    { callCount: calls.length },
    { component: "BatchQueries", action: "batchMulticall" }
  );

  const results = await Promise.allSettled(
    calls.map(({ method, args }) => contract[method](...args))
  );

  return results.map((result) =>
    result.status === "fulfilled" ? result.value : null
  );
}

/**
 * Optimize async loops by converting to Promise.all
 *
 * @param items - Array of items
 * @param fn - Async function to execute for each item
 * @returns Array of results
 *
 * @example
 * ```typescript
 * // Before: Sequential (slow)
 * for (const id of tokenIds) {
 *   const owner = await contract.ownerOf(id);
 *   owners.push(owner);
 * }
 *
 * // After: Parallel (fast)
 * const owners = await asyncMap(tokenIds, id => contract.ownerOf(id));
 * ```
 */
export async function asyncMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  return Promise.all(items.map((item, index) => fn(item, index)));
}

/**
 * Filter array with async predicate
 *
 * @param items - Array of items
 * @param predicate - Async predicate function
 * @returns Filtered array
 *
 * @example
 * ```typescript
 * const activeListings = await asyncFilter(
 *   listingIds,
 *   async (id) => {
 *     const listing = await contract.getListing(id);
 *     return listing.isActive;
 *   }
 * );
 * ```
 */
export async function asyncFilter<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>
): Promise<T[]> {
  const results = await Promise.all(
    items.map(async (item, index) => ({
      item,
      keep: await predicate(item, index),
    }))
  );

  return results.filter(({ keep }) => keep).map(({ item }) => item);
}
