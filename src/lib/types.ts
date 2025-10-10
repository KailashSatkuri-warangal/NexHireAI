
export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  xp?: number;
}

export interface Assessment {
  id: string;
  title: string;
  role: string;
  date: string;
  score: number;
  status: 'Completed' | 'In Progress';
  userId: string;
}

export interface Skill {
  name: string;
  score: number;
  userId: string;
}

export interface Candidate {
  id: string;
  displayName: string;
  email: string;
  role: string;
  score: number;
  xp: number;
  avatarUrl: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'Coding' | 'Written' | 'Scenario';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}
