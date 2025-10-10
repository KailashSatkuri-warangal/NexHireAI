import { config } from 'dotenv';
config();

import '@/ai/flows/generate-adaptive-questions.ts';
import '@/ai/flows/evaluate-candidate-answers.ts';
import '@/ai/flows/generate-personalized-learning-roadmap.ts';
import '@/ai/flows/provide-role-suggestions.ts';