export const MONITORING_CONFIG = {
  // Performance thresholds (in milliseconds)
  PERFORMANCE_THRESHOLDS: {
    SCREEN_LOAD: 3000,     // Screen should load within 3 seconds
    API_RESPONSE: 5000,    // API calls should complete within 5 seconds
    SWIPE_ACTION: 1000,    // Swipe actions should complete within 1 second
    RESTAURANT_LOAD: 10000, // Restaurant loading should complete within 10 seconds
  },

  // Analytics sampling rates (0.0 to 1.0)
  SAMPLING_RATES: {
    PERFORMANCE_EVENTS: 1.0,  // Track all performance events
    USER_ACTIONS: 1.0,        // Track all user actions
    ERROR_EVENTS: 1.0,        // Track all errors
    DEBUG_EVENTS: 0.1,        // Sample 10% of debug events in production
  },

  // Logging configuration
  LOGGING: {
    MAX_LOGS_IN_MEMORY: 1000,
    MAX_LOG_ENTRY_SIZE: 10000, // bytes
    BATCH_SIZE: 50,            // logs to send in one batch
    FLUSH_INTERVAL: 30000,     // 30 seconds
  },

  // Error reporting
  ERROR_REPORTING: {
    ENABLED: true,
    INCLUDE_STACK_TRACE: true,
    INCLUDE_USER_ID: true,
    INCLUDE_DEVICE_INFO: true,
    MAX_BREADCRUMBS: 100,
  },

  // Feature flags for monitoring
  FEATURE_FLAGS: {
    DETAILED_PERFORMANCE_TRACKING: true,
    REAL_TIME_ANALYTICS: true,
    MEMORY_USAGE_TRACKING: true,
    NETWORK_MONITORING: true,
    CRASH_REPORTING: true,
  },

  // Alert thresholds
  ALERT_THRESHOLDS: {
    ERROR_RATE_PERCENT: 5,     // Alert if error rate exceeds 5%
    CRASH_RATE_PERCENT: 1,     // Alert if crash rate exceeds 1%
    SLOW_RESPONSE_PERCENT: 10, // Alert if 10% of responses are slow
    MEMORY_USAGE_MB: 500,      // Alert if memory usage exceeds 500MB
  },

  // Environment-specific settings
  ENVIRONMENT_OVERRIDES: {
    development: {
      SAMPLING_RATES: {
        DEBUG_EVENTS: 1.0,     // Track all debug events in development
      },
      LOGGING: {
        MAX_LOGS_IN_MEMORY: 5000, // Keep more logs in development
      },
    },
    production: {
      SAMPLING_RATES: {
        DEBUG_EVENTS: 0.05,    // Sample only 5% of debug events in production
      },
      FEATURE_FLAGS: {
        DETAILED_PERFORMANCE_TRACKING: false, // Reduce overhead in production
      },
    },
  },
};

// Get environment-specific configuration
export function getMonitoringConfig() {
  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
  const baseConfig = MONITORING_CONFIG;
  const envOverrides = MONITORING_CONFIG.ENVIRONMENT_OVERRIDES[environment as keyof typeof MONITORING_CONFIG.ENVIRONMENT_OVERRIDES] || {};
  
  // Merge configurations
  return {
    ...baseConfig,
    SAMPLING_RATES: {
      ...baseConfig.SAMPLING_RATES,
      ...envOverrides.SAMPLING_RATES,
    },
    LOGGING: {
      ...baseConfig.LOGGING,
      ...envOverrides.LOGGING,
    },
    FEATURE_FLAGS: {
      ...baseConfig.FEATURE_FLAGS,
      ...envOverrides.FEATURE_FLAGS,
    },
  };
}