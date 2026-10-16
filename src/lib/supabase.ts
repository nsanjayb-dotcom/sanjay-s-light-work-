/**
 * ==============================================================================
 * SANJAY'S LIGHTWORKS - SUPABASE SERVICE MODULE (src/lib/supabase.ts)
 * ==============================================================================
 * 
 * Provides:
 * 1. Supabase Client Singleton: Initialized securely via environment variables
 *    (NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY).
 * 2. Availability Check Helpers: Uses PostgreSQL RPC `check_booking_availability`
 *    and `get_booked_time_slots` with real-time database verification.
 * 3. Atomic Booking Transaction Helper: Uses PostgreSQL RPC `create_booking_atomic`
 *    with row-level locking (FOR UPDATE) to prevent race conditions and double-booking.
 * 4. Package & Review Query Helpers: Complies with Row-Level Security (RLS) policies.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, DbServicePackage, DbReview, DbBooking } from '../types/supabase';

// ==============================================================================
// 1. ENVIRONMENT CONFIGURATION & CLIENT INITIALIZATION
// ==============================================================================

/**
 * Universal environment variable accessor
 * Supports both Next.js (process.env.NEXT_PUBLIC_*) and Vite (import.meta.env.*)
 */
const getEnv = (key: string): string => {
  // Check process.env (Node / Next.js)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // Check import.meta.env (Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key] || import.meta.env[`VITE_${key.replace('NEXT_PUBLIC_', '')}`];
      if (val) return val;
    }
  } catch {
    // Ignore meta reference issues in non-ESM runtimes
  }
  return '';
};

// Supabase URL & Public Anon Key
const supabaseUrl: string =
  getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnv('VITE_SUPABASE_URL') ||
  'https://placeholder-project.supabase.co';

const supabaseAnonKey: string =
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder-anon-key';

/**
 * True if valid, non-placeholder Supabase credentials are present
 */
