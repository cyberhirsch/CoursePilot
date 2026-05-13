

'use client';

import React, { useRef } from 'react';
import Papa from 'papaparse';
import type { Cohort, Program, AbsoluteSemester, Module, ProgramPlan } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Copy, PlusCircle, UserPlus, GripVertical, Settings2, Upload, Download } from 'lucide-react';
import { RELATIVE_SEMESTERS } from '@/constants';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';
import { ProgramCreateDialog } from './ProgramCreateDialog';

interface PlannerControlsProps {
    cohort: Cohort;
    program: Program;
    allPrograms: Program[];
    onUpdateCohort: (id: string, updates: Partial<Cohort>) => void;
    allCohorts: Cohort[];
    onSelectGroup: (id: string) => void;
    isHeatmapVisible: boolean;
    onToggleHeatmap: () => void;
    selectedSemester: AbsoluteSemester;
    onTogglePastLock: () => void;
    onToggleCategoryLock: (category: string) => void;
    activeBulkLocks: { past: boolean; categories: Set<string> } | undefined;
    finalLockedInstances: Set<string>;
    allModules: Module[];
    onAddCohort: (newCohort: Cohort, saveAsTemplate: boolean) => boolean;
    onAddProgram: (program: Program) => boolean;
    onUpdateProgram: (programId: string, updates: Partial<Program>) => void;
    departments: string[];
    lang?: keyof typeof TRANSLATIONS;
    allSemesters: AbsoluteSemester[];
}

