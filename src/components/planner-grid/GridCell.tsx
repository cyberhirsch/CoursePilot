'use client';

import React, { useState } from 'react';

export type ValidationStatus = 'valid' | 'invalid' | 'neutral';

interface GridCellProps {
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: () => void;
    children: React.ReactNode;
    isHighlighted: boolean;
    heatmapColor?: string;
    tooltip?: string;
    validationStatus: ValidationStatus;
    className?: string;
}

export const GridCell: React.FC<GridCellProps> = ({
    onDrop,
    onDragOver,
    onDragLeave,
    children,
    isHighlighted,
    heatmapColor,
    tooltip,
    validationStatus,
    className,
}) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
        onDragOver(e);
    };

    const handleDragLeave = () => {
        setIsOver(false);
        onDragLeave();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        onDrop(e);
        setIsOver(false);
    };

    const baseClasses = 'p-1 border-t border-r border-border transition-colors duration-200 align-middle';
    let stateClass = '';

    if (isOver) {
        switch (validationStatus) {
            case 'valid':
                stateClass = 'bg-green-900/60';
                break;
            case 'invalid':
                stateClass = 'bg-red-900/60';
                break;
            default:
                stateClass = 'bg-primary/50';
                break;
        }
    } else if (isHighlighted) {
        stateClass = 'bg-teal-900/40';
    }

    const style = stateClass ? {} : heatmapColor ? { backgroundColor: heatmapColor } : {};

    return (
        <td
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`${baseClasses} ${stateClass} ${className}`}
            style={style}
            title={tooltip}
        >
            <div className="flex items-center justify-start space-x-1 w-full h-full min-h-[32px]">
                {children}
            </div>
        </td>
    );
};

export const getHeatmapColor = (count: number): string | undefined => {
    if (count <= 0) return undefined;

    let hue;
    if (count > 22) {
        return 'hsla(300, 80%, 60%, 0.35)'; // Magenta
    }
    if (count >= 20) {
        hue = 120; // Green
    } else if (count >= 10) {
        const percentage = (count - 10) / (20 - 10);
        hue = 60 + percentage * 60; // Yellow to Green
    } else {
        const percentage = (count - 1) / (10 - 1);
        hue = 0 + percentage * 60; // Red to Yellow
    }
    return `hsla(${hue}, 80%, 55%, 0.35)`;
};
