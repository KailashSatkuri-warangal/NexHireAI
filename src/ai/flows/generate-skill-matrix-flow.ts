
'use server';
/**
 * @fileOverview A flow to generate a skill matrix and learning plan.
 *
 * - generateSkillMatrix - Analyzes skills and creates a matrix and plan.
 * - GenerateSkillMatrixInput - Input schema.
 * - GenerateSkillMatrixOutput - Output schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateSkillMatrixInputSchema = z.object({
  skills: z.array(z.string()).describe("A list of the user's stated skills."),
  bio: z.string().optional().describe("A short bio or summary of their experience."),
});
export type GenerateSkillMatrixInput = z.infer<typeof GenerateSkillMatrixInputSchema>;

const SkillMatrixSchema = z.object({
    skill: z.string().describe("The name of the skill."),
    proficiency: z.number().min(0).max(10).describe("A proficiency score from 0 (Novice) to 10 (Expert)."),
    description: z.string().describe("A one-sentence justification for the score, based on related skills or bio content."),
});

const LearningPlanItemSchema = z.object({
    task: z.string().describe("A specific, actionable learning task to improve a skill."),
    category: z.string().describe("The skill category this task belongs to (e.g., 'React Hooks', 'Python Fundamentals')."),
    estHours: z.number().describe("Estimated hours to complete the task."),
});

const GenerateSkillMatrixOutputSchema = z.object({
  skillMatrix: z.array(SkillMatrixSchema).describe("An analysis of the user's top 5-7 skills."),
  learningPlan: z.array(LearningPlanItemSchema).length(3).describe("A short, targeted learning plan with 3 tasks."),
});
export type GenerateSkillMatrixOutput = z.infer<typeof GenerateSkillMatrixOutputSchema>;


export async function generateSkillMatrix(input: GenerateSkillMatrixInput): Promise<GenerateSkillMatrixOutput> {
  return generateSkillMatrixFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateSkillMatrixPrompt',
  input: {schema: GenerateSkillMatrixInputSchema},
  output: {schema: GenerateSkillMatrixOutputSchema},
  prompt: `You are an expert AI career coach. Analyze the user's provided skills and bio to create a Skill Matrix and a Learning Plan.

    **User Profile:**
    - Skills: {{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    - Bio: {{{bio}}}

    **Your Task:**
    1.  **Create a Skill Matrix**:
        - From the user's list, select their 5-7 most important skills.
        - For each skill, assign a proficiency score from 0 (Novice) to 10 (Expert). Base this score on their bio, experience level implied, and the presence of related advanced skills. For example, if they list "Next.js", their "React" score should be at least 7.
        - Provide a brief, one-sentence description justifying each score.

    2.  **Create a Learning Plan**:
        - Generate exactly 3 actionable learning tasks to help the user improve their weakest areas or level-up key skills.
        - For each task, specify the skill category and estimate the hours required.

    - Adhere strictly to the JSON output format.
    `,
});

const generateSkillMatrixFlow = ai.defineFlow(
  {
    name: 'generateSkillMatrixFlow',
    inputSchema: GenerateSkillMatrixInputSchema,
    outputSchema: GenerateSkillMatrixOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Skill Matrix generation failed to produce an output.");
    }
    return output;
  }
);
