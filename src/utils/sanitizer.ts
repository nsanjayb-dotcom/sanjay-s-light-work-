/**
 * ==============================================================================
 * SANJAY'S LIGHTWORKS - FORM INPUT SANITIZER & XSS DEFENSE (src/utils/sanitizer.ts)
 * ==============================================================================
 * 
 * Production-grade client and server data sanitizer:
 * 1. Strips harmful HTML/script tags and javascript: URIs.
 * 2. Neutralizes null bytes and hazardous control characters.
 * 3. Enforces strict field-length boundaries to prevent Denial-of-Wallet & buffer attacks.
 * 4. Normalizes and validates emails, phone numbers, and dates.
 * ==============================================================================
 */

/**
 * Strips script tags, HTML tags, event handlers, and dangerous characters from arbitrary user text.
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Strip null bytes and control chars (except standard newlines/tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Strip script blocks and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip style blocks
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Strip all HTML/XML tags
    .replace(/<[^>]+>/g, '')
    // Neutralize dangerous inline protocols
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    // Trim excess whitespace
    .trim()
    // Enforce upper boundary
    .slice(0, maxLength);
}

/**
 * Validates and normalizes client email format
 */
export function sanitizeEmail(email: unknown): { isValid: boolean; sanitized: string } {
  if (typeof email !== 'string') {
    return { isValid: false, sanitized: '' };
  }

  const cleaned = email.trim().toLowerCase().slice(0, 254);
  // Standard RFC 5322 simplified email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const isValid = emailRegex.test(cleaned);

  return { isValid, sanitized: cleaned };
}

/**
 * Validates and formats phone numbers
 */
export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== 'string') {
    return '';
  }

  // Allow only numbers, space, parentheses, dashes, and leading plus
  const cleaned = phone.trim().replace(/[^0-9+\-()\s.]/g, '').slice(0, 30);
  return cleaned;
}

/**
 * Validates ISO date string YYYY-MM-DD
 */
export function sanitizeDate(dateStr: unknown): { isValid: boolean; sanitized: string } {
  if (typeof dateStr !== 'string') {
    return { isValid: false, sanitized: '' };
  }

  const cleaned = dateStr.trim().slice(0, 10);
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(cleaned)) {
    return { isValid: false, sanitized: '' };
  }

  const parsed = new Date(cleaned);
  const isValid = !isNaN(parsed.getTime());
  return { isValid, sanitized: cleaned };
}

/**
 * Sanitizes time window string (e.g., "09:30 AM" or "09:30 AM – 11:30 AM")
 */
export function sanitizeTimeSlot(slotStr: unknown): string {
  if (typeof slotStr !== 'string') {
    return '09:30 AM';
  }
  return slotStr.replace(/[^a-zA-Z0-9:\s–\-]/g, '').trim().slice(0, 60);
}

/**
 * Complete Booking Form Payload Sanitizer
 */
export interface RawBookingPayload {
  clientName?: string;
  fullName?: string;
  clientEmail?: string;
  email?: string;
  clientPhone?: string;
  phone?: string;
  packageId?: string;
  packageName?: string;
  bookingDate?: string;
  timeSlot?: string;
  location?: string;
  notes?: string;
  totalPrice?: number;
}

export function sanitizeBookingForm(raw: RawBookingPayload) {
  const name = sanitizeString(raw.clientName || raw.fullName || '', 120);
  const emailResult = sanitizeEmail(raw.clientEmail || raw.email || '');
  const phone = sanitizePhone(raw.clientPhone || raw.phone || '');
  const dateResult = sanitizeDate(raw.bookingDate || '');
  const timeSlot = sanitizeTimeSlot(raw.timeSlot || '');
  const packageId = sanitizeString(raw.packageId || 'single-photo-session', 64);
  const packageName = sanitizeString(raw.packageName || '', 120);
  const location = sanitizeString(raw.location || 'Ontario, Canada', 200);
  const notes = sanitizeString(raw.notes || '', 2000);
  const totalPrice = typeof raw.totalPrice === 'number' && raw.totalPrice >= 0 ? raw.totalPrice : 0;

  const errors: string[] = [];
  if (!name || name.length < 2) {
    errors.push('Please provide your full name (at least 2 characters).');
  }
  if (!emailResult.isValid) {
    errors.push('Please enter a valid email address so we can confirm your session.');
  }
  if (!dateResult.isValid) {
    errors.push('Please select a valid scheduled shoot date.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      clientName: name,
      clientEmail: emailResult.sanitized,
      clientPhone: phone,
      packageId,
      packageName,
      bookingDate: dateResult.sanitized,
      timeSlot,
      location,
      notes,
      totalPrice,
    },
  };
}

/**
 * Complete Contact/Inquiry Form Payload Sanitizer
 */
export interface RawInquiryPayload {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  date?: string;
  message?: string;
}

export function sanitizeInquiryForm(raw: RawInquiryPayload) {
  const name = sanitizeString(raw.name || '', 120);
  const emailResult = sanitizeEmail(raw.email || '');
  const phone = sanitizePhone(raw.phone || '');
  const service = sanitizeString(raw.service || 'General Inquiry', 100);
  const date = sanitizeString(raw.date || '', 50);
  const message = sanitizeString(raw.message || '', 3000);

  const errors: string[] = [];
  if (!name || name.length < 2) {
    errors.push('Please provide your name.');
  }
  if (!emailResult.isValid) {
    errors.push('Please provide a valid email address.');
  }
  if (!message || message.length < 5) {
    errors.push('Please enter a brief message describing your vision (at least 5 characters).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name,
      email: emailResult.sanitized,
      phone,
      service,
      date,
      message,
    },
  };
}
