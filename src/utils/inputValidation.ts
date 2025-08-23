export class InputValidation {
  /**
   * Validate latitude coordinates
   */
  static validateLatitude(lat: number): boolean {
    return typeof lat === 'number' && lat >= -90 && lat <= 90 && !isNaN(lat);
  }

  /**
   * Validate longitude coordinates
   */
  static validateLongitude(lng: number): boolean {
    return typeof lng === 'number' && lng >= -180 && lng <= 180 && !isNaN(lng);
  }

  /**
   * Validate search radius (in meters)
   */
  static validateRadius(radius: number): boolean {
    return typeof radius === 'number' && radius > 0 && radius <= 40000 && !isNaN(radius);
  }

  /**
   * Validate search limit (max results)
   */
  static validateLimit(limit: number): boolean {
    return typeof limit === 'number' && limit > 0 && limit <= 50 && Number.isInteger(limit);
  }

  /**
   * Validate price range string (e.g., "1,2,3,4")
   */
  static validatePriceRange(price: string): boolean {
    if (typeof price !== 'string' || price.length === 0) return false;
    const prices = price.split(',');
    return prices.every(p => ['1', '2', '3', '4'].includes(p.trim()));
  }

  /**
   * Validate search term for XSS and length
   */
  static validateSearchTerm(term: string): boolean {
    if (typeof term !== 'string') return false;
    if (term.length === 0 || term.length > 100) return false;
    
    // Check for potential XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];
    
    return !xssPatterns.some(pattern => pattern.test(term));
  }

  /**
   * Validate room PIN (6 digits)
   */
  static validateRoomPin(pin: string): boolean {
    return typeof pin === 'string' && /^\d{6}$/.test(pin);
  }

  /**
   * Validate display name
   */
  static validateDisplayName(name: string): boolean {
    if (typeof name !== 'string' || name.length === 0) return false;
    if (name.length > 50) return false;
    
    // Only allow alphanumeric, spaces, hyphens, underscores
    return /^[a-zA-Z0-9\s\-_]+$/.test(name.trim());
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate user ID format (Firebase UID)
   */
  static validateUserId(userId: string): boolean {
    return typeof userId === 'string' && userId.length > 0 && userId.length <= 128;
  }

  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  /**
   * Validate and sanitize coordinates
   */
  static validateCoordinates(lat: number, lng: number): { lat: number; lng: number } | null {
    if (!this.validateLatitude(lat) || !this.validateLongitude(lng)) {
      return null;
    }
    
    return {
      lat: Math.round(lat * 1000000) / 1000000, // Limit to 6 decimal places
      lng: Math.round(lng * 1000000) / 1000000
    };
  }

  /**
   * Validate sort by parameter
   */
  static validateSortBy(sortBy: string): boolean {
    const validSortOptions = ['best_match', 'rating', 'review_count', 'distance'];
    return validSortOptions.includes(sortBy);
  }
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}