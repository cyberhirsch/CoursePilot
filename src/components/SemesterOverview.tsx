
'use client';

import React from 'react';
import type { Studiengruppe, Module, Program, AbsoluteSemester } from '@/types';
import { getAbsoluteSemesterFor, getRelativeSemesterIndex, CP_LIMIT_PER_SEMESTER } from '@/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface SemesterOverviewProps {
  studiengruppen: Studiengruppe[];
  getModuleById: (id: string) => Module | undefined;
  programs: Program[];
  selectedSemester: AbsoluteSemester;
  setSelectedSemester: (semester: AbsoluteSemester) => void;
  semesters: AbsoluteSemester[];
  onSelectGroup: (studiengruppeId: string) => void;
}

const getProgramName = (programId: string, programs: Program[]) => {
    return programs.find(p => p.id === programId)?.name || programId;
};

export const SemesterOverview: React.FC<SemesterOverviewProps> = ({ 
    studiengruppen, getModuleById, programs, selectedSemester, setSelectedSemester, semesters, onSelectGroup 
}) => {
    
    const groupsInSemester = React.useMemo(() => {
        return studiengruppen.map(sg => {
            const program = programs.find(p => p.id === sg.programId);
            if (!program) return null;

            const relativeIndex = getRelativeSemesterIndex(sg.startSemester, selectedSemester);
            if (relativeIndex < 0 || relativeIndex >= program.semesters) {
                return null;
            }

            const relativeSemId = `sem${relativeIndex + 1}`;
            const moduleInstances = sg.plan.semesters[relativeSemId] || [];
            
            const modulesInSemester = moduleInstances.map(instanceId => getModuleById(instanceId)).filter(Boolean) as Module[];
            
            const totalSWS = modulesInSemester.reduce((sum, m) => sum + m.sws, 0);
            const totalCP = modulesInSemester.reduce((sum, m) => sum + m.cp, 0);

            return {
                ...sg,
                relativeIndex,
                modules: modulesInSemester,
                totalSWS,
                totalCP
            };
        }).filter(Boolean) as (Studiengruppe & { relativeIndex: number; modules: Module[]; totalSWS: number; totalCP: number })[];
    }, [studiengruppen, selectedSemester, getModuleById, programs]);

    const totalStudents = groupsInSemester.reduce((sum, g) => sum + g.studentCount, 0);
    const totalSWS = groupsInSemester.reduce((sum, g) => sum + g.totalSWS, 0);

    return (
        <div className="bg-card rounded-lg shadow-md h-full flex flex-col border border-border">
            <div className="p-4 border-b-2 border-border flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Semesterübersicht</h2>
                    <p className="text-sm text-muted-foreground">Planung aller Studiengruppen für ein ausgewähltes Semester.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="font-bold text-foreground">{totalStudents} Studierende</p>
                        <p className="text-sm text-muted-foreground">{totalSWS} SWS geplant</p>
                    </div>
                    <div className="w-56">
                        <Select value={selectedSemester.id} onValueChange={(id) => setSelectedSemester(semesters.find(s => s.id === id)!)}>
                            <SelectTrigger className="text-base font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-grow">
                <div className="p-4 space-y-4">
                {groupsInSemester.length > 0 ? (
                    groupsInSemester.map(sg => (
                        <div key={sg.id} className="bg-background/40 p-4 rounded-lg border border-border">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex-1">
                                    <button onClick={() => onSelectGroup(sg.id)} className="text-left hover:text-primary">
                                        <h3 className="font-bold text-lg">{sg.name} ({sg.shortName})</h3>
                                    </button>
                                    <p className="text-xs text-muted-foreground">{getProgramName(sg.programId, programs)} - {sg.relativeIndex + 1}. Fachsemester</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="font-semibold">{sg.studentCount} Stud.</p>
                                    <p className={`text-sm ${sg.totalCP > CP_LIMIT_PER_SEMESTER ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>{sg.totalCP} CP / {sg.totalSWS} SWS</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {sg.modules.length > 0 ? sg.modules.map(m => (
                                    <div key={m.id} className="bg-primary/20 text-primary border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold">
                                        {m.name} ({m.sws} SWS)
                                    </div>
                                )) : (
                                    <p className="text-xs text-muted-foreground italic">Keine Module in diesem Semester geplant.</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">Für das Semester <span className="font-bold">{selectedSemester.name}</span> sind keine Studiengruppen aktiv.</p>
                    </div>
                )}
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </div>
    );
};
