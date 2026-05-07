
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { PlannerBoard } from '@/components/PlannerBoard';
import { DEFAULT_LANGUAGE, type Language } from '@/translations';
import type { Plan, Module, Program, Cohort, AbsoluteSemester, ProgramPlan, MainCategory, PlannerViewMode, Category, Catalogs, User, Room, SystemSettings, AcademicCalendar, RoomAssignment, LecturerAvailability, SchedulePlan } from '@/types';
import { RELATIVE_SEMESTERS, getAbsoluteSemesterFor } from '@/constants';
import { LoadingSpinner } from '@/components/icons/LoadingSpinner';
import { reconcileScheduleAfterAssignmentChange } from '@/lib/schedule-optimizer';

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
const getRealCurrentSemester = (semesters: AbsoluteSemester[]): AbsoluteSemester | undefined => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // SS: April (3) to September (8) | WS: October (9) to March (2)
  const isSS = month >= 3 && month <= 8;

  return semesters.find(s => {
    if (isSS) {
      return s.type === 'SS' && s.year === year;
    } else {
      // WS spans two years, e.g., WS 2023/24 starts in Oct 2023
      const startYear = month >= 9 ? year : year - 1;
      return s.type === 'WS' && s.year === startYear;
    }
  });
};

const getSemesterOrder = (semester: AbsoluteSemester): number => {
  return semester.year * 2 + (semester.type === 'WS' ? 1 : 0);
};

const getDefaultFutureSemester = (
  semesters: AbsoluteSemester[],
  now = new Date()
): AbsoluteSemester | undefined => {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  const isSummerSemester = month >= 3 && month <= 8;
  const targetType: AbsoluteSemester['type'] = isSummerSemester ? 'WS' : 'SS';
  const targetYear = isSummerSemester
    ? year
    : month >= 9
      ? year + 1
      : year;

  const exactMatch = semesters.find(semester =>
    semester.type === targetType && semester.year === targetYear
  );
  if (exactMatch) return exactMatch;

  const sortedSemesters = [...semesters].sort((a, b) => getSemesterOrder(a) - getSemesterOrder(b));
  const targetOrder = targetYear * 2 + (targetType === 'WS' ? 1 : 0);
  return sortedSemesters.find(semester => getSemesterOrder(semester) >= targetOrder)
    || sortedSemesters[sortedSemesters.length - 1];
};


