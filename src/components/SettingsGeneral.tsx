'use client';

import React from 'react';
import type { SystemSettings } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

interface SettingsGeneralProps {
    systemSettings?: SystemSettings;
    onUpdateSystemSettings?: (settings: SystemSettings) => void;
    lang?: keyof typeof TRANSLATIONS;
}

export const SettingsGeneral: React.FC<SettingsGeneralProps> = ({
    systemSettings,
    onUpdateSystemSettings,
    lang = DEFAULT_LANGUAGE,
}) => {
    const t = TRANSLATIONS[lang];

    if (!systemSettings || !onUpdateSystemSettings) {
        return <div className="p-12 text-center italic opacity-50">Lade Einstellungen...</div>;
    }

    const SectionHeader = ({ title, icon }: { title: string, icon?: React.ReactNode }) => (
        <div className="flex items-center gap-3 mb-6">
            {icon && <div className="p-2 bg-primary/10 text-primary rounded-lg">{icon}</div>}
            <h2 className="text-xl font-black tracking-tight">{title}</h2>
        </div>
    );

    return (
        <div className="flex flex-col space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <SectionHeader title="System-Parameter" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Academic Calendar */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                        <h3 className="text-sm font-black uppercase text-muted-foreground border-b pb-2">Akademischer Kalender</h3>
                        <div className="space-y-3">
                            <label className="block">
                                <span className="text-[10px] font-bold uppercase block mb-1">Aktuelles Planungssemester</span>
                                <input
                                    value={systemSettings.currentSemester}
                                    onChange={e => onUpdateSystemSettings({ ...systemSettings, currentSemester: e.target.value })}
                                    className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="block">
                                    <span className="text-[10px] font-bold uppercase block mb-1">Vorlesungsbeginn</span>
                                    <input
                                        type="date"
                                        value={systemSettings.academicCalendar.lecturesStart}
                                        onChange={e => onUpdateSystemSettings({
                                            ...systemSettings,
                                            academicCalendar: { ...systemSettings.academicCalendar, lecturesStart: e.target.value }
                                        })}
                                        className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-bold uppercase block mb-1">Vorlesungsende</span>
                                    <input
                                        type="date"
                                        value={systemSettings.academicCalendar.lecturesEnd}
                                        onChange={e => onUpdateSystemSettings({
                                            ...systemSettings,
                                            academicCalendar: { ...systemSettings.academicCalendar, lecturesEnd: e.target.value }
                                        })}
                                        className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Calculation Factors */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                        <h3 className="text-sm font-black uppercase text-muted-foreground border-b pb-2">Berechnungsfaktoren</h3>
                        <div className="space-y-3">
                            <label className="block">
                                <span className="text-[10px] font-bold uppercase block mb-1">CP Workload Faktor (h/CP)</span>
                                <input
                                    type="number"
                                    value={systemSettings.calculationFactors.cpWorkloadFactor}
                                    onChange={e => onUpdateSystemSettings({
                                        ...systemSettings,
                                        calculationFactors: { ...systemSettings.calculationFactors, cpWorkloadFactor: Number(e.target.value) }
                                    })}
                                    className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="block">
                                    <span className="text-[10px] font-bold uppercase block mb-1">SWS Einheit (Min)</span>
                                    <input
                                        type="number"
                                        value={systemSettings.calculationFactors.swsDurationMinutes}
                                        onChange={e => onUpdateSystemSettings({
                                            ...systemSettings,
                                            calculationFactors: { ...systemSettings.calculationFactors, swsDurationMinutes: Number(e.target.value) }
                                        })}
                                        className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-bold uppercase block mb-1">Raumpuffer (Min)</span>
                                    <input
                                        type="number"
                                        value={systemSettings.calculationFactors.defaultRoomBufferMinutes}
                                        onChange={e => onUpdateSystemSettings({
                                            ...systemSettings,
                                            calculationFactors: { ...systemSettings.calculationFactors, defaultRoomBufferMinutes: Number(e.target.value) }
                                        })}
                                        className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Day Schedule */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                        <h3 className="text-sm font-black uppercase text-muted-foreground border-b pb-2">Tagesablauf</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <label className="block">
                                    <span className="text-[10px] font-bold uppercase block mb-1">Startzeit</span>
                                    <input
                                        type="time"
                                        value={systemSettings.daySchedule.startHour}
                                        onChange={e => onUpdateSystemSettings({
                                            ...systemSettings,
                                            daySchedule: { ...systemSettings.daySchedule, startHour: e.target.value }
                                        })}
                                        className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-bold uppercase block mb-1">Endzeit</span>
                                    <input
                                        type="time"
                                        value={systemSettings.daySchedule.endHour}
                                        onChange={e => onUpdateSystemSettings({
                                            ...systemSettings,
                                            daySchedule: { ...systemSettings.daySchedule, endHour: e.target.value }
                                        })}
                                        className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </label>
                            </div>
                            <label className="block">
                                <span className="text-[10px] font-bold uppercase block mb-1">Standard Pause (Min)</span>
                                <input
                                    type="number"
                                    value={systemSettings.daySchedule.standardPauseMinutes}
                                    onChange={e => onUpdateSystemSettings({
                                        ...systemSettings,
                                        daySchedule: { ...systemSettings.daySchedule, standardPauseMinutes: Number(e.target.value) }
                                    })}
                                    className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="block">
                                    <span className="text-[10px] font-bold uppercase block mb-1">Pause in Termin (Min)</span>
                                    <input
                                        type="number"
                                        value={systemSettings.daySchedule.eventBreakDurationMinutes ?? 15}
                                        onChange={e => onUpdateSystemSettings({
                                            ...systemSettings,
                                            daySchedule: { ...systemSettings.daySchedule, eventBreakDurationMinutes: Math.max(0, Number(e.target.value) || 0) }
                                        })}
                                        className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-bold uppercase block mb-1">Intervall (Min)</span>
                                    <input
                                        type="number"
                                        value={systemSettings.daySchedule.eventBreakIntervalMinutes ?? 90}
                                        onChange={e => onUpdateSystemSettings({
                                            ...systemSettings,
                                            daySchedule: { ...systemSettings.daySchedule, eventBreakIntervalMinutes: Math.max(0, Number(e.target.value) || 0) }
                                        })}
                                        className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Institution Settings */}
            <div>
                <SectionHeader title="Institutions-Parameter" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Default Location Select */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <label className="block mb-4">
                            <span className="text-[10px] font-bold uppercase block mb-1">Standard-Standort</span>
                            <select
                                value={systemSettings.institutions.defaultLocation}
                                onChange={e => onUpdateSystemSettings({
                                    ...systemSettings,
                                    institutions: { ...systemSettings.institutions, defaultLocation: e.target.value }
                                })}
                                className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                            >
                                {systemSettings.institutions.campusLocations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Campus Locations Management */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-4">Verfügbare Standorte</h3>
                        <div className="flex gap-2 mb-4">
                            <input
                                id="newLocationInput"
                                type="text"
                                placeholder="Neuer Standort..."
                                className="flex-grow bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        if (val && !systemSettings.institutions.campusLocations.includes(val)) {
                                            onUpdateSystemSettings({
                                                ...systemSettings,
                                                institutions: {
                                                    ...systemSettings.institutions,
                                                    campusLocations: [...systemSettings.institutions.campusLocations, val]
                                                }
                                            });
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {systemSettings.institutions.campusLocations.map((loc, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-black uppercase">
                                    {loc}
                                    <button
                                        onClick={() => {
                                            const newLocs = systemSettings.institutions.campusLocations.filter((_, i) => i !== idx);
                                            onUpdateSystemSettings({
                                                ...systemSettings,
                                                institutions: { ...systemSettings.institutions, campusLocations: newLocs }
                                            });
                                        }}
                                        className="hover:text-red-500"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
