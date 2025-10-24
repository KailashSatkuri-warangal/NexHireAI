
export type RoleType = 'candidate' | 'recruiter' | 'admin';

export interface Question {
    id: string;
    questionText: string;
    type: 'mcq' | 'short' | 'coding';
    options?: string[];
    correctAnswer?: string; // For MCQ/short
    testCases?: { input: string; expectedOutput: string; }[];
    difficulty: number; // 1-10
    timeLimit: number; // in seconds
    tags: string[];
    maxScore: number;
    skill: string;
    starterCode?: string;
}

export interface UserResponse {
    questionId: string;
    skill: string;
    difficulty: number;
    answer?: string; // For MCQ/short
    code?: string; // For coding
    timeTaken: number;
    isCorrect?: boolean; // Post-evaluation
    testCasesPassed?: number; // Post-evaluation
    totalTestCases?: number; // Post-evaluation
}

export interface AssessmentAttempt {
    id: string;
    roleId: string;
    startedAt: number; // timestamp
    submittedAt?: number; // timestamp
    questions: UserResponse[];
    finalScore?: number;
    skillScores?: Record<string, number>;
    aiFeedback?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  avatarUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  xp?: number;
  badges?: string[];
}
