
'use server';
/**
 * @fileOverview A flow to generate a personalized learning plan.
 *
 * - generateLearningPlan - Generates a list of learning resources.
 * - GenerateLearningPlanInput - Input schema.
 * - GenerateLearningPlanOutput - Output schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateLearningPlanInputSchema = z.object({
  skills: z.array(z.string()).describe("A list of the user's current skills."),
  existingKnowledge: z.string().optional().describe("User's bio or self-described knowledge level."),
});
export type GenerateLearningPlanInput = z.infer<typeof GenerateLearningPlanInputSchema>;

const LearningResourceSchema = z.object({
    title: z.string().describe("The title of the article or video."),
    type: z.enum(['article', 'video']).describe("The type of resource."),
    url: z.string().url().describe("The direct URL to the resource."),
    description: z.string().describe("A brief, one-sentence summary of the resource."),
    skill: z.string().describe("The primary skill this resource teaches.")
});

const GenerateLearningPlanOutputSchema = z.object({
  resources: z.array(LearningResourceSchema).length(6)
    .describe("A curated list of exactly 6 learning resources."),
});
export type GenerateLearningPlanOutput = z.infer<typeof GenerateLearningPlanOutputSchema>;


export async function generateLearningPlan(input: GenerateLearningPlanInput): Promise<GenerateLearningPlanOutput> {
  return generateLearningPlanFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateLearningPlanPrompt',
  input: {schema: GenerateLearningPlanInputSchema},
  output: {schema: GenerateLearningPlanOutputSchema},
  prompt: `You are a helpful career development assistant. Based on the user's skills, generate a personalized learning plan.

    **User Profile:**
    - Skills: {{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    - Stated Knowledge: {{{existingKnowledge}}}

    **Your Task:**
    Generate a list of exactly 6 high-quality, real, and publicly accessible learning resources.
    
    **CRITICAL INSTRUCTIONS:**
    - You MUST provide a mix of 3 video (from YouTube) and 3 article (from sources like official documentation, well-known technical blogs like Smashing Magazine, dev.to, CSS-Tricks, or freeCodeCamp) resources.
    - All URLs MUST be real, valid, and lead directly to the content. Do NOT invent or hallucinate URLs. Double-check that the URLs are likely to be correct and active. For example, a YouTube video URL should look like "https://www.youtube.com/watch?v=...". An article URL should be a direct link to a blog post.
    - The resources should be relevant to the user's stated skills, aiming to deepen their knowledge or introduce adjacent, valuable skills.
    - For each resource, provide a valid title, type, a real URL, a one-sentence description, and the primary skill it relates to.
    - Adhere strictly to the JSON output format.
    `,
});

const generateLearningPlanFlow = ai.defineFlow(
  {
    name: 'generateLearningPlanFlow',
    inputSchema: GenerateLearningPlanInputSchema,
    outputSchema: GenerateLearningPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Learning plan generation failed to produce an output.");
    }
    return output;
  }
);
