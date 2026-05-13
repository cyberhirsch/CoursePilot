'use client';

import React from 'react';
import type { Module, Program, User } from '@/types';
import { DEFAULT_LANGUAGE, TRANSLATIONS } from '@/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, PlusCircle, Trash2 } from 'lucide-react';

interface DepartmentManagementProps {
  departments: string[];
  modules: Module[];
  programs: Program[];
  users: User[];
  onAddDepartment: (name: string) => boolean;
  onUpdateDepartment: (oldName: string, newName: string) => boolean;
  onDeleteDepartment: (name: string) => boolean;
  lang?: keyof typeof TRANSLATIONS;
}

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({
  departments,
  modules,
  programs,
  users,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  lang = DEFAULT_LANGUAGE,
}) => {
  const t = TRANSLATIONS[lang];
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);
  const [newDepartmentName, setNewDepartmentName] = React.useState('');
  const [error, setError] = React.useState('');

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const sortedDepartments = React.useMemo(
    () => [...departments]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .filter(name => !normalizedSearch || name.toLowerCase().includes(normalizedSearch)),
    [departments, normalizedSearch]
  );

  const usageByDepartment = React.useMemo(() => {
    const usage = new Map<string, { programs: number; modules: number; users: number }>();
    departments.forEach(name => {
      usage.set(name, {
        programs: programs.filter(program => program.department === name).length,
        modules: modules.filter(module => module.department === name).length,
        users: users.filter(user => user.department === name).length,
      });
    });
    return usage;
  }, [departments, modules, programs, users]);

  const handleAddDepartment = () => {
    const name = newDepartmentName.trim();
    if (!name) {
      setError(t.departments?.nameRequired || 'Bitte einen Namen für den Fachbereich angeben.');
      return;
    }
    if (departments.some(department => department.toLowerCase() === name.toLowerCase())) {
      setError(t.departments?.nameExists || 'Dieser Fachbereich existiert bereits.');
      return;
    }
    if (onAddDepartment(name)) {
      setNewDepartmentName('');
      setError('');
      setIsAdding(false);
    }
  };

  const handleRenameDepartment = (oldName: string, nextName: string) => {
    const trimmedName = nextName.trim();
    if (!trimmedName || trimmedName === oldName) return;
    if (!onUpdateDepartment(oldName, trimmedName)) {
      setError(t.departments?.nameExists || 'Dieser Fachbereich existiert bereits.');
    } else {
      setError('');
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-md h-full flex flex-col border border-border">
      <div className="p-4 border-b-2 border-border flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t.departments?.title || 'Fachbereiche'}</h2>
            <p className="text-sm text-muted-foreground">
              {t.departments?.subtitle || 'Zentrale Verwaltung der Fachbereiche für Studiengänge, Module und Nutzer.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Suchen..."
            className="w-64"
          />
          <Button onClick={() => setIsAdding(prev => !prev)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t.departments?.newDepartment || 'Neuer Fachbereich'}
          </Button>
        </div>
      </div>

      {isAdding && (
        <div className="p-4 border-b border-border bg-primary/5">
          <div className="flex flex-col md:flex-row gap-2 md:items-end">
            <label className="block flex-grow max-w-lg">
              <span className="text-xs font-semibold uppercase text-muted-foreground">{t.common.name}</span>
              <Input
                value={newDepartmentName}
                onChange={event => setNewDepartmentName(event.target.value)}
                placeholder="z.B. Applied Engineering"
                className="mt-1"
              />
            </label>
            <Button onClick={handleAddDepartment}>{t.controls.create}</Button>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 border-b border-destructive/30 bg-destructive/10 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="flex-grow overflow-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm text-left">
              <th className="p-3 border-b border-border min-w-[260px]">{t.common.name}</th>
              <th className="p-3 border-b border-border text-center">{t.departments?.usedByPrograms || 'Studiengänge'}</th>
              <th className="p-3 border-b border-border text-center">{t.departments?.usedByModules || 'Module'}</th>
              <th className="p-3 border-b border-border text-center">{t.departments?.usedByUsers || 'Nutzer'}</th>
              <th className="p-3 border-b border-border text-right">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {sortedDepartments.map(name => {
              const usage = usageByDepartment.get(name) || { programs: 0, modules: 0, users: 0 };
              const usageCount = usage.programs + usage.modules + usage.users;
              return (
                <tr key={name} className="hover:bg-muted/50">
                  <td className="p-2 border-t border-border">
                    <Input
                      defaultValue={name}
                      onBlur={event => handleRenameDepartment(name, event.target.value)}
                      className="font-semibold"
                    />
                  </td>
                  <td className="p-3 border-t border-border text-center font-semibold">{usage.programs}</td>
                  <td className="p-3 border-t border-border text-center font-semibold">{usage.modules}</td>
                  <td className="p-3 border-t border-border text-center font-semibold">{usage.users}</td>
                  <td className="p-3 border-t border-border text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteDepartment(name)}
                      disabled={usageCount > 0}
                      title={usageCount > 0 ? (t.departments?.deleteBlocked || 'Dieser Fachbereich wird noch verwendet.') : t.common.delete}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedDepartments.length === 0 && (
          <div className="p-12 text-center text-muted-foreground italic">
            {t.departments?.noDepartments || 'Noch keine Fachbereiche angelegt.'}
          </div>
        )}
      </div>
    </div>
  );
};
