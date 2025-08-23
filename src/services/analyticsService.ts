import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logger } from './loggingService';

// Production analytics events
export enum AnalyticsEvent {
  // App lifecycle
  APP_LAUNCHED = 'app_launched',
  APP_BACKGROUNDED = 'app_backgrounded',
  APP_FOREGROUNDED = 'app_foregrounded',
  
  // User actions
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  
  // Room actions
  ROOM_CREATED = 'room_created',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  
  // Swipe actions
  RESTAURANT_SWIPED_LEFT = 'restaurant_swiped_left',
  RESTAURANT_SWIPED_RIGHT = 'restaurant_swiped_right',
  RESTAURANT_SUPER_LIKED = 'restaurant_super_liked',
  
  // Match events
  MATCH_CREATED = 'match_created',
  MATCH_VIEWED = 'match_viewed',
  
  // Restaurant data
  RESTAURANTS_LOADED = 'restaurants_loaded',
  RESTAURANT_DETAILS_VIEWED = 'restaurant_details_viewed',
  RESTAURANT_FAVORITED = 'restaurant_favorited',
  
  // API events
  API_CALL_SUCCESS = 'api_call_success',
  API_CALL_ERROR = 'api_call_error',
  API_CALL_TIMEOUT = 'api_call_timeout',
  
  // Performance
  SCREEN_LOAD_TIME = 'screen_load_time',
  API_RESPONSE_TIME = 'api_response_time',
  
  // Errors
  ERROR_BOUNDARY_TRIGGERED = 'error_boundary_triggered',
  SWIPE_CARD_ERROR = 'swipe_card_error',
  FIREBASE_ERROR = 'firebase_error',
  NETWORK_ERROR = 'network_error',
  APP_ERROR = 'app_error',
  
  // Recommendation Events
  RECOMMENDATIONS_GENERATED = 'recommendations_generated',
  RECOMMENDATION_CLICKED = 'recommendation_clicked',
}

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null;
}

export interface TimingEvent {
  event: AnalyticsEvent;
  startTime: number;
  properties?: AnalyticsProperties;
}

class AnalyticsService {
  private isEnabled: boolean;
  private userId: string | null = null;
  private sessionId: string;
  private events: Array<{ event: AnalyticsEvent; properties: AnalyticsProperties; timestamp: number }> = [];
  private timingEvents: Map<string, TimingEvent> = new Map();

  constructor() {
    this.isEnabled = this.shouldEnableAnalytics();
    this.sessionId = this.generateSessionId();
    
    if (this.isEnabled) {
      // Analytics Service initialized
      this.trackEvent(AnalyticsEvent.APP_LAUNCHED, {
        platform: Platform.OS,
        version: Constants.expoConfig?.version || 'unknown',
        buildVersion: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 'unknown',
      });
    }
  }

  private shouldEnableAnalytics(): boolean {
    // Enable analytics in production or when explicitly enabled
    const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
    const explicitlyEnabled = process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true';
    
    return environment === 'production' || explicitlyEnabled;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  trackEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}): void {
    if (!this.isEnabled) return;

    const eventData = {
      event,
      properties: {
        ...properties,
        userId: this.userId,
        sessionId: this.sessionId,
        platform: Platform.OS,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.events.push(eventData);
    
    // Log to console in development
    if (__DEV__) {
      // Track event in development mode
    }

    // In production, you would send to your analytics service
    // This could be Firebase Analytics, Mixpanel, Amplitude, etc.
    this.sendToAnalyticsProvider(eventData);
  }

  startTiming(timingId: string, event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    if (!this.isEnabled) return;

    this.timingEvents.set(timingId, {
      event,
      startTime: Date.now(),
      properties,
    });
  }

  endTiming(timingId: string, additionalProperties?: AnalyticsProperties): void {
    if (!this.isEnabled) return;

    const timingEvent = this.timingEvents.get(timingId);
    if (!timingEvent) {
      logger.warn(`Analytics: No timing event found for ID: ${timingId}`, 'ANALYTICS');
      return;
    }

    const duration = Date.now() - timingEvent.startTime;
    
    this.trackEvent(timingEvent.event, {
      ...timingEvent.properties,
      ...additionalProperties,
      duration_ms: duration,
    });

    this.timingEvents.delete(timingId);
  }

  trackError(error: Error, context: string, additionalProperties?: AnalyticsProperties): void {
    if (!this.isEnabled) return;

    this.trackEvent(AnalyticsEvent.ERROR_BOUNDARY_TRIGGERED, {
      error_message: error.message,
      error_stack: error.stack || '',
      error_context: context,
      ...additionalProperties,
    });
  }

  trackApiCall(
    endpoint: string,
    method: string,
    status: 'success' | 'error' | 'timeout',
    responseTime?: number,
    errorMessage?: string
  ): void {
    if (!this.isEnabled) return;

    const event = status === 'success' 
      ? AnalyticsEvent.API_CALL_SUCCESS 
      : status === 'timeout'
      ? AnalyticsEvent.API_CALL_TIMEOUT
      : AnalyticsEvent.API_CALL_ERROR;

    this.trackEvent(event, {
      endpoint,
      method,
      response_time_ms: responseTime || 0,
      error_message: errorMessage || '',
    });
  }

  trackScreenLoad(screenName: string, loadTime: number): void {
    if (!this.isEnabled) return;

    this.trackEvent(AnalyticsEvent.SCREEN_LOAD_TIME, {
      screen_name: screenName,
      load_time_ms: loadTime,
    });
  }

  // Batch send events (useful for reducing network calls)
  private async sendToAnalyticsProvider(eventData: any): Promise<void> {
    try {
      // In a real implementation, you would send to your analytics service
      // For now, we'll just store locally and could batch send later
      
      // Example: Firebase Analytics
      // await analytics().logEvent(eventData.event, eventData.properties);
      
      // Example: Custom analytics endpoint
      // await fetch('https://your-analytics-endpoint.com/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventData),
      // });
      
    } catch (error) {
      logger.error('Analytics: Failed to send event', 'ANALYTICS', { error });
    }
  }

  // Get analytics summary for debugging
  getAnalyticsSummary(): {
    isEnabled: boolean;
    sessionId: string;
    eventCount: number;
    recentEvents: Array<{ event: AnalyticsEvent; timestamp: number }>;
  } {
    return {
      isEnabled: this.isEnabled,
      sessionId: this.sessionId,
      eventCount: this.events.length,
      recentEvents: this.events.slice(-10).map(e => ({ 
        event: e.event, 
        timestamp: e.timestamp 
      })),
    };
  }

  // Clear events (useful for testing or privacy)
  clearEvents(): void {
    this.events = [];
    this.timingEvents.clear();
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();