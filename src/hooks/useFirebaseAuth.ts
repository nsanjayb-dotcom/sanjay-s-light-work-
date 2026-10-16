import { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  db, 
  googleProvider,
  FirestoreUser,
  seedInitialFirestoreData
} from '../lib/firebase';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  User as FirebaseUser,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UseFirebaseAuthReturn {
  user: FirebaseUser | null;
  profile: FirestoreUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, fullName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (uid: string, fallbackEmail = '', fallbackName = '') => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userDocRef);

      if (snapshot.exists()) {
        setProfile(snapshot.data() as FirestoreUser);
      } else {
        // Create initial profile record
        const isAdmin = fallbackEmail.toLowerCase() === 'nsanjayb@gmail.com';
        const newProfile: FirestoreUser = {
          id: uid,
          email: fallbackEmail,
          fullName: fallbackName || 'Studio Client',
          role: isAdmin ? 'admin' : 'client',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err: any) {
      console.warn('[useFirebaseAuth] Error fetching profile:', err?.message || err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid, currentUser.email || '', currentUser.displayName || '');
        if (currentUser.email?.toLowerCase() === 'nsanjayb@gmail.com') {
          seedInitialFirestoreData().catch(() => {});
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await fetchProfile(cred.user.uid, cred.user.email || '', cred.user.displayName || '');
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string, phone?: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (fullName) {
        await fbUpdateProfile(cred.user, { displayName: fullName });
      }

      const isAdmin = email.toLowerCase() === 'nsanjayb@gmail.com';
      const newProfile: FirestoreUser = {
        id: cred.user.uid,
        email: email.trim(),
        fullName: fullName || 'Studio Client',
        phone: phone || '',
        role: isAdmin ? 'admin' : 'client',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setProfile(newProfile);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign up';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await fetchProfile(cred.user.uid, cred.user.email || '', cred.user.displayName || '');
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Google sign in failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.warn('[useFirebaseAuth] Error during sign out:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user.email || '', user.displayName || '');
    }
  };

  const isAdmin = Boolean(
    (user?.email && user.email.toLowerCase() === 'nsanjayb@gmail.com') ||
    profile?.role === 'admin'
  );

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: Boolean(user),
    isAdmin,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };
}

export default useFirebaseAuth;
