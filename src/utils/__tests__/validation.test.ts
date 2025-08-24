import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateRoomName,
  validateRoomPin,
  validateSearchQuery,
  sanitizeString
} from '../validation';

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name+tag@domain.co.uk',
        'x@y.z',
        'user123@domain123.com'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        '',
        '   ',
        'notanemail',
        '@domain.com',
        'user@',
        'user@@domain.com',
        'user@domain',
        'user@domain..com'
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject emails with XSS attempts', () => {
      const maliciousEmails = [
        'test@example.com<script>alert("xss")</script>',
        'javascript:alert("xss")@domain.com',
        'user@domain.com onload=alert("xss")'
      ];

      maliciousEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('invalid characters'))).toBe(true);
      });
    });

    it('should reject overly long emails', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('too long'))).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123',
        'MyStr0ngP@ss!',
        'Complex1Pass',
        'ValidPassword1'
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '',
        'short',
        'nouppercase123',
        'NOLOWERCASE123',
        'NoNumbers',
        'a'.repeat(130) // too long
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateDisplayName', () => {
    it('should validate good display names', () => {
      const validNames = [
        'John Doe',
        'Alice_123',
        'Bob-Smith',
        'User.Name',
        'Test User 42'
      ];

      validNames.forEach(name => {
        const result = validateDisplayName(name);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid display names', () => {
      const invalidNames = [
        '',
        '   ',
        'a', // too short
        'a'.repeat(31), // too long
        'name@domain.com', // invalid characters
        'test<script>', // XSS attempt
        'name!@#$%' // special characters
      ];

      invalidNames.forEach(name => {
        const result = validateDisplayName(name);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateRoomPin', () => {
    it('should validate correct room PINs', () => {
      const validPins = [
        'ABC123',
        '123456',
        'ZZZZZZ',
        '000000'
      ];

      validPins.forEach(pin => {
        const result = validateRoomPin(pin);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid room PINs', () => {
      const invalidPins = [
        '',
        '12345', // too short
        '1234567', // too long
        'abc123', // lowercase not allowed
        '123@45', // special characters
        '   123456   ' // contains spaces
      ];

      invalidPins.forEach(pin => {
        const result = validateRoomPin(pin);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const malicious = 'Hello <script>alert("xss")</script> World';
      const sanitized = sanitizeString(malicious);
      
      expect(sanitized).toBe('Hello  World');
      expect(sanitized).not.toContain('<script>');
    });

    it('should remove javascript: protocols', () => {
      const malicious = 'Click javascript:alert("xss") here';
      const sanitized = sanitizeString(malicious);
      
      expect(sanitized).toBe('Click alert("xss") here');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const malicious = 'Text with onload=alert("xss") event';
      const sanitized = sanitizeString(malicious);
      
      expect(sanitized).not.toContain('onload=');
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });
  });

  describe('validateSearchQuery', () => {
    it('should validate normal search queries', () => {
      const validQueries = [
        'pizza',
        'italian restaurant',
        'best burgers near me',
        ''  // empty is allowed for search
      ];

      validQueries.forEach(query => {
        const result = validateSearchQuery(query);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject malicious search queries', () => {
      const maliciousQueries = [
        '<script>alert("xss")</script>',
        'search javascript:alert("xss")',
        'query with onload=evil()'
      ];

      maliciousQueries.forEach(query => {
        const result = validateSearchQuery(query);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('invalid characters'))).toBe(true);
      });
    });

    it('should reject overly long queries', () => {
      const longQuery = 'a'.repeat(101);
      const result = validateSearchQuery(longQuery);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('too long'))).toBe(true);
    });
  });
});