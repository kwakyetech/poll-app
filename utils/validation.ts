/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate poll title
 */
export function isValidPollTitle(title: string): {
  isValid: boolean;
  error?: string;
} {
  if (!title.trim()) {
    return { isValid: false, error: 'Poll title is required' };
  }

  if (title.length < 3) {
    return { isValid: false, error: 'Poll title must be at least 3 characters long' };
  }

  if (title.length > 200) {
    return { isValid: false, error: 'Poll title must be less than 200 characters' };
  }

  return { isValid: true };
}

/**
 * Validate poll options
 */
export function isValidPollOptions(options: string[]): {
  isValid: boolean;
  error?: string;
} {
  const validOptions = options.filter(option => option.trim().length > 0);

  if (validOptions.length < 2) {
    return { isValid: false, error: 'Poll must have at least 2 options' };
  }

  if (validOptions.length > 10) {
    return { isValid: false, error: 'Poll cannot have more than 10 options' };
  }

  // Check for duplicate options
  const uniqueOptions = new Set(validOptions.map(option => option.trim().toLowerCase()));
  if (uniqueOptions.size !== validOptions.length) {
    return { isValid: false, error: 'Poll options must be unique' };
  }

  // Check option length
  for (const option of validOptions) {
    if (option.length > 100) {
      return { isValid: false, error: 'Each option must be less than 100 characters' };
    }
  }

  return { isValid: true };
}

/**
 * Validate poll description
 */
export function isValidPollDescription(description?: string): {
  isValid: boolean;
  error?: string;
} {
  if (!description) {
    return { isValid: true }; // Description is optional
  }

  if (description.length > 500) {
    return { isValid: false, error: 'Description must be less than 500 characters' };
  }

  return { isValid: true };
}

/**
 * Validate expiration date
 */
export function isValidExpirationDate(expiresAt?: string): {
  isValid: boolean;
  error?: string;
} {
  if (!expiresAt) {
    return { isValid: true }; // Expiration is optional
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();

  if (isNaN(expirationDate.getTime())) {
    return { isValid: false, error: 'Invalid expiration date' };
  }

  if (expirationDate <= now) {
    return { isValid: false, error: 'Expiration date must be in the future' };
  }

  // Check if expiration is too far in the future (1 year max)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (expirationDate > oneYearFromNow) {
    return { isValid: false, error: 'Expiration date cannot be more than 1 year from now' };
  }

  return { isValid: true };
}