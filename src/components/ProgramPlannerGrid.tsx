

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import type { Module, Program, Studiengruppe, AbsoluteSemester, ProgramPlan } from '@/types';
import { ModuleCard } from './ModuleCard';
import { RELATIVE_SEMESTERS, CP_LIMIT_PER_SEMESTER, getAbsoluteSemesterFor, ABSOLUTE_SEMESTERS } from '../constants';
import { LockIcon } from './icons/LockIcon';
import { UnlockIcon } from './icons/UnlockIcon';
import { Button } from './ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { PlannerControls } from './PlannerControls';


type ValidationStatus = 'valid' | 'invalid' | 'neutral';

interface ProgramPlannerGridProps {
    studiengruppe: Studiengruppe;
    program: Program;
    allPrograms: Program[];
    allModules: Module[];
    allStudiengruppen: Studiengruppe[];
    onDrop: (studiengruppeId: string, semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => void;
    getModuleById: (id: string) => Module | undefined;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, moduleId: string, instanceId?: string) => void;
    onUpdateStudiengruppe: (studiengruppeId: string, updates: Partial<Studiengruppe>) => void;
    onSelectGroup: (groupId: string) => void;
    isHeatmapVisible: boolean;
    onToggleHeatmap: () => void;
    selectedSemester: AbsoluteSemester;
    onToggleModuleLock: (studiengruppeId: string, instanceId: string) => void;
    onTogglePastLock: (studiengruppeId: string) => void;
    onToggleCategoryLock: (studiengruppeId: string, category: string) => void;
    activeBulkLocks?: { past: boolean; categories: Set<string> };
    finalLockedInstances: Set<string>;
    onAddStudiengruppe: (newStudiengruppe: Studiengruppe, saveAsTemplate?: boolean) => boolean;
    onUpdateProgram: (programId: string, updates: Partial<Program>) => void;
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

interface GridCellProps {
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  children: React.ReactNode;
  isHighlighted: boolean;
  heatmapColor?: string;
  tooltip?: string;
  validationStatus: ValidationStatus;
  className?: string;
}

const GridCell: React.FC<GridCellProps> = ({ onDrop, onDragOver, onDragLeave, children, isHighlighted, heatmapColor, tooltip, validationStatus, className }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
        onDragOver(e);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        onDrop(e);
        setIsOver(false);
    };
    
    const baseClasses = 'p-1 border-t border-r border-border transition-colors duration-200 align-middle';
    let stateClass = '';
    
    if (isOver) {
        switch(validationStatus) {
            case 'valid': stateClass = 'bg-green-900/60'; break;
            case 'invalid': stateClass = 'bg-red-900/60'; break;
            default: stateClass = 'bg-primary/50'; break;
        }
    } else if (isHighlighted) {
        stateClass = 'bg-teal-900/40';
    }

    const style = stateClass ? {} : (heatmapColor ? { backgroundColor: heatmapColor } : {});

    return (
        <td
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`${baseClasses} ${stateClass} ${className}`}
            style={style}
            title={tooltip}
        >
            <div className="flex items-center justify-start space-x-1 w-full h-full min-h-[32px]">
                {children}
            </div>
        </td>
    );
};

interface ParticipantInfo {
  name: string;
  studentCount: number;
}


