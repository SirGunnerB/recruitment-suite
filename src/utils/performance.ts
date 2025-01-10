import { createLogger } from './logger';

const logger = createLogger('performance');

interface PerformanceMetric {
  name: string;
  startTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV !== 'production';

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;
    this.marks.set(name, performance.now());
  }

  endMeasure(name: string): void {
    if (!this.isEnabled) return;
    const startTime = this.marks.get(name);
    if (!startTime) {
      logger.warn(`No start mark found for measurement: ${name}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.metrics.push({
      name,
      startTime,
      duration
    });

    this.marks.delete(name);
    logger.debug(`Performance measurement - ${name}: ${duration.toFixed(2)}ms`);
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  clearMetrics(): void {
    this.metrics = [];
    this.marks.clear();
  }

  // Decorator for measuring function performance
  static measure(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance();
      const methodName = `${target.constructor.name}.${propertyKey}`;
      
      monitor.startMeasure(methodName);
      const result = originalMethod.apply(this, args);
      
      // Handle both synchronous and asynchronous functions
      if (result instanceof Promise) {
        return result.finally(() => monitor.endMeasure(methodName));
      }
      
      monitor.endMeasure(methodName);
      return result;
    };

    return descriptor;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
export const measure = PerformanceMonitor.measure;
