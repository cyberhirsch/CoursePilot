import type { Semester, AbsoluteSemester } from '@/types';

export const CP_LIMIT_PER_SEMESTER = 35;

export const CATEGORY_ORDER = [
  "Studiengangübergreifende Kompetenzen",
  "Studiengangspezifische Kompetenzen",
  "Weitere Module und Studienabschnitte",
];

export const RELATIVE_SEMESTERS: Semester[] = [
  { id: 'sem1', name: '1. Sem.' },
  { id: 'sem2', name: '2. Sem.' },
  { id: 'sem3', name: '3. Sem.' },
  { id: 'sem4',name: '4. Sem.' },
  { id: 'sem5', name: '5. Sem.' },
  { id: 'sem6', name: '6. Sem.' },
  { id: 'sem7', name: '7. Sem.' },
  { id: 'sem8', name: '8. Sem.' },
  { id: 'sem9', name: '9. Sem.' },
];

export const ABSOLUTE_SEMESTERS: AbsoluteSemester[] = [
    { id: 'ws2021', name: 'WS 2021/22', year: 2021, type: 'WS'},
    { id: 'ss2022', name: 'SS 2022', year: 2022, type: 'SS'},
    { id: 'ws2022', name: 'WS 2022/23', year: 2022, type: 'WS'},
    { id: 'ss2023', name: 'SS 2023', year: 2023, type: 'SS'},
    { id: 'ws2023', name: 'WS 2023/24', year: 2023, type: 'WS'},
    { id: 'ss2024', name: 'SS 2024', year: 2024, type: 'SS'},
    { id: 'ws2024', name: 'WS 2024/25', year: 2024, type: 'WS'},
    { id: 'ss2025', name: 'SS 2025', year: 2025, type: 'SS'},
    { id: 'ws2025', name: 'WS 2025/26', year: 2025, type: 'WS'},
    { id: 'ss2026', name: 'SS 2026', year: 2026, type: 'SS'},
    { id: 'ws2026', name: 'WS 2026/27', year: 2026, type: 'WS'},
    { id: 'ss2027', name: 'SS 2027', year: 2027, type: 'SS'},
    { id: 'ws2027', name: 'WS 2027/28', year: 2027, type: 'WS'},
    { id: 'ss2028', name: 'SS 2028', year: 2028, type: 'SS'},
    { id: 'ws2028', name: 'WS 2028/29', year: 2028, type: 'WS'},
]

export function getAbsoluteSemesterFor(startSemester: AbsoluteSemester, relativeIndex: number): AbsoluteSemester | undefined {
    const startIndex = ABSOLUTE_SEMESTERS.findIndex(s => s.id === startSemester.id);
    if (startIndex === -1) return undefined;
    return ABSOLUTE_SEMESTERS[startIndex + relativeIndex];
}

export function getRelativeSemesterIndex(startSemester: AbsoluteSemester, absoluteSemester: AbsoluteSemester): number {
    const startIndex = ABSOLUTE_SEMESTERS.findIndex(s => s.id === startSemester.id);
    const absoluteIndex = ABSOLUTE_SEMESTERS.findIndex(s => s.id === absoluteSemester.id);
    if (startIndex === -1 || absoluteIndex === -1) return -1;
    return absoluteIndex - startIndex;
}
