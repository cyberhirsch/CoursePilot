
// src/lib/data-service.ts
import { promises as fs } from 'fs';
import path from 'path';
import type { Module, Program, Studiengruppe, Category, ProgramPlan } from '@/types';

interface AppData {
    modules: Module[];
    programs: Program[];
    studiengruppen: Studiengruppe[];
    categories: Category[];
}

const dataDir = path.join(process.cwd(), 'data');
const cohortsFilePath = path.join(dataDir, 'cohorts.json');
const modulesFilePath = path.join(dataDir, 'modules.json');
const programsFilePath = path.join(dataDir, 'programs.json');
const categoriesFilePath = path.join(dataDir, 'categories.json');

// Helper to read a JSON file
async function readJsonFile<T>(filePath: string): Promise<T> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
}

// Transforms the new plan format (module: semester) into the old one (semesters: {sem1: [modules]})
function transformPlan(plan: { modules: Record<string, number | number[]> }): ProgramPlan {
    const newPlan: ProgramPlan = { semesters: {} };
    for (let i = 1; i <= 9; i++) {
        newPlan.semesters[`sem${i}`] = [];
    }

    if (!plan || !plan.modules) return newPlan;

    Object.entries(plan.modules).forEach(([moduleId, semesters]) => {
        const semesterNumbers = Array.isArray(semesters) ? semesters : [semesters];
        semesterNumbers.forEach((semNum) => {
            const semKey = `sem${semNum}`;
            
            if (newPlan.semesters[semKey]) {
                const module = moduleId; // simplified assumption for now
                if(module.endsWith('-8')) { // Pool module special handling
                    const existingInstances = newPlan.semesters[semKey].filter(m => m.startsWith(moduleId)).length;
                    newPlan.semesters[semKey].push(`${moduleId}-${existingInstances + 1}`);
                } else if (['F5', 'Lab'].includes(module)) { // other pool modules
                     const existingInstances = Object.values(newPlan.semesters).flat().filter(m => m.startsWith(moduleId)).length;
                     newPlan.semesters[semKey].push(`${moduleId}-${existingInstances + 1}`);
                }
                else {
                    newPlan.semesters[semKey].push(moduleId);
                }

            }
        });
    });

    return newPlan;
}

// Reads all data from the individual JSON files
export async function getAllData(): Promise<AppData> {
    try {
        const [modules, programs, cohorts, categories] = await Promise.all([
            readJsonFile<Module[]>(modulesFilePath),
            readJsonFile<Program[]>(programsFilePath),
            readJsonFile<any[]>(cohortsFilePath),
            readJsonFile<Category[]>(categoriesFilePath),
        ]);

        const studiengruppen: Studiengruppe[] = cohorts.map(cohort => ({
            ...cohort,
            plan: transformPlan(cohort.plan)
        }));
        
        const transformedPrograms = programs.map(p => ({
            ...p,
            templatePlan: p.templatePlan ? transformPlan(p.templatePlan as any) : undefined
        }));

        const enrichedModules = modules.map(m => ({
            ...m,
            fachbereich: 'Design',
            workload: (m.cp || 0) * 30, // Calculate workload based on CP
            shortName: m.name.substring(0, 5)
        }));

        return {
            modules: enrichedModules,
            programs: transformedPrograms,
            studiengruppen,
            categories,
        };
    } catch (error) {
        console.error("Failed to read one or more data files:", error);
        throw new Error("Could not load application data.");
    }
}

// Saves the entire data object back to the individual files
export async function saveData(data: AppData): Promise<void> {
    // Note: Saving back to the transformed structure is complex.
    // For now, this function will log a warning and not save,
    // to prevent data corruption. A proper inverse transformation is needed.
    console.warn("Saving data is not fully implemented for the new data structure. Changes will not be persisted.");
    // To implement saving, you would need to:
    // 1. Create an inverse transform for the plan format.
    // 2. Write each part of the AppData object back to its respective file.
    // Example:
    // await fs.writeFile(modulesFilePath, JSON.stringify(data.modules, null, 2), 'utf-8');
    // await fs.writeFile(programsFilePath, JSON.stringify(data.programs, null, 2), 'utf-8');
    // ...etc.
}

// Resets the database - for now, this just means the app will re-read the files on next load.
// Since we are not writing changes, a page reload effectively resets the data.
export async function resetData(): Promise<AppData> {
    return getAllData();
}
