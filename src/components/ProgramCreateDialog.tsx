'use client';

import React from 'react';
import type { Program } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';

const createInitialProgram = (): Program => ({
  id: '',
  name: '',
  moduleIds: [],
  defaultStudents: 25,
  semesters: 7,
});

interface ProgramCreateDialogProps {
  programs: Program[];
  onAddProgram: (program: Program) => boolean;
  departments?: string[];
  lang?: keyof typeof TRANSLATIONS;
  trigger?: React.ReactNode;
  onCreated?: (programId: string) => void;
}

export const ProgramCreateDialog: React.FC<ProgramCreateDialogProps> = ({
  programs,
  onAddProgram,
  departments = [],
  lang = DEFAULT_LANGUAGE,
  trigger,
  onCreated,
}) => {
  const t = TRANSLATIONS[lang];
  const [isOpen, setOpen] = React.useState(false);
  const [program, setProgram] = React.useState<Program>(createInitialProgram);
  const [error, setError] = React.useState('');

  const updateProgram = <K extends keyof Program>(field: K, value: Program[K]) => {
    setProgram(prev => ({ ...prev, [field]: value }));
  };

  const reset = () => {
    setProgram(createInitialProgram());
    setError('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) reset();
    setOpen(nextOpen);
  };

  const handleSubmit = () => {
    const id = program.id.trim();
    const name = program.name.trim();

    if (!id || !name) {
      setError(t.programs?.idRequired || 'Bitte mindestens ID und Name angeben.');
      return;
    }

    if (programs.some(item => item.id.toLowerCase() === id.toLowerCase())) {
      setError(t.programs?.idExists || 'Ein Studiengang mit dieser ID existiert bereits.');
      return;
    }

    const nextProgram: Program = {
      ...program,
      id,
      name,
      defaultStudents: Math.max(0, Number(program.defaultStudents) || 0),
      semesters: Math.max(1, Number(program.semesters) || 1),
      moduleIds: [],
    };

    if (onAddProgram(nextProgram)) {
      setOpen(false);
      onCreated?.(nextProgram.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t.programs?.newProgram || 'Neuer Studiengang'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t.programs?.createProgramTitle || 'Neuen Studiengang anlegen'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="program-id">ID</Label>
            <Input
              id="program-id"
              value={program.id}
              onChange={event => updateProgram('id', event.target.value)}
              placeholder="z.B. BSC-DSA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-name">{t.common.name}</Label>
            <Input
              id="program-name"
              value={program.name}
              onChange={event => updateProgram('name', event.target.value)}
              placeholder="z.B. B.Sc. Digital Systems"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-default-students">{t.programs?.defaultStudents || 'Standard-Teilnehmer'}</Label>
            <Input
              id="program-default-students"
              type="number"
              min={0}
              value={program.defaultStudents}
              onChange={event => updateProgram('defaultStudents', Number(event.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-semesters">{t.programs?.semesters || 'Semester'}</Label>
            <Input
              id="program-semesters"
              type="number"
              min={1}
              value={program.semesters}
              onChange={event => updateProgram('semesters', Number(event.target.value) || 1)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="program-department">{t.planner.department}</Label>
            <select
              id="program-department"
              value={program.department || ''}
              onChange={event => updateProgram('department', event.target.value || undefined)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">Keine Angabe</option>
              {departments.map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-destructive text-sm sm:col-span-2">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>{t.controls.create}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
