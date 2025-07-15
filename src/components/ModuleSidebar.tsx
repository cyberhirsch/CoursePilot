
'use client';

import React, { useState, useMemo } from 'react';
import type { Module, Program, ProgramPlan, Category } from '@/types';
import { ModuleCard } from '@/components/ModuleCard';
import { CATEGORY_ORDER } from '@/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface ModuleSidebarProps {
    program: Program;
    modules: Module[];
    plan: ProgramPlan;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, moduleId: string, instanceId: string) => void;
    getModuleById: (id: string) => Module | undefined;
}

interface CategorizedModules {
  [category: string]: Module[];
}

export const ModuleSidebar: React.FC<ModuleSidebarProps> = ({ program, modules, plan, onDragStart, getModuleById }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const plannedInstanceIds = useMemo(() => {
        return new Set(Object.values(plan.semesters).flat());
    }, [plan.semesters]);

    const availableModules = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return modules.filter(module => {
            if (!program.moduleIds.includes(module.id)) {
                return false;
            }
            if (searchTerm && !module.name.toLowerCase().includes(lowerCaseSearchTerm) && !module.id.toLowerCase().includes(lowerCaseSearchTerm)) {
                return false;
            }

            if (module.type !== 'Pool') {
                 return !plannedInstanceIds.has(module.id);
            }
            return true; 
        });
    }, [modules, program.moduleIds, plannedInstanceIds, searchTerm]);

    const categorizedModules = useMemo(() => {
        const grouped = availableModules.reduce((acc, module) => {
            const category = module.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(module);
            return acc;
        }, {} as CategorizedModules);

        const orderedGroup = {} as CategorizedModules;
        CATEGORY_ORDER.forEach(catName => {
            if (grouped[catName]) {
                orderedGroup[catName] = grouped[catName];
            }
        });
        Object.keys(grouped).forEach(catName => {
             if (!CATEGORY_ORDER.includes(catName)) {
                 orderedGroup[catName] = grouped[catName];
             }
        });

        return orderedGroup;
    }, [availableModules]);

    const poolInstances = useMemo(() => {
        const instances: { [poolId: string]: string[] } = {};
        const poolModules = modules.filter(m => m.type === 'Pool');

        poolModules.forEach(pool => {
            if (program.moduleIds.includes(pool.id)) {
                instances[pool.id] = [];
                for (let i = 1; i <= (pool.instanceCount || 1); i++) {
                    const instanceId = `${pool.id}-${i}`;
                    if (!plannedInstanceIds.has(instanceId)) {
                        instances[pool.id].push(instanceId);
                    }
                }
            }
        });
        return instances;
    }, [modules, plannedInstanceIds, program.moduleIds]);


    const renderModuleCard = (module: Module, instanceId: string) => (
        <div className="h-16" key={instanceId}>
            <ModuleCard
                module={module}
                instanceId={instanceId}
                onDragStart={(e) => onDragStart(e, module.id, instanceId)}
                isDraggable={true}
            />
        </div>
    );

    return (
        <div className="w-64 flex-shrink-0 bg-card border border-border rounded-lg flex flex-col">
            <div className="p-4 border-b border-border">
                <h2 className="font-bold text-lg text-foreground truncate">{program.name}</h2>
                <p className="text-sm text-muted-foreground">Verfügbare Module</p>
                 <Input
                    type="search"
                    placeholder="Suchen..."
                    className="mt-2 h-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ScrollArea className="flex-grow p-4">
                <div className="space-y-6">
                    {Object.entries(categorizedModules).map(([category, categoryModules]) => (
                        <div key={category}>
                            <h3 className="font-semibold text-sm mb-2 text-muted-foreground">{category}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {categoryModules.map(module => {
                                    if (module.type === 'Pool') {
                                        return poolInstances[module.id]?.map(instanceId => renderModuleCard(module, instanceId))
                                    }
                                    return renderModuleCard(module, module.id);
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
