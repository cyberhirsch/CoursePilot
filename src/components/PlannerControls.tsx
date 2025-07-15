
'use client';

import React from 'react';
import type { Studiengruppe, Program, AbsoluteSemester, Module } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ABSOLUTE_SEMESTERS } from '@/constants';

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
    const currentIndex = programGroups.findIndex(g => g.id === studiengruppe.id);
    
    const uniqueCategories = [...new Set(modules.map(m => m.category))];

    const handlePrevious = () => {
        if (currentIndex > 0) {
            onSelectGroup(programGroups[currentIndex - 1].id);
        }
    };

    const handleNext = () => {
        if (currentIndex < programGroups.length - 1) {
            onSelectGroup(programGroups[currentIndex + 1].id);
        }
    };


    return (
        <div className="flex-shrink-0 bg-card p-3 rounded-lg border border-border flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
                 <Button onClick={handlePrevious} variant="ghost" size="icon" disabled={currentIndex <= 0} aria-label="Vorherige Gruppe">
                    <ChevronLeft />
                </Button>
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
                    <p className="text-xs text-muted-foreground mt-1">{program.name}</p>
                </div>
                 <Button onClick={handleNext} variant="ghost" size="icon" disabled={currentIndex >= programGroups.length - 1} aria-label="Nächste Gruppe">
                    <ChevronRight />
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="heatmap-toggle"
                        checked={isHeatmapVisible}
                        onCheckedChange={onToggleHeatmap}
                    />
                    <Label htmlFor="heatmap-toggle">Heatmap</Label>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            Vergangene sperren
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

                <div className="flex items-center gap-2">
                    <Label htmlFor="start-semester">Start:</Label>
                     <Select value={studiengruppe.startSemester.id} onValueChange={(id) => {
                         const newSem = ABSOLUTE_SEMESTERS.find(s => s.id === id);
                         if(newSem) onUpdateStudiengruppe(studiengruppe.id, { startSemester: newSem });
                     }}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ABSOLUTE_SEMESTERS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center gap-2">
                    <Label htmlFor="student-count">Stud.:</Label>
                    <Input 
                        id="student-count"
                        type="number" 
                        value={studiengruppe.studentCount}
                        onChange={(e) => onUpdateStudiengruppe(studiengruppe.id, {studentCount: parseInt(e.target.value) || 0})}
                        className="w-20"
                    />
                </div>
            </div>
        </div>
    );
};
