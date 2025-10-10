
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
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
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useFirebaseUser();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (firebaseUser && firestore) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: userDoc.data().displayName || firebaseUser.displayName || 'No Name',
                role: userDoc.data().role as UserRole,
                avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`
              });
            } else {
              // This can happen if the user record is created in Auth but not in Firestore yet.
              // Or if it's a new signup. The signup function will create the doc.
              setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user document:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
      } else if (!isFirebaseUserLoading) {
        setUser(null);
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [firebaseUser, firestore, isFirebaseUserLoading, router]);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Auth service not available");
    await signInWithEmailAndPassword(auth, email, password);
  }, [auth]);

  const signup = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: UserRole
    ) => {
      if (!auth || !firestore) {
        throw new Error('Firebase services not available');
      }
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName });

      const userDocRef = doc(firestore, 'users', fbUser.uid);
      const userData = {
        displayName,
        email,
        role,
        xp: 0,
        badges: [],
      };

      await setDoc(userDocRef, userData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'create',
          requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
        // Re-throw to be caught by the signup page
        throw permissionError;
      });

      // Manually set user after successful signup and doc creation
      setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          name: displayName,
          role: role,
          avatarUrl: fbUser.photoURL || `https://i.pravatar.cc/150?u=${fbUser.uid}`
      });
    },
    [auth, firestore]
  );

  const logout = useCallback(async () => {
    if (!auth) throw new Error("Auth service not available");
    await signOut(auth);
    setUser(null);
    router.push('/');
  }, [auth, router]);

  const value = { user, login, signup, logout, loading };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
