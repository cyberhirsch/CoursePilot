import React, { useState, useMemo } from 'react';
import type { Module, Program, Catalogs, User, Category } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';
import { EditableCell } from './module-overview/EditableCell';

interface ModuleDetailViewProps {
    modules: Module[];
    programs: Program[];
    users?: User[];
    onUpdateModule: (moduleId: string, field: keyof Module, value: any) => void;
    lang?: keyof typeof TRANSLATIONS;
    catalogs?: Catalogs;
    categories?: Category[];
}

export const ModuleDetailView: React.FC<ModuleDetailViewProps> = ({
    modules,
    programs,
    users = [],
    onUpdateModule,
    lang = DEFAULT_LANGUAGE,
    catalogs,
    categories = []
}) => {
    const t = TRANSLATIONS[lang];
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [programFilter, setProgramFilter] = useState('all');

    // Filter users valid for "Person in Charge"
    const personInChargeOptions = useMemo(() => {
        return users
            .filter(u => u.role === 'professor' || u.role === 'lecturer' || u.role === 'admin')
            .map(u => u.name)
            .sort();
    }, [users]);

    const filteredModules = useMemo(() => {
        return modules.filter(m => {
            const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchProgram = programFilter === 'all'
                ? true
                : programs.find(p => p.id === programFilter)?.moduleIds.includes(m.id);
            return matchSearch && matchProgram;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [modules, searchTerm, programFilter, programs]);

    const selectedModule = modules.find(m => m.id === selectedModuleId);

    return (
        <div className="flex h-full border border-border rounded-lg overflow-hidden bg-background">
            {/* Sidebar List */}
            <div className="w-1/6 min-w-[200px] border-r border-border flex flex-col bg-card">
                <div className="p-4 border-b border-border space-y-3">
                    <h2 className="font-bold text-lg">{t.navigation.modules}</h2>

                    <select
                        value={programFilter}
                        onChange={e => setProgramFilter(e.target.value)}
                        className="w-full p-2 rounded-md bg-input text-sm border border-input shadow-sm"
                    >
                        <option value="all">Alle Studiengänge</option>
                        {programs.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder={t.planner.search}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 rounded-md bg-input text-sm border border-input shadow-sm"
                    />
                </div>

                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {filteredModules.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedModuleId(m.id)}
                            className={`w-full text-left p-3 rounded-md text-sm transition-colors flex justify-between items-center ${selectedModuleId === m.id
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'hover:bg-muted/50 text-foreground'
                                }`}
                        >
                            <span className="font-medium truncate pr-2">{m.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-mono ${selectedModuleId === m.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {m.id}
                            </span>
                        </button>
                    ))}
                    {filteredModules.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            Keine Module gefunden.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow overflow-y-auto bg-background/50 p-8">
                {selectedModule ? (
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
                        {/* Header Section */}
                        <div className="border-b border-border pb-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-grow pr-8">
                                    <h1 className="text-3xl font-bold text-foreground mb-4">
                                        <EditableCell
                                            value={selectedModule.name}
                                            onChange={(e) => onUpdateModule(selectedModule.id, 'name', e.target.value)}
                                            name="name"
                                            className="bg-transparent border-none p-0 focus:ring-0 w-full"
                                        />
                                    </h1>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">ID</label>
                                            <EditableCell
                                                value={selectedModule.id}
                                                onChange={(e) => onUpdateModule(selectedModule.id, 'id', e.target.value)}
                                                name="id"
                                                className="font-mono text-sm bg-muted/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Typ</label>
                                            <EditableCell
                                                value={selectedModule.type}
                                                onChange={(e) => onUpdateModule(selectedModule.id, 'type', e.target.value)}
                                                name="type"
                                                type="select"
                                                options={['Pflicht', 'Wahlpflicht', 'Pool']}
                                                className="text-sm bg-muted/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Kategorie</label>
                                            <EditableCell
                                                value={selectedModule.category}
                                                onChange={(e) => onUpdateModule(selectedModule.id, 'category', e.target.value)}
                                                name="category"
                                                type="select"
                                                options={categories.map(c => c.name)}
                                                className="text-sm bg-muted/30"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-16">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">SWS</label>
                                                <EditableCell
                                                    value={String(selectedModule.sws)}
                                                    onChange={(e) => onUpdateModule(selectedModule.id, 'sws', Number(e.target.value))}
                                                    name="sws"
                                                    type="number"
                                                    className="text-sm bg-muted/30"
                                                />
                                            </div>
                                            <div className="w-16">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">CP</label>
                                                <EditableCell
                                                    value={String(selectedModule.cp)}
                                                    onChange={(e) => onUpdateModule(selectedModule.id, 'cp', Number(e.target.value))}
                                                    name="cp"
                                                    type="number"
                                                    className="text-sm bg-muted/30"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">max. Teilnehmerzahl</label>
                                            <EditableCell
                                                value={String(selectedModule.maxParticipants || '')}
                                                onChange={(e) => onUpdateModule(selectedModule.id, 'maxParticipants', Number(e.target.value))}
                                                name="maxParticipants"
                                                type="number"
                                                className="text-sm bg-muted/30"
                                                placeholder="∞"
                                            />
                                        </div>
                                        {selectedModule.type === 'Pool' && (
                                            <div>
                                                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Instanzen</label>
                                                <EditableCell
                                                    value={String(selectedModule.instanceCount || '')}
                                                    onChange={(e) => onUpdateModule(selectedModule.id, 'instanceCount', Number(e.target.value))}
                                                    name="instanceCount"
                                                    type="number"
                                                    className="text-sm bg-muted/30 border-primary/50"
                                                    placeholder="0"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Verantwortlich</div>
                                    <EditableCell
                                        value={selectedModule.personInCharge || ''}
                                        onChange={(e) => onUpdateModule(selectedModule.id, 'personInCharge', e.target.value)}
                                        name="personInCharge"
                                        type="select"
                                        options={personInChargeOptions.length > 0 ? personInChargeOptions : []}
                                        placeholder="Wählen..."
                                        className="text-right text-base font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content Grid - Single Column */}
                        <div className="space-y-8">
                            <Section title="Beschreibung">
                                <EditableCell
                                    as="textarea"
                                    value={selectedModule.description || ''}
                                    onChange={(e) => onUpdateModule(selectedModule.id, 'description', e.target.value)}
                                    name="description"
                                    className="min-h-[100px]"
                                    placeholder="Allgemeine Beschreibung des Moduls..."
                                />
                            </Section>

                            <Section title={t.moduleOverview?.learningOutcomes || 'Lernergebnisse'}>
                                <EditableCell as="textarea" value={selectedModule.learningOutcomes || ''} onChange={(e) => onUpdateModule(selectedModule.id, 'learningOutcomes', e.target.value)} name="learningOutcomes" className="min-h-[150px]" />
                            </Section>

                            <Section title="Inhaltsübersicht">
                                <div className="border rounded-md overflow-hidden bg-muted/20">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground font-medium">
                                            <tr>
                                                <th className="p-3 w-12 text-center">Nr.</th>
                                                <th className="p-3 w-1/4">Themen</th>
                                                <th className="p-3">Inhalte</th>
                                                <th className="p-3 w-1/3">Qualifikations- und Kompetenzziele</th>
                                                <th className="p-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {/* Logic to use new contentDetails or fallback to migrating contentTopics */}
                                            {(() => {
                                                const rows = (selectedModule.contentDetails && selectedModule.contentDetails.length > 0)
                                                    ? selectedModule.contentDetails
                                                    : (selectedModule.contentTopics || []).map(topic => ({ topic: '', content: topic, goals: '' }));

                                                // If completely empty, show one empty row
                                                const displayRows = rows.length > 0 ? rows : [{ topic: '', content: '', goals: '' }];

                                                return displayRows.map((row, index) => (
                                                    <tr key={index} className="group hover:bg-muted/40 transition-colors">
                                                        <td className="p-2 text-center text-muted-foreground font-mono text-xs">{index + 1}.</td>
                                                        <td className="p-2 align-top">
                                                            <EditableCell
                                                                value={row.topic}
                                                                onChange={(e) => {
                                                                    const newRows = [...displayRows];
                                                                    newRows[index] = { ...newRows[index], topic: e.target.value };
                                                                    onUpdateModule(selectedModule.id, 'contentDetails', newRows);
                                                                }}
                                                                name={`topic-${index}`}
                                                                as="textarea"
                                                                className="bg-transparent border-transparent focus:bg-background focus:border-input min-h-[40px] font-semibold"
                                                                placeholder="Thema..."
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top">
                                                            <EditableCell
                                                                value={row.content}
                                                                onChange={(e) => {
                                                                    const newRows = [...displayRows];
                                                                    newRows[index] = { ...newRows[index], content: e.target.value };
                                                                    onUpdateModule(selectedModule.id, 'contentDetails', newRows);
                                                                    // Keep legacy sync for now if needed, or just abandon it. 
                                                                    // Abandoning legacy sync for simple array as this structure is richer.
                                                                }}
                                                                name={`content-${index}`}
                                                                as="textarea"
                                                                className="bg-transparent border-transparent focus:bg-background focus:border-input min-h-[60px]"
                                                                placeholder="Inhalte beschreiben..."
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top">
                                                            <EditableCell
                                                                value={row.goals}
                                                                onChange={(e) => {
                                                                    const newRows = [...displayRows];
                                                                    newRows[index] = { ...newRows[index], goals: e.target.value };
                                                                    onUpdateModule(selectedModule.id, 'contentDetails', newRows);
                                                                }}
                                                                name={`goals-${index}`}
                                                                as="textarea"
                                                                className="bg-transparent border-transparent focus:bg-background focus:border-input min-h-[60px]"
                                                                placeholder="Ziele definieren..."
                                                            />
                                                        </td>
                                                        <td className="p-2 text-right align-top">
                                                            <button
                                                                onClick={() => {
                                                                    const newRows = displayRows.filter((_, i) => i !== index);
                                                                    onUpdateModule(selectedModule.id, 'contentDetails', newRows);
                                                                }}
                                                                className="text-muted-foreground hover:text-destructive p-1 rounded opacity-0 group-hover:opacity-100 transition-all font-bold"
                                                                title="Zeile löschen"
                                                            >
                                                                ×
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                            <tr>
                                                <td className="p-2" colSpan={5}>
                                                    <button
                                                        onClick={() => {
                                                            const currentRows = (selectedModule.contentDetails && selectedModule.contentDetails.length > 0)
                                                                ? selectedModule.contentDetails
                                                                : (selectedModule.contentTopics || []).map(topic => ({ topic: '', content: topic, goals: '' }));
                                                            const newRows = [...currentRows, { topic: '', content: '', goals: '' }];
                                                            onUpdateModule(selectedModule.id, 'contentDetails', newRows);
                                                        }}
                                                        className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 w-full justify-center py-2 border-t border-dashed border-border"
                                                    >
                                                        + Zeile hinzufügen
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Section>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Section title="Prüfungsform">
                                    <EditableCell
                                        value={selectedModule.examType || ''}
                                        onChange={(e) => onUpdateModule(selectedModule.id, 'examType', e.target.value)}
                                        name="examType"
                                        type="select"
                                        options={catalogs?.examTypes || []}
                                        placeholder="Wählen..."
                                    />
                                </Section>
                                <Section title="Lehrformen">
                                    <EditableCell
                                        value={selectedModule.teachingMethods || ''}
                                        onChange={(e) => onUpdateModule(selectedModule.id, 'teachingMethods', e.target.value)}
                                        name="teachingMethods"
                                        type="select"
                                        options={catalogs?.teachingMethods || []}
                                        placeholder="Wählen..."
                                    />
                                </Section>
                                <Section title="Sprache">
                                    <EditableCell
                                        value={selectedModule.language || ''}
                                        onChange={(e) => onUpdateModule(selectedModule.id, 'language', e.target.value)}
                                        name="language"
                                        type="select"
                                        options={catalogs?.languages || []}
                                        placeholder="Wählen..."
                                    />
                                </Section>
                            </div>

                            <Section title={t.common.requirements.title || 'Raumanforderungen'}>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 border border-dashed border-border rounded-xl bg-muted/5">
                                    {[
                                        { key: 'macRoom', label: t.common.requirements.macRoom },
                                        { key: 'pcLab', label: t.common.requirements.pcLab },
                                        { key: 'beamer', label: t.common.requirements.beamer },
                                        { key: 'lecturerPc', label: t.common.requirements.lecturerPc },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center space-x-4 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedModule.requirements?.[key as keyof NonNullable<typeof selectedModule.requirements>]}
                                                    onChange={(e) => {
                                                        const newReqs = {
                                                            macRoom: false,
                                                            pcLab: false,
                                                            beamer: false,
                                                            lecturerPc: false,
                                                            ...(selectedModule.requirements || {}),
                                                            [key]: e.target.checked
                                                        };
                                                        onUpdateModule(selectedModule.id, 'requirements', newReqs);
                                                    }}
                                                    className="peer w-5 h-5 rounded border-2 border-border text-primary focus:ring-primary/20 bg-background transition-all checked:bg-primary checked:border-primary disabled:opacity-50"
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-all">
                                                {label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </Section>

                            <Section title="Literatur">
                                <div className="border rounded-md overflow-hidden bg-muted/20">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground font-medium">
                                            <tr>
                                                <th className="p-3 w-12 text-center">Nr.</th>
                                                <th className="p-3 w-1/4">Autor/en</th>
                                                <th className="p-3 w-1/3">Titel</th>
                                                <th className="p-3">Verlag</th>
                                                <th className="p-3">Anmerkung</th>
                                                <th className="p-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {(() => {
                                                const rows = (selectedModule.literatureDetails && selectedModule.literatureDetails.length > 0)
                                                    ? selectedModule.literatureDetails
                                                    : (selectedModule.literatureItems || []).map(item => ({ author: '', title: item, publisher: '', comment: '' }));

                                                const displayRows = rows.length > 0 ? rows : [{ author: '', title: '', publisher: '', comment: '' }];

                                                return displayRows.map((row, index) => (
                                                    <tr key={index} className="group hover:bg-muted/40 transition-colors">
                                                        <td className="p-2 text-center text-muted-foreground font-mono text-xs">{index + 1}.</td>
                                                        <td className="p-2 align-top">
                                                            <EditableCell
                                                                value={row.author}
                                                                onChange={(e) => {
                                                                    const newRows = [...displayRows];
                                                                    newRows[index] = { ...newRows[index], author: e.target.value };
                                                                    onUpdateModule(selectedModule.id, 'literatureDetails', newRows);
                                                                }}
                                                                name={`lit-author-${index}`}
                                                                as="textarea"
                                                                className="bg-transparent border-transparent focus:bg-background focus:border-input min-h-[40px]"
                                                                placeholder="Autor..."
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top">
                                                            <EditableCell
                                                                value={row.title}
                                                                onChange={(e) => {
                                                                    const newRows = [...displayRows];
                                                                    newRows[index] = { ...newRows[index], title: e.target.value };
                                                                    onUpdateModule(selectedModule.id, 'literatureDetails', newRows);
                                                                }}
                                                                name={`lit-title-${index}`}
                                                                as="textarea"
                                                                className="bg-transparent border-transparent focus:bg-background focus:border-input min-h-[40px] font-semibold"
                                                                placeholder="Titel..."
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top">
                                                            <EditableCell
                                                                value={row.publisher}
                                                                onChange={(e) => {
                                                                    const newRows = [...displayRows];
                                                                    newRows[index] = { ...newRows[index], publisher: e.target.value };
                                                                    onUpdateModule(selectedModule.id, 'literatureDetails', newRows);
                                                                }}
                                                                name={`lit-publisher-${index}`}
                                                                as="textarea"
                                                                className="bg-transparent border-transparent focus:bg-background focus:border-input min-h-[40px]"
                                                                placeholder="Verlag..."
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top">
                                                            <EditableCell
                                                                value={row.comment}
                                                                onChange={(e) => {
                                                                    const newRows = [...displayRows];
                                                                    newRows[index] = { ...newRows[index], comment: e.target.value };
                                                                    onUpdateModule(selectedModule.id, 'literatureDetails', newRows);
                                                                }}
                                                                name={`lit-comment-${index}`}
                                                                as="textarea"
                                                                className="bg-transparent border-transparent focus:bg-background focus:border-input min-h-[40px]"
                                                                placeholder="Anmerkung..."
                                                            />
                                                        </td>
                                                        <td className="p-2 text-right align-top">
                                                            <button
                                                                onClick={() => {
                                                                    const newRows = displayRows.filter((_, i) => i !== index);
                                                                    onUpdateModule(selectedModule.id, 'literatureDetails', newRows);
                                                                }}
                                                                className="text-muted-foreground hover:text-destructive p-1 rounded opacity-0 group-hover:opacity-100 transition-all font-bold"
                                                                title="Zeile löschen"
                                                            >
                                                                ×
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                            <tr>
                                                <td className="p-2" colSpan={6}>
                                                    <button
                                                        onClick={() => {
                                                            const currentRows = (selectedModule.literatureDetails && selectedModule.literatureDetails.length > 0)
                                                                ? selectedModule.literatureDetails
                                                                : (selectedModule.literatureItems || []).map(item => ({ author: '', title: item, publisher: '', comment: '' }));
                                                            const newRows = [...currentRows, { author: '', title: '', publisher: '', comment: '' }];
                                                            onUpdateModule(selectedModule.id, 'literatureDetails', newRows);
                                                        }}
                                                        className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 w-full justify-center py-2 border-t border-dashed border-border"
                                                    >
                                                        + Zeile hinzufügen
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Section title="Voraussetzungen">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground block mb-1">Formal (IDs)</label>
                                            <EditableCell value={(selectedModule.prerequisites || []).join(', ')} onChange={(e) => {
                                                const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                onUpdateModule(selectedModule.id, 'prerequisites', val);
                                            }} name="prerequisites" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground block mb-1">Semesterempfehlung</label>
                                            <EditableCell value={selectedModule.semesterRecommendation || ''} onChange={(e) => onUpdateModule(selectedModule.id, 'semesterRecommendation', e.target.value)} name="semesterRecommendation" />
                                        </div>
                                    </div>
                                </Section>

                                <Section title="Dauer & Häufigkeit">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground block mb-1">{t.common.duration || 'Dauer'}</label>
                                            <EditableCell value={selectedModule.duration || ''} onChange={(e) => onUpdateModule(selectedModule.id, 'duration', e.target.value)} name="duration" placeholder="z.B. 1 Semester" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground block mb-1">{t.common.frequency || 'Häufigkeit'}</label>
                                            <EditableCell value={selectedModule.frequency || ''} onChange={(e) => onUpdateModule(selectedModule.id, 'frequency', e.target.value)} name="frequency" placeholder="z.B. SoSe" />
                                        </div>
                                    </div>
                                </Section>
                            </div>

                            {(selectedModule.workloadDetails || selectedModule.workload) && (
                                <Section title="Workload Details">
                                    <div className="border rounded-md overflow-hidden bg-muted/20">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted text-muted-foreground font-medium">
                                                <tr>
                                                    <th className="p-3">Beschreibung / Aktivität</th>
                                                    <th className="p-3 w-32 text-center">Stunden (h)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {(selectedModule.workloadDetails || []).map((item, index) => (
                                                    <tr key={index} className="group hover:bg-muted/40 transition-colors">
                                                        <td className="p-2">{item.description}</td>
                                                        <td className="p-2 text-center">{item.hours}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Section>
                            )}

                        </div>

                        {/* Footer Metadata */}
                        < div className="border-t border-border mt-6 pt-6 text-sm text-muted-foreground bg-muted/20 p-4 rounded-md" >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <span className="block font-semibold mb-1">Kategorie</span>
                                    {selectedModule.category}
                                </div>
                                <div>
                                    <span className="block font-semibold mb-1">Workload (Kalkuliert)</span>
                                    {/* Use total from details if available, else standard calculation */}
                                    {(selectedModule.workloadDetails && selectedModule.workloadDetails.length > 0)
                                        ? selectedModule.workloadDetails.reduce((sum, item) => sum + (item.hours || 0), 0)
                                        : (selectedModule.workload || (selectedModule.cp * 30))}h
                                </div>
                                <div>
                                    <span className="block font-semibold mb-1">Department</span>
                                    {selectedModule.department || '-'}
                                </div>
                                <div>
                                    <span className="block font-semibold mb-1">Letzte Änderung</span>
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div >

                    </div >
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <div className="bg-muted/50 p-6 rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium">Wählen Sie ein Modul aus der Liste, um Details zu sehen.</p>
                    </div>
                )}
            </div >
        </div >
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">{title}</h3>
        {children}
    </div>
);
