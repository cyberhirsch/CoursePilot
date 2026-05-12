'use client';

import React, { useMemo, useState } from 'react';
import Papa, { type ParseResult } from 'papaparse';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import type {
    AcademicCalendar,
    AvailabilitySlot,
    Catalogs,
    Category,
    Cohort,
    ContentRow,
    CoursePilotData,
    DateAvailabilitySlot,
    LecturerAvailability,
    LiteratureRow,
    Module,
    Program,
    ProgramPlan,
    Room,
    RoomAssignment,
    ScheduledClass,
    SchedulePlan,
    SystemSettings,
    User,
    Weekday,
    WorkloadItem,
} from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

type CsvRow = Record<string, string>;

type ImportResult = {
    updates: Partial<CoursePilotData>;
    count: number;
};

type ImportTarget = {
    fileName: string;
    title: string;
    description: string;
    requiredColumns: string[];
    optionalColumns: string[];
    notes: string[];
    templateRow: CsvRow;
    parse: (rows: CsvRow[], currentData: Partial<CoursePilotData>) => ImportResult;
};

type ImportStatus = {
    type: 'success' | 'error';
    message: string;
};

interface SettingsImportProps {
    currentData: Partial<CoursePilotData>;
    onImportData?: (updates: Partial<CoursePilotData>) => void;
    lang?: keyof typeof TRANSLATIONS;
}

const SEMESTER_COLUMNS = Array.from({ length: 9 }, (_, index) => `sem${index + 1}`);
const WEEKDAY_VALUES: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_CATALOGS: Catalogs = {
    examTypes: [],
    teachingMethods: [],
    languages: [],
    personInCharge: [],
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    currentSemester: '',
    academicCalendar: {
        lecturesStart: '',
        lecturesEnd: '',
        examsStart: '',
        examsEnd: '',
    },
    institutions: {
        defaultLocation: '',
        campusLocations: [],
    },
    calculationFactors: {
        cpWorkloadFactor: 30,
        swsDurationMinutes: 45,
        defaultRoomBufferMinutes: 15,
    },
    daySchedule: {
        startHour: '08:00',
        endHour: '18:00',
        standardPauseMinutes: 15,
        eventBreakDurationMinutes: 15,
        eventBreakIntervalMinutes: 90,
        plannedWeekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        useLunchBreak: false,
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
    },
};

const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, '').trim();
const hasValue = (value: string | undefined) => Boolean(value && value.trim().length > 0);
const cell = (row: CsvRow, key: string) => (row[key] || '').trim();

const requiredCell = (row: CsvRow, key: string, rowIndex: number) => {
    const value = cell(row, key);
    if (!value) {
        throw new Error(`Zeile ${rowIndex + 2}: Spalte "${key}" ist erforderlich.`);
    }
    return value;
};

const parseNumber = (value: string | undefined, fallback = 0) => {
    if (!hasValue(value)) return fallback;
    const normalized = value!.replace(',', '.');
    const numberValue = Number(normalized);
    return Number.isFinite(numberValue) ? numberValue : fallback;
};

const parseBoolean = (value: string | undefined, fallback = false) => {
    if (!hasValue(value)) return fallback;
    return ['1', 'true', 'yes', 'ja', 'x'].includes(value!.trim().toLowerCase());
};

const parseList = (value: string | undefined) => {
    if (!hasValue(value)) return [];
    return value!
        .split('|')
        .map(item => item.trim())
        .filter(Boolean);
};

const parseNumberList = (value: string | undefined) => parseList(value)
    .map(item => parseNumber(item, NaN))
    .filter(numberValue => Number.isFinite(numberValue));

const parseJsonCell = <T,>(value: string | undefined, fallback: T): T => {
    if (!hasValue(value)) return fallback;
    try {
        return JSON.parse(value!) as T;
    } catch {
        throw new Error(`JSON-Wert konnte nicht gelesen werden: ${value}`);
    }
};

const setOptional = (target: Record<string, unknown>, key: string, value: unknown) => {
    if (typeof value === 'string' && !hasValue(value)) return;
    if (Array.isArray(value) && value.length === 0) return;
    if (typeof value === 'undefined' || value === null) return;
    target[key] = value;
};

const parseSemesterPlan = (row: CsvRow): ProgramPlan => ({
    semesters: SEMESTER_COLUMNS.reduce((acc, semesterKey) => {
        acc[semesterKey] = parseList(row[semesterKey]);
        return acc;
    }, {} as Record<string, string[]>),
});

