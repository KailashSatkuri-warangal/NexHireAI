'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role } from '@/lib/types';
import type { SignupData } from '@/lib/auth';

// Mock Data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Rohith Macharla',
    email: 'macharlarohith111@gmail.com',
    role: 'candidate',
    avatarUrl: 'https://picsum.photos/seed/1/200',
  },
  {
    id: '2',
    name: 'Admin User',
    email: 'macharlarohith45@gmail.com',
    role: 'recruiter',
    avatarUrl: 'https://picsum.photos/seed/2/200',
  },
];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (signupData: SignupData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking for a logged-in user from a previous session
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // In a real app, you'd also check the password.
    // For this mock, we'll just find the user by email.
    const foundUser = mockUsers.find((u) => u.email === email);
    if (foundUser) {
      // Add password check for the provided credentials
      if (email === 'macharlarohith111@gmail.com' && password === 'Rohith@999r') {
         setUser(foundUser);
         sessionStorage.setItem('user', JSON.stringify(foundUser));
         return;
      }
      if (email === 'macharlarohith45@gmail.com' && password === 'Rohith@999r') {
        setUser(foundUser);
        sessionStorage.setItem('user', JSON.stringify(foundUser));
        return;
      }
    }
    throw new Error('Invalid email or password');
  };

  const signup = async (signupData: SignupData) => {
    const { email, name, role } = signupData;
    // Check if user already exists
    if (mockUsers.find((u) => u.email === email)) {
      throw new Error('An account with this email already exists.');
    }
    // Create new mock user
    const newUser: User = {
      id: String(mockUsers.length + 1),
      name,
      email,
      role,
      avatarUrl: `https://picsum.photos/seed/${mockUsers.length + 1}/200`,
    };
    mockUsers.push(newUser);
    // For this mock, we don't auto-login on signup.
    // The user will be redirected to the login form.
    return;
  };

  const logout = async () => {
    setUser(null);
    sessionStorage.removeItem('user');
    router.push('/');
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
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
