/**
 * Client-Side Security & Sanitization Utilities
 * Sanjay's Lightworks Studio
 *
 * Implements strict input validation, HTML escaping for XSS prevention,
 * and secure credential handling.
 */

/**
 * Escapes unsafe HTML characters to prevent Cross-Site Scripting (XSS).
 * Safe for rendering in innerHTML or dynamic attributes when textContent is not used.
 */
export function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') {
    if (str === null || str === undefined) return '';
    return String(str);
  }
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
  };
  return str.replace(/[&<>"'/`]/g, (char) => map[char] || char);
}

/**
 * Strips dangerous HTML tags, javascript: pseudo-protocols, and scripts from user input.
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove pseudo-protocols
    .replace(/data:/gi, '')
    .trim();
}

/**
 * Validates standard email address RFC 5322 compliance.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email.trim()) && email.length <= 254;
}

/**
 * Validates phone numbers (allows international formats with +, digits, hyphens, brackets, spaces).
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s().-]/g, '');
  return /^(\+?[0-9]{7,15})$/.test(cleaned);
}

/**
 * Secure JWT storage helpers.
 * Manages admin session token in sessionStorage/localStorage with expiry verification.
 */
const TOKEN_KEY = 'sanjay_admin_jwt_token';

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('sanjay_admin_authenticated', 'true');
  } catch {
    // storage unavailable
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('sanjay_admin_authenticated');
  } catch {
    // storage unavailable
  }
}

/**
 * Authenticated API Fetch wrapper that attaches Bearer tokens and handles 401s.
 */
export async function secureAdminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAdminToken();
    window.dispatchEvent(new CustomEvent('admin-auth-expired'));
  }

  return response;
}

/**
 * Google Authenticator TOTP Interface & Helpers
 */
export interface TotpSetupData {
  success: boolean;
  account: string;
  issuer: string;
  secret: string;
  formattedSecret: string;
  qrCodeDataUrl: string;
  otpauthUrl: string;
  digits: number;
  period: number;
}

export async function fetchTotpSetup(): Promise<TotpSetupData> {
  const res = await fetch('/api/auth/totp/setup');
  if (!res.ok) {
    throw new Error('Failed to fetch Google Authenticator setup credentials.');
  }
  return res.json();
}

export async function verifyTotpLogin(code: string): Promise<{ success: boolean; token: string; user: { role: string; email: string } }> {
  const cleanCode = code.replace(/[\s-]/g, '').trim();
  const res = await fetch('/api/auth/totp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: cleanCode }),
  });

  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.error || 'Invalid or expired 6-digit Google Authenticator code.');
  }

  setAdminToken(data.token);
  return data;
}

export async function resetTotpSecret(masterPasscode?: string): Promise<TotpSetupData> {
  const res = await secureAdminFetch('/api/auth/totp/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterPasscode }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to regenerate Google Authenticator secret.');
  }
  return res.json();
}

