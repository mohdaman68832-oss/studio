'use server';
/**
 * @fileOverview An AI agent that analyzes a new idea post to provide insights.
 *
 * - analyzeIdeaOnPost - A function that handles the AI analysis of an idea post.
 * - AIIdeaAnalysisOnPostInput - The input type for the analyzeIdeaOnPost function.
 * - AIIdeaAnalysisOnPostOutput - The return type for the analyzeIdeaOnPost function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIIdeaAnalysisOnPostInputSchema = z.object({
  title: z.string().describe('The title of the idea.'),
  description: z.string().describe('A detailed description of the idea.'),
  problem: z.string().describe('The problem the idea aims to solve.'),
  solution: z.string().describe('The proposed solution of the idea.'),
  targetUsers: z.string().describe('A description of the target users for the idea.'),
  category: z.string().describe('The category of the idea (e.g., Technology, Healthcare, Education).'),
  mediaDataUri: z.string().optional().describe(
    "An optional photo or video of the idea, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type AIIdeaAnalysisOnPostInput = z.infer<typeof AIIdeaAnalysisOnPostInputSchema>;

const AIIdeaAnalysisOnPostOutputSchema = z.object({
  innovationScore: z.number().int().min(0).max(100).describe('An innovation score for the idea, from 0 to 100.'),
  marketPotential: z.string().describe('An assessment of the market potential (e.g., "High", "Medium", "Low") with a brief explanation.'),
  uniquenessLevel: z.string().describe('An assessment of the uniqueness level (e.g., "Highly Unique", "Moderately Unique", "Common") with a brief explanation.'),
  improvementSuggestions: z.string().describe('Concrete suggestions for improving the idea, presented as a multi-line string.'),
});
export type AIIdeaAnalysisOnPostOutput = z.infer<typeof AIIdeaAnalysisOnPostOutputSchema>;

export async function analyzeIdeaOnPost(input: AIIdeaAnalysisOnPostInput): Promise<AIIdeaAnalysisOnPostOutput> {
  return aiIdeaAnalysisOnPostFlow(input);
}

const aiIdeaAnalysisOnPostPrompt = ai.definePrompt({
  name: 'aiIdeaAnalysisOnPostPrompt',
  input: { schema: AIIdeaAnalysisOnPostInputSchema },
  output: { schema: AIIdeaAnalysisOnPostOutputSchema },
  prompt: `You are an expert innovation analyst. Your task is to analyze a new idea based on the provided details and offer constructive feedback.

Here are the details of the idea:

Title: {{{title}}}
Problem: {{{problem}}}
Solution: {{{solution}}}
Description: {{{description}}}
Target Users: {{{targetUsers}}}
Category: {{{category}}}

{{#if mediaDataUri}}
Photo/Video: {{media url=mediaDataUri}}
{{/if}}

Based on this information, provide the following:

1.  **Innovation Score**: A numerical score from 0 to 100, where 0 is not innovative and 100 is extremely innovative.
2.  **Market Potential**: A qualitative assessment (e.g., "High", "Medium", "Low") along with a brief explanation of why.
3.  **Uniqueness Level**: A qualitative assessment (e.g., "Highly Unique", "Moderately Unique", "Common") along with a brief explanation of how unique the idea is compared to existing solutions.
4.  **Improvement Suggestions**: Concrete, actionable suggestions to enhance the idea, considering its innovation, market potential, and uniqueness. Provide these as a multi-line string, focusing on practical steps.

Generate your response in a JSON format matching the AIIdeaAnalysisOnPostOutputSchema, ensuring all fields are populated.`,
});

const aiIdeaAnalysisOnPostFlow = ai.defineFlow(
  {
    name: 'aiIdeaAnalysisOnPostFlow',
    inputSchema: AIIdeaAnalysisOnPostInputSchema,
    outputSchema: AIIdeaAnalysisOnPostOutputSchema,
  },
  async (input) => {
    const { output } = await aiIdeaAnalysisOnPostPrompt(input);
    return output!;
  }
);
