import type { User, Assessment, Skill, Candidate, Question } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const mockUsers: Record<string, User> = {
  '1': { id: '1', name: 'Alex Doe', email: 'alex@example.com', role: 'candidate', avatarUrl: PlaceHolderImages[0].imageUrl },
  '2': { id: '2', name: 'Brenda Smith', email: 'brenda@example.com', role: 'recruiter', avatarUrl: PlaceHolderImages[1].imageUrl },
  '3': { id: '3', name: 'Charles Brown', email: 'charles@example.com', role: 'admin', avatarUrl: PlaceHolderImages[2].imageUrl },
};

export const mockCandidateAssessments: Assessment[] = [
  { id: 'assess1', title: 'React Frontend Developer', role: 'Frontend Developer', date: '2024-07-20', score: 88, status: 'Completed' },
  { id: 'assess2', title: 'Node.js Backend Assessment', role: 'Backend Developer', date: '2024-07-18', score: 92, status: 'Completed' },
  { id: 'assess3', title: 'Full-Stack Engineering Challenge', role: 'Full-Stack Developer', date: '2024-07-15', score: 76, status: 'Completed' },
  { id: 'assess4', title: 'DevOps Principles', role: 'DevOps Engineer', date: '2024-07-10', score: 81, status: 'Completed' },
];

export const mockCandidateSkills: Skill[] = [
  { name: 'React', score: 90 },
  { name: 'TypeScript', score: 85 },
  { name: 'Node.js', score: 92 },
  { name: 'SQL', score: 78 },
  { name: 'CI/CD', score: 80 },
  { name: 'System Design', score: 70 },
];

export const mockRecruiterCandidates: Candidate[] = [
  { id: 'cand1', name: 'Dana Scully', role: 'Frontend Developer', score: 95, xp: 12500, avatarUrl: PlaceHolderImages[3].imageUrl },
  { id: 'cand2', name: 'Fox Mulder', role: 'Backend Developer', score: 91, xp: 11200, avatarUrl: PlaceHolderImages[4].imageUrl },
  { id: 'cand3', name: 'Walter Skinner', role: 'Full-Stack Developer', score: 89, xp: 10800, avatarUrl: PlaceHolderImages[5].imageUrl },
  { id: 'cand4', name: 'Monica Reyes', role: 'Frontend Developer', score: 85, xp: 9500, avatarUrl: PlaceHolderImages[6].imageUrl },
  { id: 'cand5', name: 'John Doggett', role: 'DevOps Engineer', score: 82, xp: 9100, avatarUrl: PlaceHolderImages[7].imageUrl },
];

export const mockSkillDistribution = [
  { name: 'React', count: 18 },
  { name: 'Node.js', count: 25 },
  { name: 'Python', count: 15 },
  { name: 'SQL', count: 22 },
  { name: 'AWS', count: 12 },
  { name: 'System Design', count: 19 },
];

export const mockAdminQuestions: Question[] = [
  { id: 'q1', text: 'Explain the difference between `let`, `const`, and `var` in JavaScript.', type: 'Written', difficulty: 'Easy' },
  { id: 'q2', text: 'What is the virtual DOM in React?', type: 'MCQ', difficulty: 'Easy' },
  { id: 'q3', text: 'Implement a function to reverse a binary tree.', type: 'Coding', difficulty: 'Medium' },
  { id: 'q4', text: 'Describe a scenario where you would use a NoSQL database over a SQL database.', type: 'Scenario', difficulty: 'Medium' },
  { id: 'q5', text: 'Design a scalable microservices architecture for an e-commerce platform.', type: 'Scenario', difficulty: 'Hard' },
  { id: 'q6', text: 'Write a SQL query to find the second highest salary.', type: 'Coding', difficulty: 'Medium' },
];
