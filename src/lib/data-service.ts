
import { promises as fs } from 'fs';
import path from 'path';
import type { Module, Program, Cohort, Category, ProgramPlan, RawPlan, Catalogs, User, Room, SystemSettings, AcademicCalendar, RoomAssignment, LecturerAvailability, SchedulePlan } from '@/types';
import pb from './pocketbase';

interface AppData {
    modules: Module[];
    programs: Program[];
    cohorts: Cohort[];
    categories: Category[];
    catalogs: Catalogs;
    users: User[];
    rooms: Room[];
    roomAssignments: RoomAssignment[];
    systemSettings: SystemSettings;
    academicCalendar: AcademicCalendar;
    lecturerAvailabilities: LecturerAvailability[];
    schedulePlan: SchedulePlan | null;
}

const dataDir = process.env.COURSEPILOT_DATA_DIR || path.join(process.cwd(), 'data');
const cohortsFilePath = path.join(dataDir, 'cohorts.json');
const modulesFilePath = path.join(dataDir, 'modules.json');
const programsFilePath = path.join(dataDir, 'programs.json');
const categoriesFilePath = path.join(dataDir, 'categories.json');
const catalogsFilePath = path.join(dataDir, 'catalogs.json');
const usersFilePath = path.join(dataDir, 'users.json');
const roomsFilePath = path.join(dataDir, 'rooms.json');
const roomOccupancyFilePath = path.join(dataDir, 'room-occupancy.json');
const systemSettingsFilePath = path.join(dataDir, 'system-settings.json');
const academicCalendarFilePath = path.join(dataDir, 'academic-calendar.json');
const lecturerAvailabilityFilePath = path.join(dataDir, 'lecturer-availability.json');
const scheduleFilePath = path.join(dataDir, 'schedule.json');

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


// Reads all data from PocketBase (single document) or local JSON files
export async function getAllData(): Promise<AppData> {
    const usePocketBase = !!process.env.NEXT_PUBLIC_POCKETBASE_URL;

    if (usePocketBase) {
        try {
            // Fetch the first record from the 'CoursePilot' collection
            const record = await pb.collection('CoursePilot').getFirstListItem('', { requestKey: null });
            const data = record.data as AppData;

            // We still perform the mapping/transformations to ensure UI compatibility
            const cohorts: Cohort[] = data.cohorts.map(cohort => {
                const program = data.programs.find(p => p.id === cohort.programId);
                return {
                    ...cohort,
                    plan: transformPlan(cohort.plan as any, data.modules),
                    semesters: cohort.semesters || program?.semesters || 7,
                };
            });

            const transformedPrograms = data.programs.map(p => ({
                ...p,
                templatePlan: transformPlan(p.templatePlan as any, data.modules)
            }));

            const enrichedModules = data.modules.map(m => ({
                ...m,
                department: m.department || 'Design',
                workload: m.workload || (m.cp || 0) * 30,
                shortName: m.shortName || m.name.substring(0, 5)
            }));

            return {
                modules: enrichedModules,
                programs: transformedPrograms,
                cohorts,
                categories: data.categories,
                catalogs: data.catalogs || { examTypes: [], teachingMethods: [], languages: [], personInCharge: [] },
                users: data.users || [],
                rooms: data.rooms || [],
                roomAssignments: data.roomAssignments || [],
                systemSettings: data.systemSettings || {} as any,
                academicCalendar: data.academicCalendar || { academicYearStartMonth: 10, semesters: [] },
                lecturerAvailabilities: data.lecturerAvailabilities || [],
                schedulePlan: data.schedulePlan || null
            };
        } catch (error) {
            console.error("PocketBase fetch failed (single doc), falling back to local files:", error);
        }
    }

    // Fallback to local files
    const [
        modules,
        programsData,
        cohorts,
        categories,
        catalogs,
        users,
        roomsData,
        roomAssignments,
        systemSettings,
        academicCalendar,
        lecturerAvailabilities,
        schedulePlan,
    ] = await Promise.all([
        readJsonFile<Module[]>(modulesFilePath),
        readJsonFile<Program[]>(programsFilePath),
        readJsonFile<any[]>(cohortsFilePath),
        readJsonFile<Category[]>(categoriesFilePath),
        readJsonFile<Catalogs>(catalogsFilePath).catch(() => ({
            examTypes: [],
            teachingMethods: [],
            languages: [],
            personInCharge: []
        } as Catalogs)),
        readJsonFile<User[]>(usersFilePath).catch(() => []),
        readJsonFile<Room[]>(roomsFilePath).catch(() => []),
        readJsonFile<RoomAssignment[]>(roomOccupancyFilePath).catch(() => []),
        readJsonFile<SystemSettings>(systemSettingsFilePath).catch(() => ({} as SystemSettings)),
        readJsonFile<AcademicCalendar>(academicCalendarFilePath).catch(() => ({ academicYearStartMonth: 10, semesters: [] })),
        readJsonFile<LecturerAvailability[]>(lecturerAvailabilityFilePath).catch(() => []),
        readJsonFile<SchedulePlan | null>(scheduleFilePath).catch(() => null),
    ]);

    const cohortsData: Cohort[] = cohorts.map(cohort => {
        const program = programsData.find(p => p.id === cohort.programId);
        return {
            ...cohort,
            plan: transformPlan(cohort.plan, modules),
            semesters: cohort.semesters || program?.semesters || 7, // Fallback chain
        };
    });

    const transformedPrograms = programsData.map(p => ({
        ...p,
        templatePlan: transformPlan(p.templatePlan as any, modules)
    }));

    const enrichedModules = modules.map(m => ({
        ...m,
        department: m.department || 'Design',
        workload: m.workload || (m.cp || 0) * 30,
        shortName: m.shortName || m.name.substring(0, 5)
    }));

    return {
        modules: enrichedModules,
        programs: transformedPrograms,
        cohorts: cohortsData,
        categories,
        catalogs,
        users,
        rooms: (roomsData as any).rooms || roomsData,
        roomAssignments: (roomsData as any).roomAssignments || roomAssignments,
        systemSettings: (roomsData as any).systemSettings || systemSettings,
        academicCalendar: (roomsData as any).academicCalendar || academicCalendar,
        lecturerAvailabilities,
        schedulePlan,
    };
}

