import { InputValidation, ValidationError } from '../inputValidation';

describe('InputValidation', () => {
  describe('validateLatitude', () => {
    it('should validate correct latitude values', () => {
      expect(InputValidation.validateLatitude(0)).toBe(true);
      expect(InputValidation.validateLatitude(37.7749)).toBe(true);
      expect(InputValidation.validateLatitude(-37.7749)).toBe(true);
      expect(InputValidation.validateLatitude(90)).toBe(true);
      expect(InputValidation.validateLatitude(-90)).toBe(true);
    });

    it('should reject invalid latitude values', () => {
      expect(InputValidation.validateLatitude(91)).toBe(false);
      expect(InputValidation.validateLatitude(-91)).toBe(false);
      expect(InputValidation.validateLatitude(NaN)).toBe(false);
      expect(InputValidation.validateLatitude('37.7749' as any)).toBe(false);
    });
  });

  describe('validateLongitude', () => {
    it('should validate correct longitude values', () => {
      expect(InputValidation.validateLongitude(0)).toBe(true);
      expect(InputValidation.validateLongitude(-122.4194)).toBe(true);
      expect(InputValidation.validateLongitude(122.4194)).toBe(true);
      expect(InputValidation.validateLongitude(180)).toBe(true);
      expect(InputValidation.validateLongitude(-180)).toBe(true);
    });

    it('should reject invalid longitude values', () => {
      expect(InputValidation.validateLongitude(181)).toBe(false);
      expect(InputValidation.validateLongitude(-181)).toBe(false);
      expect(InputValidation.validateLongitude(NaN)).toBe(false);
      expect(InputValidation.validateLongitude('-122.4194' as any)).toBe(false);
    });
  });

  describe('validateRadius', () => {
    it('should validate correct radius values', () => {
      expect(InputValidation.validateRadius(1)).toBe(true);
      expect(InputValidation.validateRadius(5000)).toBe(true);
      expect(InputValidation.validateRadius(40000)).toBe(true);
    });

    it('should reject invalid radius values', () => {
      expect(InputValidation.validateRadius(0)).toBe(false);
      expect(InputValidation.validateRadius(-1)).toBe(false);
      expect(InputValidation.validateRadius(40001)).toBe(false);
      expect(InputValidation.validateRadius(NaN)).toBe(false);
      expect(InputValidation.validateRadius('5000' as any)).toBe(false);
    });
  });

  describe('validateLimit', () => {
    it('should validate correct limit values', () => {
      expect(InputValidation.validateLimit(1)).toBe(true);
      expect(InputValidation.validateLimit(25)).toBe(true);
      expect(InputValidation.validateLimit(50)).toBe(true);
    });

    it('should reject invalid limit values', () => {
      expect(InputValidation.validateLimit(0)).toBe(false);
      expect(InputValidation.validateLimit(-1)).toBe(false);
      expect(InputValidation.validateLimit(51)).toBe(false);
      expect(InputValidation.validateLimit(1.5)).toBe(false);
      expect(InputValidation.validateLimit(NaN)).toBe(false);
      expect(InputValidation.validateLimit('25' as any)).toBe(false);
    });
  });

  describe('validatePriceRange', () => {
    it('should validate correct price range values', () => {
      expect(InputValidation.validatePriceRange('1')).toBe(true);
      expect(InputValidation.validatePriceRange('1,2')).toBe(true);
      expect(InputValidation.validatePriceRange('1,2,3,4')).toBe(true);
      expect(InputValidation.validatePriceRange('2,3')).toBe(true);
    });

    it('should reject invalid price range values', () => {
      expect(InputValidation.validatePriceRange('')).toBe(false);
      expect(InputValidation.validatePriceRange('0')).toBe(false);
      expect(InputValidation.validatePriceRange('5')).toBe(false);
      expect(InputValidation.validatePriceRange('1,2,5')).toBe(false);
      expect(InputValidation.validatePriceRange('invalid')).toBe(false);
      expect(InputValidation.validatePriceRange(123 as any)).toBe(false);
    });
  });

  describe('validateSearchTerm', () => {
    it('should validate safe search terms', () => {
      expect(InputValidation.validateSearchTerm('pizza')).toBe(true);
      expect(InputValidation.validateSearchTerm('italian restaurant')).toBe(true);
      expect(InputValidation.validateSearchTerm('café')).toBe(true);
      expect(InputValidation.validateSearchTerm('burger & fries')).toBe(true);
    });

    it('should reject dangerous search terms', () => {
      expect(InputValidation.validateSearchTerm('<script>alert("xss")</script>')).toBe(false);
      expect(InputValidation.validateSearchTerm('javascript:void(0)')).toBe(false);
      expect(InputValidation.validateSearchTerm('<iframe src="evil.com"></iframe>')).toBe(false);
      expect(InputValidation.validateSearchTerm('onclick="alert(1)"')).toBe(false);
    });

    it('should reject invalid input types or lengths', () => {
      expect(InputValidation.validateSearchTerm('')).toBe(false);
      expect(InputValidation.validateSearchTerm('a'.repeat(101))).toBe(false);
      expect(InputValidation.validateSearchTerm(123 as any)).toBe(false);
    });
  });

  describe('validateRoomPin', () => {
    it('should validate correct room PINs', () => {
      expect(InputValidation.validateRoomPin('123456')).toBe(true);
      expect(InputValidation.validateRoomPin('000000')).toBe(true);
      expect(InputValidation.validateRoomPin('999999')).toBe(true);
    });

    it('should reject invalid room PINs', () => {
      expect(InputValidation.validateRoomPin('12345')).toBe(false);
      expect(InputValidation.validateRoomPin('1234567')).toBe(false);
      expect(InputValidation.validateRoomPin('12345a')).toBe(false);
      expect(InputValidation.validateRoomPin('abc123')).toBe(false);
      expect(InputValidation.validateRoomPin('')).toBe(false);
      expect(InputValidation.validateRoomPin(123456 as any)).toBe(false);
    });
  });

  describe('validateDisplayName', () => {
    it('should validate correct display names', () => {
      expect(InputValidation.validateDisplayName('John')).toBe(true);
      expect(InputValidation.validateDisplayName('John Doe')).toBe(true);
      expect(InputValidation.validateDisplayName('User123')).toBe(true);
      expect(InputValidation.validateDisplayName('Test-User')).toBe(true);
      expect(InputValidation.validateDisplayName('User_Name')).toBe(true);
    });

    it('should reject invalid display names', () => {
      expect(InputValidation.validateDisplayName('')).toBe(false);
      expect(InputValidation.validateDisplayName('a'.repeat(51))).toBe(false);
      expect(InputValidation.validateDisplayName('User@Name')).toBe(false);
      expect(InputValidation.validateDisplayName('User<Name>')).toBe(false);
      expect(InputValidation.validateDisplayName('User&Name')).toBe(false);
      expect(InputValidation.validateDisplayName(123 as any)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(InputValidation.validateEmail('test@example.com')).toBe(true);
      expect(InputValidation.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(InputValidation.validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(InputValidation.validateEmail('invalid-email')).toBe(false);
      expect(InputValidation.validateEmail('user@')).toBe(false);
      expect(InputValidation.validateEmail('@domain.com')).toBe(false);
      expect(InputValidation.validateEmail('user@domain')).toBe(false);
      expect(InputValidation.validateEmail('user name@domain.com')).toBe(false);
      expect(InputValidation.validateEmail('a'.repeat(250) + '@domain.com')).toBe(false);
      expect(InputValidation.validateEmail(123 as any)).toBe(false);
    });
  });

  describe('validateUserId', () => {
    it('should validate correct user IDs', () => {
      expect(InputValidation.validateUserId('abc123')).toBe(true);
      expect(InputValidation.validateUserId('user-id-with-uuid-format')).toBe(true);
      expect(InputValidation.validateUserId('a'.repeat(128))).toBe(true);
    });

    it('should reject invalid user IDs', () => {
      expect(InputValidation.validateUserId('')).toBe(false);
      expect(InputValidation.validateUserId('a'.repeat(129))).toBe(false);
      expect(InputValidation.validateUserId(123 as any)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize HTML characters', () => {
      expect(InputValidation.sanitizeString('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      
      expect(InputValidation.sanitizeString('User & Company'))
        .toBe('User &amp; Company');
      
      expect(InputValidation.sanitizeString("User's input"))
        .toBe('User&#x27;s input');
    });

    it('should handle non-string input', () => {
      expect(InputValidation.sanitizeString(123 as any)).toBe('');
      expect(InputValidation.sanitizeString(null as any)).toBe('');
      expect(InputValidation.sanitizeString(undefined as any)).toBe('');
    });

    it('should trim whitespace', () => {
      expect(InputValidation.sanitizeString('  test  ')).toBe('test');
    });
  });

  describe('validateCoordinates', () => {
    it('should validate and round correct coordinates', () => {
      const result = InputValidation.validateCoordinates(37.774929, -122.419416);
      expect(result).toEqual({
        lat: 37.774929,
        lng: -122.419416
      });
    });

    it('should round coordinates to 6 decimal places', () => {
      const result = InputValidation.validateCoordinates(37.7749291234567, -122.4194161234567);
      expect(result).toEqual({
        lat: 37.774929,
        lng: -122.419416
      });
    });

    it('should return null for invalid coordinates', () => {
      expect(InputValidation.validateCoordinates(91, -122.419416)).toBe(null);
      expect(InputValidation.validateCoordinates(37.774929, 181)).toBe(null);
      expect(InputValidation.validateCoordinates(NaN, -122.419416)).toBe(null);
    });
  });

  describe('validateSortBy', () => {
    it('should validate correct sort options', () => {
      expect(InputValidation.validateSortBy('best_match')).toBe(true);
      expect(InputValidation.validateSortBy('rating')).toBe(true);
      expect(InputValidation.validateSortBy('review_count')).toBe(true);
      expect(InputValidation.validateSortBy('distance')).toBe(true);
    });

    it('should reject invalid sort options', () => {
      expect(InputValidation.validateSortBy('popularity')).toBe(false);
      expect(InputValidation.validateSortBy('price')).toBe(false);
      expect(InputValidation.validateSortBy('')).toBe(false);
      expect(InputValidation.validateSortBy('RATING')).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('Test validation error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test validation error');
    });
  });
});