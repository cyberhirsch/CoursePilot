import { RELATIVE_SEMESTERS, getRelativeSemesterIndex } from '@/constants';
import type {
  AbsoluteSemester,
  AvailabilitySlot,
  Cohort,
  LecturerAvailability,
  Module,
  Room,
  RoomAssignment,
  ScheduleAdjustment,
  ScheduledClass,
  ScheduledClassOccurrenceOverride,
  ScheduleIssue,
  SchedulePlan,
  SemesterPeriod,
  SystemSettings,
  User,
  Weekday,
} from '@/types';

export const WEEKDAYS: { id: Weekday; label: string; shortLabel: string; jsDay: number }[] = [
  { id: 'monday', label: 'Montag', shortLabel: 'Mo', jsDay: 1 },
  { id: 'tuesday', label: 'Dienstag', shortLabel: 'Di', jsDay: 2 },
  { id: 'wednesday', label: 'Mittwoch', shortLabel: 'Mi', jsDay: 3 },
  { id: 'thursday', label: 'Donnerstag', shortLabel: 'Do', jsDay: 4 },
  { id: 'friday', label: 'Freitag', shortLabel: 'Fr', jsDay: 5 },
  { id: 'saturday', label: 'Samstag', shortLabel: 'Sa', jsDay: 6 },
  { id: 'sunday', label: 'Sonntag', shortLabel: 'So', jsDay: 0 },
];

const GENERATED_ASSIGNMENT_PREFIX = 'schedule-';
const SLOT_STEP_MINUTES = 30;
const DEFAULT_PLANNED_WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

type Offering = {
  id: string;
  semesterId: string;
  module: Module;
  moduleInstanceIds: string[];
  cohortIds: string[];
  cohortNames: string[];
  participants: number;
  fixedLecturer?: User;
  fixedLecturerName?: string;
  warnings: string[];
  eligibleRooms: Room[];
  candidateLecturers: User[];
};

type Candidate = {
  room: Room;
  lecturer?: User;
  day: Weekday;
  occurrenceDates: string[];
  startTime: string;
  endTime: string;
  score: number;
};

export type ScheduleOptimizerInput = {
  modules: Module[];
  cohorts: Cohort[];
  users: User[];
  rooms: Room[];
  selectedSemester: AbsoluteSemester;
  semesters: AbsoluteSemester[];
  lecturerAvailabilities: LecturerAvailability[];
  roomAssignments: RoomAssignment[];
  systemSettings?: SystemSettings;
};

export type ScheduleOptimizerOutput = {
  plan: SchedulePlan;
  roomAssignments: RoomAssignment[];
};

const timeToMinutes = (time: string): number => {
  const [hour = '0', minute = '0'] = time.split(':');
  return Number(hour) * 60 + Number(minute);
};

