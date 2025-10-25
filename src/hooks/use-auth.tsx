
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import type { User, RoleType } from '@/lib/types';
import type { SignupData } from '@/lib/auth';
import { initializeFirebase } from '@/firebase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (signupData: SignupData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  profileData: User | null;
  isProfileLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const router = useRouter();
  const { auth, firestore } = initializeFirebase();

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setUser(null);
      setProfileData(null);
      setIsLoading(false);
      setIsProfileLoading(false);
      return;
    }
    
    // Set basic user info immediately for faster UI response
    setUser({
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.displayName || "User",
      role: 'candidate', // This will be overwritten by profile data
    });
    setIsLoading(false);

    // Fetch detailed profile
    setIsProfileLoading(true);
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const fullProfile = { id: firebaseUser.uid, ...userDoc.data() } as User;
      setProfileData(fullProfile);
      // Update user context with full profile info
      setUser(prevUser => ({ ...prevUser, ...fullProfile }));
    } else {
      console.warn(`User document not found for UID: ${firebaseUser.uid}`);
      setProfileData(null); // Or set a default profile shell
    }
    setIsProfileLoading(false);
  }, [firestore]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, fetchUserData);
    return () => unsubscribe();
  }, [auth, fetchUserData]);
  
  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      await fetchUserData(firebaseUser);
    }
  }, [auth, fetchUserData]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle fetching data
  };

  const signup = async (signupData: SignupData) => {
    const { name, email, password, role } = signupData;
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    const userProfile: Omit<User, 'id'> = {
      name,
      email,
      role,
      avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/200`,
      xp: 0,
      badges: [],
    };

    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    await setDoc(userDocRef, userProfile);
    
    // Don't auto-login, let them go to the login page.
    await signOut(auth);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfileData(null);
    router.push('/');
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
    profileData,
    isProfileLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
