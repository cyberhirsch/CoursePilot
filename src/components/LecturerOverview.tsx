'use client';

import React, { useMemo } from 'react';
import type { LecturerAvailability, Module, SchedulePlan, SystemSettings, User } from '@/types';
import { createDefaultAvailability, getTeachingUsers, WEEKDAYS } from '@/lib/schedule-optimizer';
import { BookOpen, CalendarCheck, Clock, UserRound } from 'lucide-react';

interface LecturerOverviewProps {
  users: User[];
  modules: Module[];
  schedulePlan: SchedulePlan | null;
  lecturerAvailabilities: LecturerAvailability[];
  onUpdateLecturerAvailabilities: (availabilities: LecturerAvailability[]) => void;
  systemSettings?: SystemSettings;
}

const roleLabel: Record<string, string> = {
  professor: 'Professor',
  lecturer: 'Lehrbeauftragte/r',
  admin: 'Admin',
  coordinator: 'Koordination',
  superuser: 'Superuser',
};

export const LecturerOverview: React.FC<LecturerOverviewProps> = ({
  users,
  modules,
  schedulePlan,
  lecturerAvailabilities,
  onUpdateLecturerAvailabilities,
  systemSettings,
}) => {
  const lecturers = useMemo(() => getTeachingUsers(users), [users]);

  const moduleMap = useMemo(() => {
    const map = new Map<string, Module[]>();
    lecturers.forEach(lecturer => {
      map.set(lecturer.id, modules.filter(module => module.personInCharge === lecturer.name));
    });
    return map;
  }, [lecturers, modules]);

  const loadMap = useMemo(() => {
    const map = new Map<string, number>();
    schedulePlan?.entries.forEach(entry => {
      if (!entry.lecturerUserId) return;
      map.set(entry.lecturerUserId, (map.get(entry.lecturerUserId) || 0) + entry.sws);
    });
    return map;
  }, [schedulePlan]);

  const updateMaxSws = (userId: string, maxSwsPerDay: number) => {
    const current = lecturerAvailabilities.find(item => item.userId === userId)
      || createDefaultAvailability(userId, systemSettings);
    const next = { ...current, maxSwsPerDay };
    onUpdateLecturerAvailabilities([
      ...lecturerAvailabilities.filter(item => item.userId !== userId),
      next,
    ]);
  };

  const totalAssignedModules = Array.from(moduleMap.values()).reduce((sum, items) => sum + items.length, 0);
  const scheduledSws = schedulePlan?.summary.totalSws || 0;

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric icon={<UserRound className="h-5 w-5" />} label="Dozenten" value={lecturers.length} />
        <Metric icon={<BookOpen className="h-5 w-5" />} label="Zugeordnete Module" value={totalAssignedModules} />
        <Metric icon={<Clock className="h-5 w-5" />} label="Geplante SWS" value={scheduledSws} />
        <Metric icon={<CalendarCheck className="h-5 w-5" />} label="Plan" value={schedulePlan ? schedulePlan.semesterId.toUpperCase() : '-'} />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm flex-grow">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Dozentenuebersicht</h2>
            <p className="text-sm text-muted-foreground">Lehrlast, Modulverantwortung und Verfuegbarkeitsrahmen.</p>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-muted/40 sticky top-0 z-10">
              <tr className="text-left border-b border-border">
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Rolle</th>
                <th className="p-3 font-semibold">E-Mail</th>
                <th className="p-3 font-semibold text-center">Module</th>
                <th className="p-3 font-semibold text-center">Modul-SWS</th>
                <th className="p-3 font-semibold text-center">Plan-SWS</th>
                <th className="p-3 font-semibold text-center">Max./Tag</th>
                <th className="p-3 font-semibold">Verfuegbarkeit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lecturers.map(lecturer => {
                const assignedModules = moduleMap.get(lecturer.id) || [];
                const availability = lecturerAvailabilities.find(item => item.userId === lecturer.id)
                  || createDefaultAvailability(lecturer.id, systemSettings);
                const moduleSws = assignedModules.reduce((sum, module) => sum + (module.sws || 0), 0);
                const plannedSws = loadMap.get(lecturer.id) || 0;

                return (
                  <tr key={lecturer.id} className="hover:bg-muted/20">
                    <td className="p-3">
                      <div className="font-bold">{lecturer.name}</div>
                      <div className="text-xs text-muted-foreground">{lecturer.department || '-'}</div>
                    </td>
                    <td className="p-3">{roleLabel[lecturer.role] || lecturer.role}</td>
                    <td className="p-3 text-muted-foreground">{lecturer.email}</td>
                    <td className="p-3 text-center font-bold">{assignedModules.length}</td>
                    <td className="p-3 text-center">{moduleSws}</td>
                    <td className="p-3 text-center">
                      <span className={`font-bold ${plannedSws > moduleSws && moduleSws > 0 ? 'text-amber-500' : 'text-foreground'}`}>
                        {plannedSws}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={availability.maxSwsPerDay || 8}
                        onChange={event => updateMaxSws(lecturer.id, Number(event.target.value))}
                        className="w-16 bg-muted rounded-md px-2 py-1 text-center font-bold"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAYS.map(day => {
                          const slots = availability.availableSlots.filter(slot => slot.day === day.id);
                          return (
                            <span key={day.id} className={`px-2 py-1 rounded text-[10px] font-bold ${slots.length ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {day.shortLabel}: {slots.length ? slots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ') : '-'}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
    <div className="p-2 rounded-md bg-primary/10 text-primary">{icon}</div>
    <div>
      <div className="text-xs text-muted-foreground font-semibold uppercase">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  </div>
);
