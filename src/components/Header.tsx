'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { MainCategory, PlannerViewMode } from '@/types';
import { ResetIcon } from '@/components/icons/ResetIcon';

interface HeaderProps {
    mainCategory: MainCategory;
    setMainCategory: (category: MainCategory) => void;
    viewMode: PlannerViewMode;
    setViewMode: (mode: PlannerViewMode) => void;
    onResetData: () => void;
}

const NavLink: React.FC<{
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  isInactive?: boolean;
  isCurrent?: boolean;
}> = ({ href = "#", onClick, children, isInactive = false, isCurrent = false }) => (
  <a
    href={isInactive ? undefined : href}
    onClick={onClick}
    className={`block w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${
      isInactive
        ? 'text-muted-foreground/50 cursor-not-allowed'
        : isCurrent
        ? 'font-semibold text-primary-foreground bg-primary/80'
        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
    }`}
    role="menuitem"
    aria-disabled={isInactive}
    aria-current={isCurrent ? 'page' : undefined}
  >
    {children}
  </a>
);

export const Header: React.FC<HeaderProps> = ({ mainCategory, setMainCategory, viewMode, setViewMode, onResetData }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const plannerNavItems: { key: PlannerViewMode; label: string }[] = [
    { key: 'semester', label: 'Semesterübersicht' },
    { key: 'group', label: 'Studienverlaufsplan' },
    { key: 'modules', label: 'Modulübersicht' },
    { key: 'templates', label: 'Vorlagen' },
    { key: 'optimization', label: 'Optimierung' },
  ];

  const mainNavItems: ({ key: MainCategory; label: string; inactive?: boolean } | { type: 'divider' })[] = [
    { key: 'semesterplan', label: 'Semesterplan' },
    { key: 'stundenplan', label: 'Stundenplan', inactive: true },
    { key: 'pruefungswesen', label: 'Prüfungswesen', inactive: true },
    { type: 'divider' },
    { key: 'nutzerverwaltung', label: 'Nutzerverwaltung', inactive: true },
    { key: 'einstellungen', label: 'Einstellungen', inactive: true },
  ];
  
  const mainCategoryItem = mainNavItems.find(item => 'key' in item && item.key === mainCategory);
  const currentMainCategoryLabel = mainCategoryItem && 'key' in mainCategoryItem ? mainCategoryItem.label : '';
  const headerTitle = currentMainCategoryLabel;

  return (
    <header className="bg-background border-b border-border w-full z-30 sticky top-0">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div ref={dropdownRef} className="relative">
            <button onClick={() => setIsDropdownOpen(prev => !prev)} className="flex items-center space-x-3 focus:outline-none">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-foreground">
                CoursePilot
                {headerTitle && <span className="text-muted-foreground font-normal"> / {headerTitle}</span>}
              </h1>
              <svg className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isDropdownOpen && (
              <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-lg shadow-xl bg-card ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical">
                <div className="p-1" role="none">
                  {mainNavItems.map((item, index) => {
                    if ('type' in item && item.type === 'divider') {
                      return <div key={`divider-${index}`} className="border-t border-border my-1"></div>;
                    }
                    
                    if ('key' in item) {
                      const { key, label, inactive } = item;
                      
                      return (
                        <NavLink
                          key={key}
                          onClick={() => {
                            setMainCategory(key);
                            setIsDropdownOpen(false);
                          }}
                          isInactive={inactive}
                          isCurrent={key === mainCategory}
                        >
                          {label}
                        </NavLink>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {mainCategory === 'semesterplan' && (
            <div className="flex items-center space-x-4">
                <div className="flex items-center p-1 bg-muted rounded-lg">
                    {plannerNavItems.map(item => (
                       <button 
                            key={item.key}
                            onClick={() => setViewMode(item.key)}
                            className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === item.key ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-accent/50'}`}>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Standort: Köln</span>
            <button
                onClick={onResetData}
                className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Alle Daten zurücksetzen und neu laden"
                aria-label="Alle Daten zurücksetzen"
            >
                <ResetIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </header>
  );
};
