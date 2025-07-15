
export interface Category {
  id: string;
  name: string;
}

export interface Module {
  id: string;
  name: string;
  sws: number;
  cp: number;
  type: 'Pflicht' | 'Wahlpflicht' | 'Pool';
  category: string;
  programIds?: string[];
  // Optional fields that might be added back later or are calculated
  workload?: number;
  shortName?: string;
  fachbereich?: 'Design' | 'Psychologie' | 'Wirtschaft';
  instanceCount?: number;
  description?: string;
  learningOutcomes?: string;
  assessment?: string;
  prerequisites?: string[];
  forbiddenSemesters?: number[];
  maxParticipants?: number;
  semesterRecommendation?: string;
}

export interface Program {
  id:string;
  name: string;
  moduleIds: string[];
  defaultStudents: number;
  semesters: number;
  categoryOrder?: string[];
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

// This is the structure used by the UI components
export interface ProgramPlan {
  semesters: {
    // Contains regular module IDs or instance IDs like 'POOL_WP-1'
    [semesterId: string]: string[]; 
  };
}

// This represents the new plan structure from cohorts.json
export interface RawPlan {
  modules: {
    [moduleId: string]: number | number[]; // e.g. { "G1": 1, "WP1-8": [2, 4] }
  }
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
  plan: ProgramPlan; // This will be the transformed plan
  studentCount: number;
  shortName: string;
  type: 'klassisch' | 'dual';
  userLockedModules?: string[];
}

export type MainCategory = 'semesterplan' | 'stundenplan' | 'pruefungswesen' | 'nutzerverwaltung' | 'einstellungen';
export type PlannerViewMode = 'semester' | 'group' | 'modules' | 'optimization';