const parseSlotGroups = (value: string | undefined): AvailabilitySlot[] => {
    if (!hasValue(value)) return [];
    return value!
        .split(';;')
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => item.split('|').map(part => part.trim()))
        .filter(parts => parts.length >= 3 && WEEKDAY_VALUES.includes(parts[0] as Weekday))
        .map(parts => ({
            day: parts[0] as Weekday,
            startTime: parts[1],
            endTime: parts[2],
        }));
};

const parseDateSlotGroups = (value: string | undefined): DateAvailabilitySlot[] => {
    if (!hasValue(value)) return [];
    return value!
        .split(';;')
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => item.split('|').map(part => part.trim()))
        .filter(parts => parts.length >= 4)
        .map(parts => ({
            id: parts[0],
            date: parts[1],
            startTime: parts[2],
            endTime: parts[3],
            reason: parts[4] || undefined,
        }));
};

const parseBlockedPeriods = (value: string | undefined): Room['blockedPeriods'] => {
    if (!hasValue(value)) return [];
    return value!
        .split(';;')
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => item.split('|').map(part => part.trim()))
        .filter(parts => parts.length >= 2)
        .map(parts => ({
            start: parts[0],
            end: parts[1],
            reason: parts[2] || undefined,
        }));
};

const parseRows = (rows: CsvRow[]) => rows
    .map(row => Object.fromEntries(
        Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value || '').trim()])
    ) as CsvRow)
    .filter(row => Object.values(row).some(hasValue));

const requireColumns = (rows: CsvRow[], columns: string[]) => {
    const fields = new Set(Object.keys(rows[0] || {}));
    const missing = columns.filter(column => !fields.has(column));
    if (missing.length) {
        throw new Error(`Fehlende Spalten: ${missing.join(', ')}`);
    }
};

