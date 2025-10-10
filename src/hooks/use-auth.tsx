
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { UserRole, AppUser } from '@/lib/types';
import {
  useFirebase,
  useUser as useFirebaseUser,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { auth, firestore } = useFirebase();
  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const syncUser = async () => {
      if (isFirebaseUserLoading) {
        setLoading(true);
        return;
      }

      if (firebaseUser && firestore) {
        try {
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setAppUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.displayName || firebaseUser.displayName || 'No Name',
              role: userData.role as UserRole,
              xp: userData.xp,
              avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`
            });
          } else {
            // If the user exists in auth but not in Firestore, log them out.
            await signOut(auth);
            setAppUser(null);
          }
        } catch (error) {
          console.error("Error fetching user document:", error);
          await signOut(auth);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    };

    syncUser();
  }, [firebaseUser, firestore, isFirebaseUserLoading, auth]);

  useEffect(() => {
    if (loading) {
      return; // Wait until authentication state is resolved
    }

    const isAuthPage = pathname === '/' || pathname === '/signup';

    if (appUser && isAuthPage) {
      router.push('/dashboard');
    } else if (!appUser && !isAuthPage) {
      router.push('/');
    }
  }, [appUser, loading, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Auth service not available");
    await signInWithEmailAndPassword(auth, email, password);
  }, [auth]);

  const signup = useCallback(
    async (email: string, password: string, displayName: string, role: UserRole) => {
      if (!auth || !firestore) throw new Error('Firebase services not available');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      await updateProfile(fbUser, { displayName });
      const userDocRef = doc(firestore, 'users', fbUser.uid);
      const userData = { displayName, email, role, xp: 0, badges: [] };
      await setDoc(userDocRef, userData);
    },
    [auth, firestore]
  );

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setAppUser(null);
  }, [auth]);

  const value = { user: appUser, login, signup, logout, loading };
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prevent rendering children on auth pages if user is logged in, or on app pages if not.
  // The useEffect above will handle the redirect.
  const isAuthPage = pathname === '/' || pathname === '/signup';
  if ((appUser && isAuthPage) || (!appUser && !isAuthPage)) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
