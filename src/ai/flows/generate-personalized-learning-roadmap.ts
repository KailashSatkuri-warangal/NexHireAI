'use server';
/**
 * @fileOverview Generates a personalized learning roadmap for candidates after an assessment.
 *
 * - generatePersonalizedLearningRoadmap - A function that generates the learning roadmap.
 * - GeneratePersonalizedLearningRoadmapInput - The input type for the generatePersonalizedLearningRoadmap function.
 * - GeneratePersonalizedLearningRoadmapOutput - The return type for the generatePersonalizedLearningRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedLearningRoadmapInputSchema = z.object({
  assessmentResults: z.string().describe('The results of the assessment.'),
  candidateSkills: z.string().describe('The skills of the candidate.'),
  candidatePreferences: z.string().describe('The preferences of the candidate.'),
});
export type GeneratePersonalizedLearningRoadmapInput = z.infer<typeof GeneratePersonalizedLearningRoadmapInputSchema>;

const GeneratePersonalizedLearningRoadmapOutputSchema = z.object({
  learningRoadmap: z.string().describe('The personalized learning roadmap for the candidate.'),
});
export type GeneratePersonalizedLearningRoadmapOutput = z.infer<typeof GeneratePersonalizedLearningRoadmapOutputSchema>;

export async function generatePersonalizedLearningRoadmap(input: GeneratePersonalizedLearningRoadmapInput): Promise<GeneratePersonalizedLearningRoadmapOutput> {
  return generatePersonalizedLearningRoadmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedLearningRoadmapPrompt',
  input: {schema: GeneratePersonalizedLearningRoadmapInputSchema},
  output: {schema: GeneratePersonalizedLearningRoadmapOutputSchema},
  prompt: `You are an AI career coach. Generate a personalized learning roadmap for the candidate based on their assessment results, skills, and preferences.

Assessment Results: {{{assessmentResults}}}
Candidate Skills: {{{candidateSkills}}}
Candidate Preferences: {{{candidatePreferences}}}

Learning Roadmap:`, // Provide clear instructions and formatting guidelines here
});

const generatePersonalizedLearningRoadmapFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedLearningRoadmapFlow',
    inputSchema: GeneratePersonalizedLearningRoadmapInputSchema,
    outputSchema: GeneratePersonalizedLearningRoadmapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
