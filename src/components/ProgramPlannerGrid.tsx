


'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import type { Module, Program, Cohort, AbsoluteSemester, ProgramPlan } from '@/types';
import { ModuleCard } from './ModuleCard';
import { RELATIVE_SEMESTERS, CP_LIMIT_PER_SEMESTER, getAbsoluteSemesterFor } from '../constants';
import { LockIcon } from './icons/LockIcon';
import { UnlockIcon } from './icons/UnlockIcon';
import { Button } from './ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { PlannerControls } from './PlannerControls';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';


import { GridCell, getHeatmapColor, type ValidationStatus } from './planner-grid/GridCell';

interface ProgramPlannerGridProps {
    cohort: Cohort;
    program: Program;
    allPrograms: Program[];
    allModules: Module[];
    allCohorts: Cohort[];
    onDrop: (cohortId: string, semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => void;
    getModuleById: (id: string) => Module | undefined;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, moduleId: string, instanceId?: string) => void;
    onUpdateCohort: (cohortId: string, updates: Partial<Cohort>) => void;
    onSelectGroup: (groupId: string) => void;
    isHeatmapVisible: boolean;
    onToggleHeatmap: () => void;
    selectedSemester: AbsoluteSemester;
    onToggleModuleLock: (cohortId: string, instanceId: string) => void;
    onTogglePastLock: (cohortId: string) => void;
    onToggleCategoryLock: (cohortId: string, category: string) => void;
    activeBulkLocks?: { past: boolean; categories: Set<string> };
    finalLockedInstances: Set<string>;
    onAddCohort: (newCohort: Cohort, saveAsTemplate?: boolean) => boolean;
    onAddProgram: (program: Program) => boolean;
    onUpdateProgram: (programId: string, updates: Partial<Program>) => void;
    departments: string[];
    lang?: keyof typeof TRANSLATIONS;
    allSemesters: AbsoluteSemester[];
}

interface ParticipantInfo {
    name: string;
    studentCount: number;
}


