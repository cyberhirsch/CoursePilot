'use client';

import React, { useState } from 'react';
import type { AcademicCalendar, SemesterPeriod } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

interface SettingsCalendarProps {
    academicCalendar?: AcademicCalendar;
    onUpdateAcademicCalendar?: (calendar: AcademicCalendar) => void;
    lang?: keyof typeof TRANSLATIONS;
}

export const SettingsCalendar: React.FC<SettingsCalendarProps> = ({
    academicCalendar,
    onUpdateAcademicCalendar,
    lang = DEFAULT_LANGUAGE,
}) => {
    const t = TRANSLATIONS[lang];
    const [newSemester, setNewSemester] = useState<Partial<SemesterPeriod>>({
        id: '',
        name: '',
        type: 'WS',
        year: new Date().getFullYear(),
        lecturesStart: '',
        lecturesEnd: '',
        examsStart: '',
        examsEnd: '',
        lectureBreakStart: '',
        lectureBreakEnd: ''
    });

    if (!academicCalendar || !onUpdateAcademicCalendar) {
        return <div className="p-12 text-center italic opacity-50">Lade Kalender...</div>;
    }

    const SectionHeader = ({ title, icon }: { title: string, icon?: React.ReactNode }) => (
        <div className="flex items-center gap-3 mb-6">
            {icon && <div className="p-2 bg-primary/10 text-primary rounded-lg">{icon}</div>}
            <h2 className="text-xl font-black tracking-tight">{title}</h2>
        </div>
    );

    const handleAddSemester = () => {
        if (!newSemester.id || !newSemester.name) return;
        onUpdateAcademicCalendar({
            ...academicCalendar,
            semesters: [...academicCalendar.semesters, newSemester as SemesterPeriod].sort((a, b) => a.id.localeCompare(b.id))
        });
        setNewSemester({
            id: '',
            name: '',
            type: 'WS',
            year: new Date().getFullYear(),
            lecturesStart: '',
            lecturesEnd: '',
            examsStart: '',
            examsEnd: '',
            lectureBreakStart: '',
            lectureBreakEnd: ''
        });
    };

    const handleRemoveSemester = (id: string) => {
        onUpdateAcademicCalendar({
            ...academicCalendar,
            semesters: academicCalendar.semesters.filter(s => s.id !== id)
        });
    };

    return (
        <div className="flex flex-col space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Academic Year Start */}
            <div>
                <SectionHeader title="Akademisches Jahr" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm max-w-sm">
                    <label className="block">
                        <span className="text-[10px] font-bold uppercase block mb-1">Beginn des Akademischen Jahres (Monat)</span>
                        <select
                            value={academicCalendar.academicYearStartMonth}
                            onChange={e => onUpdateAcademicCalendar({ ...academicCalendar, academicYearStartMonth: Number(e.target.value) })}
                            className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        >
                            <option value={1}>Januar</option>
                            <option value={2}>Februar</option>
                            <option value={3}>März</option>
                            <option value={4}>April</option>
                            <option value={7}>Juli</option>
                            <option value={8}>August</option>
                            <option value={9}>September</option>
                            <option value={10}>Oktober</option>
                        </select>
                    </label>
                </div>
            </div>

            {/* Semester Management */}
            <div>
                <SectionHeader title="Semester-Zeiträume" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />

                {/* Add New Semester */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-8">
                    <h3 className="text-sm font-black uppercase text-muted-foreground mb-4">Neues Semester anlegen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <input
                            placeholder="ID (z.B. ss2026)"
                            value={newSemester.id}
                            onChange={e => setNewSemester({ ...newSemester, id: e.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <input
                            placeholder="Name (z.B. SS 2026)"
                            value={newSemester.name}
                            onChange={e => setNewSemester({ ...newSemester, name: e.target.value })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <select
                            value={newSemester.type}
                            onChange={e => {
                                const type = e.target.value as 'SS' | 'WS';
                                const updates: Partial<SemesterPeriod> = { type };
                                if (type === 'WS' && newSemester.year) {
                                    updates.lectureBreakStart = `${newSemester.year}-12-23`;
                                    updates.lectureBreakEnd = `${newSemester.year + 1}-01-05`;
                                } else if (type === 'SS') {
                                    updates.lectureBreakStart = '';
                                    updates.lectureBreakEnd = '';
                                }
                                setNewSemester({ ...newSemester, ...updates });
                            }}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        >
                            <option value="SS">Sommersemester</option>
                            <option value="WS">Wintersemester</option>
                        </select>
                        <input
                            type="number"
                            value={newSemester.year}
                            onChange={e => setNewSemester({ ...newSemester, year: Number(e.target.value) })}
                            className="bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <label className="block">
                            <span className="text-[10px] font-bold block mb-1">Vorlesungsbeginn</span>
                            <input type="date" value={newSemester.lecturesStart} onChange={e => setNewSemester({ ...newSemester, lecturesStart: e.target.value })} className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold" />
                        </label>
                        <label className="block">
                            <span className="text-[10px] font-bold block mb-1">Vorlesungsende</span>
                            <input type="date" value={newSemester.lecturesEnd} onChange={e => setNewSemester({ ...newSemester, lecturesEnd: e.target.value })} className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold" />
                        </label>
                        <label className="block">
                            <span className="text-[10px] font-bold block mb-1">Prüfungsbeginn</span>
                            <input type="date" value={newSemester.examsStart} onChange={e => setNewSemester({ ...newSemester, examsStart: e.target.value })} className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold" />
                        </label>
                        <label className="block">
                            <span className="text-[10px] font-bold block mb-1">Prüfungsende</span>
                            <input type="date" value={newSemester.examsEnd} onChange={e => setNewSemester({ ...newSemester, examsEnd: e.target.value })} className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold" />
                        </label>
                        <label className="block">
                            <span className="text-[10px] font-bold block mb-1 text-primary">Vorlesungspause (Start)</span>
                            <input type="date" value={newSemester.lectureBreakStart} onChange={e => setNewSemester({ ...newSemester, lectureBreakStart: e.target.value })} className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold" />
                        </label>
                        <label className="block">
                            <span className="text-[10px] font-bold block mb-1 text-primary">Vorlesungspause (Ende)</span>
                            <input type="date" value={newSemester.lectureBreakEnd} onChange={e => setNewSemester({ ...newSemester, lectureBreakEnd: e.target.value })} className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-bold" />
                        </label>
                    </div>
                    <button onClick={handleAddSemester} className="bg-primary text-primary-foreground px-8 py-2 rounded-xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Semester hinzufügen</button>
                </div>

                {/* Semester List */}
                <div className="grid grid-cols-1 gap-4">
                    {academicCalendar.semesters.map(sem => (
                        <div key={sem.id} className="group bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-all">
                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs ${sem.type === 'SS' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {sem.type}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{sem.name}</h4>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{sem.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-grow max-w-2xl px-4">
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">Vorlesungen</span>
                                    <span className="text-xs font-bold">{new Date(sem.lecturesStart).toLocaleDateString()} - {new Date(sem.lecturesEnd).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">Prüfungen</span>
                                    <span className="text-xs font-bold">{new Date(sem.examsStart).toLocaleDateString()} - {new Date(sem.examsEnd).toLocaleDateString()}</span>
                                </div>
                                {sem.lectureBreakStart && sem.lectureBreakEnd && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-primary block">Vorlesungspause</span>
                                        <span className="text-xs font-bold opacity-80">{new Date(sem.lectureBreakStart).toLocaleDateString()} - {new Date(sem.lectureBreakEnd).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => handleRemoveSemester(sem.id)} className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-500 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
