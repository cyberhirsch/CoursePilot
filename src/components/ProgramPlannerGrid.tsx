

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { Module, Program, Studiengruppe, AbsoluteSemester, ProgramPlan } from '@/types';
import { ModuleCard } from './ModuleCard';
import { RELATIVE_SEMESTERS, CP_LIMIT_PER_SEMESTER, getAbsoluteSemesterFor, ABSOLUTE_SEMESTERS, CATEGORY_ORDER } from '../constants';
import { LockIcon } from './icons/LockIcon';
import { UnlockIcon } from './icons/UnlockIcon';
import { Button } from './ui/button';
import { Copy, PlusCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PlannerControls } from './PlannerControls';


type ValidationStatus = 'valid' | 'invalid' | 'neutral';

interface ProgramPlannerGridProps {
    studiengruppe: Studiengruppe;
    program: Program;
    modules: Module[];
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

const DuplicateGroupDialog: React.FC<{
    studiengruppe: Studiengruppe;
    onAddStudiengruppe: (sg: Studiengruppe) => boolean;
}> = ({ studiengruppe, onAddStudiengruppe }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newShortName, setNewShortName] = useState(studiengruppe.shortName + "-Kopie");
    const [newStartSemesterId, setNewStartSemesterId] = useState(studiengruppe.startSemester.id);
    const [error, setError] = useState('');

    const handleSubmit = () => {
        setError('');
        const newId = `${studiengruppe.programId}-${newShortName}`;
        const newStartSemester = ABSOLUTE_SEMESTERS.find(s => s.id === newStartSemesterId);
        
        if (!newStartSemester) {
            setError("Ungültiges Startsemester gewählt.");
            return;
        }

        const newGroup: Studiengruppe = {
            ...studiengruppe,
            id: newId,
            name: `${studiengruppe.name.replace(studiengruppe.shortName, '')} ${newShortName}`,
            shortName: newShortName,
            startSemester: newStartSemester,
            userLockedModules: [] // Start with no locks
        };

        const success = onAddStudiengruppe(newGroup);
        if (success) {
            setIsOpen(false);
        } else {
            setError(`Eine Gruppe mit der ID "${newId}" existiert bereits.`);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="outline" size="sm">
                    <Copy className="mr-2" />
                    Gruppe duplizieren
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Studiengruppe duplizieren</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shortName" className="text-right">Kürzel</Label>
                        <Input id="shortName" value={newShortName} onChange={e => setNewShortName(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startSemester" className="text-right">Startsemester</Label>
                        <Select value={newStartSemesterId} onValueChange={setNewStartSemesterId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ABSOLUTE_SEMESTERS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {error && <p className="text-destructive text-sm col-span-4 text-center">{error}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Neue Gruppe erstellen</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export const ProgramPlannerGrid: React.FC<ProgramPlannerGridProps> = ({
    studiengruppe,
    program,
    modules,
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

  const orderedGroupedModules = useMemo(() => {
    const categoryMap = new Map<string, Module[]>();

    const allProgramModules = new Set(program.moduleIds);

    modules.forEach(module => {
        if (allProgramModules.has(module.id)) {
             if (!categoryMap.has(module.category)) {
                categoryMap.set(module.category, []);
            }
            categoryMap.get(module.category)!.push(module);
        }
    });

    const categoryOrder = program.categoryOrder || CATEGORY_ORDER;

    const ordered: { category: string; modules: Module[] }[] = [];
    categoryOrder.forEach(categoryName => {
        const modulesInCategory = categoryMap.get(categoryName);
        if (modulesInCategory && modulesInCategory.length > 0) {
            ordered.push({
                category: categoryName,
                modules: modulesInCategory.sort((a, b) => a.id.localeCompare(b.id)),
            });
        }
    });

    return ordered;
}, [modules, program]);

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
      const allModuleIds = modules.map(m => m.id);
      for (const otherModuleId of allModuleIds) {
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
  }, [getModuleById, modules]);


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
            modules={modules}
            onAddStudiengruppe={onAddStudiengruppe}
        />
        <div className="flex-grow overflow-auto relative">
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
                <tbody className="bg-card">
                    {orderedGroupedModules.map(({ category, modules: categoryModules }) => (
                        <React.Fragment key={category}>
                             <tr className="bg-muted/20">
                                <td colSpan={1 + program.semesters} className="p-1.5 font-bold text-foreground text-left sticky left-0 bg-muted/20 flex items-center justify-between">
                                    <span>{category}</span>
                                    <button onClick={() => onToggleCategoryLock(studiengruppe.id, category)} className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground" title={activeBulkLocks?.categories.has(category) ? "Bereich entsperren" : "Bereich sperren"}>
                                       {activeBulkLocks?.categories.has(category) ? <LockIcon /> : <UnlockIcon />}
                                    </button>
                                </td>
                            </tr>
                            {categoryModules.map(module => (
                                <tr key={module.id} className="h-10">
                                    <td className="sticky left-0 p-1 font-medium bg-card border-t border-r border-border w-64 align-middle text-foreground">
                                        <div className="flex items-center">
                                            <span className="text-muted-foreground font-code w-10 flex-shrink-0">{module.id}</span>
                                            <span className="pl-2">{module.name}</span>
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
                            ))}
                        </React.Fragment>
                        )
                    )}
                </tbody>
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
        </div>
    </div>
  );
};
