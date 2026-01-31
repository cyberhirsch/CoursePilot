'use client';

import React, { useState } from 'react';
import type { Room } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

interface RoomAvailabilityProps {
    rooms: Room[];
    onUpdateRoom: (roomId: string, updates: Partial<Room>) => void;
    lang?: keyof typeof TRANSLATIONS;
}

export const RoomAvailability: React.FC<RoomAvailabilityProps> = ({
    rooms,
    onUpdateRoom,
    lang = DEFAULT_LANGUAGE,
}) => {
    const t = TRANSLATIONS[lang];
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(rooms[0]?.id || null);
    const [newBlock, setNewBlock] = useState({ start: '', end: '', reason: '' });

    const selectedRoom = rooms.find(r => r.id === selectedRoomId);

    const handleAddBlock = () => {
        if (!selectedRoom || !newBlock.start || !newBlock.end) return;

        const updatedBlocks = [...(selectedRoom.blockedPeriods || []), newBlock];
        onUpdateRoom(selectedRoom.id, { blockedPeriods: updatedBlocks });
        setNewBlock({ start: '', end: '', reason: '' });
    };

    const handleRemoveBlock = (index: number) => {
        if (!selectedRoom) return;
        const updatedBlocks = (selectedRoom.blockedPeriods || []).filter((_, i) => i !== index);
        onUpdateRoom(selectedRoom.id, { blockedPeriods: updatedBlocks });
    };

    return (
        <div className="flex h-full gap-6 animate-in fade-in duration-700">
            {/* Rooms List (Sidebar) */}
            <div className="w-80 bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30">
                    <h3 className="text-lg font-black tracking-tight">Räume</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Auswählen zum Verwalten</p>
                </div>
                <div className="flex-grow overflow-auto p-2 space-y-1 custom-scrollbar">
                    {rooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => setSelectedRoomId(room.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${selectedRoomId === room.id
                                ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]'
                                : 'hover:bg-muted text-foreground'
                                }`}
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-black">{room.id}</span>
                                <span className={`text-[10px] truncate w-40 ${selectedRoomId === room.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{room.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {room.blockedPeriods && room.blockedPeriods.length > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${selectedRoomId === room.id ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
                                        {room.blockedPeriods.length}
                                    </span>
                                )}
                                <svg className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${selectedRoomId === room.id ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Management Area */}
            <div className="flex-grow flex flex-col gap-6">
                {selectedRoom ? (
                    <>
                        {/* New Blocking Form */}
                        <div className="bg-card border border-border rounded-2xl shadow-lg p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="bg-red-500/10 p-3 rounded-xl text-red-500">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Neue Sperrung für {selectedRoom.id}</h3>
                                    <p className="text-xs font-medium text-muted-foreground">Legen Sie fest, wann dieser Raum nicht für die Planung zur Verfügung steht.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Beginn</label>
                                    <input
                                        type="datetime-local"
                                        value={newBlock.start}
                                        onChange={(e) => setNewBlock(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Ende</label>
                                    <input
                                        type="datetime-local"
                                        value={newBlock.end}
                                        onChange={(e) => setNewBlock(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Grund (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="z.B. Wartungsarbeiten"
                                        value={newBlock.reason}
                                        onChange={(e) => setNewBlock(prev => ({ ...prev, reason: e.target.value }))}
                                        className="w-full bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddBlock}
                                disabled={!newBlock.start || !newBlock.end}
                                className="mt-2 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Raum sperren
                            </button>
                        </div>

                        {/* Current Blocks List */}
                        <div className="flex-grow bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/10">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Aktive Sperrungen</h3>
                            </div>
                            <div className="flex-grow overflow-auto p-4 space-y-3 custom-scrollbar">
                                {selectedRoom.blockedPeriods && selectedRoom.blockedPeriods.length > 0 ? (
                                    selectedRoom.blockedPeriods.map((block, idx) => (
                                        <div key={idx} className="group flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 hover:border-red-500/30 transition-all">
                                            <div className="flex gap-4 items-center">
                                                <div className="bg-red-500/20 text-red-500 p-2 rounded-lg">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-sm font-black">
                                                        <span>{new Date(block.start).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US')}</span>
                                                        <span className="text-muted-foreground opacity-50">→</span>
                                                        <span>{new Date(block.end).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US')}</span>
                                                    </div>
                                                    {block.reason && <span className="text-xs text-muted-foreground font-medium">{block.reason}</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveBlock(idx)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Sperrung aufheben"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 italic font-medium p-12">
                                        Keine aktiven Sperrungen für diesen Raum.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-card border border-border rounded-2xl shadow-xl flex-grow flex items-center justify-center flex-col p-12 text-center">
                        <div className="bg-muted p-8 rounded-full mb-6 text-muted-foreground/20">
                            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-black text-muted-foreground">Kein Raum ausgewählt</h4>
                        <p className="max-w-xs text-sm text-muted-foreground mt-2">Wählen Sie einen Raum aus der Liste links aus, um dessen Verfügbarkeit zu verwalten.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
