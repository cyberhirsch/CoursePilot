'use client';

import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { TRANSLATIONS, DEFAULT_LANGUAGE } from '@/translations';

interface OptimizationPanelProps {
    lang?: keyof typeof TRANSLATIONS;
}

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({ lang = DEFAULT_LANGUAGE }) => {
    const t = TRANSLATIONS[lang];

    return <PlaceholderPage title={t.optimization.title} />;
};
