'use client';

import React, { useState, useCallback } from 'react';
import type { Cohort, Module, Program, AbsoluteSemester } from '@/types';
import { LoadingSpinner } from '@/components/icons/LoadingSpinner';
import { SparklesIcon } from '@/components/icons/SparklesIcon';
import { consolidateModules, type ConsolidateModulesOutput } from '@/ai/flows/consolidate-modules';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

interface OptimizationPanelProps {
    cohorts: Cohort[];
    modules: Module[];
    programs: Program[];
    finalLockedModulesMap: Map<string, Set<string>>;
    lang?: keyof typeof TRANSLATIONS;
}

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({ cohorts, modules, programs, finalLockedModulesMap, lang = DEFAULT_LANGUAGE }) => {
    const t = TRANSLATIONS[lang];
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [optimizationResult, setOptimizationResult] = useState<ConsolidateModulesOutput | null>(null);

    const handleOptimize = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setOptimizationResult(null);

        try {
            const promptData = {
                modules: modules.map(({ id, name, sws, prerequisites, forbiddenSemesters, type }) => ({ id, name, sws, prerequisites, forbiddenSemesters, type })),
                programs: programs.map(({ id, name, moduleIds }) => ({ id, name, moduleIds })),
                cohorts: cohorts.map((cohort: Cohort) => ({
                    id: cohort.id,
                    shortName: cohort.shortName,
                    programId: cohort.programId,
                    startSemester: cohort.startSemester.name,
                    startSemesterId: cohort.startSemester.id,
                    plan: cohort.plan,
                    studentCount: cohort.studentCount,
                    lockedModules: Array.from(finalLockedModulesMap.get(cohort.id) || [])
                }))
            };

            const resultJson = await consolidateModules(promptData);
            setOptimizationResult(resultJson);

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Fehler bei der Optimierung. Bitte prüfen Sie die Konsolenausgabe. Details: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [cohorts, modules, programs, finalLockedModulesMap]);

    return (
        <div className="bg-card rounded-lg shadow-md h-full flex flex-col border border-border p-4 md:p-6">
            <div className="text-center border-b-2 border-border pb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">{t.optimization.title}</h2>
                <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
                    {t.optimization.description}
                </p>
                <button
                    onClick={handleOptimize}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center mx-auto gap-3 text-lg"
                >
                    {isLoading ? <LoadingSpinner /> : <SparklesIcon />}
                    <span>{isLoading ? t.optimization.analyzing : t.optimization.start}</span>
                </button>
            </div>

            {error && (
                <div className="mt-6 bg-destructive/20 border border-destructive/50 text-destructive-foreground/80 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">{t.common.error}</h3>
                    <p>{error}</p>
                </div>
            )}

            <div className="mt-6 flex-grow overflow-auto">
                {!optimizationResult && !isLoading && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-center">{t.optimization.results}...</p>
                    </div>
                )}

                {optimizationResult && (
                    <div className="space-y-8">
                        {/* Summary Section */}
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-4">{t.optimization.summary}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">{t.optimization.swsBefore}</p>
                                    <p className="text-3xl font-bold text-foreground">{optimizationResult.summary.totalSwsBefore}</p>
                                </div>
                                <div className="bg-green-900/50 p-4 rounded-lg">
                                    <p className="text-sm text-green-300">{t.optimization.swsSaved}</p>
                                    <p className="text-3xl font-bold text-green-300">-{optimizationResult.summary.totalSwsSaved}</p>
                                </div>
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">{t.optimization.swsAfter}</p>
                                    <p className="text-3xl font-bold text-primary">{optimizationResult.summary.totalSwsAfter}</p>
                                </div>
                            </div>
                            {optimizationResult.summary.criticalIssues && optimizationResult.summary.criticalIssues.length > 0 && (
                                <div className="mt-4 bg-yellow-900/50 p-3 rounded-lg border border-yellow-700">
                                    <h4 className="font-semibold text-yellow-300 mb-1">{t.optimization.hints}</h4>
                                    <ul className="list-disc list-inside text-yellow-400 text-sm">
                                        {optimizationResult.summary.criticalIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Suggestions Section */}
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-4">{t.optimization.suggestions}</h3>
                            <div className="space-y-4">
                                {optimizationResult.suggestions.length > 0 ? optimizationResult.suggestions.map((s, i) => (
                                    <div key={i} className="bg-muted/50 rounded-lg p-4 border border-border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg text-primary">{s.consolidatedModule} <span className="text-sm font-code text-muted-foreground">({s.moduleId})</span></h4>
                                                <p className="text-sm text-muted-foreground">{s.reasoning}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-4">
                                                <p className="text-base font-bold text-green-400">-{s.swsSaved} SWS</p>
                                                <p className="text-xs text-muted-foreground">{s.semester}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 border-t border-border pt-3 flex justify-between items-center text-sm">
                                            <div>
                                                <span className="font-semibold text-foreground">{t.optimization.groups}:</span>
                                                <span className="ml-2 text-foreground">{s.participatingGroups.join(', ')}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-foreground">{t.common.participants}:</span>
                                                <span className="ml-2 font-bold text-foreground">{s.totalParticipants}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground">{t.optimization.noOptimization}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
