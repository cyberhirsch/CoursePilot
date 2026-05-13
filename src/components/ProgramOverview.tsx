'use client';

import React from 'react';
import type { Cohort, Module, Program } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, ChevronDown, PlusCircle } from 'lucide-react';
import { ProgramCreateDialog } from '@/components/ProgramCreateDialog';

interface ProgramOverviewProps {
  programs: Program[];
  modules: Module[];
  cohorts: Cohort[];
  onAddProgram: (program: Program) => boolean;
  onUpdateProgram: (programId: string, updates: Partial<Program>) => void;
  departments?: string[];
  lang?: keyof typeof TRANSLATIONS;
}

export const ProgramOverview: React.FC<ProgramOverviewProps> = ({
  programs,
  modules,
  cohorts,
  onAddProgram,
  onUpdateProgram,
  departments = [],
  lang = DEFAULT_LANGUAGE,
}) => {
  const t = TRANSLATIONS[lang];
  const [expandedProgramId, setExpandedProgramId] = React.useState<string | null>(programs[0]?.id || null);
  const modulesByCategory = React.useMemo(() => {
    const groups = new Map<string, Module[]>();
    modules.forEach(module => {
      const category = module.category || 'Ohne Kategorie';
      groups.set(category, [...(groups.get(category) || []), module]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [modules]);

  const updateModuleAssignment = (program: Program, moduleId: string, isAssigned: boolean) => {
    const current = new Set(program.moduleIds);
    if (isAssigned) {
      current.add(moduleId);
    } else {
      current.delete(moduleId);
    }
    onUpdateProgram(program.id, { moduleIds: Array.from(current) });
  };

  const sortedPrograms = React.useMemo(
    () => [...programs].sort((a, b) => a.name.localeCompare(b.name)),
    [programs]
  );

  return (
    <div className="bg-card rounded-lg shadow-md h-full flex flex-col border border-border">
      <div className="p-4 border-b-2 border-border flex justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.programs?.title || 'Studiengänge'}</h2>
          <p className="text-sm text-muted-foreground">
            {t.programs?.subtitle || 'Zentrale Übersicht aller Studiengänge, Modulzuordnungen und Kohorten.'}
          </p>
        </div>
        <ProgramCreateDialog
          programs={programs}
          onAddProgram={onAddProgram}
          departments={departments}
          lang={lang}
          onCreated={setExpandedProgramId}
          trigger={(
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t.programs?.newProgram || 'Neuer Studiengang'}
            </Button>
          )}
        />
      </div>

      <div className="flex-grow overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm text-left">
              <th className="p-2 border-b border-border w-12" aria-label="Details ausklappen"></th>
              <th className="p-2 border-b border-border w-32 font-code">ID</th>
              <th className="p-2 border-b border-border min-w-[260px]">{t.common.name}</th>
              <th className="p-2 border-b border-border w-40">{t.planner.department}</th>
              <th className="p-2 border-b border-border w-28 text-center">{t.programs?.semesters || 'Semester'}</th>
              <th className="p-2 border-b border-border w-36 text-center">{t.programs?.defaultStudents || 'Standard-Teilnehmer'}</th>
              <th className="p-2 border-b border-border w-24 text-center">{t.programs?.moduleCount || 'Module'}</th>
              <th className="p-2 border-b border-border w-24 text-center">{t.programs?.cohortCount || 'Kohorten'}</th>
            </tr>
          </thead>
          <tbody>
            {sortedPrograms.length > 0 ? sortedPrograms.map(program => {
              const programCohorts = cohorts.filter(cohort => cohort.programId === program.id);
              const isExpanded = expandedProgramId === program.id;

              return (
                <React.Fragment key={program.id}>
                  <tr className="hover:bg-muted/60">
                    <td className="p-1 border-t border-border text-center">
                      <button
                        onClick={() => setExpandedProgramId(isExpanded ? null : program.id)}
                        className="p-1 rounded-full hover:bg-accent/20 text-muted-foreground hover:text-foreground"
                        title="Module anzeigen/verbergen"
                      >
                        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                    <td className="p-2 border-t border-border font-code text-muted-foreground">{program.id}</td>
                    <td className="p-1 border-t border-border">
                      <Input
                        value={program.name}
                        onChange={event => onUpdateProgram(program.id, { name: event.target.value })}
                        className="font-semibold"
                      />
                    </td>
                    <td className="p-1 border-t border-border">
                      <select
                        value={program.department || ''}
                        onChange={event => onUpdateProgram(program.id, { department: event.target.value || undefined })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">-</option>
                        {departments.map(department => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1 border-t border-border text-center">
                      <Input
                        type="number"
                        min={1}
                        value={program.semesters}
                        onChange={event => onUpdateProgram(program.id, { semesters: Number(event.target.value) || 1 })}
                        className="text-center"
                      />
                    </td>
                    <td className="p-1 border-t border-border text-center">
                      <Input
                        type="number"
                        min={0}
                        value={program.defaultStudents}
                        onChange={event => onUpdateProgram(program.id, { defaultStudents: Number(event.target.value) || 0 })}
                        className="text-center"
                      />
                    </td>
                    <td className="p-2 border-t border-border text-center font-semibold">{program.moduleIds.length}</td>
                    <td className="p-2 border-t border-border text-center font-semibold">{programCohorts.length}</td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-background/40">
                      <td colSpan={8} className="p-0">
                        <div className="p-4 space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <BookOpen className="h-4 w-4 text-primary" />
                            {t.programs?.assignedModules || 'Zugeordnete Module'}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {modulesByCategory.map(([category, categoryModules]) => (
                              <div key={category} className="rounded-md border border-border bg-card/70 p-3">
                                <h3 className="text-sm font-bold mb-2">{category}</h3>
                                <div className="space-y-2">
                                  {categoryModules.map(module => (
                                    <label key={module.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <input
                                        type="checkbox"
                                        checked={program.moduleIds.includes(module.id)}
                                        onChange={event => updateModuleAssignment(program, module.id, event.target.checked)}
                                        className="mt-1"
                                      />
                                      <span>
                                        <span className="font-semibold text-foreground">{module.name}</span>
                                        <span className="block font-code text-xs">{module.id}</span>
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }) : (
              <tr>
                <td colSpan={8} className="text-center p-8 text-muted-foreground">
                  {t.programs?.noPrograms || 'Noch keine Studiengänge angelegt.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
