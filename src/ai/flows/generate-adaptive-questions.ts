'use server';

/**
 * @fileOverview A flow for generating adaptive questions based on the selected role and subskills.
 *
 * - generateAdaptiveQuestions - A function that generates adaptive questions.
 * - GenerateAdaptiveQuestionsInput - The input type for the generateAdaptiveQuestions function.
 * - GenerateAdaptiveQuestionsOutput - The return type for the generateAdaptiveQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuestionType = z.enum(['MCQ', 'Coding', 'Written', 'Scenario']);

const GenerateAdaptiveQuestionsInputSchema = z.object({
  role: z.string().describe('The role for which questions are being generated.'),
  subskills: z.array(z.string()).describe('The subskills to be assessed.'),
  numQuestions: z.number().int().min(1).max(50).default(30).describe('The number of questions to generate.'),
  questionTypes: z.array(QuestionType).optional().describe('The types of questions to include (MCQ, Coding, Written, Scenario). If not specified, all types are allowed.'),
});
export type GenerateAdaptiveQuestionsInput = z.infer<typeof GenerateAdaptiveQuestionsInputSchema>;

const GeneratedQuestionSchema = z.object({
  type: QuestionType.describe('The type of the question.'),
  questionText: z.string().describe('The text of the question.'),
  difficulty: z.string().optional().describe('The difficulty level of the question.'),
  options: z.array(z.string()).optional().describe('The options for MCQ questions.'),
  correctAnswer: z.string().optional().describe('The correct answer for MCQ questions.'),
  programmingLanguage: z.string().optional().describe('The programming language for coding questions.'),
  testCases: z.array(z.string()).optional().describe('Test cases for coding questions.'),
});

const GenerateAdaptiveQuestionsOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).describe('The generated adaptive questions.'),
});
export type GenerateAdaptiveQuestionsOutput = z.infer<typeof GenerateAdaptiveQuestionsOutputSchema>;

export async function generateAdaptiveQuestions(
  input: GenerateAdaptiveQuestionsInput
): Promise<GenerateAdaptiveQuestionsOutput> {
  return generateAdaptiveQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAdaptiveQuestionsPrompt',
  input: {schema: GenerateAdaptiveQuestionsInputSchema},
  output: {schema: GenerateAdaptiveQuestionsOutputSchema},
  prompt: `You are an AI-powered assessment generator for job candidates. Generate {{numQuestions}} adaptive questions for the role of {{role}}, assessing the following subskills: {{#each subskills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

      The questions should be realistic and industry-relevant.

      {{#if questionTypes}}
      The question types allowed are: {{#each questionTypes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
      {{/if}}

      Each question should test a different aspect of the subskill and dynamically adjust the difficulty based on the candidate's performance.

      Please provide the questions in the following JSON format:
      {
        "questions": [
          {
            "type": "MCQ" | "Coding" | "Written" | "Scenario",
            "questionText": "The question text",
            "difficulty": "Easy" | "Medium" | "Hard",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // Only for MCQ
            "correctAnswer": "Option 1", // Only for MCQ
            "programmingLanguage": "Python" | "Java" | ... , // Only for Coding
            "testCases": ["test case 1", "test case 2"], // Only for Coding
          },
          ...
        ]
      }
  `,
});

const generateAdaptiveQuestionsFlow = ai.defineFlow(
  {
    name: 'generateAdaptiveQuestionsFlow',
    inputSchema: GenerateAdaptiveQuestionsInputSchema,
    outputSchema: GenerateAdaptiveQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