const minutesToTime = (minutes: number): string => {
  const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
  const minute = (minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (date: string): Date => new Date(`${date}T00:00:00`);

const getEntryOccurrenceDates = (entry: ScheduledClass): string[] => {
  return Array.isArray(entry.occurrenceDates) ? entry.occurrenceDates : (entry.date ? [entry.date] : []);
};

type EffectiveOccurrence = {
  originalDate: string;
  date: string;
  roomId: string;
  roomName: string;
  startTime: string;
  endTime: string;
  lecturerName: string;
  title?: string;
  purpose?: string;
  color?: string;
  lockKind?: 'soft' | 'hard';
};

const getOccurrenceOverrides = (entry: ScheduledClass): ScheduledClassOccurrenceOverride[] => {
  return Array.isArray(entry.occurrenceOverrides) ? entry.occurrenceOverrides : [];
};

const getEffectiveOccurrence = (entry: ScheduledClass, originalDate: string): EffectiveOccurrence => {
  const override = getOccurrenceOverrides(entry).find(item => item.originalDate === originalDate);

  return {
    originalDate,
    date: override?.date || originalDate,
    roomId: override?.roomId || entry.roomId,
    roomName: override?.roomName || entry.roomName,
    startTime: override?.startTime || entry.startTime,
    endTime: override?.endTime || entry.endTime,
    lecturerName: override?.lecturerName || entry.lecturerName,
    title: override?.title,
    purpose: override?.purpose,
    color: override?.color,
    lockKind: override?.lockKind,
  };
};

const getEffectiveOccurrences = (entry: ScheduledClass): EffectiveOccurrence[] => {
  return getEntryOccurrenceDates(entry).map(date => getEffectiveOccurrence(entry, date));
};

const rangesOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
};

const rangesOverlapWithStandardPause = (
  startA: string,
  endA: string,
  startB: string,
  endB: string,
  systemSettings?: SystemSettings
): boolean => {
  const pauseMinutes = Math.max(0, systemSettings?.daySchedule?.standardPauseMinutes || 0);
  return timeToMinutes(startA) < timeToMinutes(endB) + pauseMinutes
    && timeToMinutes(startB) < timeToMinutes(endA) + pauseMinutes;
};

const getPlannedWeekdays = (systemSettings?: SystemSettings): Weekday[] => {
  return systemSettings?.daySchedule?.plannedWeekdays?.length
    ? systemSettings.daySchedule.plannedWeekdays
    : DEFAULT_PLANNED_WEEKDAYS;
};

const overlapsLunchBreak = (
  startTime: string,
  endTime: string,
  systemSettings?: SystemSettings
): boolean => {
  if (!systemSettings?.daySchedule?.useLunchBreak) return false;

  const lunchStart = systemSettings.daySchedule.lunchBreakStart || '12:00';
  const lunchEnd = systemSettings.daySchedule.lunchBreakEnd || '13:00';
  if (timeToMinutes(lunchStart) >= timeToMinutes(lunchEnd)) return false;

  return rangesOverlap(startTime, endTime, lunchStart, lunchEnd);
};

const slotContains = (container: AvailabilitySlot, day: Weekday, startTime: string, endTime: string): boolean => {
  return container.day === day
    && timeToMinutes(container.startTime) <= timeToMinutes(startTime)
    && timeToMinutes(container.endTime) >= timeToMinutes(endTime);
};

const slotOverlaps = (slot: AvailabilitySlot, day: Weekday, startTime: string, endTime: string): boolean => {
  return slot.day === day && rangesOverlap(slot.startTime, slot.endTime, startTime, endTime);
};

export const isTeachingUser = (user: User): boolean => {
  return ['professor', 'lecturer', 'admin', 'coordinator'].includes(user.role);
};

export const getTeachingUsers = (users: User[]): User[] => {
  return users.filter(isTeachingUser).sort((a, b) => a.name.localeCompare(b.name));
};

export const createDefaultAvailability = (
  userId: string,
  systemSettings?: SystemSettings
): LecturerAvailability => {
  const startTime = systemSettings?.daySchedule?.startHour || '08:00';
  const endTime = systemSettings?.daySchedule?.endHour || '18:00';

  return {
    userId,
    maxSwsPerDay: 8,
    availableSlots: DEFAULT_PLANNED_WEEKDAYS.map(day => ({
      day,
      startTime,
      endTime,
    })),
    unavailableSlots: [],
  };
};

export const getAvailabilityForUser = (
  userId: string,
  availabilities: LecturerAvailability[],
  systemSettings?: SystemSettings
): LecturerAvailability => {
  return availabilities.find(availability => availability.userId === userId)
    || createDefaultAvailability(userId, systemSettings);
};

const getModuleByInstanceId = (modules: Module[], id: string): Module | undefined => {
  const directMatch = modules.find(module => module.id === id);
  if (directMatch) return directMatch;

  return modules.find(module => module.type === 'Pool' && id.startsWith(`${module.id}-`));
};

const getCanonicalModule = (modules: Module[], module: Module): Module => {
  if (!module.equivalentTo) return module;
  return modules.find(candidate => candidate.id === module.equivalentTo) || module;
};

const findUserByName = (users: User[], name?: string): User | undefined => {
  if (!name) return undefined;
  const normalizedName = name.trim().toLowerCase();
  return users.find(user => user.name.trim().toLowerCase() === normalizedName);
};

const roomFitsModule = (room: Room, module: Module, participants: number): boolean => {
  if ((room.capacity || 0) < participants) return false;

  const requirements = module.requirements;
  if (!requirements) return true;

  if (requirements.beamer && !room.equipment?.beamer) return false;
  if (requirements.lecturerPc && !room.equipment?.lecturerPc) return false;
  if (requirements.macRoom && !room.equipment?.macRoom) return false;
  if (requirements.pcLab && !room.equipment?.pcLab) return false;

  return true;
};

export const getScheduledDurationMinutes = (sws: number, systemSettings?: SystemSettings): number => {
  const swsDuration = systemSettings?.calculationFactors?.swsDurationMinutes || 45;
  const teachingMinutes = Math.max(45, Math.ceil((sws || 1) * swsDuration));
  const breakDuration = Math.max(0, systemSettings?.daySchedule?.eventBreakDurationMinutes || 0);
  const breakInterval = Math.max(0, systemSettings?.daySchedule?.eventBreakIntervalMinutes || 0);

  if (breakDuration === 0 || breakInterval === 0) return teachingMinutes;

  const internalBreakCount = Math.floor((teachingMinutes - 1) / breakInterval);
  return teachingMinutes + internalBreakCount * breakDuration;
};

const getDurationMinutes = (module: Module, systemSettings?: SystemSettings): number => {
  return getScheduledDurationMinutes(module.sws || 1, systemSettings);
};

const getDayBounds = (systemSettings?: SystemSettings) => ({
  start: systemSettings?.daySchedule?.startHour || '08:00',
  end: systemSettings?.daySchedule?.endHour || '18:00',
});

const getMondayForDate = (date: Date): Date => {
  const monday = new Date(date);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  return monday;
};

export const getDefaultScheduleWeekStart = (semester: AbsoluteSemester): string => {
  const lectureStart = (semester as Partial<SemesterPeriod>).lecturesStart;
  const startDate = lectureStart ? new Date(`${lectureStart}T00:00:00`) : new Date();
  return formatLocalDate(getMondayForDate(startDate));
};

export const getScheduleWeekDates = (
  semester: AbsoluteSemester,
  weekStartDate?: string
): Record<Weekday, string> => {
  const startDate = weekStartDate
    ? new Date(`${weekStartDate}T00:00:00`)
    : new Date(`${getDefaultScheduleWeekStart(semester)}T00:00:00`);
  const weekMonday = getMondayForDate(startDate);

  return WEEKDAYS.reduce((dates, weekday) => {
    const date = new Date(weekMonday);
    const offset = weekday.jsDay === 0 ? 6 : weekday.jsDay - 1;
    date.setDate(date.getDate() + offset);
    dates[weekday.id] = formatLocalDate(date);
    return dates;
  }, {} as Record<Weekday, string>);
};

export const getScheduleWeekRange = (
  semester: AbsoluteSemester,
  weekStartDate?: string
): { weekStartDate: string; weekEndDate: string; weekDates: Record<Weekday, string> } => {
  const weekDates = getScheduleWeekDates(semester, weekStartDate);
  return {
    weekStartDate: weekDates.monday,
    weekEndDate: weekDates.sunday,
    weekDates,
  };
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const isDateInRange = (date: string, start?: string, end?: string): boolean => {
  if (!start || !end) return false;
  return date >= start && date <= end;
};

export const getSemesterScheduleRange = (
  semester: AbsoluteSemester
): {
  semesterStartDate: string;
  semesterEndDate: string;
  weekStartDate: string;
  weekEndDate: string;
  teachingDatesByDay: Record<Weekday, string[]>;
  teachingWeeks: number;
} => {
  const semesterPeriod = semester as Partial<SemesterPeriod>;
  const semesterStartDate = semesterPeriod.lecturesStart || getDefaultScheduleWeekStart(semester);
  const semesterEndDate = semesterPeriod.lecturesEnd || getScheduleWeekRange(semester).weekEndDate;
  const firstWeek = getScheduleWeekRange(semester, semesterStartDate);
  const lastWeek = getScheduleWeekRange(semester, semesterEndDate);
  const teachingDatesByDay = WEEKDAYS.reduce((acc, day) => {
    acc[day.id] = [];
    return acc;
  }, {} as Record<Weekday, string[]>);
  const teachingWeekStarts = new Set<string>();

  for (
    let cursor = new Date(`${semesterStartDate}T00:00:00`);
    formatLocalDate(cursor) <= semesterEndDate;
    cursor = addDays(cursor, 1)
  ) {
    const date = formatLocalDate(cursor);
    if (isDateInRange(date, semesterPeriod.lectureBreakStart, semesterPeriod.lectureBreakEnd)) {
      continue;
    }

    const weekday = WEEKDAYS.find(day => day.jsDay === cursor.getDay());
    if (!weekday) continue;

    teachingDatesByDay[weekday.id].push(date);
    teachingWeekStarts.add(getScheduleWeekRange(semester, date).weekStartDate);
  }

  return {
    semesterStartDate,
    semesterEndDate,
    weekStartDate: firstWeek.weekStartDate,
    weekEndDate: lastWeek.weekEndDate,
    teachingDatesByDay,
    teachingWeeks: teachingWeekStarts.size,
  };
};

const roomBlockedOn = (
  room: Room,
  date: string,
  startTime: string,
  endTime: string
): boolean => {
  return (room.blockedPeriods || []).some(block => {
    if (!block.start || !block.end) return false;
    const blockStartDate = block.start.slice(0, 10);
    const blockEndDate = block.end.slice(0, 10);
    if (date < blockStartDate || date > blockEndDate) return false;

    const blockStartTime = block.start.slice(11, 16) || '00:00';
    const blockEndTime = block.end.slice(11, 16) || '23:59';
    return rangesOverlap(startTime, endTime, blockStartTime, blockEndTime);
  });
};

const existingRoomAssignmentConflict = (
  room: Room,
  date: string,
  startTime: string,
  endTime: string,
  roomAssignments: RoomAssignment[],
  systemSettings?: SystemSettings
): boolean => {
  return roomAssignments.some(assignment => {
    if (assignment.id.startsWith(GENERATED_ASSIGNMENT_PREFIX)) return false;
    return assignment.roomId === room.id
      && assignment.date === date
      && rangesOverlapWithStandardPause(startTime, endTime, assignment.startTime, assignment.endTime, systemSettings);
  });
};

const lecturerAvailable = (
  user: User | undefined,
  day: Weekday,
  startTime: string,
  endTime: string,
  availabilities: LecturerAvailability[],
  systemSettings?: SystemSettings
): boolean => {
  if (!user) return true;

  const availability = getAvailabilityForUser(user.id, availabilities, systemSettings);
  const insideAvailability = availability.availableSlots.some(slot => slotContains(slot, day, startTime, endTime));
  const blocked = (availability.unavailableSlots || []).some(slot => slotOverlaps(slot, day, startTime, endTime));

  return insideAvailability && !blocked;
};

const hasScheduledConflict = (
  entries: ScheduledClass[],
  offering: Offering,
  candidate: Candidate,
  systemSettings?: SystemSettings
): boolean => {
  return entries.some(entry => {
    if (
      entry.day !== candidate.day
      || !rangesOverlapWithStandardPause(entry.startTime, entry.endTime, candidate.startTime, candidate.endTime, systemSettings)
    ) {
      return false;
    }

    if (entry.roomId === candidate.room.id) return true;

    if (candidate.lecturer && entry.lecturerUserId === candidate.lecturer.id) return true;

    return entry.cohortIds.some(cohortId => offering.cohortIds.includes(cohortId));
  });
};

const getLecturerDailySws = (
  entries: ScheduledClass[],
  lecturer: User | undefined,
  day: Weekday
): number => {
  if (!lecturer) return 0;
  return entries
    .filter(entry => entry.lecturerUserId === lecturer.id && entry.day === day)
    .reduce((sum, entry) => sum + entry.sws, 0);
};

const collectOfferings = (input: ScheduleOptimizerInput): Offering[] => {
  const teachingUsers = getTeachingUsers(input.users);
  const offerings = new Map<string, Offering>();

  input.cohorts.forEach(cohort => {
    const relativeIndex = getRelativeSemesterIndex(input.semesters, cohort.startSemester, input.selectedSemester);
    if (relativeIndex < 0 || relativeIndex >= cohort.semesters) return;

    const relativeSemester = RELATIVE_SEMESTERS[relativeIndex];
    const instanceIds = cohort.plan.semesters[relativeSemester.id] || [];

    instanceIds.forEach(instanceId => {
      const moduleForInstance = getModuleByInstanceId(input.modules, instanceId);
      if (!moduleForInstance) return;

      const canonicalModule = getCanonicalModule(input.modules, moduleForInstance);
      const key = `${input.selectedSemester.id}:${canonicalModule.id}`;
      const fixedLecturer = findUserByName(input.users, canonicalModule.personInCharge || moduleForInstance.personInCharge);
      const fixedLecturerName = canonicalModule.personInCharge || moduleForInstance.personInCharge;

      if (!offerings.has(key)) {
        const eligibleRooms = input.rooms
          .filter(room => roomFitsModule(room, canonicalModule, 0))
          .sort((a, b) => (a.capacity || 0) - (b.capacity || 0));

        const warnings: string[] = [];
        if (fixedLecturerName && !fixedLecturer) {
          warnings.push(`Dozent "${fixedLecturerName}" ist keinem Nutzerkonto zugeordnet.`);
        }

        offerings.set(key, {
          id: key,
          semesterId: input.selectedSemester.id,
          module: canonicalModule,
          moduleInstanceIds: [],
          cohortIds: [],
          cohortNames: [],
          participants: 0,
          fixedLecturer,
          fixedLecturerName,
          warnings,
          eligibleRooms,
          candidateLecturers: fixedLecturer ? [fixedLecturer] : teachingUsers,
        });
      }

      const offering = offerings.get(key)!;
      offering.moduleInstanceIds.push(instanceId);

      if (!offering.cohortIds.includes(cohort.id)) {
        offering.cohortIds.push(cohort.id);
        offering.cohortNames.push(cohort.shortName || cohort.name);
        offering.participants += cohort.studentCount || 0;
      }
    });
  });

  return Array.from(offerings.values()).map(offering => ({
    ...offering,
    eligibleRooms: offering.eligibleRooms.filter(room => roomFitsModule(room, offering.module, offering.participants)),
  }));
};

const getBestCandidate = (
  offering: Offering,
  entries: ScheduledClass[],
  input: ScheduleOptimizerInput,
  teachingDatesByDay: Record<Weekday, string[]>
): Candidate | null => {
  if (offering.eligibleRooms.length === 0) return null;

  const duration = getDurationMinutes(offering.module, input.systemSettings);
  const dayBounds = getDayBounds(input.systemSettings);
  const dayStart = timeToMinutes(dayBounds.start);
  const dayEnd = timeToMinutes(dayBounds.end);
  const lecturerCandidates = offering.candidateLecturers.length > 0 ? offering.candidateLecturers : [undefined];
  const plannedWeekdays = getPlannedWeekdays(input.systemSettings);
  const candidates: Candidate[] = [];

  for (const day of WEEKDAYS) {
    if (!plannedWeekdays.includes(day.id)) continue;

    const occurrenceDates = teachingDatesByDay[day.id] || [];
    if (occurrenceDates.length === 0) continue;

    for (let start = dayStart; start + duration <= dayEnd; start += SLOT_STEP_MINUTES) {
      const startTime = minutesToTime(start);
      const endTime = minutesToTime(start + duration);
      if (overlapsLunchBreak(startTime, endTime, input.systemSettings)) continue;

      for (const room of offering.eligibleRooms) {
        const roomUnavailable = occurrenceDates.some(date =>
          roomBlockedOn(room, date, startTime, endTime)
          || existingRoomAssignmentConflict(room, date, startTime, endTime, input.roomAssignments, input.systemSettings)
        );
        if (roomUnavailable) continue;

        for (const lecturer of lecturerCandidates) {
          if (!lecturerAvailable(lecturer, day.id, startTime, endTime, input.lecturerAvailabilities, input.systemSettings)) continue;

          const availability = lecturer
            ? getAvailabilityForUser(lecturer.id, input.lecturerAvailabilities, input.systemSettings)
            : undefined;
          const dailySws = getLecturerDailySws(entries, lecturer, day.id);
          const maxSws = availability?.maxSwsPerDay || 99;
          if (dailySws + offering.module.sws > maxSws) continue;

          const candidate: Candidate = {
            room,
            lecturer,
            day: day.id,
            occurrenceDates,
            startTime,
            endTime,
            score: 0,
          };

          if (hasScheduledConflict(entries, offering, candidate, input.systemSettings)) continue;

          const capacityWaste = Math.max(0, (room.capacity || 0) - offering.participants);
          const dayPenalty = day.id === 'friday' ? 18 : day.id === 'monday' ? 4 : 0;
          const latePenalty = start >= 16 * 60 ? 18 : start >= 14 * 60 ? 8 : 0;
          const loadPenalty = dailySws * 5;
          const roomFitPenalty = capacityWaste * 0.4;
          const lecturerFlexPenalty = offering.fixedLecturer ? 0 : 3;

          candidate.score = roomFitPenalty + dayPenalty + latePenalty + loadPenalty + lecturerFlexPenalty;
          candidates.push(candidate);
        }
      }
    }
  }

  return candidates.sort((a, b) => a.score - b.score)[0] || null;
};

const sortOfferingsByDifficulty = (offerings: Offering[], systemSettings?: SystemSettings): Offering[] => {
  return [...offerings].sort((a, b) => {
    const roomDelta = a.eligibleRooms.length - b.eligibleRooms.length;
    if (roomDelta !== 0) return roomDelta;

    const lecturerDelta = (a.candidateLecturers.length || 99) - (b.candidateLecturers.length || 99);
    if (lecturerDelta !== 0) return lecturerDelta;

    const durationDelta = getDurationMinutes(b.module, systemSettings) - getDurationMinutes(a.module, systemSettings);
    if (durationDelta !== 0) return durationDelta;

    return b.participants - a.participants;
  });
};

export const generateOptimalSchedule = (input: ScheduleOptimizerInput): ScheduleOptimizerOutput => {
  const offerings = sortOfferingsByDifficulty(collectOfferings(input), input.systemSettings);
  const semesterRange = getSemesterScheduleRange(input.selectedSemester);
  const entries: ScheduledClass[] = [];
  const unscheduled: ScheduleIssue[] = [];

  offerings.forEach(offering => {
    const candidate = getBestCandidate(offering, entries, input, semesterRange.teachingDatesByDay);

    if (!candidate) {
      const reason = offering.eligibleRooms.length === 0
        ? 'Kein Raum erfuellt Kapazitaet und Raumanforderungen.'
        : 'Kein konfliktfreier Slot mit passendem Raum und verfuegbarem Dozenten gefunden.';

      unscheduled.push({
        id: `issue-${offering.id}`,
        moduleId: offering.module.id,
        moduleName: offering.module.name,
        cohortIds: offering.cohortIds,
        cohortNames: offering.cohortNames,
        reason,
      });
      return;
    }

    const lecturerName = candidate.lecturer?.name
      || offering.fixedLecturerName
      || 'N.N.';

    entries.push({
      id: `class-${offering.id}`,
      semesterId: input.selectedSemester.id,
      moduleId: offering.module.id,
      moduleName: offering.module.name,
      moduleInstanceIds: offering.moduleInstanceIds,
      cohortIds: offering.cohortIds,
      cohortNames: offering.cohortNames,
      lecturerUserId: candidate.lecturer?.id,
      lecturerName,
      roomId: candidate.room.id,
      roomName: candidate.room.name,
      day: candidate.day,
      date: candidate.occurrenceDates[0],
      occurrenceDates: candidate.occurrenceDates,
      startTime: candidate.startTime,
      endTime: candidate.endTime,
      sws: offering.module.sws,
      participants: offering.participants,
      score: Math.round(candidate.score * 10) / 10,
      warnings: offering.warnings,
    });
  });

  const plan: SchedulePlan = {
    semesterId: input.selectedSemester.id,
    planningMode: 'semester',
    status: 'planning',
    semesterStartDate: semesterRange.semesterStartDate,
    semesterEndDate: semesterRange.semesterEndDate,
    weekStartDate: semesterRange.weekStartDate,
    weekEndDate: semesterRange.weekEndDate,
    generatedAt: new Date().toISOString(),
    entries: entries.sort((a, b) => {
      const dayDelta = WEEKDAYS.findIndex(day => day.id === a.day) - WEEKDAYS.findIndex(day => day.id === b.day);
      if (dayDelta !== 0) return dayDelta;
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    }),
    unscheduled,
    adjustmentLog: [],
    summary: {
      totalOfferings: offerings.length,
      scheduledOfferings: entries.length,
      unscheduledOfferings: unscheduled.length,
      totalSws: entries.reduce((sum, entry) => sum + entry.sws, 0),
      plannedRoomAssignments: entries.reduce((sum, entry) => sum + entry.occurrenceDates.length, 0),
      teachingWeeks: semesterRange.teachingWeeks,
    },
  };

  return {
    plan,
    roomAssignments: buildRoomAssignmentsFromSchedule(plan, input.roomAssignments),
  };
};

export const buildRoomAssignmentsFromSchedule = (
  plan: SchedulePlan,
  existingAssignments: RoomAssignment[]
): RoomAssignment[] => {
  const semesterPrefix = `${GENERATED_ASSIGNMENT_PREFIX}${plan.semesterId}-`;
  const preservedAssignments = existingAssignments.filter(assignment => !assignment.id.startsWith(semesterPrefix));

  const generatedAssignments: RoomAssignment[] = plan.entries.flatMap(entry =>
    getEffectiveOccurrences(entry).map(occurrence => ({
      id: `${semesterPrefix}${occurrence.originalDate}-${entry.id}`,
      roomId: occurrence.roomId,
      date: occurrence.date,
      startTime: occurrence.startTime,
      endTime: occurrence.endTime,
      title: occurrence.title || `${entry.moduleName} (${entry.cohortNames.join(', ')})`,
      person: occurrence.lecturerName,
      purpose: occurrence.purpose || `Generierter Semesterplan ${plan.semesterId}`,
      moduleId: entry.moduleId,
      cohortId: entry.cohortIds.join(','),
      color: occurrence.color || `hsl(${Math.abs(hashCode(entry.moduleId)) % 360}, 65%, 44%)`,
      lockKind: occurrence.lockKind,
    }))
  );

  return [...preservedAssignments, ...generatedAssignments];
};

export type ScheduleAssignmentReconciliationInput = {
  plan: SchedulePlan | null;
  previousAssignments: RoomAssignment[];
  nextAssignments: RoomAssignment[];
  rooms: Room[];
};

export type ScheduleAssignmentReconciliationOutput = {
  plan: SchedulePlan | null;
  roomAssignments: RoomAssignment[];
  changed: boolean;
};

const getPlanStatus = (plan: SchedulePlan): SchedulePlan['status'] => {
  return plan.status === 'locked' ? 'locked' : 'planning';
};

const getGeneratedSemesterPrefix = (plan: SchedulePlan): string => {
  return `${GENERATED_ASSIGNMENT_PREFIX}${plan.semesterId}-`;
};

const getWeekStartForDate = (date: string): string => {
  return formatLocalDate(getMondayForDate(parseLocalDate(date)));
};

const getWeekEndForDate = (date: string): string => {
  return formatLocalDate(addDays(getMondayForDate(parseLocalDate(date)), 6));
};

const nextWeekdayAfter = (date: string, weekday: Weekday): string => {
  const targetDay = WEEKDAYS.find(day => day.id === weekday)?.jsDay || 1;
  const candidate = addDays(parseLocalDate(date), 1);

  while (candidate.getDay() !== targetDay) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return formatLocalDate(candidate);
};

const getLatestPlanOccurrenceDate = (plan: SchedulePlan): string => {
  return plan.entries
    .flatMap(entry => getEffectiveOccurrences(entry).map(occurrence => occurrence.date))
    .reduce((latest, date) => date > latest ? date : latest, plan.semesterEndDate);
};

const finalizeSchedulePlan = (plan: SchedulePlan): SchedulePlan => {
  const occurrenceDates = plan.entries.flatMap(entry => getEffectiveOccurrences(entry).map(occurrence => occurrence.date));
  const teachingWeeks = new Set(occurrenceDates.map(getWeekStartForDate)).size;
  const effectiveEndDate = getLatestPlanOccurrenceDate(plan);

  return {
    ...plan,
    status: getPlanStatus(plan),
    semesterEndDate: effectiveEndDate,
    weekEndDate: getWeekEndForDate(effectiveEndDate),
    summary: {
      ...plan.summary,
      plannedRoomAssignments: occurrenceDates.length,
      teachingWeeks: teachingWeeks || plan.summary.teachingWeeks,
    },
  };
};

const createScheduleAdjustment = (
  type: ScheduleAdjustment['type'],
  values: Omit<ScheduleAdjustment, 'id' | 'type' | 'createdAt'>
): ScheduleAdjustment => ({
  id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  createdAt: new Date().toISOString(),
  ...values,
});

const findEntryForAssignment = (
  plan: SchedulePlan,
  assignment: RoomAssignment
): ScheduledClass | undefined => {
  return plan.entries.find(entry => {
    const generatedIdSuffix = `-${entry.id}`;
    if (assignment.id.endsWith(generatedIdSuffix)) return true;

    return entry.moduleId === assignment.moduleId
      && entry.roomId === assignment.roomId
      && entry.startTime === assignment.startTime
      && entry.endTime === assignment.endTime
      && getEntryOccurrenceDates(entry).includes(assignment.date);
  });
};

const getOriginalDateFromGeneratedAssignment = (
  plan: SchedulePlan,
  assignment: RoomAssignment
): string => {
  const semesterPrefix = getGeneratedSemesterPrefix(plan);
  if (assignment.id.startsWith(semesterPrefix)) {
    return assignment.id.slice(semesterPrefix.length, semesterPrefix.length + 10);
  }

  return assignment.date;
};

const generatedAssignmentChanged = (
  previousAssignment: RoomAssignment,
  nextAssignment: RoomAssignment
): boolean => {
  return previousAssignment.roomId !== nextAssignment.roomId
    || previousAssignment.date !== nextAssignment.date
    || previousAssignment.startTime !== nextAssignment.startTime
    || previousAssignment.endTime !== nextAssignment.endTime
    || previousAssignment.title !== nextAssignment.title
    || previousAssignment.person !== nextAssignment.person
    || previousAssignment.purpose !== nextAssignment.purpose
    || previousAssignment.color !== nextAssignment.color
    || previousAssignment.lockKind !== nextAssignment.lockKind;
};

const withOccurrenceOverride = (
  entry: ScheduledClass,
  originalDate: string,
  override: ScheduledClassOccurrenceOverride | null
): ScheduledClass => {
  const otherOverrides = getOccurrenceOverrides(entry).filter(item => item.originalDate !== originalDate);

  return {
    ...entry,
    occurrenceOverrides: override ? [...otherOverrides, override].sort((a, b) => a.originalDate.localeCompare(b.originalDate)) : otherOverrides,
  };
};

const candidateConflictsWithPlan = (
  plan: SchedulePlan,
  entry: ScheduledClass,
  date: string
): boolean => {
  return plan.entries.some(otherEntry => {
    if (otherEntry.id === entry.id) return false;
    return getEffectiveOccurrences(otherEntry).some(occurrence => {
      if (occurrence.date !== date) return false;
      if (!rangesOverlap(entry.startTime, entry.endTime, occurrence.startTime, occurrence.endTime)) return false;

      if (occurrence.roomId === entry.roomId) return true;
      if (entry.lecturerUserId && otherEntry.lecturerUserId === entry.lecturerUserId) return true;

      return otherEntry.cohortIds.some(cohortId => entry.cohortIds.includes(cohortId));
    });
  });
};

const findReplacementDate = (
  plan: SchedulePlan,
  entry: ScheduledClass,
  room: Room | undefined,
  nextAssignments: RoomAssignment[]
): string | null => {
  if (!room) return null;

  const latestDate = [
    plan.semesterEndDate,
    ...getEffectiveOccurrences(entry).map(occurrence => occurrence.date),
  ].filter(Boolean).sort().at(-1);
  if (!latestDate) return null;

  let candidate = nextWeekdayAfter(latestDate, entry.day);
  for (let attempt = 0; attempt < 52; attempt += 1) {
    const roomBlocked = roomBlockedOn(room, candidate, entry.startTime, entry.endTime)
      || existingRoomAssignmentConflict(room, candidate, entry.startTime, entry.endTime, nextAssignments);
    const planConflict = candidateConflictsWithPlan(plan, entry, candidate);

    if (!roomBlocked && !planConflict) {
      return candidate;
    }

    const nextCandidate = parseLocalDate(candidate);
    nextCandidate.setDate(nextCandidate.getDate() + 7);
    candidate = formatLocalDate(nextCandidate);
  }

  return null;
};

const replaceScheduleEntry = (
  plan: SchedulePlan,
  entry: ScheduledClass
): SchedulePlan => ({
  ...plan,
  entries: plan.entries.map(candidate => candidate.id === entry.id ? entry : candidate),
});

export const reconcileScheduleAfterAssignmentChange = ({
  plan,
  previousAssignments,
  nextAssignments,
  rooms,
}: ScheduleAssignmentReconciliationInput): ScheduleAssignmentReconciliationOutput => {
  if (!plan) {
    return { plan, roomAssignments: nextAssignments, changed: false };
  }

  const semesterPrefix = getGeneratedSemesterPrefix(plan);
  const nextAssignmentById = new Map(nextAssignments.map(assignment => [assignment.id, assignment]));
  const nextAssignmentIds = new Set(nextAssignments.map(assignment => assignment.id));
  const previousGeneratedAssignments = previousAssignments.filter(assignment =>
    assignment.id.startsWith(semesterPrefix)
  );
  const removedGeneratedAssignments = previousGeneratedAssignments.filter(assignment =>
    assignment.id.startsWith(semesterPrefix) && !nextAssignmentIds.has(assignment.id)
  );
  const changedGeneratedAssignments = previousGeneratedAssignments
    .map(previousAssignment => {
      const nextAssignment = nextAssignmentById.get(previousAssignment.id);
      return nextAssignment && generatedAssignmentChanged(previousAssignment, nextAssignment)
        ? { previousAssignment, nextAssignment }
        : null;
    })
    .filter((item): item is { previousAssignment: RoomAssignment; nextAssignment: RoomAssignment } => Boolean(item));

  if (removedGeneratedAssignments.length === 0 && changedGeneratedAssignments.length === 0) {
    return { plan, roomAssignments: nextAssignments, changed: false };
  }

  const roomById = new Map(rooms.map(room => [room.id, room]));
  let updatedPlan: SchedulePlan = {
    ...plan,
    status: getPlanStatus(plan),
    entries: plan.entries.map(entry => ({
      ...entry,
      occurrenceDates: getEntryOccurrenceDates(entry),
      occurrenceOverrides: getOccurrenceOverrides(entry),
      warnings: [...entry.warnings],
    })),
    adjustmentLog: [...(plan.adjustmentLog || [])],
  };
  let changed = false;

  changedGeneratedAssignments.forEach(({ previousAssignment, nextAssignment }) => {
    const entry = findEntryForAssignment(updatedPlan, previousAssignment);
    if (!entry) return;

    const originalDate = getOriginalDateFromGeneratedAssignment(updatedPlan, previousAssignment);
    if (!getEntryOccurrenceDates(entry).includes(originalDate)) return;

    const room = roomById.get(nextAssignment.roomId);
    const currentOverride = getOccurrenceOverrides(entry).find(item => item.originalDate === originalDate);
    const nextEntry = withOccurrenceOverride(entry, originalDate, {
      originalDate,
      date: nextAssignment.date,
      roomId: nextAssignment.roomId,
      roomName: room?.name || nextAssignment.roomId,
      startTime: nextAssignment.startTime,
      endTime: nextAssignment.endTime,
      lecturerName: nextAssignment.person || entry.lecturerName,
      title: nextAssignment.title,
      purpose: nextAssignment.purpose,
      color: nextAssignment.color,
      lockKind: nextAssignment.lockKind || currentOverride?.lockKind || 'hard',
    });

    updatedPlan = {
      ...replaceScheduleEntry(updatedPlan, nextEntry),
      adjustmentLog: [
        ...(updatedPlan.adjustmentLog || []),
        createScheduleAdjustment('manual-change', {
          classId: entry.id,
          moduleId: entry.moduleId,
          fromDate: originalDate,
          toDate: nextAssignment.date,
          note: getPlanStatus(updatedPlan) === 'planning'
            ? 'Einzeltermin in der Planungsphase manuell verschoben oder geaendert.'
            : 'Einzeltermin im gelockten Plan manuell geaendert.',
        }),
      ],
    };
    changed = true;
  });

  removedGeneratedAssignments.forEach(assignment => {
    const entry = findEntryForAssignment(updatedPlan, assignment);
    if (!entry) return;

    const originalDate = getOriginalDateFromGeneratedAssignment(updatedPlan, assignment);
    const occurrenceDates = getEntryOccurrenceDates(entry);
    if (!occurrenceDates.includes(originalDate)) return;

    const remainingDates = occurrenceDates.filter(date => date !== originalDate);
    let nextEntry: ScheduledClass = {
      ...withOccurrenceOverride(entry, originalDate, null),
      occurrenceDates: remainingDates,
      date: remainingDates[0] || entry.date,
    };
    const adjustments: ScheduleAdjustment[] = [
      createScheduleAdjustment(getPlanStatus(updatedPlan) === 'planning' ? 'deleted-occurrence' : 'manual-change', {
        classId: entry.id,
        moduleId: entry.moduleId,
        fromDate: originalDate,
        note: getPlanStatus(updatedPlan) === 'planning'
          ? 'Einzeltermin in der Planungsphase entfernt.'
          : 'Einzeltermin im gelockten Plan manuell entfernt.',
      }),
    ];

    updatedPlan = replaceScheduleEntry(updatedPlan, nextEntry);
    changed = true;

    if (getPlanStatus(updatedPlan) === 'planning') {
      const replacementDate = findReplacementDate(
        updatedPlan,
        nextEntry,
        roomById.get(nextEntry.roomId),
        nextAssignments
      );

      if (replacementDate) {
        const extendedDates = [...remainingDates, replacementDate].sort();
        nextEntry = {
          ...nextEntry,
          occurrenceDates: extendedDates,
          date: extendedDates[0] || nextEntry.date,
        };
        updatedPlan = replaceScheduleEntry(updatedPlan, nextEntry);
        adjustments.push(createScheduleAdjustment('replacement-added', {
          classId: entry.id,
          moduleId: entry.moduleId,
          fromDate: originalDate,
          toDate: replacementDate,
          note: 'Automatischer Ersatztermin nach dem bisherigen Planende.',
        }));
      } else {
        nextEntry = {
          ...nextEntry,
          warnings: Array.from(new Set([
            ...nextEntry.warnings,
            'Kein konfliktfreier Ersatztermin fuer einen geloeschten Einzeltermin gefunden.',
          ])),
        };
        updatedPlan = replaceScheduleEntry(updatedPlan, nextEntry);
        adjustments.push(createScheduleAdjustment('manual-change', {
          classId: entry.id,
          moduleId: entry.moduleId,
          fromDate: originalDate,
          note: 'Kein konfliktfreier Ersatztermin gefunden.',
        }));
      }
    }

    updatedPlan = {
      ...updatedPlan,
      adjustmentLog: [...(updatedPlan.adjustmentLog || []), ...adjustments],
    };
  });

  if (!changed) {
    return { plan, roomAssignments: nextAssignments, changed: false };
  }

  const finalizedPlan = finalizeSchedulePlan(updatedPlan);

  return {
    plan: finalizedPlan,
    roomAssignments: buildRoomAssignmentsFromSchedule(finalizedPlan, nextAssignments),
    changed: true,
  };
};

const hashCode = (value: string): number => {
  return value.split('').reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0);
};
