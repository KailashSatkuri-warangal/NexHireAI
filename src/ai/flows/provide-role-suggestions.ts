'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing role suggestions to candidates based on their performance, skills, and preferences.
 *
 * - provideRoleSuggestions - A function that suggests roles to candidates.
 * - ProvideRoleSuggestionsInput - The input type for the provideRoleSuggestions function.
 * - ProvideRoleSuggestionsOutput - The return type for the provideRoleSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideRoleSuggestionsInputSchema = z.object({
  candidateSkills: z
    .string()
    .describe('A comma-separated list of the candidate\'s skills.'),
  candidatePreferences: z
    .string()
    .describe('A description of the candidate\'s job preferences.'),
  candidatePerformance: z
    .string()
    .describe(
      'A description of the candidate\'s past performance in assessments.'
    ),
});
export type ProvideRoleSuggestionsInput = z.infer<
  typeof ProvideRoleSuggestionsInputSchema
>;

const ProvideRoleSuggestionsOutputSchema = z.object({
  suggestedRoles: z
    .string()
    .describe(
      'A comma-separated list of suggested job roles for the candidate.'
    ),
  reasoning: z
    .string()
    .describe('The reasoning behind the role suggestions.'),
});
export type ProvideRoleSuggestionsOutput = z.infer<
  typeof ProvideRoleSuggestionsOutputSchema
>;

export async function provideRoleSuggestions(
  input: ProvideRoleSuggestionsInput
): Promise<ProvideRoleSuggestionsOutput> {
  return provideRoleSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideRoleSuggestionsPrompt',
  input: {schema: ProvideRoleSuggestionsInputSchema},
  output: {schema: ProvideRoleSuggestionsOutputSchema},
  prompt: `You are an AI career advisor. Given a candidate's skills, preferences, and past performance, suggest relevant job roles.

Candidate Skills: {{{candidateSkills}}}
Candidate Preferences: {{{candidatePreferences}}}
Candidate Performance: {{{candidatePerformance}}}

Based on this information, suggest job roles that would be a good fit for the candidate. Provide a brief explanation for each suggestion.

Format your response as a comma separated list of job roles, and a paragraph of reasoning behind your suggestions.

{{#if candidateSkills}}
  Here's a list of the user's skills:
  {{candidateSkills}}
{{/if}}

{{#if candidatePreferences}}
  Here's a list of the user's job preferences:
  {{candidatePreferences}}
{{/if}}

{{#if candidatePerformance}}
  Here's a list of the user's job performance:
  {{candidatePerformance}}
{{/if}}`,
});

const provideRoleSuggestionsFlow = ai.defineFlow(
  {
    name: 'provideRoleSuggestionsFlow',
    inputSchema: ProvideRoleSuggestionsInputSchema,
    outputSchema: ProvideRoleSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
