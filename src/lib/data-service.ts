// src/lib/data-service.ts
import { promises as fs } from 'fs';
import path from 'path';
import { STUDIENGRUPPEN as initialStudiengruppen } from '@/data/MU_Design_Data';
import { MODULES as initialModules, PROGRAMS as initialPrograms, CATEGORIES as initialCategories } from '@/data/MU_Module_Data';
import type { Module, Program, Studiengruppe, Category } from '@/types';

interface AppData {
    modules: Module[];
    programs: Program[];
    studiengruppen: Studiengruppe[];
    categories: Category[];
}

// Path to our flat-file database
const dataFilePath = path.join(process.cwd(), 'data', 'db.json');

// Ensure the data directory exists
async function ensureDirectoryExists() {
    try {
        await fs.access(path.dirname(dataFilePath));
    } catch {
        await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    }
}

// Gets the initial data from the project's data files
function getInitialData(): AppData {
    return {
        modules: initialModules,
        programs: initialPrograms,
        studiengruppen: initialStudiengruppen,
        categories: initialCategories,
    };
}

// Reads all data from the db.json file, or returns initial data if it doesn't exist
export async function getAllData(): Promise<AppData> {
    await ensureDirectoryExists();
    try {
        await fs.access(dataFilePath);
        const fileContent = await fs.readFile(dataFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch {
        console.log("Data file not found, creating with initial data.");
        const initialData = getInitialData();
        await saveData(initialData);
        return initialData;
    }
}

// Saves the entire data object to the db.json file
export async function saveData(data: AppData): Promise<void> {
    await ensureDirectoryExists();
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Resets the database to the initial state
export async function resetData(): Promise<AppData> {
    const initialData = getInitialData();
    await saveData(initialData);
    return initialData;
}
