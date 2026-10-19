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
  getDocFromServer,
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
import { 
  sanitizeBookingForm, 
  sanitizeInquiryForm,
  RawBookingPayload,
  RawInquiryPayload
} from '../utils/sanitizer';

// Set Firebase log level to silent informational connection retries
setLogLevel('error');

// --------------------------------------------------------------------------
// 1. INITIALIZE FIREBASE APP & SERVICES
// --------------------------------------------------------------------------
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);

// Initialize Firestore targeting custom databaseId with resilient connection
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
// 3. VALIDATE CONNECTION TO FIRESTORE
// --------------------------------------------------------------------------
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore connection notice: Client is offline or retrying connection.');
    }
    return false;
  }
}
// Boot check
testConnection();

// --------------------------------------------------------------------------
// 4. TYPES & INTERFACES
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

export interface FirestoreInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  date?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
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
// 5. DATABASE SEEDING UTILITY
// --------------------------------------------------------------------------
export async function seedInitialFirestoreData(): Promise<void> {
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
  } catch (err) {
    console.warn('[Firebase Seed] Notice:', err);
  }
}

// --------------------------------------------------------------------------
// 6. CLIENT DATA OPERATIONS (SANITIZED & HARDENED BACKEND)
// --------------------------------------------------------------------------

/**
 * Inserts a new sanitized booking into Firestore
 */
export async function insertFirestoreBooking(rawBooking: RawBookingPayload): Promise<{
  success: boolean;
  bookingId?: string;
  message: string;
  isConflict?: boolean;
}> {
  // 1. Sanitize all inputs before database write
  const sanitized = sanitizeBookingForm(rawBooking);
  if (!sanitized.isValid) {
    return {
      success: false,
      message: sanitized.errors[0] || 'Invalid booking information submitted.',
    };
  }

  const { data } = sanitized;
  const pathForBooking = 'bookings';

  try {
    // 2. Check for slot conflict on the target date
    const existingQuery = query(
      collection(db, pathForBooking),
      where('bookingDate', '==', data.bookingDate),
      where('timeSlot', '==', data.timeSlot)
    );
    const existingSnapshot = await getDocs(existingQuery);

    const activeConflict = existingSnapshot.docs.find(docSnap => {
      const bData = docSnap.data();
      return bData.status !== 'cancelled';
    });

    if (activeConflict) {
      return {
        success: false,
        isConflict: true,
        message: `Time slot "${data.timeSlot}" on ${data.bookingDate} is already reserved. Please choose another window.`,
      };
    }

    // 3. Generate secure document ID
    const bookingId = `RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const bookingRef = doc(db, pathForBooking, bookingId);

    const newBookingRecord: FirestoreBooking = {
      id: bookingId,
      userId: auth.currentUser?.uid,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      packageId: data.packageId,
      packageName: data.packageName,
      bookingDate: data.bookingDate,
      timeSlot: data.timeSlot,
      status: 'confirmed',
      location: data.location,
      notes: data.notes,
      totalPrice: data.totalPrice,
      createdAt: new Date().toISOString(),
    };

    await setDoc(bookingRef, newBookingRecord);

    return {
      success: true,
      bookingId,
      message: 'Your photography session is confirmed and securely recorded in our database!',
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, pathForBooking);
  }
}

/**
 * Inserts a sanitized client message/inquiry into Firestore
 */
export async function insertFirestoreInquiry(rawInquiry: RawInquiryPayload): Promise<{
  success: boolean;
  inquiryId?: string;
  message: string;
}> {
  // 1. Sanitize inquiry payload
  const sanitized = sanitizeInquiryForm(rawInquiry);
  if (!sanitized.isValid) {
    return {
      success: false,
      message: sanitized.errors[0] || 'Invalid message details provided.',
    };
  }

  const { data } = sanitized;
  const pathForInquiry = 'inquiries';

  try {
    const inquiryId = `INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const inquiryRef = doc(db, pathForInquiry, inquiryId);

    const record: FirestoreInquiry = {
      id: inquiryId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      service: data.service,
      date: data.date,
      message: data.message,
      status: 'unread',
      createdAt: new Date().toISOString(),
    };

    await setDoc(inquiryRef, record);

    return {
      success: true,
      inquiryId,
      message: 'Your inquiry has been received! Sanjay will personally follow up with you within 24 hours.',
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, pathForInquiry);
  }
}

// --------------------------------------------------------------------------
// 7. QUERY HELPERS (Pillar 8 Enforced Query Security)
// --------------------------------------------------------------------------
export async function getFirestoreBookings(userEmailOrUid?: string, isAdmin = false): Promise<FirestoreBooking[]> {
  const pathForBookings = 'bookings';
  try {
    const bookingsCol = collection(db, pathForBookings);
    let q = query(bookingsCol, orderBy('createdAt', 'desc'), limit(50));

    if (!isAdmin && auth.currentUser) {
      q = query(
        bookingsCol,
        where('userId', '==', auth.currentUser.uid),
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

export async function getFirestoreInquiries(): Promise<FirestoreInquiry[]> {
  const pathForInquiries = 'inquiries';
  try {
    const inquiriesCol = collection(db, pathForInquiries);
    const q = query(inquiriesCol, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as FirestoreInquiry);
  } catch (err) {
    console.warn('[Firebase] Query inquiries notice:', err);
    return [];
  }
}
