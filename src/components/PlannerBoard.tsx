
'use client';

import React from 'react';
import type { Module, Program, Cohort, AbsoluteSemester, MainCategory, PlannerViewMode, Category, Catalogs, User, Room, SystemSettings, AcademicCalendar, RoomAssignment, LecturerAvailability as LecturerAvailabilityData, SchedulePlan, CoursePilotData } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';
import { ProgramPlannerGrid } from '@/components/ProgramPlannerGrid';
import { ProgramOverview } from '@/components/ProgramOverview';
import { DepartmentManagement } from '@/components/DepartmentManagement';
import { SemesterOverview } from '@/components/SemesterOverview';
import { ModuleOverview } from '@/components/ModuleOverview';
import { ModuleDetailView } from '@/components/ModuleDetailView';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { RoomOverview } from '@/components/RoomOverview';
import { RoomOccupancy } from '@/components/RoomOccupancy';
import { RoomAvailability } from '@/components/RoomAvailability';
import { SettingsVariables } from '@/components/SettingsVariables';
import { SettingsGeneral } from '@/components/SettingsGeneral';
import { SettingsCalendar } from '@/components/SettingsCalendar';
import { SettingsImport } from '@/components/SettingsImport';
import { LecturerOverview } from '@/components/LecturerOverview';
import { LecturerAvailability as LecturerAvailabilityView } from '@/components/LecturerAvailability';
import { SchedulePlanner } from '@/components/SchedulePlanner';
import { UserManagement } from '@/components/UserManagement';


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
  onAddProgram: (program: Program) => boolean;
  onUpdateProgram: (programId: string, updates: Partial<Program>) => void;
  departments: string[];
  onAddDepartment: (name: string) => boolean;
  onUpdateDepartment: (oldName: string, newName: string) => boolean;
  onDeleteDepartment: (name: string) => boolean;
  lang?: keyof typeof TRANSLATIONS;
  catalogs?: Catalogs;
  onUpdateCatalogs?: (catalogs: Catalogs) => void;
  users?: User[];
  onAddUser?: (user: User) => void;
  onUpdateUser?: (userId: string, updates: Partial<User>) => void;
  onDeleteUser?: (userId: string) => void;
  rooms?: Room[];
  onUpdateRoom?: (roomId: string, updates: Partial<Room>) => void;
  onAddRoom?: (room: Room) => void;
  onDeleteRoom?: (roomId: string) => void;
  systemSettings?: SystemSettings;
  onUpdateSystemSettings?: (settings: SystemSettings) => void;
  academicCalendar?: AcademicCalendar;
  onUpdateAcademicCalendar?: (calendar: AcademicCalendar) => void;
  roomAssignments?: RoomAssignment[];
  onUpdateRoomAssignments?: (assignments: RoomAssignment[], options?: { reconcileSchedule?: boolean }) => void;
  lecturerAvailabilities?: LecturerAvailabilityData[];
  onUpdateLecturerAvailabilities?: (availabilities: LecturerAvailabilityData[]) => void;
  schedulePlan?: SchedulePlan | null;
  onUpdateSchedulePlan?: (plan: SchedulePlan | null) => void;
  onImportData?: (updates: Partial<CoursePilotData>) => void;
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
  onAddProgram,
  onUpdateProgram,
  departments,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  lang = DEFAULT_LANGUAGE,
  catalogs,
  onUpdateCatalogs,
  users = [],
  onAddUser = () => { },
  onUpdateUser = () => { },
  onDeleteUser = () => { },
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
  lecturerAvailabilities = [],
  onUpdateLecturerAvailabilities = () => { },
  schedulePlan = null,
  onUpdateSchedulePlan = () => { },
  onImportData,
}) => {
  const t = TRANSLATIONS[lang];

  if (mainCategory !== 'semester-plan' && mainCategory !== 'departments' && mainCategory !== 'schedule' && mainCategory !== 'modules' && mainCategory !== 'lecturers' && mainCategory !== 'rooms' && mainCategory !== 'user-management' && mainCategory !== 'settings' && mainCategory !== 'examinations') {
    const fallbackKey = String(mainCategory).replace(/-./g, (match: string) => match[1].toUpperCase()) as keyof typeof t.navigation;
    return <PlaceholderPage title={t.navigation[fallbackKey] || String(mainCategory)} />;
  }

  if (viewMode === 'schedule-planner' || mainCategory === 'schedule') {
    return <SchedulePlanner
      modules={modules}
      cohorts={cohorts}
      users={users}
      rooms={rooms}
      selectedSemester={selectedSemester}
      setSelectedSemester={setSelectedSemester}
      semesters={semesters}
      lecturerAvailabilities={lecturerAvailabilities}
      roomAssignments={roomAssignments}
      onUpdateRoomAssignments={onUpdateRoomAssignments}
      schedulePlan={schedulePlan}
      onUpdateSchedulePlan={onUpdateSchedulePlan}
      onUpdateModule={onUpdateModule}
      systemSettings={systemSettings}
      onUpdateSystemSettings={onUpdateSystemSettings}
    />;
  }

  if (viewMode === 'departments' || mainCategory === 'departments') {
    return <DepartmentManagement
      departments={departments}
      modules={modules}
      programs={programs}
      users={users}
      onAddDepartment={onAddDepartment}
      onUpdateDepartment={onUpdateDepartment}
      onDeleteDepartment={onDeleteDepartment}
      lang={lang}
    />;
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
      departments={departments}
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

  if (viewMode === 'programs') {
    return <ProgramOverview
      programs={programs}
      modules={modules}
      cohorts={cohorts}
      onAddProgram={onAddProgram}
      onUpdateProgram={onUpdateProgram}
      departments={departments}
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
    return <LecturerOverview
      users={users}
      modules={modules}
      schedulePlan={schedulePlan}
      lecturerAvailabilities={lecturerAvailabilities}
      onUpdateLecturerAvailabilities={onUpdateLecturerAvailabilities}
      systemSettings={systemSettings}
    />;
  }

  if (viewMode === 'availability') {
    return <LecturerAvailabilityView
      users={users}
      lecturerAvailabilities={lecturerAvailabilities}
      onUpdateLecturerAvailabilities={onUpdateLecturerAvailabilities}
      schedulePlan={schedulePlan}
      systemSettings={systemSettings}
    />;
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
    return <UserManagement
      users={users}
      cohorts={cohorts}
      onAddUser={onAddUser}
      onUpdateUser={onUpdateUser}
      onDeleteUser={onDeleteUser}
      departments={departments}
      mode="profile"
    />;
  }

  if (viewMode === 'user-groups') {
    return <UserManagement
      users={users}
      cohorts={cohorts}
      onAddUser={onAddUser}
      onUpdateUser={onUpdateUser}
      onDeleteUser={onDeleteUser}
      departments={departments}
      mode="groups"
    />;
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

  if (viewMode === 'settings-import') {
    return <SettingsImport
      currentData={{
        modules,
        programs,
        cohorts,
        categories,
        catalogs,
        users,
        rooms,
        roomAssignments,
        systemSettings,
        academicCalendar,
        lecturerAvailabilities,
        schedulePlan,
      }}
      onImportData={onImportData}
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
        onAddProgram={onAddProgram}
        onUpdateProgram={onUpdateProgram}
        departments={departments}
        lang={lang}
        allSemesters={semesters}
      />
    </div>
  );
};
