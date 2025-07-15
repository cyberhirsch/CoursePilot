'use client';

import React, { useState, useMemo } from 'react';
import type { Module, Program, Category } from '@/types';

const EditableCell: React.FC<{ value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void, type?: string, name: string, className?: string, options?: string[], as?: 'input' | 'textarea', placeholder?: string }> = ({ value, onChange, type = 'text', name, className, options, as = 'input', placeholder }) => {
    const commonClasses = `bg-muted w-full p-1 rounded-md border-input border focus:bg-accent/20 focus:ring-1 focus:ring-ring focus:outline-none text-foreground ${className}`;
    
    if (as === 'textarea') {
        return (
             <textarea
                name={name}
                value={value}
                onChange={onChange}
                className={`${commonClasses} h-24 resize-y`}
                aria-label={`Editable textarea for ${name}`}
                placeholder={placeholder}
            />
        )
    }

    if (type === 'select' && options) {
        return (
            <select
                name={name}
                value={value}
                onChange={onChange}
                className={commonClasses}
                aria-label={`Editable select for ${name}`}
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        );
    }

    return (
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className={commonClasses}
            aria-label={`Editable cell for ${name} with value ${value}`}
            placeholder={placeholder}
        />
    );
};

const ProgramSelector: React.FC<{ programs: Program[], selectedProgramIds: string[], onChange: (programId: string, checked: boolean) => void }> = ({ programs, selectedProgramIds, onChange }) => (
    <div className="flex flex-wrap gap-x-3 gap-y-1 items-center justify-start">
        {programs.map(p => (
            <label key={p.id} className="flex items-center space-x-1 cursor-pointer text-foreground hover:text-white">
                <input
                    type="checkbox"
                    checked={selectedProgramIds.includes(p.id)}
                    onChange={(e) => onChange(p.id, e.target.checked)}
                    className="form-checkbox h-4 w-4 rounded bg-input border-border text-primary focus:ring-ring"
                    aria-label={`Assign to program ${p.id}`}
                />
                <span className="text-xs font-semibold">{p.id}</span>
            </label>
        ))}
    </div>
);


const initialNewModuleState: Module = {
    id: '', name: '', ects: 0, sws: 0, cp: 0, workload: 0,
    type: 'Pflicht', category: '', fachbereich: 'Design',
    description: '', learningOutcomes: '', assessment: '',
    prerequisites: [], forbiddenSemesters: [], maxParticipants: 0,
};

