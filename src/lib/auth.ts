import { RoleType } from './types';

// This file is now primarily for type definitions,
// as auth logic has moved to the useAuth hook.

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: RoleType;
}
