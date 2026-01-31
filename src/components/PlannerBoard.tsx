
'use client';

import React from 'react';
import type { Module, Program, Cohort, AbsoluteSemester, MainCategory, PlannerViewMode, Category, Catalogs, User, Room, SystemSettings, AcademicCalendar, RoomAssignment } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';
import { ProgramPlannerGrid } from '@/components/ProgramPlannerGrid';
import { SemesterOverview } from '@/components/SemesterOverview';
import { ModuleOverview } from '@/components/ModuleOverview';
import { ModuleDetailView } from '@/components/ModuleDetailView';
import { OptimizationPanel } from '@/components/OptimizationPanel';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { RoomOverview } from '@/components/RoomOverview';
import { RoomOccupancy } from '@/components/RoomOccupancy';
import { RoomAvailability } from '@/components/RoomAvailability';
import { SettingsVariables } from '@/components/SettingsVariables';
import { SettingsGeneral } from '@/components/SettingsGeneral';
import { SettingsCalendar } from '@/components/SettingsCalendar';


interface PlannerBoardProps {
  mainCategory: MainCategory;
  viewMode: PlannerViewMode;
  onDrop: (cohortId: string, semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => void;
  getModuleById: (id: string) => Module | undefined;
  getProgramById: (id: string) => Program | undefined;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, moduleId: string, instanceId?: string) => void;
  cohorts: Cohort[];
  activeCohorts: Cohort[];
  selectedSemester: AbsoluteSemester;
  setSelectedSemester: (semester: AbsoluteSemester) => void;
  semesters: AbsoluteSemester[];
  onSelectGroup: (cohortId: string) => void;
  onUpdateCohort: (cohortId: string, updates: Partial<Cohort>) => void;
  modules: Module[];
  programs: Program[];
  onUpdateModule: (moduleId: string, field: keyof Module, value: any) => void;
  onAddModule: (module: Module, programIds: string[]) => void;
  onDeleteModule: (moduleId: string) => void;
  isHeatmapVisible: boolean;
  onToggleHeatmap: () => void;
  onToggleModuleLock: (cohortId: string, instanceId: string) => void;
  onTogglePastLock: (cohortId: string) => void;
  onToggleCategoryLock: (cohortId: string, category: string) => void;
  activeBulkLocks: { [groupId: string]: { past: boolean; categories: Set<string> } };
  finalLockedModulesMap: Map<string, Set<string>>;
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddCohort: (newCohort: Cohort, saveAsTemplate?: boolean) => boolean;
  onUpdateProgram: (programId: string, updates: Partial<Program>) => void;
  lang?: keyof typeof TRANSLATIONS;
  catalogs?: Catalogs;
  onUpdateCatalogs?: (catalogs: Catalogs) => void;
  users?: User[];
  rooms?: Room[];
  onUpdateRoom?: (roomId: string, updates: Partial<Room>) => void;
  onAddRoom?: (room: Room) => void;
  onDeleteRoom?: (roomId: string) => void;
  systemSettings?: SystemSettings;
  onUpdateSystemSettings?: (settings: SystemSettings) => void;
  academicCalendar?: AcademicCalendar;
  onUpdateAcademicCalendar?: (calendar: AcademicCalendar) => void;
  roomAssignments?: RoomAssignment[];
  onUpdateRoomAssignments?: (assignments: RoomAssignment[]) => void;
}

