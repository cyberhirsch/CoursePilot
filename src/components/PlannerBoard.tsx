'use client';

import React from 'react';
import type { Module, Program, Studiengruppe, AbsoluteSemester, MainCategory, PlannerViewMode, Category } from '@/types';
import { ProgramPlannerGrid } from '@/components/ProgramPlannerGrid';
import { SemesterOverview } from '@/components/SemesterOverview';
import { ModuleOverview } from '@/components/ModuleOverview';
import { OptimizationPanel } from '@/components/OptimizationPanel';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { ProgramEditor } from '@/components/ProgramEditor';


interface PlannerBoardProps {
  mainCategory: MainCategory;
  viewMode: PlannerViewMode;
  onDrop: (studiengruppeId: string, semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => void;
  getModuleById: (id: string) => Module | undefined;
  getProgramById: (id: string) => Program | undefined;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, moduleId: string, instanceId?: string) => void;
  studiengruppen: Studiengruppe[];
  activeStudiengruppen: Studiengruppe[];
  selectedSemester: AbsoluteSemester;
  setSelectedSemester: (semester: AbsoluteSemester) => void;
  semesters: AbsoluteSemester[];
  onSelectGroup: (studiengruppeId: string) => void;
  onUpdateStudiengruppe: (studiengruppeId: string, updates: Partial<Studiengruppe>) => void;
  modules: Module[];
  programs: Program[];
  onUpdateModule: (moduleId: string, field: keyof Module, value: any) => void;
  onAddModule: (module: Module, programIds: string[]) => void;
  onDeleteModule: (moduleId: string) => void;
  onUpdateModulePrograms: (moduleId: string, programIds: string[]) => void;
  onAddProgram: (program: Program) => void;
  onUpdateProgram: (programId: string, updates: Partial<Program>) => void;
  onDeleteProgram: (programId: string) => void;
  isHeatmapVisible: boolean;
  onToggleHeatmap: () => void;
  onToggleModuleLock: (studiengruppeId: string, instanceId: string) => void;
  onTogglePastLock: (studiengruppeId: string) => void;
  onToggleCategoryLock: (studiengruppeId: string, category: string) => void;
  activeBulkLocks: { [groupId: string]: { past: boolean; categories: Set<string> } };
  finalLockedModulesMap: Map<string, Set<string>>;
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const PlannerBoard: React.FC<PlannerBoardProps> = ({ 
    mainCategory,
    viewMode,
    onDrop, 
    getModuleById, 
    getProgramById,
    onDragStart,
    studiengruppen,
    activeStudiengruppen,
    selectedSemester,
    setSelectedSemester,
    semesters,
    onSelectGroup,
    onUpdateStudiengruppe,
    modules,
    programs,
    onUpdateModule,
    onAddModule,
    onDeleteModule,
    onUpdateModulePrograms,
    onAddProgram,
    onUpdateProgram,
    onDeleteProgram,
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
}) => {

  if (mainCategory !== 'semesterplan') {
    const titles: Record<MainCategory, string> = {
      semesterplan: 'Semesterplan',
      stundenplan: 'Stundenplan',
      pruefungswesen: 'Prüfungswesen',
      nutzerverwaltung: 'Nutzerverwaltung',
      einstellungen: 'Einstellungen'
    };
    return <PlaceholderPage title={titles[mainCategory]} />;
  }
  
  if (viewMode === 'modules') {
    return <ModuleOverview 
              modules={modules} 
              programs={programs}
              onUpdateModule={onUpdateModule}
              onAddModule={onAddModule}
              onDeleteModule={onDeleteModule}
              onUpdateModulePrograms={onUpdateModulePrograms}
              categories={categories}
              onAddCategory={onAddCategory}
              onUpdateCategory={onUpdateCategory}
              onDeleteCategory={onDeleteCategory}
            />;
  }

  if (viewMode === 'templates') {
    return <ProgramEditor
              programs={programs}
              modules={modules}
              onAddProgram={onAddProgram}
              onUpdateProgram={onUpdateProgram}
              onDeleteProgram={onDeleteProgram}
            />;
  }
  
  if (viewMode === 'semester') {
    return <SemesterOverview 
              studiengruppen={studiengruppen}
              getModuleById={getModuleById}
              programs={programs}
              selectedSemester={selectedSemester}
              setSelectedSemester={setSelectedSemester}
              semesters={semesters}
              onSelectGroup={onSelectGroup}
              modules={modules}
           />
  }
  
  if (viewMode === 'optimization') {
      return <OptimizationPanel 
                studiengruppen={studiengruppen}
                modules={modules}
                programs={programs}
                finalLockedModulesMap={finalLockedModulesMap}
             />
  }

  // viewMode === 'group'
  const activeGruppe = activeStudiengruppen[0];

  if (!activeGruppe) {
    // This view is now shown by default with the first group, 
    // but as a fallback, we can show the semester overview.
     return <SemesterOverview 
              studiengruppen={studiengruppen}
              getModuleById={getModuleById}
              programs={programs}
              selectedSemester={selectedSemester}
              setSelectedSemester={setSelectedSemester}
              semesters={semesters}
              onSelectGroup={onSelectGroup}
              modules={modules}
           />
  }

  const program = getProgramById(activeGruppe.programId);
  if (!program) return null;
  
  return (
    <div className="h-full flex flex-col">
        <ProgramPlannerGrid
            key={activeGruppe.id}
            studiengruppe={activeGruppe}
            program={program}
            modules={modules}
            onDrop={onDrop}
            getModuleById={getModuleById}
            onDragStart={onDragStart}
            onUpdateStudiengruppe={onUpdateStudiengruppe}
            allStudiengruppen={studiengruppen}
            onSelectGroup={onSelectGroup}
            isHeatmapVisible={isHeatmapVisible}
            onToggleHeatmap={onToggleHeatmap}
            selectedSemester={selectedSemester}
            onToggleModuleLock={onToggleModuleLock}
            onTogglePastLock={onTogglePastLock}
            onToggleCategoryLock={onToggleCategoryLock}
            activeBulkLocks={activeBulkLocks[activeGruppe.id]}
            finalLockedInstances={finalLockedModulesMap.get(activeGruppe.id) || new Set()}
        />
    </div>
  );
};
