export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" };
  }
  if (password.length > 100) {
    return { valid: false, error: "Password is too long" };
  }
  return { valid: true };
};

export const sanitizeString = (input: string, maxLength: number = 100): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, maxLength);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^09\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateNumber = (value: any, min: number, max: number): { valid: boolean; error?: string } => {
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, error: "Must be a valid number" };
  }
  if (num < min) {
    return { valid: false, error: `Must be at least ${min}` };
  }
  if (num > max) {
    return { valid: false, error: `Must not exceed ${max}` };
  }
  return { valid: true };
};

export const validateObjectId = (id: string): boolean => {
  // UUID v4 validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};