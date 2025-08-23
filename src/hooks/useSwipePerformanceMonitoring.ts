import { useCallback, useRef } from 'react';
import { analyticsService, AnalyticsEvent } from '../services/analyticsService';
import { logger } from '../services/loggingService';

interface SwipePerformanceMetrics {
  gestureStartTime: number;
  gestureEndTime: number;
  swipeDuration: number;
  velocity: number;
  translation: number;
  direction: 'left' | 'right';
  success: boolean;
}

export const useSwipePerformanceMonitoring = () => {
  const metricsRef = useRef<SwipePerformanceMetrics | null>(null);
  const performanceThresholds = {
    maxSwipeDuration: 1000, // 1 second
    minVelocity: 100, // Minimum velocity for a valid swipe
    maxTranslation: 500, // Maximum expected translation
  };

  const startGestureTracking = useCallback(() => {
    metricsRef.current = {
      gestureStartTime: Date.now(),
      gestureEndTime: 0,
      swipeDuration: 0,
      velocity: 0,
      translation: 0,
      direction: 'left',
      success: false,
    };
    
    logger.info('Swipe gesture tracking started', 'SWIPE_PERFORMANCE', {
      startTime: metricsRef.current.gestureStartTime,
    });
  }, []);

  const endGestureTracking = useCallback((
    velocity: number,
    translation: number,
    direction: 'left' | 'right',
    success: boolean
  ) => {
    if (!metricsRef.current) return;

    const endTime = Date.now();
    const duration = endTime - metricsRef.current.gestureStartTime;

    metricsRef.current = {
      ...metricsRef.current,
      gestureEndTime: endTime,
      swipeDuration: duration,
      velocity,
      translation,
      direction,
      success,
    };

    // Log performance metrics
    logger.info('Swipe gesture completed', 'SWIPE_PERFORMANCE', {
      duration,
      velocity,
      translation,
      direction,
      success,
    });

    // Track analytics
    analyticsService.trackEvent(AnalyticsEvent.RESTAURANT_SWIPED_LEFT, {
      swipe_duration: duration,
      swipe_velocity: velocity,
      swipe_translation: translation,
      swipe_direction: direction,
      swipe_success: success,
    });

    // Check for performance issues
    const performanceIssues = [];
    
    if (duration > performanceThresholds.maxSwipeDuration) {
      performanceIssues.push('slow_swipe_duration');
    }
    
    if (Math.abs(velocity) < performanceThresholds.minVelocity && success) {
      performanceIssues.push('low_velocity_swipe');
    }
    
    if (Math.abs(translation) > performanceThresholds.maxTranslation) {
      performanceIssues.push('excessive_translation');
    }

    if (performanceIssues.length > 0) {
      logger.warn('Swipe performance issues detected', 'SWIPE_PERFORMANCE', {
        issues: performanceIssues,
        metrics: metricsRef.current,
      });

      analyticsService.trackEvent(AnalyticsEvent.API_CALL_ERROR, {
        error_type: 'swipe_performance_issue',
        issues: performanceIssues.join(','),
        duration,
        velocity,
        translation,
      });
    }

    // Reset metrics
    metricsRef.current = null;
  }, []);

  const getCurrentMetrics = useCallback(() => {
    return metricsRef.current;
  }, []);

  return {
    startGestureTracking,
    endGestureTracking,
    getCurrentMetrics,
  };
};
