
'use client';

import React from 'react';
import type { Module } from '@/types';
import { LockIcon } from '@/components/icons/LockIcon';
import { UnlockIcon } from '@/components/icons/UnlockIcon';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

interface ModuleCardProps {
  module: Module;
  instanceId: string;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, moduleId: string, instanceId: string) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDraggable?: boolean;
  hasError?: boolean;
  errorTooltip?: string;
  isLocked?: boolean;
  onToggleLock?: (instanceId: string) => void;
  lang?: keyof typeof TRANSLATIONS;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, instanceId, onDragStart, onDragEnd, isDraggable = false, hasError = false, errorTooltip, isLocked = false, onToggleLock, lang = DEFAULT_LANGUAGE }) => {
  const t = TRANSLATIONS[lang];

  const canBeDragged = isDraggable && !isLocked;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragStart && canBeDragged) {
      e.dataTransfer.setData("moduleId", module.id);
      e.dataTransfer.setData("instanceId", instanceId);
      e.dataTransfer.effectAllowed = "move";
      onDragStart(e, module.id, instanceId);
    }
  };

  const sws = module.sws;
  const cardTitle = errorTooltip || `${module.name} - ${sws} SWS`;
  const baseClasses = `w-full h-full flex items-center justify-center rounded transition-colors relative ${canBeDragged ? 'cursor-grab active:cursor-grabbing' : ''} ${isLocked ? 'cursor-not-allowed' : ''}`;

  const colorClasses = hasError
    ? 'bg-destructive/20 text-destructive-foreground border border-destructive/60'
    : isLocked
      ? 'bg-muted/30 text-muted-foreground border border-border/50'
      : 'bg-primary/20 text-primary-foreground border border-primary/40';

  return (
    <div
      id={instanceId}
      draggable={canBeDragged}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`${baseClasses} ${colorClasses}`}
      title={cardTitle}
    >
      <div className="font-bold text-xs">{sws}</div>
      {hasError && (
        <div className="absolute top-0 right-0 -mt-1 -mr-1" aria-label={t.planner.placementError}>
          <svg className="w-4 h-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      {onToggleLock && (
        <button
          onClick={() => onToggleLock(instanceId)}
          className="absolute bottom-0 right-0 p-0.5 rounded-full bg-background/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-opacity"
          aria-label={isLocked ? t.planner.unlock : t.planner.lock}
          title={isLocked ? t.planner.unlock : t.planner.lock}
        >
          {isLocked ? <LockIcon className="w-3 h-3" /> : <UnlockIcon className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
};
