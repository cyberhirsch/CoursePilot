'use client';

import React, { useState, useCallback } from 'react';
import type { Studiengruppe, Module, Program, AbsoluteSemester } from '@/types';
import { LoadingSpinner } from '@/components/icons/LoadingSpinner';
import { SparklesIcon } from '@/components/icons/SparklesIcon';
import { consolidateModules, type ConsolidateModulesOutput } from '@/ai/flows/consolidate-modules';

interface OptimizationPanelProps {
    studiengruppen: Studiengruppe[];
    modules: Module[];
    programs: Program[];
    finalLockedModulesMap: Map<string, Set<string>>;
}

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({ studiengruppen, modules, programs, finalLockedModulesMap }) => {
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
                studiengruppen: studiengruppen.map(sg => ({
                    id: sg.id,
                    shortName: sg.shortName,
                    programId: sg.programId,
                    startSemester: sg.startSemester.name,
                    startSemesterId: sg.startSemester.id,
                    plan: sg.plan,
                    studentCount: sg.studentCount,
                    lockedModules: Array.from(finalLockedModulesMap.get(sg.id) || [])
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
    }, [studiengruppen, modules, programs, finalLockedModulesMap]);

    return (
        <div className="bg-card rounded-lg shadow-md h-full flex flex-col border border-border p-4 md:p-6">
            <div className="text-center border-b-2 border-border pb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Planungsoptimierung</h2>
                <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
                    Dieser KI-Assistent analysiert alle Pläne und Modulanforderungen, um potenzielle Zusammenlegungen zu finden. Das Ziel ist, den gesamten Lehrbedarf (SWS) zu minimieren und gleichzeitig alle curricularen Regeln einzuhalten.
                </p>
                <button 
                    onClick={handleOptimize} 
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center mx-auto gap-3 text-lg"
                >
                    {isLoading ? <LoadingSpinner /> : <SparklesIcon />}
                    <span>{isLoading ? 'Analysiere...' : 'Optimierung starten'}</span>
                </button>
            </div>
            
            {error && (
                <div className="mt-6 bg-destructive/20 border border-destructive/50 text-destructive-foreground/80 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Fehler</h3>
                    <p>{error}</p>
                </div>
            )}

            <div className="mt-6 flex-grow overflow-auto">
                {!optimizationResult && !isLoading && (
                     <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-center">Die Ergebnisse der Optimierung werden hier angezeigt.</p>
                     </div>
                )}

                {optimizationResult && (
                    <div className="space-y-8">
                        {/* Summary Section */}
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-4">Zusammenfassung</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">SWS vorher</p>
                                    <p className="text-3xl font-bold text-foreground">{optimizationResult.summary.totalSwsBefore}</p>
                                </div>
                                <div className="bg-green-900/50 p-4 rounded-lg">
                                    <p className="text-sm text-green-300">SWS gespart</p>
                                    <p className="text-3xl font-bold text-green-300">-{optimizationResult.summary.totalSwsSaved}</p>
                                </div>
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">SWS nachher</p>
                                    <p className="text-3xl font-bold text-primary">{optimizationResult.summary.totalSwsAfter}</p>
                                </div>
                            </div>
                            {optimizationResult.summary.criticalIssues && optimizationResult.summary.criticalIssues.length > 0 && (
                                <div className="mt-4 bg-yellow-900/50 p-3 rounded-lg border border-yellow-700">
                                    <h4 className="font-semibold text-yellow-300 mb-1">Hinweise</h4>
                                    <ul className="list-disc list-inside text-yellow-400 text-sm">
                                        {optimizationResult.summary.criticalIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                        
                        {/* Suggestions Section */}
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-4">Vorschläge zur Zusammenlegung</h3>
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
                                                <span className="font-semibold text-foreground">Gruppen:</span>
                                                <span className="ml-2 text-foreground">{s.participatingGroups.join(', ')}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-foreground">Teilnehmer:</span>
                                                <span className="ml-2 font-bold text-foreground">{s.totalParticipants}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground">Keine weiteren Optimierungen gefunden.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