export const ProgramPlannerGrid: React.FC<ProgramPlannerGridProps> = ({
    cohort,
    program,
    allPrograms,
    allModules,
    allCohorts,
    onDrop,
    getModuleById,
    onDragStart,
    onUpdateCohort,
    onSelectGroup,
    isHeatmapVisible,
    onToggleHeatmap,
    selectedSemester,
    onToggleModuleLock,
    onTogglePastLock,
    onToggleCategoryLock,
    activeBulkLocks,
    finalLockedInstances,
    onAddCohort,
    onAddProgram,
    onUpdateProgram,
    departments,
    lang = DEFAULT_LANGUAGE,
    allSemesters = []
}) => {
    const t = TRANSLATIONS[lang];

    if (!selectedSemester) {
        return <div className="p-12 text-center italic opacity-50">Lade Planungsdaten...</div>;
    }

    const [draggedItem, setDraggedItem] = useState<{ moduleId: string, instanceId: string } | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const orderedGroupedModules = useMemo(() => {
        const modulesInProgram = program.moduleIds
            .map((id: string) => allModules.find(m => m.id === id))
            .filter((m): m is Module => !!m);

        const categoryMap = new Map<string, Module[]>();

        const categoryOrder = program.categoryOrder || [...new Set(modulesInProgram.map(m => m.category))];

        categoryOrder.forEach(categoryName => {
            categoryMap.set(categoryName, []);
        });

        modulesInProgram.forEach((module: Module) => {
            const canonicalModule = allModules.find((m: Module) => m.id === module.id);
            const categoryName = canonicalModule?.category || 'Sonstige';

            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, []);
            }
            categoryMap.get(categoryName)!.push(module);
        });

        const moduleOrderMap = new Map(program.moduleIds.map((id: string, index: number) => [id, index]));
        categoryMap.forEach((modules: Module[], category: string) => {
            modules.sort((a, b) => ((moduleOrderMap.get(a.id) as number) ?? Infinity) - ((moduleOrderMap.get(b.id) as number) ?? Infinity));
        });

        return categoryOrder
            .map((category: string) => ({
                category,
                modules: categoryMap.get(category) || [],
            }))
            .filter((group: { modules: Module[] }) => group.modules.length > 0);

    }, [allModules, program.moduleIds, program.categoryOrder]);


    const validateModulePlacement = useCallback((moduleId: string, instanceId: string, semesterId: string, plan: Cohort['plan']): string[] => {
        const module = getModuleById(moduleId);
        if (!module) return [];

        const errors: string[] = [];
        const currentSemesterIndex = RELATIVE_SEMESTERS.findIndex(s => s.id === semesterId);
        const currentSemesterNumber = currentSemesterIndex + 1;

        if (module.forbiddenSemesters?.includes(currentSemesterNumber)) {
            errors.push(`Darf nicht im ${currentSemesterNumber}. Semester liegen.`);
        }

        if (module.prerequisites && module.prerequisites.length > 0) {
            for (const prereqId of module.prerequisites) {
                let isMet = false;
                for (let i = 0; i < currentSemesterIndex; i++) {
                    const checkingSemId = RELATIVE_SEMESTERS[i].id;
                    const moduleIdsInSem = plan.semesters[checkingSemId] || [];
                    const baseModuleIdsInSem = moduleIdsInSem.map(id => getModuleById(id)?.id);
                    if (baseModuleIdsInSem.includes(prereqId)) {
                        isMet = true;
                        break;
                    }
                }
                if (!isMet) {
                    const prereqModule = getModuleById(prereqId);
                    errors.push(`Voraussetzung "${prereqModule?.name || prereqId}" nicht erfüllt.`);
                }
            }
        }

        const allProgramModuleIds = program.moduleIds;
        for (const otherModuleId of allProgramModuleIds) {
            const otherModule = getModuleById(otherModuleId);
            if (otherModule?.prerequisites?.includes(moduleId)) {
                for (const [otherSemId, otherModuleIds] of Object.entries(plan.semesters)) {
                    if ((otherModuleIds as string[]).includes(otherModuleId)) {
                        const otherSemesterIndex = RELATIVE_SEMESTERS.findIndex(s => s.id === otherSemId);
                        if (currentSemesterIndex >= otherSemesterIndex) {
                            errors.push(`Muss vor Modul "${otherModule.name}" platziert werden.`);
                        }
                        break;
                    }
                }
            }
        }

        return errors;
    }, [getModuleById, program.moduleIds]);


    const placementErrors = useMemo(() => {
        const errors = new Map<string, string[]>();
        Object.entries(cohort.plan.semesters).forEach(([semesterId, moduleInstanceIds]) => {
            (moduleInstanceIds as string[]).forEach(instanceId => {
                const module = getModuleById(instanceId);
                if (module) {
                    const validationErrors = validateModulePlacement(module.id, instanceId, semesterId, cohort.plan);
                    if (validationErrors.length > 0) {
                        errors.set(instanceId, validationErrors);
                    }
                }
            });
        });
        return errors;
    }, [cohort.plan, getModuleById, validateModulePlacement]);

    const handleDragStartLocal = (e: React.DragEvent<HTMLDivElement>, moduleId: string, instanceId: string) => {
        setDraggedItem({ moduleId, instanceId });
        if (onDragStart) {
            onDragStart(e, moduleId, instanceId);
        }
    };

    const handleDragEndLocal = () => {
        setDraggedItem(null);
    };

    const getValidationStatusForDrop = (targetSemesterId: string): ValidationStatus => {
        if (!draggedItem) return 'neutral';

        const tempPlan = JSON.parse(JSON.stringify(cohort.plan));

        for (const semId in tempPlan.semesters) {
            tempPlan.semesters[semId] = tempPlan.semesters[semId].filter((id: string) => id !== draggedItem.instanceId);
        }

        if (!tempPlan.semesters[targetSemesterId]) tempPlan.semesters[targetSemesterId] = [];
        tempPlan.semesters[targetSemesterId].push(draggedItem.instanceId);

        const errors = validateModulePlacement(draggedItem.moduleId, draggedItem.instanceId, targetSemesterId, tempPlan);

        return errors.length === 0 ? 'valid' : 'invalid';
    };

    const participantMap = useMemo(() => {
        if (!isHeatmapVisible) return new Map();

        const map = new Map<string, Map<string, ParticipantInfo[]>>();
        const allModulesById = new Map(allModules.map(m => [m.id, m]));

        allCohorts.forEach(gruppe => {
            Object.entries(gruppe.plan.semesters).forEach(([relativeSemesterId, moduleInstanceIds]) => {
                const relativeIndex = RELATIVE_SEMESTERS.findIndex(s => s.id === relativeSemesterId);
                if (relativeIndex === -1) return;

                const absoluteSemester = getAbsoluteSemesterFor(allSemesters, gruppe.startSemester, relativeIndex);
                if (!absoluteSemester) return;

                const absoluteSemesterId = absoluteSemester.id;
                if (!map.has(absoluteSemesterId)) {
                    map.set(absoluteSemesterId, new Map<string, ParticipantInfo[]>());
                }
                const semesterMap = map.get(absoluteSemesterId)!;

                (moduleInstanceIds as string[]).forEach(instanceId => {
                    const module = getModuleById(instanceId);
                    if (!module) return;

                    const courseId = module.equivalentTo || module.id;

                    if (!semesterMap.has(courseId)) {
                        semesterMap.set(courseId, []);
                    }
                    const participantList = semesterMap.get(courseId)!;
                    participantList.push({ name: gruppe.shortName, studentCount: gruppe.studentCount });
                });
            });
        });

        return map;
    }, [allCohorts, allModules, getModuleById, isHeatmapVisible]);

    const semesterData = useMemo(() => {
        return RELATIVE_SEMESTERS.slice(0, cohort.semesters).map((semester, index) => {
            const moduleInstanceIds = cohort.plan.semesters[semester.id] || [];

            const modulesInSemester = (moduleInstanceIds as string[]).map(instanceId => {
                const module = getModuleById(instanceId);
                return module;
            }).filter((m): m is Module => m !== undefined);

            const totalCP = modulesInSemester.reduce((sum, module) => sum + (module.cp || 0), 0);
            const totalSWS = modulesInSemester.reduce((sum, module) => sum + (module.sws || 0), 0);
            const totalWorkload = modulesInSemester.reduce((sum, module) => sum + (module.workload || 0), 0);
            const isPraktikum = (moduleInstanceIds as string[]).some(id => id.startsWith('Prkt'));

            return { id: semester.id, name: semester.name, totalCP, totalSWS, totalWorkload, isPraktikum };
        });
    }, [getModuleById, cohort.semesters, cohort.plan]);

    const curriedOnDrop = (semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => {
        onDrop(cohort.id, semesterId, targetModuleId, e);
    }

    const handleRemoveModuleFromProgram = (moduleId: string) => {
        if (window.confirm(t.planner.deleteConfirm.replace('{name}', moduleId))) {
            onUpdateProgram(program.id, {
                moduleIds: program.moduleIds.filter(id => id !== moduleId)
            });

            const newSemesters = { ...cohort.plan.semesters };
            Object.keys(newSemesters).forEach(semId => {
                newSemesters[semId] = newSemesters[semId].filter(instanceId => {
                    const module = getModuleById(instanceId);
                    return module?.id !== moduleId;
                });
            });
            onUpdateCohort(cohort.id, { plan: { ...cohort.plan, semesters: newSemesters } });
        }
    };

    const onDragEnd: OnDragEndResponder = (result) => {
        const { source, destination, type } = result;

        if (!destination) {
            return;
        }

        if (type === 'CATEGORY') {
            const newCategoryOrder = Array.from(orderedGroupedModules.map(g => g.category));
            const [removed] = newCategoryOrder.splice(source.index, 1);
            newCategoryOrder.splice(destination.index, 0, removed);
            onUpdateProgram(program.id, { categoryOrder: newCategoryOrder });
        } else if (type === 'MODULE') {
            const sourceCategory = orderedGroupedModules.find(g => g.category === source.droppableId);
            const destCategory = orderedGroupedModules.find(g => g.category === destination.droppableId);

            if (!sourceCategory || !destCategory) return;

            const newModuleIds = Array.from(program.moduleIds);
            const movedModuleId = sourceCategory.modules[source.index].id;

            const sourceIndexInProgram = newModuleIds.indexOf(movedModuleId);
            if (sourceIndexInProgram > -1) {
                newModuleIds.splice(sourceIndexInProgram, 1);
            }

            let destIndexInProgram;
            if (destination.index < destCategory.modules.length) {
                const anchorModuleId = destCategory.modules[destination.index].id;
                destIndexInProgram = newModuleIds.indexOf(anchorModuleId);
            } else {
                if (destCategory.modules.length > 0) {
                    const lastModuleId = destCategory.modules[destCategory.modules.length - 1].id;
                    destIndexInProgram = newModuleIds.indexOf(lastModuleId) + 1;
                } else {
                    const destCategoryIndex = orderedGroupedModules.findIndex(g => g.category === destCategory.category);
                    if (destCategoryIndex > 0) {
                        const prevCategory = orderedGroupedModules[destCategoryIndex - 1];
                        if (prevCategory.modules.length > 0) {
                            const lastModuleOfPrevCategory = prevCategory.modules[prevCategory.modules.length - 1].id;
                            destIndexInProgram = newModuleIds.indexOf(lastModuleOfPrevCategory) + 1;
                        } else {
                            destIndexInProgram = 0; // fallback
                        }
                    } else {
                        destIndexInProgram = 0;
                    }
                }
            }

            if (destIndexInProgram > -1) {
                newModuleIds.splice(destIndexInProgram, 0, movedModuleId);
                onUpdateProgram(program.id, { moduleIds: newModuleIds });
            }
        }
    };

    return (
        <div className="bg-card rounded-lg shadow-md h-full flex flex-col border border-border" onDragEnd={handleDragEndLocal}>
            <PlannerControls
                cohort={cohort}
                program={program}
                allPrograms={allPrograms}
                onUpdateCohort={onUpdateCohort}
                allCohorts={allCohorts}
                onSelectGroup={onSelectGroup}
                isHeatmapVisible={isHeatmapVisible}
                onToggleHeatmap={onToggleHeatmap}
                selectedSemester={selectedSemester}
                onTogglePastLock={() => onTogglePastLock(cohort.id)}
                onToggleCategoryLock={(cat) => onToggleCategoryLock(cohort.id, cat)}
                activeBulkLocks={activeBulkLocks}
                finalLockedInstances={finalLockedInstances}
                allModules={allModules}
                onAddCohort={onAddCohort}
                onAddProgram={onAddProgram}
                onUpdateProgram={onUpdateProgram}
                departments={departments}
                lang={lang}
                allSemesters={allSemesters}
            />
            <div className="flex-grow overflow-auto relative">
                {isClient ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <table className="w-full border-collapse text-xs">
                            <thead className="sticky top-0 z-10 bg-card/75 backdrop-blur-sm">
                                <tr>
                                    <th className="sticky left-0 bg-card/75 p-1 text-left font-semibold text-foreground w-64 border-b border-r border-border">{t.navigation.modules}</th>
                                    {semesterData.map((semester, index) => {
                                        const absoluteSemester = getAbsoluteSemesterFor(allSemesters, cohort.startSemester, index);
                                        return (
                                            <th key={semester.id} className={`p-1 text-center font-semibold text-foreground border-b border-r border-border min-w-[70px] ${semester.isPraktikum ? 'bg-teal-900/40' : ''}`}>
                                                <div>{semester.name}</div>
                                                <div className="font-normal text-muted-foreground">{absoluteSemester?.name}</div>
                                            </th>
                                        )
                                    })}
                                </tr>
                            </thead>
                            <Droppable droppableId="categories" type="CATEGORY">
                                {(provided) => (
                                    <tbody ref={provided.innerRef} {...provided.droppableProps}>
                                        {orderedGroupedModules.map(({ category, modules: categoryModules }, categoryIndex) => (
                                            <React.Fragment key={category}>
                                                <Draggable draggableId={category} index={categoryIndex}>
                                                    {(provided) => (
                                                        <tr ref={provided.innerRef} {...provided.draggableProps}>
                                                            <td colSpan={1 + cohort.semesters} className="p-0 border-t border-border">
                                                                <div {...provided.dragHandleProps} className="bg-muted/20 p-1.5 font-bold text-foreground text-left flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <GripVertical size={14} className="cursor-grab" />
                                                                        <span className="ml-1">{category}</span>
                                                                    </div>
                                                                    <button onClick={() => onToggleCategoryLock(cohort.id, category)} className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground" title={activeBulkLocks?.categories.has(category) ? "Bereich entsperren" : "Bereich sperren"}>
                                                                        {activeBulkLocks?.categories.has(category) ? <LockIcon /> : <UnlockIcon />}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Draggable>

                                                <Droppable droppableId={category} type="MODULE">
                                                    {(provided) => (
                                                        <React.Fragment>
                                                            {categoryModules.map((module, moduleIndex) => (
                                                                <Draggable key={module.id} draggableId={module.id} index={moduleIndex}>
                                                                    {(provided) => (
                                                                        <tr ref={provided.innerRef} {...provided.draggableProps} className="hover:bg-muted/60">
                                                                            <td {...provided.dragHandleProps} className="p-1 border-t border-border sticky left-0 bg-card z-10 flex items-center justify-between group w-64">
                                                                                <div className="flex items-center">
                                                                                    <GripVertical size={14} className="cursor-grab" />
                                                                                    <div className="ml-2">
                                                                                        <div className="font-semibold">{module.name}</div>
                                                                                        <div className="text-muted-foreground font-code text-[10px]">{module.id}</div>
                                                                                    </div>
                                                                                </div>
                                                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveModuleFromProgram(module.id)}>
                                                                                    <Trash2 size={14} className="text-destructive" />
                                                                                </Button>
                                                                            </td>
                                                                            {semesterData.map((semester, semIndex) => {
                                                                                const moduleInstances = (cohort.plan.semesters[semester.id] || []).filter(instanceId => getModuleById(instanceId)?.id === module.id);
                                                                                const absoluteSemester = getAbsoluteSemesterFor(allSemesters, cohort.startSemester, semIndex);
                                                                                const courseId = module.equivalentTo || module.id;
                                                                                const participantInfo = absoluteSemester ? participantMap.get(absoluteSemester.id)?.get(courseId) : undefined;
                                                                                const totalParticipants = participantInfo?.reduce((sum: number, p: ParticipantInfo) => sum + p.studentCount, 0) || 0;
                                                                                const heatmapColor = isHeatmapVisible ? getHeatmapColor(totalParticipants) : undefined;
                                                                                const tooltip = participantInfo?.map((p: ParticipantInfo) => `${p.name} (${p.studentCount})`).join('\n');
                                                                                const baseModuleId = getModuleById(module.id)?.id;
                                                                                const isPool = getModuleById(module.id)?.type === 'Pool';
                                                                                const canDrop = baseModuleId && (!isPool || (cohort.plan.semesters[semester.id] || []).every(inst => getModuleById(inst)?.id !== baseModuleId));
                                                                                return (
                                                                                    <GridCell
                                                                                        key={semester.id}
                                                                                        onDrop={(e) => canDrop && curriedOnDrop(semester.id, module.id, e)}
                                                                                        onDragOver={(e) => e.preventDefault()}
                                                                                        onDragLeave={() => { }}
                                                                                        isHighlighted={false}
                                                                                        heatmapColor={heatmapColor}
                                                                                        tooltip={tooltip}
                                                                                        className={semester.isPraktikum ? 'bg-teal-900/40' : ''}
                                                                                        validationStatus={getValidationStatusForDrop(semester.id)}
                                                                                    >
                                                                                        {moduleInstances.map(instanceId => {
                                                                                            const isLocked = finalLockedInstances.has(instanceId);
                                                                                            const errors = placementErrors.get(instanceId);
                                                                                            return (
                                                                                                <div key={instanceId} className="h-full w-full">
                                                                                                    <ModuleCard
                                                                                                        module={module}
                                                                                                        instanceId={instanceId}
                                                                                                        isDraggable={!isLocked}
                                                                                                        onDragStart={(e) => handleDragStartLocal(e, module.id, instanceId)}
                                                                                                        onToggleLock={() => onToggleModuleLock(cohort.id, instanceId)}
                                                                                                        isLocked={isLocked}
                                                                                                        hasError={!!errors}
                                                                                                        errorTooltip={errors?.join('\n')}
                                                                                                        lang={lang}
                                                                                                    />
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </GridCell>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            <tr style={{ display: "none" }} ref={provided.innerRef} {...provided.droppableProps}><td colSpan={cohort.semesters + 1}>{provided.placeholder}</td></tr>
                                                        </React.Fragment>
                                                    )}
                                                </Droppable>

                                            </React.Fragment>
                                        ))}
                                        {provided.placeholder}
                                    </tbody>
                                )}
                            </Droppable>
                            <tfoot className="sticky bottom-0 z-10 bg-card/95 backdrop-blur-sm font-bold">
                                <tr>
                                    <td colSpan={1} className="sticky left-0 bg-card/95 p-1 text-left text-foreground border-t-2 border-r border-border w-64">CP</td>
                                    {semesterData.map((total) => {
                                        const cpWarning = total.totalCP > CP_LIMIT_PER_SEMESTER;
                                        return (
                                            <td key={`${total.id}-cp`} className={`p-1 text-center border-t-2 border-r border-border ${total.isPraktikum ? 'bg-teal-900/40' : ''} ${cpWarning ? 'text-destructive font-extrabold' : 'text-foreground'}`}>
                                                {total.totalCP}
                                            </td>
                                        )
                                    })}
                                </tr>
                                <tr>
                                    <td colSpan={1} className="sticky left-0 bg-card/95 p-1 text-left text-foreground border-t border-r border-border">SWS</td>
                                    {semesterData.map(total => (
                                        <td key={`${total.id}-sws`} className={`p-1 text-center border-t border-r border-border text-foreground ${total.isPraktikum ? 'bg-teal-900/40' : ''}`}>
                                            {total.totalSWS}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td colSpan={1} className="sticky left-0 bg-card/95 p-1 text-left text-foreground border-t border-r border-border">Workload</td>
                                    {semesterData.map(total => (
                                        <td key={`${total.id}-wl`} className={`p-1 text-center border-t border-r border-border text-foreground ${total.isPraktikum ? 'bg-teal-900/40' : ''}`}>
                                            {total.totalWorkload}
                                        </td>
                                    ))}
                                </tr>
                            </tfoot>
                        </table>
                    </DragDropContext>
                ) : null}
            </div>
        </div>
    );
};