export const ProgramPlannerGrid: React.FC<ProgramPlannerGridProps> = ({
    studiengruppe,
    program,
    allPrograms,
    allModules,
    allStudiengruppen,
    onDrop,
    getModuleById,
    onDragStart,
    onUpdateStudiengruppe,
    onSelectGroup,
    isHeatmapVisible,
    onToggleHeatmap,
    selectedSemester,
    onToggleModuleLock,
    onTogglePastLock,
    onToggleCategoryLock,
    activeBulkLocks,
    finalLockedInstances,
    onAddStudiengruppe,
    onUpdateProgram
}) => {
  const [draggedItem, setDraggedItem] = useState<{ moduleId: string, instanceId: string } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const orderedGroupedModules = useMemo(() => {
    const modulesInProgram = program.moduleIds
        .map(id => allModules.find(m => m.id === id))
        .filter((m): m is Module => !!m);

    const categoryMap = new Map<string, Module[]>();
    
    const categoryOrder = program.categoryOrder || [...new Set(modulesInProgram.map(m => m.category))];
    
    categoryOrder.forEach(categoryName => {
        categoryMap.set(categoryName, []);
    });

    modulesInProgram.forEach(module => {
        const canonicalModule = allModules.find(m => m.id === module.id);
        const categoryName = canonicalModule?.category || 'Sonstige';

        if (!categoryMap.has(categoryName)) {
           categoryMap.set(categoryName, []);
        }
        categoryMap.get(categoryName)!.push(module);
    });

    const moduleOrderMap = new Map(program.moduleIds.map((id, index) => [id, index]));
    categoryMap.forEach((modules, category) => {
      modules.sort((a, b) => (moduleOrderMap.get(a.id) ?? Infinity) - (moduleOrderMap.get(b.id) ?? Infinity));
    });

    return categoryOrder
        .map(category => ({
            category,
            modules: categoryMap.get(category) || [],
        }))
        .filter(group => group.modules.length > 0);

  }, [allModules, program.moduleIds, program.categoryOrder]);


  const validateModulePlacement = useCallback((moduleId: string, instanceId: string, semesterId: string, plan: Studiengruppe['plan']): string[] => {
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
      Object.entries(studiengruppe.plan.semesters).forEach(([semesterId, moduleInstanceIds]) => {
          (moduleInstanceIds as string[]).forEach(instanceId => {
              const module = getModuleById(instanceId);
              if (module) {
                  const validationErrors = validateModulePlacement(module.id, instanceId, semesterId, studiengruppe.plan);
                  if (validationErrors.length > 0) {
                      errors.set(instanceId, validationErrors);
                  }
              }
          });
      });
      return errors;
  }, [studiengruppe.plan, getModuleById, validateModulePlacement]);

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
      
      const tempPlan = JSON.parse(JSON.stringify(studiengruppe.plan));
      
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
  }, [allStudiengruppen, allModules, getModuleById, isHeatmapVisible]);

  const semesterData = useMemo(() => {
    return RELATIVE_SEMESTERS.slice(0, program.semesters).map((semester, index) => {
      const moduleInstanceIds = studiengruppe.plan.semesters[semester.id] || [];
      
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
  }, [getModuleById, program.semesters, studiengruppe.plan]);

  const curriedOnDrop = (semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => {
      onDrop(studiengruppe.id, semesterId, targetModuleId, e);
  }

  const handleRemoveModuleFromProgram = (moduleId: string) => {
      if (window.confirm(`Möchten Sie das Modul "${moduleId}" wirklich aus diesem Studiengang entfernen? Es wird aus dem Plan dieser Gruppe und der Modulliste des Studiengangs gelöscht.`)) {
          onUpdateProgram(program.id, {
              moduleIds: program.moduleIds.filter(id => id !== moduleId)
          });

          const newSemesters = { ...studiengruppe.plan.semesters };
          Object.keys(newSemesters).forEach(semId => {
              newSemesters[semId] = newSemesters[semId].filter(instanceId => {
                  const module = getModuleById(instanceId);
                  return module?.id !== moduleId;
              });
          });
          onUpdateStudiengruppe(studiengruppe.id, { plan: { ...studiengruppe.plan, semesters: newSemesters } });
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
            studiengruppe={studiengruppe}
            program={program}
            allPrograms={allPrograms}
            onUpdateStudiengruppe={onUpdateStudiengruppe}
            allStudiengruppen={allStudiengruppen}
            onSelectGroup={onSelectGroup}
            isHeatmapVisible={isHeatmapVisible}
            onToggleHeatmap={onToggleHeatmap}
            selectedSemester={selectedSemester}
            onTogglePastLock={() => onTogglePastLock(studiengruppe.id)}
            onToggleCategoryLock={(cat) => onToggleCategoryLock(studiengruppe.id, cat)}
            activeBulkLocks={activeBulkLocks}
            finalLockedInstances={finalLockedInstances}
            allModules={allModules}
            onAddStudiengruppe={onAddStudiengruppe}
            onUpdateProgram={onUpdateProgram}
        />
        <div className="flex-grow overflow-auto relative">
         {isClient ? (
            <DragDropContext onDragEnd={onDragEnd}>
                <table className="w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-card/75 backdrop-blur-sm">
                        <tr>
                            <th className="sticky left-0 bg-card/75 p-1 text-left font-semibold text-foreground w-64 border-b border-r border-border">Modul</th>
                            {semesterData.map((semester, index) => {
                                const absoluteSemester = getAbsoluteSemesterFor(studiengruppe.startSemester, index);
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
                                                    <td colSpan={1 + program.semesters} className="p-0 border-t border-border">
                                                        <div {...provided.dragHandleProps} className="bg-muted/20 p-1.5 font-bold text-foreground text-left flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <GripVertical size={14} className="cursor-grab" />
                                                                <span className="ml-1">{category}</span>
                                                            </div>
                                                            <button onClick={() => onToggleCategoryLock(studiengruppe.id, category)} className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground" title={activeBulkLocks?.categories.has(category) ? "Bereich entsperren" : "Bereich sperren"}>
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
                                                                const moduleInstances = (studiengruppe.plan.semesters[semester.id] || []).filter(instanceId => getModuleById(instanceId)?.id === module.id);
                                                                const absoluteSemester = getAbsoluteSemesterFor(studiengruppe.startSemester, semIndex);
                                                                const courseId = module.equivalentTo || module.id;
                                                                const participantInfo = absoluteSemester ? participantMap.get(absoluteSemester.id)?.get(courseId) : undefined;
                                                                const totalParticipants = participantInfo?.reduce((sum, p) => sum + p.studentCount, 0) || 0;
                                                                const heatmapColor = isHeatmapVisible ? getHeatmapColor(totalParticipants) : undefined;
                                                                const tooltip = participantInfo?.map(p => `${p.name} (${p.studentCount})`).join('\n');
                                                                const baseModuleId = getModuleById(module.id)?.id;
                                                                const isPool = getModuleById(module.id)?.type === 'Pool';
                                                                const canDrop = baseModuleId && (!isPool || (studiengruppe.plan.semesters[semester.id] || []).every(inst => getModuleById(inst)?.id !== baseModuleId));
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
                                                                                        onToggleLock={() => onToggleModuleLock(studiengruppe.id, instanceId)}
                                                                                        isLocked={isLocked}
                                                                                        hasError={!!errors}
                                                                                        errorTooltip={errors?.join('\n')}
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
                                            <tr style={{display: "none"}} ref={provided.innerRef} {...provided.droppableProps}><td colSpan={program.semesters + 1}>{provided.placeholder}</td></tr>
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

    