export const isSupabaseConfigured: boolean = Boolean(
  (getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL')) &&
  (getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')) &&
  !supabaseUrl.includes('placeholder-project')
);

/**
 * Singleton Supabase Client with full TypeScript Database schema mapping
 * Strictly uses public anon key - safe for client-side execution.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-application-name': 'sanjays-lightworks-photography',
      },
    },
  }
);

// ==============================================================================
// 2. TYPES & INTERFACES
// ==============================================================================

export interface BookingAvailabilityResult {
  available: boolean;
  bookingDate: string;
  timeSlot: string;
  message: string;
  error?: string;
}

export interface BookedSlotsResult {
  bookedSlots: string[];
  bookingDate: string;
  error?: string;
}

export interface CreateBookingParams {
  fullName: string;
  email: string;
  phone?: string;
  packageId: string;
  bookingDate: string;
  timeSlot: string;
  location?: string;
  notes?: string;
  totalPrice?: number;
}

export interface BookingAtomicResponse {
  success: boolean;
  bookingId?: string;
  userId?: string;
  bookingDate?: string;
  timeSlot?: string;
  status?: string;
  message: string;
  error?: string;
}

// ==============================================================================
// 3. INPUT SANITIZATION & VALIDATION HELPERS
// ==============================================================================

export const sanitizeString = (input: string | undefined | null): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Strip script injection characters
    .trim();
};

export const isValidEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// ==============================================================================
// 4. BOOKING AVAILABILITY CHECKS (POSTGRESQL RPC & QUERY FALLBACK)
// ==============================================================================

/**
 * Checks whether a specific time slot on a given date is available.
 * 
 * First attempts to call the PostgreSQL RPC function `check_booking_availability`.
 * If RPC is unavailable or returns an error, falls back to a direct Supabase table query.
 * 
 * @param bookingDate - Format YYYY-MM-DD (e.g. "2026-10-15")
 * @param timeSlot - Format "10:00 AM - 11:30 AM" or similar slot label
 */
export async function checkBookingAvailability(
  bookingDate: string,
  timeSlot: string
): Promise<BookingAvailabilityResult> {
  const cleanDate = sanitizeString(bookingDate);
  const cleanSlot = sanitizeString(timeSlot);

  if (!cleanDate || !cleanSlot) {
    return {
      available: false,
      bookingDate: cleanDate,
      timeSlot: cleanSlot,
      message: 'Booking date and time slot are required.',
      error: 'Missing date or time slot',
    };
  }

  // If Supabase is not configured, fall back gracefully
  if (!isSupabaseConfigured) {
    return {
      available: true,
      bookingDate: cleanDate,
      timeSlot: cleanSlot,
      message: 'Demo mode: slot is available.',
    };
  }

  try {
    // 1. Primary Path: PostgreSQL RPC Function
    // @ts-ignore - Supabase type definitions might vary during dynamic schema updates
    const { data: rpcData, error: rpcError } = await supabase.rpc('check_booking_availability', {
      p_booking_date: cleanDate,
      p_time_slot: cleanSlot,
    });

    if (!rpcError && rpcData) {
      const parsed = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
      return {
        available: Boolean(parsed.available),
        bookingDate: cleanDate,
        timeSlot: cleanSlot,
        message: parsed.message || (parsed.available ? 'Slot is available' : 'Slot is already reserved'),
      };
    }

    // 2. Secondary Fallback Path: Direct Table Query with RLS
    // Queries active bookings (status != 'cancelled')
    const { data: existingBookings, error: queryError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('booking_date', cleanDate)
      .eq('time_slot', cleanSlot)
      .neq('status', 'cancelled');

    if (queryError) {
      console.warn('[Supabase] Availability query warning:', queryError.message);
      // Fail closed or gracefully allow checking
      return {
        available: false,
        bookingDate: cleanDate,
        timeSlot: cleanSlot,
        message: 'Could not verify slot availability. Please try again.',
        error: queryError.message,
      };
    }

    const isAvailable = !existingBookings || existingBookings.length === 0;
    return {
      available: isAvailable,
      bookingDate: cleanDate,
      timeSlot: cleanSlot,
      message: isAvailable
        ? 'Time slot is available.'
        : 'Time slot is already reserved. Please select another time.',
    };
  } catch (err: any) {
    console.error('[Supabase] Exception checking booking availability:', err);
    return {
      available: false,
      bookingDate: cleanDate,
      timeSlot: cleanSlot,
      message: err.message || 'Error checking availability.',
      error: err.message,
    };
  }
}

/**
 * Retrieves all reserved time slots for a given calendar date.
 * Useful for disabling unavailable slot buttons in the booking calendar UI.
 * 
 * @param bookingDate - Format YYYY-MM-DD
 */
export async function getBookedSlotsForDate(
  bookingDate: string
): Promise<BookedSlotsResult> {
  const cleanDate = sanitizeString(bookingDate);
  if (!cleanDate) {
    return { bookedSlots: [], bookingDate: '', error: 'Date is required' };
  }

  if (!isSupabaseConfigured) {
    return { bookedSlots: [], bookingDate: cleanDate };
  }

  try {
    // 1. Try PostgreSQL RPC `get_booked_time_slots`
    // @ts-ignore
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_booked_time_slots', {
      p_booking_date: cleanDate,
    });

    if (!rpcError && Array.isArray(rpcData)) {
      return {
        bookedSlots: rpcData as string[],
        bookingDate: cleanDate,
      };
    }

    // 2. Fallback: Query bookings table directly
    const { data, error } = await supabase
      .from('bookings')
      .select('time_slot')
      .eq('booking_date', cleanDate)
      .neq('status', 'cancelled');

    if (error) {
      console.warn('[Supabase] getBookedSlotsForDate query warning:', error.message);
      return { bookedSlots: [], bookingDate: cleanDate, error: error.message };
    }

    const slots = (data || []).map((b) => b.time_slot).filter(Boolean);
    return { bookedSlots: slots, bookingDate: cleanDate };
  } catch (err: any) {
    console.error('[Supabase] Exception in getBookedSlotsForDate:', err);
    return { bookedSlots: [], bookingDate: cleanDate, error: err.message };
  }
}

// ==============================================================================
// 5. ATOMIC TRANSACTIONAL BOOKING (POSTGRESQL RPC)
// ==============================================================================

/**
 * Creates a booking atomically via PostgreSQL RPC function `create_booking_atomic`.
 * 
 * Guarantees:
 * 1. Row-level lock (FOR UPDATE) on date + time_slot prevents race conditions.
 * 2. Checks active service package existence.
 * 3. Upserts user record with sanitized contact info.
 * 4. Inserts booking with confirmed status in a single atomic transaction.
 */
export async function createBookingAtomic(
  params: CreateBookingParams
): Promise<BookingAtomicResponse> {
  const fullName = sanitizeString(params.fullName);
  const email = sanitizeString(params.email).toLowerCase();
  const phone = sanitizeString(params.phone);
  const location = sanitizeString(params.location) || 'Ontario';
  const notes = sanitizeString(params.notes);
  const packageId = sanitizeString(params.packageId);
  const bookingDate = sanitizeString(params.bookingDate);
  const timeSlot = sanitizeString(params.timeSlot);

  // Client-side validations
  if (!fullName) {
    return { success: false, message: 'Full name is required.', error: 'MISSING_NAME' };
  }
  if (!email || !isValidEmailFormat(email)) {
    return { success: false, message: 'A valid email address is required.', error: 'INVALID_EMAIL' };
  }
  if (!bookingDate) {
    return { success: false, message: 'Booking date is required.', error: 'MISSING_DATE' };
  }
  if (!timeSlot) {
    return { success: false, message: 'Time slot selection is required.', error: 'MISSING_TIMESLOT' };
  }
  if (!packageId) {
    return { success: false, message: 'Service package selection is required.', error: 'MISSING_PACKAGE' };
  }

  // If Supabase credentials are not yet configured, route to backend API or fallback
  if (!isSupabaseConfigured) {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: fullName,
          clientEmail: email,
          clientPhone: phone,
          packageId,
          date: bookingDate,
          timeSlot,
          location,
          notes,
          price: params.totalPrice,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorJson.error || 'Failed to submit booking reservation.',
          error: errorJson.error,
        };
      }

      const resData = await response.json();
      return {
        success: true,
        bookingId: resData.id,
        bookingDate,
        timeSlot,
        status: 'confirmed',
        message: 'Reservation submitted successfully!',
      };
    } catch (apiErr: any) {
      return {
        success: false,
        message: 'Could not connect to booking server.',
        error: apiErr.message,
      };
    }
  }

  try {
    // Invoke the PostgreSQL RPC function
    // @ts-ignore
    const { data, error } = await supabase.rpc('create_booking_atomic', {
      p_full_name: fullName,
      p_email: email,
      p_phone: phone || null,
      p_package_id: packageId,
      p_booking_date: bookingDate,
      p_time_slot: timeSlot,
      p_location: location,
      p_notes: notes || null,
      p_total_price: params.totalPrice ?? null,
    });

    if (error) {
      console.error('[Supabase RPC Error] create_booking_atomic failed:', error);
      
      // Check for custom constraint or lock messages
      if (error.message && error.message.includes('already reserved')) {
        return {
          success: false,
          message: `Slot ${timeSlot} on ${bookingDate} was just reserved by another client. Please pick another time slot.`,
          error: 'SLOT_CONFLICT',
        };
      }

      return {
        success: false,
        message: error.message || 'Database error occurred while creating booking.',
        error: error.message,
      };
    }

    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return {
      success: true,
      bookingId: result?.booking_id,
      userId: result?.user_id,
      bookingDate: result?.booking_date || bookingDate,
      timeSlot: result?.time_slot || timeSlot,
      status: result?.status || 'confirmed',
      message: result?.message || 'Your reservation has been confirmed!',
    };
  } catch (err: any) {
    console.error('[Supabase] Exception during atomic booking transaction:', err);
    return {
      success: false,
      message: err.message || 'An unexpected error occurred during reservation.',
      error: err.message,
    };
  }
}

