
'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { Module, Program, Studiengruppe, AbsoluteSemester } from '@/types';
import { RELATIVE_SEMESTERS, CP_LIMIT_PER_SEMESTER, getAbsoluteSemesterFor, CATEGORY_ORDER } from '@/constants';
import { ModuleCard } from '@/components/ModuleCard';
import { PlannerControls } from '@/components/PlannerControls';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const getHeatmapColor = (count: number): string | undefined => {
    if (count <= 0) return undefined;

    let hue;
    if (count > 22) {
        return 'hsla(300, 80%, 60%, 0.35)'; // Magenta
    }
    if (count >= 20) {
        hue = 120; // Green
    } else if (count >= 10) {
        const percentage = (count - 10) / (20 - 10);
        hue = 60 + percentage * 60; // Yellow to Green
    } else {
        const percentage = (count - 1) / (10 - 1);
        hue = 0 + percentage * 60; // Red to Yellow
    }
    return `hsla(${hue}, 80%, 55%, 0.35)`;
};

interface ParticipantInfo {
  name: string;
  studentCount: number;
}

const DropTargetCell: React.FC<{
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    children?: React.ReactNode;
    heatmapColor?: string;
    tooltip?: string;
}> = ({ onDrop, children, heatmapColor, tooltip }) => {
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const style = heatmapColor ? { backgroundColor: heatmapColor } : {};

    return (
        <td 
            className="p-1 border-t border-r border-border h-20"
            onDragOver={handleDragOver}
            onDrop={onDrop}
            style={style}
            title={tooltip}
        >
            <div className="h-full w-full">
                {children}
            </div>
        </td>
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

    const programModules = useMemo(() => {
        return modules.filter(m => program.moduleIds.includes(m.id));
    }, [modules, program.moduleIds]);
    
    const categorizedModules = useMemo(() => {
        const grouped = programModules.reduce((acc, module) => {
            const category = module.category || 'Unkategorisiert';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(module);
            return acc;
        }, {} as Record<string, Module[]>);

        const orderedGroup: { category: string, modules: Module[] }[] = [];
        const categoryOrder = program.categoryOrder || CATEGORY_ORDER;
        
        categoryOrder.forEach(catName => {
            if (grouped[catName]) {
                orderedGroup.push({ category: catName, modules: grouped[catName].sort((a,b) => a.id.localeCompare(b.id))});
            }
        });
        
        Object.keys(grouped).forEach(catName => {
             if (!categoryOrder.includes(catName)) {
                 orderedGroup.push({ category: catName, modules: grouped[catName].sort((a,b) => a.name.localeCompare(b.name))});
             }
        });

        return orderedGroup;
    }, [programModules, program.categoryOrder]);

    const participantMap = useMemo(() => {
      if (!isHeatmapVisible) return new Map(); 

      const map = new Map<string, Map<string, ParticipantInfo[]>>();
      
      allStudiengruppen.forEach(gruppe => {
          Object.entries(gruppe.plan.semesters).forEach(([relativeSemesterId, moduleInstanceIds]) => {
              const relativeIndex = RELATIVE_SEMESTERS.findIndex(s => s.id === relativeSemesterId);
              if (relativeIndex === -1) return;

              const absoluteSemester = getAbsoluteSemesterFor(gruppe.startSemester, relativeIndex);
              if (!absoluteSemester) return;

              const absoluteSemesterId = absoluteSemester.id;
              if (!map.has(absoluteSemesterId)) {
                  map.set(absoluteSemesterId, new Map<string, ParticipantInfo[]>());
              }
              const semesterMap = map.get(absoluteSemesterId)!;

              (moduleInstanceIds as string[]).forEach(instanceId => {
                  const module = getModuleById(instanceId);
                  if (!module) return;

                  const moduleId = module.id;
                  
                  if (!semesterMap.has(moduleId)) {
                      semesterMap.set(moduleId, []);
                  }
                  const participantList = semesterMap.get(moduleId)!;
                  participantList.push({ name: gruppe.shortName, studentCount: gruppe.studentCount });
              });
          });
      });

      return map;
    }, [allStudiengruppen, getModuleById, isHeatmapVisible]);

    const semesterHeaders = useMemo(() => {
        return RELATIVE_SEMESTERS.slice(0, program.semesters).map((sem, index) => {
            const absoluteSemester = getAbsoluteSemesterFor(studiengruppe.startSemester, index);
            const cpSum = cpSums[sem.id] || 0;
            const cpExceeded = cpSum > CP_LIMIT_PER_SEMESTER;
            const heatmapIntensity = isHeatmapVisible ? Math.min(1, cpSum / CP_LIMIT_PER_SEMESTER) : 0;
            const heatmapColor = `rgba(239, 68, 68, ${heatmapIntensity * 0.5})`;
            
            return {
                ...sem,
                absoluteName: absoluteSemester?.name || '...',
                absoluteId: absoluteSemester?.id,
                cpSum,
                cpExceeded,
                heatmapColor,
            };
        });
    }, [program.semesters, studiengruppe.startSemester, cpSums, isHeatmapVisible]);

    const placedModulesMap = useMemo(() => {
        const map = new Map<string, string>(); // instanceId -> semesterId
        for (const semId in studiengruppe.plan.semesters) {
            for (const instanceId of studiengruppe.plan.semesters[semId]) {
                map.set(instanceId, semId);
            }
        }
        return map;
    }, [studiengruppe.plan]);

    return (
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
            
            <ScrollArea className="flex-grow rounded-lg border border-border bg-card">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="sticky top-0 bg-card z-10 shadow-sm">
                            <th className="p-2 text-left w-[300px] min-w-[300px] font-semibold text-foreground">Modul</th>
                            {semesterHeaders.map(sem => (
                                <th key={sem.id} className="p-2 text-center font-semibold text-foreground border-l border-border" style={{backgroundColor: isHeatmapVisible ? sem.heatmapColor : undefined}}>
                                    {sem.name}
                                    <p className={`text-xs font-normal ${sem.cpExceeded ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                                        {sem.absoluteName}
                                    </p>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {categorizedModules.map(({ category, modules: catModules }) => (
                            <React.Fragment key={category}>
                                <tr className="bg-muted/20">
                                    <td colSpan={1 + semesterHeaders.length} className="p-2 font-bold text-foreground border-t border-border">{category}</td>
                                </tr>
                                {catModules.map(module => (
                                    <tr key={module.id}>
                                        <td className="p-2 border-t border-border flex items-center gap-2">
                                            <span className="text-muted-foreground text-xs w-10 font-code">{module.id}</span>
                                            <span className="text-sm">{module.name}</span>
                                        </td>
                                        {semesterHeaders.map(sem => {
                                            const plannedInstances = (studiengruppe.plan.semesters[sem.id] || []).filter(
                                                (id) => module.type === 'Pool' ? id.startsWith(`${module.id}-`) : id === module.id
                                            );

                                            const droppableModuleId = module.id;

                                            const participantInfo = isHeatmapVisible && sem.absoluteId
                                                ? participantMap.get(sem.absoluteId)?.get(module.id) || []
                                                : [];
                                            const participantCount = participantInfo.reduce((sum, info) => sum + info.studentCount, 0);
                                            const heatmapColor = isHeatmapVisible ? getHeatmapColor(participantCount) : undefined;
                                            
                                            const tooltipText = isHeatmapVisible && participantInfo.length > 0
                                                ? `Gesamt: ${participantCount} Studierende\n${participantInfo.map(info => `- ${info.name}: ${info.studentCount}`).join('\n')}`
                                                : undefined;

                                            return (
                                                <DropTargetCell key={sem.id} onDrop={(e) => onDrop(studiengruppe.id, sem.id, droppableModuleId, e)} heatmapColor={heatmapColor} tooltip={tooltipText}>
                                                    {plannedInstances.map(instanceId => (
                                                        <ModuleCard
                                                            key={instanceId}
                                                            module={module}
                                                            instanceId={instanceId}
                                                            onDragStart={onDragStart}
                                                            isDraggable={true}
                                                            isLocked={finalLockedInstances.has(instanceId)}
                                                            onToggleLock={() => onToggleModuleLock(studiengruppe.id, instanceId)}
                                                        />
                                                    ))}
                                                </DropTargetCell>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </ScrollArea>
        </div>
    );
};
