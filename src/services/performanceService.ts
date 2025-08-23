import { getMonitoringConfig } from '../config/monitoring';
import { analyticsService, AnalyticsEvent } from './analyticsService';
import { logger } from './loggingService';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: number;
  context?: string;
  tags?: Record<string, string | number>;
}

export interface PerformanceAlert {
  type: 'threshold_exceeded' | 'anomaly_detected' | 'trend_warning';
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
}

class PerformanceService {
  private config = getMonitoringConfig();
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private timers: Map<string, number> = new Map();
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.initializePerformanceObserver();
  }

  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined' && this.config.FEATURE_FLAGS.DETAILED_PERFORMANCE_TRACKING) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric({
              name: `web_vital_${entry.name}`,
              value: entry.duration || entry.startTime,
              unit: 'ms',
              timestamp: Date.now(),
              context: 'WEB_VITALS',
              tags: {
                entryType: entry.entryType,
              },
            });
          });
        });

        // Observe navigation and resource timings
        this.performanceObserver.observe({ 
          entryTypes: ['navigation', 'resource', 'measure', 'mark'] 
        });
      } catch (error) {
        logger.warn('PerformanceObserver not available', 'PERFORMANCE', { error });
      }
    }
  }

  // Record a performance metric
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics in memory
    const maxMetrics = this.config.LOGGING.MAX_LOGS_IN_MEMORY;
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-maxMetrics);
    }

    // Log the metric
    logger.logPerformance(metric.name, metric.value, metric.unit, metric.context);

    // Check for performance alerts
    this.checkPerformanceThresholds(metric);

    // Send to analytics if enabled
    if (this.shouldSampleEvent('PERFORMANCE_EVENTS')) {
      analyticsService.trackEvent(AnalyticsEvent.SCREEN_LOAD_TIME, {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        context: metric.context || 'unknown',
        ...metric.tags,
      });
    }
  }

  // Start a performance timer
  startTimer(name: string, context?: string): void {
    const key = context ? `${context}:${name}` : name;
    this.timers.set(key, Date.now());
    logger.debug(`Performance timer started: ${key}`, 'PERFORMANCE');
  }

  // End a performance timer and record the metric
  endTimer(name: string, context?: string, tags?: Record<string, string | number>): number {
    const key = context ? `${context}:${name}` : name;
    const startTime = this.timers.get(key);
    
    if (!startTime) {
      logger.warn(`No timer found for: ${key}`, 'PERFORMANCE');
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(key);

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      context,
      tags,
    });

    return duration;
  }

  // Record API performance
  recordAPIPerformance(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    requestSize?: number,
    responseSize?: number
  ): void {
    this.recordMetric({
      name: 'api_response_time',
      value: responseTime,
      unit: 'ms',
      timestamp: Date.now(),
      context: 'API',
      tags: {
        endpoint,
        method,
        status_code: statusCode,
        request_size: requestSize || 0,
        response_size: responseSize || 0,
      },
    });

    // Track API success/error rates
    this.recordMetric({
      name: 'api_request_count',
      value: 1,
      unit: 'count',
      timestamp: Date.now(),
      context: 'API',
      tags: {
        endpoint,
        method,
        status_code: statusCode,
        success: statusCode < 400,
      },
    });
  }

  // Record screen performance
  recordScreenPerformance(screenName: string, loadTime: number): void {
    this.recordMetric({
      name: 'screen_load_time',
      value: loadTime,
      unit: 'ms',
      timestamp: Date.now(),
      context: 'SCREEN',
      tags: {
        screen_name: screenName,
      },
    });
  }

  // Record memory usage
  recordMemoryUsage(usage: number): void {
    this.recordMetric({
      name: 'memory_usage',
      value: usage,
      unit: 'bytes',
      timestamp: Date.now(),
      context: 'MEMORY',
    });
  }

  // Check performance thresholds and generate alerts
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = this.config.PERFORMANCE_THRESHOLDS;
    let threshold: number | undefined;
    let alertType: string = '';

    switch (metric.name) {
      case 'screen_load_time':
        threshold = thresholds.SCREEN_LOAD;
        alertType = 'Screen Load';
        break;
      case 'api_response_time':
        threshold = thresholds.API_RESPONSE;
        alertType = 'API Response';
        break;
      case 'swipe_action':
        threshold = thresholds.SWIPE_ACTION;
        alertType = 'Swipe Action';
        break;
      case 'restaurant_load':
        threshold = thresholds.RESTAURANT_LOAD;
        alertType = 'Restaurant Load';
        break;
    }

    if (threshold && metric.value > threshold) {
      this.generateAlert({
        type: 'threshold_exceeded',
        metric: metric.name,
        value: metric.value,
        threshold,
        severity: this.calculateSeverity(metric.value, threshold),
        message: `${alertType} time exceeded threshold: ${metric.value}${metric.unit} > ${threshold}${metric.unit}`,
        timestamp: Date.now(),
      });
    }
  }

  private calculateSeverity(value: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = value / threshold;
    if (ratio > 3) return 'critical';
    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }

  private generateAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log the alert
    const logLevel = alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'warn';
    logger[logLevel](`Performance Alert: ${alert.message}`, 'PERFORMANCE_ALERT', alert);

    // Send critical alerts to analytics
    if (alert.severity === 'critical' || alert.severity === 'high') {
      analyticsService.trackEvent(AnalyticsEvent.API_CALL_ERROR, {
        alert_type: alert.type,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        severity: alert.severity,
      });
    }
  }

  private shouldSampleEvent(eventType: keyof typeof this.config.SAMPLING_RATES): boolean {
    const rate = this.config.SAMPLING_RATES[eventType];
    return Math.random() < rate;
  }

  // Get performance summary
  getPerformanceSummary(timeWindow?: number): {
    metrics: PerformanceMetric[];
    alerts: PerformanceAlert[];
    averages: Record<string, number>;
    counts: Record<string, number>;
  } {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    const recentAlerts = this.alerts.filter(a => a.timestamp > cutoff);

    // Calculate averages by metric name
    const averages: Record<string, number> = {};
    const counts: Record<string, number> = {};

    recentMetrics.forEach(metric => {
      if (!averages[metric.name]) {
        averages[metric.name] = 0;
        counts[metric.name] = 0;
      }
      averages[metric.name] += metric.value;
      counts[metric.name] += 1;
    });

    // Calculate final averages
    Object.keys(averages).forEach(name => {
      averages[name] = averages[name] / counts[name];
    });

    return {
      metrics: recentMetrics,
      alerts: recentAlerts,
      averages,
      counts,
    };
  }

  // Get current performance status
  getPerformanceStatus(): {
    status: 'good' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const summary = this.getPerformanceSummary(300000); // Last 5 minutes
    const criticalAlerts = summary.alerts.filter(a => a.severity === 'critical');
    const highAlerts = summary.alerts.filter(a => a.severity === 'high');
    
    let status: 'good' | 'warning' | 'critical' = 'good';
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (criticalAlerts.length > 0) {
      status = 'critical';
      issues.push(`${criticalAlerts.length} critical performance issues detected`);
    } else if (highAlerts.length > 0) {
      status = 'warning';
      issues.push(`${highAlerts.length} high-priority performance issues detected`);
    }

    // Check average response times
    if (summary.averages.api_response_time > this.config.PERFORMANCE_THRESHOLDS.API_RESPONSE * 0.8) {
      if (status === 'good') status = 'warning';
      issues.push('API response times are elevated');
      recommendations.push('Consider optimizing API calls or checking network connectivity');
    }

    if (summary.averages.screen_load_time > this.config.PERFORMANCE_THRESHOLDS.SCREEN_LOAD * 0.8) {
      if (status === 'good') status = 'warning';
      issues.push('Screen load times are elevated');
      recommendations.push('Consider optimizing component rendering or data loading');
    }

    return { status, issues, recommendations };
  }

  // Clear old metrics and alerts
  cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
    
    logger.info('Performance data cleanup completed', 'PERFORMANCE', {
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length,
    });
  }

  // Dispose of the service
  dispose(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.timers.clear();
    this.metrics = [];
    this.alerts = [];
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();