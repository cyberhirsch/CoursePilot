'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type {
  AbsoluteSemester,
  Cohort,
  LecturerAvailability,
  Module,
  Room,
  RoomAssignment,
  SchedulePlan,
  SystemSettings,
  User,
  Weekday,
} from '@/types';
import { buildRoomAssignmentsFromSchedule, generateOptimalSchedule, getDefaultScheduleWeekStart, getScheduleWeekRange, getScheduledDurationMinutes, getSemesterScheduleRange, WEEKDAYS } from '@/lib/schedule-optimizer';
import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, DoorOpen, Download, Lock, Pencil, Save, Sparkles, Trash2, Unlock, UsersRound, X } from 'lucide-react';

interface SchedulePlannerProps {
  modules: Module[];
  cohorts: Cohort[];
  users: User[];
  rooms: Room[];
  selectedSemester: AbsoluteSemester;
  setSelectedSemester: (semester: AbsoluteSemester) => void;
  semesters: AbsoluteSemester[];
  lecturerAvailabilities: LecturerAvailability[];
  roomAssignments: RoomAssignment[];
  onUpdateRoomAssignments: (assignments: RoomAssignment[], options?: { reconcileSchedule?: boolean }) => void;
  schedulePlan: SchedulePlan | null;
  onUpdateSchedulePlan: (plan: SchedulePlan | null) => void;
  systemSettings?: SystemSettings;
  onUpdateSystemSettings?: (settings: SystemSettings) => void;
}

type ScheduleDisplayEntry = SchedulePlan['entries'][number] & {
  originalDate: string;
  assignmentId: string;
  displayLockKind: ScheduleLockKind;
  displayDate: string;
  displayStartTime: string;
  displayEndTime: string;
  displayRoomId: string;
  displayRoomName: string;
  displayLecturerName: string;
  displayTitle?: string;
  displayPurpose?: string;
  displayColor?: string;
};

type CalendarLayoutEntry = ScheduleDisplayEntry & {
  calendarColumn: number;
  calendarColumnCount: number;
};

type ScheduleIssueItem = SchedulePlan['unscheduled'][number];
type ScheduledEntry = SchedulePlan['entries'][number];
type ScheduledOccurrenceOverride = NonNullable<ScheduledEntry['occurrenceOverrides']>[number];
type ScheduleLockKind = 'soft' | 'hard';
type ScheduleEditDraft = RoomAssignment & { lockKind: ScheduleLockKind };

type IssuePlanningDraft = {
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  lecturerName: string;
  title: string;
  purpose: string;
};

type ScheduleFilterType = 'all' | 'lecturer' | 'cohort' | 'room';
type ScheduleExportFormat = 'csv' | 'ics' | 'json' | 'print';
type PendingConfirmationAction = 'clear-plan' | 'unlock-plan';
type DragNotice = { tone: 'success' | 'warning'; message: string };

