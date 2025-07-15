'use client';

import React, { useState } from 'react';
import type { Program, Module } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProgramEditorProps {
    programs: Program[];
    modules: Module[];
    onAddProgram: (program: Program) => void;
    onUpdateProgram: (programId: string, updates: Partial<Program>) => void;
    onDeleteProgram: (programId: string) => void;
}

const initialNewProgramState: Program = {
    id: '',
    name: '',
    semesters: 0,
    defaultStudents: 0,
    moduleIds: [],
};

export const ProgramEditor: React.FC<ProgramEditorProps> = ({
    programs,
    modules,
    onAddProgram,
    onUpdateProgram,
    onDeleteProgram
}) => {
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(programs[0]?.id || null);
    const [isAdding, setIsAdding] = useState(false);
    const [newProgram, setNewProgram] = useState<Program>(initialNewProgramState);

    const selectedProgram = programs.find(p => p.id === selectedProgramId);

    const handleNewProgramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['semesters', 'defaultStudents'].includes(name);
        setNewProgram(prev => ({ ...prev, [name]: isNumeric ? parseInt(value) || 0 : value }));
    };

    const handleSaveNewProgram = () => {
        if (!newProgram.id || !newProgram.name) {
            alert('Bitte ID und Namen für den neuen Studiengang angeben.');
            return;
        }
        onAddProgram(newProgram);
        setNewProgram(initialNewProgramState);
        setIsAdding(false);
    };

    const handleUpdateProgramField = (field: keyof Program, value: any) => {
        if (selectedProgramId) {
            onUpdateProgram(selectedProgramId, { [field]: value });
        }
    };
    
    const handleModuleSelectionChange = (moduleId: string, checked: boolean) => {
        if (!selectedProgram) return;

        const currentModuleIds = selectedProgram.moduleIds || [];
        const newModuleIds = checked
            ? [...currentModuleIds, moduleId]
            : currentModuleIds.filter(id => id !== moduleId);

        onUpdateProgram(selectedProgram.id, { moduleIds: newModuleIds });
    };

    return (
        <div className="flex h-full gap-4">
            <Card className="w-1/3 flex flex-col">
                <CardHeader>
                    <CardTitle>Studiengänge</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col p-4">
                    <ScrollArea className="flex-grow pr-4">
                        <div className="space-y-2">
                        {programs.map(p => (
                            <Button
                                key={p.id}
                                variant={selectedProgramId === p.id ? 'secondary' : 'ghost'}
                                className="w-full justify-start text-left h-auto py-2"
                                onClick={() => { setSelectedProgramId(p.id); setIsAdding(false); }}
                            >
                                <div>
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">{p.id}</p>
                                </div>
                            </Button>
                        ))}
                        </div>
                    </ScrollArea>
                     <Button onClick={() => { setIsAdding(true); setSelectedProgramId(null); }} className="mt-4 w-full">
                        + Neuer Studiengang
                    </Button>
                </CardContent>
            </Card>

            <Card className="w-2/3 flex flex-col">
                <CardHeader>
                    <CardTitle>
                        {isAdding ? "Neuen Studiengang anlegen" : `Studiengang bearbeiten: ${selectedProgram?.name || ''}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow p-4">
                    {isAdding ? (
                         <div className="space-y-4">
                            <label className="block"><span className="text-muted-foreground text-sm">ID*</span><Input name="id" value={newProgram.id} onChange={handleNewProgramChange} /></label>
                            <label className="block"><span className="text-muted-foreground text-sm">Name*</span><Input name="name" value={newProgram.name} onChange={handleNewProgramChange} /></label>
                            <label className="block"><span className="text-muted-foreground text-sm">Regelstudienzeit (Semester)</span><Input name="semesters" type="number" value={newProgram.semesters} onChange={handleNewProgramChange} /></label>
                            <label className="block"><span className="text-muted-foreground text-sm">Standard-Studierendenzahl</span><Input name="defaultStudents" type="number" value={newProgram.defaultStudents} onChange={handleNewProgramChange} /></label>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="ghost" onClick={() => setIsAdding(false)}>Abbrechen</Button>
                                <Button onClick={handleSaveNewProgram}>Speichern</Button>
                            </div>
                        </div>
                    ) : selectedProgram ? (
                        <div className="flex h-full gap-4">
                            <div className="w-1/2 space-y-4">
                               <h3 className="font-semibold text-lg border-b pb-2 mb-2">Stammdaten</h3>
                               <label className="block"><span className="text-muted-foreground text-sm">ID</span><Input value={selectedProgram.id} disabled /></label>
                               <label className="block"><span className="text-muted-foreground text-sm">Name</span><Input value={selectedProgram.name} onChange={(e) => handleUpdateProgramField('name', e.target.value)} /></label>
                               <label className="block"><span className="text-muted-foreground text-sm">Regelstudienzeit (Semester)</span><Input type="number" value={selectedProgram.semesters} onChange={(e) => handleUpdateProgramField('semesters', parseInt(e.target.value) || 0)} /></label>
                               <label className="block"><span className="text-muted-foreground text-sm">Standard-Studierendenzahl</span><Input type="number" value={selectedProgram.defaultStudents} onChange={(e) => handleUpdateProgramField('defaultStudents', parseInt(e.target.value) || 0)} /></label>
                               <Button variant="destructive" className="mt-8" onClick={() => onDeleteProgram(selectedProgram.id)}>Studiengang löschen</Button>
                            </div>
                             <div className="w-1/2 flex flex-col">
                                <h3 className="font-semibold text-lg border-b pb-2 mb-2">Zugeordnete Module</h3>
                                <ScrollArea className="flex-grow border rounded-md p-2">
                                     <div className="space-y-1">
                                        {modules.sort((a,b) => a.id.localeCompare(b.id)).map(m => (
                                            <label key={m.id} className="flex items-center space-x-2 p-1 rounded-md hover:bg-muted">
                                                <input
                                                    type="checkbox"
                                                    checked={(selectedProgram.moduleIds || []).includes(m.id)}
                                                    onChange={(e) => handleModuleSelectionChange(m.id, e.target.checked)}
                                                    className="form-checkbox h-4 w-4 rounded bg-input border-border text-primary focus:ring-ring"
                                                />
                                                <span className="text-sm">{m.name} ({m.id})</span>
                                            </label>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Wählen Sie einen Studiengang aus oder erstellen Sie einen neuen.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
