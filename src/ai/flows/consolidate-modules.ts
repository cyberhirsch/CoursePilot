// This is a server side function, marked by the directive.
'use server';

/**
 * @fileOverview An AI agent that suggests ways to consolidate module offerings.
 *
 * - consolidateModules - A function that handles the module consolidation process.
 * - ConsolidateModulesInput - The input type for the consolidateModules function.
 * - ConsolidateModulesOutput - The return type for the consolidateModules function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConsolidateModulesInputSchema = z.object({
    modules: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            sws: z.number(),
            prerequisites: z.array(z.string()).optional(),
            forbiddenSemesters: z.array(z.number()).optional(),
            type: z.string(),
        })
    ),
    programs: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            moduleIds: z.array(z.string()),
        })
    ),
    studiengruppen: z.array(
        z.object({
            id: z.string(),
            shortName: z.string(),
            programId: z.string(),
            startSemester: z.string(),
            startSemesterId: z.string(),
            plan: z.any(),
            studentCount: z.number(),
            lockedModules: z.array(z.string())
        })
    )
});

export type ConsolidateModulesInput = z.infer<typeof ConsolidateModulesInputSchema>;

const ConsolidateModulesOutputSchema = z.object({
    suggestions: z.array(
        z.object({
            consolidatedModule: z.string(),
            moduleId: z.string(),
            participatingGroups: z.array(z.string()),
            semester: z.string(),
            totalParticipants: z.number(),
            swsSaved: z.number(),
            reasoning: z.string(),
        })
    ),
    summary: z.object({
        totalSwsBefore: z.number(),
        totalSwsAfter: z.number(),
        totalSwsSaved: z.number(),
        criticalIssues: z.array(z.string()).optional()
    })
});

export type ConsolidateModulesOutput = z.infer<typeof ConsolidateModulesOutputSchema>;

export async function consolidateModules(input: ConsolidateModulesInput): Promise<ConsolidateModulesOutput> {
    return consolidateModulesFlow(input);
}

const consolidateModulesPrompt = ai.definePrompt({
    name: 'consolidateModulesPrompt',
    input: {schema: ConsolidateModulesInputSchema},
    output: {schema: ConsolidateModulesOutputSchema},
    prompt: `Analyze the following university course planning data to optimize teaching resources.
Your goal is to consolidate module offerings across different study groups ("Studiengruppen") to minimize the total number of weekly semester hours (SWS) required.

Constraints & Rules:
1.  A consolidation is only possible if the same module (or an instance of the same pool module) is planned for multiple groups in the EXACT SAME absolute semester.
2.  Calculate the absolute semester for each planned module using the group\'s \'startSemester\' and the relative semester key (e.g., \'sem1\', \'sem2\').
3.  Module prerequisites (\'prerequisites\') and semester restrictions (\'forbiddenSemesters\') must be respected in the original plan. Your suggestions should not violate them.
4.  \'Pool\' modules (e.g., \'Wp1-8\') are special. Instances like \'Wp1-8-1\', \'Wp1-8-2\' are all taught from the same pool. You can suggest consolidating different instances of the same pool (e.g., \'Wp1-8-1\' and \'Wp1-8-2\') if they occur in the same semester. The consolidated module name should be the base pool name (e.g., \'Wahlpflicht Pool\').
5.  Calculate \'swsSaved\' for a consolidation as: (number of participating groups - 1) * module\'s SWS.
6.  CRITICAL: Each study group has a \'lockedModules\' array containing instance IDs. These modules are fixed and MUST NOT be moved or included in any consolidation suggestion. You must ignore them in your optimization analysis.

Task:
1.  Identify all possible consolidations based on the rules, excluding locked modules.
2.  Generate a list of suggestions in the specified JSON format.
3.  Provide a summary of the total SWS before and after optimization. \'totalSwsBefore\' is the sum of SWS for every individually planned course across all groups and semesters. \'totalSwsAfter\' is the SWS count after your proposed consolidations.

Here is the data:
{{{JSON.stringify(input, null, 2)}}}
`
});

const consolidateModulesFlow = ai.defineFlow(
    {
        name: 'consolidateModulesFlow',
        inputSchema: ConsolidateModulesInputSchema,
        outputSchema: ConsolidateModulesOutputSchema,
    },
    async input => {
        const {output} = await consolidateModulesPrompt(input);
        return output!;
    }
);
