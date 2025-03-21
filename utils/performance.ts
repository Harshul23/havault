/**
 * Performance utility for monitoring and optimizing React Native app performance
 */

import { InteractionManager } from 'react-native';
import logger from './logger';

/**
 * Performance monitoring utilities for React Native
 */
class PerformanceMonitor {
  private timers: Record<string, number> = {};
  private isProduction = !__DEV__;
  
  /**
   * Start timing an operation
   * @param label Identifier for the operation being timed
   */
  startTimer(label: string): void {
    if (this.isProduction) return; // Only time operations in development
    this.timers[label] = Date.now();
  }
  
  /**
   * End timing an operation and log the result
   * @param label Identifier matching the one used in startTimer
   * @param threshold Optional threshold in ms to only log slow operations
   */
  endTimer(label: string, threshold: number = 0): number {
    if (this.isProduction) return 0; // No timing in production
    
    const startTime = this.timers[label];
    if (!startTime) {
      console.warn(`Timer "${label}" was never started`);
      return 0;
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    delete this.timers[label];
    
    // Only log if duration exceeds threshold
    if (duration > threshold) {
      console.log(`⏱️ ${label}: ${duration}ms`);
    }
    
    return duration;
  }
  
  /**
   * Run a task after all interactions and animations are complete
   * to avoid blocking the UI thread
   */
  runAfterInteractions<T>(task: () => T): Promise<T> {
    return new Promise<T>((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        resolve(task());
      });
    });
  }
  
  /**
   * Run a high-priority task that shouldn't be delayed,
   * but in a non-blocking way
   */
  runNonBlocking<T>(task: () => T): Promise<T> {
    return new Promise<T>((resolve) => {
      // Use requestAnimationFrame to run task in next frame
      requestAnimationFrame(() => {
        resolve(task());
      });
    });
  }
  
  /**
   * Wait for a specified delay
   * Useful for debouncing or throttling operations
   */
  wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new PerformanceMonitor(); 