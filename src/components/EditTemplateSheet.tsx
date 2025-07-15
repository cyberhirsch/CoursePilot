
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Module, Program, ProgramPlan } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from './ui/button';
import { RELATIVE_SEMESTERS, CP_LIMIT_PER_SEMESTER, CATEGORY_ORDER } from '../constants';
import { ModuleCard } from './ModuleCard';
import { Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface EditTemplateSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    program: Program;
    allModules: Module[];
    onUpdateProgram: (programId: string, updates: Partial<Program>) => void;
    onUpdateModulePrograms: (moduleId: string, programIds: string[]) => void;
    getModuleById: (id: string) => Module | undefined;
}

export const EditTemplateSheet: React.FC<EditTemplateSheetProps> = ({
    isOpen, onOpenChange, program, allModules, onUpdateProgram, onUpdateModulePrograms, getModuleById
}) => {
    const [editingProgram, setEditingProgram] = useState<Program>(program);
    const [draggedItem, setDraggedItem] = useState<{ type: 'module' | 'category', id: string, instanceId?: string } | null>(null);
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
    const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null);

    useEffect(() => {
        setEditingProgram(JSON.parse(JSON.stringify(program)));
    }, [program, isOpen]);

    const handleSave = () => {
        onUpdateProgram(editingProgram.id, {
            moduleIds: editingProgram.moduleIds,
            templatePlan: editingProgram.templatePlan,
            semesters: editingProgram.semesters,
            categoryOrder: editingProgram.categoryOrder,
        });
        onOpenChange(false);
    };

    const handleModuleDrop = (target: { type: 'sidebar' } | { type: 'semester', semesterId: string }) => {
        if (!draggedItem || draggedItem.type !== 'module') return;

        const { id: moduleId, instanceId } = draggedItem;
        const module = getModuleById(moduleId);
        if (!module) return;

        const newPlan: ProgramPlan = JSON.parse(JSON.stringify(editingProgram.templatePlan || { semesters: {} }));
        
        // Remove from old position if it was in the plan
        if (instanceId) {
            Object.keys(newPlan.semesters).forEach(semId => {
                newPlan.semesters[semId] = (newPlan.semesters[semId] || []).filter(id => id !== instanceId);
            });
        }
        
        if (target.type === 'semester') {
            let finalInstanceId = instanceId;

            if (!instanceId) { // Dragged from sidebar
                if (module.type === 'Pool') {
                    const existingInstances = Object.values(newPlan.semesters).flat().filter((id: string) => id.startsWith(module.id + '-'));
                    let nextNum = 1;
                    while (existingInstances.includes(`${module.id}-${nextNum}`)) nextNum++;
                    finalInstanceId = `${module.id}-${nextNum}`;
                } else { // Non-pool module
                    const isAlreadyInPlan = Object.values(newPlan.semesters).flat().includes(module.id);
                    if (isAlreadyInPlan) return; // Don't add if already there
                    finalInstanceId = module.id;
                }
            }
            
            if (finalInstanceId) {
                if (!newPlan.semesters[target.semesterId]) newPlan.semesters[target.semesterId] = [];
                newPlan.semesters[target.semesterId].push(finalInstanceId);
            }
        }
        
        setEditingProgram(p => ({ ...p, templatePlan: newPlan }));
    };
    
    const unassignedModules = useMemo(() => {
        const assignedIds = new Set(editingProgram.moduleIds);
        return allModules
          .filter(m => !assignedIds.has(m.id)) // All modules not in the program
          .sort((a,b)=> a.id.localeCompare(b.id));
    }, [allModules, editingProgram.moduleIds]);
    
    const modulesInPlan = useMemo(() => {
        const assignedIds = new Set(editingProgram.moduleIds);
        const planInstances = new Set(Object.values(editingProgram.templatePlan?.semesters || {}).flat());

        const inPlan = new Map<string, string[]>(); // Map<moduleId, instanceId[]>
        
        planInstances.forEach(instanceId => {
            const module = getModuleById(instanceId);
            if(module && assignedIds.has(module.id)) {
                if (!inPlan.has(module.id)) inPlan.set(module.id, []);
                inPlan.get(module.id)!.push(instanceId);
            }
        });
        
        return inPlan;

    }, [editingProgram, getModuleById]);
    
    const unplacedModules = useMemo(() => {
        const modulesNotYetInGrid = new Set(editingProgram.moduleIds);
        modulesInPlan.forEach((_, moduleId) => modulesNotYetInGrid.delete(moduleId));

        return Array.from(modulesNotYetInGrid).map(id => getModuleById(id)).filter((m): m is Module => !!m);

    }, [editingProgram.moduleIds, modulesInPlan, getModuleById]);

    const orderedGroupedModules = useMemo(() => {
        const moduleMap = new Map(allModules.map(m => [m.id, m]));
        
        const orderedProgramModules = editingProgram.moduleIds
            .map(id => moduleMap.get(id))
            .filter((m): m is Module => !!m);

        const categoryMap = new Map<string, Module[]>();
        orderedProgramModules.forEach(module => {
            const category = module.category;
            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }
            categoryMap.get(category)!.push(module);
        });

        const categoryOrder = editingProgram.categoryOrder || CATEGORY_ORDER;
        const orderedResult: { category: string; modules: Module[] }[] = [];

        categoryOrder.forEach(catName => {
            const modulesInCategory = categoryMap.get(catName);
            if (modulesInCategory) {
                orderedResult.push({ category: catName, modules: modulesInCategory });
            }
        });
        
        // Add any uncategorized but assigned modules
        const remainingCategories = Array.from(categoryMap.keys()).filter(c => !categoryOrder.includes(c));
        remainingCategories.forEach(catName => {
            orderedResult.push({ category: catName, modules: categoryMap.get(catName)! });
        })


        return orderedResult;
    }, [editingProgram, allModules]);

    const handleDragStart = (e: React.DragEvent, type: 'module' | 'category', id: string, instanceId?: string) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id); // Needed for Firefox
        setDraggedItem({ type, id, instanceId });
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverCategory(null);
        setDragOverModuleId(null);
    }
    
    const handleCategoryDrop = useCallback((droppedOnCategory: string) => {
        if (!editingProgram || !draggedItem || draggedItem.type !== 'category' || draggedItem.id === droppedOnCategory) {
            setDragOverCategory(null);
            return;
        }

        const categoryOrder = [...(editingProgram.categoryOrder || CATEGORY_ORDER)];
        const draggedIdx = categoryOrder.indexOf(draggedItem.id);
        const targetIdx = categoryOrder.indexOf(droppedOnCategory);
        
        if (draggedIdx === -1 || targetIdx === -1) return;
        
        const [removed] = categoryOrder.splice(draggedIdx, 1);
        categoryOrder.splice(targetIdx, 0, removed);
        
        setEditingProgram(p => p ? { ...p, categoryOrder } : null);
        setDragOverCategory(null);
    }, [editingProgram, draggedItem]);

    const handleModuleRowDrop = useCallback((droppedOnModuleId: string) => {
        if (!editingProgram || !draggedItem || draggedItem.type !== 'module' || draggedItem.id === droppedOnModuleId) {
            setDragOverModuleId(null);
            return;
        }
        
        const moduleIds = [...editingProgram.moduleIds];
        const draggedIdx = moduleIds.indexOf(draggedItem.id);
        const targetIdx = moduleIds.indexOf(droppedOnModuleId);
        
        if (draggedIdx === -1 || targetIdx === -1) return;

        const [removed] = moduleIds.splice(draggedIdx, 1);
        moduleIds.splice(targetIdx, 0, removed);
        
        setEditingProgram(p => p ? { ...p, moduleIds } : null);
        setDragOverModuleId(null);
    }, [editingProgram, draggedItem]);


    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="min-w-[90vw] sm:min-w-[90vw] md:min-w-[80vw] lg:min-w-[70vw] flex flex-col" onPointerDownOutside={e => e.preventDefault()}>
                <SheetHeader>
                    <SheetTitle>Vorlage bearbeiten: {program.name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-6">
                        Passen Sie die Modulzuordnungen und den Standard-Verlaufsplan für diesen Studiengang an.
                        <div>
                            <Label htmlFor="semesters-input">Anzahl Semester</Label>
                            <Input 
                                id="semesters-input"
                                type="number"
                                value={editingProgram.semesters}
                                onChange={e => setEditingProgram(p => ({...p, semesters: parseInt(e.target.value) || p.semesters }))}
                                className="w-20 mt-1"
                            />
                        </div>
                    </SheetDescription>
                </SheetHeader>
                
                <div className="flex-grow grid grid-cols-4 gap-4 overflow-hidden" onDragEnd={handleDragEnd}>
                    {/* Sidebar */}
                    <div 
                        className="col-span-1 bg-muted/50 rounded-lg p-2 flex flex-col gap-2 overflow-y-auto"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleModuleDrop({type: 'sidebar'})}
                    >
                        <h3 className="font-semibold p-2">Verfügbare Module</h3>
                        {unplacedModules.map(module => (
                             <div key={module.id} className="w-full h-10">
                                <ModuleCard 
                                    module={module} 
                                    instanceId={module.id}
                                    isDraggable={true}
                                    onDragStart={(e, id, instId) => handleDragStart(e, 'module', id, instId)}
                                />
                             </div>
                        ))}
                    </div>

                    {/* Main Grid */}
                    <div className="col-span-3 flex flex-col overflow-hidden">
                         <div className="flex-grow overflow-auto relative">
                             <table className="w-full border-collapse text-xs">
                                <thead>
                                    <tr className="sticky top-0 z-10 bg-card/75 backdrop-blur-sm">
                                        <th className="sticky left-0 bg-card/75 p-1 text-left font-semibold text-foreground w-64 border-b border-r border-border">Modul</th>
                                        {RELATIVE_SEMESTERS.slice(0, editingProgram.semesters).map(sem => (
                                            <th key={sem.id} className="p-1 text-center font-semibold text-foreground border-b border-r border-border min-w-[70px]">{sem.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                 <tbody className="bg-card">
                                    {orderedGroupedModules.map(({ category, modules: categoryModules }) => (
                                         <React.Fragment key={category}>
                                            <tr 
                                                draggable 
                                                onDragStart={(e) => handleDragStart(e, 'category', category)}
                                                onDragOver={(e) => { e.preventDefault(); if (draggedItem?.type === 'category' && draggedItem.id !== category) { setDragOverCategory(category); }}}
                                                onDragLeave={() => setDragOverCategory(null)}
                                                onDrop={() => handleCategoryDrop(category)}
                                                className={`bg-muted/20 cursor-move transition-all duration-150 ${dragOverCategory === category ? 'border-t-2 border-primary' : ''}`}
                                            >
                                                <td colSpan={1 + editingProgram.semesters} className="p-1.5 font-bold text-foreground text-left sticky left-0 bg-muted/20">{category}</td>
                                            </tr>
                                            {categoryModules.map(module => {
                                                const plannedInstances = modulesInPlan.get(module.id) || [];
                                                return (
                                                    <tr 
                                                        key={module.id} 
                                                        className={`h-12 transition-all duration-150 ${dragOverModuleId === module.id ? 'border-t-2 border-primary' : 'border-t-transparent'}`}
                                                        onDragOver={(e) => { e.preventDefault(); if (draggedItem?.type === 'module' && !draggedItem.instanceId && draggedItem.id !== module.id) { setDragOverModuleId(module.id); }}}
                                                        onDragLeave={() => setDragOverModuleId(null)}
                                                        onDrop={() => handleModuleRowDrop(module.id)}
                                                    >
                                                        <td 
                                                            draggable 
                                                            onDragStart={(e) => handleDragStart(e, 'module', module.id)}
                                                            className="sticky left-0 p-1 font-medium bg-card border-t border-r border-border w-64 cursor-grab"
                                                        >
                                                            <div className="flex items-center">
                                                                <span className="text-muted-foreground font-code w-10 flex-shrink-0">{module.id}</span>
                                                                <span className="pl-2">{module.name}</span>
                                                            </div>
                                                        </td>
                                                        {RELATIVE_SEMESTERS.slice(0, editingProgram.semesters).map(sem => (
                                                            <td key={sem.id} 
                                                                className="p-1 border-t border-r border-border align-top"
                                                                onDragOver={e => e.preventDefault()}
                                                                onDrop={() => handleModuleDrop({ type: 'semester', semesterId: sem.id })}
                                                            >
                                                                <div className="flex flex-col items-center justify-start gap-1 w-full h-full min-h-[40px]">
                                                                {plannedInstances
                                                                    .filter(instId => (editingProgram.templatePlan?.semesters[sem.id] || []).includes(instId))
                                                                    .map(instanceId => (
                                                                        <div key={instanceId} className="w-full h-10">
                                                                            <ModuleCard 
                                                                                module={module} 
                                                                                instanceId={instanceId}
                                                                                isDraggable={true}
                                                                                onDragStart={(e, id, instId) => handleDragStart(e, 'module', id, instId)}
                                                                            />
                                                                        </div>
                                                                ))}
                                                                </div>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                )
                                            })}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                    </div>

                </div>

                <SheetFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                    <Button onClick={handleSave}>Vorlage speichern</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
