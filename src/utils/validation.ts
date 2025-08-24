export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email || email.trim() === '') {
    errors.push('Email is required');
  } else {
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please enter a valid email address');
    }
    
    // Check for common security issues
    if (email.length > 254) {
      errors.push('Email address is too long');
    }
    
    // Basic XSS prevention
    if (/<script|javascript:|on\w+=/i.test(email)) {
      errors.push('Email contains invalid characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password || password === '') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password is too long (max 128 characters)');
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDisplayName = (displayName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!displayName || displayName.trim() === '') {
    errors.push('Display name is required');
  } else {
    const trimmed = displayName.trim();
    
    if (trimmed.length < 2) {
      errors.push('Display name must be at least 2 characters long');
    }
    
    if (trimmed.length > 30) {
      errors.push('Display name must be less than 30 characters');
    }
    
    // Check for valid characters (letters, numbers, spaces, basic punctuation)
    if (!/^[a-zA-Z0-9\s\-_.]+$/.test(trimmed)) {
      errors.push('Display name contains invalid characters');
    }
    
    // Basic XSS prevention
    if (/<script|javascript:|on\w+=/i.test(trimmed)) {
      errors.push('Display name contains invalid characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRoomName = (roomName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!roomName || roomName.trim() === '') {
    errors.push('Room name is required');
  } else {
    const trimmed = roomName.trim();
    
    if (trimmed.length < 3) {
      errors.push('Room name must be at least 3 characters long');
    }
    
    if (trimmed.length > 50) {
      errors.push('Room name must be less than 50 characters');
    }
    
    // Check for valid characters
    if (!/^[a-zA-Z0-9\s\-_.!']+$/.test(trimmed)) {
      errors.push('Room name contains invalid characters');
    }
    
    // Basic XSS prevention
    if (/<script|javascript:|on\w+=/i.test(trimmed)) {
      errors.push('Room name contains invalid characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRoomPin = (pin: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!pin || pin.trim() === '') {
    errors.push('Room PIN is required');
  } else {
    const trimmed = pin.trim();
    
    // PIN should be 6 characters
    if (trimmed.length !== 6) {
      errors.push('Room PIN must be exactly 6 characters');
    }
    
    // PIN should only contain letters and numbers
    if (!/^[A-Z0-9]+$/.test(trimmed)) {
      errors.push('Room PIN can only contain letters and numbers');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeString = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

export const validateSearchQuery = (query: string): ValidationResult => {
  const errors: string[] = [];
  
  if (query && query.trim()) {
    const trimmed = query.trim();
    
    if (trimmed.length > 100) {
      errors.push('Search query is too long (max 100 characters)');
    }
    
    // Basic XSS prevention
    if (/<script|javascript:|on\w+=/i.test(trimmed)) {
      errors.push('Search query contains invalid characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};