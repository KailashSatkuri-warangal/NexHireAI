
'use server';
/**
 * @fileOverview A flow to populate the Firestore database with 30+ professional roles and their sub-skills.
 * This flow does NOT generate questions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { initializeFirebaseForServer } from '@/firebase/server-init';
import type { Role } from '@/lib/types';


const GeneratedRoleSchema = z.object({
  name: z.string(),
  description: z.string(),
  subSkills: z.array(z.string()).length(5),
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
    const batch = writeBatch(firestore);

    // 1. Generate roles one by one to avoid overly complex schema issues.
    for (const roleName of professionalRoles) {
      console.log(`Generating data for role: ${roleName}`);
      const { output: roleData } = await ai.generate({
        prompt: `Generate a brief, one-sentence description and a list of exactly 5 essential sub-skills for the professional role: "${roleName}".`,
        output: {
          schema: GeneratedRoleSchema,
        },
        config: { temperature: 0.5 }
      });

      if (roleData) {
        const roleDocRef = doc(rolesCollectionRef);
         const role: Omit<Role, 'id'> = {
            name: roleData.name,
            description: roleData.description,
            subSkills: roleData.subSkills,
        };
        batch.set(roleDocRef, role);
      } else {
        console.warn(`Could not generate data for role: ${roleName}`);
      }
    }
    
    // 2. Write all generated roles to Firestore in a single batch.
    await batch.commit();
    console.log(`Successfully populated ${professionalRoles.length} roles.`);
  }
);

export async function populateRoles() {
  await populateRolesFlow();
}