const DEFAULT_PLANNED_WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export const SchedulePlanner: React.FC<SchedulePlannerProps> = ({
  modules,
  cohorts,
  users,
  rooms,
  selectedSemester,
  setSelectedSemester,
  semesters,
  lecturerAvailabilities,
  roomAssignments,
  onUpdateRoomAssignments,
  schedulePlan,
  onUpdateSchedulePlan,
  systemSettings,
  onUpdateSystemSettings,
}) => {
  const [previewWeekStartDate, setPreviewWeekStartDate] = useState(() => (
    selectedSemester ? getDefaultScheduleWeekStart(selectedSemester) : ''
  ));
  const [editingEntry, setEditingEntry] = useState<ScheduleDisplayEntry | null>(null);
  const [editDraft, setEditDraft] = useState<ScheduleEditDraft | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ScheduleIssueItem | null>(null);
  const [issueDraft, setIssueDraft] = useState<IssuePlanningDraft | null>(null);
  const [filterType, setFilterType] = useState<ScheduleFilterType>('all');
  const [filterValue, setFilterValue] = useState('');
  const [exportFormat, setExportFormat] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmationAction | null>(null);
  const [draggedAssignmentId, setDraggedAssignmentId] = useState<string | null>(null);
  const [dragOverAssignmentId, setDragOverAssignmentId] = useState<string | null>(null);
  const [dragNotice, setDragNotice] = useState<DragNotice | null>(null);

  useEffect(() => {
    if (!selectedSemester) return;
    setPreviewWeekStartDate(schedulePlan?.semesterId === selectedSemester.id && schedulePlan.weekStartDate
      ? schedulePlan.weekStartDate
      : getDefaultScheduleWeekStart(selectedSemester)
    );
  }, [selectedSemester?.id]);

  const weekRange = useMemo(() => {
    return selectedSemester
      ? getScheduleWeekRange(selectedSemester, previewWeekStartDate)
      : { weekStartDate: '', weekEndDate: '', weekDates: {} as Record<string, string> };
  }, [selectedSemester, previewWeekStartDate]);

  const semesterRange = useMemo(() => (
    selectedSemester ? getSemesterScheduleRange(selectedSemester) : null
  ), [selectedSemester]);

  const activePlan = schedulePlan?.semesterId === selectedSemester?.id ? schedulePlan : null;
  const planningSettings = {
    startHour: systemSettings?.daySchedule?.startHour || '08:00',
    endHour: systemSettings?.daySchedule?.endHour || '18:00',
    standardPauseMinutes: systemSettings?.daySchedule?.standardPauseMinutes ?? 15,
    eventBreakDurationMinutes: systemSettings?.daySchedule?.eventBreakDurationMinutes ?? 15,
    eventBreakIntervalMinutes: systemSettings?.daySchedule?.eventBreakIntervalMinutes ?? 90,
    plannedWeekdays: systemSettings?.daySchedule?.plannedWeekdays?.length
      ? systemSettings.daySchedule.plannedWeekdays
      : DEFAULT_PLANNED_WEEKDAYS,
    useLunchBreak: systemSettings?.daySchedule?.useLunchBreak ?? false,
    lunchBreakStart: systemSettings?.daySchedule?.lunchBreakStart || '12:00',
    lunchBreakEnd: systemSettings?.daySchedule?.lunchBreakEnd || '13:00',
  };
  const plannedWeekdayCount = planningSettings.plannedWeekdays.length;
  const teachingUsers = useMemo(() => (
    users
      .filter(user => ['professor', 'lecturer', 'admin', 'coordinator'].includes(user.role))
      .sort((a, b) => a.name.localeCompare(b.name))
  ), [users]);

  const getGeneratedAssignmentId = (entry: { semesterId: string; id: string }, originalDate: string) => {
    return `schedule-${entry.semesterId}-${originalDate}-${entry.id}`;
  };

  const semesterCalendar = selectedSemester as Partial<AbsoluteSemester> & {
    lecturesStart?: string;
    lecturesEnd?: string;
  };

  const allDisplayEntries = useMemo(() => {
    const entries: ScheduleDisplayEntry[] = [];

    activePlan?.entries.forEach(entry => {
      const occurrenceDates = Array.isArray(entry.occurrenceDates) ? entry.occurrenceDates : [entry.date];
      occurrenceDates.forEach(originalDate => {
        const override = entry.occurrenceOverrides?.find(item => item.originalDate === originalDate);
        const displayDate = override?.date || originalDate;

        entries.push({
          ...entry,
          originalDate,
          assignmentId: getGeneratedAssignmentId(entry, originalDate),
          displayLockKind: override?.lockKind || (override ? 'hard' : 'soft'),
          displayDate,
          displayStartTime: override?.startTime || entry.startTime,
          displayEndTime: override?.endTime || entry.endTime,
          displayRoomId: override?.roomId || entry.roomId,
          displayRoomName: override?.roomName || entry.roomName,
          displayLecturerName: override?.lecturerName || entry.lecturerName,
          displayTitle: override?.title,
          displayPurpose: override?.purpose,
          displayColor: override?.color,
        });
      });
    });

    return entries.sort((a, b) => {
      const dateDelta = a.displayDate.localeCompare(b.displayDate);
      if (dateDelta !== 0) return dateDelta;
      return a.displayStartTime.localeCompare(b.displayStartTime);
    });
  }, [activePlan]);

  const filteredDisplayEntries = useMemo(() => {
    return allDisplayEntries.filter(entry => {
      if (filterType === 'all' || !filterValue) return true;

      if (filterType === 'lecturer') {
        const lecturer = teachingUsers.find(user => user.id === filterValue);
        return entry.lecturerUserId === filterValue || entry.displayLecturerName === lecturer?.name;
      }

      if (filterType === 'cohort') {
        return entry.cohortIds.includes(filterValue);
      }

      if (filterType === 'room') {
        return entry.displayRoomId === filterValue;
      }

      return true;
    });
  }, [allDisplayEntries, filterType, filterValue, teachingUsers]);

  const entriesByDay = useMemo(() => {
    const map = new Map(WEEKDAYS.map(day => [day.id, [] as ScheduleDisplayEntry[]]));

    filteredDisplayEntries.forEach(entry => {
      const displayDay = WEEKDAYS.find(day => weekRange.weekDates[day.id] === entry.displayDate);
      if (!displayDay) return;
      map.get(displayDay.id)?.push(entry);
    });

    map.forEach(entries => entries.sort((a, b) => a.displayStartTime.localeCompare(b.displayStartTime)));
    return map;
  }, [filteredDisplayEntries, weekRange]);

  const filterOptions = useMemo(() => {
    if (filterType === 'lecturer') {
      return teachingUsers.map(user => ({ value: user.id, label: user.name }));
    }

    if (filterType === 'cohort') {
      return cohorts
        .map(cohort => ({ value: cohort.id, label: cohort.shortName || cohort.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    if (filterType === 'room') {
      return rooms
        .map(room => ({ value: room.id, label: `${room.id} - ${room.name}` }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    return [];
  }, [cohorts, filterType, rooms, teachingUsers]);

  const filterSummary = useMemo(() => {
    if (filterType === 'all' || !filterValue) return 'Gesamtplan';
    return filterOptions.find(option => option.value === filterValue)?.label || 'Gefiltert';
  }, [filterOptions, filterType, filterValue]);

  const filteredOfferingCount = useMemo(() => {
    return new Set(filteredDisplayEntries.map(entry => entry.id)).size;
  }, [filteredDisplayEntries]);

  const handleFilterTypeChange = (nextType: ScheduleFilterType) => {
    setFilterType(nextType);
    setFilterValue('');
  };

  const updateDaySchedule = (updates: Partial<SystemSettings['daySchedule']>) => {
    if (!systemSettings || !onUpdateSystemSettings) return;

    onUpdateSystemSettings({
      ...systemSettings,
      daySchedule: {
        ...systemSettings.daySchedule,
        ...updates,
      },
    });
  };

  const togglePlannedWeekday = (weekday: Weekday) => {
    const current = planningSettings.plannedWeekdays;
    const nextWeekdays = current.includes(weekday)
      ? current.filter(day => day !== weekday)
      : [...current, weekday].sort((a, b) =>
        WEEKDAYS.findIndex(day => day.id === a) - WEEKDAYS.findIndex(day => day.id === b)
      );

    if (nextWeekdays.length === 0) return;
    updateDaySchedule({ plannedWeekdays: nextWeekdays });
  };

  const runOptimizer = () => {
    if (!selectedSemester) return;

    setPendingConfirmation(null);
    setDragNotice(null);

    const result = generateOptimalSchedule({
      modules,
      cohorts,
      users,
      rooms,
      selectedSemester,
      semesters,
      lecturerAvailabilities,
      roomAssignments,
      systemSettings,
    });

    onUpdateSchedulePlan(result.plan);
    onUpdateRoomAssignments(result.roomAssignments, { reconcileSchedule: false });
  };

  const clearPlan = () => {
    if (!selectedSemester) return;
    const prefix = `schedule-${selectedSemester.id}-`;
    onUpdateSchedulePlan(null);
    onUpdateRoomAssignments(roomAssignments.filter(assignment => !assignment.id.startsWith(prefix)), { reconcileSchedule: false });
    setSelectedIssue(null);
    setIssueDraft(null);
    setEditingEntry(null);
    setEditDraft(null);
    setDragNotice(null);
  };

  const planStatus = activePlan?.status === 'locked' ? 'locked' : 'planning';
  const isPlanLocked = planStatus === 'locked';

  const applyPlanLockStatus = (nextStatus: SchedulePlan['status']) => {
    if (!activePlan) return;

    onUpdateSchedulePlan({
      ...activePlan,
      status: nextStatus,
      adjustmentLog: [
        ...(activePlan.adjustmentLog || []),
        {
          id: `adj-${Date.now()}`,
          type: 'manual-change',
          note: nextStatus === 'locked'
            ? 'Plan wurde gelockt.'
            : 'Plan wurde zur dynamischen Planungsphase zurueckgesetzt.',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setPendingConfirmation(null);
  };

  const requestPlanLockToggle = () => {
    if (!activePlan) return;

    if (isPlanLocked) {
      setPendingConfirmation('unlock-plan');
      setDragNotice(null);
      return;
    }

    applyPlanLockStatus('locked');
  };

  const requestClearPlan = () => {
    if (!activePlan) return;
    setPendingConfirmation('clear-plan');
    setDragNotice(null);
  };

  const cancelPendingConfirmation = () => {
    setPendingConfirmation(null);
  };

  const confirmPendingConfirmation = () => {
    if (pendingConfirmation === 'clear-plan') {
      clearPlan();
      setPendingConfirmation(null);
      return;
    }

    if (pendingConfirmation === 'unlock-plan') {
      applyPlanLockStatus('planning');
    }
  };

  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const moveWeek = (direction: -1 | 1) => {
    const current = new Date(`${weekRange.weekStartDate || previewWeekStartDate}T00:00:00`);
    current.setDate(current.getDate() + direction * 7);
    setPreviewWeekStartDate(toDateInputValue(current));
  };

  const handleDateChange = (date: string) => {
    if (!selectedSemester || !date) return;
    setPreviewWeekStartDate(getScheduleWeekRange(selectedSemester, date).weekStartDate);
  };

  const jumpToLectureStart = () => {
    if (!selectedSemester) return;
    setPreviewWeekStartDate(getDefaultScheduleWeekStart(selectedSemester));
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(`${date}T00:00:00`).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const timeToMinutes = (time: string) => {
    const [hour = '0', minute = '0'] = time.split(':');
    return Number(hour) * 60 + Number(minute);
  };

  const minutesToTime = (minutes: number) => {
    const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
    const minute = (minutes % 60).toString().padStart(2, '0');
    return `${hour}:${minute}`;
  };

  const getModuleForIssue = (issue: ScheduleIssueItem | null) => {
    if (!issue) return undefined;
    return modules.find(module => module.id === issue.moduleId);
  };

  const getIssueParticipants = (issue: ScheduleIssueItem) => {
    return issue.cohortIds.reduce((sum, cohortId) => {
      const cohort = cohorts.find(item => item.id === cohortId);
      return sum + (cohort?.studentCount || 0);
    }, 0);
  };

  const getIssueDurationMinutes = (issue: ScheduleIssueItem) => {
    const module = getModuleForIssue(issue);
    return getScheduledDurationMinutes(module?.sws || 1, systemSettings);
  };

  const rangesOverlap = (startA: string, endA: string, startB: string, endB: string) => {
    return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
  };

  const roomBlockedOn = (room: Room, date: string, startTime: string, endTime: string) => {
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

  const getWeekdayForDate = (date: string) => {
    const jsDay = new Date(`${date}T00:00:00`).getDay();
    return WEEKDAYS.find(day => day.jsDay === jsDay)?.id;
  };

  const rangesOverlapWithStandardPause = (startA: string, endA: string, startB: string, endB: string) => {
    const pauseMinutes = Math.max(0, planningSettings.standardPauseMinutes || 0);
    return timeToMinutes(startA) < timeToMinutes(endB) + pauseMinutes
      && timeToMinutes(startB) < timeToMinutes(endA) + pauseMinutes;
  };

  const assignmentOutsidePlanningRules = (assignment: RoomAssignment) => {
    const problems: string[] = [];
    const day = getWeekdayForDate(assignment.date);

    if (!day || !planningSettings.plannedWeekdays.includes(day)) {
      problems.push('Der Termin liegt nicht auf einem geplanten Wochentag.');
    }

    if (
      timeToMinutes(assignment.startTime) < timeToMinutes(planningSettings.startHour)
      || timeToMinutes(assignment.endTime) > timeToMinutes(planningSettings.endHour)
    ) {
      problems.push('Der Termin liegt ausserhalb des geplanten Tagesfensters.');
    }

    if (
      planningSettings.useLunchBreak
      && rangesOverlap(assignment.startTime, assignment.endTime, planningSettings.lunchBreakStart, planningSettings.lunchBreakEnd)
    ) {
      problems.push('Der Termin ueberschneidet sich mit der Mittagspause.');
    }

    return problems;
  };

  const lecturerAvailableForAssignment = (assignment: RoomAssignment) => {
    if (!assignment.person) return true;

    const lecturer = users.find(user => user.name === assignment.person);
    if (!lecturer) return true;

    const availability = lecturerAvailabilities.find(item => item.userId === lecturer.id);
    if (!availability) return true;

    const day = getWeekdayForDate(assignment.date);
    if (!day) return false;

    const insideAvailability = availability.availableSlots.some(slot =>
      slot.day === day
      && timeToMinutes(slot.startTime) <= timeToMinutes(assignment.startTime)
      && timeToMinutes(slot.endTime) >= timeToMinutes(assignment.endTime)
    );
    const blocked = (availability.unavailableSlots || []).some(slot =>
      slot.day === day
      && rangesOverlap(assignment.startTime, assignment.endTime, slot.startTime, slot.endTime)
    );

    return insideAvailability && !blocked;
  };

  const sameCohortConflict = (assignment: RoomAssignment, other: RoomAssignment) => {
    if (!assignment.cohortId || !other.cohortId) return false;
    const cohortIds = assignment.cohortId.split(',').map(item => item.trim()).filter(Boolean);
    const otherCohortIds = other.cohortId.split(',').map(item => item.trim()).filter(Boolean);
    return cohortIds.some(cohortId => otherCohortIds.includes(cohortId));
  };

  const roomFitsIssue = (room: Room | undefined, issue: ScheduleIssueItem) => {
    if (!room) return false;

    const module = getModuleForIssue(issue);
    const participants = getIssueParticipants(issue);
    if ((room.capacity || 0) < participants) return false;

    const requirements = module?.requirements;
    if (!requirements) return true;

    if (requirements.beamer && !room.equipment?.beamer) return false;
    if (requirements.lecturerPc && !room.equipment?.lecturerPc) return false;
    if (requirements.macRoom && !room.equipment?.macRoom) return false;
    if (requirements.pcLab && !room.equipment?.pcLab) return false;

    return true;
  };

  const getIssueOccurrenceDates = (issue: ScheduleIssueItem, draft: IssuePlanningDraft) => {
    if (!selectedSemester) return [draft.date];

    const day = getWeekdayForDate(draft.date);
    if (!day) return [draft.date];

    const range = getSemesterScheduleRange(selectedSemester);
    const occurrenceDates = range.teachingDatesByDay[day] || [];
    return occurrenceDates.length ? occurrenceDates : [draft.date];
  };

  const buildIssueAssignment = (
    issue: ScheduleIssueItem,
    draft: IssuePlanningDraft,
    date: string
  ): RoomAssignment => ({
    id: `schedule-${activePlan?.semesterId || selectedSemester?.id || 'semester'}-${date}-class-${activePlan?.semesterId || selectedSemester?.id}:${issue.moduleId}`,
    roomId: draft.roomId,
    date,
    startTime: draft.startTime,
    endTime: draft.endTime,
    title: draft.title,
    person: draft.lecturerName || 'N.N.',
    purpose: draft.purpose,
    moduleId: issue.moduleId,
    cohortId: issue.cohortIds.join(','),
    color: `hsl(${Math.abs(hashCode(issue.moduleId)) % 360}, 65%, 44%)`,
  });

  const getIssuePlacementProblems = (
    issue: ScheduleIssueItem,
    draft: IssuePlanningDraft,
    strict: boolean
  ) => {
    const problems: string[] = [];

    if (!draft.roomId || !draft.date || !draft.startTime || !draft.endTime || !draft.title.trim()) {
      problems.push('Raum, Datum, Uhrzeit und Titel muessen ausgefuellt sein.');
      return problems;
    }

    if (timeToMinutes(draft.startTime) >= timeToMinutes(draft.endTime)) {
      problems.push('Die Endzeit muss nach der Startzeit liegen.');
      return problems;
    }

    if (!strict) return problems;

    const room = rooms.find(item => item.id === draft.roomId);
    if (!roomFitsIssue(room, issue)) {
      problems.push('Der Raum erfuellt Kapazitaet oder technische Anforderungen nicht.');
    }

    const occurrenceDates = getIssueOccurrenceDates(issue, draft);
    occurrenceDates.forEach(date => {
      const assignment = buildIssueAssignment(issue, draft, date);

      assignmentOutsidePlanningRules(assignment).forEach(problem => {
        problems.push(`${formatDate(date)}: ${problem}`);
      });

      if (room && roomBlockedOn(room, date, draft.startTime, draft.endTime)) {
        problems.push(`${formatDate(date)}: Der Raum ist gesperrt.`);
      }

      const conflict = roomAssignments.find(item =>
        item.id !== assignment.id
        && item.date === date
        && rangesOverlapWithStandardPause(assignment.startTime, assignment.endTime, item.startTime, item.endTime)
        && (
          item.roomId === assignment.roomId
          || (!!assignment.person && assignment.person !== 'N.N.' && item.person === assignment.person)
          || sameCohortConflict(assignment, item)
        )
      );

      if (conflict && conflict.roomId === assignment.roomId) {
        problems.push(`${formatDate(date)}: Raumkonflikt mit ${conflict.title}.`);
      } else if (conflict && conflict.person === assignment.person) {
        problems.push(`${formatDate(date)}: Dozentenkonflikt mit ${conflict.title}.`);
      } else if (conflict) {
        problems.push(`${formatDate(date)}: Kohortenkonflikt mit ${conflict.title}.`);
      }

      if (!lecturerAvailableForAssignment(assignment)) {
        problems.push(`${formatDate(date)}: Dozent ist nicht verfuegbar.`);
      }
    });

    return Array.from(new Set(problems));
  };

  const getAssignmentValidationProblems = (
    assignment: RoomAssignment,
    contextAssignments: RoomAssignment[] = roomAssignments
  ) => {
    const problems: string[] = [];

    if (!assignment.roomId || !assignment.date || !assignment.startTime || !assignment.endTime || !assignment.title.trim()) {
      problems.push('Bitte Raum, Datum, Uhrzeit und Titel ausfuellen.');
      return problems;
    }

    if (timeToMinutes(assignment.startTime) >= timeToMinutes(assignment.endTime)) {
      problems.push('Die Endzeit muss nach der Startzeit liegen.');
      return problems;
    }

    const room = rooms.find(item => item.id === assignment.roomId);
    if (room && roomBlockedOn(room, assignment.date, assignment.startTime, assignment.endTime)) {
      problems.push('Der Raum ist in diesem Zeitraum gesperrt.');
    }

    problems.push(...assignmentOutsidePlanningRules(assignment));

    const conflict = contextAssignments.find(item =>
      item.id !== assignment.id
      && item.date === assignment.date
      && rangesOverlapWithStandardPause(assignment.startTime, assignment.endTime, item.startTime, item.endTime)
      && (
        item.roomId === assignment.roomId
        || (!!assignment.person && item.person === assignment.person)
        || sameCohortConflict(assignment, item)
      )
    );

    if (conflict?.roomId === assignment.roomId) {
      problems.push('Dieser Raum ist in diesem Zeitraum bereits belegt.');
    } else if (conflict?.person === assignment.person) {
      problems.push('Der Dozent hat in diesem Zeitraum bereits einen Termin.');
    } else if (conflict) {
      problems.push('Eine beteiligte Kohorte hat in diesem Zeitraum bereits einen Termin.');
    }

    if (!lecturerAvailableForAssignment(assignment)) {
      problems.push('Der Dozent ist in diesem Zeitraum nicht verfuegbar.');
    }

    return problems;
  };

  const validateAssignment = (assignment: RoomAssignment) => {
    const problems = getAssignmentValidationProblems(assignment);
    if (problems.length > 0) {
      alert(problems[0]);
      return false;
    }

    return true;
  };

  const buildAssignmentForEntry = (entry: ScheduleDisplayEntry): ScheduleEditDraft => {
    const existingAssignment = roomAssignments.find(assignment => assignment.id === entry.assignmentId);
    if (existingAssignment) {
      return {
        ...existingAssignment,
        lockKind: entry.displayLockKind,
      };
    }

    return {
      id: entry.assignmentId,
      roomId: entry.displayRoomId,
      date: entry.displayDate,
      startTime: entry.displayStartTime,
      endTime: entry.displayEndTime,
      title: entry.displayTitle || `${entry.moduleName} (${entry.cohortNames.join(', ')})`,
      person: entry.displayLecturerName,
      purpose: entry.displayPurpose || `Generierter Semesterplan ${entry.semesterId}`,
      moduleId: entry.moduleId,
      cohortId: entry.cohortIds.join(','),
      color: entry.displayColor || `hsl(${Math.abs(hashCode(entry.moduleId)) % 360}, 65%, 44%)`,
      lockKind: entry.displayLockKind,
    };
  };

  const buildSwapCandidate = (
    entry: ScheduleDisplayEntry,
    targetPlacement: ScheduleDisplayEntry
  ): RoomAssignment => ({
    ...buildAssignmentForEntry(entry),
    date: targetPlacement.displayDate,
    startTime: targetPlacement.displayStartTime,
    endTime: targetPlacement.displayEndTime,
    roomId: targetPlacement.displayRoomId,
  });

  const buildSwapOverride = (
    entry: ScheduleDisplayEntry,
    targetPlacement: ScheduleDisplayEntry
  ): ScheduledOccurrenceOverride => {
    const override: ScheduledOccurrenceOverride = {
      originalDate: entry.originalDate,
      date: targetPlacement.displayDate,
      roomId: targetPlacement.displayRoomId,
      roomName: targetPlacement.displayRoomName,
      startTime: targetPlacement.displayStartTime,
      endTime: targetPlacement.displayEndTime,
      lecturerName: entry.displayLecturerName,
    };

    if (entry.displayTitle) override.title = entry.displayTitle;
    if (entry.displayPurpose) override.purpose = entry.displayPurpose;
    if (entry.displayColor) override.color = entry.displayColor;
    override.lockKind = 'hard';

    return override;
  };

  const applyOccurrenceOverride = (
    entry: ScheduledEntry,
    override: ScheduledOccurrenceOverride
  ): ScheduledEntry => {
    const otherOverrides = (entry.occurrenceOverrides || []).filter(item => item.originalDate !== override.originalDate);

    return {
      ...entry,
      occurrenceOverrides: [...otherOverrides, override].sort((a, b) => a.originalDate.localeCompare(b.originalDate)),
    };
  };

  const swapScheduleEntries = (sourceAssignmentId: string, targetAssignmentId: string) => {
    if (!activePlan || sourceAssignmentId === targetAssignmentId) return;

    const sourceEntry = allDisplayEntries.find(entry => entry.assignmentId === sourceAssignmentId);
    const targetEntry = allDisplayEntries.find(entry => entry.assignmentId === targetAssignmentId);

    if (!sourceEntry || !targetEntry) {
      setDragNotice({ tone: 'warning', message: 'Der Tausch konnte nicht ausgefuehrt werden.' });
      return;
    }

    const sourceCandidate = buildSwapCandidate(sourceEntry, targetEntry);
    const targetCandidate = buildSwapCandidate(targetEntry, sourceEntry);
    const remainingAssignments = roomAssignments.filter(assignment =>
      assignment.id !== sourceEntry.assignmentId && assignment.id !== targetEntry.assignmentId
    );
    const sourceProblems = getAssignmentValidationProblems(sourceCandidate, [...remainingAssignments, targetCandidate]);
    const targetProblems = getAssignmentValidationProblems(targetCandidate, [...remainingAssignments, sourceCandidate]);
    const problems = Array.from(new Set([
      ...sourceProblems.map(problem => `${sourceEntry.moduleName}: ${problem}`),
      ...targetProblems.map(problem => `${targetEntry.moduleName}: ${problem}`),
    ]));

    if (problems.length > 0) {
      setDragNotice({ tone: 'warning', message: `Tausch nicht moeglich: ${problems[0]}` });
      return;
    }

    const overridesByEntryId = new Map<string, ScheduledOccurrenceOverride[]>();
    const addOverride = (entryId: string, override: ScheduledOccurrenceOverride) => {
      overridesByEntryId.set(entryId, [...(overridesByEntryId.get(entryId) || []), override]);
    };

    addOverride(sourceEntry.id, buildSwapOverride(sourceEntry, targetEntry));
    addOverride(targetEntry.id, buildSwapOverride(targetEntry, sourceEntry));

    const updatedPlan: SchedulePlan = {
      ...activePlan,
      entries: activePlan.entries.map(entry => {
        const overrides = overridesByEntryId.get(entry.id);
        if (!overrides) return entry;

        return overrides.reduce((nextEntry, override) => applyOccurrenceOverride(nextEntry, override), entry);
      }),
      adjustmentLog: [
        ...(activePlan.adjustmentLog || []),
        {
          id: `adj-${Date.now()}-swap-a`,
          type: 'manual-change',
          classId: sourceEntry.id,
          moduleId: sourceEntry.moduleId,
          fromDate: sourceEntry.displayDate,
          toDate: targetEntry.displayDate,
          note: `Termine per Drag and Drop getauscht: ${sourceEntry.moduleName} mit ${targetEntry.moduleName}.`,
          createdAt: new Date().toISOString(),
        },
        {
          id: `adj-${Date.now()}-swap-b`,
          type: 'manual-change',
          classId: targetEntry.id,
          moduleId: targetEntry.moduleId,
          fromDate: targetEntry.displayDate,
          toDate: sourceEntry.displayDate,
          note: `Termine per Drag and Drop getauscht: ${targetEntry.moduleName} mit ${sourceEntry.moduleName}.`,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    const nextAssignments = buildRoomAssignmentsFromSchedule(updatedPlan, roomAssignments);

    onUpdateSchedulePlan(updatedPlan);
    onUpdateRoomAssignments(nextAssignments, { reconcileSchedule: false });
    setSelectedIssue(null);
    setIssueDraft(null);
    setEditingEntry(null);
    setEditDraft(null);
    setDragNotice({
      tone: 'success',
      message: `${sourceEntry.moduleName} und ${targetEntry.moduleName} wurden getauscht.`,
    });
  };

  const handleEntryDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    entry: ScheduleDisplayEntry
  ) => {
    setPendingConfirmation(null);
    setDragNotice(null);
    setDraggedAssignmentId(entry.assignmentId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', entry.assignmentId);
  };

  const handleEntryDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    entry: ScheduleDisplayEntry
  ) => {
    const sourceAssignmentId = draggedAssignmentId || event.dataTransfer.getData('text/plain');
    if (!sourceAssignmentId || sourceAssignmentId === entry.assignmentId) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverAssignmentId !== entry.assignmentId) {
      setDragOverAssignmentId(entry.assignmentId);
    }
  };

  const handleEntryDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetEntry: ScheduleDisplayEntry
  ) => {
    event.preventDefault();
    const sourceAssignmentId = event.dataTransfer.getData('text/plain') || draggedAssignmentId;
    setDraggedAssignmentId(null);
    setDragOverAssignmentId(null);

    if (sourceAssignmentId) {
      swapScheduleEntries(sourceAssignmentId, targetEntry.assignmentId);
    }
  };

  const handleEntryDragEnd = () => {
    setDraggedAssignmentId(null);
    setDragOverAssignmentId(null);
  };

  const openEdit = (entry: ScheduleDisplayEntry) => {
    setSelectedIssue(null);
    setIssueDraft(null);
    setPendingConfirmation(null);
    setEditingEntry(entry);
    setEditDraft(buildAssignmentForEntry(entry));
  };

  const closeEdit = () => {
    setEditingEntry(null);
    setEditDraft(null);
  };

  const updateEditDraft = (updates: Partial<ScheduleEditDraft>) => {
    setEditDraft(current => current ? { ...current, ...updates } : current);
  };

  const openIssueResolver = (issue: ScheduleIssueItem) => {
    const startTime = planningSettings.startHour;
    const endTime = minutesToTime(timeToMinutes(startTime) + getIssueDurationMinutes(issue));
    const preferredRoom = rooms.find(room => roomFitsIssue(room, issue)) || rooms[0];
    const preferredLecturer = teachingUsers.find(user => user.name === getModuleForIssue(issue)?.personInCharge)
      || teachingUsers[0];

    closeEdit();
    setSelectedIssue(issue);
    setIssueDraft({
      date: weekRange.weekDates.monday || activePlan?.semesterStartDate || semesterRange?.semesterStartDate || toDateInputValue(new Date()),
      startTime,
      endTime,
      roomId: preferredRoom?.id || '',
      lecturerName: preferredLecturer?.name || '',
      title: `${issue.moduleName} (${issue.cohortNames.join(', ')})`,
      purpose: `Manuell geplant aus Nicht geplant: ${issue.reason}`,
    });
  };

  const closeIssueResolver = () => {
    setSelectedIssue(null);
    setIssueDraft(null);
  };

  const updateIssueDraft = (updates: Partial<IssuePlanningDraft>) => {
    setIssueDraft(current => current ? { ...current, ...updates } : current);
  };

  const saveEdit = () => {
    if (!selectedSemester || !editDraft || !validateAssignment(editDraft)) return;

    if (activePlan && editingEntry) {
      const scheduledEntry = activePlan.entries.find(entry => entry.id === editingEntry.id);
      const room = rooms.find(item => item.id === editDraft.roomId);

      if (scheduledEntry) {
        const override: ScheduledOccurrenceOverride = {
          originalDate: editingEntry.originalDate,
          date: editDraft.date,
          roomId: editDraft.roomId,
          roomName: room?.name || editDraft.roomId,
          startTime: editDraft.startTime,
          endTime: editDraft.endTime,
          lecturerName: editDraft.person || scheduledEntry.lecturerName,
          title: editDraft.title,
          purpose: editDraft.purpose,
          color: editDraft.color,
          lockKind: editDraft.lockKind,
        };
        const updatedEntry = applyOccurrenceOverride(scheduledEntry, override);
        const updatedPlan: SchedulePlan = {
          ...activePlan,
          entries: activePlan.entries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry),
          adjustmentLog: [
            ...(activePlan.adjustmentLog || []),
            {
              id: `adj-${Date.now()}`,
              type: 'manual-change',
              classId: scheduledEntry.id,
              moduleId: scheduledEntry.moduleId,
              fromDate: editingEntry.originalDate,
              toDate: editDraft.date,
              note: editDraft.lockKind === 'hard'
                ? 'Einzeltermin manuell geaendert und hart gelockt.'
                : 'Einzeltermin manuell geaendert; Hard Lock entfernt.',
              createdAt: new Date().toISOString(),
            },
          ],
        };
        const nextAssignments = buildRoomAssignmentsFromSchedule(updatedPlan, roomAssignments);

        onUpdateSchedulePlan(updatedPlan);
        onUpdateRoomAssignments(nextAssignments, { reconcileSchedule: false });
        setPreviewWeekStartDate(getScheduleWeekRange(selectedSemester, editDraft.date).weekStartDate);
        closeEdit();
        return;
      }
    }

    const assignmentExists = roomAssignments.some(assignment => assignment.id === editDraft.id);
    const nextAssignments = assignmentExists
      ? roomAssignments.map(assignment => assignment.id === editDraft.id ? editDraft : assignment)
      : [...roomAssignments, editDraft];

    onUpdateRoomAssignments(nextAssignments);
    setPreviewWeekStartDate(getScheduleWeekRange(selectedSemester, editDraft.date).weekStartDate);
    closeEdit();
  };

  const deleteEdit = () => {
    if (!editDraft) return;
    onUpdateRoomAssignments(roomAssignments.filter(assignment => assignment.id !== editDraft.id));
    closeEdit();
  };

  const scheduleSelectedIssue = (bruteForce: boolean) => {
    if (!activePlan || !selectedIssue || !issueDraft || !selectedSemester) return;

    const problems = getIssuePlacementProblems(selectedIssue, issueDraft, !bruteForce);
    if (problems.length > 0 && !bruteForce) {
      alert(`Der Termin kann noch nicht konfliktfrei geplant werden:\n\n${problems.slice(0, 8).join('\n')}`);
      return;
    }

    const room = rooms.find(item => item.id === issueDraft.roomId);
    const lecturer = users.find(user => user.name === issueDraft.lecturerName);
    const module = getModuleForIssue(selectedIssue);
    const occurrenceDates = getIssueOccurrenceDates(selectedIssue, issueDraft);
    const day = getWeekdayForDate(issueDraft.date) || 'monday';
    const hardWarnings = bruteForce
      ? getIssuePlacementProblems(selectedIssue, issueDraft, true).map(problem => `Brute Force: ${problem}`)
      : [];

    const forcedEntry: SchedulePlan['entries'][number] = {
      id: `class-${activePlan.semesterId}:${selectedIssue.moduleId}`,
      semesterId: activePlan.semesterId,
      moduleId: selectedIssue.moduleId,
      moduleName: selectedIssue.moduleName,
      moduleInstanceIds: [selectedIssue.moduleId],
      cohortIds: selectedIssue.cohortIds,
      cohortNames: selectedIssue.cohortNames,
      lecturerUserId: lecturer?.id,
      lecturerName: issueDraft.lecturerName || 'N.N.',
      roomId: issueDraft.roomId,
      roomName: room?.name || issueDraft.roomId,
      day,
      date: occurrenceDates[0] || issueDraft.date,
      occurrenceDates,
      startTime: issueDraft.startTime,
      endTime: issueDraft.endTime,
      sws: module?.sws || 1,
      participants: getIssueParticipants(selectedIssue),
      score: bruteForce ? 999 : 50,
      warnings: bruteForce
        ? ['Brute-Force-Platzierung: harte Planungsregeln wurden bewusst uebersteuert.', ...hardWarnings]
        : ['Manuell aus Nicht geplant geloest.'],
      occurrenceOverrides: occurrenceDates.map(date => ({
        originalDate: date,
        date,
        roomId: issueDraft.roomId,
        roomName: room?.name || issueDraft.roomId,
        startTime: issueDraft.startTime,
        endTime: issueDraft.endTime,
        lecturerName: issueDraft.lecturerName || 'N.N.',
        title: issueDraft.title,
        purpose: issueDraft.purpose,
        color: `hsl(${Math.abs(hashCode(selectedIssue.moduleId)) % 360}, 65%, 44%)`,
        lockKind: 'hard',
      })),
    };

    const updatedPlan: SchedulePlan = {
      ...activePlan,
      entries: [...activePlan.entries, forcedEntry].sort((a, b) => {
        const dayDelta = WEEKDAYS.findIndex(item => item.id === a.day) - WEEKDAYS.findIndex(item => item.id === b.day);
        if (dayDelta !== 0) return dayDelta;
        return a.startTime.localeCompare(b.startTime);
      }),
      unscheduled: activePlan.unscheduled.filter(issue => issue.id !== selectedIssue.id),
      adjustmentLog: [
        ...(activePlan.adjustmentLog || []),
        {
          id: `adj-${Date.now()}`,
          type: 'manual-change',
          classId: forcedEntry.id,
          moduleId: selectedIssue.moduleId,
          toDate: issueDraft.date,
          note: bruteForce
            ? 'Nicht geplantes Modul per Brute Force eingeplant.'
            : 'Nicht geplantes Modul manuell konfliktfrei eingeplant.',
          createdAt: new Date().toISOString(),
        },
      ],
      summary: {
        ...activePlan.summary,
        scheduledOfferings: activePlan.summary.scheduledOfferings + 1,
        unscheduledOfferings: Math.max(0, activePlan.summary.unscheduledOfferings - 1),
        totalSws: activePlan.summary.totalSws + forcedEntry.sws,
        plannedRoomAssignments: activePlan.summary.plannedRoomAssignments + occurrenceDates.length,
      },
    };

    const nextAssignments = buildRoomAssignmentsFromSchedule(updatedPlan, roomAssignments);
    onUpdateSchedulePlan(updatedPlan);
    onUpdateRoomAssignments(nextAssignments, { reconcileSchedule: false });
    setPreviewWeekStartDate(getScheduleWeekRange(selectedSemester, issueDraft.date).weekStartDate);
    closeIssueResolver();
  };

  const sanitizeFileName = (value: string) => {
    return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  };

  const escapeCsvCell = (value: unknown) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  const escapeIcsText = (value: unknown) => {
    return String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  };

  const formatIcsDateTime = (date: string, time: string) => {
    return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const getExportBaseName = () => {
    const semesterName = selectedSemester?.id || activePlan?.semesterId || 'semester';
    return `coursepilot-${semesterName}-${sanitizeFileName(filterSummary)}`;
  };

  const exportCsv = () => {
    const header = ['Datum', 'Start', 'Ende', 'Modul', 'Kohorten', 'Dozent', 'Raum', 'Teilnehmer', 'SWS', 'Notiz'];
    const rows = filteredDisplayEntries.map(entry => [
      entry.displayDate,
      entry.displayStartTime,
      entry.displayEndTime,
      entry.displayTitle || entry.moduleName,
      entry.cohortNames.join(', '),
      entry.displayLecturerName,
      `${entry.displayRoomId} ${entry.displayRoomName}`,
      entry.participants,
      entry.sws,
      entry.displayPurpose || '',
    ]);
    const content = [header, ...rows].map(row => row.map(escapeCsvCell).join(';')).join('\r\n');
    downloadFile(`${getExportBaseName()}.csv`, content, 'text/csv;charset=utf-8');
  };

  const exportIcs = () => {
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const events = filteredDisplayEntries.map(entry => [
      'BEGIN:VEVENT',
      `UID:${escapeIcsText(entry.assignmentId)}@coursepilot.local`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${formatIcsDateTime(entry.displayDate, entry.displayStartTime)}`,
      `DTEND:${formatIcsDateTime(entry.displayDate, entry.displayEndTime)}`,
      `SUMMARY:${escapeIcsText(entry.displayTitle || entry.moduleName)}`,
      `LOCATION:${escapeIcsText(`${entry.displayRoomId} ${entry.displayRoomName}`)}`,
      `DESCRIPTION:${escapeIcsText([
        `Kohorten: ${entry.cohortNames.join(', ')}`,
        `Dozent: ${entry.displayLecturerName}`,
        `Teilnehmer: ${entry.participants}`,
        entry.displayPurpose || '',
      ].filter(Boolean).join('\n'))}`,
      'END:VEVENT',
    ].join('\r\n'));

    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CoursePilot//Schedule Export//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n');

    downloadFile(`${getExportBaseName()}.ics`, content, 'text/calendar;charset=utf-8');
  };

  const exportJson = () => {
    const content = JSON.stringify({
      semester: selectedSemester?.name || activePlan?.semesterId,
      filter: {
        type: filterType,
        value: filterValue,
        label: filterSummary,
      },
      generatedAt: new Date().toISOString(),
      entries: filteredDisplayEntries,
    }, null, 2);

    downloadFile(`${getExportBaseName()}.json`, content, 'application/json;charset=utf-8');
  };

  const handleExportSchedule = (format: ScheduleExportFormat) => {
    if (format === 'print') {
      window.print();
      return;
    }

    if (!activePlan || filteredDisplayEntries.length === 0) {
      alert('Es gibt fuer die aktuelle Auswahl keine Termine zum Exportieren.');
      return;
    }

    if (format === 'csv') exportCsv();
    if (format === 'ics') exportIcs();
    if (format === 'json') exportJson();
  };

  const hashCode = (value: string): number => {
    return value.split('').reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0);
  };

  const calendarStartMinute = Math.floor(timeToMinutes(planningSettings.startHour) / 60) * 60;
  const calendarEndMinute = Math.max(
    calendarStartMinute + 60,
    Math.ceil(timeToMinutes(planningSettings.endHour) / 60) * 60
  );
  const calendarTotalMinutes = calendarEndMinute - calendarStartMinute;
  const calendarHeight = Math.max(560, calendarTotalMinutes * 1.2);
  const hourTicks = Array.from(
    { length: Math.floor(calendarTotalMinutes / 60) + 1 },
    (_, index) => calendarStartMinute + index * 60
  );
  const visibleWeekdays = WEEKDAYS.filter(day => planningSettings.plannedWeekdays.includes(day.id));
  const calendarDays = visibleWeekdays.length > 0
    ? visibleWeekdays
    : WEEKDAYS.filter(day => DEFAULT_PLANNED_WEEKDAYS.includes(day.id));
  const calendarGridTemplateColumns = `56px repeat(${calendarDays.length}, minmax(140px, 1fr))`;
  const getCalendarTop = (time: string) => {
    const minute = Math.min(calendarEndMinute, Math.max(calendarStartMinute, timeToMinutes(time)));
    return ((minute - calendarStartMinute) / calendarTotalMinutes) * calendarHeight;
  };
  const getCalendarEventHeight = (startTime: string, endTime: string) => {
    const start = Math.min(calendarEndMinute, Math.max(calendarStartMinute, timeToMinutes(startTime)));
    const end = Math.min(calendarEndMinute, Math.max(calendarStartMinute, timeToMinutes(endTime)));
    return Math.max(56, ((Math.max(end, start + 15) - start) / calendarTotalMinutes) * calendarHeight);
  };
  const lunchBreakVisible = timeToMinutes(planningSettings.lunchBreakStart) < timeToMinutes(planningSettings.lunchBreakEnd)
    && rangesOverlap(planningSettings.lunchBreakStart, planningSettings.lunchBreakEnd, planningSettings.startHour, planningSettings.endHour);
  const lunchBreakActive = planningSettings.useLunchBreak;
  const lunchBreakTop = getCalendarTop(planningSettings.lunchBreakStart);
  const lunchBreakHeight = getCalendarEventHeight(planningSettings.lunchBreakStart, planningSettings.lunchBreakEnd);
  const getOverlappingLayoutEntries = (entries: ScheduleDisplayEntry[]): CalendarLayoutEntry[] => {
    const sortedEntries = [...entries].sort((first, second) => {
      const startDifference = timeToMinutes(first.displayStartTime) - timeToMinutes(second.displayStartTime);
      if (startDifference !== 0) return startDifference;
      return timeToMinutes(first.displayEndTime) - timeToMinutes(second.displayEndTime);
    });

    const laidOutEntries: CalendarLayoutEntry[] = [];
    let group: ScheduleDisplayEntry[] = [];
    let groupEndMinute = -1;

    const flushGroup = () => {
      if (group.length === 0) return;

      const columnEndMinutes: number[] = [];
      const groupLayout = group.map(entry => {
        const startMinute = timeToMinutes(entry.displayStartTime);
        const endMinute = timeToMinutes(entry.displayEndTime);
        let columnIndex = columnEndMinutes.findIndex(columnEndMinute => columnEndMinute <= startMinute);

        if (columnIndex === -1) {
          columnIndex = columnEndMinutes.length;
          columnEndMinutes.push(endMinute);
        } else {
          columnEndMinutes[columnIndex] = endMinute;
        }

        return {
          ...entry,
          calendarColumn: columnIndex,
          calendarColumnCount: 1,
        };
      });
      const columnCount = Math.max(1, columnEndMinutes.length);

      groupLayout.forEach(entry => {
        laidOutEntries.push({
          ...entry,
          calendarColumnCount: columnCount,
        });
      });

      group = [];
      groupEndMinute = -1;
    };

    sortedEntries.forEach(entry => {
      const startMinute = timeToMinutes(entry.displayStartTime);
      const endMinute = timeToMinutes(entry.displayEndTime);

      if (group.length > 0 && startMinute >= groupEndMinute) {
        flushGroup();
      }

      group.push(entry);
      groupEndMinute = Math.max(groupEndMinute, endMinute);
    });
    flushGroup();

    return laidOutEntries.sort((first, second) => {
      const startDifference = timeToMinutes(first.displayStartTime) - timeToMinutes(second.displayStartTime);
      if (startDifference !== 0) return startDifference;
      return first.calendarColumn - second.calendarColumn;
    });
  };

  const pendingConfirmationCopy = pendingConfirmation === 'clear-plan'
    ? {
      title: 'Plan wirklich leeren?',
      body: `Alle generierten Termine und der aktuelle Semesterplan fuer ${selectedSemester?.name || 'dieses Semester'} werden entfernt. Manuelle Raumbelegungen ausserhalb des Plans bleiben erhalten.`,
      confirmLabel: 'Plan leeren',
    }
    : pendingConfirmation === 'unlock-plan'
      ? {
        title: 'Plan entsperren?',
        body: 'Der Plan wechselt wieder in die dynamische Planungsphase. Danach koennen automatische Anpassungen wieder greifen.',
        confirmLabel: 'Entsperren',
      }
      : null;

  return (
    <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Stundenplanung</h2>
          <p className="text-sm text-muted-foreground">
            Automatischer Semesterplan von {formatDate(activePlan?.semesterStartDate || semesterRange?.semesterStartDate || '')} bis {formatDate(activePlan?.semesterEndDate || semesterRange?.semesterEndDate || '')}; Ansicht {filterSummary}; Vorschau zeigt {formatDate(weekRange.weekStartDate)} bis {formatDate(weekRange.weekEndDate)}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSemester?.id || ''}
            onChange={event => {
              const semester = semesters.find(item => item.id === event.target.value);
              if (semester) setSelectedSemester(semester);
            }}
            className="bg-card border border-input rounded-md px-3 py-2 text-sm font-bold min-w-[180px]"
          >
            {semesters.map(semester => (
              <option key={semester.id} value={semester.id}>{semester.name}</option>
            ))}
          </select>
          <div className="flex items-center bg-card border border-input rounded-md overflow-hidden">
            <select
              value={filterType}
              onChange={event => handleFilterTypeChange(event.target.value as ScheduleFilterType)}
              className="h-10 bg-transparent px-3 text-sm font-bold outline-none border-r border-input"
              title="Ansicht filtern"
            >
              <option value="all">Gesamt</option>
              <option value="lecturer">Dozent</option>
              <option value="cohort">Gruppe</option>
              <option value="room">Raum</option>
            </select>
            {filterType !== 'all' && (
              <select
                value={filterValue}
                onChange={event => setFilterValue(event.target.value)}
                className="h-10 bg-transparent px-3 text-sm font-bold outline-none min-w-[180px]"
                title="Filterauswahl"
              >
                <option value="">
                  {filterType === 'lecturer' ? 'Alle Dozenten' : filterType === 'cohort' ? 'Alle Gruppen' : 'Alle Raeume'}
                </option>
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center bg-card border border-input rounded-md overflow-hidden">
            <button
              onClick={() => moveWeek(-1)}
              className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted"
              title="Vorherige Woche"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <input
              type="date"
              value={weekRange.weekStartDate}
              min={semesterCalendar.lecturesStart}
              max={activePlan?.semesterEndDate || semesterCalendar.lecturesEnd}
              onChange={event => handleDateChange(event.target.value)}
              className="h-10 bg-transparent px-3 text-sm font-bold outline-none border-x border-input"
            />
            <button
              onClick={() => moveWeek(1)}
              className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted"
              title="Naechste Woche"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={jumpToLectureStart}
            className="px-3 py-2 rounded-md bg-muted text-sm font-bold hover:bg-muted/80"
          >
            Erste Woche
          </button>
          <button
            onClick={runOptimizer}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Semester planen
          </button>
          <button
            onClick={requestPlanLockToggle}
            disabled={!activePlan}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold disabled:opacity-40 ${isPlanLocked ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/20' : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20'}`}
          >
            {isPlanLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {isPlanLocked ? 'Entsperren' : 'Plan sperren'}
          </button>
          <button
            onClick={requestClearPlan}
            disabled={!activePlan}
            className="px-4 py-2 rounded-md bg-muted text-sm font-bold hover:bg-muted/80 disabled:opacity-40"
          >
            Plan leeren
          </button>
          <div className="flex items-center bg-card border border-input rounded-md overflow-hidden">
            <div className="h-10 w-10 inline-flex items-center justify-center text-muted-foreground border-r border-input">
              <Download className="h-4 w-4" />
            </div>
            <select
              value={exportFormat}
              onChange={event => {
                const format = event.target.value as ScheduleExportFormat | '';
                if (format) handleExportSchedule(format);
                setExportFormat('');
              }}
              className="h-10 bg-transparent px-3 text-sm font-bold outline-none"
              title="Export"
            >
              <option value="">Export</option>
              <option value="csv">CSV</option>
              <option value="ics">iCal (.ics)</option>
              <option value="json">JSON</option>
              <option value="print">Drucken / PDF</option>
            </select>
          </div>
        </div>
      </div>

      {pendingConfirmationCopy && (
        <div
          role="alertdialog"
          aria-labelledby="schedule-confirmation-title"
          aria-describedby="schedule-confirmation-body"
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h3 id="schedule-confirmation-title" className="font-bold text-sm">{pendingConfirmationCopy.title}</h3>
                <p id="schedule-confirmation-body" className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {pendingConfirmationCopy.body}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={cancelPendingConfirmation}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm font-bold hover:bg-muted"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmPendingConfirmation}
                className="px-3 py-2 rounded-md bg-amber-500 text-white text-sm font-bold hover:bg-amber-600"
              >
                {pendingConfirmationCopy.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {dragNotice && (
        <div
          role="status"
          className={`rounded-lg border p-3 text-sm font-bold ${dragNotice.tone === 'success' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600' : 'border-amber-500/40 bg-amber-500/10 text-amber-600'}`}
        >
          {dragNotice.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric icon={<CalendarClock className="h-5 w-5" />} label="Veranstaltungen" value={activePlan ? filteredOfferingCount : 0} />
        <Metric icon={<AlertTriangle className="h-5 w-5" />} label="Offen" value={activePlan?.summary.unscheduledOfferings || 0} />
        <Metric icon={<UsersRound className="h-5 w-5" />} label="Einzeltermine" value={activePlan ? filteredDisplayEntries.length : 0} />
        <Metric icon={<DoorOpen className="h-5 w-5" />} label="Vorlesungswochen" value={activePlan?.summary.teachingWeeks || semesterRange?.teachingWeeks || 0} />
      </div>

      {editDraft !== null && false && (
        <div className="bg-card border border-primary/30 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Termin bearbeiten
              </h3>
              <p className="text-xs text-muted-foreground">
                {editingEntry?.moduleName} · {editingEntry?.cohortNames.join(', ')}
              </p>
            </div>
            <button
              onClick={closeEdit}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
              title="Schliessen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">Datum</span>
              <input
                type="date"
                value={editDraft?.date || ''}
                onChange={event => updateEditDraft({ date: event.target.value })}
                className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">Raum</span>
              <select
                value={editDraft?.roomId || ''}
                onChange={event => updateEditDraft({ roomId: event.target.value })}
                className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
              >
                {rooms.map(room => <option key={room.id} value={room.id}>{room.id} - {room.name}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">Start</span>
              <input
                type="time"
                value={editDraft?.startTime || ''}
                onChange={event => updateEditDraft({ startTime: event.target.value })}
                className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">Ende</span>
              <input
                type="time"
                value={editDraft?.endTime || ''}
                onChange={event => updateEditDraft({ endTime: event.target.value })}
                className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">Dozent</span>
              <select
                value={editDraft?.person || ''}
                onChange={event => updateEditDraft({ person: event.target.value })}
                className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
              >
                {editDraft?.person && !teachingUsers.some(user => user.name === editDraft?.person) && (
                  <option value={editDraft?.person || ''}>{editDraft?.person}</option>
                )}
                <option value="">N.N.</option>
                {teachingUsers.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button
                onClick={saveEdit}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-bold hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                Speichern
              </button>
              <button
                onClick={deleteEdit}
                className="h-10 w-10 inline-flex items-center justify-center rounded-md bg-destructive/15 text-destructive hover:bg-destructive/20"
                title="Termin loeschen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3 mt-3">
            <label className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">Titel</span>
              <input
                value={editDraft?.title || ''}
                onChange={event => updateEditDraft({ title: event.target.value })}
                className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">Notiz</span>
              <input
                value={editDraft?.purpose || ''}
                onChange={event => updateEditDraft({ purpose: event.target.value })}
                className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm"
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Die Aenderung gilt fuer genau diesen Einzeltermin. In der Planungsphase bleibt der restliche Semesterplan dynamisch.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 min-h-0 flex-grow xl:grid-cols-[minmax(0,1fr)_320px_360px]">
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col min-h-0">
          <div className="overflow-auto min-h-0 flex-grow">
            <div className="min-w-[1040px] min-h-full flex flex-col">
              <div
                className="grid border-b border-border bg-muted/30 sticky top-0 z-20"
                style={{ gridTemplateColumns: calendarGridTemplateColumns }}
              >
                <div className="border-r border-border bg-muted/40 p-3 text-xs font-bold text-muted-foreground">
                  Zeit
                </div>
                {calendarDays.map(day => (
                  <div key={day.id} className="p-3 font-bold border-r border-border last:border-r-0">
                    <div>{day.label}</div>
                    <div className="text-xs text-muted-foreground font-medium">{formatDate(weekRange.weekDates[day.id])}</div>
                  </div>
                ))}
              </div>

              <div
                className="grid flex-grow"
                style={{ gridTemplateColumns: calendarGridTemplateColumns }}
              >
                <div
                  className="relative border-r border-border bg-muted/20"
                  style={{ height: calendarHeight }}
                >
                  {hourTicks.map(tick => (
                    <div
                      key={tick}
                      className="absolute left-0 right-0 -translate-y-1/2 pr-2 text-right text-[10px] font-bold text-muted-foreground"
                      style={{ top: ((tick - calendarStartMinute) / calendarTotalMinutes) * calendarHeight }}
                    >
                      {minutesToTime(tick)}
                    </div>
                  ))}
                  {lunchBreakVisible && (
                    <div
                      className={`absolute left-1 right-1 rounded-md border px-1 py-0.5 text-[10px] font-bold ${lunchBreakActive ? 'border-amber-500/30 bg-amber-500/10 text-amber-600' : 'border-border border-dashed bg-muted/20 text-muted-foreground'}`}
                      style={{ top: lunchBreakTop, height: lunchBreakHeight }}
                    >
                      {lunchBreakActive ? 'Mittag' : 'Mittag aus'}
                    </div>
                  )}
                </div>
            {calendarDays.map(day => {
              const entries = entriesByDay.get(day.id) || [];
              return (
                <div
                  key={day.id}
                  onClick={closeEdit}
                  className="relative border-r border-border last:border-r-0 bg-background"
                  style={{ height: calendarHeight }}
                >
                  {hourTicks.map(tick => (
                    <div
                      key={tick}
                      className="absolute left-0 right-0 border-t border-border/60"
                      style={{ top: ((tick - calendarStartMinute) / calendarTotalMinutes) * calendarHeight }}
                    />
                  ))}
                      {lunchBreakVisible && (
                        <div
                          className={`absolute left-0 right-0 border-y ${lunchBreakActive ? 'border-amber-500/30 bg-amber-500/10' : 'border-border border-dashed bg-muted/20'}`}
                          style={{ top: lunchBreakTop, height: lunchBreakHeight }}
                        >
                          <div className={`px-2 py-1 text-[10px] font-bold ${lunchBreakActive ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {lunchBreakActive ? 'Mittagspause' : 'Mittagspause aus'}
                          </div>
                        </div>
                      )}
                  {getOverlappingLayoutEntries(entries).map(entry => {
                    const columnWidthPercent = 100 / entry.calendarColumnCount;
                    const eventLeft = `calc(${columnWidthPercent * entry.calendarColumn}% + ${entry.calendarColumn === 0 ? 8 : 4}px)`;
                    const eventWidth = `calc(${columnWidthPercent}% - ${entry.calendarColumnCount === 1 ? 16 : 8}px)`;
                    const showLockBadge = entry.displayLockKind === 'hard' || isPlanLocked;

                    return (
                    <div
                      key={`${entry.id}-${entry.displayDate}`}
                      draggable
                      onDragStart={event => handleEntryDragStart(event, entry)}
                      onDragOver={event => handleEntryDragOver(event, entry)}
                      onDragEnter={event => handleEntryDragOver(event, entry)}
                      onDrop={event => handleEntryDrop(event, entry)}
                      onDragEnd={handleEntryDragEnd}
                      onClick={event => {
                        event.stopPropagation();
                        openEdit(entry);
                      }}
                      title="Termin bearbeiten oder auf einen anderen Termin ziehen zum Tauschen"
                      style={{
                        top: getCalendarTop(entry.displayStartTime),
                        height: getCalendarEventHeight(entry.displayStartTime, entry.displayEndTime),
                        left: eventLeft,
                        width: eventWidth,
                      }}
                      className={`absolute z-10 overflow-hidden rounded-lg border p-2 ${showLockBadge ? 'pr-8' : 'pr-2'} shadow-sm cursor-grab active:cursor-grabbing transition-colors hover:border-primary/60 hover:bg-primary/5 ${draggedAssignmentId === entry.assignmentId ? 'opacity-60 border-primary/60' : ''} ${dragOverAssignmentId === entry.assignmentId ? 'ring-2 ring-primary border-primary bg-primary/10' : editingEntry?.assignmentId === entry.assignmentId ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                    >
                      {showLockBadge && (
                        <span
                          aria-label={entry.displayLockKind === 'hard' ? 'Hard lock: manuell gesetzter Termin' : 'Soft lock: automatisch geplanter Termin'}
                          title={entry.displayLockKind === 'hard' ? 'Hard Lock: manuell gesetzt' : 'Soft Lock: automatisch geplant'}
                          className={`absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md border ${entry.displayLockKind === 'hard' ? 'border-amber-500/50 bg-amber-500/15 text-amber-600' : 'border-sky-500/40 bg-sky-500/10 text-sky-600'}`}
                        >
                          <Lock className="h-3 w-3" />
                        </span>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-primary">{entry.displayStartTime} - {entry.displayEndTime}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded font-bold">
                          <Pencil className="h-3 w-3" />
                          {entry.sws} SWS
                        </span>
                      </div>
                      <h3 className="font-bold text-xs mt-1 leading-tight">{entry.displayTitle || entry.moduleName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{entry.cohortNames.join(', ')} · {entry.participants} TN</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {(Array.isArray(entry.occurrenceDates) ? entry.occurrenceDates.length : 1)} Termine · erster Termin {formatDate(entry.date)}
                      </p>
                      <div className="mt-2 space-y-0.5 text-[10px]">
                        <div className="truncate"><span className="font-bold">Raum:</span> {entry.displayRoomId} {entry.displayRoomName}</div>
                        <div className="truncate"><span className="font-bold">Dozent:</span> {entry.displayLecturerName}</div>
                      </div>
                      {entry.warnings.length > 0 && (
                        <div className="mt-1 truncate text-[10px] text-amber-500 font-bold">
                          {entry.warnings.join(' ')}
                        </div>
                      )}
                    </div>
                    );
                  })}

                  {entries.length === 0 && (
                    <div className="absolute left-3 right-3 top-3 rounded-md border border-dashed border-border bg-background/70 px-3 py-2 text-center text-xs text-muted-foreground italic">
                      Frei
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        </div>
        </div>

        {editDraft && (
          <aside className="bg-card border border-primary/30 rounded-lg overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-primary" />
                    Termin bearbeiten
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {editingEntry?.moduleName}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {editingEntry?.cohortNames.join(', ')}
                  </p>
                </div>
                <button
                  onClick={closeEdit}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                  title="Schliessen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto space-y-3">
              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Datum</span>
                <input
                  type="date"
                  value={editDraft.date}
                  onChange={event => updateEditDraft({ date: event.target.value })}
                  className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Raum</span>
                <select
                  value={editDraft.roomId}
                  onChange={event => updateEditDraft({ roomId: event.target.value })}
                  className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                >
                  {rooms.map(room => <option key={room.id} value={room.id}>{room.id} - {room.name}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-muted-foreground">Start</span>
                  <input
                    type="time"
                    value={editDraft.startTime}
                    onChange={event => updateEditDraft({ startTime: event.target.value })}
                    className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-muted-foreground">Ende</span>
                  <input
                    type="time"
                    value={editDraft.endTime}
                    onChange={event => updateEditDraft({ endTime: event.target.value })}
                    className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                  />
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Dozent</span>
                <select
                  value={editDraft.person || ''}
                  onChange={event => updateEditDraft({ person: event.target.value })}
                  className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                >
                  {editDraft.person && !teachingUsers.some(user => user.name === editDraft.person) && (
                    <option value={editDraft.person}>{editDraft.person}</option>
                  )}
                  <option value="">N.N.</option>
                  {teachingUsers.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
                </select>
              </label>

              <label className={`flex items-start gap-3 rounded-md border p-3 ${editDraft.lockKind === 'hard' ? 'border-amber-500/40 bg-amber-500/10' : 'border-border bg-muted/30'}`}>
                <input
                  type="checkbox"
                  checked={editDraft.lockKind === 'hard'}
                  onChange={event => updateEditDraft({ lockKind: event.target.checked ? 'hard' : 'soft' })}
                  className="mt-1 h-4 w-4"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Lock className={`h-4 w-4 ${editDraft.lockKind === 'hard' ? 'text-amber-600' : 'text-muted-foreground'}`} />
                    Manueller Lock
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {editDraft.lockKind === 'hard' ? 'Hard Lock aktiv' : 'Als Soft Lock behandeln'}
                  </span>
                </span>
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Titel</span>
                <input
                  value={editDraft.title}
                  onChange={event => updateEditDraft({ title: event.target.value })}
                  className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Notiz</span>
                <textarea
                  value={editDraft.purpose || ''}
                  onChange={event => updateEditDraft({ purpose: event.target.value })}
                  className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm min-h-24 resize-none"
                />
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveEdit}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-bold hover:bg-primary/90"
                >
                  <Save className="h-4 w-4" />
                  Speichern
                </button>
                <button
                  onClick={deleteEdit}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-md bg-destructive/15 text-destructive hover:bg-destructive/20"
                  title="Termin loeschen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Die Aenderung gilt fuer genau diesen Einzeltermin.
              </p>
            </div>
          </aside>
        )}

        {!editDraft && !selectedIssue && (
          <aside className="bg-card border border-border rounded-lg overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold">Planungseinstellungen</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {plannedWeekdayCount} von {WEEKDAYS.length} Tagen pro Woche; Tagesfenster {planningSettings.startHour} - {planningSettings.endHour}
              </p>
            </div>

            <div className="p-4 overflow-auto space-y-5">
              {!systemSettings || !onUpdateSystemSettings ? (
                <div className="rounded-md bg-muted/40 border border-border p-3 text-sm text-muted-foreground">
                  Einstellungen werden geladen.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-muted-foreground">Geplante Tage</div>
                    <div className="grid grid-cols-7 gap-1">
                      {WEEKDAYS.map(day => {
                        const active = planningSettings.plannedWeekdays.includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => togglePlannedWeekday(day.id)}
                            className={`h-9 rounded-md border text-xs font-black transition-colors ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'}`}
                            title={day.label}
                          >
                            {day.shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1 block">
                      <span className="text-xs font-bold text-muted-foreground">Start</span>
                      <input
                        type="time"
                        value={planningSettings.startHour}
                        onChange={event => updateDaySchedule({ startHour: event.target.value })}
                        className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-xs font-bold text-muted-foreground">Ende</span>
                      <input
                        type="time"
                        value={planningSettings.endHour}
                        onChange={event => updateDaySchedule({ endHour: event.target.value })}
                        className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                      />
                    </label>
                  </div>

                  <label className="space-y-1 block">
                    <span className="text-xs font-bold text-muted-foreground">Pause zwischen Terminen (Min)</span>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={planningSettings.standardPauseMinutes}
                      onChange={event => updateDaySchedule({ standardPauseMinutes: Math.max(0, Number(event.target.value) || 0) })}
                      className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                    />
                  </label>

                  <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold">Pause in Veranstaltungen</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Wird in die geplante Blockdauer eingerechnet.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1 block">
                        <span className="text-xs font-bold text-muted-foreground">Dauer (Min)</span>
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={planningSettings.eventBreakDurationMinutes}
                          onChange={event => updateDaySchedule({ eventBreakDurationMinutes: Math.max(0, Number(event.target.value) || 0) })}
                          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-bold"
                        />
                      </label>
                      <label className="space-y-1 block">
                        <span className="text-xs font-bold text-muted-foreground">Intervall (Min)</span>
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={planningSettings.eventBreakIntervalMinutes}
                          onChange={event => updateDaySchedule({ eventBreakIntervalMinutes: Math.max(0, Number(event.target.value) || 0) })}
                          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-bold"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
                    <label className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold">Mittagspause</span>
                      <input
                        type="checkbox"
                        checked={planningSettings.useLunchBreak}
                        onChange={event => updateDaySchedule({ useLunchBreak: event.target.checked })}
                        className="h-4 w-4"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1 block">
                        <span className="text-xs font-bold text-muted-foreground">Von</span>
                        <input
                          type="time"
                          value={planningSettings.lunchBreakStart}
                          disabled={!planningSettings.useLunchBreak}
                          onChange={event => updateDaySchedule({ lunchBreakStart: event.target.value })}
                          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-bold disabled:opacity-50"
                        />
                      </label>
                      <label className="space-y-1 block">
                        <span className="text-xs font-bold text-muted-foreground">Bis</span>
                        <input
                          type="time"
                          value={planningSettings.lunchBreakEnd}
                          disabled={!planningSettings.useLunchBreak}
                          onChange={event => updateDaySchedule({ lunchBreakEnd: event.target.value })}
                          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-bold disabled:opacity-50"
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}

        {selectedIssue && issueDraft && (
          <aside className="bg-card border border-amber-500/40 rounded-lg overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Problem loesen
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {selectedIssue.moduleName}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedIssue.cohortNames.join(', ')}
                  </p>
                </div>
                <button
                  onClick={closeIssueResolver}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                  title="Schliessen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto space-y-3">
              <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3">
                <p className="text-xs font-bold text-amber-600">Ursache</p>
                <p className="text-xs mt-1">{selectedIssue.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="font-bold">Teilnehmer</div>
                  <div>{getIssueParticipants(selectedIssue)}</div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="font-bold">SWS</div>
                  <div>{getModuleForIssue(selectedIssue)?.sws || 1}</div>
                </div>
              </div>

              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Datum / Wochentag</span>
                <input
                  type="date"
                  value={issueDraft.date}
                  onChange={event => updateIssueDraft({ date: event.target.value })}
                  className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Raum</span>
                <select
                  value={issueDraft.roomId}
                  onChange={event => updateIssueDraft({ roomId: event.target.value })}
                  className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                >
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.id} - {room.name}{roomFitsIssue(room, selectedIssue) ? '' : ' (passt nicht)'}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-muted-foreground">Start</span>
                  <input
                    type="time"
                    value={issueDraft.startTime}
                    onChange={event => updateIssueDraft({ startTime: event.target.value })}
                    className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-muted-foreground">Ende</span>
                  <input
                    type="time"
                    value={issueDraft.endTime}
                    onChange={event => updateIssueDraft({ endTime: event.target.value })}
                    className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                  />
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Dozent</span>
                <select
                  value={issueDraft.lecturerName}
                  onChange={event => updateIssueDraft({ lecturerName: event.target.value })}
                  className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                >
                  <option value="">N.N.</option>
                  {teachingUsers.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
                </select>
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Titel</span>
                <input
                  value={issueDraft.title}
                  onChange={event => updateIssueDraft({ title: event.target.value })}
                  className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm font-bold"
                />
              </label>

              <div className="rounded-md bg-muted/40 border border-border p-3">
                <p className="text-xs font-bold">Aktuelle Pruefung</p>
                {getIssuePlacementProblems(selectedIssue, issueDraft, true).length ? (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {getIssuePlacementProblems(selectedIssue, issueDraft, true).slice(0, 5).map(problem => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-emerald-600 font-bold">Keine Konflikte gefunden.</p>
                )}
              </div>

              <button
                onClick={() => scheduleSelectedIssue(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-bold hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                Konfliktfrei planen
              </button>
              <button
                onClick={() => scheduleSelectedIssue(true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-amber-500/15 text-amber-600 px-3 py-2 rounded-md text-sm font-bold hover:bg-amber-500/20"
              >
                <Sparkles className="h-4 w-4" />
                Brute Force planen
              </button>
            </div>
          </aside>
        )}

        <aside className="bg-card border border-border rounded-lg overflow-hidden flex flex-col min-h-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold">Planstatus</h3>
            <p className="text-xs text-muted-foreground">
              {activePlan
                ? `Semester ${formatDate(activePlan.semesterStartDate)} - ${formatDate(activePlan.semesterEndDate)}, ${activePlan.summary.plannedRoomAssignments} Einzeltermine, generiert: ${new Date(activePlan.generatedAt).toLocaleString()}`
                : 'Noch kein Plan fuer dieses Semester.'}
            </p>
            {activePlan && (
              <div className={`mt-3 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-bold ${isPlanLocked ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
                {isPlanLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                {isPlanLocked ? 'Gelockt' : 'Dynamisch'}
              </div>
            )}
          </div>

          <div className="p-4 overflow-auto space-y-4">
            {activePlan?.unscheduled.length ? (
              <div>
                <h4 className="text-sm font-bold text-amber-500 mb-2">Nicht geplant</h4>
                <div className="space-y-2">
                  {activePlan.unscheduled.map(issue => (
                    <button
                      key={issue.id}
                      onClick={() => openIssueResolver(issue)}
                      className={`w-full text-left rounded-md border p-3 transition-colors ${selectedIssue?.id === issue.id ? 'bg-amber-500/20 border-amber-500/60' : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'}`}
                    >
                      <div className="font-bold text-sm">{issue.moduleName}</div>
                      <div className="text-xs text-muted-foreground">{issue.cohortNames.join(', ')}</div>
                      <p className="text-xs mt-2">{issue.reason}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : activePlan ? (
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm font-bold text-emerald-600">
                Alle Veranstaltungen wurden konfliktfrei geplant.
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Starte die Optimierung, um aus den Semesterplaenen einen wiederkehrenden Stundenplan fuer das ganze Semester zu erzeugen.
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold mb-2">Optimierungsregeln</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>Gleiche Module im selben Semester werden zu einer Veranstaltung gebuendelt.</li>
                <li>Geplant wird ein wiederkehrender Slot fuer alle Vorlesungswochen des Semesters.</li>
                <li>Geloeschte Einzeltermine werden in der Planungsphase nach dem bisherigen Planende ersetzt.</li>
                <li>Gelockte Plaene behalten manuelle Aenderungen ohne automatische Ersatztermine.</li>
                <li>Vorlesungspausen aus dem akademischen Kalender werden ausgelassen.</li>
                <li>Raeume muessen Kapazitaet und technische Anforderungen erfuellen.</li>
                <li>Dozenten werden nur in verfuegbaren Zeitfenstern verplant.</li>
                <li>Kohorte, Raum und Dozent duerfen keine Zeitkonflikte haben.</li>
                <li>Beste Kandidaten werden nach Raumfit, Tageslast und Tageszeit bewertet.</li>
              </ul>
            </div>

            {activePlan?.adjustmentLog?.length ? (
              <div>
                <h4 className="text-sm font-bold mb-2">Aenderungen</h4>
                <div className="space-y-2">
                  {activePlan.adjustmentLog.slice(-6).reverse().map(item => (
                    <div key={item.id} className="rounded-md bg-muted/40 border border-border p-3 text-xs">
                      <div className="font-bold">
                        {item.toDate
                          ? `${formatDate(item.fromDate || '')} -> ${formatDate(item.toDate)}`
                          : formatDate(item.fromDate || '')}
                      </div>
                      {item.note && <p className="text-muted-foreground mt-1">{item.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
    <div className="p-2 rounded-md bg-primary/10 text-primary">{icon}</div>
    <div>
      <div className="text-xs text-muted-foreground font-semibold uppercase">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  </div>
);
