'use client';

import React, { useMemo, useState } from 'react';
import type { Room } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';
import { Plus, Trash2, X } from 'lucide-react';

interface RoomOverviewProps {
    rooms: Room[];
    onUpdateRoom: (roomId: string, updates: Partial<Room>) => void;
    onAddRoom: (room: Room) => void;
    onDeleteRoom: (roomId: string) => void;
    lang?: keyof typeof TRANSLATIONS;
}

const makeEquipment = (): Room['equipment'] => ({
    beamer: true,
    lecturerPc: true,
    macRoom: false,
    pcLab: false,
    darkenable: false,
    barrierFree: true,
    airConditioned: false,
});

export const RoomOverview: React.FC<RoomOverviewProps> = ({
    rooms,
    onUpdateRoom,
    onAddRoom,
    onDeleteRoom,
    lang = DEFAULT_LANGUAGE,
}) => {
    const t = TRANSLATIONS[lang];
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const createEmptyRoom = (): Room => {
        let index = rooms.length + 101;
        let id = `R${index}`;
        while (rooms.some(room => room.id === id)) {
            index += 1;
            id = `R${index}`;
        }

        return {
            id,
            name: '',
            type: 'building',
            capacity: 30,
            workspacesMac: 0,
            workspacesPc: 0,
            equipment: makeEquipment(),
            building: '',
            floor: '',
            weblink: '',
        };
    };

    const [newRoom, setNewRoom] = useState<Room>(() => createEmptyRoom());

    const filteredRooms = useMemo(() => {
        return rooms.filter(room =>
            room.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.id.localeCompare(b.id));
    }, [rooms, searchTerm]);

    const handleToggleEquipment = (roomId: string, key: keyof Room['equipment']) => {
        const room = rooms.find(item => item.id === roomId);
        if (!room) return;
        onUpdateRoom(roomId, {
            equipment: {
                ...room.equipment,
                [key]: !room.equipment[key],
            },
        });
    };

    const updateNewRoomEquipment = (key: keyof Room['equipment']) => {
        setNewRoom(prev => ({
            ...prev,
            equipment: {
                ...prev.equipment,
                [key]: !prev.equipment[key],
            },
        }));
    };

    const handleCreateRoom = () => {
        if (!newRoom.id.trim() || !newRoom.name.trim()) {
            alert('Bitte Raum-ID und Name ausfuellen.');
            return;
        }

        if (rooms.some(room => room.id === newRoom.id.trim())) {
            alert(`Ein Raum mit der ID "${newRoom.id.trim()}" existiert bereits.`);
            return;
        }

        onAddRoom({
            ...newRoom,
            id: newRoom.id.trim(),
            name: newRoom.name.trim(),
            building: newRoom.building?.trim() || undefined,
            floor: newRoom.floor?.trim() || undefined,
            weblink: newRoom.weblink?.trim() || undefined,
        });
        setNewRoom(createEmptyRoom());
        setShowAddForm(false);
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Raumuebersicht</h2>
                    <p className="text-sm text-muted-foreground">Verwaltung der Campusraeume, Kapazitaeten und Ausstattung.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Suchen..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="pl-9 pr-4 py-2 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary w-64 transition-all"
                        />
                        <svg className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={() => {
                            setNewRoom(createEmptyRoom());
                            setShowAddForm(prev => !prev);
                        }}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Raum hinzufuegen
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className="bg-card border border-primary/30 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold">Neuen Raum anlegen</h3>
                            <p className="text-sm text-muted-foreground">ID, Kapazitaet und Ausstattung werden direkt fuer die Stundenplanung verwendet.</p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                            title="Schliessen"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                        <RoomField label="ID" value={newRoom.id} onChange={value => setNewRoom(prev => ({ ...prev, id: value }))} />
                        <RoomField label="Name" value={newRoom.name} onChange={value => setNewRoom(prev => ({ ...prev, name: value }))} />
                        <label className="block">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Typ</span>
                            <select
                                value={newRoom.type}
                                onChange={event => setNewRoom(prev => ({ ...prev, type: event.target.value as Room['type'] }))}
                                className="mt-1 w-full bg-background border border-input rounded-md px-2 py-2 text-sm"
                            >
                                <option value="building">Praesenz</option>
                                <option value="online">Online</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </label>
                        <RoomField label="Kapazitaet" type="number" value={String(newRoom.capacity)} onChange={value => setNewRoom(prev => ({ ...prev, capacity: Number(value) }))} />
                        <RoomField label="Gebaeude" value={newRoom.building || ''} onChange={value => setNewRoom(prev => ({ ...prev, building: value }))} />
                        <RoomField label="Etage" value={newRoom.floor || ''} onChange={value => setNewRoom(prev => ({ ...prev, floor: value }))} />
                        <RoomField label="Mac Plaetze" type="number" value={String(newRoom.workspacesMac || 0)} onChange={value => setNewRoom(prev => ({ ...prev, workspacesMac: Number(value) }))} />
                        <RoomField label="PC Plaetze" type="number" value={String(newRoom.workspacesPc || 0)} onChange={value => setNewRoom(prev => ({ ...prev, workspacesPc: Number(value) }))} />
                        <div className="md:col-span-2">
                            <RoomField label="Weblink" value={newRoom.weblink || ''} onChange={value => setNewRoom(prev => ({ ...prev, weblink: value }))} />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {equipmentItems.map(item => (
                            <EquipmentBadge
                                key={item.key}
                                active={!!newRoom.equipment[item.key]}
                                label={item.label}
                                onClick={() => updateNewRoomEquipment(item.key)}
                            />
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 rounded-md bg-muted text-sm font-bold"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleCreateRoom}
                            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-bold"
                        >
                            Raum speichern
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-grow overflow-auto border border-border rounded-xl bg-card shadow-inner">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md">
                        <tr className="border-b border-border">
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nr. / ID</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Typ</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Standort / Link</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Kapazitaet</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Mac Plaetze</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">PC Plaetze</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Ausstattung</th>
                            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Verdunkelbar</th>
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
                                        onChange={(event) => onUpdateRoom(room.id, { id: event.target.value })}
                                        className="bg-transparent border-none p-0 focus:ring-0 font-mono text-sm w-16"
                                    />
                                </td>
                                <td className="p-4">
                                    <input
                                        value={room.name}
                                        onChange={(event) => onUpdateRoom(room.id, { name: event.target.value })}
                                        className="bg-transparent border-none p-0 focus:ring-0 font-bold text-sm min-w-[150px]"
                                    />
                                </td>
                                <td className="p-4">
                                    <select
                                        value={room.type}
                                        onChange={(event) => onUpdateRoom(room.id, { type: event.target.value as Room['type'] })}
                                        className="bg-muted/30 rounded px-2 py-1 text-xs font-semibold focus:bg-background transition-all outline-none border-none"
                                    >
                                        <option value="building">Praesenz</option>
                                        <option value="online">Online</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1 min-w-[150px]">
                                        {(room.type === 'building' || room.type === 'hybrid') && (
                                            <div className="flex gap-2">
                                                <input
                                                    placeholder="Gebaeude"
                                                    value={room.building || ''}
                                                    onChange={(event) => onUpdateRoom(room.id, { building: event.target.value })}
                                                    className="bg-muted/30 rounded px-2 py-1 text-[10px] w-1/2 focus:bg-background outline-none"
                                                />
                                                <input
                                                    placeholder="Etage"
                                                    value={room.floor || ''}
                                                    onChange={(event) => onUpdateRoom(room.id, { floor: event.target.value })}
                                                    className="bg-muted/30 rounded px-2 py-1 text-[10px] w-1/2 focus:bg-background outline-none"
                                                />
                                            </div>
                                        )}
                                        {(room.type === 'online' || room.type === 'hybrid') && (
                                            <input
                                                placeholder="Weblink"
                                                value={room.weblink || ''}
                                                onChange={(event) => onUpdateRoom(room.id, { weblink: event.target.value })}
                                                className="bg-primary/5 text-primary placeholder:text-primary/40 rounded px-2 py-1 text-[10px] w-full focus:bg-background outline-none border border-primary/20"
                                            />
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <input
                                        type="number"
                                        value={room.capacity}
                                        onChange={(event) => onUpdateRoom(room.id, { capacity: Number(event.target.value) })}
                                        className="bg-muted/30 rounded px-2 py-1 text-sm w-16 text-center focus:bg-background transition-all"
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    <input
                                        type="number"
                                        value={room.workspacesMac || 0}
                                        onChange={(event) => onUpdateRoom(room.id, { workspacesMac: Number(event.target.value) })}
                                        className="bg-muted/30 rounded px-2 py-1 text-sm w-16 text-center focus:bg-background transition-all"
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    <input
                                        type="number"
                                        value={room.workspacesPc || 0}
                                        onChange={(event) => onUpdateRoom(room.id, { workspacesPc: Number(event.target.value) })}
                                        className="bg-muted/30 rounded px-2 py-1 text-sm w-16 text-center focus:bg-background transition-all"
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2 flex-wrap max-w-[200px] mx-auto">
                                        {equipmentItems.slice(0, 4).map(item => (
                                            <EquipmentBadge
                                                key={item.key}
                                                active={!!room.equipment?.[item.key]}
                                                label={item.label}
                                                onClick={() => handleToggleEquipment(room.id, item.key)}
                                            />
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={!!room.equipment?.darkenable}
                                        onChange={() => handleToggleEquipment(room.id, 'darkenable')}
                                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={!!room.equipment?.barrierFree}
                                        onChange={() => handleToggleEquipment(room.id, 'barrierFree')}
                                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => onDeleteRoom(room.id)}
                                        className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                        title="Raum loeschen"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredRooms.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-muted-foreground italic">Keine Raeume gefunden.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const equipmentItems: { key: keyof Room['equipment']; label: string }[] = [
    { key: 'beamer', label: 'Beamer' },
    { key: 'lecturerPc', label: 'Doz-PC' },
    { key: 'macRoom', label: 'Mac' },
    { key: 'pcLab', label: 'PC Lab' },
    { key: 'darkenable', label: 'Dunkel' },
    { key: 'barrierFree', label: 'Barrierefrei' },
    { key: 'airConditioned', label: 'Klima' },
];

const RoomField: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
    <label className="block">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
        <input
            type={type}
            value={value}
            onChange={event => onChange(event.target.value)}
            className="mt-1 w-full bg-background border border-input rounded-md px-2 py-2 text-sm"
        />
    </label>
);

const EquipmentBadge: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
    <button
        onClick={onClick}
        type="button"
        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all border ${active
            ? 'bg-primary/20 text-primary border-primary shadow-sm'
            : 'bg-muted text-muted-foreground border-transparent opacity-50 hover:opacity-100'
            }`}
    >
        {label}
    </button>
);
