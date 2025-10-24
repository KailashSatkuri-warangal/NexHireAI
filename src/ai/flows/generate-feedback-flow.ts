
'use server';
/**
 * @fileOverview A dedicated flow to generate AI feedback based on assessment scores.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FeedbackInputSchema = z.object({
  finalScore: z.number(),
  skillScores: z.record(z.string(), z.number()),
});

export const generateFeedbackFlow = ai.defineFlow(
  {
    name: 'generateFeedbackFlow',
    inputSchema: FeedbackInputSchema,
    outputSchema: z.string(),
  },
  async ({ finalScore, skillScores }) => {
    const { output: aiFeedback } = await ai.generate({
      prompt: `A candidate has just completed an assessment. Their final score is ${finalScore.toFixed(2)}/100.
      Their performance by skill was: ${JSON.stringify(skillScores)}.
      Based on this data, provide a concise (2-3 sentences) and encouraging feedback summary for the candidate.
      Highlight one key strength and one main area for improvement. Suggest a specific, actionable next step for them.`,
      output: { schema: z.string() },
      config: { temperature: 0.8 },
    });

    return aiFeedback || 'Feedback could not be generated at this time.';
  }
);

export async function generateFeedback(input: z.infer<typeof FeedbackInputSchema>): Promise<string> {
  return await generateFeedbackFlow(input);
}
