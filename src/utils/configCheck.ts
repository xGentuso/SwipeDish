export interface ConfigValidationResult {
  isValid: boolean;
  missingKeys: string[];
  invalidKeys: string[];
  warnings: string[];
}

export interface ServiceConfig {
  firebase: {
    apiKey: boolean;
    authDomain: boolean;
    projectId: boolean;
    appId: boolean;
  };
  googleSignIn: {
    webClientId: boolean;
  };
  yelp: {
    apiKey: boolean;
  };
}

class ConfigValidator {
  private static readonly REQUIRED_FIREBASE_KEYS = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];

  private static readonly OPTIONAL_KEYS = [
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', // Optional for Google Sign-In
    'EXPO_PUBLIC_YELP_API_KEY', // Optional for Yelp integration
  ];

  /**
   * Validate API key format and content
   */
  private static validateApiKeyFormat(key: string, value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    
    switch (key) {
      case 'EXPO_PUBLIC_FIREBASE_API_KEY':
        // Firebase API keys typically start with 'AIza' and are 39 characters
        return value.startsWith('AIza') && value.length === 39;
      
      case 'EXPO_PUBLIC_FIREBASE_PROJECT_ID':
        // Project IDs are lowercase, alphanumeric with hyphens
        return /^[a-z0-9-]+$/.test(value) && value.length > 0;
      
      case 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN':
        // Auth domains should end with .firebaseapp.com
        return value.endsWith('.firebaseapp.com') && value.length > '.firebaseapp.com'.length;
      
      case 'EXPO_PUBLIC_FIREBASE_APP_ID':
        // Firebase app IDs have a specific format
        return /^1:\d+:(android|ios|web):[a-f0-9]+$/.test(value);
      
      case 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID':
        // Google client IDs end with .apps.googleusercontent.com
        return value.endsWith('.apps.googleusercontent.com');
      
      case 'EXPO_PUBLIC_YELP_API_KEY':
        // Yelp API keys are typically long alphanumeric strings
        return /^[A-Za-z0-9_-]{40,}$/.test(value);
      
      default:
        return value.length > 0;
    }
  }

  /**
   * Check if all required environment variables are present and valid
   */
  static validateConfiguration(): ConfigValidationResult {
    const result: ConfigValidationResult = {
      isValid: true,
      missingKeys: [],
      invalidKeys: [],
      warnings: []
    };

    // Check required Firebase keys
    for (const key of this.REQUIRED_FIREBASE_KEYS) {
      const value = process.env[key];
      
      if (!value) {
        result.missingKeys.push(key);
        result.isValid = false;
      } else if (!this.validateApiKeyFormat(key, value)) {
        result.invalidKeys.push(key);
        result.isValid = false;
      }
    }

    // Check optional keys and warn if missing/invalid
    for (const key of this.OPTIONAL_KEYS) {
      const value = process.env[key];
      
      if (!value) {
        result.warnings.push(`Optional service ${key} not configured - some features may be unavailable`);
      } else if (!this.validateApiKeyFormat(key, value)) {
        result.warnings.push(`Optional service ${key} appears to have invalid format`);
      }
    }

    return result;
  }

  /**
   * Validate configuration and throw errors for critical issues
   */
  static validateConfigurationStrict(): void {
    const result = ConfigValidator.validateConfiguration();

    if (result.missingKeys.length > 0) {
      const error = `Missing required environment variables: ${result.missingKeys.join(', ')}`;
      console.error('[CONFIG_VALIDATION]', error);
      throw new Error(`Configuration Error: ${error}`);
    }

    if (result.invalidKeys.length > 0) {
      const error = `Invalid environment variables detected: ${result.invalidKeys.join(', ')}`;
      console.error('[CONFIG_VALIDATION]', error);
      throw new Error(`Configuration Error: ${error}`);
    }

    // Log warnings for optional services
    for (const warning of result.warnings) {
      console.warn('[CONFIG_VALIDATION]', warning);
    }

    console.info('[CONFIG_VALIDATION] Configuration validation passed');
  }
}

export const checkConfiguration = (): ServiceConfig => {
  const config: ServiceConfig = {
    firebase: {
      apiKey: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      appId: !!process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
    googleSignIn: {
      webClientId: !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    },
    yelp: {
      apiKey: !!process.env.EXPO_PUBLIC_YELP_API_KEY,
    },
  };

  return config;
};

export const validateConfiguration = ConfigValidator.validateConfiguration;
export const validateConfigurationStrict = ConfigValidator.validateConfigurationStrict;
