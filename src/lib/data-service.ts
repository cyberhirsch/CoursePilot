
// src/lib/data-service.ts
import { promises as fs } from 'fs';
import path from 'path';
import type { Module, Program, Studiengruppe, Category, ProgramPlan, RawPlan } from '@/types';

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
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        if (path.basename(filePath) === 'categories.json') {
             console.log("Returning empty array for categories as it might not exist.");
             return [] as T;
        }
        throw error;
    }
}

// Transforms the new plan format (module: semester) into the old one (semesters: {sem1: [modules]})
function transformPlan(plan: RawPlan | undefined, allModules: Module[]): ProgramPlan {
    const newPlan: ProgramPlan = { semesters: {} };
    const maxSemesters = 9; // Default max semesters
    for (let i = 1; i <= maxSemesters; i++) {
        newPlan.semesters[`sem${i}`] = [];
    }

    if (!plan || !plan.modules) return newPlan;

    // Track instance counts for pool modules
    const poolInstanceCounter: Record<string, number> = {};
    const moduleSemesterMap: Record<string, number[]> = {};

    // First, map all modules to their semesters
    Object.entries(plan.modules).forEach(([moduleId, semesters]) => {
        const semesterNumbers = Array.isArray(semesters) ? semesters : [semesters];
        moduleSemesterMap[moduleId] = semesterNumbers;
    });

    // Get all module instances and sort them to create stable IDs
    const allInstances: { moduleId: string, semester: number, originalIndex: number }[] = [];
    Object.entries(moduleSemesterMap).forEach(([moduleId, semesters]) => {
        semesters.forEach((sem, index) => {
            allInstances.push({ moduleId, semester: sem, originalIndex: index });
        });
    });

    // Sort by semester, then module ID to ensure consistent processing order
    allInstances.sort((a, b) => {
        if (a.semester !== b.semester) {
            return a.semester - b.semester;
        }
        return a.moduleId.localeCompare(b.moduleId);
    });
    
    // Process sorted instances to generate stable IDs
    allInstances.forEach(({ moduleId, semester }) => {
        const semKey = `sem${semester}`;
        const moduleInfo = allModules.find(m => m.id === moduleId);

        if (moduleInfo?.type === 'Pool') {
            if (!poolInstanceCounter[moduleId]) {
                poolInstanceCounter[moduleId] = 0;
            }
            poolInstanceCounter[moduleId]++;
            newPlan.semesters[semKey]?.push(`${moduleId}-${poolInstanceCounter[moduleId]}`);
        } else {
            newPlan.semesters[semKey]?.push(moduleId);
        }
    });

    return newPlan;
}

function inverseTransformPlan(plan: ProgramPlan, modules: Module[]): RawPlan {
    const rawPlan: RawPlan = { modules: {} };
    if (!plan || !plan.semesters) return rawPlan;

    const modulePlacements: Record<string, number[]> = {};

    Object.entries(plan.semesters).forEach(([semesterId, instanceIds]) => {
        const semNum = parseInt(semesterId.replace('sem', ''), 10);
        if (isNaN(semNum)) return;

        instanceIds.forEach(instanceId => {
            const module = modules.find(m => m.id === instanceId || instanceId.startsWith(m.id + '-'));
            if (module) {
                if (!modulePlacements[module.id]) {
                    modulePlacements[module.id] = [];
                }
                modulePlacements[module.id].push(semNum);
            }
        });
    });
    
    Object.keys(modulePlacements).forEach(moduleId => {
       const sortedSemesters = [...new Set(modulePlacements[moduleId])].sort((a, b) => a - b);
       if (sortedSemesters.length === 1) {
           rawPlan.modules[moduleId] = sortedSemesters[0];
       } else {
           rawPlan.modules[moduleId] = sortedSemesters;
       }
    });

    return rawPlan;
}


// Reads all data from the individual JSON files
export async function getAllData(): Promise<AppData> {
    const [modules, programsData, cohorts, categories] = await Promise.all([
        readJsonFile<Module[]>(modulesFilePath),
        readJsonFile<Program[]>(programsFilePath),
        readJsonFile<any[]>(cohortsFilePath),
        readJsonFile<Category[]>(categoriesFilePath),
    ]);

    const studiengruppen: Studiengruppe[] = cohorts.map(cohort => ({
        ...cohort,
        plan: transformPlan(cohort.plan, modules)
    }));
    
    const transformedPrograms = programsData.map(p => ({
        ...p,
        templatePlan: transformPlan(p.templatePlan as any, modules)
    }));

    const enrichedModules = modules.map(m => ({
        ...m,
        fachbereich: m.fachbereich || 'Design',
        workload: m.workload || (m.cp || 0) * 30,
        shortName: m.shortName || m.name.substring(0, 5)
    }));

    return {
        modules: enrichedModules,
        programs: transformedPrograms,
        studiengruppen,
        categories,
    };
}

// Saves the entire data object back to the individual files
export async function saveData(data: AppData): Promise<void> {
    try {
        const { modules, programs, studiengruppen } = data;

        // Strip UI-only fields from modules before saving
        const modulesToSave = modules.map(({ fachbereich, workload, shortName, ...rest }) => rest);

        // Inverse transform plans for studiengruppen
        const cohortsToSave = studiengruppen.map(sg => {
            const { plan, ...rest } = sg;
            return {
                ...rest,
                plan: inverseTransformPlan(plan, modules)
            };
        });

        // Inverse transform template plans for programs
        const programsToSave = programs.map(p => {
             const { templatePlan, ...rest } = p;
             return {
                 ...rest,
                 templatePlan: inverseTransformPlan(templatePlan as ProgramPlan, modules)
             };
        });

        await Promise.all([
            fs.writeFile(modulesFilePath, JSON.stringify(modulesToSave, null, 2), 'utf-8'),
            fs.writeFile(programsFilePath, JSON.stringify(programsToSave, null, 2), 'utf-8'),
            fs.writeFile(cohortsFilePath, JSON.stringify(cohortsToSave, null, 2), 'utf-8'),
            fs.writeFile(categoriesFilePath, JSON.stringify(data.categories, null, 2), 'utf-8')
        ]);
        console.log("Data saved successfully.");

    } catch (error) {
        console.error("Failed to save data:", error);
        throw new Error("Could not save application data.");
    }
}

// Resets the database - for now, this just means the app will re-read the files on next load.
export async function resetData(): Promise<AppData> {
    return getAllData();
}
