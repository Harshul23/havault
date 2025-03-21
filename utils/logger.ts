/**
 * Logger utility to handle console logging in production vs development environments
 * In production builds, we disable verbose logging to improve performance
 */

import { Platform } from 'react-native';

// Determine if we're running in production
const isProduction = !__DEV__;

/**
 * Custom logger with production safeguards
 */
class Logger {
  /**
   * Log information messages - disabled in production
   */
  info(...args: any[]): void {
    if (!isProduction) {
      console.log(...args);
    }
  }

  /**
   * Log warning messages - important enough to keep in production, but throttled
   */
  warn(...args: any[]): void {
    if (!isProduction || Math.random() < 0.1) { // Only log 10% of warnings in production
      console.warn(...args);
    }
  }

  /**
   * Log error messages - keep important errors in production for crash reporting
   * but remove sensitive information
   */
  error(message: string, error?: any): void {
    if (isProduction) {
      // In production we want to limit the info being logged
      // but still record that errors happened for crash reporting
      const safeError = error ? {
        name: error.name,
        message: error.message,
        // Don't include stack trace or other potentially sensitive details
      } : undefined;

      console.error(`Error: ${message}`, safeError);
    } else {
      // In development, log everything for debugging
      console.error(message, error);
    }
  }

  /**
   * Force logging even in production (for critical information)
   */
  critical(...args: any[]): void {
    console.log('[CRITICAL]', ...args);
  }
}

export default new Logger(); 