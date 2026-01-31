'use client';

import React, { useState, useMemo } from 'react';
import type { Room, Module, Cohort, RoomAssignment } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

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
    const [selectedDate, setSelectedDate] = useState(new Date('2026-01-31')); // Default to date in screenshot
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAssignment, setNewAssignment] = useState<Partial<RoomAssignment>>({
        startTime: '08:00',
        endTime: '12:00',
        title: '',
        purpose: '',
        person: ''
    });

    const formattedDate = useMemo(() => {
        return selectedDate.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }, [selectedDate, lang]);

    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00 to match screenshot

    const filteredAssignments = useMemo(() => {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const assignments: Record<string, RoomAssignment[]> = {};

        roomAssignments.filter(a => a.date === dateStr).forEach(a => {
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
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const setToday = () => setSelectedDate(new Date());

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
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
                    />
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-black hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                        Eintrag
                    </button>
                </div>
            </div>

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
                                        date: selectedDate.toISOString().split('T')[0],
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
                                                        onUpdateRoomAssignments(roomAssignments.filter(a => a.id !== event.id));
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
