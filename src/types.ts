




export interface Category {
  id: string;
  name: string;
}

export interface Semester {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superuser' | 'admin' | 'coordinator' | 'professor' | 'lecturer' | 'student' | 'guest';
  department?: string | null;
  cohortId?: string;
  universityId?: string; // Matrikelnummer or Personalnummer
}

export interface ContentRow {
  topic: string;
  content: string;
  goals: string;
}

export interface LiteratureRow {
  author: string;
  title: string;
  publisher: string;
  comment: string;
}

export interface WorkloadItem {
  description: string;
  hours: number;
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
  workloadDetails?: WorkloadItem[];
  contentDetails?: ContentRow[]; // New 3-column structure for Inhaltsübersicht
  contentTopics?: string[]; // Legacy Inhaltsübersicht
  literatureDetails?: LiteratureRow[]; // New 4-column structure for Literature
  literatureItems?: string[]; // Legacy Literatur list
  duration?: string; // e.g. "1 Semester"
  frequency?: string; // e.g. "jedes Semester"
  shortName?: string;
  department?: 'Design' | 'Psychologie' | 'Wirtschaft';
  instanceCount?: number;
  description?: string;
  learningOutcomes?: string; // Markdown or text
  examType?: string; // e.g. "Klausur (90 Min)", "Projektarbeit"
  teachingMethods?: string; // e.g. "Vorlesung", "Seminar"
  language?: string; // e.g. "Deutsch", "Englisch"
  personInCharge?: string; // Name of the responsible person
  literature?: string; // Recommended reading
  equivalentTo?: string; // ID of another module this is equivalent to (for legacy mapping)
  prerequisites?: string[];
  forbiddenSemesters?: number[];
  maxParticipants?: number;
  semesterRecommendation?: string;
  requirements?: {
    beamer: boolean;
    lecturerPc: boolean;
    macRoom: boolean;
    pcLab: boolean;
  };
}

export interface Program {
  id: string;
  name: string;
  moduleIds: string[];
  defaultStudents: number;
  semesters: number;
  categoryOrder?: string[];
  templatePlan?: ProgramPlan;
  department?: 'Design' | 'Psychologie' | 'Wirtschaft';
}

export type SemesterType = 'WS' | 'SS';