export default function CoursePilotClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [lang, setLang] = useState<Language>(DEFAULT_LANGUAGE);

  const [modules, setModules] = useState<Module[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogs, setCatalogs] = useState<Catalogs>({ examTypes: [], teachingMethods: [], languages: [] });
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | undefined>(undefined);
  const [academicCalendar, setAcademicCalendar] = useState<AcademicCalendar | undefined>(undefined);
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignment[]>([]);
  const [lecturerAvailabilities, setLecturerAvailabilities] = useState<LecturerAvailability[]>([]);
  const [schedulePlan, setSchedulePlan] = useState<SchedulePlan | null>(null);

  useEffect(() => {
    fetchData().then(data => {
      setModules(data.modules);
      setPrograms(data.programs);
      setCohorts(data.cohorts);
      setCategories(data.categories);
      if (data.catalogs) setCatalogs(data.catalogs);
      if (data.users) setUsers(data.users);
      if (data.rooms) setRooms(data.rooms);
      if (data.systemSettings) setSystemSettings(data.systemSettings);
      if (data.academicCalendar) setAcademicCalendar(data.academicCalendar);
      if (data.roomAssignments) setRoomAssignments(data.roomAssignments);
      if (data.lecturerAvailabilities) setLecturerAvailabilities(data.lecturerAvailabilities);
      if (typeof data.schedulePlan !== 'undefined') setSchedulePlan(data.schedulePlan);
      setIsMounted(true);
    }).catch(e => {
      console.error("Failed to load from backend", e);
      setIsMounted(true);
    });
  }, []);

  const fullData = useMemo(() => ({ modules, programs, cohorts, categories, catalogs, users, rooms, roomAssignments, systemSettings, academicCalendar, lecturerAvailabilities, schedulePlan }), [modules, programs, cohorts, categories, catalogs, users, rooms, roomAssignments, systemSettings, academicCalendar, lecturerAvailabilities, schedulePlan]);

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


  const [activeCohortIds, setActiveCohortIds] = useState<string[]>([]);

  const [mainCategory, setMainCategory] = useState<MainCategory>('semester-plan');
  const [viewMode, setViewModeInternal] = useState<PlannerViewMode>('semester');
  const [selectedSemester, setSelectedSemester] = useState<AbsoluteSemester | undefined>(undefined);

  // Set default selected semester once academic calendar is loaded
  useEffect(() => {
    if (academicCalendar && !selectedSemester) {
      const defaultSem = getDefaultFutureSemester(academicCalendar.semesters) || academicCalendar.semesters[0];
      if (defaultSem) setSelectedSemester(defaultSem);
    }
  }, [academicCalendar, selectedSemester]);

  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false);

  const [activeBulkLocks, setActiveBulkLocks] = useState<{ [groupId: string]: { past: boolean; categories: Set<string> } }>({});


  const setViewMode = (mode: PlannerViewMode) => {
    if (mode === 'group' && activeCohortIds.length === 0 && cohorts.length > 0) {
      setActiveCohortIds([cohorts[0].id]);
    }
    setViewModeInternal(mode);
  };

  const handleToggleHeatmap = useCallback(() => {
    setIsHeatmapVisible(prev => !prev);
  }, []);

  const handleToggleModuleLock = useCallback((cohortId: string, instanceId: string) => {
    setCohorts(prev => prev.map(sg => {
      if (sg.id === cohortId) {
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

  const handleTogglePastLock = useCallback((cohortId: string) => {
    setActiveBulkLocks(prev => {
      const groupLocks = prev[cohortId] || { past: false, categories: new Set() };
      return {
        ...prev,
        [cohortId]: { ...groupLocks, past: !groupLocks.past }
      };
    });
  }, []);

  const handleToggleCategoryLock = useCallback((cohortId: string, category: string) => {
    setActiveBulkLocks(prev => {
      const groupLocks = prev[cohortId] || { past: false, categories: new Set() };
      const newCategories = new Set(groupLocks.categories);
      if (newCategories.has(category)) {
        newCategories.delete(category);
      } else {
        newCategories.add(category);
      }
      return {
        ...prev,
        [cohortId]: { ...groupLocks, categories: newCategories }
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
    // Handle pool module instances like 'WP1-8-1'
    const poolBaseId = id.substring(0, id.lastIndexOf('-'));
    return modules.find(m => m.id === poolBaseId && m.type === 'Pool');
  }, [modules]);

  const finalLockedModulesMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!academicCalendar) return map;

    const semesters = academicCalendar.semesters;
    const realCurrentSemester = getRealCurrentSemester(semesters);
    const realCurrentSemesterIndex = realCurrentSemester
      ? semesters.findIndex(s => s.id === realCurrentSemester.id)
      : -1;

    cohorts.forEach(sg => {
      const finalLocks = new Set(sg.userLockedModules || []);
      const bulkSettings = activeBulkLocks[sg.id];

      if (bulkSettings) {
        const allModulesInCategory = (category: string) =>
          modules.filter(m => m.category === category).map(m => m.id);

        const allInstancesInPlan = Object.values(sg.plan.semesters).flat();

        if (bulkSettings.past && realCurrentSemesterIndex !== -1) {
          Object.entries(sg.plan.semesters).forEach(([relativeSemId, instanceIds]) => {
            const relativeIndex = RELATIVE_SEMESTERS.findIndex(s => s.id === relativeSemId);
            if (relativeIndex === -1) return;
            const absoluteSem = getAbsoluteSemesterFor(semesters, sg.startSemester, relativeIndex);
            if (absoluteSem && semesters.findIndex(s => s.id === absoluteSem.id) <= realCurrentSemesterIndex) {
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
  }, [cohorts, activeBulkLocks, modules, getModuleById, academicCalendar]);


  const handleDrop = useCallback((cohortId: string, semesterId: string, targetModuleId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedInstanceId = e.dataTransfer.getData("instanceId");
    const draggedModuleId = e.dataTransfer.getData("moduleId");

    if (!draggedInstanceId || !draggedModuleId) {
      console.error("Missing data from drag operation.");
      return;
    }

    if (draggedModuleId !== targetModuleId) {
      return;
    }

    const draggedModule = getModuleById(draggedInstanceId);
    if (!draggedModule) {
      console.error(`Could not find module for instanceId: ${draggedInstanceId}`);
      return;
    }

    const cohortInstance = cohorts.find(g => g.id === cohortId);
    if (!cohortInstance) return;

    const relativeSemesterIndex = RELATIVE_SEMESTERS.findIndex(s => s.id === semesterId) + 1;

    if (draggedModule.forbiddenSemesters?.includes(relativeSemesterIndex)) {
      alert(`Regelverletzung: Modul "${draggedModule.name}" darf nicht im ${relativeSemesterIndex}. Fachsemester platziert werden.`);
      return;
    }

    if (draggedModule.prerequisites && draggedModule.prerequisites.length > 0) {
      const planSemesters = cohortInstance.plan.semesters;
      const targetSemesterOrder = RELATIVE_SEMESTERS.findIndex(s => s.id === semesterId);

      for (const prereqId of draggedModule.prerequisites) {
        let prereqFound = false;
        let prereqSemesterOrder = -1;

        for (const [semId, moduleIds] of Object.entries(planSemesters)) {
          if ((moduleIds as string[]).filter(id => id !== draggedInstanceId).some(id => getModuleById(id)?.id === prereqId)) {
            prereqFound = true;
            prereqSemesterOrder = RELATIVE_SEMESTERS.findIndex(s => s.id === semId);
            break;
          }
        }

        if (!prereqFound || prereqSemesterOrder >= targetSemesterOrder) {
          const prereqModule = getModuleById(prereqId);
          alert(`Abhängigkeit verletzt: "${draggedModule.name}" erfordert, dass "${prereqModule?.name || prereqId}" vorher abgeschlossen wird.`);
          return;
        }
      }
    }

    if (draggedModule.type === 'Pool') {
      const targetSemesterModuleIds = cohortInstance.plan.semesters[semesterId] || [];
      const hasDuplicatePoolModule = targetSemesterModuleIds.some(existingInstanceId => {
        if (existingInstanceId === draggedInstanceId) return false;

        const existingBaseModule = getModuleById(existingInstanceId);
        return existingBaseModule?.id === draggedModule.id;
      });

      if (hasDuplicatePoolModule) {
        console.warn(`Cannot add ${draggedInstanceId}. A module from the pool ${draggedModule.id} is already in this semester.`);
        return;
      }
    }

    setCohorts(prevGruppen =>
      prevGruppen.map(g => {
        if (g.id === cohortId) {
          const newPlan = { ...g.plan };
          const newSemesters: { [key: string]: string[] } = JSON.parse(JSON.stringify(newPlan.semesters));

          Object.keys(newSemesters).forEach(key => {
            newSemesters[key] = newSemesters[key].filter(id => id !== draggedInstanceId);
          });

          if (!newSemesters[semesterId]) {
            newSemesters[semesterId] = [];
          }
          newSemesters[semesterId].push(draggedInstanceId);

          return { ...g, plan: { ...g.plan, semesters: newSemesters } };
        }
        return g;
      })
    );
  }, [getModuleById, cohorts]);

  const handleUpdateCohort = useCallback((cohortId: string, updates: Partial<Cohort>) => {
    setCohorts(prevGruppen =>
      prevGruppen.map(gruppe =>
        gruppe.id === cohortId ? { ...gruppe, ...updates } : gruppe
      )
    );
  }, []);

  const handleUpdateModule = useCallback((moduleId: string, field: keyof Module, value: any) => {
    setModules(prevModules => prevModules.map(m =>
      m.id === moduleId ? { ...m, [field]: value } : m
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

    setCohorts(prev => prev.map(sg => {
      const newPlan = { ...sg.plan };
      const newSemesters: { [key: string]: string[] } = { ...newPlan.semesters };
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

  const handleUpdateRoom = useCallback((roomId: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...updates } : r));
  }, []);

  const handleAddRoom = useCallback((newRoom: Room) => {
    if (rooms.some(r => r.id === newRoom.id)) {
      alert(`Ein Raum mit der ID "${newRoom.id}" existiert bereits.`);
      return;
    }
    setRooms(prev => [...prev, newRoom]);
  }, [rooms]);

  const handleDeleteRoom = useCallback((roomId: string) => {
    if (window.confirm(`Möchten Sie den Raum "${roomId}" wirklich löschen?`)) {
      setRooms(prev => prev.filter(r => r.id !== roomId));
    }
  }, []);

  const handleAddUser = useCallback((newUser: User) => {
    if (users.some(user => user.id === newUser.id)) {
      alert(`Ein Nutzer mit der ID "${newUser.id}" existiert bereits.`);
      return;
    }
    setUsers(prev => [...prev, newUser]);
  }, [users]);

  const handleUpdateUser = useCallback((userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => user.id === userId ? { ...user, ...updates } : user));

    if (updates.id && updates.id !== userId) {
      setLecturerAvailabilities(prev => prev.map(item =>
        item.userId === userId ? { ...item, userId: updates.id! } : item
      ));
      setSchedulePlan(prev => prev
        ? {
          ...prev,
          entries: prev.entries.map(entry =>
            entry.lecturerUserId === userId ? { ...entry, lecturerUserId: updates.id } : entry
          )
        }
        : prev
      );
    }

    const currentUser = users.find(user => user.id === userId);
    if (currentUser?.name && updates.name && currentUser.name !== updates.name) {
      setModules(prev => prev.map(module =>
        module.personInCharge === currentUser.name
          ? { ...module, personInCharge: updates.name }
          : module
      ));
    }
  }, [users]);

  const handleDeleteUser = useCallback((userId: string) => {
    const user = users.find(item => item.id === userId);
    if (!user) return;

    if (window.confirm(`Möchten Sie den Nutzer "${user.name}" wirklich löschen?`)) {
      setUsers(prev => prev.filter(item => item.id !== userId));
      setLecturerAvailabilities(prev => prev.filter(item => item.userId !== userId));
      setSchedulePlan(prev => prev
        ? {
          ...prev,
          entries: prev.entries.map(entry =>
            entry.lecturerUserId === userId
              ? { ...entry, lecturerUserId: undefined, lecturerName: 'N.N.', warnings: [...entry.warnings, 'Der zugeordnete Nutzer wurde geloescht.'] }
              : entry
          )
        }
        : prev
      );
      setModules(prev => prev.map(module =>
        module.personInCharge === user.name
          ? { ...module, personInCharge: '' }
          : module
      ));
    }
  }, [users]);

  const handleUpdateRoomAssignments = useCallback((
    nextAssignments: RoomAssignment[],
    options?: { reconcileSchedule?: boolean }
  ) => {
    if (options?.reconcileSchedule === false || !schedulePlan) {
      setRoomAssignments(nextAssignments);
      return;
    }

    const reconciliation = reconcileScheduleAfterAssignmentChange({
      plan: schedulePlan,
      previousAssignments: roomAssignments,
      nextAssignments,
      rooms,
    });

    if (reconciliation.changed) {
      setSchedulePlan(reconciliation.plan);
      setRoomAssignments(reconciliation.roomAssignments);
      return;
    }

    setRoomAssignments(nextAssignments);
  }, [roomAssignments, rooms, schedulePlan]);

  const handleAddCohort = useCallback((newCohort: Cohort, saveAsTemplate?: boolean) => {
    if (cohorts.some(sg => sg.id === newCohort.id)) {
      alert(`Eine Studiengruppe mit der ID "${newCohort.id}" existiert bereits.`);
      return false;
    }

    setCohorts(prev => [...prev, newCohort]);
    setActiveCohortIds([newCohort.id]);

    if (saveAsTemplate) {
      handleUpdateProgram(newCohort.programId, { templatePlan: newCohort.plan });
    }

    return true;
  }, [cohorts, handleUpdateProgram]);

  const activeCohorts = useMemo(() => {
    return cohorts.filter(sg => activeCohortIds.includes(sg.id));
  }, [cohorts, activeCohortIds]);

  const handleSelectGroup = (cohortId: string) => {
    setViewMode('group');
    setActiveCohortIds([cohortId]);
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
        lang={lang}
        setLang={setLang}
      />
      <main className="flex-grow p-4">
        <PlannerBoard
          mainCategory={mainCategory}
          viewMode={viewMode}
          onDrop={handleDrop}
          getModuleById={getModuleById}
          getProgramById={getProgramById}
          onDragStart={handleDragStart}
          cohorts={cohorts}
          activeCohorts={activeCohorts}
          selectedSemester={selectedSemester!}
          setSelectedSemester={setSelectedSemester}
          semesters={academicCalendar?.semesters || []}
          onSelectGroup={handleSelectGroup}
          onUpdateCohort={handleUpdateCohort}
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
          onAddCohort={handleAddCohort}
          onUpdateProgram={handleUpdateProgram}
          lang={lang}
          catalogs={catalogs}
          onUpdateCatalogs={setCatalogs}
          users={users}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          rooms={rooms}
          onUpdateRoom={handleUpdateRoom}
          onAddRoom={handleAddRoom}
          onDeleteRoom={handleDeleteRoom}
          systemSettings={systemSettings}
          onUpdateSystemSettings={setSystemSettings}
          academicCalendar={academicCalendar}
          onUpdateAcademicCalendar={setAcademicCalendar}
          roomAssignments={roomAssignments}
          onUpdateRoomAssignments={handleUpdateRoomAssignments}
          lecturerAvailabilities={lecturerAvailabilities}
          onUpdateLecturerAvailabilities={setLecturerAvailabilities}
          schedulePlan={schedulePlan}
          onUpdateSchedulePlan={setSchedulePlan}
        />
      </main>
    </div>
  );
};
