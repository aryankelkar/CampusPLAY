/**
 * Phone Number Validation and Normalization Utility
 * Supports Indian mobile numbers (primary target) and international numbers
 */

/**
 * Validates and normalizes phone numbers.
 * @param {string} phoneRaw - The raw input phone string
 * @param {object} options - Options: isRequired (default true), isAlternate (default false)
 * @returns {{ valid: boolean, normalized: string, message?: string }}
 */
export function validateAndNormalizePhone(phoneRaw, options = {}) {
  const { isRequired = true, isAlternate = false } = options;
  const label = isAlternate ? 'Alternate mobile number' : 'Mobile number';

  if (!phoneRaw || String(phoneRaw).trim() === '') {
    if (isRequired) {
      return {
        valid: false,
        normalized: '',
        message: `${label} is required.`,
      };
    }
    return {
      valid: true,
      normalized: '',
    };
  }

  const rawTrimmed = String(phoneRaw).trim();

  // Reject arbitrary text or characters other than digits, +, -, spaces, and parentheses
  if (/[^\d+\-\s()]/.test(rawTrimmed)) {
    return {
      valid: false,
      normalized: '',
      message: `${label} contains invalid characters. Only digits, +, -, and spaces are allowed.`,
    };
  }

  // Check if international format (starts with +)
  if (rawTrimmed.startsWith('+')) {
    const digitsOnly = rawTrimmed.slice(1).replace(/[\s\-()]/g, '');
    if (!/^\d+$/.test(digitsOnly)) {
      return {
        valid: false,
        normalized: '',
        message: `${label} has an invalid international format.`,
      };
    }

    // Check if +91 (India)
    if (digitsOnly.startsWith('91')) {
      const indianDigits = digitsOnly.slice(2);
      return validateIndianDigits(indianDigits, label);
    }

    // Generic international format (8-15 digits E.164)
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      return {
        valid: false,
        normalized: '',
        message: `${label} must contain between 8 and 15 digits for international numbers.`,
      };
    }

    // Disallow repeated single digit numbers
    if (/^(\d)\1+$/.test(digitsOnly)) {
      return {
        valid: false,
        normalized: '',
        message: `${label} cannot consist of repeating dummy digits.`,
      };
    }

    return {
      valid: true,
      normalized: `+${digitsOnly}`,
    };
  }

  // Strip all non-digit characters for standard/Indian processing
  let digits = rawTrimmed.replace(/[\s\-()]/g, '');

  // Strip leading 0 if present (e.g., 09876543210 -> 9876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Strip leading 91 if 12 digits (e.g. 919876543210 -> 9876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  return validateIndianDigits(digits, label);
}

/**
 * Validates 10-digit Indian mobile number
 * @param {string} digits 
 * @param {string} label 
 */
function validateIndianDigits(digits, label) {
  if (digits.length !== 10) {
    return {
      valid: false,
      normalized: '',
      message: `${label} must be a valid 10-digit mobile number.`,
    };
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(digits)) {
    return {
      valid: false,
      normalized: '',
      message: `${label} must start with 6, 7, 8, or 9 for Indian telecommunications.`,
    };
  }

  // Reject repeating single digit sequences e.g. 9999999999, 8888888888
  if (/^(\d)\1{9}$/.test(digits)) {
    return {
      valid: false,
      normalized: '',
      message: `${label} cannot consist of identical repeating digits.`,
    };
  }

  return {
    valid: true,
    normalized: digits,
  };
}