const makeTargets = (): ImportTarget[] => [
    {
        fileName: 'modules.json',
        title: 'Module',
        description: 'Eine Zeile pro Modul.',
        requiredColumns: ['id', 'name', 'sws', 'cp', 'type', 'category'],
        optionalColumns: [
            'programIds', 'prerequisites', 'forbiddenSemesters', 'maxParticipants', 'personInCharge',
            'duration', 'frequency', 'description', 'learningOutcomes', 'examType', 'teachingMethods',
            'language', 'literature', 'equivalentTo', 'semesterRecommendation', 'beamer', 'lecturerPc',
            'macRoom', 'pcLab', 'workloadDetailsJson', 'contentDetailsJson', 'contentTopics',
            'literatureDetailsJson', 'literatureItems',
        ],
        notes: [
            'type: Pflicht, Wahlpflicht oder Pool.',
            'Listen mit | trennen, z.B. DSA|ARAI.',
            'JSON-Spalten enthalten vollstaendige JSON-Arrays.',
        ],
        templateRow: {
            id: 'G1',
            name: 'Grundlagen',
            sws: '4',
            cp: '5',
            type: 'Pflicht',
            category: 'Core',
            programIds: 'DSA|ARAI',
            prerequisites: '',
            forbiddenSemesters: '',
            maxParticipants: '40',
            personInCharge: 'Dozent Platzhalter 01',
            beamer: 'true',
            lecturerPc: 'true',
            macRoom: 'false',
            pcLab: 'false',
        },
        parse: rows => ({
            count: rows.length,
            updates: {
                modules: rows.map((row, index) => {
                    const module: Module = {
                        id: requiredCell(row, 'id', index),
                        name: requiredCell(row, 'name', index),
                        sws: parseNumber(requiredCell(row, 'sws', index)),
                        cp: parseNumber(requiredCell(row, 'cp', index)),
                        type: requiredCell(row, 'type', index) as Module['type'],
                        category: requiredCell(row, 'category', index),
                    };

                    setOptional(module as unknown as Record<string, unknown>, 'programIds', parseList(row.programIds));
                    setOptional(module as unknown as Record<string, unknown>, 'prerequisites', parseList(row.prerequisites));
                    setOptional(module as unknown as Record<string, unknown>, 'forbiddenSemesters', parseNumberList(row.forbiddenSemesters));
                    setOptional(module as unknown as Record<string, unknown>, 'maxParticipants', hasValue(row.maxParticipants) ? parseNumber(row.maxParticipants) : undefined);
                    setOptional(module as unknown as Record<string, unknown>, 'personInCharge', cell(row, 'personInCharge'));
                    setOptional(module as unknown as Record<string, unknown>, 'duration', cell(row, 'duration'));
                    setOptional(module as unknown as Record<string, unknown>, 'frequency', cell(row, 'frequency'));
                    setOptional(module as unknown as Record<string, unknown>, 'description', cell(row, 'description'));
                    setOptional(module as unknown as Record<string, unknown>, 'learningOutcomes', cell(row, 'learningOutcomes'));
                    setOptional(module as unknown as Record<string, unknown>, 'examType', cell(row, 'examType'));
                    setOptional(module as unknown as Record<string, unknown>, 'teachingMethods', cell(row, 'teachingMethods'));
                    setOptional(module as unknown as Record<string, unknown>, 'language', cell(row, 'language'));
                    setOptional(module as unknown as Record<string, unknown>, 'literature', cell(row, 'literature'));
                    setOptional(module as unknown as Record<string, unknown>, 'equivalentTo', cell(row, 'equivalentTo'));
                    setOptional(module as unknown as Record<string, unknown>, 'semesterRecommendation', cell(row, 'semesterRecommendation'));
                    setOptional(module as unknown as Record<string, unknown>, 'workloadDetails', parseJsonCell<WorkloadItem[]>(row.workloadDetailsJson, []));
                    setOptional(module as unknown as Record<string, unknown>, 'contentDetails', parseJsonCell<ContentRow[]>(row.contentDetailsJson, []));
                    setOptional(module as unknown as Record<string, unknown>, 'contentTopics', parseList(row.contentTopics));
                    setOptional(module as unknown as Record<string, unknown>, 'literatureDetails', parseJsonCell<LiteratureRow[]>(row.literatureDetailsJson, []));
                    setOptional(module as unknown as Record<string, unknown>, 'literatureItems', parseList(row.literatureItems));

                    module.requirements = {
                        beamer: parseBoolean(row.beamer),
                        lecturerPc: parseBoolean(row.lecturerPc),
                        macRoom: parseBoolean(row.macRoom),
                        pcLab: parseBoolean(row.pcLab),
                    };

                    return module;
                }),
            },
        }),
    },
    {
        fileName: 'programs.json',
        title: 'Studiengaenge',
        description: 'Eine Zeile pro Studiengang, optional mit Template-Plan in sem1 bis sem9.',
        requiredColumns: ['id', 'name', 'moduleIds', 'defaultStudents', 'semesters'],
        optionalColumns: ['categoryOrder', 'department', ...SEMESTER_COLUMNS],
        notes: [
            'moduleIds und categoryOrder mit | trennen.',
            'sem1 bis sem9 enthalten Modul-IDs fuer den Template-Plan.',
        ],
        templateRow: {
            id: 'DSA',
            name: 'B.Sc. Digital Systems',
            moduleIds: 'G1|G2|WP1-8',
            defaultStudents: '40',
            semesters: '7',
            categoryOrder: 'Core|Electives',
            sem1: 'G1|G2',
            sem2: 'WP1-8',
        },
        parse: rows => ({
            count: rows.length,
            updates: {
                programs: rows.map((row, index): Program => ({
                    id: requiredCell(row, 'id', index),
                    name: requiredCell(row, 'name', index),
                    moduleIds: parseList(requiredCell(row, 'moduleIds', index)),
                    defaultStudents: parseNumber(requiredCell(row, 'defaultStudents', index)),
                    semesters: parseNumber(requiredCell(row, 'semesters', index)),
                    categoryOrder: parseList(row.categoryOrder),
                    templatePlan: parseSemesterPlan(row),
                    department: hasValue(row.department) ? row.department as Program['department'] : undefined,
                })),
            },
        }),
    },
    {
        fileName: 'cohorts.json',
        title: 'Gruppen',
        description: 'Eine Zeile pro Gruppe, Planbelegung in sem1 bis sem9.',
        requiredColumns: [
            'id', 'name', 'programId', 'startSemesterId', 'startSemesterName',
            'startSemesterType', 'startSemesterYear', 'studentCount', 'semesters', 'shortName', 'type',
        ],
        optionalColumns: ['userLockedModules', ...SEMESTER_COLUMNS],
        notes: [
            'startSemesterType: SS oder WS.',
            'sem1 bis sem9 enthalten Modul- oder Modulinstanz-IDs, mit | getrennt.',
        ],
        templateRow: {
            id: 'BA-DSA-01',
            name: 'B.Sc. Digital Systems 01',
            programId: 'DSA',
            startSemesterId: 'ws2026',
            startSemesterName: 'WS 2026/27',
            startSemesterType: 'WS',
            startSemesterYear: '2026',
            studentCount: '32',
            semesters: '7',
            shortName: '01',
            type: 'klassisch',
            userLockedModules: '',
            sem1: 'G1|G2',
        },
        parse: rows => ({
            count: rows.length,
            updates: {
                cohorts: rows.map((row, index): Cohort => ({
                    id: requiredCell(row, 'id', index),
                    name: requiredCell(row, 'name', index),
                    programId: requiredCell(row, 'programId', index),
                    startSemester: {
                        id: requiredCell(row, 'startSemesterId', index),
                        name: requiredCell(row, 'startSemesterName', index),
                        type: requiredCell(row, 'startSemesterType', index) as 'SS' | 'WS',
                        year: parseNumber(requiredCell(row, 'startSemesterYear', index)),
                    },
                    studentCount: parseNumber(requiredCell(row, 'studentCount', index)),
                    semesters: parseNumber(requiredCell(row, 'semesters', index)),
                    shortName: requiredCell(row, 'shortName', index),
                    type: requiredCell(row, 'type', index) as Cohort['type'],
                    userLockedModules: parseList(row.userLockedModules),
                    plan: parseSemesterPlan(row),
                })),
            },
        }),
    },
    {
        fileName: 'categories.json',
        title: 'Kategorien',
        description: 'Eine Zeile pro Modulkategorie.',
        requiredColumns: ['id', 'name'],
        optionalColumns: [],
        notes: ['id sollte stabil bleiben, name ist die sichtbare Bezeichnung.'],
        templateRow: { id: 'core', name: 'Core Competencies' },
        parse: rows => ({
            count: rows.length,
            updates: {
                categories: rows.map((row, index): Category => ({
                    id: requiredCell(row, 'id', index),
                    name: requiredCell(row, 'name', index),
                })),
            },
        }),
    },
    {
        fileName: 'catalogs.json',
        title: 'Kataloge',
        description: 'Eine Zeile pro Dropdown-Wert.',
        requiredColumns: ['key', 'value'],
        optionalColumns: [],
        notes: ['key: examTypes, teachingMethods, languages oder personInCharge.'],
        templateRow: { key: 'examTypes', value: 'Klausur' },
        parse: rows => {
            const catalogs: Catalogs = { ...DEFAULT_CATALOGS };
            rows.forEach((row, index) => {
                const key = requiredCell(row, 'key', index) as keyof Catalogs;
                const value = requiredCell(row, 'value', index);
                if (!['examTypes', 'teachingMethods', 'languages', 'personInCharge'].includes(key)) {
                    throw new Error(`Zeile ${index + 2}: Unbekannter Katalog "${key}".`);
                }
                catalogs[key] = [...(catalogs[key] || []), value];
            });
            return { count: rows.length, updates: { catalogs } };
        },
    },
    {
        fileName: 'users.json',
        title: 'Nutzer und Dozenten',
        description: 'Eine Zeile pro Nutzer oder Dozent.',
        requiredColumns: ['id', 'name', 'email', 'role'],
        optionalColumns: ['department', 'cohortId', 'universityId'],
        notes: ['role: superuser, admin, coordinator, professor, lecturer, student oder guest.'],
        templateRow: {
            id: 'usr_001',
            name: 'Dozent Platzhalter 01',
            email: 'dozent01@example.com',
            role: 'lecturer',
            department: 'Engineering',
        },
        parse: rows => ({
            count: rows.length,
            updates: {
                users: rows.map((row, index): User => ({
                    id: requiredCell(row, 'id', index),
                    name: requiredCell(row, 'name', index),
                    email: requiredCell(row, 'email', index),
                    role: requiredCell(row, 'role', index) as User['role'],
                    department: cell(row, 'department') || null,
                    cohortId: cell(row, 'cohortId') || undefined,
                    universityId: cell(row, 'universityId') || undefined,
                })),
            },
        }),
    },
    {
        fileName: 'rooms.json',
        title: 'Raeume',
        description: 'Eine Zeile pro Raum.',
        requiredColumns: ['id', 'name', 'type', 'capacity'],
        optionalColumns: [
            'beamer', 'lecturerPc', 'macRoom', 'pcLab', 'darkenable', 'barrierFree',
            'airConditioned', 'workspacesMac', 'workspacesPc', 'area', 'floor',
            'building', 'weblink', 'blockedPeriods', 'notes',
        ],
        notes: [
            'type: building, online oder hybrid.',
            'blockedPeriods: start|end|reason, mehrere mit ;; trennen.',
        ],
        templateRow: {
            id: '0.01',
            name: 'Hoersaal 0.01',
            type: 'building',
            capacity: '40',
            beamer: 'true',
            lecturerPc: 'true',
            macRoom: 'false',
            pcLab: 'false',
            darkenable: 'true',
            barrierFree: 'true',
            airConditioned: 'false',
            floor: 'EG',
        },
        parse: rows => ({
            count: rows.length,
            updates: {
                rooms: rows.map((row, index): Room => ({
                    id: requiredCell(row, 'id', index),
                    name: requiredCell(row, 'name', index),
                    type: requiredCell(row, 'type', index) as Room['type'],
                    capacity: parseNumber(requiredCell(row, 'capacity', index)),
                    equipment: {
                        beamer: parseBoolean(row.beamer),
                        lecturerPc: parseBoolean(row.lecturerPc),
                        macRoom: parseBoolean(row.macRoom),
                        pcLab: parseBoolean(row.pcLab),
                        darkenable: parseBoolean(row.darkenable),
                        barrierFree: parseBoolean(row.barrierFree),
                        airConditioned: parseBoolean(row.airConditioned),
                    },
                    workspacesMac: parseNumber(row.workspacesMac),
                    workspacesPc: parseNumber(row.workspacesPc),
                    area: hasValue(row.area) ? parseNumber(row.area) : undefined,
                    floor: cell(row, 'floor') || undefined,
                    building: cell(row, 'building') || undefined,
                    weblink: cell(row, 'weblink') || undefined,
                    blockedPeriods: parseBlockedPeriods(row.blockedPeriods),
                    notes: cell(row, 'notes') || undefined,
                })),
            },
        }),
    },
    {
        fileName: 'room-occupancy.json',
        title: 'Raumbelegung',
        description: 'Eine Zeile pro Raumtermin.',
        requiredColumns: ['id', 'roomId', 'date', 'startTime', 'endTime', 'title'],
        optionalColumns: ['person', 'purpose', 'moduleId', 'cohortId', 'color', 'lockKind'],
        notes: ['date: YYYY-MM-DD, Zeiten: HH:mm, lockKind: soft oder hard.'],
        templateRow: {
            id: 'booking-001',
            roomId: '0.01',
            date: '2026-10-05',
            startTime: '09:00',
            endTime: '10:30',
            title: 'Grundlagen',
            person: 'Dozent Platzhalter 01',
        },
        parse: rows => ({
            count: rows.length,
            updates: {
                roomAssignments: rows.map((row, index): RoomAssignment => ({
                    id: requiredCell(row, 'id', index),
                    roomId: requiredCell(row, 'roomId', index),
                    date: requiredCell(row, 'date', index),
                    startTime: requiredCell(row, 'startTime', index),
                    endTime: requiredCell(row, 'endTime', index),
                    title: requiredCell(row, 'title', index),
                    person: cell(row, 'person') || undefined,
                    purpose: cell(row, 'purpose') || undefined,
                    moduleId: cell(row, 'moduleId') || undefined,
                    cohortId: cell(row, 'cohortId') || undefined,
                    color: cell(row, 'color') || undefined,
                    lockKind: hasValue(row.lockKind) ? row.lockKind as RoomAssignment['lockKind'] : undefined,
                })),
            },
        }),
    },
    {
        fileName: 'system-settings.json',
        title: 'Systemeinstellungen',
        description: 'Eine einzelne Zeile fuer die globalen Einstellungen.',
        requiredColumns: [
            'currentSemester', 'lecturesStart', 'lecturesEnd', 'defaultLocation',
            'cpWorkloadFactor', 'swsDurationMinutes', 'defaultRoomBufferMinutes',
            'startHour', 'endHour', 'standardPauseMinutes',
        ],
        optionalColumns: [
            'examsStart', 'examsEnd', 'campusLocations', 'eventBreakDurationMinutes',
            'eventBreakIntervalMinutes', 'plannedWeekdays', 'useLunchBreak',
            'lunchBreakStart', 'lunchBreakEnd',
        ],
        notes: ['campusLocations und plannedWeekdays mit | trennen.'],
        templateRow: {
            currentSemester: 'ws2026',
            lecturesStart: '2026-10-01',
            lecturesEnd: '2027-01-29',
            defaultLocation: 'Koeln',
            campusLocations: 'Koeln|Online',
            cpWorkloadFactor: '30',
            swsDurationMinutes: '45',
            defaultRoomBufferMinutes: '15',
            startHour: '08:00',
            endHour: '18:00',
            standardPauseMinutes: '15',
            plannedWeekdays: 'monday|tuesday|wednesday|thursday|friday',
        },
        parse: (rows, currentData) => {
            const row = rows[0];
            const base = currentData.systemSettings || DEFAULT_SYSTEM_SETTINGS;
            return {
                count: 1,
                updates: {
                    systemSettings: {
                        currentSemester: requiredCell(row, 'currentSemester', 0),
                        academicCalendar: {
                            lecturesStart: requiredCell(row, 'lecturesStart', 0),
                            lecturesEnd: requiredCell(row, 'lecturesEnd', 0),
                            examsStart: cell(row, 'examsStart') || base.academicCalendar.examsStart,
                            examsEnd: cell(row, 'examsEnd') || base.academicCalendar.examsEnd,
                        },
                        institutions: {
                            defaultLocation: requiredCell(row, 'defaultLocation', 0),
                            campusLocations: parseList(row.campusLocations),
                        },
                        calculationFactors: {
                            cpWorkloadFactor: parseNumber(requiredCell(row, 'cpWorkloadFactor', 0)),
                            swsDurationMinutes: parseNumber(requiredCell(row, 'swsDurationMinutes', 0)),
                            defaultRoomBufferMinutes: parseNumber(requiredCell(row, 'defaultRoomBufferMinutes', 0)),
                        },
                        daySchedule: {
                            startHour: requiredCell(row, 'startHour', 0),
                            endHour: requiredCell(row, 'endHour', 0),
                            standardPauseMinutes: parseNumber(requiredCell(row, 'standardPauseMinutes', 0)),
                            eventBreakDurationMinutes: parseNumber(row.eventBreakDurationMinutes, base.daySchedule.eventBreakDurationMinutes || 0),
                            eventBreakIntervalMinutes: parseNumber(row.eventBreakIntervalMinutes, base.daySchedule.eventBreakIntervalMinutes || 0),
                            plannedWeekdays: parseList(row.plannedWeekdays).filter(day => WEEKDAY_VALUES.includes(day as Weekday)) as Weekday[],
                            useLunchBreak: parseBoolean(row.useLunchBreak, base.daySchedule.useLunchBreak || false),
                            lunchBreakStart: cell(row, 'lunchBreakStart') || base.daySchedule.lunchBreakStart,
                            lunchBreakEnd: cell(row, 'lunchBreakEnd') || base.daySchedule.lunchBreakEnd,
                        },
                    },
                },
            };
        },
    },
    {
        fileName: 'academic-calendar.json',
        title: 'Akademischer Kalender',
        description: 'Eine Zeile pro Semester.',
        requiredColumns: ['academicYearStartMonth', 'id', 'name', 'type', 'year', 'lecturesStart', 'lecturesEnd', 'examsStart', 'examsEnd'],
        optionalColumns: ['lectureBreakStart', 'lectureBreakEnd'],
        notes: ['academicYearStartMonth darf in jeder Zeile gleich sein; verwendet wird der erste Wert.'],
        templateRow: {
            academicYearStartMonth: '10',
            id: 'ws2026',
            name: 'WS 2026/27',
            type: 'WS',
            year: '2026',
            lecturesStart: '2026-10-01',
            lecturesEnd: '2027-01-29',
            examsStart: '2027-02-01',
            examsEnd: '2027-02-12',
            lectureBreakStart: '2026-12-23',
            lectureBreakEnd: '2027-01-05',
        },
        parse: rows => ({
            count: rows.length,
            updates: {
                academicCalendar: {
                    academicYearStartMonth: parseNumber(requiredCell(rows[0], 'academicYearStartMonth', 0), 10),
                    semesters: rows.map((row, index) => ({
                        id: requiredCell(row, 'id', index),
                        name: requiredCell(row, 'name', index),
                        type: requiredCell(row, 'type', index) as 'SS' | 'WS',
                        year: parseNumber(requiredCell(row, 'year', index)),
                        lecturesStart: requiredCell(row, 'lecturesStart', index),
                        lecturesEnd: requiredCell(row, 'lecturesEnd', index),
                        examsStart: requiredCell(row, 'examsStart', index),
                        examsEnd: requiredCell(row, 'examsEnd', index),
                        lectureBreakStart: cell(row, 'lectureBreakStart') || undefined,
                        lectureBreakEnd: cell(row, 'lectureBreakEnd') || undefined,
                    })),
                },
            },
        }),
    },
    {
        fileName: 'lecturer-availability.json',
        title: 'Dozenten-Verfuegbarkeit',
        description: 'Eine Zeile pro Dozent/Nutzer.',
        requiredColumns: ['userId', 'availableSlots'],
        optionalColumns: ['unavailableSlots', 'unavailableDateSlots', 'maxSwsPerDay', 'notes'],
        notes: [
            'Slots: day|start|end, mehrere mit ;; trennen.',
            'unavailableDateSlots: id|date|start|end|reason, mehrere mit ;; trennen.',
        ],
        templateRow: {
            userId: 'usr_001',
            availableSlots: 'monday|08:00|16:00;;tuesday|09:00|18:00',
            unavailableSlots: 'friday|12:00|18:00',
            unavailableDateSlots: 'block-1|2026-10-05|08:00|18:00|Konferenz',
            maxSwsPerDay: '6',
        },
        parse: rows => ({
            count: rows.length,
            updates: {
                lecturerAvailabilities: rows.map((row, index): LecturerAvailability => ({
                    userId: requiredCell(row, 'userId', index),
                    availableSlots: parseSlotGroups(requiredCell(row, 'availableSlots', index)),
                    unavailableSlots: parseSlotGroups(row.unavailableSlots),
                    unavailableDateSlots: parseDateSlotGroups(row.unavailableDateSlots),
                    maxSwsPerDay: hasValue(row.maxSwsPerDay) ? parseNumber(row.maxSwsPerDay) : undefined,
                    notes: cell(row, 'notes') || undefined,
                })),
            },
        }),
    },
    {
        fileName: 'schedule.json',
        title: 'Semesterplan-Termine',
        description: 'Eine Zeile pro geplante Veranstaltung im Schedule.',
        requiredColumns: [
            'semesterId', 'status', 'semesterStartDate', 'semesterEndDate', 'weekStartDate',
            'weekEndDate', 'entryId', 'moduleId', 'moduleName', 'roomId', 'roomName',
            'day', 'date', 'startTime', 'endTime', 'sws', 'participants',
        ],
        optionalColumns: [
            'generatedAt', 'moduleInstanceIds', 'cohortIds', 'cohortNames', 'lecturerUserId',
            'lecturerName', 'occurrenceDates', 'score', 'warnings', 'totalOfferings',
            'plannedRoomAssignments', 'teachingWeeks',
        ],
        notes: [
            'Der Import bildet geplante Termine ab; unscheduled Issues und Adjustment-Log bleiben leer.',
            'moduleInstanceIds, cohortIds, cohortNames, occurrenceDates und warnings mit | trennen.',
        ],
        templateRow: {
            semesterId: 'ws2026',
            status: 'planning',
            semesterStartDate: '2026-10-01',
            semesterEndDate: '2027-01-29',
            weekStartDate: '2026-09-28',
            weekEndDate: '2027-01-31',
            entryId: 'class-ws2026:G1',
            moduleId: 'G1',
            moduleName: 'Grundlagen',
            roomId: '0.01',
            roomName: 'Hoersaal 0.01',
            day: 'monday',
            date: '2026-10-05',
            startTime: '09:00',
            endTime: '10:30',
            sws: '2',
            participants: '30',
            occurrenceDates: '2026-10-05|2026-10-12',
        },
        parse: rows => {
            const first = rows[0];
            const entries: ScheduledClass[] = rows.map((row, index) => ({
                id: requiredCell(row, 'entryId', index),
                semesterId: requiredCell(row, 'semesterId', index),
                moduleId: requiredCell(row, 'moduleId', index),
                moduleName: requiredCell(row, 'moduleName', index),
                moduleInstanceIds: parseList(row.moduleInstanceIds),
                cohortIds: parseList(row.cohortIds),
                cohortNames: parseList(row.cohortNames),
                lecturerUserId: cell(row, 'lecturerUserId') || undefined,
                lecturerName: cell(row, 'lecturerName') || 'N.N.',
                roomId: requiredCell(row, 'roomId', index),
                roomName: requiredCell(row, 'roomName', index),
                day: requiredCell(row, 'day', index) as Weekday,
                date: requiredCell(row, 'date', index),
                occurrenceDates: parseList(row.occurrenceDates).length ? parseList(row.occurrenceDates) : [requiredCell(row, 'date', index)],
                startTime: requiredCell(row, 'startTime', index),
                endTime: requiredCell(row, 'endTime', index),
                sws: parseNumber(requiredCell(row, 'sws', index)),
                participants: parseNumber(requiredCell(row, 'participants', index)),
                score: parseNumber(row.score),
                warnings: parseList(row.warnings),
            }));
            const schedulePlan: SchedulePlan = {
                semesterId: requiredCell(first, 'semesterId', 0),
                planningMode: 'semester',
                status: requiredCell(first, 'status', 0) as SchedulePlan['status'],
                semesterStartDate: requiredCell(first, 'semesterStartDate', 0),
                semesterEndDate: requiredCell(first, 'semesterEndDate', 0),
                weekStartDate: requiredCell(first, 'weekStartDate', 0),
                weekEndDate: requiredCell(first, 'weekEndDate', 0),
                generatedAt: cell(first, 'generatedAt') || new Date().toISOString(),
                entries,
                unscheduled: [],
                adjustmentLog: [],
                summary: {
                    totalOfferings: parseNumber(first.totalOfferings, entries.length),
                    scheduledOfferings: entries.length,
                    unscheduledOfferings: 0,
                    totalSws: entries.reduce((sum, entry) => sum + entry.sws, 0),
                    plannedRoomAssignments: parseNumber(
                        first.plannedRoomAssignments,
                        entries.reduce((sum, entry) => sum + entry.occurrenceDates.length, 0)
                    ),
                    teachingWeeks: parseNumber(first.teachingWeeks, 0),
                },
            };
            return { count: entries.length, updates: { schedulePlan } };
        },
    },
];

