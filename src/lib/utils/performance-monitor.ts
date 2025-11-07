/**
 * Performance Monitor Utility
 * Track and optimize contract service performance
 *
 * Features:
 * - Query performance tracking
 * - Cache hit rate monitoring
 * - Slow query detection
 * - Performance recommendations
 */

import { logger } from "@/lib/utils/logger";

/**
 * Performance metric
 */
export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  operation: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private slowQueryThreshold = 1000; // ms
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Record a performance metric
   *
   * @param operation - Operation name
   * @param duration - Duration in ms
   * @param metadata - Optional metadata
   *
   * @example
   * ```typescript
   * performanceMonitor.recordMetric("getUserListings", 250, { userId: "0x123" });
   * ```
   */
  recordMetric(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      logger.warn(
        `Slow query detected: ${operation}`,
        { duration, threshold: this.slowQueryThreshold, metadata },
        { component: "PerformanceMonitor", action: "recordMetric" }
      );
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Get statistics for a specific operation
   *
   * @param operation - Operation name
   * @returns Performance statistics
   */
  getStats(operation: string): PerformanceStats | null {
    const operationMetrics = this.metrics.filter((m) => m.operation === operation);

    if (operationMetrics.length === 0) {
      return null;
    }

    const durations = operationMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      operation,
      count: operationMetrics.length,
      totalDuration,
      avgDuration: totalDuration / operationMetrics.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[Math.floor(durations.length * 0.95)] || durations[durations.length - 1],
    };
  }

  /**
   * Get statistics for all operations
   *
   * @returns Array of performance statistics
   */
  getAllStats(): PerformanceStats[] {
    const operations = [...new Set(this.metrics.map((m) => m.operation))];
    return operations
      .map((op) => this.getStats(op))
      .filter((stats): stats is PerformanceStats => stats !== null)
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Get cache statistics
   *
   * @returns Cache statistics
   */
  getCacheStats(): CacheStats {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
      size: this.metrics.length,
    };
  }

  /**
   * Get slow queries (above threshold)
   *
   * @param threshold - Optional custom threshold in ms
   * @returns Array of slow query metrics
   */
  getSlowQueries(threshold?: number): PerformanceMetric[] {
    const th = threshold || this.slowQueryThreshold;
    return this.metrics
      .filter((m) => m.duration > th)
      .sort((a, b) => b.duration - a.duration);
  }

  /**
   * Get performance recommendations
   *
   * @returns Array of recommendation strings
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getAllStats();
    const cacheStats = this.getCacheStats();

    // Check for slow operations
    stats.forEach((stat) => {
      if (stat.avgDuration > this.slowQueryThreshold) {
        recommendations.push(
          `⚠️  ${stat.operation} is slow (avg: ${stat.avgDuration.toFixed(0)}ms). Consider optimization.`
        );
      }

      if (stat.p95Duration > this.slowQueryThreshold * 2) {
        recommendations.push(
          `⚠️  ${stat.operation} has high P95 latency (${stat.p95Duration.toFixed(0)}ms). Check for outliers.`
        );
      }
    });

    // Check cache hit rate
    if (cacheStats.hitRate < 0.7 && cacheStats.hits + cacheStats.misses > 10) {
      recommendations.push(
        `⚠️  Low cache hit rate (${(cacheStats.hitRate * 100).toFixed(1)}%). Consider increasing cache size or TTL.`
      );
    }

    // Check for N+1 patterns
    const multipleCallOps = stats.filter((s) => s.count > 10 && s.avgDuration < 100);
    if (multipleCallOps.length > 0) {
      multipleCallOps.forEach((op) => {
        recommendations.push(
          `💡 ${op.operation} called ${op.count} times. Consider batching these calls.`
        );
      });
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ No performance issues detected.");
    }

    return recommendations;
  }

  /**
   * Generate performance report
   *
   * @returns Performance report string
   */
  generateReport(): string {
    const stats = this.getAllStats();
    const cacheStats = this.getCacheStats();
    const slowQueries = this.getSlowQueries();
    const recommendations = this.getRecommendations();

    let report = "═══════════════════════════════════════════════\n";
    report += "         PERFORMANCE REPORT\n";
    report += "═══════════════════════════════════════════════\n\n";

    report += "📊 Operation Statistics:\n";
    report += "───────────────────────────────────────────────\n";
    stats.slice(0, 10).forEach((stat) => {
      report += `  ${stat.operation}\n`;
      report += `    Calls: ${stat.count} | Avg: ${stat.avgDuration.toFixed(0)}ms | `;
      report += `P95: ${stat.p95Duration.toFixed(0)}ms | Max: ${stat.maxDuration.toFixed(0)}ms\n`;
    });

    report += "\n💾 Cache Statistics:\n";
    report += "───────────────────────────────────────────────\n";
    report += `  Hit Rate: ${(cacheStats.hitRate * 100).toFixed(1)}% `;
    report += `(${cacheStats.hits} hits, ${cacheStats.misses} misses)\n`;

    if (slowQueries.length > 0) {
      report += "\n🐌 Slow Queries (>" + this.slowQueryThreshold + "ms):\n";
      report += "───────────────────────────────────────────────\n";
      slowQueries.slice(0, 5).forEach((query) => {
        report += `  ${query.operation}: ${query.duration.toFixed(0)}ms\n`;
      });
    }

    report += "\n💡 Recommendations:\n";
    report += "───────────────────────────────────────────────\n";
    recommendations.forEach((rec) => {
      report += `  ${rec}\n`;
    });

    report += "\n═══════════════════════════════════════════════\n";

    return report;
  }

  /**
   * Log performance report
   */
  logReport(): void {
    const report = this.generateReport();
    logger.info(
      "Performance Report",
      { report },
      { component: "PerformanceMonitor", action: "logReport" }
    );
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    logger.info(
      "Performance metrics cleared",
      {},
      { component: "PerformanceMonitor", action: "clear" }
    );
  }

  /**
   * Set slow query threshold
   *
   * @param threshold - Threshold in ms
   */
  setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
  }
}

/**
 * Singleton performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator to automatically track method performance
 *
 * @example
 * ```typescript
 * class MyService {
 *   @trackPerformance
 *   async fetchData() {
 *     // ... implementation
 *   }
 * }
 * ```
 */
export function trackPerformance(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const start = Date.now();
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - start;
      performanceMonitor.recordMetric(propertyKey, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      performanceMonitor.recordMetric(propertyKey, duration, { error: true });
      throw error;
    }
  };

  return descriptor;
}

/**
 * Helper to measure async function performance
 *
 * @param name - Operation name
 * @param fn - Async function to measure
 * @returns Function result
 *
 * @example
 * ```typescript
 * const result = await measurePerformance("fetchListings", async () => {
 *   return await contract.getUserListings(address);
 * });
 * ```
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    performanceMonitor.recordMetric(name, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    performanceMonitor.recordMetric(name, duration, { error: true });
    throw error;
  }
}
