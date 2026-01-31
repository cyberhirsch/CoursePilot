'use client';

import React from 'react';
import type { Program } from '@/types';

interface ProgramSelectorProps {
    programs: Program[];
    selectedProgramIds: string[];
    onChange: (programId: string, checked: boolean) => void;
}

export const ProgramSelector: React.FC<ProgramSelectorProps> = ({
    programs,
    selectedProgramIds,
    onChange,
}) => (
    <div className="flex flex-wrap gap-x-3 gap-y-1 items-center justify-start">
        {programs.map((p) => (
            <label
                key={p.id}
                className="flex items-center space-x-1 cursor-pointer text-foreground hover:text-white"
            >
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
