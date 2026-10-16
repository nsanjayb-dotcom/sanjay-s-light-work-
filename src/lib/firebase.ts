import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PRICING_PACKAGES } from '../data/mockData';

// Set Firebase log level to silent informational connection retries
setLogLevel('error');

// --------------------------------------------------------------------------
// 1. INITIALIZE FIREBASE APP & SERVICES
// --------------------------------------------------------------------------
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);

// Initialize Firestore targeting custom databaseId with resilient long-polling
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db: Firestore = firestoreInstance;

export const googleProvider = new GoogleAuthProvider();

// --------------------------------------------------------------------------
// 2. ERROR HANDLING (Section 3 of Firebase Skill)
// --------------------------------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --------------------------------------------------------------------------
// 3. VALIDATE CONNECTION
// --------------------------------------------------------------------------
export async function testConnection(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'test', 'connection'));
    return snap.exists();
  } catch {
    // Graceful offline fallback
    return false;
  }
}

// --------------------------------------------------------------------------
// 3. TYPES & INTERFACES
// --------------------------------------------------------------------------
export interface FirestoreUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'client' | 'admin';
  createdAt: string;
}

export interface FirestoreBooking {
  id: string;
  userId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  packageId: string;
  packageName?: string;
  bookingDate: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
  totalPrice?: number;
  createdAt: string;
}

export interface FirestorePackage {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  priceCad: number;
  active: boolean;
  createdAt: string;
}

export interface FirestoreReview {
  id: string;
  userId?: string;
  clientName?: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: string;
}

// --------------------------------------------------------------------------
// 4. DATABASE SEEDING UTILITY
// --------------------------------------------------------------------------
/**
 * Automatically seeds the service packages and sample verified reviews
 * if the Firestore collections are empty.
 */
export async function seedInitialFirestoreData(): Promise<void> {
  // Only attempt seed writes if an authenticated admin is present
  if (!auth.currentUser || auth.currentUser.email?.toLowerCase() !== 'nsanjayb@gmail.com') {
    return;
  }
  try {
    const packagesSnapshot = await getDocs(query(collection(db, 'service_packages'), limit(1)));
    if (packagesSnapshot.empty) {
      for (const pkg of PRICING_PACKAGES) {
        const pkgRef = doc(db, 'service_packages', pkg.id);
        await setDoc(pkgRef, {
          id: pkg.id,
          slug: pkg.id,
          title: pkg.name,
          description: pkg.tagline || '',
          priceCad: pkg.price,
          active: true,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const reviewsSnapshot = await getDocs(query(collection(db, 'reviews'), limit(1)));
    if (reviewsSnapshot.empty) {
      const seedReviews: FirestoreReview[] = [
        {
          id: 'rev-01',
          clientName: 'Priya & Arjun',
          rating: 5,
          comment: 'Sanjay has an extraordinary eye for ambient light. The portraits of our ceremony captured the genuine emotion without feeling posed.',
          verified: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rev-02',
          clientName: 'Devon Vance',
          rating: 5,
          comment: 'The dual-card backup gave us total peace of mind for our milestone celebration. Sneak peeks within 48 hours were breathtaking.',
          verified: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rev-03',
          clientName: 'Meera K.',
          rating: 5,
          comment: 'Warm, professional, and patient. The golden hour lighting in Ontario parks made our couple frames look timeless.',
          verified: true,
          createdAt: new Date().toISOString(),
        }
      ];

      for (const rev of seedReviews) {
        await setDoc(doc(db, 'reviews', rev.id), rev);
      }
    }
  } catch {
    // Silently continue
  }
}

// --------------------------------------------------------------------------
// 5. ATOMIC BOOKING INSERTER (FIRESTORE)
// --------------------------------------------------------------------------
export async function insertFirestoreBooking(booking: Omit<FirestoreBooking, 'id' | 'createdAt'>): Promise<{
  success: boolean;
  bookingId?: string;
  message: string;
  isConflict?: boolean;
}> {
  try {
    // Check if slot on date is already booked
    const existingQuery = query(
      collection(db, 'bookings'),
      where('bookingDate', '==', booking.bookingDate),
      where('timeSlot', '==', booking.timeSlot)
    );
    const existingSnapshot = await getDocs(existingQuery);

    const activeConflict = existingSnapshot.docs.find(doc => {
      const data = doc.data();
      return data.status !== 'cancelled';
    });

    if (activeConflict) {
      return {
        success: false,
        isConflict: true,
        message: `Time slot "${booking.timeSlot}" on ${booking.bookingDate} is already reserved. Please select another time.`,
      };
    }

    const bookingId = `RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const bookingRef = doc(db, 'bookings', bookingId);

    const newBookingRecord: FirestoreBooking = {
      ...booking,
      id: bookingId,
      status: booking.status || 'confirmed',
      createdAt: new Date().toISOString(),
    };

    await setDoc(bookingRef, newBookingRecord);

    return {
      success: true,
      bookingId,
      message: 'Reservation confirmed and stored in database!',
    };
  } catch (err: any) {
    console.error('[Firebase] Error inserting booking:', err);
    return {
      success: false,
      message: err.message || 'Error recording reservation in database.',
    };
  }
}

// --------------------------------------------------------------------------
// 6. QUERY HELPERS
// --------------------------------------------------------------------------
export async function getFirestoreBookings(userEmailOrUid?: string, isAdmin = false): Promise<FirestoreBooking[]> {
  try {
    const bookingsCol = collection(db, 'bookings');
    let q = query(bookingsCol, orderBy('createdAt', 'desc'), limit(50));

    if (!isAdmin && userEmailOrUid) {
      q = query(
        bookingsCol,
        where('clientEmail', '==', userEmailOrUid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as FirestoreBooking);
  } catch (err) {
    console.warn('[Firebase] Query bookings notice:', err);
    return [];
  }
}

export async function getFirestorePackages(): Promise<FirestorePackage[]> {
  try {
    const q = query(collection(db, 'service_packages'), where('active', '==', true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return PRICING_PACKAGES.map(p => ({
        id: p.id,
        slug: p.id,
        title: p.name,
        description: p.tagline,
        priceCad: p.price,
        active: true,
        createdAt: new Date().toISOString(),
      }));
    }
    return snapshot.docs.map(doc => doc.data() as FirestorePackage);
  } catch (err) {
    console.warn('[Firebase] Query packages notice:', err);
    return [];
  }
}

export async function getFirestoreReviews(): Promise<FirestoreReview[]> {
  try {
    const q = query(collection(db, 'reviews'), where('verified', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as FirestoreReview);
  } catch (err) {
    console.warn('[Firebase] Query reviews notice:', err);
    return [];
  }
}
