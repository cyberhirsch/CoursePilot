'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { AvailabilitySlot, DateAvailabilitySlot, LecturerAvailability as LecturerAvailabilityType, SchedulePlan, SystemSettings, User, Weekday } from '@/types';
import { createDefaultAvailability, getTeachingUsers, WEEKDAYS } from '@/lib/schedule-optimizer';
import { CalendarPlus, Trash2 } from 'lucide-react';

interface LecturerAvailabilityProps {
  users: User[];
  lecturerAvailabilities: LecturerAvailabilityType[];
  onUpdateLecturerAvailabilities: (availabilities: LecturerAvailabilityType[]) => void;
  schedulePlan: SchedulePlan | null;
  systemSettings?: SystemSettings;
}

export const LecturerAvailability: React.FC<LecturerAvailabilityProps> = ({
  users,
  lecturerAvailabilities,
  onUpdateLecturerAvailabilities,
  schedulePlan,
  systemSettings,
}) => {
  const lecturers = useMemo(() => getTeachingUsers(users), [users]);
  const [selectedUserId, setSelectedUserId] = useState<string>(lecturers[0]?.id || '');

  useEffect(() => {
    if (!selectedUserId && lecturers[0]) {
      setSelectedUserId(lecturers[0].id);
    }
  }, [lecturers, selectedUserId]);

  const selectedUser = lecturers.find(user => user.id === selectedUserId);
  const availability = lecturerAvailabilities.find(item => item.userId === selectedUserId)
    || (selectedUserId ? createDefaultAvailability(selectedUserId, systemSettings) : undefined);

  const plannedEntries = useMemo(() => {
    return schedulePlan?.entries.filter(entry => entry.lecturerUserId === selectedUserId) || [];
  }, [schedulePlan, selectedUserId]);

  const dateBlocks = useMemo(() => {
    return (availability?.unavailableDateSlots || [])
      .map((slot, index) => ({ slot, index }))
      .sort((a, b) => (
        a.slot.date.localeCompare(b.slot.date)
        || a.slot.startTime.localeCompare(b.slot.startTime)
        || a.index - b.index
      ));
  }, [availability?.unavailableDateSlots]);

  const persistAvailability = (next: LecturerAvailabilityType) => {
    onUpdateLecturerAvailabilities([
      ...lecturerAvailabilities.filter(item => item.userId !== next.userId),
      next,
    ]);
  };

  const updateSlot = (index: number, updates: Partial<AvailabilitySlot>) => {
    if (!availability) return;
    const nextSlots = availability.availableSlots.map((slot, slotIndex) => (
      slotIndex === index ? { ...slot, ...updates } : slot
    ));
    persistAvailability({ ...availability, availableSlots: nextSlots });
  };

  const addSlot = (day: Weekday) => {
    if (!availability) return;
    persistAvailability({
      ...availability,
      availableSlots: [
        ...availability.availableSlots,
        {
          day,
          startTime: systemSettings?.daySchedule?.startHour || '08:00',
          endTime: '12:00',
        },
      ],
    });
  };

  const removeSlot = (index: number) => {
    if (!availability) return;
    persistAvailability({
      ...availability,
      availableSlots: availability.availableSlots.filter((_, slotIndex) => slotIndex !== index),
    });
  };

  const updateDateBlock = (index: number, updates: Partial<DateAvailabilitySlot>) => {
    if (!availability) return;
    const currentBlocks = availability.unavailableDateSlots || [];
    const nextBlocks = currentBlocks.map((slot, slotIndex) => (
      slotIndex === index ? { ...slot, ...updates } : slot
    ));
    persistAvailability({ ...availability, unavailableDateSlots: nextBlocks });
  };

  const addDateBlock = () => {
    if (!availability) return;
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const startTime = systemSettings?.daySchedule?.startHour || '08:00';
    const endTime = systemSettings?.daySchedule?.endHour || '18:00';

    persistAvailability({
      ...availability,
      unavailableDateSlots: [
        ...(availability.unavailableDateSlots || []),
        {
          id: `blocked-${Date.now()}`,
          date,
          startTime,
          endTime,
          reason: '',
        },
      ],
    });
  };

  const removeDateBlock = (index: number) => {
    if (!availability) return;
    persistAvailability({
      ...availability,
      unavailableDateSlots: (availability.unavailableDateSlots || []).filter((_, slotIndex) => slotIndex !== index),
    });
  };

  const applyStandardWeek = () => {
    if (!availability) return;
    const defaults = createDefaultAvailability(availability.userId, systemSettings);
    persistAvailability({
      ...availability,
      availableSlots: defaults.availableSlots,
      unavailableSlots: defaults.unavailableSlots,
      maxSwsPerDay: defaults.maxSwsPerDay,
    });
  };

  if (!selectedUser || !availability) {
    return (
      <div className="h-full bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground">
        Keine Dozenten gefunden.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-full animate-in fade-in duration-500">
      <aside className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">Verfuegbarkeiten</h2>
          <p className="text-xs text-muted-foreground">Dozent auswaehlen und Zeitfenster pflegen.</p>
        </div>
        <div className="p-2 space-y-1 overflow-auto">
          {lecturers.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUserId(user.id)}
              className={`w-full text-left rounded-md p-3 transition-colors ${selectedUserId === user.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <div className="font-bold text-sm">{user.name}</div>
              <div className={`text-xs ${selectedUserId === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {user.role}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{selectedUser.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyStandardWeek}
              className="px-3 py-2 rounded-md bg-muted text-sm font-bold hover:bg-muted/80"
            >
              Standardwoche
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-border bg-muted/20">
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground uppercase">Max. SWS pro Tag</span>
            <input
              type="number"
              min={1}
              max={12}
              value={availability.maxSwsPerDay || 8}
              onChange={event => persistAvailability({ ...availability, maxSwsPerDay: Number(event.target.value) })}
              className="mt-1 w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Notizen</span>
            <input
              value={availability.notes || ''}
              onChange={event => persistAvailability({ ...availability, notes: event.target.value })}
              className="mt-1 w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
              placeholder="z.B. Forschungsblock, Pendeltag, externe Termine"
            />
          </label>
        </div>

        <div className="flex-grow overflow-auto p-4 space-y-4">
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="p-3 bg-muted/30 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold">Sperrtermine</h3>
                <p className="text-xs text-muted-foreground">Datumsspezifische Verhinderungen</p>
              </div>
              <button
                onClick={addDateBlock}
                className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                title="Sperrtermin hinzufuegen"
              >
                <CalendarPlus className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 space-y-2">
              {dateBlocks.map(({ slot, index }) => (
                <div key={slot.id || `${slot.date}-${index}`} className="grid grid-cols-1 md:grid-cols-[150px_110px_24px_110px_minmax(160px,1fr)_32px] gap-2 md:items-center">
                  <input
                    type="date"
                    value={slot.date}
                    onChange={event => updateDateBlock(index, { date: event.target.value })}
                    className="bg-background border border-input rounded-md px-2 py-1 text-sm"
                  />
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={event => updateDateBlock(index, { startTime: event.target.value })}
                    className="bg-background border border-input rounded-md px-2 py-1 text-sm"
                  />
                  <span className="hidden md:block text-center text-muted-foreground text-sm">bis</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={event => updateDateBlock(index, { endTime: event.target.value })}
                    className="bg-background border border-input rounded-md px-2 py-1 text-sm"
                  />
                  <input
                    value={slot.reason || ''}
                    onChange={event => updateDateBlock(index, { reason: event.target.value })}
                    className="bg-background border border-input rounded-md px-2 py-1 text-sm"
                    placeholder="Grund"
                  />
                  <button
                    onClick={() => removeDateBlock(index)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Sperrtermin entfernen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {dateBlocks.length === 0 && (
                <div className="text-sm text-muted-foreground italic">Keine Sperrtermine.</div>
              )}
            </div>
          </div>

          {WEEKDAYS.map(day => {
            const slotsForDay = availability.availableSlots
              .map((slot, index) => ({ slot, index }))
              .filter(item => item.slot.day === day.id);
            const entriesForDay = plannedEntries.filter(entry => entry.day === day.id);

            return (
              <div key={day.id} className="border border-border rounded-lg overflow-hidden">
                <div className="p-3 bg-muted/30 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{day.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {entriesForDay.length ? `${entriesForDay.length} geplante Veranstaltung(en)` : 'Keine geplanten Veranstaltungen'}
                    </p>
                  </div>
                  <button
                    onClick={() => addSlot(day.id)}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    title="Zeitfenster hinzufuegen"
                  >
                    <CalendarPlus className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-3 space-y-2">
                  {slotsForDay.map(({ slot, index }) => (
                    <div key={`${slot.day}-${index}`} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={event => updateSlot(index, { startTime: event.target.value })}
                        className="bg-background border border-input rounded-md px-2 py-1 text-sm"
                      />
                      <span className="text-muted-foreground">bis</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={event => updateSlot(index, { endTime: event.target.value })}
                        className="bg-background border border-input rounded-md px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => removeSlot(index)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Zeitfenster entfernen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {slotsForDay.length === 0 && (
                    <div className="text-sm text-muted-foreground italic">Nicht verfuegbar.</div>
                  )}

                  {entriesForDay.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {entriesForDay.map(entry => (
                        <span key={entry.id} className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-bold">
                          {entry.startTime}-{entry.endTime} {entry.moduleName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
