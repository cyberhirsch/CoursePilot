
'use client';

import React, { useMemo } from 'react';
import type { Module, Program, Studiengruppe, AbsoluteSemester } from '@/types';
import { RELATIVE_SEMESTERS, CP_LIMIT_PER_SEMESTER, getAbsoluteSemesterFor } from '@/constants';
import { ModuleCard } from '@/components/ModuleCard';
import { ModuleSidebar } from '@/components/ModuleSidebar';
import { PlannerControls } from '@/components/PlannerControls';

interface ProgramPlannerGridProps {
    studiengruppe: Studiengruppe;
    program: Program;
    modules: Module[];
    onDrop: (studiengruppeId: string, semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => void;
    getModuleById: (id: string) => Module | undefined;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, moduleId: string, instanceId: string) => void;
    onUpdateStudiengruppe: (studiengruppeId: string, updates: Partial<Studiengruppe>) => void;
    allStudiengruppen: Studiengruppe[];
    onSelectGroup: (studiengruppeId: string) => void;
    isHeatmapVisible: boolean;
    onToggleHeatmap: () => void;
    selectedSemester: AbsoluteSemester;
    onToggleModuleLock: (studiengruppeId: string, instanceId: string) => void;
    onTogglePastLock: (studiengruppeId: string) => void;
    onToggleCategoryLock: (studiengruppeId: string, category: string) => void;
    activeBulkLocks: { past: boolean; categories: Set<string> } | undefined;
    finalLockedInstances: Set<string>;
}

const SemesterColumn: React.FC<{
  semester: { id: string; name: string };
  studiengruppe: Studiengruppe;
  getModuleById: (id: string) => Module | undefined;
  onDrop: (studiengruppeId: string, semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, moduleId: string, instanceId: string) => void;
  onToggleModuleLock: (studiengruppeId: string, instanceId: string) => void;
  finalLockedInstances: Set<string>;
  cpSum: number;
  absoluteSemesterName: string | undefined;
  isHeatmapVisible: boolean;
}> = ({ semester, studiengruppe, getModuleById, onDrop, onDragStart, onToggleModuleLock, finalLockedInstances, cpSum, absoluteSemesterName, isHeatmapVisible }) => {

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        const draggedModuleId = e.dataTransfer.getData("moduleId");
        onDrop(studiengruppe.id, semester.id, draggedModuleId, e);
    };

    const moduleInstances = studiengruppe.plan.semesters[semester.id] || [];
    
    const cpExceeded = cpSum > CP_LIMIT_PER_SEMESTER;

    const heatmapIntensity = isHeatmapVisible ? Math.min(1, cpSum / CP_LIMIT_PER_SEMESTER) : 0;
    const heatmapColor = `rgba(239, 68, 68, ${heatmapIntensity * 0.5})`;

    return (
        <div className="flex flex-col gap-2 p-2 rounded-lg bg-card border border-border min-w-[180px]">
            <div className="text-center pb-2 border-b border-border">
                <h3 className="font-semibold text-foreground">{semester.name}</h3>
                <p className={`text-xs ${cpExceeded ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                    {absoluteSemesterName || '...'} | {cpSum} CP
                </p>
            </div>
            <div 
                className="flex-grow min-h-[150px] bg-background/30 rounded-md p-1 transition-colors duration-300"
                style={{ backgroundColor: isHeatmapVisible ? heatmapColor : undefined }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="grid grid-cols-2 gap-1 h-full">
                    {moduleInstances.map((instanceId) => {
                        const module = getModuleById(instanceId);
                        if (!module) return null;

                        return (
                             <div 
                                className="h-16" 
                                key={instanceId}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                    e.stopPropagation();
                                    onDrop(studiengruppe.id, semester.id, instanceId, e);
                                }}
                            >
                                <ModuleCard
                                    module={module}
                                    instanceId={instanceId}
                                    onDragStart={onDragStart}
                                    isDraggable={true}
                                    isLocked={finalLockedInstances.has(instanceId)}
                                    onToggleLock={() => onToggleModuleLock(studiengruppe.id, instanceId)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const ProgramPlannerGrid: React.FC<ProgramPlannerGridProps> = ({
    studiengruppe, program, modules, onDrop, getModuleById, onDragStart, onUpdateStudiengruppe,
    allStudiengruppen, onSelectGroup, isHeatmapVisible, onToggleHeatmap, selectedSemester,
    onToggleModuleLock, onTogglePastLock, onToggleCategoryLock, activeBulkLocks, finalLockedInstances
}) => {
    
    const cpSums = useMemo(() => {
        return RELATIVE_SEMESTERS.reduce((acc, sem) => {
            const moduleIds = studiengruppe.plan.semesters[sem.id] || [];
            const sum = moduleIds.reduce((total, instanceId) => {
                const module = getModuleById(instanceId);
                return total + (module?.cp || 0);
            }, 0);
            acc[sem.id] = sum;
            return acc;
        }, {} as { [key: string]: number });
    }, [studiengruppe.plan.semesters, getModuleById]);

    const totalCp = useMemo(() => Object.values(cpSums).reduce((sum, cp) => sum + cp, 0), [cpSums]);

    return (
        <div className="flex h-full gap-4">
            <ModuleSidebar
                program={program}
                modules={modules}
                plan={studiengruppe.plan}
                onDragStart={onDragStart}
                getModuleById={getModuleById}
            />

            <div className="flex-grow flex flex-col gap-4 min-w-0">
                <PlannerControls
                    studiengruppe={studiengruppe}
                    onUpdateStudiengruppe={onUpdateStudiengruppe}
                    allStudiengruppen={allStudiengruppen}
                    onSelectGroup={onSelectGroup}
                    isHeatmapVisible={isHeatmapVisible}
                    onToggleHeatmap={onToggleHeatmap}
                    totalCp={totalCp}
                    program={program}
                    selectedSemester={selectedSemester}
                    onTogglePastLock={() => onTogglePastLock(studiengruppe.id)}
                    onToggleCategoryLock={(category) => onToggleCategoryLock(studiengruppe.id, category)}
                    activeBulkLocks={activeBulkLocks}
                    finalLockedInstances={finalLockedInstances}
                    modules={modules}
                />
                
                <div className="flex-grow overflow-x-auto pb-4">
                    <div className="inline-flex gap-4">
                        {RELATIVE_SEMESTERS.slice(0, program.semesters).map((sem, index) => {
                            const absoluteSemester = getAbsoluteSemesterFor(studiengruppe.startSemester, index);
                            return (
                                <SemesterColumn
                                    key={sem.id}
                                    semester={sem}
                                    studiengruppe={studiengruppe}
                                    getModuleById={getModuleById}
                                    onDrop={onDrop}
                                    onDragStart={onDragStart}
                                    onToggleModuleLock={onToggleModuleLock}
                                    finalLockedInstances={finalLockedInstances}
                                    cpSum={cpSums[sem.id] || 0}
                                    absoluteSemesterName={absoluteSemester?.name}
                                    isHeatmapVisible={isHeatmapVisible}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
