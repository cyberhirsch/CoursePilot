
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { PlannerBoard } from '@/components/PlannerBoard';
import type { Plan, Module, Program, Studiengruppe, AbsoluteSemester, ProgramPlan, MainCategory, PlannerViewMode, Category } from '@/types';
import { ABSOLUTE_SEMESTERS, RELATIVE_SEMESTERS, getAbsoluteSemesterFor } from '@/constants';
import { LoadingSpinner } from '@/components/icons/LoadingSpinner';

async function fetchData() {
    const res = await fetch('/api/data');
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
}

async function postData(data: any) {
    await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

// Helper to determine the real current semester based on today's date
const getRealCurrentSemester = (): AbsoluteSemester | undefined => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    // SS: April (3) to September (8) | WS: October (9) to March (2)
    const isSS = month >= 3 && month <= 8;
    
    return ABSOLUTE_SEMESTERS.find(s => {
        if (isSS) {
            return s.type === 'SS' && s.year === year;
        } else {
            // WS spans two years, e.g., WS 2023/24 starts in Oct 2023
            const startYear = month >= 9 ? year : year - 1;
            return s.type === 'WS' && s.year === startYear;
        }
    });
};


export default function CoursePilotClient() {
  const [isMounted, setIsMounted] = useState(false);

  const [modules, setModules] = useState<Module[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [studiengruppen, setStudiengruppen] = useState<Studiengruppe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    fetchData().then(data => {
        setModules(data.modules);
        setPrograms(data.programs);
        setStudiengruppen(data.studiengruppen);
        setCategories(data.categories);
        setIsMounted(true);
    }).catch(e => {
        console.error("Failed to load from backend", e);
        setIsMounted(true); 
    });
  }, []);

  const fullData = useMemo(() => ({ modules, programs, studiengruppen, categories }), [modules, programs, studiengruppen, categories]);

  useEffect(() => {
    if (isMounted) {
        const handler = setTimeout(() => {
            if (fullData.modules.length > 0) {
                postData(fullData);
            }
        }, 1000); 

        return () => {
            clearTimeout(handler);
        };
    }
  }, [fullData, isMounted]);

  
  const [activeStudiengruppenIds, setActiveStudiengruppenIds] = useState<string[]>([]);
  
  const [mainCategory, setMainCategory] = useState<MainCategory>('semesterplan');
  const [viewMode, setViewModeInternal] = useState<PlannerViewMode>('semester');
  const [selectedSemester, setSelectedSemester] = useState<AbsoluteSemester>(ABSOLUTE_SEMESTERS.find(s => s.id === 'ws2025') || ABSOLUTE_SEMESTERS[1]);
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false);

  const [activeBulkLocks, setActiveBulkLocks] = useState<{ [groupId: string]: { past: boolean; categories: Set<string> } }>({});


  const setViewMode = (mode: PlannerViewMode) => {
    if (mode === 'group' && activeStudiengruppenIds.length === 0 && studiengruppen.length > 0) {
      setActiveStudiengruppenIds([studiengruppen[0].id]);
    }
    setViewModeInternal(mode);
  };

  const handleToggleHeatmap = useCallback(() => {
    setIsHeatmapVisible(prev => !prev);
  }, []);

  const handleToggleModuleLock = useCallback((studiengruppeId: string, instanceId: string) => {
    setStudiengruppen(prev => prev.map(sg => {
        if (sg.id === studiengruppeId) {
            const currentLocks = sg.userLockedModules || [];
            const isLocked = currentLocks.includes(instanceId);
            const newLocks = isLocked
                ? currentLocks.filter(id => id !== instanceId)
                : [...currentLocks, instanceId];
            return { ...sg, userLockedModules: newLocks };
        }
        return sg;
    }));
  }, []);
  
  const handleTogglePastLock = useCallback((studiengruppeId: string) => {
      setActiveBulkLocks(prev => {
          const groupLocks = prev[studiengruppeId] || { past: false, categories: new Set() };
          return {
              ...prev,
              [studiengruppeId]: { ...groupLocks, past: !groupLocks.past }
          };
      });
  }, []);

  const handleToggleCategoryLock = useCallback((studiengruppeId: string, category: string) => {
      setActiveBulkLocks(prev => {
          const groupLocks = prev[studiengruppeId] || { past: false, categories: new Set() };
          const newCategories = new Set(groupLocks.categories);
          if (newCategories.has(category)) {
              newCategories.delete(category);
          } else {
              newCategories.add(category);
          }
          return {
              ...prev,
              [studiengruppeId]: { ...groupLocks, categories: newCategories }
          };
      });
  }, []);


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, moduleId: string, instanceId?: string) => {
    e.dataTransfer.setData("moduleId", moduleId);
    e.dataTransfer.setData("instanceId", instanceId || moduleId);
  };

  const getModuleById = useCallback((id: string): Module | undefined => {
    const directMatch = modules.find(m => m.id === id);
    if (directMatch) {
      return directMatch;
    }
    return modules.find(m => m.type === 'Pool' && id.startsWith(m.id + '-'));
  }, [modules]);

  const finalLockedModulesMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const realCurrentSemester = getRealCurrentSemester();
    const realCurrentSemesterIndex = realCurrentSemester 
        ? ABSOLUTE_SEMESTERS.findIndex(s => s.id === realCurrentSemester.id)
        : -1;

    studiengruppen.forEach(sg => {
        const finalLocks = new Set(sg.userLockedModules || []);
        const bulkSettings = activeBulkLocks[sg.id];

        if (bulkSettings) {
            const allModulesInCategory = (category: string) => 
                modules.filter(m => m.category === category).map(m => m.id);

            const allInstancesInPlan = Object.values(sg.plan.semesters).flat();

            if (bulkSettings.past && realCurrentSemesterIndex !== -1) {
                Object.entries(sg.plan.semesters).forEach(([relativeSemId, instanceIds]) => {
                    const relativeIndex = RELATIVE_SEMESTERS.findIndex(s => s.id === relativeSemId);
                    const absoluteSem = getAbsoluteSemesterFor(sg.startSemester, relativeIndex);
                    if (absoluteSem && ABSOLUTE_SEMESTERS.findIndex(s => s.id === absoluteSem.id) <= realCurrentSemesterIndex) {
                        (instanceIds as string[]).forEach(id => finalLocks.add(id));
                    }
                });
            }

            bulkSettings.categories.forEach(category => {
                const moduleIdsInCategory = allModulesInCategory(category);
                allInstancesInPlan.forEach(instanceId => {
                    const module = getModuleById(instanceId as string);
                    if (module && moduleIdsInCategory.includes(module.id)) {
                        finalLocks.add(instanceId as string);
                    }
                });
            });
        }
        map.set(sg.id, finalLocks);
    });
    return map;
}, [studiengruppen, activeBulkLocks, modules, getModuleById]);


  const handleDrop = useCallback((studiengruppeId: string, semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedInstanceId = e.dataTransfer.getData("instanceId");
    const draggedModuleId = e.dataTransfer.getData("moduleId");

    const draggedModule = getModuleById(draggedInstanceId);
    const isPoolDrop = !!draggedModule && draggedModule.type === 'Pool' && draggedModule.id === targetModuleId;
    
    if (!draggedInstanceId || !(draggedInstanceId === targetModuleId || isPoolDrop)) {
      return;
    }
    
    const gruppe = studiengruppen.find(g => g.id === studiengruppeId);
    if (!gruppe) return;

    const dropModule = getModuleById(draggedModuleId);
    if (dropModule) {
      const relativeSemesterIndex = RELATIVE_SEMESTERS.findIndex(s => s.id === semesterId) + 1;
      
      if (dropModule.forbiddenSemesters?.includes(relativeSemesterIndex)) {
          alert(`Regelverletzung: Modul "${dropModule.name}" darf nicht im ${relativeSemesterIndex}. Fachsemester platziert werden.`);
          return;
      }

      if (dropModule.prerequisites && dropModule.prerequisites.length > 0) {
          const planSemesters = gruppe.plan.semesters;
          const targetSemesterOrder = RELATIVE_SEMESTERS.findIndex(s => s.id === semesterId);

          for (const prereqId of dropModule.prerequisites) {
              let prereqFound = false;
              let prereqSemesterOrder = -1;
              
              for (const [semId, moduleIds] of Object.entries(planSemesters)) {
                if ((moduleIds as string[]).filter(id => id !== draggedInstanceId).includes(prereqId)) {
                  prereqFound = true;
                  prereqSemesterOrder = RELATIVE_SEMESTERS.findIndex(s => s.id === semId);
                  break;
                }
              }

              if (!prereqFound || prereqSemesterOrder >= targetSemesterOrder) {
                  const prereqModule = getModuleById(prereqId);
                  alert(`Abhängigkeit verletzt: "${dropModule.name}" erfordert, dass "${prereqModule?.name || prereqId}" vorher abgeschlossen wird.`);
                  return;
              }
          }
      }
    }

    if (draggedModule?.type === 'Pool') {
      const targetSemesterModuleIds = gruppe.plan.semesters[semesterId] || [];
      const hasDuplicatePoolModule = targetSemesterModuleIds.some(existingInstanceId => {
        if (existingInstanceId === draggedInstanceId) return false;
        
        const existingBaseModule = getModuleById(existingInstanceId);
        return existingBaseModule?.id === draggedModuleId;
      });

      if (hasDuplicatePoolModule) {
        console.warn(`Cannot add ${draggedInstanceId}. A module from the pool ${draggedModuleId} is already in this semester.`);
        return;
      }
    }
    
    setStudiengruppen(prevGruppen => 
      prevGruppen.map(g => {
        if (g.id === studiengruppeId) {
          const newPlan = { ...g.plan };
          const newSemesters: { [key: string]: string[] } = { ...newPlan.semesters };
          
          Object.keys(newSemesters).forEach(key => {
            newSemesters[key] = newSemesters[key].filter(id => id !== draggedInstanceId);
          });

          newSemesters[semesterId] = [...(newSemesters[semesterId] || []), draggedInstanceId];

          return { ...g, plan: { ...g.plan, semesters: newSemesters } };
        }
        return g;
      })
    );
  }, [getModuleById, studiengruppen]);

  const handleUpdateStudiengruppe = useCallback((studiengruppeId: string, updates: Partial<Studiengruppe>) => {
    setStudiengruppen(prevGruppen =>
      prevGruppen.map(gruppe =>
        gruppe.id === studiengruppeId ? { ...gruppe, ...updates } : gruppe
      )
    );
  }, []);

  const handleUpdateModule = useCallback((moduleId: string, field: keyof Module, value: any) => {
    setModules(prevModules => prevModules.map(m => 
      m.id === moduleId ? {...m, [field]: value} : m
    ));
  }, []);

  const handleAddModule = useCallback((newModule: Module, programIds: string[]) => {
    if (modules.some(m => m.id === newModule.id)) {
      alert(`Ein Modul mit der ID "${newModule.id}" existiert bereits.`);
      return;
    }
    setModules(prevModules => [newModule, ...prevModules]);
    
    setPrograms(prevPrograms => 
      prevPrograms.map(p => {
        if (programIds.includes(p.id)) {
          return { ...p, moduleIds: [...p.moduleIds, newModule.id] };
        }
        return p;
      })
    );
  }, [modules]);
  
  const handleDeleteModule = useCallback((moduleIdToDelete: string) => {
    setModules(prev => prev.filter(m => m.id !== moduleIdToDelete));
    
    setPrograms(prev => prev.map(p => ({
      ...p,
      moduleIds: p.moduleIds.filter(id => id !== moduleIdToDelete)
    })));

    setStudiengruppen(prev => prev.map(sg => {
      const newPlan = { ...sg.plan };
      const newSemesters: {[key: string]: string[]} = { ...newPlan.semesters };
      Object.keys(newSemesters).forEach(semId => {
        newSemesters[semId] = newSemesters[semId].filter(instanceId => {
           return instanceId !== moduleIdToDelete && !instanceId.startsWith(`${moduleIdToDelete}-`);
        });
      });
      return { ...sg, plan: { ...sg.plan, semesters: newSemesters } };
    }));

  }, []);

  const handleUpdateProgram = useCallback((programId: string, updates: Partial<Program>) => {
      setPrograms(prevPrograms => prevPrograms.map(p =>
          p.id === programId ? { ...p, ...updates } : p
      ));
  }, []);

  const getProgramById = useCallback((id: string): Program | undefined => {
    return programs.find(p => p.id === id);
  }, [programs]);

  const handleAddCategory = useCallback((newCategory: Category) => {
    if (categories.some(c => c.id === newCategory.id || c.name === newCategory.name)) {
        alert(`Eine Kategorie mit dieser ID oder diesem Namen existiert bereits.`);
        return;
    }
    setCategories(prev => [...prev, newCategory]);
  }, [categories]);

  const handleUpdateCategory = useCallback((categoryId: string, updates: Partial<Category>) => {
    let oldName = '';
    const updatedCategories = categories.map(c => {
        if (c.id === categoryId) {
            oldName = c.name;
            return { ...c, ...updates };
        }
        return c;
    });
    setCategories(updatedCategories);

    if (oldName && updates.name && oldName !== updates.name) {
        setModules(prevModules =>
            prevModules.map(m =>
                m.category === oldName ? { ...m, category: updates.name! } : m
            )
        );
    }
  }, [categories]);

  const handleDeleteCategory = useCallback((categoryId: string) => {
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;

    if (modules.some(m => m.category === categoryToDelete.name)) {
        alert(`Die Kategorie "${categoryToDelete.name}" kann nicht gelöscht werden, da sie noch von Modulen verwendet wird.`);
        return;
    }

    if (window.confirm(`Möchten Sie die Kategorie "${categoryToDelete.name}" wirklich löschen?`)) {
        setCategories(prev => prev.filter(c => c.id !== categoryId));
    }
  }, [categories, modules]);

  const handleAddStudiengruppe = useCallback((newStudiengruppe: Studiengruppe, saveAsTemplate: boolean) => {
    if (studiengruppen.some(sg => sg.id === newStudiengruppe.id)) {
      alert(`Eine Studiengruppe mit der ID "${newStudiengruppe.id}" existiert bereits.`);
      return false;
    }
    
    setStudiengruppen(prev => [...prev, newStudiengruppe]);
    setActiveStudiengruppenIds([newStudiengruppe.id]);

    if (saveAsTemplate) {
        handleUpdateProgram(newStudiengruppe.programId, { templatePlan: newStudiengruppe.plan });
    }

    return true;
  }, [studiengruppen, handleUpdateProgram]);

  const activeStudiengruppen = useMemo(() => {
    return studiengruppen.filter(sg => activeStudiengruppenIds.includes(sg.id));
  }, [studiengruppen, activeStudiengruppenIds]);

  const handleSelectGroup = (studiengruppeId: string) => {
    setViewMode('group');
    setActiveStudiengruppenIds([studiengruppeId]);
  };
  
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner className="w-12 h-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        mainCategory={mainCategory}
        setMainCategory={setMainCategory}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <main className="flex-grow p-4">
        <PlannerBoard
          mainCategory={mainCategory}
          viewMode={viewMode}
          onDrop={handleDrop} 
          getModuleById={getModuleById}
          getProgramById={getProgramById}
          onDragStart={handleDragStart}
          studiengruppen={studiengruppen}
          activeStudiengruppen={activeStudiengruppen}
          selectedSemester={selectedSemester}
          setSelectedSemester={setSelectedSemester}
          semesters={ABSOLUTE_SEMESTERS}
          onSelectGroup={handleSelectGroup}
          onUpdateStudiengruppe={handleUpdateStudiengruppe}
          modules={modules}
          programs={programs}
          onUpdateModule={handleUpdateModule}
          onAddModule={handleAddModule}
          onDeleteModule={handleDeleteModule}
          isHeatmapVisible={isHeatmapVisible}
          onToggleHeatmap={handleToggleHeatmap}
          onToggleModuleLock={handleToggleModuleLock}
          onTogglePastLock={handleTogglePastLock}
          onToggleCategoryLock={handleToggleCategoryLock}
          activeBulkLocks={activeBulkLocks}
          finalLockedModulesMap={finalLockedModulesMap}
          categories={categories}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddStudiengruppe={handleAddStudiengruppe}
          onUpdateProgram={handleUpdateProgram}
        />
      </main>
    </div>
  );
};
