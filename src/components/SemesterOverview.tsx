
'use client';

import React from 'react';
import type { Studiengruppe, Module, Program, AbsoluteSemester } from '@/types';
import { getRelativeSemesterIndex } from '@/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SemesterOverviewProps {
  studiengruppen: Studiengruppe[];
  getModuleById: (id: string) => Module | undefined;
  programs: Program[];
  selectedSemester: AbsoluteSemester;
  setSelectedSemester: (semester: AbsoluteSemester) => void;
  semesters: AbsoluteSemester[];
  onSelectGroup: (studiengruppeId: string) => void;
  modules: Module[];
}

const ProgramSection: React.FC<{
    program: Program;
    studiengruppen: Studiengruppe[];
    modules: Module[];
    selectedSemester: AbsoluteSemester;
    getModuleById: (id: string) => Module | undefined;
    onSelectGroup: (groupId: string) => void;
}> = ({ program, studiengruppen, modules, selectedSemester, getModuleById, onSelectGroup }) => {

    const relevantGroups = studiengruppen
        .filter(sg => sg.programId === program.id)
        .map(sg => {
            const relativeIndex = getRelativeSemesterIndex(sg.startSemester, selectedSemester);
            if (relativeIndex < 0 || relativeIndex >= program.semesters) return null;

            const relativeSemId = `sem${relativeIndex + 1}`;
            const moduleInstancesInSem = sg.plan.semesters[relativeSemId] || [];
            
            return {
                ...sg,
                relativeIndex,
                moduleInstancesInSem
            };
        })
        .filter(Boolean) as (Studiengruppe & { relativeIndex: number; moduleInstancesInSem: string[] })[];
    
    if (relevantGroups.length === 0) return null;

    const programModules = modules.filter(m => program.moduleIds.includes(m.id));

    const categorizedModules = (program.categoryOrder || []).map(categoryName => ({
        category: categoryName,
        modules: programModules.filter(m => m.category === categoryName).sort((a, b) => a.name.localeCompare(b.name))
    }));
    
    const uncategorized = programModules.filter(m => !(program.categoryOrder || []).includes(m.category));
    if(uncategorized.length > 0) {
        categorizedModules.push({
            category: 'Unkategorisiert',
            modules: uncategorized.sort((a, b) => a.name.localeCompare(b.name))
        });
    }

    const swsTotals = relevantGroups.map(sg => {
        return sg.moduleInstancesInSem.reduce((acc, instanceId) => {
            const module = getModuleById(instanceId);
            return acc + (module?.sws || 0);
        }, 0);
    });

    return (
        <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
                <h3 className="text-xl font-bold">{program.name}</h3>
            </div>
            <table className="w-full text-left border-collapse">
                <thead className="bg-background/40">
                    <tr>
                        <th className="p-2 w-1/4 min-w-[250px]">Gruppe</th>
                        {relevantGroups.map(sg => (
                            <th key={sg.id} className="p-2 text-center font-semibold border-l border-border">
                                <button onClick={() => onSelectGroup(sg.id)} className="hover:text-primary transition-colors">{sg.shortName}</button>
                            </th>
                        ))}
                    </tr>
                    <tr>
                        <th className="p-2 text-muted-foreground">Semester</th>
                         {relevantGroups.map(sg => (
                            <th key={sg.id} className="p-2 text-center text-muted-foreground font-normal border-l border-border">{sg.relativeIndex + 1}.</th>
                        ))}
                    </tr>
                     <tr>
                        <th className="p-2 text-muted-foreground">Teilnehmer</th>
                         {relevantGroups.map(sg => (
                            <th key={sg.id} className="p-2 text-center text-muted-foreground font-normal border-l border-border">{sg.studentCount}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {categorizedModules.map(({ category, modules: catModules }) => (
                        <React.Fragment key={category}>
                            <tr className="bg-muted/10">
                                <td colSpan={1 + relevantGroups.length} className="p-2 font-bold text-foreground">{category}</td>
                            </tr>
                            {catModules.map(module => (
                                <tr key={module.id} className="border-b border-border/50 hover:bg-muted/20">
                                    <td className="p-2">
                                        <div className="flex items-center">
                                            <span className="text-muted-foreground text-xs w-10">{module.shortName}</span>
                                            <span>{module.name}</span>
                                        </div>
                                    </td>
                                    {relevantGroups.map(sg => (
                                        <td key={sg.id} className="p-2 text-center border-l border-border/50">
                                            {sg.moduleInstancesInSem.some(instanceId => getModuleById(instanceId)?.id === module.id) && (
                                                <div className="inline-block bg-primary/80 text-primary-foreground text-xs font-bold rounded px-2 py-1">
                                                    {module.sws}
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
                <tfoot className="bg-background/40">
                    <tr>
                        <td className="p-2 font-bold">SWS gesamt</td>
                        {swsTotals.map((total, index) => (
                             <td key={index} className="p-2 text-center font-bold border-l border-border">{total}</td>
                        ))}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};


export const SemesterOverview: React.FC<SemesterOverviewProps> = ({ 
    studiengruppen, getModuleById, programs, selectedSemester, setSelectedSemester, semesters, onSelectGroup, modules
}) => {
    
    const handleSemesterChange = (direction: 'prev' | 'next') => {
        const currentIndex = semesters.findIndex(s => s.id === selectedSemester.id);
        const newIndex = direction === 'prev' ? Math.max(0, currentIndex - 1) : Math.min(semesters.length - 1, currentIndex + 1);
        setSelectedSemester(semesters[newIndex]);
    };

    const allSWSInSemester = React.useMemo(() => {
         return studiengruppen.reduce((totalSws, sg) => {
            const program = programs.find(p => p.id === sg.programId);
            if (!program) return totalSws;
            const relativeIndex = getRelativeSemesterIndex(sg.startSemester, selectedSemester);
            if (relativeIndex < 0 || relativeIndex >= program.semesters) {
                return totalSws;
            }
            const relativeSemId = `sem${relativeIndex + 1}`;
            const moduleInstances = sg.plan.semesters[relativeSemId] || [];
            const swsInGroup = moduleInstances.reduce((sum, instanceId) => {
                const module = getModuleById(instanceId);
                return sum + (module?.sws || 0);
            }, 0);
            return totalSws + swsInGroup;
        }, 0);
    }, [studiengruppen, selectedSemester, getModuleById, programs]);


    return (
        <div className="h-full flex flex-col gap-4">
            <div className="p-4 bg-card rounded-lg shadow-md border border-border flex justify-between items-center">
                <div className="flex items-center gap-4">
                     <h2 className="text-xl font-bold text-foreground">Semesterübersicht:</h2>
                     <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleSemesterChange('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                         <Select value={selectedSemester.id} onValueChange={(id) => setSelectedSemester(semesters.find(s => s.id === id)!)}>
                            <SelectTrigger className="text-base font-bold w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => handleSemesterChange('next')}><ChevronRight className="h-4 w-4" /></Button>
                     </div>
                </div>
                 <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Lehrbedarf SWS</p>
                        <p className="text-2xl font-bold">{allSWSInSemester}</p>
                    </div>
                 </div>
            </div>

            <ScrollArea className="flex-grow pb-4">
                <div className="p-4 space-y-6">
                    {programs.map(prog => (
                         <ProgramSection 
                            key={prog.id}
                            program={prog}
                            studiengruppen={studiengruppen}
                            modules={modules}
                            selectedSemester={selectedSemester}
                            getModuleById={getModuleById}
                            onSelectGroup={onSelectGroup}
                         />
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
};
