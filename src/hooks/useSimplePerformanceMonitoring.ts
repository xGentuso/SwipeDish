import { useEffect, useRef } from 'react';
import { logger } from '../services/loggingService';

export interface UseSimplePerformanceOptions {
  trackScreenLoad?: boolean;
  screenName?: string;
}

export function useSimplePerformanceMonitoring(options: UseSimplePerformanceOptions = {}) {
  const {
    trackScreenLoad = true,
    screenName = 'Unknown',
  } = options;

  const mountTimeRef = useRef<number>(Date.now());

  // Track screen load time
  useEffect(() => {
    if (trackScreenLoad) {
      const loadTime = Date.now() - mountTimeRef.current;
      logger.info('Screen load performance', 'PERFORMANCE', {
        loadTime,
        unit: 'ms',
        screenName
      });
      logger.info(`Screen loaded: ${screenName} (${loadTime}ms)`, 'SCREEN_PERFORMANCE');
    }
  }, []); // Only run on mount

  return {
    mountTime: mountTimeRef.current,
    getLoadTime: () => Date.now() - mountTimeRef.current,
  };
}

// Simple hook for tracking screen load times
export function useSimpleScreenLoadTime(screenName: string, enabled = true) {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const loadTime = Date.now() - startTimeRef.current;
    logger.info('Screen load performance', 'PERFORMANCE', {
      loadTime,
      unit: 'ms',
      screenName
    });
    
    return () => {
      // Track how long the screen was visible
      const visibilityTime = Date.now() - startTimeRef.current;
      logger.info('Screen visibility performance', 'PERFORMANCE', {
        visibilityTime,
        unit: 'ms',
        screenName
      });
    };
  }, [screenName, enabled]);

  return {
    startTime: startTimeRef.current,
    getLoadTime: () => Date.now() - startTimeRef.current,
  };
}