// ==============================================================================
// 6. SERVICE PACKAGES & REVIEWS HELPERS (RLS PUBLIC READ)
// ==============================================================================

/**
 * Fetches all active service packages, ordered by price.
 * Complies with Supabase Row-Level Security (RLS) public read policy.
 */
export async function fetchServicePackages(): Promise<DbServicePackage[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('active', true)
      .order('price_cad', { ascending: true });

    if (error) {
      console.warn('[Supabase] fetchServicePackages error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[Supabase] Failed to fetch service packages:', err);
    return [];
  }
}

/**
 * Fetches verified client reviews.
 * Complies with Supabase Row-Level Security (RLS) public read policy.
 */
export async function fetchVerifiedReviews(): Promise<DbReview[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('verified', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchVerifiedReviews error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[Supabase] Failed to fetch verified reviews:', err);
    return [];
  }
}

/**
 * Fetches bookings for an authenticated user (scoped by auth.uid()).
 * Enforces RLS policy: users can only view their own bookings.
 */
export async function getUserBookings(userId: string): Promise<DbBooking[]> {
  if (!isSupabaseConfigured || !userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, service_packages(*)')
      .eq('user_id', userId)
      .order('booking_date', { ascending: false });

    if (error) {
      console.warn('[Supabase] getUserBookings error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[Supabase] Failed to get user bookings:', err);
    return [];
  }
}

// Export default singleton for convenience
export default supabase;
