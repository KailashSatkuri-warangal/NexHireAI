
'use server';
/**
 * @fileOverview A flow to populate the Firestore database with 30+ professional roles and their sub-skills.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { initializeFirebaseForServer } from '@/firebase/server-init';
import type { Question, Role } from '@/lib/types';


const QuestionSchema = z.object({
  questionText: z.string(),
  type: z.enum(['mcq', 'short', 'coding']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  testCases: z.array(z.object({ input: z.string(), expectedOutput: z.string() })).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  timeLimit: z.number().describe('Time limit in seconds'),
  starterCode: z.string().optional(),
});

const GeneratedQuestionsSchema = z.object({
    questions: z.array(QuestionSchema),
});

const SubSkillQuestionsSchema = z.object({
  skill: z.string(),
  questions: z.array(QuestionSchema).length(5),
});

const GeneratedRoleSchema = z.object({
  name: z.string(),
  description: z.string(),
  subSkills: z.array(z.string()).length(5),
  skillQuestions: z.array(SubSkillQuestionsSchema).length(5),
  combinedQuestions: z.array(QuestionSchema).length(5),
});

const RoleListSchema = z.object({
    roles: z.array(GeneratedRoleSchema),
});


const professionalRoles = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer", "AI Engineer", "Machine Learning Engineer",
  "Data Scientist", "DevOps Engineer", "Cloud Engineer", "QA / Testing Engineer", "Cybersecurity Analyst",
  "Mobile App Developer (iOS)", "Mobile App Developer (Android)", "UI/UX Designer", "Database Administrator", "Software Engineer",
  "Blockchain Developer", "IoT Engineer", "Embedded Systems Developer", "AR/VR Developer", "Game Developer",
  "Automation Engineer", "Network Engineer", "System Administrator", "Product Manager", "Data Analyst",
  "IT Support Engineer", "AI Researcher", "MLOps Engineer", "Cloud Architect", "Site Reliability Engineer", "Software Tester"
];

const populateRolesFlow = ai.defineFlow(
  {
    name: 'populateRolesFlow',
    inputSchema: z.void(),
    outputSchema: z.void(),
  },
  async () => {
    const { firestore } = initializeFirebaseForServer();
    const rolesCollectionRef = collection(firestore, 'roles');
    
    // 1. Generate all roles, skills, and questions in one mega-prompt.
    const { output: rolesOutput } = await ai.generate({
      prompt: `Generate a detailed list for the following 31 professional roles: ${professionalRoles.join(', ')}.

      For EACH of the 31 roles, provide the following in a single JSON object:
      1.  'name': The name of the professional role.
      2.  'description': A brief, one-sentence description of the role.
      3.  'subSkills': A list of exactly 5 essential string sub-skills for this role.
      4.  'skillQuestions': An array of 5 objects. Each object must contain:
          - 'skill': The name of the sub-skill.
          - 'questions': An array of exactly 5 assessment questions for that specific sub-skill. Each question must have 'questionText', 'type', 'difficulty', 'timeLimit', and other relevant fields like 'options' for mcq or 'testCases' for coding.
      5.  'combinedQuestions': An array of exactly 5 complex, scenario-based questions that integrate and test knowledge across multiple of the role's sub-skills.
      
      Ensure the output is a single, valid JSON object that strictly follows the provided schema. The root should be an object with a 'roles' property, which is an array of these generated role objects.`,
      output: {
        schema: RoleListSchema,
      },
      config: { temperature: 0.6 }
    });

    if (!rolesOutput || !rolesOutput.roles) {
      throw new Error('AI failed to generate roles and questions.');
    }

    // 2. For each generated role, write all its data in a single Firestore batch
    for (const roleData of rolesOutput.roles) {
        const batch = writeBatch(firestore);
        
        // A. Create the main role document
        const roleDocRef = doc(rolesCollectionRef);
        const role: Omit<Role, 'id'> = {
            name: roleData.name,
            description: roleData.description,
            subSkills: roleData.subSkills,
        };
        batch.set(roleDocRef, role);

        const questionsCollectionRef = collection(firestore, `roles/${roleDocRef.id}/questions`);

        // B. Add the questions for each sub-skill
        for (const skillGroup of roleData.skillQuestions) {
            for (const question of skillGroup.questions) {
                const questionDocRef = doc(questionsCollectionRef);
                const newQuestion: Omit<Question, 'id'> = {
                    skill: skillGroup.skill,
                    tags: [roleData.name, skillGroup.skill],
                    ...question,
                };
                batch.set(questionDocRef, newQuestion);
            }
        }

        // C. Add the combined questions
        for (const question of roleData.combinedQuestions) {
             const questionDocRef = doc(questionsCollectionRef);
             const newQuestion: Omit<Question, 'id'> = {
                skill: 'combined', // Special skill tag
                tags: [roleData.name, ...roleData.subSkills],
                ...question,
            };
            batch.set(questionDocRef, newQuestion);
        }
        
        // D. Commit the batch for this entire role (role doc + all 30 questions)
        await batch.commit();
        console.log(`Successfully populated role: ${roleData.name}`);
    }
  }
);

export async function populateRoles() {
  await populateRolesFlow();
}
