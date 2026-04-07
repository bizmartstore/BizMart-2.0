export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const setCSRFToken = (token: string): void => {
  localStorage.setItem('csrf_token', token);
  // Also set in a cookie for server-side validation
  document.cookie = `csrf_token=${token}; path=/; SameSite=Strict; Secure`;
};

export const getCSRFToken = (): string | null => {
  return localStorage.getItem('csrf_token') || document.cookie.match(/csrf_token=([^;]+)/)?.[1] || null;
};

export const verifyCSRFToken = (token: string): boolean => {
  const stored = getCSRFToken();
  return stored !== null && stored === token;
};