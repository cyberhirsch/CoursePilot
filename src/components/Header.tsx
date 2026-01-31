'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { MainCategory, PlannerViewMode } from '@/types';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import { TRANSLATIONS, DEFAULT_LANGUAGE, type Language } from '@/translations';

interface HeaderProps {
  mainCategory: MainCategory;
  setMainCategory: (category: MainCategory) => void;
  viewMode: PlannerViewMode;
  setViewMode: (mode: PlannerViewMode) => void;
  lang?: Language;
  setLang?: (lang: Language) => void;
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
    className={`block w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${isInactive
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

export const Header: React.FC<HeaderProps> = ({ mainCategory, setMainCategory, viewMode, setViewMode, lang = DEFAULT_LANGUAGE, setLang }) => {
  const t = TRANSLATIONS[lang];
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
    { key: 'semester', label: t.semesterOverview.title },
    { key: 'group', label: t.navigation.semesterPlan },
    { key: 'modules', label: t.moduleOverview?.overview || 'Module Overview' },
    { key: 'optimization', label: t.optimization.title },
  ];

  const examNavItems: { key: PlannerViewMode; label: string }[] = [
    { key: 'exam-transcript', label: t.examinations?.transcript || 'Transcript' },
    { key: 'exam-grading', label: t.examinations?.grading || 'Grading' },
    { key: 'exam-admin', label: t.examinations?.admin || 'Admin' },
    { key: 'exam-schedule', label: t.examinations?.schedule || 'Schedule' },
  ];

  const moduleNavItems: { key: PlannerViewMode; label: string }[] = [
    { key: 'module-details', label: t.moduleOverview?.moduleSheet || 'Modulsheet' },
    { key: 'modules', label: t.moduleOverview?.overview || 'Module Overview' },
  ];

  const lecturerNavItems: { key: PlannerViewMode; label: string }[] = [
    { key: 'lecturer-overview', label: t.lecturers?.overview || 'Lecturer Overview' },
    { key: 'availability', label: t.lecturers?.availability || 'Availability' },
  ];

  const roomNavItems: { key: PlannerViewMode; label: string }[] = [
    { key: 'room-overview', label: t.rooms?.overview || 'Room Overview' },
    { key: 'room-occupancy', label: t.rooms?.occupancy || 'Room Occupancy' },
    { key: 'room-availability', label: t.rooms?.availability || 'Availability' },
  ];

  const userNavItems: { key: PlannerViewMode; label: string }[] = [
    { key: 'user-profile', label: t.userManagement?.profile || 'Profile' },
    { key: 'user-groups', label: t.userManagement?.groups || 'User Groups' },
  ];

  const settingsNavItems: { key: PlannerViewMode; label: string }[] = [
    { key: 'settings-general', label: t.settings?.general || 'General' },
    { key: 'settings-calendar', label: t.settings?.calendar || 'Calendar' },
    { key: 'settings-variables', label: t.settings?.variables || 'Variables' },
  ];

  const mainNavItems: ({ key: MainCategory; label: string; inactive?: boolean } | { type: 'divider' })[] = [
    { key: 'semester-plan', label: t.navigation.semesterPlan },
    { key: 'schedule', label: t.navigation.schedule, inactive: true },
    { key: 'examinations', label: t.navigation.examinations },
    { key: 'modules', label: t.navigation.modules },
    { key: 'lecturers', label: t.navigation.lecturers },
    { key: 'rooms', label: t.navigation.rooms },
    { type: 'divider' },
    { key: 'user-management', label: t.navigation.userManagement },
    { key: 'settings', label: t.navigation.settings },
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
                            if (key === 'modules') {
                              setViewMode('module-details');
                            } else if (key === 'semester-plan') {
                              setViewMode('semester');
                            } else if (key === 'examinations') {
                              setViewMode('exam-transcript');
                            } else if (key === 'lecturers') {
                              setViewMode('lecturer-overview');
                            } else if (key === 'rooms') {
                              setViewMode('room-overview');
                            } else if (key === 'user-management') {
                              setViewMode('user-profile');
                            } else if (key === 'settings') {
                              setViewMode('settings-general');
                            }
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

        {mainCategory === 'semester-plan' && (
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

        {mainCategory === 'examinations' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center p-1 bg-muted rounded-lg">
              {examNavItems.map(item => (
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

        {mainCategory === 'modules' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center p-1 bg-muted rounded-lg">
              {moduleNavItems.map(item => (
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

        {mainCategory === 'lecturers' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center p-1 bg-muted rounded-lg">
              {lecturerNavItems.map(item => (
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

        {mainCategory === 'rooms' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center p-1 bg-muted rounded-lg">
              {roomNavItems.map(item => (
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

        {mainCategory === 'user-management' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center p-1 bg-muted rounded-lg">
              {userNavItems.map(item => (
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

        {mainCategory === 'settings' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center p-1 bg-muted rounded-lg">
              {settingsNavItems.map(item => (
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
          <Button variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
          <button
            onClick={() => setLang && setLang(lang === 'de' ? 'en' : 'de')}
            className="flex items-center justify-center px-3 py-1 bg-muted rounded-md hover:bg-muted/80 transition-colors text-sm font-medium w-16"
          >
            <span>{lang === 'de' ? 'DE' : 'EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
