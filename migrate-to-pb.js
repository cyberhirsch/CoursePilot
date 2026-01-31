
import PocketBase from 'pocketbase';
import { promises as fs } from 'fs';
import path from 'path';

// Manual pb instance for script
const pb = new PocketBase('https://api.sebhirsch.com');

async function readJsonFile(filePath) {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

async function migrate() {
    const dataDir = path.join(process.cwd(), 'data');

    console.log('Authenticating as superuser...');
    try {
        await pb.admins.authWithPassword('antigravity@ai.local', '2Many5ecret5');
        console.log('Authentication successful.');
    } catch (e) {
        console.error('Authentication failed:', e.message);
        return;
    }

    console.log('Reading local files...');
    const modules = await readJsonFile(path.join(dataDir, 'modules.json'));
    const programs = await readJsonFile(path.join(dataDir, 'programs.json'));
    const cohorts = await readJsonFile(path.join(dataDir, 'cohorts.json'));
    const categories = await readJsonFile(path.join(dataDir, 'categories.json'));

    const payload = {
        modules,
        programs,
        studiengruppen: cohorts,
        categories
    };

    console.log('Migrating to PocketBase (Single Doc)...');

    try {
        // Try to update the first record in 'CoursePilot'
        const record = await pb.collection('CoursePilot').getFirstListItem('', { requestKey: null });
        await pb.collection('CoursePilot').update(record.id, { data: payload });
        console.log('Migration successful: Record updated.');
    } catch (e) {
        // Create it if it doesn't exist
        try {
            await pb.collection('CoursePilot').create({ data: payload });
            console.log('Migration successful: Record created.');
        } catch (err) {
            console.error('Migration failed. Did you create the "CoursePilot" collection with a "data" (Json) field?', err.message);
        }
    }
}

migrate();
