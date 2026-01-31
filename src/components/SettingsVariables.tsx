'use client';

import React, { useState } from 'react';
import type { Catalogs, Category } from '@/types';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

interface SettingsVariablesProps {
    catalogs?: Catalogs;
    onUpdateCatalogs?: (catalogs: Catalogs) => void;
    categories: Category[];
    onAddCategory: (category: Category) => void;
    onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
    onDeleteCategory: (categoryId: string) => void;
    lang?: keyof typeof TRANSLATIONS;
}

export const SettingsVariables: React.FC<SettingsVariablesProps> = ({
    catalogs,
    onUpdateCatalogs,
    categories,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    lang = DEFAULT_LANGUAGE,
}) => {
    const t = TRANSLATIONS[lang];
    const [newItemTexts, setNewItemTexts] = useState({
        examTypes: '',
        teachingMethods: '',
        languages: '',
        personInCharge: ''
    });
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleAddItem = (key: keyof Catalogs) => {
        if (!catalogs || !onUpdateCatalogs || !newItemTexts[key as keyof typeof newItemTexts].trim()) return;
        const currentItems = catalogs[key] || [];
        const newItem = newItemTexts[key as keyof typeof newItemTexts].trim();
        if (currentItems.includes(newItem)) return;
        onUpdateCatalogs({ ...catalogs, [key]: [...currentItems, newItem] });
        setNewItemTexts(prev => ({ ...prev, [key]: '' }));
    };

    const handleRemoveItem = (key: keyof Catalogs, index: number) => {
        if (!catalogs || !onUpdateCatalogs) return;
        const currentItems = catalogs[key] || [];
        onUpdateCatalogs({ ...catalogs, [key]: currentItems.filter((_, i) => i !== index) });
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        const id = newCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        onAddCategory({ id, name: newCategoryName.trim() });
        setNewCategoryName('');
    };

    const SectionHeader = ({ title, icon }: { title: string, icon?: React.ReactNode }) => (
        <div className="flex items-center gap-3 mb-6">
            {icon && <div className="p-2 bg-primary/10 text-primary rounded-lg">{icon}</div>}
            <h2 className="text-xl font-black tracking-tight">{title}</h2>
        </div>
    );

    const CatalogCard = ({ title, items, apiKey, placeholder }: { title: string, items: string[], apiKey: keyof Catalogs, placeholder: string }) => (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex justify-between">
                {title}
                <span className="opacity-50">{items.length}</span>
            </h3>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={newItemTexts[apiKey as keyof typeof newItemTexts]}
                    onChange={(e) => setNewItemTexts(prev => ({ ...prev, [apiKey]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(apiKey)}
                    className="flex-grow bg-muted border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                />
                <button onClick={() => handleAddItem(apiKey)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
            </div>
            <div className="space-y-1.5 overflow-auto custom-scrollbar max-h-48 pr-1">
                {items.map((item, idx) => (
                    <div key={idx} className="group flex items-center justify-between p-2.5 bg-muted/20 rounded-lg border border-border/10 hover:bg-muted/40 transition-all">
                        <span className="text-xs font-bold truncate">{item}</span>
                        <button onClick={() => handleRemoveItem(apiKey, idx)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Categories Section */}
            <div>
                <SectionHeader title="Modulkategorien" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>} />
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <p className="text-sm text-muted-foreground font-medium mb-6">Globale Gruppen zur Strukturierung der Semesterpläne.</p>
                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Neue Kategorie..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="max-w-md flex-grow bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                        <button onClick={handleAddCategory} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Hinzufügen</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {categories.map((cat) => (
                            <div key={cat.id} className="group bg-muted/10 border border-border/40 rounded-xl p-3 hover:border-primary/30 transition-all">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[9px] font-black text-muted-foreground opacity-50 uppercase tracking-tighter">{cat.id}</span>
                                    <button onClick={() => onDeleteCategory(cat.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                                <input
                                    value={cat.name}
                                    onChange={(e) => onUpdateCategory(cat.id, { name: e.target.value })}
                                    className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-sm text-foreground"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Catalogs Grid */}
            <div>
                <SectionHeader title="Kataloge & Dropdown-Variablen" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CatalogCard title="Prüfungsformen" items={catalogs?.examTypes || []} apiKey="examTypes" placeholder="z.B. Klausur" />
                    <CatalogCard title="Lehrformen" items={catalogs?.teachingMethods || []} apiKey="teachingMethods" placeholder="z.B. Seminar" />
                    <CatalogCard title="Sprachen" items={catalogs?.languages || []} apiKey="languages" placeholder="z.B. Englisch" />
                </div>
            </div>
        </div>
    );
};
