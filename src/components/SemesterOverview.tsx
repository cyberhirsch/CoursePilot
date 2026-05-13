

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Cohort, Module, AbsoluteSemester, Program } from '../types';
import { getRelativeSemesterIndex, RELATIVE_SEMESTERS } from '../constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

interface ProgramSectionProps {
    program: Program;
    cohorts: Cohort[];
    modules: Module[];
    selectedSemester: AbsoluteSemester;
    getModuleById: (id: string) => Module | undefined;
    onSelectGroup: (cohortId: string) => void;
    allSemesters: AbsoluteSemester[];
    onRemove?: () => void;
}

const ProgramSection: React.FC<ProgramSectionProps & { lang?: keyof typeof TRANSLATIONS }> = ({ program, cohorts, modules, selectedSemester, getModuleById, onSelectGroup, allSemesters, onRemove, lang = DEFAULT_LANGUAGE }) => {
    const t = TRANSLATIONS[lang];

    const relevantGroups = useMemo(() => cohorts
        .filter(sg => sg.programId === program.id)
        .map(sg => {
            const relativeIndex = getRelativeSemesterIndex(allSemesters, sg.startSemester, selectedSemester);
            if (relativeIndex < 0 || relativeIndex >= program.semesters) return null;

            const relativeSemId = `sem${relativeIndex + 1}`;
            const moduleInstancesInSem = sg.plan.semesters[relativeSemId] || [];

            return {
                ...sg,
                relativeIndex,
                moduleInstancesInSem
            };
        })
        .filter(Boolean) as (Cohort & { relativeIndex: number; moduleInstancesInSem: string[] })[], [cohorts, program, selectedSemester]);

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
                orderedGroup.push({ category: catName, modules: grouped[catName].sort((a, b) => a.name.localeCompare(b.name)) });
            }
        });

        Object.keys(grouped).forEach(catName => {
            if (!categoryOrder.includes(catName)) {
                orderedGroup.push({ category: catName, modules: grouped[catName].sort((a, b) => a.name.localeCompare(b.name)) });
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
            <div className="p-4 border-b border-border flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold">{program.name}</h3>
                {onRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label={(t.semesterOverview?.removeProgram || 'Studiengang aus Übersicht entfernen').replace('{name}', program.name)}
                        title={(t.semesterOverview?.removeProgram || 'Studiengang aus Übersicht entfernen').replace('{name}', program.name)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
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
                            <td className="p-2 font-bold sticky left-0 bg-background/40">{t?.semesterOverview?.totalSws || 'SWS gesamt'}</td>
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
    cohorts: Cohort[],
    programs: Program[],
    modules: Module[],
    allSemesters: AbsoluteSemester[]
): number => {
    const getModuleById = (id: string): Module | undefined => {
        const directMatch = modules.find(m => m.id === id);
        if (directMatch) return directMatch;
        return modules.find(m => m.type === 'Pool' && id.startsWith(m.id + '-'));
    };

    const uniqueModuleCourses = new Set<string>();

    cohorts.forEach(cohort => {
        const relativeIndex = getRelativeSemesterIndex(allSemesters, cohort.startSemester, targetSemester);
        const program = programs.find(p => p.id === cohort.programId);

        if (!program || relativeIndex < 0 || relativeIndex >= program.semesters) {
            return;
        }

        const relativeSemesterId = RELATIVE_SEMESTERS[relativeIndex].id;
        const moduleInstanceIds = cohort.plan.semesters[relativeSemesterId] || [];

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
        if (module) {
            totalOfferedSws += module.sws;
        }
    });

    return totalOfferedSws;
};


export const SemesterOverview: React.FC<{
    cohorts: Cohort[];
    getModuleById: (id: string) => Module | undefined;
    programs: Program[];
    selectedSemester: AbsoluteSemester;
    setSelectedSemester: (semester: AbsoluteSemester) => void;
    semesters: AbsoluteSemester[];
    onSelectGroup: (cohortId: string) => void;
    modules: Module[];
    lang?: keyof typeof TRANSLATIONS;
}> = ({
    cohorts, getModuleById, programs, selectedSemester, setSelectedSemester, semesters, onSelectGroup, modules, lang = DEFAULT_LANGUAGE
}) => {
        const t = TRANSLATIONS[lang];

        if (!selectedSemester) {
            return <div className="p-12 text-center italic opacity-50">Lade Semesterdaten...</div>;
        }

        const handleSemesterChange = (direction: 'prev' | 'next') => {
            const currentIndex = semesters.findIndex(s => s.id === selectedSemester.id);
            const newIndex = direction === 'prev' ? Math.max(0, currentIndex - 1) : Math.min(semesters.length - 1, currentIndex + 1);
            setSelectedSemester(semesters[newIndex]);
        };

        const groupedByProgram = useMemo(() => {
            const groups: { [programId: string]: Cohort[] } = {};
            for (const cohort of cohorts) {
                if (!groups[cohort.programId]) {
                    groups[cohort.programId] = [];
                }
                groups[cohort.programId].push(cohort);
            }
            return groups;
        }, [cohorts]);

        const availableProgramSections = useMemo(() => {
            return Object.entries(groupedByProgram)
                .map(([programId, programCohorts]) => {
                    const program = programs.find(p => p.id === programId);
                    if (!program) return null;

                    const hasVisibleCohort = programCohorts.some(cohort => {
                        const relativeIndex = getRelativeSemesterIndex(semesters, cohort.startSemester, selectedSemester);
                        return relativeIndex >= 0 && relativeIndex < program.semesters;
                    });
                    if (!hasVisibleCohort) return null;

                    return { program, cohorts: programCohorts };
                })
                .filter(Boolean)
                .sort((a, b) => a!.program.name.localeCompare(b!.program.name)) as { program: Program; cohorts: Cohort[] }[];
        }, [groupedByProgram, programs, selectedSemester, semesters]);

        const availableProgramIds = useMemo(
            () => availableProgramSections.map(section => section.program.id),
            [availableProgramSections]
        );
        const [selectedProgramIds, setSelectedProgramIds] = useState<string[] | null>(null);

        useEffect(() => {
            setSelectedProgramIds(prev => {
                if (prev === null) return prev;
                const next = prev.filter(programId => availableProgramIds.includes(programId));
                return next.length === prev.length && next.every((programId, index) => programId === prev[index])
                    ? prev
                    : next;
            });
        }, [availableProgramIds]);

        const displayedProgramIds = selectedProgramIds ?? availableProgramIds;
        const displayedProgramSections = availableProgramSections.filter(section => displayedProgramIds.includes(section.program.id));
        const hiddenProgramSections = availableProgramSections.filter(section => !displayedProgramIds.includes(section.program.id));

        const handleAddProgramToOverview = (programId: string) => {
            setSelectedProgramIds(prev => {
                const currentProgramIds = prev ?? displayedProgramIds;
                if (currentProgramIds.includes(programId)) return currentProgramIds;
                return [...currentProgramIds, programId];
            });
        };

        const handleRemoveProgramFromOverview = (programId: string) => {
            setSelectedProgramIds(prev => {
                const currentProgramIds = prev ?? displayedProgramIds;
                return currentProgramIds.filter(id => id !== programId);
            });
        };

        const poolMetrics = useMemo(() => {
            const participantGroups: Record<string, Set<string>> = {
                'WP1-8': new Set<string>(),
                'F5': new Set<string>(),
                'Lab': new Set<string>(),
            };

            cohorts.forEach(cohort => {
                const relativeIndex = getRelativeSemesterIndex(semesters, cohort.startSemester, selectedSemester);
                const program = programs.find(p => p.id === cohort.programId);

                if (!program || relativeIndex < 0 || relativeIndex >= program.semesters) return;

                const relativeSemesterId = RELATIVE_SEMESTERS[relativeIndex].id;
                const moduleInstanceIds = cohort.plan.semesters[relativeSemesterId] || [];

                moduleInstanceIds.forEach(instanceId => {
                    const module = getModuleById(instanceId);
                    if (!module) return;
                    const poolType = module.id as keyof typeof participantGroups;
                    if (participantGroups.hasOwnProperty(poolType)) {
                        participantGroups[poolType].add(cohort.id);
                    }
                });
            });

            const calculateTotalParticipants = (poolType: keyof typeof participantGroups) => {
                return Array.from(participantGroups[poolType]).reduce((total, cohortId) => {
                    const cohort = cohorts.find(g => g.id === cohortId);
                    return total + (cohort?.studentCount || 0);
                }, 0);
            };

            return {
                wpParticipants: calculateTotalParticipants('WP1-8'),
                f5Participants: calculateTotalParticipants('F5'),
                labParticipants: calculateTotalParticipants('Lab'),
            };
        }, [cohorts, selectedSemester, getModuleById, programs]);

        const swsForecast = useMemo(() => {
            const FORECAST_LENGTH = 5;
            const startIndex = semesters.findIndex(s => s.id === selectedSemester.id);
            if (startIndex === -1) return { current: 0, future: [] };

            const current = calculateOfferedSws(selectedSemester, cohorts, programs, modules, semesters);

            const future = [];
            for (let i = 1; i <= FORECAST_LENGTH; i++) {
                const futureSemester = semesters[startIndex + i];
                if (!futureSemester) break;
                const totalSws = calculateOfferedSws(futureSemester, cohorts, programs, modules, semesters);
                future.push({ semester: futureSemester, totalSws });
            }

            return { current, future };
        }, [selectedSemester, semesters, cohorts, programs, modules]);

        return (
            <div className="h-full flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <h2 className="text-xl font-bold text-foreground">{t.semesterOverview.title}:</h2>
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
                        <select
                            value=""
                            onChange={event => {
                                if (event.target.value) {
                                    handleAddProgramToOverview(event.target.value);
                                }
                            }}
                            disabled={hiddenProgramSections.length === 0}
                            className="h-10 min-w-[260px] rounded-md border border-input bg-background px-3 py-2 text-sm font-medium disabled:opacity-50"
                            aria-label={t.semesterOverview?.addProgram || 'Studiengang zur Übersicht hinzufügen'}
                        >
                            <option value="">
                                {hiddenProgramSections.length > 0
                                    ? t.semesterOverview?.addProgram || 'Studiengang hinzufügen'
                                    : t.semesterOverview?.allProgramsVisible || 'Alle Studiengänge sichtbar'}
                            </option>
                            {hiddenProgramSections.map(({ program }) => (
                                <option key={program.id} value={program.id}>{program.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 flex items-stretch">
                        <div className="grid grid-cols-3 divide-x divide-border">
                            <div className="px-4 text-center">
                                <p className="text-xs font-medium text-muted-foreground">{t.semesterOverview.participantsWp}</p>
                                <p className="text-xl font-bold text-foreground">{poolMetrics.wpParticipants}</p>
                            </div>
                            <div className="px-4 text-center">
                                <p className="text-xs font-medium text-muted-foreground">{t.semesterOverview.participantsF5Lab}</p>
                                <p className="text-xl font-bold text-foreground">{poolMetrics.f5Participants + poolMetrics.labParticipants}</p>
                            </div>
                            <div className="px-4 text-center">
                                <p className="text-xs font-medium text-muted-foreground">{t.semesterOverview.teachingDemand}</p>
                                <p className="text-xl font-bold text-foreground">{swsForecast.current}</p>
                            </div>
                        </div>
                        <div className="border-l border-border mx-4"></div>
                        <div className="flex flex-col justify-center">
                            <p className="text-xs font-medium text-muted-foreground text-center mb-1">{t.semesterOverview.forecast}</p>
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

                <div className="flex-grow min-h-0 min-w-0 overflow-x-auto overflow-y-auto pb-4">
                    {displayedProgramSections.length > 0 ? (
                        <div className="flex w-max gap-6 pr-4">
                            {displayedProgramSections.map(({ program, cohorts }) => (
                                <div key={program.id} className="w-[calc(50vw-2rem)] min-w-[720px] max-w-[980px] shrink-0">
                                    <ProgramSection
                                        program={program}
                                        cohorts={cohorts}
                                        modules={modules}
                                        selectedSemester={selectedSemester}
                                        getModuleById={getModuleById}
                                        onSelectGroup={onSelectGroup}
                                        allSemesters={semesters}
                                        onRemove={() => handleRemoveProgramFromOverview(program.id)}
                                        lang={lang}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full min-h-[260px] flex items-center justify-center rounded-lg border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
                            {t.semesterOverview?.noVisiblePrograms || 'Keine Studiengänge ausgewählt.'}
                        </div>
                    )}
                </div>
            </div>
        );
    };