const CategoryManager: React.FC<{
    categories: Category[];
    onAddCategory: (category: Category) => void;
    onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
    onDeleteCategory: (categoryId: string) => void;
}> = ({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    const handleAdd = () => {
        if (!newCategoryName.trim()) return;
        const newId = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 10);
        onAddCategory({ id: newId, name: newCategoryName.trim() });
        setNewCategoryName('');
    };

    const handleStartEdit = (category: Category) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
    };

    const handleCancelEdit = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };

    const handleSaveEdit = () => {
        if (editingCategoryId && editingCategoryName) {
            onUpdateCategory(editingCategoryId, { name: editingCategoryName });
        }
        handleCancelEdit();
    };

    return (
        <div className="p-4 flex flex-col">
            <div className="space-y-2">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-muted/50 p-2 rounded-md flex items-center justify-between">
                        {editingCategoryId === cat.id ? (
                            <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                className="bg-accent/20 text-foreground p-1 rounded-md w-full"
                                autoFocus
                            />
                        ) : (
                            <span className="text-foreground">{cat.name}</span>
                        )}
                        <div className="flex items-center space-x-2 ml-2">
                            {editingCategoryId === cat.id ? (
                                <>
                                    <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300">✓</button>
                                    <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300">×</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => handleStartEdit(cat)} className="text-muted-foreground hover:text-foreground">✏️</button>
                                    <button onClick={() => onDeleteCategory(cat.id)} className="text-muted-foreground hover:text-destructive">🗑️</button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">Neue Kategorie</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Name der Kategorie"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-grow bg-input p-2 rounded-md"
                    />
                    <button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-3 rounded-md">+</button>
                </div>
            </div>
        </div>
    );
};


interface ModuleOverviewProps {
    modules: Module[];
    programs: Program[];
    onUpdateModule: (moduleId: string, field: keyof Module, value: any) => void;
    onAddModule: (module: Module, programIds: string[]) => void;
    onDeleteModule: (moduleId: string) => void;
    onUpdateModulePrograms: (moduleId: string, programIds: string[]) => void;
    categories: Category[];
    onAddCategory: (category: Category) => void;
    onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
    onDeleteCategory: (categoryId: string) => void;
}

export const ModuleOverview: React.FC<ModuleOverviewProps> = ({ modules, programs, onUpdateModule, onAddModule, onDeleteModule, onUpdateModulePrograms, categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
    const [fachbereichFilter, setFachbereichFilter] = useState<string>('all');
    const [programFilter, setProgramFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);
    const [newModule, setNewModule] = useState<Module>({...initialNewModuleState, category: categories[0]?.name || '' });
    const [newModulePrograms, setNewModulePrograms] = useState<string[]>([]);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const handleNewModuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['sws', 'cp', 'workload', 'instanceCount', 'maxParticipants'].includes(name);

        if (name === 'prerequisites' || name === 'forbiddenSemesters') {
             const arrValue = value.split(',').map(s => s.trim()).filter(Boolean);
             if (name === 'forbiddenSemesters') {
                 setNewModule(prev => ({...prev, [name]: arrValue.map(n => parseInt(n)).filter(n => !isNaN(n))}));
             } else {
                 setNewModule(prev => ({...prev, [name]: arrValue }));
             }
        } else {
            setNewModule(prev => ({...prev, [name]: isNumeric ? parseInt(value) || 0 : value }));
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
        setNewModule({...initialNewModuleState, category: categories[0]?.name || ''});
        setNewModulePrograms([]);
    };

    const handleDeleteClick = (moduleId: string) => {
        const module = modules.find(m => m.id === moduleId);
        if (window.confirm(`Möchten Sie das Modul "${module?.name || moduleId}" wirklich löschen? Es wird aus allen Plänen und Studiengängen entfernt.`)) {
            onDeleteModule(moduleId);
        }
    };

    const handleModuleProgramChange = (moduleId: string, programId: string, checked: boolean) => {
        const currentProgramIds = programs.filter(p => p.moduleIds.includes(moduleId)).map(p => p.id);
        const newProgramIds = checked
            ? [...currentProgramIds, programId]
            : currentProgramIds.filter(id => id !== programId);
        onUpdateModulePrograms(moduleId, newProgramIds);
    };

    const filteredModules = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        
        return modules
            .filter(module => {
                if (fachbereichFilter !== 'all' && module.fachbereich !== fachbereichFilter) return false;
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

    return (
        <div className="flex flex-col h-full gap-6">
            <details className="bg-card rounded-lg shadow-md border border-border open:ring-1 open:ring-ring transition-shadow">
                <summary className="p-4 cursor-pointer text-xl font-bold text-foreground hover:bg-muted/50 rounded-lg list-none flex justify-between items-center select-none">
                    Kategorien verwalten
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 transform details-arrow" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <style>{`
                        details[open] .details-arrow {
                            transform: rotate(180deg);
                        }
                    `}</style>
                </summary>
                <div className="border-t border-border">
                    <CategoryManager 
                        categories={categories}
                        onAddCategory={onAddCategory}
                        onUpdateCategory={onUpdateCategory}
                        onDeleteCategory={onDeleteCategory}
                    />
                </div>
            </details>

            <div className="bg-card rounded-lg shadow-md h-full flex flex-col border border-border flex-grow min-h-0">
                <div className="p-4 border-b-2 border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Modulübersicht</h2>
                        <p className="text-sm text-muted-foreground">Zentrale Übersicht und Bearbeitung aller im System verfügbaren Module.</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(prev => !prev)}
                        className={`${isAdding ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'} text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors`}
                    >
                        {isAdding ? 'Schließen' : '+ Neues Modul'}
                    </button>
                </div>
                
                {isAdding && (
                    <div className="p-4 border-b-2 border-border bg-background/30">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Neues Modul anlegen</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Column 1: Core Data */}
                            <div className="space-y-4">
                                <label className="block"><span className="text-muted-foreground text-sm">ID*</span><EditableCell value={newModule.id} onChange={handleNewModuleChange} name="id" /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">Name*</span><EditableCell value={newModule.name} onChange={handleNewModuleChange} name="name" /></label>
                                <label className="block"><span className="text-muted-foreground text-sm">Typ*</span><EditableCell value={newModule.type} onChange={handleNewModuleChange} name="type" type="select" options={['Pflicht', 'Wahlpflicht', 'Pool']} /></label>
                                <div className="pt-2">
                                    <span className="text-muted-foreground text-sm">Studiengänge</span>
                                    <div className="p-2 bg-muted/50 rounded-md mt-1"><ProgramSelector programs={programs} selectedProgramIds={newModulePrograms} onChange={handleNewModuleProgramChange} /></div>
                                </div>
                            </div>

                            {/* Column 2: Categories & Numbers */}
                            <div className="space-y-4">
                                <label className="block"><span className="text-muted-foreground text-sm">Kategorie*</span><EditableCell value={newModule.category} onChange={handleNewModuleChange} name="category" type="select" options={categoryOptions} /></label>
                                <div className="grid grid-cols-3 gap-3">
                                    <label className="block"><span className="text-muted-foreground text-sm">SWS</span><EditableCell value={newModule.sws} onChange={handleNewModuleChange} name="sws" type="number" className="text-center" /></label>
                                    <label className="block"><span className="text-muted-foreground text-sm">CP</span><EditableCell value={newModule.cp} onChange={handleNewModuleChange} name="cp" type="number" className="text-center" /></label>
                                    <label className="block"><span className="text-muted-foreground text-sm">Workload</span><EditableCell value={newModule.workload} onChange={handleNewModuleChange} name="workload" type="number" className="text-center" /></label>
                                </div>
                                {newModule.type === 'Pool' && <label className="block"><span className="text-muted-foreground text-sm">Instanzen</span><EditableCell value={newModule.instanceCount || 0} onChange={handleNewModuleChange} name="instanceCount" type="number" className="text-center w-20" /></label>}
                            </div>

                            {/* Column 3: Details & Dependencies */}
                            <div className="space-y-4">
                            <label className="block"><span className="text-muted-foreground text-sm">Max. Teilnehmer</span><EditableCell value={newModule.maxParticipants || 0} onChange={handleNewModuleChange} name="maxParticipants" type="number" /></label>
                            <label className="block"><span className="text-muted-foreground text-sm">Voraussetzungen</span><EditableCell value={(newModule.prerequisites || []).join(', ')} onChange={handleNewModuleChange} name="prerequisites" placeholder="IDs, mit Komma trennen" /></label>
                            <label className="block"><span className="text-muted-foreground text-sm">Gesperrte Semester</span><EditableCell value={(newModule.forbiddenSemesters || []).join(', ')} onChange={handleNewModuleChange} name="forbiddenSemesters" placeholder="z.B. 1, 2" /></label>
                            <label className="block"><span className="text-muted-foreground text-sm">Semesterempfehlung</span><EditableCell value={newModule.semesterRecommendation || ''} onChange={handleNewModuleChange} name="semesterRecommendation" /></label>
                            </div>
                            
                            {/* Column 4: Text & Actions */}
                            <div className="space-y-4 flex flex-col">
                            <label className="block flex-grow"><span className="text-muted-foreground text-sm">Beschreibung</span><EditableCell as="textarea" value={newModule.description || ''} onChange={handleNewModuleChange} name="description" /></label>
                            <div className="flex justify-end items-center gap-4 pt-6">
                                    <button onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-foreground font-bold py-2 px-4 rounded-lg transition-colors">Abbrechen</button>
                                    <button onClick={handleSaveNewModule} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Modul speichern</button>
                            </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 border-b border-border bg-background/50 flex flex-wrap items-center gap-4">
                    <div className="flex-grow min-w-[200px]">
                        <label htmlFor="search-module" className="block text-sm font-medium text-muted-foreground mb-1">Suchen (ID/Name)</label>
                        <input id="search-module" type="text" placeholder="Modul suchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-input w-full p-2 rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="fachbereich-filter" className="block text-sm font-medium text-muted-foreground mb-1">Fachbereich</label>
                        <select id="fachbereich-filter" value={fachbereichFilter} onChange={e => setFachbereichFilter(e.target.value)} className="bg-input p-2 rounded-md">
                            <option value="all">Alle</option>
                            <option value="Design">Design</option>
                            <option value="Psychologie">Psychologie</option>
                            <option value="Wirtschaft">Wirtschaft</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="program-filter" className="block text-sm font-medium text-muted-foreground mb-1">Studiengang</label>
                        <select id="program-filter" value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="bg-input p-2 rounded-md">
                            <option value="all">Alle</option>
                            {programs.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="category-filter" className="block text-sm font-medium text-muted-foreground mb-1">Kategorie</label>
                        <select id="category-filter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-input p-2 rounded-md">
                            <option value="all">Alle</option>
                            {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="self-end pt-5">
                        <span className="text-sm text-muted-foreground">{filteredModules.length} Module gefunden</span>
                    </div>
                </div>

                <div className="flex-grow overflow-auto relative">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="sticky top-0 z-10 bg-card/75 backdrop-blur-sm text-left">
                                <th className="p-2 border-b border-border w-12" aria-label="Details ausklappen"></th>
                                <th className="p-2 border-b border-border w-24 font-code">ID</th>
                                <th className="p-2 border-b border-border min-w-[200px]">Name</th>
                                <th className="p-2 border-b border-border w-48">Kategorie</th>
                                <th className="p-2 border-b border-border w-32">Typ</th>
                                <th className="p-2 border-b border-border w-16 text-center">SWS</th>
                                <th className="p-2 border-b border-border w-16 text-center">CP</th>
                                <th className="p-2 border-b border-border w-20 text-center">Workload</th>
                                <th className="p-2 border-b border-border w-20 text-center">Instanzen</th>
                                <th className="p-2 border-b border-border w-20 text-center" title="Maximale Teilnehmer">Teilnehmer</th>
                                <th className="p-2 border-b border-border w-24 text-center">Aktionen</th>
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
                                            <td className="p-1 border-t border-border"><EditableCell value={module.type} onChange={(e) => onUpdateModule(module.id, 'type', e.target.value)} name="type" type="select" options={['Pflicht', 'Wahlpflicht', 'Pool']} /></td>
                                            <td className="p-1 border-t border-border text-center"><EditableCell value={module.sws} onChange={(e) => onUpdateModule(module.id, 'sws', parseInt(e.target.value) || 0)} name="sws" type="number" className="text-center" /></td>
                                            <td className="p-1 border-t border-border text-center"><EditableCell value={module.cp} onChange={(e) => onUpdateModule(module.id, 'cp', parseInt(e.target.value) || 0)} name="cp" type="number" className="text-center" /></td>
                                            <td className="p-1 border-t border-border text-center"><EditableCell value={module.workload} onChange={(e) => onUpdateModule(module.id, 'workload', parseInt(e.target.value) || 0)} name="workload" type="number" className="text-center" /></td>
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
                                                <td colSpan={11} className="p-0">
                                                     <div className="p-4 space-y-4">
                                                        <div className="lg:col-span-4 bg-muted/50 p-4 rounded-md border border-border">
                                                            <label className="block text-muted-foreground text-sm font-semibold mb-2">Zugeordnete Studiengänge</label>
                                                            <ProgramSelector programs={programs} selectedProgramIds={assignedProgramIds} onChange={(programId, checked) => handleModuleProgramChange(module.id, programId, checked)} />
                                                        </div>
                                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                            <div className="space-y-4">
                                                                <label className="block"><span className="text-muted-foreground text-sm">Beschreibung</span><EditableCell as="textarea" value={module.description || ''} onChange={(e) => onUpdateModule(module.id, 'description', e.target.value)} name="description" /></label>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="block"><span className="text-muted-foreground text-sm">Lernergebnisse</span><EditableCell as="textarea" value={module.learningOutcomes || ''} onChange={(e) => onUpdateModule(module.id, 'learningOutcomes', e.target.value)} name="learningOutcomes" /></label>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="block"><span className="text-muted-foreground text-sm">Prüfungsform</span><EditableCell value={module.assessment || ''} onChange={(e) => onUpdateModule(module.id, 'assessment', e.target.value)} name="assessment" /></label>
                                                                <label className="block"><span className="text-muted-foreground text-sm">Semesterempfehlung</span><EditableCell value={module.semesterRecommendation || ''} onChange={(e) => onUpdateModule(module.id, 'semesterRecommendation', e.target.value)} name="semesterRecommendation" /></label>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="block"><span className="text-muted-foreground text-sm">Voraussetzungen</span><EditableCell value={(module.prerequisites || []).join(', ')} onChange={(e) => handleUpdateField(module.id, 'prerequisites', e.target.value)} name="prerequisites" placeholder="IDs, mit Komma trennen" /></label>
                                                                <label className="block"><span className="text-muted-foreground text-sm">Gesperrte Semester</span><EditableCell value={(module.forbiddenSemesters || []).join(', ')} onChange={(e) => handleUpdateField(module.id, 'forbiddenSemesters', e.target.value)} name="forbiddenSemesters" placeholder="z.B. 1, 2" /></label>
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
                                <td colSpan={11} className="text-center p-8 text-muted-foreground">Keine Module für die aktuellen Filter gefunden.</td>
                            </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
