

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
    onAddStudiengruppe: (newStudiengruppe: Studiengruppe) => boolean;
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
}

const GridCell: React.FC<GridCellProps> = ({ onDrop, onDragOver, onDragLeave, children, isHighlighted, heatmapColor, tooltip, validationStatus }) => {
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
    
    const baseClasses = 'p-1 border-t border-r border-border transition-colors duration-200 align-middle h-10';
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
            className={`${baseClasses} ${stateClass}`}
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
    const categoryMap = new Map<string, Module[]>();
    
    program.moduleIds.forEach(moduleId => {
        const module = allModules.find(m => m.id === moduleId);
        if (module) {
            if (!categoryMap.has(module.category)) {
                categoryMap.set(module.category, []);
            }
            categoryMap.get(module.category)!.push(module);
        }
    });

    const categoryOrder = program.categoryOrder || [...categoryMap.keys()];

    return categoryOrder
        .map(categoryName => ({
            category: categoryName,
            modules: categoryMap.get(categoryName) || [],
        }))
        .filter(group => group.modules.length > 0);

  }, [allModules, program]);

  const validateModulePlacement = useCallback((moduleId: string, instanceId: string, semesterId: string, plan: Studiengruppe['plan']): string[] => {
      const module = getModuleById(moduleId);
      if (!module) return [];
      
      const errors: string[] = [];
      const currentSemesterIndex = RELATIVE_SEMESTERS.findIndex(s => s.id === semesterId);
      const currentSemesterNumber = currentSemesterIndex + 1;

      // 1. Check forbidden semesters
      if (module.forbiddenSemesters?.includes(currentSemesterNumber)) {
          errors.push(`Darf nicht im ${currentSemesterNumber}. Semester liegen.`);
      }

      // 2. Check prerequisites are met
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

      // 3. Check that this module does not violate other modules' prerequisites
      const allProgramModuleIds = program.moduleIds;
      for (const otherModuleId of allProgramModuleIds) {
          const otherModule = getModuleById(otherModuleId);
          if (otherModule?.prerequisites?.includes(moduleId)) { // If 'otherModule' requires the module we are checking
              // Find where 'otherModule' is placed
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
      const isPraktikum = (moduleInstanceIds as string[]).includes('Prkt');
      
      return { id: semester.id, name: semester.name, totalCP, totalSWS, totalWorkload, isPraktikum };
    });
  }, [getModuleById, program.semesters, studiengruppe.plan]);

  const curriedOnDrop = (semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => {
      onDrop(studiengruppe.id, semesterId, targetModuleId, e);
  }

  const handleRemoveModuleFromProgram = (moduleId: string) => {
      if (window.confirm(`Möchten Sie das Modul "${moduleId}" wirklich aus diesem Studiengang entfernen? Es wird aus dem Plan dieser Gruppe und der Modulliste des Studiengangs gelöscht.`)) {
          // Remove from program moduleIds
          onUpdateProgram(program.id, {
              moduleIds: program.moduleIds.filter(id => id !== moduleId)
          });

          // Remove all instances from current studiengruppe plan
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

    if (!destination) return;
    
    // Reordering categories
    if (type === 'CATEGORY') {
        const newCategoryOrder = Array.from(program.categoryOrder || []);
        const [removed] = newCategoryOrder.splice(source.index, 1);
        newCategoryOrder.splice(destination.index, 0, removed);
        onUpdateProgram(program.id, { categoryOrder: newCategoryOrder });
        return;
    }

    // Reordering modules within or between categories
    if (type === 'MODULE') {
        const sourceCategoryIndex = parseInt(source.droppableId, 10);
        const destCategoryIndex = parseInt(destination.droppableId, 10);

        const sourceCategory = orderedGroupedModules[sourceCategoryIndex];
        const destCategory = orderedGroupedModules[destCategoryIndex];
        
        const sourceModule = sourceCategory.modules[source.index];

        // If moved within the same category
        if (sourceCategoryIndex === destCategoryIndex) {
            const newModuleIds = Array.from(sourceCategory.modules.map(m => m.id));
            const [removed] = newModuleIds.splice(source.index, 1);
            newModuleIds.splice(destination.index, 0, removed);

            const newProgramModuleIds = program.moduleIds.filter(id => !newModuleIds.includes(id));
            
            let anchorIndex = -1;
            if(sourceCategory.modules.length > 0) {
              anchorIndex = newProgramModuleIds.findIndex(id => id === sourceCategory.modules[0].id);
            }
            
            if (anchorIndex !== -1) {
              newProgramModuleIds.splice(anchorIndex, 0, ...newModuleIds);
            } else {
               newProgramModuleIds.push(...newModuleIds);
            }
            onUpdateProgram(program.id, {moduleIds: newProgramModuleIds});


        } else { // Moved to a different category
            const newProgramModuleIds = Array.from(program.moduleIds);
            const sourceModuleId = sourceModule.id;
            
            // Remove from old position
            const oldIndex = newProgramModuleIds.findIndex(id => id === sourceModuleId);
            if (oldIndex > -1) newProgramModuleIds.splice(oldIndex, 1);

            // Find new position
            let newIndex;
            if (destCategory.modules.length === 0) {
              // find the category before it and put it after its last module
              let lastModuleOfPrevCat: string | undefined = undefined;
              for(let i=destCategoryIndex-1; i >= 0; i--) {
                const modules = orderedGroupedModules[i].modules;
                if(modules.length > 0) {
                  lastModuleOfPrevCat = modules[modules.length-1].id;
                  break;
                }
              }
              if(lastModuleOfPrevCat) {
                newIndex = newProgramModuleIds.findIndex(id => id === lastModuleOfPrevCat) + 1;
              } else {
                newIndex = 0; // if no previous category with modules, put at start
              }

            } else {
              const anchorModuleId = destination.index > 0 
                ? destCategory.modules[destination.index - 1].id 
                : destCategory.modules[0].id;
              
              newIndex = newProgramModuleIds.findIndex(id => id === anchorModuleId);
              if (destination.index > 0) newIndex++;
            }
            
            newProgramModuleIds.splice(newIndex, 0, sourceModuleId);
            onUpdateProgram(program.id, {moduleIds: newProgramModuleIds});
        }
    }
  };
    
  return (
    <div className="bg-card rounded-lg shadow-md h-full flex flex-col border border-border" onDragEnd={handleDragEndLocal}>
       <PlannerControls 
            studiengruppe={studiengruppe}
            program={program}
            onUpdateStudiengruppe={onUpdateStudiengruppe}
            allStudiengruppen={allStudiengruppen}
            onSelectGroup={onSelectGroup}
            isHeatmapVisible={isHeatmapVisible}
            onToggleHeatmap={onToggleHeatmap}
            totalCp={0}
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
                  <thead>
                      <tr className="sticky top-0 z-10 bg-card/75 backdrop-blur-sm">
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
                          <tbody ref={provided.innerRef} {...provided.droppableProps} className="bg-card">
                              {orderedGroupedModules.map(({ category, modules: categoryModules }, index) => (
                                  <Draggable key={category} draggableId={category} index={index}>
                                  {(provided, snapshot) => (
                                  <React.Fragment>
                                      <tr ref={provided.innerRef} {...provided.draggableProps} className={`${snapshot.isDragging ? 'bg-accent/30' : 'bg-muted/20'}`}>
                                          <td colSpan={1 + program.semesters} className="p-1.5 font-bold text-foreground text-left sticky left-0 z-10 flex items-center justify-between" style={{...provided.draggableProps.style}}>
                                              <div className="flex items-center">
                                                  <span {...provided.dragHandleProps} className="cursor-grab p-1"><GripVertical size={14}/></span>
                                                  <span>{category}</span>
                                              </div>
                                              <button onClick={() => onToggleCategoryLock(studiengruppe.id, category)} className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground" title={activeBulkLocks?.categories.has(category) ? "Bereich entsperren" : "Bereich sperren"}>
                                                 {activeBulkLocks?.categories.has(category) ? <LockIcon /> : <UnlockIcon />}
                                              </button>
                                          </td>
                                      </tr>
                                      <Droppable droppableId={String(index)} type="MODULE">
                                          {(provided) => (
                                              <React.Fragment>
                                                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                                                  {categoryModules.map((module, moduleIndex) => (
                                                  <Draggable key={module.id} draggableId={module.id} index={moduleIndex}>
                                                      {(provided, snapshot) => (
                                                      <tr ref={provided.innerRef} {...provided.draggableProps} className={`${snapshot.isDragging ? 'bg-accent/20' : ''}`}>
                                                          <td className="sticky left-0 p-1 font-medium bg-card border-t border-r border-border w-64 align-middle text-foreground" style={{...provided.draggableProps.style}}>
                                                              <div className="flex items-center group">
                                                                  <span {...provided.dragHandleProps} className="cursor-grab p-1 text-muted-foreground"><GripVertical size={14}/></span>
                                                                  <span className="text-muted-foreground font-code w-10 flex-shrink-0">{module.id}</span>
                                                                  <span className="pl-2 flex-grow">{module.name}</span>
                                                                  <Button
                                                                      variant="ghost"
                                                                      size="icon"
                                                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                                                      onClick={() => handleRemoveModuleFromProgram(module.id)}
                                                                      title={`Modul "${module.name}" aus Studiengang entfernen`}
                                                                  >
                                                                      <Trash2 className="h-4 w-4" />
                                                                  </Button>
                                                              </div>
                                                          </td>
                                                          {semesterData.map((semester, index) => {
                                                              const plannedInstances = ((studiengruppe.plan.semesters[semester.id] || []) as string[]).filter(
                                                                  (id) => module.type === 'Pool' ? id.startsWith(`${module.id}-`) : id === module.id
                                                              );
                                                              
                                                              const absoluteSemester = getAbsoluteSemesterFor(studiengruppe.startSemester, index);
                                                              
                                                              const participantInfo = absoluteSemester && isHeatmapVisible
                                                                  ? participantMap.get(absoluteSemester.id)?.get(module.id) || []
                                                                  : [];
                                                              const participantCount = participantInfo.reduce((sum, info) => sum + info.studentCount, 0);
                                                              const heatmapColor = isHeatmapVisible ? getHeatmapColor(participantCount) : undefined;
                                                              const tooltipText = isHeatmapVisible && participantInfo.length > 0
                                                                  ? `Gesamt: ${participantCount} Studierende\n${participantInfo.map(info => `- ${info.name}: ${info.studentCount}`).join('\n')}`
                                                                  : undefined;

                                                              return (
                                                                  <GridCell 
                                                                      key={`${module.id}-${semester.id}`} 
                                                                      onDrop={(e) => curriedOnDrop(semester.id, module.id, e)} 
                                                                      onDragOver={() => {}}
                                                                      onDragLeave={() => {}}
                                                                      isHighlighted={semester.isPraktikum}
                                                                      heatmapColor={heatmapColor}
                                                                      tooltip={tooltipText}
                                                                      validationStatus={getValidationStatusForDrop(semester.id)}
                                                                  >
                                                                      {plannedInstances.map(instanceId => {
                                                                          const instanceModule = getModuleById(instanceId);
                                                                          if (!instanceModule) return null;
                                                                          const errors = placementErrors.get(instanceId) || [];
                                                                          const cardContainerClass = plannedInstances.length > 1
                                                                              ? "w-8 h-8 flex-shrink-0"
                                                                              : "w-full h-full";

                                                                          return (
                                                                              <div key={instanceId} className={cardContainerClass}>
                                                                                  <ModuleCard
                                                                                      module={instanceModule}
                                                                                      instanceId={instanceId}
                                                                                      onDragStart={handleDragStartLocal}
                                                                                      isDraggable={true}
                                                                                      hasError={errors.length > 0}
                                                                                      errorTooltip={errors.join('\n')}
                                                                                      isLocked={finalLockedInstances.has(instanceId)}
                                                                                      onToggleLock={() => onToggleModuleLock(studiengruppe.id, instanceId)}
                                                                                  />
                                                                              </div>
                                                                          );
                                                                      })}
                                                                  </GridCell>
                                                              )
                                                          })}
                                                      </tr>
                                                      )}
                                                      </Draggable>
                                                  ))}
                                                  {provided.placeholder}
                                                </tbody>
                                              </React.Fragment>
                                          )}
                                      </Droppable>
                                  </React.Fragment>
                                  )}
                                  </Draggable>
                              ))}
                              {provided.placeholder}
                          </tbody>
                      )}
                  </Droppable>
                   <tfoot className="sticky bottom-0 z-10 bg-card/95 backdrop-blur-sm font-bold">
                      <tr>
                          <td colSpan={1} className="sticky left-0 bg-card/95 p-1 text-left text-foreground border-t-2 border-r border-border">CP</td>
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
