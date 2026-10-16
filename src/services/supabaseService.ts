import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { DbServicePackage, DbReview, BookingWithDetails } from '../types/supabase';
import { ProjectProgressItem, ProjectStage } from '../types';
import { PRICING_PACKAGES } from '../data/mockData';
import { sanitizeInput, isValidEmail, secureAdminFetch } from '../utils/security';

/**
 * Supabase Service Layer
 * 
 * Provides clean, modular TypeScript operations adhering to:
 * 1. Input sanitization and validation prior to all DB invocations
 * 2. Execution of atomic PostgreSQL RPC functions to prevent booking race conditions
 * 3. Timeout controls and error handling with clear user-facing responses
 * 4. Graceful fallbacks for local and offline dev states
 */

export interface CreateBookingParams {
  fullName: string;
  email: string;
  phone?: string;
  packageId: string;
  packageName?: string;
  bookingDate: string;
  timeSlot: string;
  location?: string;
  notes?: string;
  totalPrice?: number;
}

export interface CreateBookingResult {
  success: boolean;
  bookingId?: string;
  message: string;
  isFallback?: boolean;
}

export interface CreateReviewParams {
  userId?: string;
  rating: number;
  comment: string;
}

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Helper to wrap promises with an AbortSignal timeout
 */
async function withTimeout<T = any>(promise: any, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Database request timed out')), timeoutMs)
  );
  return Promise.race([Promise.resolve(promise), timeout]);
}

/**
 * 1. Query active service packages from Supabase
 * Enforces RLS: Public read access for active service packages
 */
export async function fetchServicePackages(): Promise<DbServicePackage[]> {
  if (!isSupabaseConfigured) {
    // Provide fallback packages formatted to DbServicePackage schema
    return PRICING_PACKAGES.map((pkg, idx) => ({
      id: pkg.id || `pkg-${idx}`,
      slug: pkg.id,
      title: pkg.name,
      description: pkg.tagline,
      price_cad: pkg.price,
      active: true,
      created_at: new Date().toISOString(),
    }));
  }

  try {
    const query = supabase
      .from('service_packages')
      .select('*')
      .eq('active', true)
      .order('price_cad', { ascending: true });

    const { data, error } = (await withTimeout(query)) as any;

    if (error || !data || data.length === 0) {
      console.warn('[Supabase] Failed or empty service packages, using fallback:', error?.message);
      return PRICING_PACKAGES.map((pkg, idx) => ({
        id: pkg.id || `pkg-${idx}`,
        slug: pkg.id,
        title: pkg.name,
        description: pkg.tagline,
        price_cad: pkg.price,
        active: true,
        created_at: new Date().toISOString(),
      }));
    }

    return data as DbServicePackage[];
  } catch (err: any) {
    console.warn('[Supabase] fetchServicePackages error:', err?.message || err);
    return PRICING_PACKAGES.map((pkg, idx) => ({
      id: pkg.id || `pkg-${idx}`,
      slug: pkg.id,
      title: pkg.name,
      description: pkg.tagline,
      price_cad: pkg.price,
      active: true,
      created_at: new Date().toISOString(),
    }));
  }
}

/**
 * 2. Query verified reviews from Supabase
 * Enforces RLS: Public read access for verified reviews
 */
