'use client';

import React, { useState, useMemo } from 'react';
import type { Module, Program, Category, Catalogs } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

import { EditableCell } from './module-overview/EditableCell';
import { ProgramSelector } from './module-overview/ProgramSelector';
import { CategoryManager } from './module-overview/CategoryManager';

const initialNewModuleState: Module = {
    id: '', name: '', sws: 0, cp: 0,
    type: 'Pflicht', category: '',
    prerequisites: [], forbiddenSemesters: [],
};


interface ModuleOverviewProps {
    modules: Module[];
    programs: Program[];
    onUpdateModule: (moduleId: string, field: keyof Module, value: any) => void;
    onAddModule: (module: Module, programIds: string[]) => void;
    onDeleteModule: (moduleId: string) => void;
    onUpdateModulePrograms: (moduleId: string, programId: string, isAssigned: boolean) => void;
    categories: Category[];
    onAddCategory: (category: Category) => void;
    onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
    onDeleteCategory: (categoryId: string) => void;
    lang?: keyof typeof TRANSLATIONS;
    catalogs?: Catalogs;
    departments?: string[];
}

export const ModuleOverview: React.FC<ModuleOverviewProps> = ({
    modules,
    programs,
    onUpdateModule,
    onAddModule,
    onDeleteModule,
    onUpdateModulePrograms,
    categories,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    lang = DEFAULT_LANGUAGE,
    catalogs,
    departments = []
}) => {
    const t = TRANSLATIONS[lang];
    const [fachbereichFilter, setFachbereichFilter] = useState<string>('all');
    const [programFilter, setProgramFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);
    const [newModule, setNewModule] = useState<Module>({ ...initialNewModuleState, category: categories[0]?.name || '' });
    const [newModulePrograms, setNewModulePrograms] = useState<string[]>([]);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const handleNewModuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['sws', 'cp', 'workload', 'instanceCount', 'maxParticipants'].includes(name);

        if (name === 'prerequisites' || name === 'forbiddenSemesters') {
            const arrValue = value.split(',').map(s => s.trim()).filter(Boolean);
            if (name === 'forbiddenSemesters') {
                setNewModule(prev => ({ ...prev, [name]: arrValue.map(n => parseInt(n)).filter(n => !isNaN(n)) }));
            } else {
                setNewModule(prev => ({ ...prev, [name]: arrValue }));
            }
        } else {
            setNewModule(prev => ({ ...prev, [name]: isNumeric ? parseInt(value) || 0 : value }));
        }
    };

    const handleUpdateField = (moduleId: string, name: string, value: string) => {
        if (name === 'prerequisites') {
            const parsedValue = value.split(',').map(s => s.trim()).filter(Boolean);
            onUpdateModule(moduleId, 'prerequisites', parsedValue);
        } else if (name === 'forbiddenSemesters') {
            const parsedValue = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            onUpdateModule(moduleId, 'forbiddenSemesters', parsedValue);
        }
    }


    const handleNewModuleProgramChange = (programId: string, checked: boolean) => {
        setNewModulePrograms(prev =>
            checked ? [...prev, programId] : prev.filter(id => id !== programId)
        );
    };

    const handleSaveNewModule = () => {
        if (!newModule.id || !newModule.name || !newModule.category) {
            alert('Bitte füllen Sie mindestens ID, Name und Kategorie aus.');
            return;
        }
        onAddModule(newModule, newModulePrograms);
        setIsAdding(false);
        setNewModule({ ...initialNewModuleState, category: categories[0]?.name || '' });
        setNewModulePrograms([]);
    };

    const handleDeleteClick = (moduleId: string) => {
        const module = modules.find(m => m.id === moduleId);
        if (window.confirm(`Möchten Sie das Modul "${module?.name || moduleId}" wirklich löschen? Es wird aus allen Plänen und Studiengängen entfernt.`)) {
            onDeleteModule(moduleId);
        }
    };

    const handleModuleProgramChange = (moduleId: string, programId: string, checked: boolean) => {
        onUpdateModulePrograms(moduleId, programId, checked);
    };

    const filteredModules = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return modules
            .filter(module => {
                if (fachbereichFilter !== 'all' && module.department !== fachbereichFilter) return false;
                if (programFilter !== 'all') {
                    const program = programs.find(p => p.id === programFilter);
                    if (program && !program.moduleIds.includes(module.id)) return false;
                }
                if (categoryFilter !== 'all' && module.category !== categoryFilter) return false;
                if (searchTerm && !module.id.toLowerCase().includes(lowerCaseSearchTerm) && !module.name.toLowerCase().includes(lowerCaseSearchTerm)) return false;
                return true;
            })
            .sort((a, b) => a.id.localeCompare(b.id)); // Sort by ID
    }, [modules, programs, fachbereichFilter, programFilter, categoryFilter, searchTerm]);

    const categoryOptions = useMemo(() => categories.map(c => c.name), [categories]);
    const departmentOptions = useMemo(() => {
        return Array.from(new Set([
            ...departments,
            ...modules.map(module => module.department || ''),
        ].map(value => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [departments, modules]);

    return (
        <div className="flex flex-col h-full gap-6">

            <div className="bg-card rounded-lg shadow-md h-full flex flex-col border border-border flex-grow min-h-0">
                <div className="p-4 border-b-2 border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">{t.moduleOverview?.title || 'Modulübersicht'}</h2>
                        <p className="text-sm text-muted-foreground">{t.moduleOverview?.subtitle || 'Zentrale Übersicht und Bearbeitung aller im System verfügbaren Module.'}</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(prev => !prev)}
                        className={`${isAdding ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'} text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors`}
                    >
                        {isAdding ? t.planner.close : `+ ${t.planner.addModule}`}
                    </button>
                </div>

                {isAdding && (
                    <div className="p-4 border-b-2 border-border bg-background/30">
                        <h3 className="text-lg font-semibold text-foreground mb-4">{t.moduleOverview?.newModuleTitle || 'Neues Modul anlegen'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Column 1: Core Data */}
                            <div className="space-y-4">
                                <label className="block"><span className="text-muted-foreground text-sm">ID*</span><EditableCell value={newModule.id} onChange={handleNewModuleChange} name="id" /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">Name*</span><EditableCell value={newModule.name} onChange={handleNewModuleChange} name="name" /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">Typ*</span><EditableCell value={newModule.type} onChange={handleNewModuleChange} name="type" type="select" options={['Pflicht', 'Wahlpflicht', 'Pool']} /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">{t.planner.department}</span><EditableCell value={newModule.department || ''} onChange={handleNewModuleChange} name="department" type="select" options={departmentOptions} placeholder="Wählen..." /></label>
                                <div className="pt-2">
                                    <span className="text-muted-foreground text-sm">{t.moduleOverview?.assignedPrograms || 'Zugeordnete Studiengänge'}</span>
                                    <div className="p-2 bg-muted/50 rounded-md mt-1"><ProgramSelector programs={programs} selectedProgramIds={newModulePrograms} onChange={handleNewModuleProgramChange} /></div>
                                </div>
                            </div>

                            {/* Column 2: Categories & Numbers */}
                            <div className="space-y-4">
                                <label className="block"><span className="text-muted-foreground text-sm">{t.planner.category}*</span><EditableCell value={newModule.category} onChange={handleNewModuleChange} name="category" type="select" options={categoryOptions} /></label>
                                <div className="grid grid-cols-3 gap-3">
                                    <label className="block"><span className="text-muted-foreground text-sm">SWS</span><EditableCell value={newModule.sws} onChange={handleNewModuleChange} name="sws" type="number" className="text-center" /></label>
                                    <label className="block"><span className="text-muted-foreground text-sm">CP</span><EditableCell value={newModule.cp} onChange={handleNewModuleChange} name="cp" type="number" className="text-center" /></label>
                                    <label className="block"><span className="text-muted-foreground text-sm">{t.common.workload}</span><EditableCell value={newModule.workload || ''} onChange={handleNewModuleChange} name="workload" type="number" className="text-center" /></label>
                                </div>
                                {newModule.type === 'Pool' && <label className="block"><span className="text-muted-foreground text-sm">{t.common.instances}</span><EditableCell value={newModule.instanceCount || 0} onChange={handleNewModuleChange} name="instanceCount" type="number" className="text-center w-20" /></label>}
                            </div>

                            {/* Column 3: Details & Dependencies */}
                            <div className="space-y-4">
                                <label className="block"><span className="text-muted-foreground text-sm">{t.moduleOverview?.maxParticipants || 'Max. Teilnehmer'}</span><EditableCell value={newModule.maxParticipants || 0} onChange={handleNewModuleChange} name="maxParticipants" type="number" /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.personInCharge}</span><EditableCell value={newModule.personInCharge || ''} onChange={handleNewModuleChange} name="personInCharge" type="select" options={catalogs?.personInCharge || []} placeholder="Wählen..." /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.examType}</span><EditableCell value={newModule.examType || ''} onChange={handleNewModuleChange} name="examType" type="select" options={catalogs?.examTypes || []} placeholder="Wählen..." /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.teachingMethods}</span><EditableCell value={newModule.teachingMethods || ''} onChange={handleNewModuleChange} name="teachingMethods" type="select" options={catalogs?.teachingMethods || []} placeholder="Wählen..." /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.language}</span><EditableCell value={newModule.language || ''} onChange={handleNewModuleChange} name="language" type="select" options={catalogs?.languages || []} placeholder="Wählen..." /></label>
                            </div>

                            {/* Column 4: Text & Dependencies */}
                            <div className="space-y-4 flex flex-col">
                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.prerequisites}</span><EditableCell value={(newModule.prerequisites || []).join(', ')} onChange={handleNewModuleChange} name="prerequisites" placeholder="IDs..." /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.forbiddenSemesters}</span><EditableCell value={(newModule.forbiddenSemesters || []).join(', ')} onChange={handleNewModuleChange} name="forbiddenSemesters" placeholder="1, 2" /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.semesterRecommendation}</span><EditableCell value={newModule.semesterRecommendation || ''} onChange={handleNewModuleChange} name="semesterRecommendation" /></label>
                            </div>
                        </div>
                        {/* Row 2: Text Areas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <label className="block"><span className="text-muted-foreground text-sm">{t.common.description}</span><EditableCell as="textarea" value={newModule.description || ''} onChange={handleNewModuleChange} name="description" className="h-24" /></label>
                            <label className="block"><span className="text-muted-foreground text-sm">{t.moduleOverview?.learningOutcomes || 'Lernergebnisse'}</span><EditableCell as="textarea" value={newModule.learningOutcomes || ''} onChange={handleNewModuleChange} name="learningOutcomes" className="h-24" /></label>
                            <div className="flex flex-col h-full">
                                <label className="block flex-grow"><span className="text-muted-foreground text-sm">{t.common.literature}</span><EditableCell as="textarea" value={newModule.literature || ''} onChange={handleNewModuleChange} name="literature" className="h-[52px]" /></label>
                                <div className="flex justify-end items-center gap-4 pt-4">
                                    <button onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-foreground font-bold py-2 px-4 rounded-lg transition-colors">{t.planner.cancel}</button>
                                    <button onClick={handleSaveNewModule} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t.planner.saveModule}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 border-b border-border bg-background/50 flex flex-wrap items-center gap-4">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-muted-foreground mb-1">{t.planner.program}</label>
                        <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="bg-input p-2 rounded-md w-full max-w-xs">
                            <option value="all">Alle Studiengänge</option>
                            {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                        </select>
                    </div>

                    <div className="flex-grow min-w-[300px]">
                        <label className="block text-sm font-medium text-muted-foreground mb-1">{t.planner.search}</label>
                        <input type="text" placeholder="Modul suchen (ID, Name)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-input w-full p-2 rounded-md" />
                    </div>

                    <div className="self-end pt-5">
                        <details className="relative">
                            <summary className="cursor-pointer px-3 py-2 bg-muted rounded-md text-sm font-medium list-none select-none hover:bg-muted/80">Filter & Optionen</summary>
                            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-xl p-4 z-50">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">{t.planner.department}</label>
                                        <select value={fachbereichFilter} onChange={e => setFachbereichFilter(e.target.value)} className="bg-input p-2 rounded-md w-full text-sm">
                                            <option value="all">Alle</option>
                                            {departmentOptions.map(department => <option key={department} value={department}>{department}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">{t.planner.category}</label>
                                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-input p-2 rounded-md w-full text-sm">
                                            <option value="all">Alle</option>
                                            {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div className="pt-2 border-t border-border">
                                        <CategoryManager
                                            categories={categories}
                                            onAddCategory={onAddCategory}
                                            onUpdateCategory={onUpdateCategory}
                                            onDeleteCategory={onDeleteCategory}
                                        />
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>

                <div className="flex-grow overflow-auto relative">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="sticky top-0 z-10 bg-card/75 backdrop-blur-sm text-left">
                                <th className="p-2 border-b border-border w-12" aria-label="Details ausklappen"></th>
                                <th className="p-2 border-b border-border w-24 font-code">{t.common.id}</th>
                                <th className="p-2 border-b border-border min-w-[200px]">{t.common.name}</th>
                                <th className="p-2 border-b border-border w-48">{t.planner.category}</th>
                                <th className="p-2 border-b border-border w-48">{t.planner.department}</th>
                                <th className="p-2 border-b border-border w-32">{t.common.type}</th>
                                <th className="p-2 border-b border-border w-16 text-center">{t.common.sws}</th>
                                <th className="p-2 border-b border-border w-16 text-center">{t.common.cp}</th>
                                <th className="p-2 border-b border-border w-20 text-center">{t.common.workload}</th>
                                <th className="p-2 border-b border-border w-20 text-center">{t.common.instances}</th>
                                <th className="p-2 border-b border-border w-20 text-center" title="Maximale Teilnehmer">{t.common.participants}</th>
                                <th className="p-2 border-b border-border w-24 text-center">{t.common.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card">
                            {filteredModules.length > 0 ? filteredModules.map(module => {
                                const assignedProgramIds = programs
                                    .filter(p => p.moduleIds.includes(module.id))
                                    .map(p => p.id);

                                return (
                                    <React.Fragment key={module.id}>
                                        <tr className="hover:bg-muted/60">
                                            <td className="p-1 border-t border-border w-12 text-center">
                                                <button onClick={() => setExpandedRow(expandedRow === module.id ? null : module.id)} className="p-1 rounded-full hover:bg-accent/20 text-muted-foreground hover:text-foreground" title="Details anzeigen/verbergen">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${expandedRow === module.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </td>
                                            <td className="p-2 border-t border-border font-code text-muted-foreground">{module.id}</td>
                                            <td className="p-1 border-t border-border"><EditableCell value={module.name} onChange={(e) => onUpdateModule(module.id, 'name', e.target.value)} name="name" /></td>
                                            <td className="p-1 border-t border-border"><EditableCell value={module.category} onChange={(e) => onUpdateModule(module.id, 'category', e.target.value)} name="category" type="select" options={categoryOptions} /></td>
                                            <td className="p-1 border-t border-border"><EditableCell value={module.department || ''} onChange={(e) => onUpdateModule(module.id, 'department', e.target.value || undefined)} name="department" type="select" options={departmentOptions} placeholder="-" /></td>
                                            <td className="p-1 border-t border-border"><EditableCell value={module.type} onChange={(e) => onUpdateModule(module.id, 'type', e.target.value)} name="type" type="select" options={['Pflicht', 'Wahlpflicht', 'Pool']} /></td>
                                            <td className="p-1 border-t border-border text-center"><EditableCell value={module.sws} onChange={(e) => onUpdateModule(module.id, 'sws', parseInt(e.target.value) || 0)} name="sws" type="number" className="text-center" /></td>
                                            <td className="p-1 border-t border-border text-center"><EditableCell value={module.cp} onChange={(e) => onUpdateModule(module.id, 'cp', parseInt(e.target.value) || 0)} name="cp" type="number" className="text-center" /></td>
                                            <td className="p-1 border-t border-border text-center"><EditableCell value={module.workload || ''} onChange={(e) => onUpdateModule(module.id, 'workload', parseInt(e.target.value) || 0)} name="workload" type="number" className="text-center" /></td>
                                            <td className="p-1 border-t border-border text-center">
                                                {module.type === 'Pool' ? <EditableCell value={module.instanceCount || ''} onChange={(e) => onUpdateModule(module.id, 'instanceCount', parseInt(e.target.value) || undefined)} name="instanceCount" type="number" className="text-center" /> : <span className="text-muted-foreground">-</span>}
                                            </td>
                                            <td className="p-1 border-t border-border text-center"><EditableCell value={module.maxParticipants || ''} onChange={(e) => onUpdateModule(module.id, 'maxParticipants', parseInt(e.target.value) || undefined)} name="maxParticipants" type="number" className="text-center" /></td>

                                            <td className="p-2 border-t border-border text-center">
                                                <button onClick={() => handleDeleteClick(module.id)} title="Löschen" className="text-destructive/80 hover:text-destructive">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === module.id && (
                                            <tr className="bg-background/40">
                                                <td colSpan={12} className="p-0">
                                                    <div className="p-4 space-y-4">
                                                        <div className="lg:col-span-4 bg-muted/50 p-4 rounded-md border border-border">
                                                            <label className="block text-muted-foreground text-sm font-semibold mb-2">{t.moduleOverview?.assignedPrograms || 'Zugeordnete Studiengänge'}</label>
                                                            <ProgramSelector programs={programs} selectedProgramIds={assignedProgramIds} onChange={(programId, checked) => handleModuleProgramChange(module.id, programId, checked)} />
                                                        </div>
                                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                            <div className="space-y-4">
                                                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.description}</span><EditableCell as="textarea" value={module.description || ''} onChange={(e) => onUpdateModule(module.id, 'description', e.target.value)} name="description" /></label>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="block"><span className="text-muted-foreground text-sm">{t.moduleOverview?.learningOutcomes || 'Lernergebnisse'}</span><EditableCell as="textarea" value={module.learningOutcomes || ''} onChange={(e) => onUpdateModule(module.id, 'learningOutcomes', e.target.value)} name="learningOutcomes" /></label>
                                                                <label className="block"><span className="text-muted-foreground text-sm">Prüfungsform</span><EditableCell value={module.examType || ''} onChange={(e) => onUpdateModule(module.id, 'examType', e.target.value)} name="examType" placeholder="z.B. Klausur, Projektarbeit" /></label>
                                                                <label className="block"><span className="text-muted-foreground text-sm">Lehrformen</span><EditableCell value={module.teachingMethods || ''} onChange={(e) => onUpdateModule(module.id, 'teachingMethods', e.target.value)} name="teachingMethods" placeholder="z.B. Seminar, Vorlesung" /></label>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="block"><span className="text-muted-foreground text-sm">Modulverantwortliche(r)</span><EditableCell value={module.personInCharge || ''} onChange={(e) => onUpdateModule(module.id, 'personInCharge', e.target.value)} name="personInCharge" /></label>
                                                                <label className="block"><span className="text-muted-foreground text-sm">Literatur</span><EditableCell as="textarea" value={module.literature || ''} onChange={(e) => onUpdateModule(module.id, 'literature', e.target.value)} name="literature" /></label>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="block"><span className="text-muted-foreground text-sm">{t.moduleOverview?.equivalentTo || 'Equivalent zu'}</span><EditableCell value={module.equivalentTo || ''} onChange={(e) => onUpdateModule(module.id, 'equivalentTo', e.target.value)} name="equivalentTo" /></label>
                                                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.semesterRecommendation}</span><EditableCell value={module.semesterRecommendation || ''} onChange={(e) => onUpdateModule(module.id, 'semesterRecommendation', e.target.value)} name="semesterRecommendation" /></label>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.prerequisites}</span><EditableCell value={(module.prerequisites || []).join(', ')} onChange={(e) => handleUpdateField(module.id, 'prerequisites', e.target.value)} name="prerequisites" placeholder="IDs, mit Komma trennen" /></label>
                                                                <label className="block"><span className="text-muted-foreground text-sm">{t.common.forbiddenSemesters}</span><EditableCell value={(module.forbiddenSemesters || []).join(', ')} onChange={(e) => handleUpdateField(module.id, 'forbiddenSemesters', e.target.value)} name="forbiddenSemesters" placeholder="z.B. 1, 2" /></label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={12} className="text-center p-8 text-muted-foreground">Keine Module für die aktuellen Filter gefunden.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};
