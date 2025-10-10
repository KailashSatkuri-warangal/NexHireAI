"use client";

import React, { useState, useEffect, useCallback, createContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { UserRole, AppUser } from '@/lib/types';
import {
  useFirebase,
  useUser as useFirebaseUser,
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
  const pathname = usePathname();
  const { auth, firestore } = useFirebase();
  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useFirebaseUser();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (firebaseUser && firestore) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'No Name',
            role: userDoc.data().role as UserRole,
            avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`
          });
        } else {
          // Handle case where user exists in Auth but not Firestore
           setUser(null); 
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [firebaseUser, firestore]);
  
  useEffect(() => {
    const publicRoutes = ['/', '/signup'];
    if (!loading && !user && !publicRoutes.includes(pathname)) {
        router.push('/');
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Auth service not available");
    await signInWithEmailAndPassword(auth, email, password);
  }, [auth]);

  const signup = useCallback(async (email: string, password: string, displayName: string, role: UserRole) => {
    if (!auth || !firestore) throw new Error("Firebase services not available");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    await updateProfile(firebaseUser, { displayName });
    
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    await setDoc(userDocRef, {
      displayName,
      email,
      role,
      xp: 0,
      badges: []
    });

  }, [auth, firestore]);

  const logout = useCallback(async () => {
    if (!auth) throw new Error("Auth service not available");
    await signOut(auth);
    setUser(null);
    router.push('/');
  }, [auth, router]);

  const value = { user, login, signup, logout, loading: loading || isFirebaseUserLoading };

  if (loading || isFirebaseUserLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
