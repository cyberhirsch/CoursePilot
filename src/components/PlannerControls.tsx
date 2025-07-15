
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
import { ChevronLeft, ChevronRight, Copy, PlusCircle, UserPlus, GripVertical } from 'lucide-react';
import { ABSOLUTE_SEMESTERS } from '@/constants';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';

interface PlannerControlsProps {
    studiengruppe: Studiengruppe;
    program: Program;
    onUpdateStudiengruppe: (id: string, updates: Partial<Studiengruppe>) => void;
    allStudiengruppen: Studiengruppe[];
    onSelectGroup: (id: string) => void;
    isHeatmapVisible: boolean;
    onToggleHeatmap: () => void;
    totalCp: number;
    selectedSemester: AbsoluteSemester;
    onTogglePastLock: () => void;
    onToggleCategoryLock: (category: string) => void;
    activeBulkLocks: { past: boolean; categories: Set<string> } | undefined;
    finalLockedInstances: Set<string>;
    allModules: Module[];
    onAddStudiengruppe: (newStudiengruppe: Studiengruppe) => boolean;
    onUpdateProgram: (programId: string, updates: Partial<Program>) => void;
}

export const PlannerControls: React.FC<PlannerControlsProps> = ({
    studiengruppe, program, onUpdateStudiengruppe, allStudiengruppen, onSelectGroup,
    isHeatmapVisible, onToggleHeatmap, selectedSemester,
    onTogglePastLock, onToggleCategoryLock, activeBulkLocks, allModules,
    onAddStudiengruppe, onUpdateProgram
}) => {
    
    const [isDuplicateDialogOpen, setDuplicateDialogOpen] = React.useState(false);
    const [isNewDialogOpen, setNewDialogOpen] = React.useState(false);
    const [isAddModuleOpen, setAddModuleOpen] = React.useState(false);

    const [newShortName, setNewShortName] = React.useState("");
    const [newStartSemesterId, setNewStartSemesterId] = React.useState(ABSOLUTE_SEMESTERS[0].id);
    const [error, setError] = React.useState('');
    
    const programGroups = allStudiengruppen.filter(sg => sg.programId === studiengruppe.programId);
    const currentIndex = programGroups.findIndex(g => g.id === studiengruppe.id);
    
    const uniqueCategories = [...new Set(allModules.map(m => m.category))];
    const availableModules = allModules.filter(m => !program.moduleIds.includes(m.id));

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

    const handleNewSubmit = () => {
        setError('');
        const newId = `${program.id}-${newShortName}`;
        const newStartSemester = ABSOLUTE_SEMESTERS.find(s => s.id === newStartSemesterId);

        if (!newShortName) {
            setError("Bitte ein Kürzel für die neue Gruppe angeben.");
            return;
        }
        
        if (!newStartSemester) {
            setError("Ungültiges Startsemester gewählt.");
            return;
        }

        const newGroup: Studiengruppe = {
            id: newId,
            name: `${program.name.replace("B.A. ", "")} ${newShortName}`,
            shortName: newShortName,
            programId: program.id,
            startSemester: newStartSemester,
            studentCount: program.defaultStudents,
            type: 'klassisch',
            plan: program.templatePlan || { semesters: {} },
            userLockedModules: []
        };
        
        const success = onAddStudiengruppe(newGroup);
        if (success) {
            setNewDialogOpen(false);
            setNewShortName("");
        } else {
            setError(`Eine Gruppe mit der ID "${newId}" existiert bereits.`);
        }
    }

    const handleDuplicateSubmit = () => {
        setError('');
        const newId = `${studiengruppe.programId}-${newShortName}`;
        const newStartSemester = ABSOLUTE_SEMESTERS.find(s => s.id === newStartSemesterId);
        
        if (!newShortName) {
            setError("Bitte ein Kürzel für die neue Gruppe angeben.");
            return;
        }

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
            setDuplicateDialogOpen(false);
            setNewShortName("");
        } else {
            setError(`Eine Gruppe mit der ID "${newId}" existiert bereits.`);
        }
    };

    const handleAddModuleToProgram = (moduleId: string) => {
        onUpdateProgram(program.id, {
            moduleIds: [...program.moduleIds, moduleId]
        });
    };

    return (
        <div className="flex-shrink-0 bg-card p-3 rounded-t-lg border-b border-border flex items-center justify-between flex-wrap gap-4">
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
                 <Dialog open={isNewDialogOpen} onOpenChange={setNewDialogOpen}>
                    <DialogTrigger asChild>
                         <Button variant="outline">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Neue Gruppe
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Neue Studiengruppe erstellen</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="new-shortName" className="text-right">Kürzel</Label>
                                <Input id="new-shortName" value={newShortName} onChange={e => setNewShortName(e.target.value)} className="col-span-3" placeholder="z.B. 35k"/>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="new-startSemester" className="text-right">Startsemester</Label>
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
                            <Button onClick={handleNewSubmit}>Neue Gruppe erstellen</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isDuplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                    <DialogTrigger asChild>
                         <Button variant="outline">
                            <Copy className="mr-2 h-4 w-4" />
                            Gruppe duplizieren
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Studiengruppe duplizieren</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dup-shortName" className="text-right">Neues Kürzel</Label>
                                <Input id="dup-shortName" value={newShortName} onChange={e => setNewShortName(e.target.value)} className="col-span-3" placeholder={`${studiengruppe.shortName}-Kopie`} />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dup-startSemester" className="text-right">Startsemester</Label>
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
                            <Button onClick={handleDuplicateSubmit}>Gruppe erstellen</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Popover open={isAddModuleOpen} onOpenChange={setAddModuleOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Modul zuordnen
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96">
                        <h4 className="font-medium text-lg mb-2">Verfügbare Module</h4>
                        <p className="text-sm text-muted-foreground mb-4">Fügen Sie dem Studiengang '{program.id}' Module hinzu.</p>
                        <ScrollArea className="h-72">
                            <div className="p-1">
                                {availableModules.length > 0 ? availableModules.map(module => (
                                    <div key={module.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                                        <div>
                                            <p className="font-semibold">{module.name}</p>
                                            <p className="text-xs text-muted-foreground">{module.id}</p>
                                        </div>
                                        <Button size="sm" onClick={() => handleAddModuleToProgram(module.id)}>Hinzufügen</Button>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground text-center py-4">Alle Module sind bereits zugeordnet.</p>}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>

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
                    <Label htmlFor="semesters-count">Semester:</Label>
                    <Input 
                        id="semesters-count"
                        type="number" 
                        value={program.semesters}
                        onChange={(e) => onUpdateProgram(program.id, {semesters: parseInt(e.target.value) || 0})}
                        className="w-16"
                    />
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
