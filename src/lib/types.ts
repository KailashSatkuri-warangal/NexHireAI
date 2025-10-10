export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export interface Assessment {
  id: string;
  title: string;
  role: string;
  date: string;
  score: number;
  status: 'Completed' | 'In Progress';
}

export interface Skill {
  name: string;
  score: number;
}

export interface Candidate {
  id: string;
  name: string;
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
