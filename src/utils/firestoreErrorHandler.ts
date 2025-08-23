/**
 * Firestore Error Handler Utility
 * Provides consistent error handling for Firestore operations
 */

// interface FirestoreError {
//   code: string;
//   message: string;
// }

export class FirestoreErrorHandler {
  /**
   * Check if an error is a Firestore index-related error
   */
  static isIndexError(error: any): boolean {
    return error?.code === 'failed-precondition' && 
           error?.message?.includes('index');
  }

  /**
   * Check if an error is a Firestore permission error
   */
  static isPermissionError(error: any): boolean {
    return error?.code === 'permission-denied';
  }

  /**
   * Check if an error is a network-related error
   */
  static isNetworkError(error: any): boolean {
    return error?.code === 'unavailable' || 
           error?.code === 'timeout' ||
           error?.message?.includes('network');
  }

  /**
   * Get a user-friendly error message
   */
  static getUserFriendlyMessage(error: any, operation: string = 'operation'): string {
    if (this.isIndexError(error)) {
      return `Loading ${operation}... (database indexing in progress)`;
    }
    
    if (this.isPermissionError(error)) {
      return `Permission denied for ${operation}. Please check your account.`;
    }
    
    if (this.isNetworkError(error)) {
      return `Network error during ${operation}. Please check your connection.`;
    }
    
    // Generic fallback
    return `Failed to complete ${operation}. Please try again.`;
  }

  /**
   * Execute a Firestore operation with proper error handling
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    _operationName: string = 'operation'
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry index errors (they need time to build)
        if (this.isIndexError(error)) {
          throw error;
        }
        
        // Don't retry permission errors
        if (this.isPermissionError(error)) {
          throw error;
        }
        
        // Retry network errors with exponential backoff
        if (this.isNetworkError(error) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors, throw immediately
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Log Firestore errors consistently
   */
  static logError(error: any, _context: string): void {
    if (this.isIndexError(error)) {
      // Log index creation message
    } else {
      // Log Firestore error
    }
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    _operationName: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Check if error is retryable
        if (!this.isNetworkError(error)) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  static handleIndexError(error: any, _context: string): void {
    if (this.isIndexError(error)) {
      // Log index creation message
    }
  }
}