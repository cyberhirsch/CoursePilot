import type { Studiengruppe, ProgramPlan } from '@/types';
import { ABSOLUTE_SEMESTERS } from '@/constants';

// Helper to find semester by ID
const findSem = (id: string) => ABSOLUTE_SEMESTERS.find(s => s.id === id)!;

// This file contains the specific student groups.
// The template plans are now defined in MU_Module_Data.ts with the programs.
// For initial data consistency, we define temporary plan objects here that match the structure.
// In a real application, new groups would get their plan from the program's templatePlan.

const gdvkKlassischTemplatePlan: ProgramPlan = {
  semesters: {
    'sem1': ['G1', 'F3', 'F4', 'F5-1'],
    'sem2': ['G2', 'F2', 'M2', 'F5-2'],
    'sem3': ['G3', 'M5', 'M6', 'F5-3'],
    'sem4': ['G4', 'M1', 'F5-4', 'Wp1-8-1'],
    'sem5': ['G5', 'G6', 'BA-P', 'Praktikum', 'F5-5', 'Wp1-8-2'],
    'sem6': ['F1', 'Sp', 'Rep', 'BA-K', 'Wp1-8-3']
  }
};

const gdimTemplatePlan: ProgramPlan = {
  semesters: {
    'sem1': ['G1', 'B2', 'I1'],
    'sem2': ['G6', 'Wp3', 'A2', 'S5'],
    'sem3': ['G4', 'C1', 'S3'],
    'sem4': ['Wp1', 'A3', 'C3', 'I2'],
    'sem5': ['G3', 'G5', 'B1', 'A1', 'C2', 'C4', 'S2'],
    'sem6': ['Praktikum', 'Lab-1'],
    'sem7': ['G2', 'S4', 'I3', 'I4', 'Rep', 'BA-A']
  }
};


// --- Detaillierte Studiengruppen basierend auf dem Screenshot ---
// Referenzsemester für die Berechnung: WS 2025/26