export async function fetchVerifiedReviews(): Promise<DbReview[]> {
  if (!isSupabaseConfigured) {
    return [
      {
        id: 'rev-1',
        user_id: null,
        rating: 5,
        comment: 'Sanjay has an extraordinary eye for ambient light. The portraits captured genuine heirloom emotion without feeling staged.',
        verified: true,
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'rev-2',
        user_id: null,
        rating: 5,
        comment: 'The dual-card backup gave us complete reassurance during our celebration. 48h sneak peeks exceeded all expectations.',
        verified: true,
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: 'rev-3',
        user_id: null,
        rating: 5,
        comment: 'Warm, professional, and patient. Golden hour portraits in Ontario parks came out breathtaking.',
        verified: true,
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
    ];
  }

  try {
    const query = supabase
      .from('reviews')
      .select('*')
      .eq('verified', true)
      .order('created_at', { ascending: false });

    const { data, error } = (await withTimeout(query)) as any;

    if (error || !data) {
      throw error;
    }

    return data as DbReview[];
  } catch (err: any) {
    console.warn('[Supabase] fetchVerifiedReviews error:', err?.message || err);
    return [];
  }
}

/**
 * 3. Check time slot availability for a specific date
 * Queries bookings to prevent conflicting time slots before submission
 */
export async function checkSlotAvailability(
  bookingDate: string,
  timeSlot: string
): Promise<{ available: boolean; conflictReason?: string }> {
  const cleanDate = sanitizeInput(bookingDate);
  const cleanSlot = sanitizeInput(timeSlot);

  if (!isSupabaseConfigured) {
    return { available: true };
  }

  try {
    const query = supabase
      .from('bookings')
      .select('id, status')
      .eq('booking_date', cleanDate)
      .eq('time_slot', cleanSlot)
      .neq('status', 'cancelled');

    const { data, error } = (await withTimeout(query)) as any;

    if (error) {
      console.warn('[Supabase] checkSlotAvailability error:', error.message);
      return { available: true };
    }

    if (data && data.length > 0) {
      return {
        available: false,
        conflictReason: 'Time slot is already reserved by another client.',
      };
    }

    return { available: true };
  } catch (err: any) {
    console.warn('[Supabase] checkSlotAvailability error:', err?.message);
    return { available: true };
  }
}

/**
 * 4. Execute Atomic Transactional Booking via PostgreSQL RPC function
 * 
 * Complies with Requirement 4 & 5:
 * - Validates and sanitizes client inputs
 * - Calls `create_booking_atomic` RPC to acquire row lock and prevent double-booking
 * - Returns structured success/error response for UI toast feedback
 */
export async function createBookingAtomic(
  params: CreateBookingParams
): Promise<CreateBookingResult> {
  // Input Validation & Sanitization
  const fullName = sanitizeInput(params.fullName).trim();
  const email = sanitizeInput(params.email).trim();
  const phone = sanitizeInput(params.phone || '').trim();
  const bookingDate = sanitizeInput(params.bookingDate).trim();
  const timeSlot = sanitizeInput(params.timeSlot).trim();
  const location = sanitizeInput(params.location || 'Ontario').trim();
  const notes = sanitizeInput(params.notes || '').trim();
  const totalPrice = params.totalPrice ? Math.max(0, Number(params.totalPrice)) : 50;

  if (!fullName) {
    return { success: false, message: 'Please enter your full name.' };
  }

  if (!email || !isValidEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    return { success: false, message: 'Please select a valid booking date.' };
  }

  if (!timeSlot) {
    return { success: false, message: 'Please choose an available time slot.' };
  }

  // If Supabase is configured, call atomic PostgreSQL RPC function
  if (isSupabaseConfigured) {
    try {
      // Find valid package UUID or use default package ID
      let targetPackageId = params.packageId;
      // If client passed a slug like 'pkg-portrait', resolve its UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetPackageId)) {
        const { data: pkgData } = await supabase
          .from('service_packages')
          .select('id')
          .or(`slug.eq.${targetPackageId},title.ilike.%${targetPackageId}%`)
          .limit(1)
          .single();

        if (pkgData?.id) {
          targetPackageId = pkgData.id;
        } else {
          targetPackageId = 'a2222222-2222-2222-2222-222222222222';
        }
      }

      // Execute atomic RPC transaction with lock protection
      const rpcPromise = supabase.rpc('create_booking_atomic', {
        p_full_name: fullName,
        p_email: email,
        p_phone: phone || null,
        p_package_id: targetPackageId,
        p_booking_date: bookingDate,
        p_time_slot: timeSlot,
        p_location: location,
        p_notes: notes,
        p_total_price: totalPrice,
      });

      const { data, error } = (await withTimeout(rpcPromise, 10000)) as any;

      if (error) {
        // Return clear user feedback on double-booking conflict
        if (error.message.includes('already reserved')) {
          return {
            success: false,
            message: `Conflict: ${timeSlot} on ${bookingDate} was just reserved by another client. Please select another slot.`,
          };
        }
        throw error;
      }

      return {
        success: true,
        bookingId: data?.booking_id || `SB-${Date.now()}`,
        message: 'Your reservation has been confirmed and stored in the database!',
      };
    } catch (err: any) {
      console.warn('[Supabase] RPC booking failed, falling back to server API:', err?.message || err);
    }
  }

  // Graceful fallback to server API endpoint (persists in server database / notification logs)
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        clientName: fullName,
        clientEmail: email,
        clientPhone: phone,
        packageId: params.packageId,
        packageName: params.packageName || 'Photography Session',
        preferredDate: bookingDate,
        preferredTime: timeSlot,
        location,
        notes,
        totalPrice,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      return {
        success: true,
        bookingId: data.booking?.id || `SL-${Date.now()}`,
        message: 'Reservation inquiry successfully received!',
        isFallback: true,
      };
    } else {
      return {
        success: false,
        message: data.error || 'Failed to submit reservation. Please try again.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Network error submitting reservation. Please check your connection.',
    };
  }
}

/**
 * 5. Submit client review
 * Enforces input sanitization and rating boundary constraints (1 to 5)
 */
