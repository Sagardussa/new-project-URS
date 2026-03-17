import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

export interface PerformanceMetrics {
  navigationTime: number;
  domContentLoaded: number;
  loadComplete: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private readonly metrics: Map<string, PerformanceMetrics> = new Map();
  private navigationStartTime: number = 0;

  constructor(private readonly router: Router) {
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring() {
    // Monitor route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.recordNavigation();
    });

    // Monitor web vitals if supported
    if (typeof PerformanceObserver !== 'undefined') {
      this.observeWebVitals();
    }
  }

  private recordNavigation() {
    const navigationEnd = performance.now();
    const navigationTime = navigationEnd - this.navigationStartTime;
    
    // Use Performance Navigation Timing API instead of deprecated performance.timing
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const navTiming = navigationEntries.length > 0 ? navigationEntries[0] : null;
    
    // Use duration properties which are relative to navigation start
    const domContentLoaded = navTiming 
      ? navTiming.domContentLoadedEventEnd
      : 0;
    const loadComplete = navTiming
      ? navTiming.loadEventEnd
      : 0;
    
    this.metrics.set('navigation', {
      navigationTime,
      domContentLoaded,
      loadComplete
    });

    // Log slow navigation
    if (navigationTime > 1000) {
      console.warn(`Slow navigation detected: ${navigationTime.toFixed(2)}ms`);
    }
  }

  private observeWebVitals() {
    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const metrics = this.metrics.get('webVitals') || {} as PerformanceMetrics;
          metrics.firstContentfulPaint = entry.startTime;
          this.metrics.set('webVitals', metrics);
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observer not supported',e);
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries.at(-1);
        if (lastEntry) {
          const metrics = this.metrics.get('webVitals') || {} as PerformanceMetrics;
          metrics.largestContentfulPaint = lastEntry.startTime;
          this.metrics.set('webVitals', metrics);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer not supported',e);
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
        const metrics = this.metrics.get('webVitals') || {} as PerformanceMetrics;
        metrics.cumulativeLayoutShift = clsValue;
        this.metrics.set('webVitals', metrics);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer not supported',e);
    }
  }

  startNavigation() {
    this.navigationStartTime = performance.now();
  }

  getMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  getNavigationMetrics(): PerformanceMetrics | undefined {
    return this.metrics.get('navigation');
  }

  getWebVitals(): PerformanceMetrics | undefined {
    return this.metrics.get('webVitals');
  }

  measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    return operation().finally(() => {
      const duration = performance.now() - startTime;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
    });
  }

  measureSync<T>(name: string, operation: () => T): T {
    const startTime = performance.now();
    const result = operation();
    const duration = performance.now() - startTime;
    
    console.log(`${name} took ${duration.toFixed(2)}ms`);
    
    if (duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  clearMetrics() {
    this.metrics.clear();
  }
} 