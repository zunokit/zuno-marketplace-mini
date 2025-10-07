/**
 * Logger Utility
 * Production-ready logging with different levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  private colors = {
    debug: '\x1b[36m',    // Cyan
    info: '\x1b[34m',     // Blue
    warn: '\x1b[33m',     // Yellow
    error: '\x1b[31m',    // Red
    success: '\x1b[32m',  // Green
    reset: '\x1b[0m'
  };

  private icons = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅'
  };

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date()
    };

    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Only log in development or for errors
    if (!this.isDevelopment && level !== 'error') {
      return;
    }

    const timestamp = entry.timestamp.toISOString();
    const icon = this.icons[level];
    const color = this.colors[level];
    const reset = this.colors.reset;

    // Format message
    const formattedMessage = `${icon} ${color}[${timestamp}] ${message}${reset}`;

    // Choose console method
    const consoleMethod = level === 'error' ? console.error :
                         level === 'warn' ? console.warn :
                         console.log;

    if (data !== undefined) {
      consoleMethod(formattedMessage, data);
    } else {
      consoleMethod(formattedMessage);
    }

    // Send to monitoring service in production
    if (!this.isDevelopment && level === 'error') {
      this.sendToMonitoring(entry);
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error;
    
    this.log('error', message, errorData);
  }

  success(message: string, data?: any) {
    this.log('success', message, data);
  }

  group(label: string) {
    if (this.isDevelopment) {
      console.group(this.icons.info + ' ' + label);
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  table(data: any) {
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
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(entry.message), {
          extra: entry.data
        });
      }
    } catch (e) {
      // Silently fail to avoid breaking the app
    }
  }
}

// Export singleton instance
export const logger = new Logger();
