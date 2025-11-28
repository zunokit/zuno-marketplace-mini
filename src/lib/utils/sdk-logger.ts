/**
 * SDK Logger Wrapper
 * Uses Zuno Marketplace SDK's built-in logger instead of custom implementation
 */

/* eslint-disable no-console */

import { ZunoLogger } from "zuno-marketplace-sdk";

type LogLevel = "debug" | "info" | "warn" | "error" | "success";

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: LogContext;
  timestamp: Date;
  id: string;
}

/**
 * SDK Logger Wrapper
 * Provides compatibility layer for existing code while using SDK's logger
 */
class SDKLoggerWrapper {
  private sdkLogger: ZunoLogger;
  private isDevelopment = process.env.NODE_ENV !== "production";
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;
  private globalContext: LogContext = {};
  private performanceTimers: Map<string, number> = new Map();

  constructor() {
    // Initialize SDK logger with appropriate configuration
    this.sdkLogger = new ZunoLogger({
      level: this.isDevelopment ? "debug" : "info",
      customLogger: {
        // In production, integrate with monitoring services
        error: (msg: string, meta?: Record<string, unknown>) => {
          if (!this.isDevelopment) {
            this.sendToMonitoring(msg, meta);
          }
        },
      },
    });
  }

  private formatMessage(message: string, context?: LogContext): string {
    if (!context) return message;
    
    const contextStr = context.component 
      ? `[${context.component}${context.action ? `:${context.action}` : ''}] `
      : '';
    
    return `${contextStr}${message}`;
  }

  private addToHistory(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: LogContext
  ) {
    const entry: LogEntry = {
      level,
      message,
      data,
      context: { ...this.globalContext, ...context },
      timestamp: new Date(),
      id: this.generateLogId(),
    };

    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  debug(message: string, data?: unknown, context?: LogContext) {
    const formattedMessage = this.formatMessage(message, context);
    const metadata = { ...this.globalContext, ...context, data };
    
    this.sdkLogger.debug(formattedMessage, metadata);
    this.addToHistory("debug", message, data, context);
  }

  info(message: string, data?: unknown, context?: LogContext) {
    const formattedMessage = this.formatMessage(message, context);
    const metadata = { ...this.globalContext, ...context, data };
    
    this.sdkLogger.info(formattedMessage, metadata);
    this.addToHistory("info", message, data, context);
  }

  warn(message: string, data?: unknown, context?: LogContext) {
    const formattedMessage = this.formatMessage(message, context);
    const metadata = { ...this.globalContext, ...context, data };
    
    this.sdkLogger.warn(formattedMessage, metadata);
    this.addToHistory("warn", message, data, context);
  }

  error(message: string, error?: unknown, context?: LogContext) {
    const errorData =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error;

    const formattedMessage = this.formatMessage(message, context);
    const metadata = { ...this.globalContext, ...context, error: errorData };
    
    this.sdkLogger.error(formattedMessage, metadata);
    this.addToHistory("error", message, errorData, context);
  }

  success(message: string, data?: unknown, context?: LogContext) {
    // SDK logger doesn't have success level, use info with success indicator
    const formattedMessage = `✅ ${this.formatMessage(message, context)}`;
    const metadata = { ...this.globalContext, ...context, data, success: true };
    
    this.sdkLogger.info(formattedMessage, metadata);
    this.addToHistory("success", message, data, context);
  }

  // Context management
  setGlobalContext(context: LogContext) {
    this.globalContext = { ...this.globalContext, ...context };
  }

  clearGlobalContext() {
    this.globalContext = {};
  }

  // Performance tracking
  startTimer(label: string) {
    this.performanceTimers.set(label, performance.now());
  }

  endTimer(label: string, message?: string, context?: LogContext) {
    const startTime = this.performanceTimers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.performanceTimers.delete(label);

      const timerContext = { ...context, duration: Math.round(duration) };
      const timerMessage = message || `Timer '${label}' completed`;

      this.info(timerMessage, { label, duration }, timerContext);
      return duration;
    }
    return 0;
  }

  // Utility methods for compatibility
  private generateLogId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  group(label: string) {
    if (this.isDevelopment) {
      console.group(`ℹ️ ${label}`);
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  table(data: unknown) {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  time(label: string) {
    this.startTimer(label);
  }

  timeEnd(label: string) {
    this.endTimer(label);
  }

  clear() {
    if (this.isDevelopment) {
      console.clear();
    }
    this.logHistory = [];
  }

  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  private sendToMonitoring(message: string, meta?: Record<string, unknown>) {
    // In production, send errors to monitoring service
    try {
      // Example: Sentry integration
      const win = window as Window & { 
        Sentry?: { 
          captureException: (err: Error, opts: { extra: unknown }) => void 
        } 
      };
      
      if (typeof window !== "undefined" && win.Sentry) {
        win.Sentry.captureException(new Error(message), {
          extra: meta,
        });
      }
    } catch {
      // Silently fail to avoid breaking the app
    }
  }
}

// Export singleton instance for backward compatibility
export const logger = new SDKLoggerWrapper();