export interface Catalogs {
  examTypes: string[];
  teachingMethods: string[];
  languages: string[];
  personInCharge?: string[];
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

export interface Cohort {
  id: string; // e.g. "k-BA-GDVK-25Sk"
  name: string; // "B.A. Grafikdesign..."
  programId: string;
  startSemester: AbsoluteSemester;
  plan: ProgramPlan; // This will be the transformed plan
  studentCount: number;
  semesters: number; // Individual semester count for the group
  shortName: string;
  type: 'klassisch' | 'dual';
  userLockedModules?: string[];
}

export interface Room {
  id: string;
  name: string;
  type: 'building' | 'online' | 'hybrid';
  capacity: number;
  equipment: {
    beamer: boolean;
    lecturerPc: boolean;
    macRoom: boolean;
    pcLab: boolean;
    darkenable: boolean;
    barrierFree: boolean;
    airConditioned: boolean;
  };
  workspacesMac: number;
  workspacesPc: number;
  area?: number; // square meters
  floor?: string;
  building?: string;
  weblink?: string;
  blockedPeriods?: { start: string; end: string; reason?: string }[];
  notes?: string;
}

export interface SemesterPeriod {
  id: string;
  name: string;
  type: 'SS' | 'WS';
  year: number;
  lecturesStart: string;
  lecturesEnd: string;
  examsStart: string;
  examsEnd: string;
  lectureBreakStart?: string;
  lectureBreakEnd?: string;
}

export interface AcademicCalendar {
  academicYearStartMonth: number;
  semesters: SemesterPeriod[];
}

export interface SystemSettings {
  currentSemester: string;
  academicCalendar: {
    lecturesStart: string;
    lecturesEnd: string;
    examsStart?: string;
    examsEnd?: string;
  };
  institutions: {
    defaultLocation: string;
    campusLocations: string[];
  };
  calculationFactors: {
    cpWorkloadFactor: number;
    swsDurationMinutes: number;
    defaultRoomBufferMinutes: number;
  };
  daySchedule: {
    startHour: string;
    endHour: string;
    standardPauseMinutes: number;
    eventBreakDurationMinutes?: number;
    eventBreakIntervalMinutes?: number;
    plannedWeekdays?: Weekday[];
    useLunchBreak?: boolean;
    lunchBreakStart?: string;
    lunchBreakEnd?: string;
  };
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface AvailabilitySlot {
  day: Weekday;
  startTime: string;
  endTime: string;
}

export interface DateAvailabilitySlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface LecturerAvailability {
  userId: string;
  availableSlots: AvailabilitySlot[];
  unavailableSlots?: AvailabilitySlot[];
  unavailableDateSlots?: DateAvailabilitySlot[];
  maxSwsPerDay?: number;
  notes?: string;
}

export type MainCategory = 'semester-plan' | 'schedule' | 'examinations' | 'user-management' | 'settings' | 'modules' | 'rooms' | 'lecturers';
export type PlannerViewMode = 'semester' | 'group' | 'modules' | 'optimization' | 'schedule-planner' | 'module-details' | 'lecturer-overview' | 'availability' | 'room-overview' | 'room-occupancy' | 'room-availability' | 'user-profile' | 'user-groups' | 'settings-general' | 'settings-variables' | 'settings-calendar' | 'exam-transcript' | 'exam-grading' | 'exam-admin' | 'exam-schedule';

export interface RoomAssignment {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title: string;
  person?: string;
  purpose?: string;
  moduleId?: string;
  cohortId?: string;
  color?: string;
  lockKind?: 'soft' | 'hard';
}

export interface ScheduledClassOccurrenceOverride {
  originalDate: string;
  date: string;
  roomId: string;
  roomName: string;
  startTime: string;
  endTime: string;
  lecturerName?: string;
  title?: string;
  purpose?: string;
  color?: string;
  lockKind?: 'soft' | 'hard';
}

export interface ScheduledClass {
  id: string;
  semesterId: string;
  moduleId: string;
  moduleName: string;
  moduleInstanceIds: string[];
  cohortIds: string[];
  cohortNames: string[];
  lecturerUserId?: string;
  lecturerName: string;
  roomId: string;
  roomName: string;
  day: Weekday;
  date: string;
  occurrenceDates: string[];
  startTime: string;
  endTime: string;
  sws: number;
  participants: number;
  score: number;
  warnings: string[];
  occurrenceOverrides?: ScheduledClassOccurrenceOverride[];
}

export interface ScheduleIssue {
  id: string;
  moduleId: string;
  moduleName: string;
  cohortIds: string[];
  cohortNames: string[];
  reason: string;
}

export type SchedulePlanStatus = 'planning' | 'locked';

export interface ScheduleAdjustment {
  id: string;
  type: 'deleted-occurrence' | 'replacement-added' | 'manual-change';
  classId?: string;
  moduleId?: string;
  fromDate?: string;
  toDate?: string;
  note?: string;
  createdAt: string;
}

export interface SchedulePlan {
  semesterId: string;
  planningMode: 'semester';
  status: SchedulePlanStatus;
  semesterStartDate: string;
  semesterEndDate: string;
  weekStartDate: string;
  weekEndDate: string;
  generatedAt: string;
  entries: ScheduledClass[];
  unscheduled: ScheduleIssue[];
  adjustmentLog?: ScheduleAdjustment[];
  summary: {
    totalOfferings: number;
    scheduledOfferings: number;
    unscheduledOfferings: number;
    totalSws: number;
    plannedRoomAssignments: number;
    teachingWeeks: number;
  };
}
