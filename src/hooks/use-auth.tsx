
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
    const basicUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.displayName || "User",
      role: 'candidate', // This will be overwritten by profile data
    };
    setUser(basicUser);
    setIsLoading(false);

    // Fetch detailed profile
    setIsProfileLoading(true);
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    let fullProfile: User;
    if (userDoc.exists()) {
      fullProfile = { id: firebaseUser.uid, ...userDoc.data() } as User;
    } else {
        // This might happen for a brand new signup that hasn't had a doc created yet
        // Let's create a default one based on the signup info
        console.warn(`User document not found for UID: ${firebaseUser.uid}. A default will be used.`);
        fullProfile = basicUser;
    }
    
    setProfileData(fullProfile);
    setUser(fullProfile); // Update user context with full profile info
    setIsProfileLoading(false);

    // Role-based redirect
    if (fullProfile.role === 'recruiter' || fullProfile.role === 'admin') {
        router.push('/dashboard/admin');
    } else {
        router.push('/dashboard');
    }

  }, [firestore, router]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setProfileData(null);
          setIsLoading(false);
          setIsProfileLoading(false);
        } else {
            // Fetch user data, but don't redirect here.
            // Redirection should only happen after a manual login action.
            const userDocRef = doc(firestore, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const fullProfile = { id: firebaseUser.uid, ...userDoc.data() } as User;
                setProfileData(fullProfile);
                setUser(fullProfile);
            } else {
                setUser({
                  id: firebaseUser.uid,
                  email: firebaseUser.email!,
                  name: firebaseUser.displayName || "User",
                  role: 'candidate',
                });
                setProfileData(null);
            }
            setIsLoading(false);
            setIsProfileLoading(false);
        }
    });
    return () => unsubscribe();
  }, [auth, firestore]);
  
  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const fullProfile = { id: firebaseUser.uid, ...userDoc.data() } as User;
            setProfileData(fullProfile);
            setUser(fullProfile);
        }
    }
  }, [auth, firestore]);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will fetch data, but we can trigger a redirect manually here
    // for a better user experience after login.
    const userDocRef = doc(firestore, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        const role = userDoc.data().role;
        if(role === 'recruiter' || role === 'admin') {
            router.push('/dashboard/admin');
        } else {
            router.push('/dashboard');
        }
    } else {
        router.push('/dashboard'); // Default fallback
    }
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
