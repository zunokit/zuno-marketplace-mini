/**
 * Production-ready Logger Utility
 * Structured logging with context, performance tracking, and monitoring integration
 */

/* eslint-disable no-console */

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

class Logger {
  private isDevelopment = process.env.NODE_ENV !== "production";
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;
  private globalContext: LogContext = {};
  private performanceTimers: Map<string, number> = new Map();

  private colors = {
    debug: "\x1b[36m", // Cyan
    info: "\x1b[34m", // Blue
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
    success: "\x1b[32m", // Green
    reset: "\x1b[0m",
  };

  private icons = {
    debug: "🔍",
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
    success: "✅",
  };

  private log(
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

    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Only log in development or for errors
    if (!this.isDevelopment && level !== "error") {
      return;
    }

    const timestamp = entry.timestamp.toISOString();
    const icon = this.icons[level];
    const color = this.colors[level];
    const reset = this.colors.reset;

    // Format message
    const formattedMessage = `${icon} ${color}[${timestamp}] ${message}${reset}`;

    // Choose console method
    const consoleMethod =
      level === "error"
        ? console.error
        : level === "warn"
        ? console.warn
        : console.log;

    if (data !== undefined) {
      consoleMethod(formattedMessage, data);
    } else {
      consoleMethod(formattedMessage);
    }

    // Send to monitoring service in production
    if (!this.isDevelopment && level === "error") {
      this.sendToMonitoring(entry);
    }
  }

  debug(message: string, data?: unknown, context?: LogContext) {
    this.log("debug", message, data, context);
  }

  info(message: string, data?: unknown, context?: LogContext) {
    this.log("info", message, data, context);
  }

  warn(message: string, data?: unknown, context?: LogContext) {
    this.log("warn", message, data, context);
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

    this.log("error", message, errorData, context);
  }

  success(message: string, data?: unknown, context?: LogContext) {
    this.log("success", message, data, context);
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

  // Utility methods
  private generateLogId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  group(label: string) {
    if (this.isDevelopment) {
      console.group(this.icons.info + " " + label);
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
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
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

  private sendToMonitoring(entry: LogEntry) {
    // In production, send errors to monitoring service
    // This could be Sentry, LogRocket, etc.
    try {
      // Example: Sentry integration
      const win = window as Window & { Sentry?: { captureException: (err: Error, opts: { extra: unknown }) => void } };
      if (typeof window !== "undefined" && win.Sentry) {
        win.Sentry.captureException(new Error(entry.message), {
          extra: entry.data,
        });
      }
    } catch {
      // Silently fail to avoid breaking the app
    }
  }
}

// Export singleton instance
export const logger = new Logger();
