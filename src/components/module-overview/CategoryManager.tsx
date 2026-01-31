'use client';

import React, { useState } from 'react';
import type { Category } from '@/types';

interface CategoryManagerProps {
    categories: Category[];
    onAddCategory: (category: Category) => void;
    onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
    onDeleteCategory: (categoryId: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
    categories,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
}) => {
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
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        className="bg-muted/50 p-2 rounded-md flex items-center justify-between"
                    >
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
                                    <button
                                        onClick={handleSaveEdit}
                                        className="text-green-400 hover:text-green-300"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        ×
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleStartEdit(cat)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => onDeleteCategory(cat.id)}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        🗑️
                                    </button>
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
                    <button
                        onClick={handleAdd}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-3 rounded-md"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};
