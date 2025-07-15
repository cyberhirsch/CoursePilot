import type { Module, Program, Category } from '@/types';
import { CATEGORY_ORDER } from '@/constants';

export const CATEGORIES: Category[] = [
  { id: 'sguek', name: 'Studiengangübergreifende Kompetenzen' },
  { id: 'sgsk', name: 'Studiengangspezifische Kompetenzen' },
  { id: 'wmsa', name: 'Weitere Module und Studienabschnitte' },
];

export const MODULES: Module[] = [
  // === POOL MODULES ===
  { id: 'Wp1-8', name: 'Wahlpflicht Pool (GDVK)', shortName: 'WP', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pool', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design', instanceCount: 8, description: 'Pool für studiengangübergreifende Wahlpflichtfächer. Studierende können aus einem Katalog von Modulen wählen.', learningOutcomes: 'Interdisziplinäre Kompetenzen, Einblick in andere Fachbereiche.', assessment: 'Variiert je nach gewähltem Modul.', maxParticipants: 25 },
  { id: 'F5', name: 'Projekt Wahl Pool (GDVK)', shortName: 'PW', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pool', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design', instanceCount: 5, maxParticipants: 25 },
  { id: 'Lab', name: 'Game & Interactive Lab', shortName: 'Lab', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pool', category: 'Weitere Module und Studienabschnitte', fachbereich: 'Design', instanceCount: 6, maxParticipants: 20 },

  // === Studiengangübergreifender Kompetenzbereich ===
  { id: 'G1', name: 'Wissenschaftliches Propädeutikum', shortName: 'Intro', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design', description: 'Einführung in wissenschaftliche Arbeitsweisen und Methoden.', learningOutcomes: 'Fähigkeit zur Recherche, Analyse und zum wissenschaftlichen Schreiben.', assessment: 'Hausarbeit und Präsentation', prerequisites: [], semesterRecommendation: '1' },
  { id: 'G2', name: 'Personale und soziale Kompetenzen', shortName: 'Persc', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  { id: 'G3', name: 'Medien- und Kommunikationswissenschaft', shortName: 'Medi', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  { id: 'G4', name: 'Wirtschaftswissenschaften', shortName: 'Econ', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  { id: 'G5', name: 'Interkulturalität', shortName: 'Inter', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  { id: 'G6', name: 'Empirische Methodenlehre', shortName: 'Emp', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  
  // Wahlpflichtbereich (GDIM) - 3 aus 7
  { id: 'Wp1', name: 'Medientechnologie', shortName: 'Wp1', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Wahlpflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  { id: 'Wp2', name: 'Medienrecht', shortName: 'Wp2', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Wahlpflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  { id: 'Wp3', name: 'Sozialwissenschaften', shortName: 'Wp3', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Wahlpflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  { id: 'Wp4', name: 'Digitale Ökonomie', shortName: 'Wp4', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Wahlpflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  { id: 'Wp5', name: 'Wirtschaftsenglisch', shortName: 'Wp5', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Wahlpflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  { id: 'Wp6', name: 'zweite Fremdsprache', shortName: 'Wp6', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Wahlpflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },
  { id: 'Wp7', name: 'Sozialpsychologie', shortName: 'Wp7', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Wahlpflicht', category: 'Studiengangübergreifende Kompetenzen', fachbereich: 'Design' },

  // === Studiengangspezifischer Kompetenzbereich (GDVK) ===
  { id: 'F1', name: 'Kunst-/Designgeschichte und -theorie', shortName: 'Histo', ects: 5, sws: 2, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design', description: 'Überblick über wichtige Epochen der Kunst- und Designgeschichte.', learningOutcomes: 'Kontexte historischer Werke verstehen und einordnen können.', assessment: 'Klausur', prerequisites: [], semesterRecommendation: '6' },
  { id: 'F2', name: 'Gestaltungsprozess und Kreativität', shortName: 'Desig', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'F3', name: 'Farbe, Form, Komposition', shortName: 'Color', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'F4', name: 'Grafik und Bild', shortName: 'Grap', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'M1', name: 'Fotografie', shortName: 'Photo', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'M2', name: 'Layout', shortName: 'Layou', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'M3', name: 'Prepress/Press', shortName: 'Prepr', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'M5', name: 'Grundlagen Interface/Interaktionsdesign', shortName: 'Foun', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'M6', name: 'Interaktive Medien', shortName: 'Inter', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design', prerequisites: ['M5'] },
  
  // === Studiengangspezifische Kompetenzen (GDIM) ===
  { id: 'B1', name: 'Kunst-/Designgeschichte und -theorie', shortName: 'Histo', ects: 5, sws: 2, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'B2', name: 'Gestaltungs- und Designgrundlage', shortName: 'Design', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'A1', name: 'Concept Art', shortName: 'A1', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'A2', name: '2D Character Animation', shortName: 'A2', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'A3', name: 'Motion Design', shortName: 'A3', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'C1', name: 'Modelling & Texturing', shortName: 'C1', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'C2', name: 'Lighting & Shading', shortName: 'C2', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'C3', name: 'Rigging & 3D Character Animation', shortName: 'C3', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'C4', name: 'Simulation & FX', shortName: 'C4', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'S1', name: 'Grundlagen Spieleentwicklung', shortName: 'Gamedev', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'S2', name: 'Game Engines & Projektmanagement', shortName: 'Engines', ects: 5, sws: 5, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'S3', name: 'Level Design', shortName: 'Level', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'S4', name: 'Spielmechanik', shortName: 'Mechanics', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'S5', name: 'Sound Design', shortName: 'Sound', ects: 5, sws: 2, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'I1', name: 'Interactive and Visual Storytelling', shortName: 'Story', ects: 5, sws: 3, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'I2', name: 'Programmierung & Visual Scripting', shortName: 'Script', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'I3', name: 'Grundlagen Interface- und Interaktionsdesign', shortName: 'Interface', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },
  { id: 'I4', name: 'Interaktive Medien', shortName: 'Media', ects: 5, sws: 4, cp: 5, workload: 150, type: 'Pflicht', category: 'Studiengangspezifische Kompetenzen', fachbereich: 'Design' },

  // === Weitere Module und Studienabschnitte ===
  { id: 'Sp', name: 'Selbstpräsentation', shortName: 'Self', ects: 5, sws: 2, cp: 5, workload: 150, type: 'Pflicht', category: 'Weitere Module und Studienabschnitte', fachbereich: 'Design', forbiddenSemesters: [1, 2] },
  { id: 'Praktikum', name: 'Praktikum', shortName: 'Prkt', ects: 30, sws: 0, cp: 30, workload: 900, type: 'Pflicht', category: 'Weitere Module und Studienabschnitte', fachbereich: 'Design', prerequisites: ['Sp'] },
  { id: 'Rep', name: 'Repetitorium', shortName: 'Rep', ects: 10, sws: 3, cp: 10, workload: 300, type: 'Pflicht', category: 'Weitere Module und Studienabschnitte', fachbereich: 'Design' },
  { id: 'BA-P', name: 'BA-Prüfung', shortName: 'BA-P', ects: 10, sws: 3, cp: 10, workload: 300, type: 'Pflicht', category: 'Weitere Module und Studienabschnitte', fachbereich: 'Design' },
  { id: 'BA-K', name: 'Bachelorarbeit', shortName: 'chelor', ects: 10, sws: 2, cp: 10, workload: 300, type: 'Pflicht', category: 'Weitere Module und Studienabschnitte', fachbereich: 'Design' },
  { id: 'BA-A', name: 'Bachelorarbeit', shortName: 'BA-A', ects: 10, sws: 2, cp: 10, workload: 300, type: 'Pflicht', category: 'Weitere Module und Studienabschnitte', fachbereich: 'Design' },
];

const gdimTemplatePlan = {
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

const gdvkKlassischTemplatePlan = {
  semesters: {
    'sem1': ['G1', 'F3', 'F4', 'F5-1'],
    'sem2': ['G2', 'F2', 'M2', 'F5-2'],
    'sem3': ['G3', 'M5', 'M6', 'F5-3'],
    'sem4': ['G4', 'M1', 'F5-4', 'Wp1-8-1'],
    'sem5': ['G5', 'G6', 'BA-P', 'Praktikum', 'F5-5', 'Wp1-8-2'],
    'sem6': ['F1', 'Sp', 'Rep', 'BA-K', 'Wp1-8-3']
  }
};


export const PROGRAMS: Program[] = [
  {
    id: 'GDVK',
    name: 'B.A. Grafikdesign und Visuelle Kommunikation',
    semesters: 6,
    defaultStudents: 56,
    moduleIds: [ 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'F1', 'F2', 'F3', 'F4', 'M1', 'M2', 'M3', 'M5', 'M6', 'Praktikum', 'Rep', 'BA-K', 'Sp', 'BA-P', 'Wp1-8', 'F5' ],
    categoryOrder: CATEGORY_ORDER,
    templatePlan: gdvkKlassischTemplatePlan,
  },
  {
    id: 'GDIM',
    name: 'B.A. Game Design and Interactive Media',
    semesters: 7,
    defaultStudents: 35,
    moduleIds: [ 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'Wp1', 'Wp2', 'Wp3', 'Wp4', 'Wp5', 'Wp6', 'Wp7', 'B1', 'B2', 'A1', 'A2', 'A3', 'C1', 'C2', 'C3', 'C4', 'S1', 'S2', 'S3', 'S4', 'S5', 'I1', 'I2', 'I3', 'I4', 'Lab', 'Rep', 'Praktikum', 'BA-A' ],
    categoryOrder: CATEGORY_ORDER,
    templatePlan: gdimTemplatePlan,
  },
];
