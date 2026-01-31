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
  { id: 'sem4', name: '4. Sem.' },
  { id: 'sem5', name: '5. Sem.' },
  { id: 'sem6', name: '6. Sem.' },
  { id: 'sem7', name: '7. Sem.' },
  { id: 'sem8', name: '8. Sem.' },
  { id: 'sem9', name: '9. Sem.' },
];

export function getAbsoluteSemesterFor(absoluteSemesters: AbsoluteSemester[], startSemester: AbsoluteSemester, relativeIndex: number): AbsoluteSemester | undefined {
  if (!startSemester || !absoluteSemesters) return undefined;
  const startIndex = absoluteSemesters.findIndex(s => s.id === startSemester.id);
  if (startIndex === -1) return undefined;
  return absoluteSemesters[startIndex + relativeIndex];
}

export function getRelativeSemesterIndex(absoluteSemesters: AbsoluteSemester[], startSemester: AbsoluteSemester, absoluteSemester: AbsoluteSemester): number {
  if (!startSemester || !absoluteSemester || !absoluteSemesters) return -1;
  const startIndex = absoluteSemesters.findIndex(s => s.id === startSemester.id);
  const absoluteIndex = absoluteSemesters.findIndex(s => s.id === absoluteSemester.id);
  if (startIndex === -1 || absoluteIndex === -1) return -1;
  return absoluteIndex - startIndex;
}
