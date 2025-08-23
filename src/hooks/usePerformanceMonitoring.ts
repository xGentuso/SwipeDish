import { useEffect, useRef, useCallback } from 'react';
import { performanceService } from '../services/performanceService';
import { logger } from '../services/loggingService';

export interface UsePerformanceMonitoringOptions {
  trackScreenLoad?: boolean;
  trackRenderTime?: boolean;
  trackMemoryUsage?: boolean;
  screenName?: string;
  context?: string;
}

export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    trackScreenLoad = true,
    trackRenderTime = false,
    trackMemoryUsage = false,
    screenName,
    context = 'SCREEN',
  } = options;

  const mountTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);
  const componentNameRef = useRef<string>(screenName || 'Unknown');

  // Track screen load time
  useEffect(() => {
    if (trackScreenLoad) {
      const loadTime = Date.now() - mountTimeRef.current;
      performanceService.recordScreenPerformance(componentNameRef.current, loadTime);
      logger.logPerformance(`screen_load_${componentNameRef.current}`, loadTime, 'ms', context);
    }
  }, []); // Only run on mount

  // Track render time if enabled
  useEffect(() => {
    if (trackRenderTime) {
      renderCountRef.current += 1;
      
      // Log every 10th render to avoid spam
      if (renderCountRef.current % 10 === 0) {
        const avgRenderTime = (Date.now() - mountTimeRef.current) / renderCountRef.current;
        logger.logPerformance(
          `avg_render_time_${componentNameRef.current}`,
          avgRenderTime,
          'ms',
          context
        );
      }
    }
  });

  // Track memory usage periodically if enabled
  useEffect(() => {
    if (trackMemoryUsage) {
      const interval = setInterval(() => {
        try {
          // Basic memory tracking - more detailed tracking would require native modules
          const performanceMemory = (performance as any)?.memory;
          if (performanceMemory) {
            performanceService.recordMemoryUsage(performanceMemory.usedJSHeapSize);
          }
        } catch (error) {
          // Memory API not available
        }
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [trackMemoryUsage]);

  // Helper functions for manual performance tracking
  const startTimer = useCallback((name: string) => {
    performanceService.startTimer(name, context);
  }, [context]);

  const endTimer = useCallback((name: string, tags?: Record<string, string | number>) => {
    return performanceService.endTimer(name, context, tags);
  }, [context]);

  const recordMetric = useCallback((name: string, value: number, unit: 'ms' | 'bytes' | 'count' | 'percent', tags?: Record<string, string | number>) => {
    performanceService.recordMetric({
      name,
      value,
      unit,
      timestamp: Date.now(),
      context,
      tags,
    });
  }, [context]);

  // Track API calls
  const trackAPICall = useCallback((
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    requestSize?: number,
    responseSize?: number
  ) => {
    performanceService.recordAPIPerformance(
      endpoint,
      method,
      statusCode,
      responseTime,
      requestSize,
      responseSize
    );
  }, []);

  return {
    startTimer,
    endTimer,
    recordMetric,
    trackAPICall,
    renderCount: renderCountRef.current,
    mountTime: mountTimeRef.current,
  };
}

// Hook specifically for tracking component load times
export function useScreenLoadTime(screenName: string, enabled = true) {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const loadTime = Date.now() - startTimeRef.current;
    performanceService.recordScreenPerformance(screenName, loadTime);
    
    return () => {
      // Track how long the screen was visible
      const visibilityTime = Date.now() - startTimeRef.current;
      performanceService.recordMetric({
        name: 'screen_visibility_time',
        value: visibilityTime,
        unit: 'ms',
        timestamp: Date.now(),
        context: 'SCREEN_USAGE',
        tags: {
          screen_name: screenName,
        },
      });
    };
  }, [screenName, enabled]);

  return {
    startTime: startTimeRef.current,
    getLoadTime: () => Date.now() - startTimeRef.current,
  };
}

// Hook for tracking async operations
export function useAsyncOperationTracking() {
  const trackAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> => {
    const timerName = `async_${operationName}`;
    performanceService.startTimer(timerName, context);
    
    try {
      const result = await operation();
      performanceService.endTimer(timerName, context, { success: true });
      return result;
    } catch (error) {
      performanceService.endTimer(timerName, context, { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, []);

  return { trackAsyncOperation };
}