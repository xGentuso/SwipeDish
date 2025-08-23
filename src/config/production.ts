// Production configuration
export const PRODUCTION_CONFIG = {
  // Logging configuration
  LOGGING: {
    ENABLE_CONSOLE_LOGS: false,
    ENABLE_DEBUG_LOGS: false,
    ENABLE_INFO_LOGS: true,
    ENABLE_WARN_LOGS: true,
    ENABLE_ERROR_LOGS: true,
  },
  
  // Debug features
  DEBUG: {
    ENABLE_DEBUG_MODE: false,
    ENABLE_PERFORMANCE_MONITORING: false,
    ENABLE_DETAILED_ERROR_LOGS: false,
  },
  
  // Error tracking
  ERROR_TRACKING: {
    ENABLE_STACK_TRACES: false,
    ENABLE_DETAILED_ERRORS: false,
    SANITIZE_ERRORS: true,
  },
  
  // Analytics
  ANALYTICS: {
    ENABLE_DETAILED_TRACKING: false,
    ENABLE_USER_ID_TRACKING: false,
    ENABLE_LOCATION_TRACKING: false,
  },
  
  // Performance
  PERFORMANCE: {
    ENABLE_DETAILED_MONITORING: false,
    ENABLE_TIMING_LOGS: false,
  }
};

export const isProduction = () => 
  process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

export const shouldEnableFeature = (feature: keyof typeof PRODUCTION_CONFIG) => {
  if (!isProduction()) return true;
  return PRODUCTION_CONFIG[feature]?.ENABLE_DEBUG_LOGS !== false;
};
