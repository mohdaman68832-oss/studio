'use server';
/**
 * @fileOverview A Genkit flow that generates intelligent, refined suggestions for idea improvement based on its innovation, market, and uniqueness metrics.
 *
 * - polishIdeaSuggestions - A function that handles the idea polishing process.
 * - IdeaPolishingInput - The input type for the polishIdeaSuggestions function.
 * - IdeaPolishingOutput - The return type for the polishIdeaSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdeaPolishingInputSchema = z.object({
  ideaTitle: z.string().describe('The title of the idea.'),
  ideaDescription: z.string().describe('A detailed description of the idea.'),
  innovationScore: z
    .number()
    .min(0)
    .max(100)
    .describe('The innovation score of the idea (0-100).'),
  marketPotential: z
    .number()
    .min(0)
    .max(100)
    .describe('The market potential score of the idea (0-100).'),
  uniquenessLevel: z
    .number()
    .min(0)
    .max(100)
    .describe('The uniqueness level score of the idea (0-100).'),
});
export type IdeaPolishingInput = z.infer<typeof IdeaPolishingInputSchema>;

const IdeaPolishingOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('Intelligent, refined suggestions for improving the idea.'),
});
export type IdeaPolishingOutput = z.infer<typeof IdeaPolishingOutputSchema>;

export async function polishIdeaSuggestions(
  input: IdeaPolishingInput
): Promise<IdeaPolishingOutput> {
  return ideaPolishingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ideaPolishingPrompt',
  input: {schema: IdeaPolishingInputSchema},
  output: {schema: IdeaPolishingOutputSchema},
  prompt: `You are an expert innovation consultant, tasked with refining innovative ideas.
Your goal is to provide intelligent, actionable, and refined suggestions for improvement based on the idea's current metrics.

Analyze the following idea and its metrics:

Idea Title: {{{ideaTitle}}}
Idea Description: {{{ideaDescription}}}

Innovation Score: {{{innovationScore}}}/100
Market Potential: {{{marketPotential}}}/100
Uniqueness Level: {{{uniquenessLevel}}}/100

Provide a comprehensive set of suggestions to enhance this idea's potential. Focus on areas where the scores might be lower, or where there's clear room for growth.
Structure your suggestions clearly, using markdown for readability (e.g., bullet points, bold text).`,
});

const ideaPolishingFlow = ai.defineFlow(
  {
    name: 'ideaPolishingFlow',
    inputSchema: IdeaPolishingInputSchema,
    outputSchema: IdeaPolishingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