export const PlannerControls: React.FC<PlannerControlsProps> = ({
    cohort, program, allPrograms, onUpdateCohort, allCohorts, onSelectGroup,
    isHeatmapVisible, onToggleHeatmap, selectedSemester,
    onTogglePastLock, onToggleCategoryLock, activeBulkLocks, allModules,
    onAddCohort,
    onAddProgram,
    onUpdateProgram,
    departments,
    lang = DEFAULT_LANGUAGE,
    allSemesters = []
}) => {
    const t = TRANSLATIONS[lang];

    const [isDuplicateDialogOpen, setDuplicateDialogOpen] = React.useState(false);
    const [isNewDialogOpen, setNewDialogOpen] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for New/Duplicate Dialog
    const [newShortName, setNewShortName] = React.useState("");
    const [newGroupName, setNewGroupName] = React.useState("");
    const [newStudentCount, setNewStudentCount] = React.useState(program.defaultStudents);
    const [newStartSemesterId, setNewStartSemesterId] = React.useState(allSemesters[0]?.id || "");
    const [newProgramId, setNewProgramId] = React.useState(program.id);
    const [saveAsTemplate, setSaveAsTemplate] = React.useState(false);


    const [error, setError] = React.useState('');

    const programGroups = allCohorts.filter(sg => sg.programId === cohort.programId);
    const currentIndex = programGroups.findIndex(g => g.id === cohort.id);

    const uniqueCategories = [...new Set(allModules.map(m => m.category))];

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

    const resetNewDialogState = (selectedProgramId: string) => {
        const selectedProgram = allPrograms.find(p => p.id === selectedProgramId) || program;
        setNewProgramId(selectedProgramId);
        setNewShortName("");
        setNewGroupName(`${selectedProgram.name.replace(/B\.A\.\s*/, "")} `);
        setNewStudentCount(selectedProgram.defaultStudents);
        setNewStartSemesterId(allSemesters.find(s => s.type === 'WS')?.id || allSemesters[0]?.id || "");
        setSaveAsTemplate(false);
        setError('');
    }

    const handleNewSubmit = () => {
        setError('');
        const selectedProgram = allPrograms.find(p => p.id === newProgramId);
        if (!selectedProgram) {
            setError("Bitte einen gültigen Studiengang auswählen.");
            return;
        }

        const newId = `${newProgramId}-${newShortName}`;
        const newStartSemester = allSemesters.find(s => s.id === newStartSemesterId);

        if (!newShortName || !newGroupName) {
            setError("Bitte Kürzel und Name für die neue Gruppe angeben.");
            return;
        }

        if (!newStartSemester) {
            setError("Ungültiges Startsemester gewählt.");
            return;
        }

        const newGroup: Cohort = {
            id: newId,
            name: newGroupName,
            shortName: newShortName,
            programId: newProgramId,
            startSemester: newStartSemester,
            studentCount: newStudentCount,
            semesters: selectedProgram.semesters,
            type: 'klassisch',
            plan: selectedProgram.templatePlan || { semesters: {} },
            userLockedModules: []
        };

        const success = onAddCohort(newGroup, saveAsTemplate);
        if (success) {
            setNewDialogOpen(false);
        } else {
            setError(`Eine Gruppe mit der ID "${newId}" existiert bereits.`);
        }
    }

    const handleDuplicateSubmit = () => {
        setError('');
        const newId = `${cohort.programId}-${newShortName}`;
        const newStartSemester = allSemesters.find(s => s.id === newStartSemesterId);

        if (!newShortName) {
            setError("Bitte ein Kürzel für die neue Gruppe angeben.");
            return;
        }

        if (!newStartSemester) {
            setError("Ungültiges Startsemester gewählt.");
            return;
        }

        const newGroup: Cohort = {
            ...cohort,
            id: newId,
            name: `${cohort.name.replace(cohort.shortName, '')} ${newShortName}`,
            shortName: newShortName,
            startSemester: newStartSemester,
            userLockedModules: [] // Start with no locks
        };

        const success = onAddCohort(newGroup, false);
        if (success) {
            setDuplicateDialogOpen(false);
            setNewShortName("");
        } else {
            setError(`Eine Gruppe mit der ID "${newId}" existiert bereits.`);
        }
    };

    const handleExport = () => {
        const { plan } = cohort;
        const modulesById = new Map(allModules.map(m => [m.id, m]));

        const dataForCsv = [];
        for (const [semId, instanceIds] of Object.entries(plan.semesters)) {
            const semesterNumber = parseInt(semId.replace('sem', ''));
            if (isNaN(semesterNumber)) continue;

            for (const instanceId of instanceIds) {
                const baseModuleId = instanceId.split('-')[0];
                const module = modulesById.get(baseModuleId);
                if (module) {
                    dataForCsv.push({
                        moduleId: module.id,
                        moduleName: module.name,
                        semester: semesterNumber,
                    });
                }
            }
        }

        const csv = Papa.unparse(dataForCsv);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `studienplan_${cohort.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse<{ moduleId: string, semester: string }>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const newPlan: ProgramPlan = { semesters: {} };
                for (let i = 1; i <= cohort.semesters; i++) {
                    newPlan.semesters[`sem${i}`] = [];
                }

                const programModuleIds = new Set(program.moduleIds);
                const poolCounters: Record<string, number> = {};

                const importedModules = results.data;
                importedModules.sort((a, b) => parseInt(a.semester) - parseInt(b.semester));

                importedModules.forEach(({ moduleId, semester }) => {
                    const semesterNumber = parseInt(semester, 10);
                    if (!moduleId || isNaN(semesterNumber) || semesterNumber < 1 || semesterNumber > cohort.semesters) {
                        console.warn(`Skipping invalid row:`, { moduleId, semester });
                        return;
                    }
                    if (!programModuleIds.has(moduleId)) {
                        console.warn(`Skipping module "${moduleId}" as it's not in the current program.`);
                        return;
                    }

                    const module = allModules.find(m => m.id === moduleId);
                    const semKey = `sem${semesterNumber}`;

                    let instanceId = moduleId;
                    if (module?.type === 'Pool') {
                        poolCounters[moduleId] = (poolCounters[moduleId] || 0) + 1;
                        instanceId = `${moduleId}-${poolCounters[moduleId]}`;
                    }

                    if (!newPlan.semesters[semKey].includes(instanceId)) {
                        newPlan.semesters[semKey].push(instanceId);
                    }
                });

                onUpdateCohort(cohort.id, { plan: newPlan });
                alert('Studienverlaufsplan wurde erfolgreich importiert!');
            },
            error: (error) => {
                console.error("Error parsing CSV:", error);
                alert(`Fehler beim Einlesen der CSV-Datei: ${error.message}`);
            }
        });

        // Reset file input to allow re-uploading the same file
        event.target.value = '';
    };

    const selectedProgramForNewDialog = allPrograms.find(p => p.id === newProgramId) || program;

    return (
        <div className="flex-shrink-0 bg-card p-3 rounded-t-lg border-b border-border flex items-center justify-between flex-wrap gap-x-6 gap-y-2">
            {/* Left side: Group Selection */}
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <Button onClick={handlePrevious} variant="ghost" size="icon" disabled={currentIndex <= 0} aria-label="Vorherige Gruppe">
                    <ChevronLeft />
                </Button>
                <div className="flex-grow">
                    <Select value={cohort.id} onValueChange={onSelectGroup}>
                        <SelectTrigger className="text-base font-bold w-full">
                            <SelectValue placeholder={t.controls.selectCohort} />
                        </SelectTrigger>
                        <SelectContent>
                            {programGroups.map(sg => (
                                <SelectItem key={sg.id} value={sg.id}>
                                    {sg.name} ({sg.shortName})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{program.name}</p>
                </div>
                <Button onClick={handleNext} variant="ghost" size="icon" disabled={currentIndex >= programGroups.length - 1} aria-label="Nächste Gruppe">
                    <ChevronRight />
                </Button>
            </div>

            {/* Right side: Actions and Settings */}
            <div className="flex items-center justify-end gap-x-4 gap-y-2 flex-wrap">
                <Dialog open={isNewDialogOpen} onOpenChange={(isOpen) => { if (isOpen) resetNewDialogState(program.id); setNewDialogOpen(isOpen); }}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <UserPlus className="mr-2 h-4 w-4" />
                            {t.controls.newCohort}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{t.controls.createCohortTitle}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-studiengang">{t.planner.program}</Label>
                                <Select value={newProgramId} onValueChange={(id) => resetNewDialogState(id)}>
                                    <SelectTrigger id="new-studiengang">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allPrograms.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-fachbereich">{t.planner.department}</Label>
                                <Input id="new-fachbereich" value={selectedProgramForNewDialog.department || 'N/A'} disabled className="bg-muted/50" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-groupName">{t.common.name}</Label>
                                <Input id="new-groupName" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="z.B. Game Design 35k" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-shortName">{t.controls.shortName}</Label>
                                <Input id="new-shortName" value={newShortName} onChange={e => setNewShortName(e.target.value)} placeholder="z.B. 35k" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-startSemester">{t.controls.startSemester}</Label>
                                <Select value={newStartSemesterId} onValueChange={setNewStartSemesterId}>
                                    <SelectTrigger id="new-startSemester">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allSemesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-semesters">{t.common.semesterRecommendation}</Label>
                                <Input id="new-semesters" value={selectedProgramForNewDialog.semesters} disabled className="bg-muted/50" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-studentCount">{t.controls.studentCount}</Label>
                                <Input id="new-studentCount" type="number" value={newStudentCount} onChange={e => setNewStudentCount(parseInt(e.target.value) || 0)} />
                            </div>

                            <div className="col-span-2 flex items-center space-x-2 pt-2">
                                <Checkbox id="save-as-template" checked={saveAsTemplate} onCheckedChange={(checked) => setSaveAsTemplate(!!checked)} />
                                <Label htmlFor="save-as-template" className="text-sm font-medium">{t.controls.saveAsTemplate}</Label>
                            </div>

                            {error && <p className="text-destructive text-sm col-span-2 text-center">{error}</p>}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleNewSubmit}>{t.controls.create}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <ProgramCreateDialog
                    programs={allPrograms}
                    onAddProgram={onAddProgram}
                    departments={departments}
                    lang={lang}
                    trigger={(
                        <Button variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t.controls.newProgram || t.programs?.newProgram || 'Neuer Studiengang'}
                        </Button>
                    )}
                />

                <Dialog open={isDuplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Copy className="mr-2 h-4 w-4" />
                            {t.controls.duplicate}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t.controls.duplicateCohortTitle}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dup-shortName" className="text-right">{t.controls.shortName}</Label>
                                <Input id="dup-shortName" value={newShortName} onChange={e => setNewShortName(e.target.value)} className="col-span-3" placeholder={`${cohort.shortName}-Kopie`} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dup-startSemester" className="text-right">{t.controls.startSemester}</Label>
                                <Select value={newStartSemesterId} onValueChange={setNewStartSemesterId}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allSemesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {error && <p className="text-destructive text-sm col-span-4 text-center">{error}</p>}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleDuplicateSubmit}>{t.controls.create}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv" style={{ display: 'none' }} />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        {t.controls.importCsv}
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        {t.controls.exportCsv}
                    </Button>
                </div>


                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Settings2 className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                {t.controls.settings}
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="heatmap-toggle"
                                        checked={isHeatmapVisible}
                                        onCheckedChange={onToggleHeatmap}
                                    />
                                    <Label htmlFor="heatmap-toggle">{t.controls.heatmap}</Label>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <h4 className="font-medium leading-none">Module automatisch sperren</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Sperren Sie Module, um versehentliche Änderungen zu verhindern.
                                    </p>
                                </div>
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
                                        {t.controls.lockPast}
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
                    <Label htmlFor="start-semester">{t.controls.startSemester.slice(0, 5)}:</Label>
                    <Select value={cohort.startSemester.id} onValueChange={(id) => {
                        const newSem = allSemesters.find(s => s.id === id);
                        if (newSem) onUpdateCohort(cohort.id, { startSemester: newSem });
                    }}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {allSemesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="semesters-count">Sem.:</Label>
                    <Input
                        id="semesters-count"
                        type="number"
                        value={cohort.semesters}
                        onChange={(e) => onUpdateCohort(cohort.id, { semesters: parseInt(e.target.value) || 0 })}
                        className="w-16"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="student-count">{t.common.participants.slice(0, 4)}.:</Label>
                    <Input
                        id="student-count"
                        type="number"
                        value={cohort.studentCount}
                        onChange={(e) => onUpdateCohort(cohort.id, { studentCount: parseInt(e.target.value) || 0 })}
                        className="w-20"
                    />
                </div>
            </div>
        </div>
    );
};
