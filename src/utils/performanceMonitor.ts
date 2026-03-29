/**
 * Performance monitoring utilities for tracking load times and long tasks
 */

export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  static start(label: string): void {
    this.timers.set(label, performance.now());
    console.log(`⏱️ [Performance] Started: ${label}`);
  }

  /**
   * End timing and log duration
   */
  static end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`⚠️ [Performance] No start time found for: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);

    const emoji = duration < 100 ? '✅' : duration < 500 ? '⚡' : duration < 1000 ? '⚠️' : '❌';
    console.log(`${emoji} [Performance] ${label}: ${duration.toFixed(2)}ms`);

    return duration;
  }

  /**
   * Measure a function execution time
   */
  static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  /**
   * Log performance marks and measures
   */
  static mark(name: string): void {
    performance.mark(name);
  }

  static measureBetween(measureName: string, startMark: string, endMark: string): void {
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      console.log(`📊 [Performance] ${measureName}: ${measure.duration.toFixed(2)}ms`);
    } catch (error) {
      console.warn(`⚠️ [Performance] Could not measure ${measureName}:`, error);
    }
  }

  /**
   * Get Web Vitals-style metrics
   */
  static getMetrics(): {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
  } {
    const metrics: any = {};

    // First Contentful Paint
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcp) metrics.fcp = fcp.startTime;

    // Largest Contentful Paint
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      metrics.lcp = lcpEntries[lcpEntries.length - 1].startTime;
    }

    // Time to First Byte
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      metrics.ttfb = navTiming.responseStart - navTiming.requestStart;
    }

    return metrics;
  }

  /**
   * Log all performance metrics
   */
  static logAll(): void {
    console.group('📊 Performance Metrics');
    
    const metrics = this.getMetrics();
    if (metrics.fcp) console.log(`First Contentful Paint: ${metrics.fcp.toFixed(2)}ms`);
    if (metrics.lcp) console.log(`Largest Contentful Paint: ${metrics.lcp.toFixed(2)}ms`);
    if (metrics.ttfb) console.log(`Time to First Byte: ${metrics.ttfb.toFixed(2)}ms`);

    // Long Tasks
    const longTasks = performance.getEntriesByType('longtask');
    if (longTasks.length > 0) {
      console.warn(`⚠️ Detected ${longTasks.length} long tasks (>50ms)`);
      longTasks.forEach((task, i) => {
        console.log(`  Task ${i + 1}: ${task.duration.toFixed(2)}ms`);
      });
    }

    console.groupEnd();
  }

  /**
   * Monitor long tasks (requires Performance Observer)
   */
  static monitorLongTasks(callback?: (duration: number) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const duration = entry.duration;
            console.warn(`⚠️ [Long Task] ${duration.toFixed(2)}ms`);
            callback?.(duration);
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.log('Long task monitoring not supported');
      }
    }
  }
}

// Auto-monitor long tasks in development
if (import.meta.env.DEV) {
  PerformanceMonitor.monitorLongTasks((duration) => {
    if (duration > 500) {
      console.error(`❌ Critical long task: ${duration.toFixed(2)}ms - Consider breaking this operation into smaller chunks`);
    }
  });
}

export default PerformanceMonitor;
