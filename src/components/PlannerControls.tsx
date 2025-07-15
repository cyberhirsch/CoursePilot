
'use client';

import React from 'react';
import type { Studiengruppe, Program, AbsoluteSemester, Module } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface PlannerControlsProps {
    studiengruppe: Studiengruppe;
    onUpdateStudiengruppe: (id: string, updates: Partial<Studiengruppe>) => void;
    allStudiengruppen: Studiengruppe[];
    onSelectGroup: (id: string) => void;
    isHeatmapVisible: boolean;
    onToggleHeatmap: () => void;
    totalCp: number;
    program: Program;
    selectedSemester: AbsoluteSemester;
    onTogglePastLock: () => void;
    onToggleCategoryLock: (category: string) => void;
    activeBulkLocks: { past: boolean; categories: Set<string> } | undefined;
    finalLockedInstances: Set<string>;
    modules: Module[];
}

export const PlannerControls: React.FC<PlannerControlsProps> = ({
    studiengruppe, onUpdateStudiengruppe, allStudiengruppen, onSelectGroup,
    isHeatmapVisible, onToggleHeatmap, totalCp, program, selectedSemester,
    onTogglePastLock, onToggleCategoryLock, activeBulkLocks, finalLockedInstances, modules
}) => {
    
    const programGroups = allStudiengruppen.filter(sg => sg.programId === studiengruppe.programId);
    
    const uniqueCategories = [...new Set(modules.map(m => m.category))];

    return (
        <div className="flex-shrink-0 bg-card p-4 rounded-lg border border-border flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div className="w-64">
                    <Select value={studiengruppe.id} onValueChange={onSelectGroup}>
                        <SelectTrigger className="text-base font-bold">
                            <SelectValue placeholder="Studiengruppe wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                            {programGroups.map(sg => (
                                <SelectItem key={sg.id} value={sg.id}>
                                    {sg.name} ({sg.shortName})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm">
                    <span className="text-muted-foreground">Start: </span>
                    <span className="font-semibold text-foreground">{studiengruppe.startSemester.name}</span>
                </div>
                <div className="text-sm">
                    <span className="text-muted-foreground">Typ: </span>
                    <span className="font-semibold text-foreground">{studiengruppe.type}</span>
                </div>
                 <div className="text-sm">
                    <span className="text-muted-foreground">Total CP: </span>
                    <span className="font-semibold text-foreground">{totalCp}</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            Module sperren ({finalLockedInstances.size})
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Module automatisch sperren</h4>
                                <p className="text-sm text-muted-foreground">
                                    Sperren Sie Module basierend auf Regeln, um versehentliche Änderungen zu verhindern.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="lock-past"
                                        checked={activeBulkLocks?.past}
                                        onCheckedChange={onTogglePastLock}
                                    />
                                    <label
                                        htmlFor="lock-past"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Sperre alle Semester bis {selectedSemester.name}
                                    </label>
                                </div>
                                 <div className="pl-6 mt-2 space-y-2">
                                    <p className="text-xs text-muted-foreground">...oder nach Kategorie:</p>
                                    {uniqueCategories.map(cat => (
                                        <div key={cat} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`lock-cat-${cat}`}
                                                checked={activeBulkLocks?.categories.has(cat)}
                                                onCheckedChange={() => onToggleCategoryLock(cat)}
                                            />
                                            <label htmlFor={`lock-cat-${cat}`} className="text-sm">{cat}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="heatmap-toggle"
                        checked={isHeatmapVisible}
                        onCheckedChange={onToggleHeatmap}
                    />
                    <Label htmlFor="heatmap-toggle">CP Heatmap</Label>
                </div>
            </div>
        </div>
    );
};