export const STUDIENGRUPPEN: Studiengruppe[] = [
  // --- GDVK Gruppen ---
  {
    id: "GDVK-28d", name: "GDVK Dual 28", programId: "GDVK", shortName: "28d", type: 'dual', studentCount: 1,
    startSemester: findSem('ws2021'), // 9. Sem in WS25 -> Start WS21
    plan: { semesters: { 'sem1': ['G1','F3'], 'sem2': ['G2','F4'], 'sem3': ['G3','F2'], 'sem4': ['G4','F5-1'], 'sem5': ['M1','M2'], 'sem6': ['M3','M5'], 'sem7': ['G5','M6'], 'sem8': ['G6', 'Wp1-8-1'], 'sem9': ['Praktikum'] } },
    userLockedModules: []
  },
  {
    id: "GDVK-31k", name: "GDVK Klassisch 31", programId: "GDVK", shortName: "31k", type: 'klassisch', studentCount: 3,
    startSemester: findSem('ss2023'), // 6. Sem in WS25 -> Start SS23
    plan: gdvkKlassischTemplatePlan,
    userLockedModules: []
  },
  {
    id: "GDVK-32d", name: "GDVK Dual 32", programId: "GDVK", shortName: "32d", type: 'dual', studentCount: 18,
    startSemester: findSem('ws2023'), // 5. Sem in WS25 -> Start WS23
    plan: { semesters: { 'sem1': ['G1','F3'], 'sem2': ['G2','F4'], 'sem3': ['G3','F2'], 'sem4': ['G4','F5-1'], 'sem5': ['M1','M2'], 'sem6': ['Praktikum'] } },
    userLockedModules: []
  },
  {
    id: "GDVK-32k", name: "GDVK Klassisch 32", programId: "GDVK", shortName: "32k", type: 'klassisch', studentCount: 2,
    startSemester: findSem('ws2023'), // 5. Sem in WS25 -> Start WS23
    plan: gdvkKlassischTemplatePlan,
    userLockedModules: []
  },
  {
    id: "GDVK-33", name: "GDVK Klassisch 33", programId: "GDVK", shortName: "33", type: 'klassisch', studentCount: 3,
    startSemester: findSem('ss2024'), // 4. Sem in WS25 -> Start SS24
    plan: gdvkKlassischTemplatePlan,
    userLockedModules: []
  },
  {
    id: "k-BA-GDVK-24Wk", name: "GDVK Klassisch WS24", programId: "GDVK", shortName: "24Wk", type: 'klassisch', studentCount: 7,
    startSemester: findSem('ws2024'), // 3. Sem in WS25 -> Start WS24
    plan: gdvkKlassischTemplatePlan,
    userLockedModules: []
  },
  {
    id: "d-BA-GDVK-24Wd", name: "GDVK Dual WS24", programId: "GDVK", shortName: "24Wd", type: 'dual', studentCount: 6,
    startSemester: findSem('ws2024'), // 3. Sem in WS25 -> Start WS24
    plan: { semesters: { 'sem1': ['G1','F3'], 'sem2': ['G2','F4'], 'sem3': ['G3','F2','Wp1-8-1'], 'sem4': ['G4','F5-1'], 'sem5': ['M1','M2'], 'sem6': ['Praktikum'] } },
    userLockedModules: []
  },
  {
    id: "k-BA-GDVK-25Sk", name: "GDVK Klassisch SS25", programId: "GDVK", shortName: "25Sk", type: 'klassisch', studentCount: 2,
    startSemester: findSem('ss2025'), // 2. Sem in WS25 -> Start SS25
    plan: gdvkKlassischTemplatePlan,
    userLockedModules: []
  },
  {
    id: "d-BA-GDVK-25Sd", name: "GDVK Dual SS25", programId: "GDVK", shortName: "25Sd", type: 'dual', studentCount: 1,
    startSemester: findSem('ss2025'), // 2. Sem in WS25 -> Start SS25
    plan: { semesters: { 'sem1': ['G1','F3'], 'sem2': ['G2','F4','G5'], 'sem3': ['G3','F2'], 'sem4': ['G4','F5-1'], 'sem5': ['M1','M2'], 'sem6': ['Praktikum'] } },
    userLockedModules: []
  },
   {
    id: "k-BA-GDVK-25Wk", name: "GDVK Klassisch WS25", programId: "GDVK", shortName: "25Wk", type: 'klassisch', studentCount: 2,
    startSemester: findSem('ws2025'), // 1. Sem in WS25 -> Start WS25
    plan: gdvkKlassischTemplatePlan,
    userLockedModules: []
  },
  {
    id: "d-BA-GDVK-25Wd", name: "GDVK Dual WS25", programId: "GDVK", shortName: "25Wd", type: 'dual', studentCount: 1,
    startSemester: findSem('ws2025'), // 1. Sem in WS25 -> Start WS25
    plan: { semesters: { 'sem1': ['G1','F3','G2'], 'sem2': ['G3','F4'], 'sem3': ['G4','F2'], 'sem4': ['G5','F5-1'], 'sem5': ['M1','M2'], 'sem6': ['Praktikum'] } },
    userLockedModules: []
  },

  // --- GDIM Gruppen (jetzt mit neuem Plan-Template) ---
  {
    id: "GDIM-05", name: "GDIM Klassisch 05", programId: "GDIM", shortName: "05", type: 'klassisch', studentCount: 10,
    startSemester: findSem('ws2022'), 
    plan: gdimTemplatePlan,
    userLockedModules: []
  },
  {
    id: "GDIM-06", name: "GDIM Klassisch 06", programId: "GDIM", shortName: "06", type: 'klassisch', studentCount: 2,
    startSemester: findSem('ws2022'), // 6. Sem in WS25 -> Start WS22
    plan: gdimTemplatePlan,
    userLockedModules: []
  },
  {
    id: "GDIM-07", name: "GDIM Klassisch 07", programId: "GDIM", shortName: "07", type: 'klassisch', studentCount: 13,
    startSemester: findSem('ss2023'), // 5. Sem in WS25 -> Start SS23
    plan: gdimTemplatePlan,
    userLockedModules: []
  },
  {
    id: "GDIM-08", name: "GDIM Klassisch 08", programId: "GDIM", shortName: "08", type: 'klassisch', studentCount: 1,
    startSemester: findSem('ws2023'), // 4. Sem in WS25 -> Start WS23
    plan: gdimTemplatePlan,
    userLockedModules: []
  },
  {
    id: "k-BA-GDIM-24Wk", name: "GDIM Klassisch WS24", programId: "GDIM", shortName: "24Wk", type: 'klassisch', studentCount: 3,
    startSemester: findSem('ws2024'), // 3. Sem in WS25 -> Start WS24
    plan: gdimTemplatePlan,
    userLockedModules: []
  },
  {
    id: "k-BA-GDIM-25Wk", name: "GDIM Klassisch WS25", programId: "GDIM", shortName: "25Wk", type: 'klassisch', studentCount: 1,
    startSemester: findSem('ws2025'), // 1. Sem in WS25 -> Start WS25
    plan: gdimTemplatePlan,
    userLockedModules: []
  },
  {
    id: "d-BA-GDIM-25Wd", name: "GDIM Dual WS25", programId: "GDIM", shortName: "25Wd", type: 'dual', studentCount: 1,
    startSemester: findSem('ws2025'), // 1. Sem in WS25 -> Start WS25
    plan: gdimTemplatePlan,
    userLockedModules: []
  },
];
