export interface Category {
  id: string;
  name: string;
}

export interface Module {
  id: string;
  name: string;
  ects: number; // Legacy, will use cp
  sws: number;
  cp: number;
  workload: number;
  type: 'Pflicht' | 'Wahlpflicht' | 'Pool';
  category: string;
  shortName?: string;
  fachbereich: 'Design' | 'Psychologie' | 'Wirtschaft';
  instanceCount?: number;
  // New detailed fields
  description?: string;
  learningOutcomes?: string;
  assessment?: string;
  // User request additions
  prerequisites?: string[]; // E.g., ['M5'] - Module IDs that must be taken before this one.
  forbiddenSemesters?: number[]; // E.g., [1, 2] - Relative semesters where this module cannot be placed.
  maxParticipants?: number; // Max students for a course instance
  semesterRecommendation?: string;
}

export interface Program {
  id:string;
  name: string;
  moduleIds: string[];
  defaultStudents: number;
  semesters: number;
  categoryOrder?: string[];
  templatePlan?: ProgramPlan;
}

export interface Semester {
  id: string;
  name: string;
}

export interface AbsoluteSemester {
  id: string; // e.g., 'ss2025'
  name: string; // e.g., 'SS 2025'
  year: number;
  type: 'SS' | 'WS';
}

export interface ProgramPlan {
  semesters: {
    // Enthält jetzt reguläre Modul-IDs oder Instanz-IDs wie 'POOL_WP-1'
    [semesterId: string]: string[]; 
  };
}

export interface Plan {
  [programId: string]: ProgramPlan;
}


export interface StudentNumbers {
    [programId: string]: number;
}

export interface Studiengruppe {
  id: string; // e.g. "k-BA-GDVK-25Sk"
  name: string; // "B.A. Grafikdesign..."
  programId: string;
  startSemester: AbsoluteSemester;
  plan: ProgramPlan;
  studentCount: number;
  shortName: string;
  type: 'klassisch' | 'dual';
  userLockedModules?: string[];
}

export type MainCategory = 'semesterplan' | 'stundenplan' | 'pruefungswesen' | 'nutzerverwaltung' | 'einstellungen';
export type PlannerViewMode = 'semester' | 'group' | 'modules' | 'templates' | 'optimization';
