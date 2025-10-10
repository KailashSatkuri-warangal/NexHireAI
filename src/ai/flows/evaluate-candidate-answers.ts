'use server';
/**
 * @fileOverview Evaluates candidate answers conceptually and provides feedback summaries.
 *
 * - evaluateCandidateAnswer - A function that handles the evaluation process.
 * - EvaluateCandidateAnswerInput - The input type for the evaluateCandidateAnswer function.
 * - EvaluateCandidateAnswerOutput - The return type for the evaluateCandidateAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateCandidateAnswerInputSchema = z.object({
  question: z.string().describe('The question asked to the candidate.'),
  candidateAnswer: z.string().describe('The candidate\'s answer to the question.'),
  expectedAnswer: z.string().describe('The expected answer or solution to the question.'),
  programmingLanguage: z.string().optional().describe('The programming language used in the answer, if applicable.'),
});
export type EvaluateCandidateAnswerInput = z.infer<typeof EvaluateCandidateAnswerInputSchema>;

const EvaluateCandidateAnswerOutputSchema = z.object({
  evaluation: z.string().describe('An evaluation of the candidate\'s answer, including conceptual understanding, reasoning, and logical design.'),
  feedbackSummary: z.string().describe('A summary of the feedback, including areas of strength and areas for improvement.'),
  score: z.number().describe('A score representing the quality of the answer (0-100).'),
});
export type EvaluateCandidateAnswerOutput = z.infer<typeof EvaluateCandidateAnswerOutputSchema>;

export async function evaluateCandidateAnswer(input: EvaluateCandidateAnswerInput): Promise<EvaluateCandidateAnswerOutput> {
  return evaluateCandidateAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateCandidateAnswerPrompt',
  input: {schema: EvaluateCandidateAnswerInputSchema},
  output: {schema: EvaluateCandidateAnswerOutputSchema},
  prompt: `You are an AI expert in evaluating candidate answers for technical roles. Evaluate the candidate's answer based on conceptual understanding, reasoning, and logical design, compared to the expected answer.

Question: {{{question}}}
Candidate's Answer: {{{candidateAnswer}}}
Expected Answer: {{{expectedAnswer}}}
{% if programmingLanguage %}Programming Language: {{{programmingLanguage}}}\n{% endif %}
Provide a feedback summary, including areas of strength and areas for improvement. Assign a score (0-100) representing the quality of the answer.

Evaluation: Return your evaluation of the candidate's answer here. Be detailed about their understanding, reasoning and logic.
Feedback Summary: Return a summary of your feedback to the candidate, including what they did well and what they need to improve on. Be encouraging and helpful.
Score: Assign a score between 0 and 100, representing the quality of the answer.

Make sure your response includes all three fields: Evaluation, Feedback Summary, Score.

Output in JSON format: {"evaluation": "string", "feedbackSummary": "string", "score": number}
`,
});

const evaluateCandidateAnswerFlow = ai.defineFlow(
  {
    name: 'evaluateCandidateAnswerFlow',
    inputSchema: EvaluateCandidateAnswerInputSchema,
    outputSchema: EvaluateCandidateAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