// Saves the entire data object back to PocketBase or individual files
export async function saveData(data: AppData): Promise<void> {
    const usePocketBase = !!process.env.NEXT_PUBLIC_POCKETBASE_URL;

    try {
        const { modules, programs, cohorts } = data;

        // Strip UI-only fields from modules before saving
        const modulesToSave = modules.map(({ department, workload, shortName, ...rest }) => rest);

        const cohortsToSave = cohorts.map(sg => {
            const { plan, ...rest } = sg;
            return {
                ...rest,
                plan: inverseTransformPlan(plan, modules)
            };
        });

        const programsToSave = programs.map(p => {
            const { templatePlan, ...rest } = p;
            return {
                ...rest,
                templatePlan: inverseTransformPlan(templatePlan as ProgramPlan, modules)
            };
        });

        if (usePocketBase) {
            const payload = {
                modules: modulesToSave,
                programs: programsToSave,
                cohorts: cohortsToSave,
                categories: data.categories,
                catalogs: data.catalogs,
                users: data.users,
                rooms: data.rooms,
                roomAssignments: data.roomAssignments,
                systemSettings: data.systemSettings,
                academicCalendar: data.academicCalendar,
                lecturerAvailabilities: data.lecturerAvailabilities,
                schedulePlan: data.schedulePlan
            };

            try {
                // Try to update the first existing record
                const record = await pb.collection('CoursePilot').getFirstListItem('', { requestKey: null });
                await pb.collection('CoursePilot').update(record.id, { data: payload });
            } catch (e) {
                // If none exists, create the first one
                await pb.collection('CoursePilot').create({ data: payload });
            }
            console.log("Data saved to PocketBase (single doc).");
        } else {
            await Promise.all([
                fs.writeFile(modulesFilePath, JSON.stringify(modulesToSave, null, 2), 'utf-8'),
                fs.writeFile(programsFilePath, JSON.stringify(programsToSave, null, 2), 'utf-8'),
                fs.writeFile(cohortsFilePath, JSON.stringify(cohortsToSave, null, 2), 'utf-8'),
                fs.writeFile(categoriesFilePath, JSON.stringify(data.categories, null, 2), 'utf-8'),
                fs.writeFile(catalogsFilePath, JSON.stringify(data.catalogs, null, 2), 'utf-8'),
                fs.writeFile(usersFilePath, JSON.stringify(data.users, null, 2), 'utf-8'),
                fs.writeFile(roomsFilePath, JSON.stringify(data.rooms, null, 2), 'utf-8'),
                fs.writeFile(roomOccupancyFilePath, JSON.stringify(data.roomAssignments, null, 2), 'utf-8'),
                fs.writeFile(systemSettingsFilePath, JSON.stringify(data.systemSettings, null, 2), 'utf-8'),
                fs.writeFile(academicCalendarFilePath, JSON.stringify(data.academicCalendar, null, 2), 'utf-8'),
                fs.writeFile(lecturerAvailabilityFilePath, JSON.stringify(data.lecturerAvailabilities, null, 2), 'utf-8'),
                fs.writeFile(scheduleFilePath, JSON.stringify(data.schedulePlan, null, 2), 'utf-8')
            ]);
            console.log("Data saved to local files.");
        }

    } catch (error) {
        console.error("Failed to save data:", error);
        throw new Error("Could not save application data.");
    }
}

// Resets the database - for now, this just means the app will re-read the files on next load.
export async function resetData(): Promise<AppData> {
    return getAllData();
}
