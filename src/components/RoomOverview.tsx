'use client';

import React, { useState, useMemo } from 'react';
import type { Room } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

interface RoomOverviewProps {
    rooms: Room[];
    onUpdateRoom: (roomId: string, updates: Partial<Room>) => void;
    onAddRoom: (room: Room) => void;
    onDeleteRoom: (roomId: string) => void;
    lang?: keyof typeof TRANSLATIONS;
}

export const RoomOverview: React.FC<RoomOverviewProps> = ({
    rooms,
    onUpdateRoom,
    onAddRoom,
    onDeleteRoom,
    lang = DEFAULT_LANGUAGE,
}) => {
    const t = TRANSLATIONS[lang];
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRooms = useMemo(() => {
        return rooms.filter(r =>
            r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.id.localeCompare(b.id));
    }, [rooms, searchTerm]);

    const handleToggleEquipment = (roomId: string, key: keyof Room['equipment']) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return;
        onUpdateRoom(roomId, {
            equipment: {
                ...room.equipment,
                [key]: !room.equipment[key]
            }
        });
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Raumübersicht</h2>
                    <p className="text-sm text-muted-foreground">Verwaltung der Campusräume und deren Kapazitäten.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary w-64 transition-all"
                        />
                        <svg className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={() => {
                            const newId = `R${rooms.length + 101}`;
                            onAddRoom({
                                id: newId,
                                name: 'Neuer Raum',
                                type: 'building',
                                capacity: 30,
                                workspacesMac: 0,
                                workspacesPc: 0,
                                equipment: {
                                    beamer: false,
                                    lecturerPc: false,
                                    macRoom: false,
                                    pcLab: false,
                                    darkenable: false,
                                    barrierFree: false,
                                    airConditioned: false
                                }
                            });
                        }}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <span>+</span> Raum hinzufügen
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-grow overflow-auto border border-border rounded-xl bg-card shadow-inner">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md">
                        <tr className="border-b border-border">
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nr. / ID</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Typ</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Standort / Link</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Kapazität</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Mac Arbeitsplätze</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">PC Arbeitsplätze</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Ausstattung</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Verschatt.</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Barrierefrei</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredRooms.map((room) => (
                            <tr key={room.id} className="group hover:bg-muted/30 transition-colors">
                                <td className="p-4">
                                    <input
                                        value={room.id}
                                        onChange={(e) => onUpdateRoom(room.id, { id: e.target.value })}
                                        className="bg-transparent border-none p-0 focus:ring-0 font-mono text-sm w-16"
                                    />
                                </td>
                                <td className="p-4">
                                    <input
                                        value={room.name}
                                        onChange={(e) => onUpdateRoom(room.id, { name: e.target.value })}
                                        className="bg-transparent border-none p-0 focus:ring-0 font-bold text-sm min-w-[150px]"
                                    />
                                </td>
                                <td className="p-4">
                                    <select
                                        value={room.type}
                                        onChange={(e) => onUpdateRoom(room.id, { type: e.target.value as any })}
                                        className="bg-muted/30 rounded px-2 py-1 text-xs font-semibold focus:bg-background transition-all outline-none border-none"
                                    >
                                        <option value="building">Präsenz</option>
                                        <option value="online">Online</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1 min-w-[150px]">
                                        {(room.type === 'building' || room.type === 'hybrid') && (
                                            <div className="flex gap-2">
                                                <input
                                                    placeholder="Gebäude"
                                                    value={room.building || ''}
                                                    onChange={(e) => onUpdateRoom(room.id, { building: e.target.value })}
                                                    className="bg-muted/30 rounded px-2 py-1 text-[10px] w-1/2 focus:bg-background outline-none"
                                                />
                                                <input
                                                    placeholder="Etage"
                                                    value={room.floor || ''}
                                                    onChange={(e) => onUpdateRoom(room.id, { floor: e.target.value })}
                                                    className="bg-muted/30 rounded px-2 py-1 text-[10px] w-1/2 focus:bg-background outline-none"
                                                />
                                            </div>
                                        )}
                                        {(room.type === 'online' || room.type === 'hybrid') && (
                                            <div className="relative">
                                                <input
                                                    placeholder="Weblink (Zoom/Teams...)"
                                                    value={room.weblink || ''}
                                                    onChange={(e) => onUpdateRoom(room.id, { weblink: e.target.value })}
                                                    className="bg-primary/5 text-primary placeholder:text-primary/40 rounded px-2 py-1 text-[10px] w-full focus:bg-background outline-none border border-primary/20"
                                                />
                                                {room.weblink && (
                                                    <a href={room.weblink} target="_blank" rel="noreferrer" className="absolute right-1 top-1 text-primary hover:text-primary/70">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <input
                                        type="number"
                                        value={room.capacity}
                                        onChange={(e) => onUpdateRoom(room.id, { capacity: Number(e.target.value) })}
                                        className="bg-muted/30 rounded px-2 py-1 text-sm w-16 text-center focus:bg-background transition-all"
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    <input
                                        type="number"
                                        value={room.workspacesMac}
                                        onChange={(e) => onUpdateRoom(room.id, { workspacesMac: Number(e.target.value) })}
                                        className="bg-muted/30 rounded px-2 py-1 text-sm w-16 text-center focus:bg-background transition-all"
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    <input
                                        type="number"
                                        value={room.workspacesPc}
                                        onChange={(e) => onUpdateRoom(room.id, { workspacesPc: Number(e.target.value) })}
                                        className="bg-muted/30 rounded px-2 py-1 text-sm w-16 text-center focus:bg-background transition-all"
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2 flex-wrap max-w-[200px] mx-auto">
                                        <EquipmentBadge
                                            active={room.equipment.beamer}
                                            label="Beamer"
                                            onClick={() => handleToggleEquipment(room.id, 'beamer')}
                                        />
                                        <EquipmentBadge
                                            active={room.equipment.lecturerPc}
                                            label="Doz-PC"
                                            onClick={() => handleToggleEquipment(room.id, 'lecturerPc')}
                                        />
                                        <EquipmentBadge
                                            active={room.equipment.pcLab}
                                            label="PC Lab"
                                            onClick={() => handleToggleEquipment(room.id, 'pcLab')}
                                        />
                                        <EquipmentBadge
                                            active={room.equipment.macRoom}
                                            label="Mac"
                                            onClick={() => handleToggleEquipment(room.id, 'macRoom')}
                                        />
                                        {(room.type === 'online' || room.type === 'hybrid') && (
                                            <span className="text-[10px] text-primary font-mono font-bold animate-pulse">
                                                Digital Ready
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={room.equipment.darkenable}
                                        onChange={() => handleToggleEquipment(room.id, 'darkenable')}
                                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={room.equipment.barrierFree}
                                        onChange={() => handleToggleEquipment(room.id, 'barrierFree')}
                                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => onDeleteRoom(room.id)}
                                        className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                        title="Raum löschen"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredRooms.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-muted-foreground italic">Keine Räume gefunden.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const EquipmentBadge: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
    <button
        onClick={onClick}
        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter transition-all border ${active
            ? 'bg-primary/20 text-primary border-primary shadow-sm'
            : 'bg-muted text-muted-foreground border-transparent opacity-40 hover:opacity-100'
            }`}
    >
        {label}
    </button>
);
