

'use client';

import React, { useMemo } from 'react';
import type { Studiengruppe, Module, AbsoluteSemester, Program } from '../types';
import { getRelativeSemesterIndex, RELATIVE_SEMESTERS } from '../constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProgramSectionProps {
    program: Program;
    studiengruppen: Studiengruppe[];
    modules: Module[];
    selectedSemester: AbsoluteSemester;
    getModuleById: (id: string) => Module | undefined;
    onSelectGroup: (groupId: string) => void;
}

const ProgramSection: React.FC<ProgramSectionProps> = ({ program, studiengruppen, modules, selectedSemester, getModuleById, onSelectGroup }) => {

    const relevantGroups = useMemo(() => studiengruppen
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
        .filter(Boolean) as (Studiengruppe & { relativeIndex: number; moduleInstancesInSem: string[] })[], [studiengruppen, program, selectedSemester]);
    
    if (relevantGroups.length === 0) return null;

    const programModules = useMemo(() => modules.filter(m => program.moduleIds.includes(m.id)), [modules, program.moduleIds]);

    const categorizedModules = useMemo(() => {
        const grouped = programModules.reduce((acc, module) => {
            const category = module.category || 'Unkategorisiert';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(module);
            return acc;
        }, {} as Record<string, Module[]>);

        const orderedGroup: { category: string, modules: Module[] }[] = [];
        const categoryOrder = program.categoryOrder || [];
        
        categoryOrder.forEach(catName => {
            if (grouped[catName]) {
                orderedGroup.push({ category: catName, modules: grouped[catName].sort((a,b) => a.name.localeCompare(b.name))});
            }
        });
        
        Object.keys(grouped).forEach(catName => {
             if (!categoryOrder.includes(catName)) {
                 orderedGroup.push({ category: catName, modules: grouped[catName].sort((a,b) => a.name.localeCompare(b.name))});
             }
        });

        return orderedGroup;
    }, [programModules, program.categoryOrder]);


    const swsTotals = useMemo(() => relevantGroups.map(sg => {
        return sg.moduleInstancesInSem.reduce((acc, instanceId) => {
            const module = getModuleById(instanceId);
            return acc + (module?.sws || 0);
        }, 0);
    }), [relevantGroups, getModuleById]);

    return (
        <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
                <h3 className="text-xl font-bold">{program.name}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-background/40">
                        <tr>
                            <th className="p-2 w-1/4 min-w-[250px] font-semibold text-left sticky left-0 z-10 bg-inherit">Gruppe</th>
                            {relevantGroups.map(sg => (
                                <th key={sg.id} className="p-2 text-center font-semibold border-l border-border">
                                    <button onClick={() => onSelectGroup(sg.id)} className="hover:text-primary transition-colors">{sg.shortName}</button>
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th className="p-2 text-muted-foreground text-left sticky left-0 z-10 bg-inherit">Semester</th>
                             {relevantGroups.map(sg => (
                                <th key={sg.id} className="p-2 text-center text-muted-foreground font-normal border-l border-border">{sg.relativeIndex + 1}.</th>
                            ))}
                        </tr>
                         <tr>
                            <th className="p-2 text-muted-foreground text-left sticky left-0 z-10 bg-inherit">Teilnehmer</th>
                             {relevantGroups.map(sg => (
                                <th key={sg.id} className="p-2 text-center text-muted-foreground font-normal border-l border-border">{sg.studentCount}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {categorizedModules.map(({ category, modules: catModules }) => (
                            <React.Fragment key={category}>
                                <tr className="bg-muted/20">
                                    <td colSpan={1 + relevantGroups.length} className="p-2 font-bold text-foreground sticky left-0 bg-muted/20">{category}</td>
                                </tr>
                                {catModules.map(module => (
                                    <tr key={module.id} className="border-b border-border/50 hover:bg-muted/20">
                                        <td className="p-2 sticky left-0 bg-card hover:bg-muted/20">
                                            <div className="flex items-center">
                                                <span className="text-muted-foreground text-xs w-10 font-code">{module.id}</span>
                                                <span>{module.name}</span>
                                            </div>
                                        </td>
                                        {relevantGroups.map(sg => (
                                            <td key={sg.id} className="p-2 text-center border-l border-border/50">
                                                {sg.moduleInstancesInSem.some(instanceId => {
                                                     const plannedModule = getModuleById(instanceId);
                                                     if (!plannedModule) return false;
                                                     return plannedModule.id === module.id || plannedModule.equivalentTo === module.id;
                                                }) && (
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
                    <tfoot className="bg-background/40 sticky bottom-0">
                        <tr>
                            <td className="p-2 font-bold sticky left-0 bg-background/40">SWS gesamt</td>
                            {swsTotals.map((total, index) => (
                                 <td key={index} className="p-2 text-center font-bold border-l border-border">{total > 0 ? total : ''}</td>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

const calculateOfferedSws = (
    targetSemester: AbsoluteSemester,
    studiengruppen: Studiengruppe[],
    programs: Program[],
    modules: Module[]
): number => {
    const getModuleById = (id: string): Module | undefined => {
        const directMatch = modules.find(m => m.id === id);
        if (directMatch) return directMatch;
        return modules.find(m => m.type === 'Pool' && id.startsWith(m.id + '-'));
    };
    
    const uniqueModuleCourses = new Set<string>();

    studiengruppen.forEach(gruppe => {
        const relativeIndex = getRelativeSemesterIndex(gruppe.startSemester, targetSemester);
        const program = programs.find(p => p.id === gruppe.programId);

        if (!program || relativeIndex < 0 || relativeIndex >= program.semesters) {
            return;
        }

        const relativeSemesterId = RELATIVE_SEMESTERS[relativeIndex].id;
        const moduleInstanceIds = gruppe.plan.semesters[relativeSemesterId] || [];

        moduleInstanceIds.forEach(instanceId => {
            const module = getModuleById(instanceId);
            if (!module) return;

            const courseId = module.equivalentTo || module.id;
            uniqueModuleCourses.add(courseId);
        });
    });
    
    let totalOfferedSws = 0;
    uniqueModuleCourses.forEach(courseId => {
        const module = getModuleById(courseId);
        if(module) {
            totalOfferedSws += module.sws;
        }
    });

    return totalOfferedSws;
};


export const SemesterOverview: React.FC<{
    studiengruppen: Studiengruppe[];
    getModuleById: (id: string) => Module | undefined;
    programs: Program[];
    selectedSemester: AbsoluteSemester;
    setSelectedSemester: (semester: AbsoluteSemester) => void;
    semesters: AbsoluteSemester[];
    onSelectGroup: (studiengruppeId: string) => void;
    modules: Module[];
}> = ({ 
    studiengruppen, getModuleById, programs, selectedSemester, setSelectedSemester, semesters, onSelectGroup, modules
}) => {
    
    const handleSemesterChange = (direction: 'prev' | 'next') => {
        const currentIndex = semesters.findIndex(s => s.id === selectedSemester.id);
        const newIndex = direction === 'prev' ? Math.max(0, currentIndex - 1) : Math.min(semesters.length - 1, currentIndex + 1);
        setSelectedSemester(semesters[newIndex]);
    };

    const groupedByProgram = useMemo(() => {
        const groups: { [programId: string]: Studiengruppe[] } = {};
        for (const gruppe of studiengruppen) {
            if (!groups[gruppe.programId]) {
                groups[gruppe.programId] = [];
            }
            groups[gruppe.programId].push(gruppe);
        }
        return groups;
    }, [studiengruppen]);

    const poolMetrics = useMemo(() => {
        const participantGroups: Record<string, Set<string>> = {
            'WP1-8': new Set<string>(),
            'F5': new Set<string>(),
            'Lab': new Set<string>(),
        };

        studiengruppen.forEach(gruppe => {
            const relativeIndex = getRelativeSemesterIndex(gruppe.startSemester, selectedSemester);
            const program = programs.find(p => p.id === gruppe.programId);
            
            if (!program || relativeIndex < 0 || relativeIndex >= program.semesters) return;
            
            const relativeSemesterId = RELATIVE_SEMESTERS[relativeIndex].id;
            const moduleInstanceIds = gruppe.plan.semesters[relativeSemesterId] || [];

            moduleInstanceIds.forEach(instanceId => {
                const module = getModuleById(instanceId);
                if (!module) return;
                const poolType = module.id as keyof typeof participantGroups;
                if (participantGroups.hasOwnProperty(poolType)) {
                     participantGroups[poolType].add(gruppe.id);
                }
            });
        });

        const calculateTotalParticipants = (poolType: keyof typeof participantGroups) => {
            return Array.from(participantGroups[poolType]).reduce((total, gruppeId) => {
                const gruppe = studiengruppen.find(g => g.id === gruppeId);
                return total + (gruppe?.studentCount || 0);
            }, 0);
        };

        return {
            wpParticipants: calculateTotalParticipants('WP1-8'),
            f5Participants: calculateTotalParticipants('F5'),
            labParticipants: calculateTotalParticipants('Lab'),
        };
    }, [studiengruppen, selectedSemester, getModuleById, programs]);

    const swsForecast = useMemo(() => {
        const FORECAST_LENGTH = 5;
        const startIndex = semesters.findIndex(s => s.id === selectedSemester.id);
        if (startIndex === -1) return { current: 0, future: [] };
    
        const current = calculateOfferedSws(selectedSemester, studiengruppen, programs, modules);
    
        const future = [];
        for (let i = 1; i <= FORECAST_LENGTH; i++) {
            const futureSemester = semesters[startIndex + i];
            if (!futureSemester) break;
            const totalSws = calculateOfferedSws(futureSemester, studiengruppen, programs, modules);
            future.push({ semester: futureSemester, totalSws });
        }
    
        return { current, future };
    }, [selectedSemester, semesters, studiengruppen, programs, modules]);

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex justify-between items-center gap-8">
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
                 <div className="bg-card border border-border rounded-lg p-3 flex items-stretch">
                    <div className="grid grid-cols-3 divide-x divide-border">
                        <div className="px-4 text-center">
                            <p className="text-xs font-medium text-muted-foreground">Teilnehmer WP</p>
                            <p className="text-xl font-bold text-foreground">{poolMetrics.wpParticipants}</p>
                        </div>
                        <div className="px-4 text-center">
                            <p className="text-xs font-medium text-muted-foreground">Teilnehmer F5/Lab</p>
                            <p className="text-xl font-bold text-foreground">{poolMetrics.f5Participants + poolMetrics.labParticipants}</p>
                        </div>
                        <div className="px-4 text-center">
                            <p className="text-xs font-medium text-muted-foreground">Lehrbedarf SWS</p>
                            <p className="text-xl font-bold text-foreground">{swsForecast.current}</p>
                        </div>
                    </div>
                    <div className="border-l border-border mx-4"></div>
                    <div className="flex flex-col justify-center">
                        <p className="text-xs font-medium text-muted-foreground text-center mb-1">SWS Prognose</p>
                        <div className="flex gap-4">
                            {swsForecast.future.map(item => (
                                <div key={item.semester.id} className="text-center">
                                    <p className="text-xs text-muted-foreground font-semibold">{item.semester.name.replace('SS ', 'S').replace('WS ', 'W').replace('/', '-')}</p>
                                    <p className="font-bold text-foreground">{item.totalSws}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-auto">
                {Object.entries(groupedByProgram).map(([programId, gruppen]) => {
                     const program = programs.find(p => p.id === programId);
                     if (!program) return null;

                     return (
                        <ProgramSection 
                            key={programId}
                            program={program}
                            studiengruppen={gruppen}
                            modules={modules}
                            selectedSemester={selectedSemester}
                            getModuleById={getModuleById}
                            onSelectGroup={onSelectGroup}
                        />
                     )
                })}
            </div>
        </div>
    );
};