export const SettingsImport: React.FC<SettingsImportProps> = ({
    currentData,
    onImportData,
    lang = DEFAULT_LANGUAGE,
}) => {
    const t = TRANSLATIONS[lang];
    const targets = useMemo(() => makeTargets(), []);
    const [statuses, setStatuses] = useState<Record<string, ImportStatus>>({});

    const updateStatus = (fileName: string, status: ImportStatus) => {
        setStatuses(prev => ({ ...prev, [fileName]: status }));
    };

    const handleImport = (target: ImportTarget, file: File | undefined) => {
        if (!file || !onImportData) return;

        Papa.parse<CsvRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: ParseResult<CsvRow>) => {
                try {
                    const rows = parseRows(results.data);
                    if (!rows.length) {
                        throw new Error('Die CSV-Datei enthaelt keine Datenzeilen.');
                    }
                    requireColumns(rows, target.requiredColumns);
                    const result = target.parse(rows, currentData);
                    onImportData(result.updates);
                    updateStatus(target.fileName, {
                        type: 'success',
                        message: `${result.count} Zeile(n) aus ${file.name} importiert.`,
                    });
                } catch (error) {
                    updateStatus(target.fileName, {
                        type: 'error',
                        message: error instanceof Error ? error.message : 'CSV konnte nicht importiert werden.',
                    });
                }
            },
            error: error => {
                updateStatus(target.fileName, {
                    type: 'error',
                    message: error.message,
                });
            },
        });
    };

    const downloadTemplate = (target: ImportTarget) => {
        const csv = Papa.unparse([target.templateRow]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = target.fileName.replace('.json', '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight">{t.settings?.import || 'Import'}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-3xl">
                        Jede CSV ersetzt die passende JSON-Datei im lokalen Datenbestand. Die Spaltennamen muessen exakt wie unten angegeben in der ersten Zeile stehen.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {targets.map(target => {
                    const status = statuses[target.fileName];
                    return (
                        <div key={target.fileName} className="bg-card border border-border rounded-lg p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest">{target.fileName}</p>
                                    <h3 className="text-lg font-black text-foreground">{target.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{target.description}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => downloadTemplate(target)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                                        title="CSV-Vorlage herunterladen"
                                        aria-label="CSV-Vorlage herunterladen"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <label
                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-primary text-primary-foreground hover:bg-primary/90 ${onImportData ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                        title="CSV importieren"
                                        aria-label="CSV importieren"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <input
                                            type="file"
                                            accept=".csv,text/csv"
                                            className="hidden"
                                            disabled={!onImportData}
                                            onChange={event => {
                                                handleImport(target, event.target.files?.[0]);
                                                event.currentTarget.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Pflichtspalten</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {target.requiredColumns.map(column => (
                                            <span key={column} className="rounded bg-primary/10 text-primary px-2 py-1 text-[11px] font-bold">
                                                {column}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Optionale Spalten</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {target.optionalColumns.length ? target.optionalColumns.map(column => (
                                            <span key={column} className="rounded bg-muted text-muted-foreground px-2 py-1 text-[11px] font-bold">
                                                {column}
                                            </span>
                                        )) : (
                                            <span className="text-xs text-muted-foreground">Keine</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 border-t border-border pt-4">
                                <h4 className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Werteformat</h4>
                                <ul className="space-y-1">
                                    {target.notes.map(note => (
                                        <li key={note} className="text-xs text-muted-foreground">{note}</li>
                                    ))}
                                </ul>
                            </div>

                            {status && (
                                <div className={`mt-4 flex items-start gap-2 rounded-md border px-3 py-2 text-xs font-medium ${status.type === 'success'
                                    ? 'border-emerald-700/60 bg-emerald-950/30 text-emerald-300'
                                    : 'border-destructive/60 bg-destructive/10 text-destructive-foreground'
                                    }`}>
                                    {status.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                                    <span>{status.message}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
