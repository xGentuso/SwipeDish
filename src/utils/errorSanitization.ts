/**
 * Error sanitization utility to prevent information disclosure in production
 */
export class ErrorSanitization {
  private static isProduction(): boolean {
    return (process.env.EXPO_PUBLIC_ENVIRONMENT || 'development') === 'production';
  }

  /**
   * Sanitize error messages for safe display to users
   */
  static sanitizeErrorMessage(error: unknown, context: string = 'Unknown'): string {
    const isProduction = this.isProduction();
    
    // In development, show detailed error messages
    if (!isProduction) {
      if (error instanceof Error) {
        return `[${context}] ${error.message}`;
      }
      return `[${context}] ${String(error)}`;
    }

    // In production, show generic user-friendly messages
    if (error instanceof Error) {
      return this.getGenericErrorMessage(error.message, context);
    }

    return this.getGenericErrorMessage(String(error), context);
  }

  /**
   * Get generic error message based on error type
   */
  private static getGenericErrorMessage(originalMessage: string, context: string): string {
    const lowerMessage = originalMessage.toLowerCase();

    // Authentication errors
    if (this.containsAny(lowerMessage, ['auth', 'authentication', 'login', 'password', 'email', 'user not found'])) {
      return 'Authentication failed. Please check your credentials.';
    }

    // Network/API errors
    if (this.containsAny(lowerMessage, ['network', 'timeout', 'fetch', 'connection', 'api', 'http'])) {
      return 'Connection error. Please check your internet connection and try again.';
    }

    // Firebase/Database errors
    if (this.containsAny(lowerMessage, ['firestore', 'firebase', 'database', 'permission'])) {
      return 'Database error. Please try again later.';
    }

    // Validation errors (these can be more specific as they're user-facing)
    if (this.containsAny(lowerMessage, ['validation', 'invalid', 'required', 'format'])) {
      return originalMessage; // Keep validation messages as they're user-friendly
    }

    // Rate limiting
    if (this.containsAny(lowerMessage, ['rate limit', 'too many', 'limit exceeded'])) {
      return 'Too many requests. Please try again later.';
    }

    // Generic error based on context
    switch (context.toLowerCase()) {
      case 'auth':
      case 'authentication':
        return 'Authentication error. Please try again.';
      case 'api':
      case 'network':
        return 'Service temporarily unavailable. Please try again later.';
      case 'room':
        return 'Room operation failed. Please try again.';
      case 'swipe':
        return 'Unable to process swipe. Please try again.';
      case 'location':
        return 'Unable to access location. Please check your permissions.';
      default:
        return 'Something went wrong. Please try again later.';
    }
  }

  /**
   * Check if string contains any of the given terms
   */
  private static containsAny(text: string, terms: string[]): boolean {
    return terms.some(term => text.includes(term));
  }

  /**
   * Log detailed error for debugging while showing sanitized version to user
   */
  static logAndSanitizeError(error: unknown, context: string, logger?: any): string {
    // Log full error details for debugging
    if (logger) {
      logger.error(`Detailed error in ${context}:`, error);
    } else {
      console.error(`Detailed error in ${context}:`, error);
    }

    // Return sanitized message for user display
    return this.sanitizeErrorMessage(error, context);
  }

  /**
   * Sanitize sensitive information from strings (URLs, IDs, etc.)
   */
  static sanitizeLogData(data: any): any {
    if (this.isProduction()) {
      return this.recursiveSanitize(data);
    }
    return data; // Don't sanitize in development
  }

  /**
   * Recursively sanitize sensitive data
   */
  private static recursiveSanitize(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.recursiveSanitize(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip sensitive keys entirely
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.recursiveSanitize(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Check if a key contains sensitive information
   */
  private static isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'auth', 'credential',
      'apikey', 'api_key', 'email', 'phone', 'uid', 'id',
      'address', 'location', 'coordinate'
    ];
    
    return sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );
  }

  /**
   * Sanitize sensitive information from strings
   */
  private static sanitizeString(str: string): string {
    // Remove potential API keys (long alphanumeric strings)
    str = str.replace(/[A-Za-z0-9]{20,}/g, '[API_KEY]');
    
    // Remove email addresses
    str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    
    // Remove phone numbers (basic patterns)
    str = str.replace(/\+?\d{1,4}[\s-]?\(?\d{1,3}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/g, '[PHONE]');
    
    // Remove Firebase UIDs (28 character alphanumeric)
    str = str.replace(/[A-Za-z0-9]{28}/g, '[USER_ID]');
    
    return str;
  }
}

/**
 * Custom error class for validation errors that are safe to show to users
 */
export class SafeUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeUserError';
  }
}