export async function submitClientReview(
  params: CreateReviewParams
): Promise<{ success: boolean; message: string }> {
  const comment = sanitizeInput(params.comment).trim();
  const rating = Math.min(5, Math.max(1, Math.round(params.rating)));

  if (!comment || comment.length < 5) {
    return { success: false, message: 'Please write a review comment with at least 5 characters.' };
  }

  if (!isSupabaseConfigured) {
    return {
      success: true,
      message: 'Thank you for your feedback! Review has been submitted.',
    };
  }

  try {
    const query = supabase.from('reviews').insert({
      user_id: params.userId || null,
      rating,
      comment,
      verified: false,
    });

    const { error } = (await withTimeout(query)) as any;

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Thank you! Your verified review has been submitted for studio review.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Could not submit review at this moment.',
    };
  }
}

/**
 * 6. Admin query: Fetch all bookings with user and package relations
 */
export async function fetchAdminBookings(): Promise<BookingWithDetails[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const query = supabase
      .from('bookings')
      .select('*, users(*), service_packages(*)')
      .order('booking_date', { ascending: false });

    const { data, error } = (await withTimeout(query)) as any;

    if (error) throw error;
    return (data || []) as BookingWithDetails[];
  } catch (err: any) {
    console.warn('[Supabase] fetchAdminBookings error:', err?.message || err);
    return [];
  }
}

/**
 * 7. Studio Dashboard Dynamic Fetch from Supabase PostgreSQL (Service Role)
 */
export interface StudioDashboardData {
  success: boolean;
  source: 'supabase_postgres' | 'in_memory';
  configured: boolean;
  supabaseUrl: string;
  serviceRoleActive: boolean;
  projects: ProjectProgressItem[];
  bookings: any[];
  packages: any[];
  metrics: {
    siteVisits: number;
    galleryViews: number;
    directBookings: number;
    totalRevenue: number;
    topClickedPackages: { name: string; clicks: number; share: string }[];
  };
}

export async function fetchStudioDashboardData(): Promise<StudioDashboardData | null> {
  try {
    const res = await secureAdminFetch('/api/admin/supabase/dashboard');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Supabase Service] Failed to fetch studio dashboard:', err);
  }
  return null;
}

export async function updateStudioPipelineStage(id: string, stage: ProjectStage, notes?: string): Promise<boolean> {
  try {
    const res = await secureAdminFetch(`/api/admin/pipeline/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, notes }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Supabase Service] Stage update warning:', err);
    return false;
  }
}

export async function createStudioPipelineProject(project: Partial<ProjectProgressItem>): Promise<ProjectProgressItem | null> {
  try {
    const res = await secureAdminFetch('/api/admin/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (res.ok) {
      const data = await res.json();
      return data.project || null;
    }
  } catch (err) {
    console.warn('[Supabase Service] Create pipeline warning:', err);
  }
  return null;
}

export async function deleteStudioPipelineProject(id: string): Promise<boolean> {
  try {
    const res = await secureAdminFetch(`/api/admin/pipeline/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Supabase Service] Delete pipeline warning:', err);
    return false;
  }
}

export async function configureSupabaseServiceRole(
  supabaseUrl: string,
  serviceRoleKey: string,
  anonKey?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await secureAdminFetch('/api/admin/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supabaseUrl, serviceRoleKey, anonKey }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function getSupabaseConfig(): Promise<{
  success: boolean;
  configured: boolean;
  supabaseUrl: string;
  serviceRoleActive: boolean;
  anonKey?: string;
  serviceRoleMasked?: string;
} | null> {
  try {
    const res = await secureAdminFetch('/api/admin/supabase/config');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Supabase Service] Failed to get config:', err);
  }
  return null;
}

export interface UploadPhotoParams {
  data: string;
  title: string;
  category: string;
  aspectRatio: string;
  description: string;
  location: string;
  year: string;
  client?: string;
  tags?: string[];
  cameraInfo?: {
    body: string;
    lens: string;
    aperture: string;
    shutter: string;
    iso: string;
  };
  watermark?: boolean;
}

export interface UploadPhotoResult {
  success: boolean;
  photo?: any;
  imageUrl?: string;
  storage?: 'supabase_storage' | 'local_storage';
  message?: string;
  error?: string;
}

export async function uploadPhotoToSupabaseStorage(params: UploadPhotoParams): Promise<UploadPhotoResult> {
  try {
    const res = await secureAdminFetch('/api/admin/supabase/upload-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.error || `Upload failed with status ${res.status}`,
    };
  } catch (err: any) {
    console.warn('[Supabase Service] uploadPhotoToSupabaseStorage error:', err);
    return {
      success: false,
      error: err?.message || 'Network error while uploading photograph to Supabase Storage.',
    };
  }
}