export const PlannerBoard: React.FC<PlannerBoardProps> = ({
  mainCategory,
  viewMode,
  onDrop,
  getModuleById,
  getProgramById,
  onDragStart,
  cohorts,
  activeCohorts,
  selectedSemester,
  setSelectedSemester,
  semesters,
  onSelectGroup,
  onUpdateCohort,
  modules,
  programs,
  onUpdateModule,
  onAddModule,
  onDeleteModule,
  isHeatmapVisible,
  onToggleHeatmap,
  onToggleModuleLock,
  onTogglePastLock,
  onToggleCategoryLock,
  activeBulkLocks,
  finalLockedModulesMap,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddCohort,
  onUpdateProgram,
  lang = DEFAULT_LANGUAGE,
  catalogs,
  onUpdateCatalogs,
  users = [],
  rooms = [],
  onUpdateRoom = () => { },
  onAddRoom = () => { },
  onDeleteRoom = () => { },
  systemSettings,
  onUpdateSystemSettings,
  academicCalendar,
  onUpdateAcademicCalendar,
  roomAssignments = [],
  onUpdateRoomAssignments = () => { },
}) => {
  const t = TRANSLATIONS[lang];

  if (mainCategory !== 'semester-plan' && mainCategory !== 'modules' && mainCategory !== 'lecturers' && mainCategory !== 'rooms' && mainCategory !== 'user-management' && mainCategory !== 'settings' && mainCategory !== 'examinations') {
    return <PlaceholderPage title={t.navigation[mainCategory.replace(/-./g, x => x[1].toUpperCase()) as keyof typeof t.navigation] || mainCategory} />;
  }

  if (viewMode === 'modules') {
    return <ModuleOverview
      modules={modules}
      programs={programs}
      onUpdateModule={onUpdateModule}
      onAddModule={onAddModule}
      onDeleteModule={onDeleteModule}
      onUpdateModulePrograms={(moduleId, programId, isAssigned) => {
        const program = programs.find(p => p.id === programId);
        if (!program) return;
        const newModuleIds = isAssigned
          ? [...program.moduleIds, moduleId]
          : program.moduleIds.filter(id => id !== moduleId);
        onUpdateProgram(programId, { moduleIds: newModuleIds });
      }}
      categories={categories}
      onAddCategory={onAddCategory}
      onUpdateCategory={onUpdateCategory}
      onDeleteCategory={onDeleteCategory}
      catalogs={catalogs}
      lang={lang}
    />;
  }

  if (mainCategory === 'modules') {
    return <ModuleDetailView
      modules={modules}
      programs={programs}
      onUpdateModule={onUpdateModule}
      lang={lang}
      catalogs={catalogs}
      users={users}
      categories={categories}
    />;
  }

  if (viewMode === 'semester') {
    return <SemesterOverview
      cohorts={cohorts}
      getModuleById={getModuleById}
      programs={programs}
      selectedSemester={selectedSemester}
      setSelectedSemester={setSelectedSemester}
      semesters={semesters}
      onSelectGroup={onSelectGroup}
      modules={modules}
      lang={lang}
    />
  }

  if (viewMode === 'optimization') {
    return <OptimizationPanel
      cohorts={cohorts}
      modules={modules}
      programs={programs}
      finalLockedModulesMap={finalLockedModulesMap}
      lang={lang}
    />
  }

  if (viewMode === 'exam-transcript') {
    return <PlaceholderPage title={t.examinations?.transcript || 'Transcript'} />;
  }

  if (viewMode === 'exam-grading') {
    return <PlaceholderPage title={t.examinations?.grading || 'Grading'} />;
  }

  if (viewMode === 'exam-admin') {
    return <PlaceholderPage title={t.examinations?.admin || 'Exam Administration'} />;
  }

  if (viewMode === 'exam-schedule') {
    return <PlaceholderPage title={t.examinations?.schedule || 'Exam Schedule'} />;
  }

  if (viewMode === 'lecturer-overview') {
    return <PlaceholderPage title={t.lecturers?.overview || 'Lecturer Overview'} />;
  }

  if (viewMode === 'availability') {
    return <PlaceholderPage title={t.lecturers?.availability || 'Availability'} />;
  }

  if (viewMode === 'room-overview') {
    return <RoomOverview
      rooms={rooms}
      onUpdateRoom={onUpdateRoom}
      onAddRoom={onAddRoom}
      onDeleteRoom={onDeleteRoom}
      lang={lang}
    />;
  }

  if (viewMode === 'room-occupancy') {
    return <RoomOccupancy
      rooms={rooms}
      modules={modules}
      cohorts={cohorts}
      roomAssignments={roomAssignments}
      onUpdateRoomAssignments={onUpdateRoomAssignments}
      lang={lang}
    />;
  }

  if (viewMode === 'room-availability') {
    return <RoomAvailability
      rooms={rooms}
      onUpdateRoom={onUpdateRoom}
      lang={lang}
    />;
  }

  if (viewMode === 'user-profile') {
    return <PlaceholderPage title={t.userManagement?.profile || 'Profile'} />;
  }

  if (viewMode === 'user-groups') {
    return <PlaceholderPage title={t.userManagement?.groups || 'User Groups'} />;
  }

  if (viewMode === 'settings-general') {
    return <SettingsGeneral
      systemSettings={systemSettings}
      onUpdateSystemSettings={onUpdateSystemSettings}
      lang={lang}
    />;
  }

  if (viewMode === 'settings-calendar') {
    return <SettingsCalendar
      academicCalendar={academicCalendar}
      onUpdateAcademicCalendar={onUpdateAcademicCalendar}
      lang={lang}
    />;
  }

  if (viewMode === 'settings-variables') {
    return <SettingsVariables
      catalogs={catalogs}
      onUpdateCatalogs={onUpdateCatalogs}
      categories={categories}
      onAddCategory={onAddCategory}
      onUpdateCategory={onUpdateCategory}
      onDeleteCategory={onDeleteCategory}
      lang={lang}
    />;
  }

  // viewMode === 'group'
  const activeGruppe = activeCohorts[0];

  if (!activeGruppe) {
    // This view is now shown by default with the first group, 
    // but as a fallback, we can show the semester overview.
    return <SemesterOverview
      cohorts={cohorts}
      getModuleById={getModuleById}
      programs={programs}
      selectedSemester={selectedSemester}
      setSelectedSemester={setSelectedSemester}
      semesters={semesters}
      onSelectGroup={onSelectGroup}
      modules={modules}
      lang={lang}
    />
  }

  const program = getProgramById(activeGruppe.programId);
  if (!program) return null;

  return (
    <div className="h-full flex flex-col">
      <ProgramPlannerGrid
        key={activeGruppe.id}
        cohort={activeGruppe}
        program={program}
        allPrograms={programs}
        allModules={modules}
        onDrop={onDrop}
        getModuleById={getModuleById}
        onDragStart={onDragStart}
        onUpdateCohort={onUpdateCohort}
        allCohorts={cohorts}
        onSelectGroup={onSelectGroup}
        isHeatmapVisible={isHeatmapVisible}
        onToggleHeatmap={onToggleHeatmap}
        selectedSemester={selectedSemester}
        onToggleModuleLock={onToggleModuleLock}
        onTogglePastLock={onTogglePastLock}
        onToggleCategoryLock={onToggleCategoryLock}
        activeBulkLocks={activeBulkLocks[activeGruppe.id]}
        finalLockedInstances={finalLockedModulesMap.get(activeGruppe.id) || new Set()}
        onAddCohort={onAddCohort}
        onUpdateProgram={onUpdateProgram}
        lang={lang}
        allSemesters={semesters}
      />
    </div>
  );
};
