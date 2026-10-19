/**
 * ==============================================================================
 * SANJAY'S LIGHTWORKS - SECURE CLIENT BOOKING SERVICE (src/lib/booking-service.ts)
 * ==============================================================================
 * 
 * Production-grade booking service backed by Google Firebase Firestore.
 * Enforces:
 * 1. Double-booking conflict prevention via real-time slot checking.
 * 2. Strict input sanitization (XSS prevention, email normalization, boundary checks).
 * 3. Primary persistent storage in Google Firebase Firestore.
 * 4. Resilient server proxy notification for calendar & transactional emails.
 * ==============================================================================
 */

import { insertFirestoreBooking } from './firebase';
import { sanitizeBookingForm, sanitizeString, sanitizeEmail } from '../utils/sanitizer';

export interface InsertBookingParams {
  fullName: string;
  email: string;
  phone?: string;
  packageId: string;
  packageName?: string;
  bookingDate: string; // Format: YYYY-MM-DD
  timeSlot: string;    // e.g. "09:30 AM – 11:30 AM"
  location?: string;
  notes?: string;
  totalPrice?: number;
  userId?: string;
}

export interface InsertBookingResult {
  success: boolean;
  bookingId?: string;
  userId?: string;
  bookingDate?: string;
  timeSlot?: string;
  status?: string;
  message: string;
  error?: string;
  isConflict?: boolean;
  isFallback?: boolean;
}

export interface AvailabilityCheckResult {
  available: boolean;
  bookingDate: string;
  timeSlot: string;
  message: string;
  error?: string;
}

/**
 * Checks if a specific date and time slot is available
 */
export async function checkSlotAvailability(
  bookingDate: string,
  timeSlot: string
): Promise<AvailabilityCheckResult> {
  const cleanDate = sanitizeString(bookingDate, 30);
  const cleanTime = sanitizeString(timeSlot, 60);

  if (!cleanDate || !cleanTime) {
    return {
      available: true,
      bookingDate: cleanDate,
      timeSlot: cleanTime,
      message: 'Slot available for reservation',
    };
  }

  try {
    const res = await fetch(`/api/bookings/availability?date=${encodeURIComponent(cleanDate)}&slot=${encodeURIComponent(cleanTime)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        available: data.available !== false,
        bookingDate: cleanDate,
        timeSlot: cleanTime,
        message: data.message || (data.available ? 'Slot is available' : 'Slot is already booked'),
      };
    }
  } catch {
    // If backend check is unreachable, permit UI flow and enforce at insertion
  }

  return {
    available: true,
    bookingDate: cleanDate,
    timeSlot: cleanTime,
    message: 'Slot available for selection',
  };
}

/**
 * Primary booking handler: validates, sanitizes, and stores client data in Google Firebase
 */
export async function insertBooking(params: InsertBookingParams): Promise<InsertBookingResult> {
  // 1. Strict Input Sanitization
  const sanitized = sanitizeBookingForm({
    clientName: params.fullName,
    clientEmail: params.email,
    clientPhone: params.phone,
    packageId: params.packageId,
    packageName: params.packageName,
    bookingDate: params.bookingDate,
    timeSlot: params.timeSlot,
    location: params.location,
    notes: params.notes,
    totalPrice: params.totalPrice,
  });

  if (!sanitized.isValid) {
    return {
      success: false,
      message: sanitized.errors[0] || 'Please review your booking details and try again.',
      error: 'VALIDATION_FAILED',
    };
  }

  const { data } = sanitized;

  // 2. Insert into Google Firebase Firestore
  try {
    const fbResult = await insertFirestoreBooking({
      ...data,
      fullName: data.clientName,
      email: data.clientEmail,
      phone: data.clientPhone,
    });

    if (!fbResult.success) {
      return {
        success: false,
        isConflict: fbResult.isConflict,
        message: fbResult.message,
        error: fbResult.isConflict ? 'SLOT_ALREADY_RESERVED' : 'FIRESTORE_WRITE_ERROR',
      };
    }

    // 3. Notify backend server proxy for Google Calendar & email receipt
    try {
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: fbResult.bookingId,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone || 'Not provided',
          packageId: data.packageId,
          packageName: data.packageName || 'Photography Session',
          date: data.bookingDate,
          timeSlot: data.timeSlot,
          location: data.location,
          notes: data.notes,
          price: data.totalPrice,
        }),
      }).catch(err => console.warn('Server booking notification dispatch:', err));
    } catch {}

    return {
      success: true,
      bookingId: fbResult.bookingId,
      bookingDate: data.bookingDate,
      timeSlot: data.timeSlot,
      status: 'confirmed',
      message: 'Your photography session is confirmed and securely recorded in our database!',
    };
  } catch (err: any) {
    console.error('[BookingService] Failed to record in Firebase:', err);
    return {
      success: false,
      message: err.message || 'Error recording reservation in database.',
      error: 'UNEXPECTED_ERROR',
    };
  }
}
