'use client';

import React, { useState, useMemo } from 'react';
import type { Room, Module, Cohort, RoomAssignment } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';
import { AlertTriangle, DoorOpen, Pencil, Save, Trash2, X } from 'lucide-react';

interface RoomOccupancyProps {
    rooms: Room[];
    modules: Module[];
    cohorts: Cohort[];
    roomAssignments: RoomAssignment[];
    onUpdateRoomAssignments: (assignments: RoomAssignment[]) => void;
    lang?: keyof typeof TRANSLATIONS;
}

export const RoomOccupancy: React.FC<RoomOccupancyProps> = ({
    rooms,
    modules,
    cohorts,
    roomAssignments,
    onUpdateRoomAssignments,
    lang = DEFAULT_LANGUAGE,
}) => {
    const t = TRANSLATIONS[lang];
    const toDateInputValue = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<RoomAssignment | null>(null);
    const [editDraft, setEditDraft] = useState<RoomAssignment | null>(null);
    const [editValidationProblems, setEditValidationProblems] = useState<string[]>([]);
    const [newAssignment, setNewAssignment] = useState<Partial<RoomAssignment>>({
        startTime: '08:00',
        endTime: '12:00',
        title: '',
        purpose: '',
        person: ''
    });

    const formattedDate = useMemo(() => {
        return new Date(`${selectedDate}T00:00:00`).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }, [selectedDate, lang]);

    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00 to match screenshot

    const filteredAssignments = useMemo(() => {
        const assignments: Record<string, RoomAssignment[]> = {};

        roomAssignments.filter(a => a.date === selectedDate).forEach(a => {
            if (!assignments[a.roomId]) assignments[a.roomId] = [];
            assignments[a.roomId].push(a);
        });

        return assignments;
    }, [roomAssignments, selectedDate]);

    const getHourNum = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h + (m / 60);
    };

    const changeDate = (days: number) => {
        const newDate = new Date(`${selectedDate}T00:00:00`);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(toDateInputValue(newDate));
    };

    const setToday = () => setSelectedDate(toDateInputValue(new Date()));

    const timeToMinutes = (time: string) => {
        const [hour = '0', minute = '0'] = time.split(':');
        return Number(hour) * 60 + Number(minute);
    };

    const rangesOverlap = (startA: string, endA: string, startB: string, endB: string) => {
        return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
    };

    const roomBlockedOn = (room: Room, date: string, startTime: string, endTime: string) => {
        return (room.blockedPeriods || []).some(block => {
            if (!block.start || !block.end) return false;
            const blockStartDate = block.start.slice(0, 10);
            const blockEndDate = block.end.slice(0, 10);
            if (date < blockStartDate || date > blockEndDate) return false;

            const blockStartTime = block.start.slice(11, 16) || '00:00';
            const blockEndTime = block.end.slice(11, 16) || '23:59';
            return rangesOverlap(startTime, endTime, blockStartTime, blockEndTime);
        });
    };

    const getAssignmentParticipants = (assignment: RoomAssignment) => {
        return (assignment.cohortId || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
            .reduce((sum, cohortId) => {
                const cohort = cohorts.find(item => item.id === cohortId);
                return sum + (cohort?.studentCount || 0);
            }, 0);
    };

    const roomFitsAssignment = (room: Room, assignment: RoomAssignment) => {
        const participants = getAssignmentParticipants(assignment);
        if (participants > 0 && (room.capacity || 0) < participants) return false;

        const module = modules.find(item => item.id === assignment.moduleId);
        const requirements = module?.requirements;
        if (!requirements) return true;

        if (requirements.beamer && !room.equipment?.beamer) return false;
        if (requirements.lecturerPc && !room.equipment?.lecturerPc) return false;
        if (requirements.macRoom && !room.equipment?.macRoom) return false;
        if (requirements.pcLab && !room.equipment?.pcLab) return false;

        return true;
    };

    const roomAvailableForAssignment = (room: Room, assignment: RoomAssignment) => {
        if (!assignment.date || !assignment.startTime || !assignment.endTime) return false;
        if (!roomFitsAssignment(room, assignment)) return false;
        if (roomBlockedOn(room, assignment.date, assignment.startTime, assignment.endTime)) return false;

        return !roomAssignments.some(item =>
            item.id !== assignment.id
            && item.roomId === room.id
            && item.date === assignment.date
            && rangesOverlap(assignment.startTime, assignment.endTime, item.startTime, item.endTime)
        );
    };

    const getAvailableRoomsForDraft = (assignment: RoomAssignment) => {
        return rooms
            .filter(room => roomAvailableForAssignment(room, assignment))
            .sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
    };

    const updateEditDraft = (updates: Partial<RoomAssignment>) => {
        setEditValidationProblems([]);
        setEditDraft(current => current ? { ...current, ...updates } : current);
    };

    const openEdit = (assignment: RoomAssignment) => {
        setEditValidationProblems([]);
        setEditingAssignment(assignment);
        setEditDraft({ ...assignment });
        setShowAddForm(false);
    };

    const closeEdit = () => {
        setEditingAssignment(null);
        setEditDraft(null);
        setEditValidationProblems([]);
    };

    const getAssignmentValidationProblems = (assignment: RoomAssignment) => {
        const problems: string[] = [];

        if (!assignment.roomId || !assignment.date || !assignment.startTime || !assignment.endTime || !assignment.title.trim()) {
            problems.push('Bitte Raum, Datum, Uhrzeit und Titel ausfuellen.');
            return problems;
        }

        if (timeToMinutes(assignment.startTime) >= timeToMinutes(assignment.endTime)) {
            problems.push('Die Endzeit muss nach der Startzeit liegen.');
            return problems;
        }

        const room = rooms.find(item => item.id === assignment.roomId);
        if (room && roomBlockedOn(room, assignment.date, assignment.startTime, assignment.endTime)) {
            problems.push('Der Raum ist in diesem Zeitraum gesperrt.');
        }

        const roomConflict = roomAssignments.some(item =>
            item.id !== assignment.id
            && item.roomId === assignment.roomId
            && item.date === assignment.date
            && rangesOverlap(assignment.startTime, assignment.endTime, item.startTime, item.endTime)
        );

        if (roomConflict) {
            problems.push('Dieser Raum ist in diesem Zeitraum bereits belegt.');
        }

        const personConflict = assignment.person
            ? roomAssignments.some(item =>
                item.id !== assignment.id
                && item.person === assignment.person
                && item.date === assignment.date
                && rangesOverlap(assignment.startTime, assignment.endTime, item.startTime, item.endTime)
            )
            : false;

        if (personConflict) {
            problems.push('Die eingetragene Person hat in diesem Zeitraum bereits einen Termin.');
        }

        return problems;
    };

    const validateAssignment = (assignment: RoomAssignment) => {
        const problems = getAssignmentValidationProblems(assignment);
        setEditValidationProblems(problems);
        if (problems.length > 0) {
            return false;
        }

        return true;
    };

    const saveEdit = () => {
        if (!editDraft || !validateAssignment(editDraft)) return;

        onUpdateRoomAssignments(roomAssignments.map(item =>
            item.id === editDraft.id ? editDraft : item
        ));
        setSelectedDate(editDraft.date);
        closeEdit();
    };

    const deleteAssignment = (assignmentId: string) => {
        onUpdateRoomAssignments(roomAssignments.filter(item => item.id !== assignmentId));
        closeEdit();
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Date Selection */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-md gap-4">
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Raumbelegung</h2>
                    <p className="text-sm text-muted-foreground font-medium">{formattedDate}</p>
                </div>

                <div className="flex items-center bg-muted p-1 rounded-xl shadow-inner border border-border/50">
                    <button
                        onClick={() => changeDate(-1)}
                        className="p-2 hover:bg-background rounded-lg transition-all hover:shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={setToday}
                        className="px-6 py-1.5 text-sm font-bold bg-background rounded-lg shadow-sm mx-1 hover:bg-muted transition-colors"
                    >
                        Heute
                    </button>
                    <button
                        onClick={() => changeDate(1)}
                        className="p-2 hover:bg-background rounded-lg transition-all hover:shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div className="flex gap-2">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                            if (e.target.value) setSelectedDate(e.target.value);
                        }}
                        className="bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
                    />
                    <button
                        onClick={() => {
                            closeEdit();
                            setShowAddForm(!showAddForm);
                        }}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-black hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                        Eintrag
                    </button>
                </div>
            </div>

            {editDraft && (
                <div className="bg-card border border-primary/30 p-6 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            Termin bearbeiten
                        </h3>
                        <button
                            onClick={closeEdit}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                            title="Schliessen"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4">
                        <input
                            type="date"
                            value={editDraft.date}
                            onChange={event => updateEditDraft({ date: event.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <select
                            value={editDraft.roomId}
                            onChange={event => updateEditDraft({ roomId: event.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        >
                            {rooms.map(room => <option key={room.id} value={room.id}>{room.id} - {room.name}</option>)}
                        </select>
                        <input
                            type="time"
                            value={editDraft.startTime}
                            onChange={event => updateEditDraft({ startTime: event.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <input
                            type="time"
                            value={editDraft.endTime}
                            onChange={event => updateEditDraft({ endTime: event.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <input
                            value={editDraft.title}
                            onChange={event => updateEditDraft({ title: event.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <input
                            value={editDraft.person || ''}
                            onChange={event => updateEditDraft({ person: event.target.value })}
                            placeholder="Person"
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={saveEdit}
                                className="flex-grow bg-primary text-primary-foreground rounded-lg text-xs font-black uppercase inline-flex items-center justify-center gap-2"
                            >
                                <Save className="h-3.5 w-3.5" />
                                Speichern
                            </button>
                            <button
                                onClick={() => deleteAssignment(editDraft.id)}
                                className="bg-destructive/15 text-destructive hover:bg-destructive/20 p-2 rounded-lg"
                                title="Termin loeschen"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    {editValidationProblems.length > 0 && (() => {
                        const roomProblem = editValidationProblems.some(problem =>
                            problem.startsWith('Dieser Raum') || problem.startsWith('Der Raum')
                        );
                        const availableRooms = roomProblem ? getAvailableRoomsForDraft(editDraft) : [];
                        return (
                            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold text-amber-700">Speichern noch nicht moeglich</div>
                                        <div className="mt-1 space-y-1 text-xs text-amber-800">
                                            {editValidationProblems.map(problem => (
                                                <div key={problem}>{problem}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {roomProblem && (
                                    <label className="space-y-1 block max-w-xl">
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800">
                                            <DoorOpen className="h-3.5 w-3.5" />
                                            Verfuegbare Raeume
                                        </span>
                                        {availableRooms.length > 0 ? (
                                            <select
                                                value=""
                                                onChange={event => {
                                                    if (event.target.value) updateEditDraft({ roomId: event.target.value });
                                                }}
                                                className="w-full bg-background border border-amber-500/40 rounded-lg px-3 py-2 text-xs font-bold"
                                            >
                                                <option value="">Freien Raum auswaehlen</option>
                                                {availableRooms.map(room => (
                                                    <option key={room.id} value={room.id}>
                                                        {room.id} - {room.name} ({room.capacity || 0} Plaetze)
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="rounded-lg border border-amber-500/30 bg-background/70 px-3 py-2 text-xs text-amber-800">
                                                Fuer dieses Datum und Zeitfenster wurde kein passender freier Raum gefunden.
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>
                        );
                    })()}
                    <textarea
                        value={editDraft.purpose || ''}
                        onChange={event => updateEditDraft({ purpose: event.target.value })}
                        placeholder="Zweck / Anmerkung"
                        className="mt-4 w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-medium min-h-20"
                    />
                    {editingAssignment?.id.startsWith('schedule-') && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            Dieser Termin stammt aus dem Semesterplan. Die Aenderung wird als einzelner Termin-Override gespeichert.
                        </p>
                    )}
                </div>
            )}

            {showAddForm && (
                <div className="bg-card border border-primary/30 p-6 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="text-sm font-black uppercase text-primary mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Neuer Belegungs-Eintrag
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <select
                            value={newAssignment.roomId}
                            onChange={e => setNewAssignment({ ...newAssignment, roomId: e.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        >
                            <option value="">Raum wählen...</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.id} - {r.name}</option>)}
                        </select>
                        <input
                            type="time"
                            value={newAssignment.startTime}
                            onChange={e => setNewAssignment({ ...newAssignment, startTime: e.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <input
                            type="time"
                            value={newAssignment.endTime}
                            onChange={e => setNewAssignment({ ...newAssignment, endTime: e.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <input
                            placeholder="Titel / Person"
                            value={newAssignment.title}
                            onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <input
                            placeholder="Zweck / Anmerkung"
                            value={newAssignment.purpose}
                            onChange={e => setNewAssignment({ ...newAssignment, purpose: e.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (!newAssignment.roomId || !newAssignment.title) return;
                                    const assignment: RoomAssignment = {
                                        id: `occ-${Date.now()}`,
                                        roomId: newAssignment.roomId!,
                                        date: selectedDate,
                                        startTime: newAssignment.startTime!,
                                        endTime: newAssignment.endTime!,
                                        title: newAssignment.title!,
                                        person: newAssignment.title!,
                                        purpose: newAssignment.purpose || '',
                                        color: `hsl(${Math.random() * 360}, 70%, 45%)`
                                    };
                                    onUpdateRoomAssignments([...roomAssignments, assignment]);
                                    setShowAddForm(false);
                                    setNewAssignment({ startTime: '08:00', endTime: '12:00', title: '', purpose: '', person: '' });
                                }}
                                className="flex-grow bg-primary text-primary-foreground rounded-lg text-xs font-black uppercase"
                            >
                                Speichern
                            </button>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="bg-muted hover:bg-muted/80 p-2 rounded-lg text-xs font-bold"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Occupancy Grid */}
            <div className="flex-grow overflow-hidden bg-card border border-border rounded-2xl shadow-xl flex flex-col">
                {/* Time Ruler */}
                <div className="flex border-b border-border bg-muted/30 sticky top-0 z-20 overflow-x-auto scrollbar-hide">
                    <div className="w-48 flex-shrink-0 p-4 border-r border-border font-bold text-xs uppercase tracking-widest text-muted-foreground">Räume</div>
                    <div className="flex flex-grow relative">
                        {hours.map(hour => (
                            <div key={hour} className="flex-grow min-w-[100px] p-4 text-center border-r border-border/30 last:border-r-0">
                                <span className="text-xs font-black text-muted-foreground/80">{hour}:00</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rooms Rows */}
                <div className="flex-grow overflow-auto custom-scrollbar">
                    {rooms.map((room) => (
                        <div key={room.id} className="flex border-b border-border/50 last:border-none group hover:bg-muted/10 transition-colors h-24">
                            <div className="w-48 flex-shrink-0 p-4 border-r border-border flex flex-col justify-center bg-muted/5 group-hover:bg-muted/20 transition-colors">
                                <span className="text-sm font-black text-foreground tracking-tight">{room.id}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">{room.name}</span>
                                <div className="flex gap-1 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${room.type === 'online' ? 'bg-blue-500' : room.type === 'hybrid' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                                    <span className="text-[8px] font-black uppercase text-muted-foreground opacity-50">{room.type}</span>
                                </div>
                            </div>

                            <div className="flex-grow relative flex min-w-[1300px]">
                                {/* Hour Background Lines */}
                                {hours.map(hour => (
                                    <div key={hour} className="flex-grow min-w-[100px] border-r border-border/20 last:border-r-0" />
                                ))}

                                {/* Event Tiles */}
                                {filteredAssignments[room.id]?.map(event => {
                                    const start = getHourNum(event.startTime);
                                    const end = getHourNum(event.endTime);
                                    const duration = end - start;

                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => openEdit(event)}
                                            title="Termin bearbeiten"
                                            className="absolute top-2 bottom-2 rounded-xl shadow-lg border border-white/10 flex flex-col p-3 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group/tile"
                                            style={{
                                                left: `${(start - 8) * (100 / 14)}%`,
                                                width: `${duration * (100 / 14)}%`,
                                                backgroundColor: event.color || '#3b82f6',
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black text-white/90 truncate uppercase tracking-tighter">
                                                    {event.startTime} - {event.endTime}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteAssignment(event.id);
                                                    }}
                                                    className="opacity-0 group-hover/tile:opacity-100 hover:text-red-200 transition-all"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                            <h4 className="text-xs font-bold text-white mt-1 line-clamp-1 leading-tight drop-shadow-sm">
                                                {event.title}
                                            </h4>
                                            {event.purpose && (
                                                <p className="text-[10px] text-white/80 line-clamp-2 leading-none mt-1 font-medium">
                                                    {event.purpose}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {rooms.length === 0 && (
                        <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="bg-muted p-6 rounded-full">
                                <svg className="w-12 h-12 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <p className="text-muted-foreground font-bold italic tracking-tight">Keine Räume für die Anzeige der Belegung konfiguriert.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 p-4 bg-muted/30 rounded-xl border border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" /> Präsenz
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" /> Online
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" /> Hybrid
                </div>
            </div>
        </div>
    );
};
