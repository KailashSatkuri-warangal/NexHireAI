
'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import type { UserRole, AppUser } from '@/lib/types';
import { useFirebase, useUser as useFirebaseUser } from '@/firebase';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const mockUser: AppUser = {
  id: 'mock-user-id',
  name: 'Admin User',
  email: 'admin@nexhire.ai',
  role: 'admin',
  avatarUrl: 'https://i.pravatar.cc/150?u=admin-user',
  xp: 12500,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(mockUser);
  const [loading, setLoading] = useState(false); // Set to false as we are using a mock user

  const value = {
    user: appUser,
    loading: loading,
    // Provide empty functions for login/signup/logout to avoid errors
    login: async () => {},
    signup: async () => {},
    logout: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
