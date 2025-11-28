/**
 * SDK Logger - Uses Zuno Marketplace SDK v1.2.0+ built-in logger
 * 
 * With SDK v1.2.0+, we can now use:
 * - ZunoSDK.getLogger() for non-React contexts (singleton)
 * - useZunoLogger() hook for React components
 * 
 * This file provides a thin compatibility layer for existing code.
 */

/* eslint-disable no-console */

import { ZunoLogger, type LogMetadata } from "zuno-marketplace-sdk";

// Re-export SDK logger types for convenience
export type { LogMetadata, LogLevel, Logger, LoggerConfig } from "zuno-marketplace-sdk";

// Context type for backward compatibility
interface LogContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

// Singleton logger instance using SDK's ZunoLogger
const sdkLogger = new ZunoLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  modulePrefix: true,
  timestamp: true,
  logTransactions: true,
  includeErrorContext: true,
});

// Performance timers storage
const performanceTimers = new Map<string, number>();

/**
 * Converts LogContext to SDK's LogMetadata format
 */
function toMetadata(context?: LogContext, data?: unknown): LogMetadata {
  return {
    module: context?.component,
    action: context?.action,
    data,
    ...context,
  };
}

/**
 * Logger API - Compatible with existing codebase
 * Uses SDK's ZunoLogger under the hood
 */
export const logger = {
  debug(message: string, data?: unknown, context?: LogContext) {
    sdkLogger.debug(message, toMetadata(context, data));
  },

  info(message: string, data?: unknown, context?: LogContext) {
    sdkLogger.info(message, toMetadata(context, data));
  },

  warn(message: string, data?: unknown, context?: LogContext) {
    sdkLogger.warn(message, toMetadata(context, data));
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    sdkLogger.error(message, toMetadata(context, errorData));
  },

  success(message: string, data?: unknown, context?: LogContext) {
    // Use info level with success indicator
    sdkLogger.info(`✅ ${message}`, { ...toMetadata(context, data), success: true });
  },

  // Performance tracking
  startTimer(label: string) {
    performanceTimers.set(label, performance.now());
  },

  endTimer(label: string, message?: string, context?: LogContext): number {
    const startTime = performanceTimers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      performanceTimers.delete(label);
      sdkLogger.info(message || `Timer '${label}' completed`, {
        ...toMetadata(context),
        duration: Math.round(duration),
        label,
      });
      return duration;
    }
    return 0;
  },

  // Console utilities (development only)
  group(label: string) {
    if (process.env.NODE_ENV === "development") {
      console.group(`ℹ️ ${label}`);
    }
  },

  groupEnd() {
    if (process.env.NODE_ENV === "development") {
      console.groupEnd();
    }
  },

  table(data: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.table(data);
    }
  },
};

// Export SDK logger directly for advanced usage
export { sdkLogger };
