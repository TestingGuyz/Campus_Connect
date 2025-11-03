'use server';

/**
 * @fileOverview A flow for students to contact the admin with AI assistance.
 *
 * - contactAdmin - A function that allows students to contact the admin with AI assistance.
 * - ContactAdminInput - The input type for the contactAdmin function.
 * - ContactAdminOutput - The return type for the contactAdmin function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContactAdminInputSchema = z.object({
  problemDetails: z.string().describe('Details of the problem the student is facing.'),
  studentId: z.string().describe('The ID of the student reporting the issue.'),
  studentName: z.string().describe('The name of the student reporting the issue.'),
});
export type ContactAdminInput = z.infer<typeof ContactAdminInputSchema>;

const ContactAdminOutputSchema = z.object({
  messageToAdmin: z.string().describe('The AI-generated message to the administrator.'),
});
export type ContactAdminOutput = z.infer<typeof ContactAdminOutputSchema>;

export async function contactAdmin(input: ContactAdminInput): Promise<ContactAdminOutput> {
  return contactAdminFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contactAdminPrompt',
  input: {schema: ContactAdminInputSchema},
  output: {schema: ContactAdminOutputSchema},
  prompt: `You are an AI assistant helping a student contact the administrator of a school application.

  The student is facing the following problem:
  {{problemDetails}}

  The student's ID is: {{studentId}}
  The student's name is: {{studentName}}

  Based on the problem details, draft a concise and clear message for the student to send to the administrator. The message should include all necessary information for the admin to understand and address the issue.
  `,
});

const contactAdminFlow = ai.defineFlow(
  {
    name: 'contactAdminFlow',
    inputSchema: ContactAdminInputSchema,
    outputSchema: ContactAdminOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
