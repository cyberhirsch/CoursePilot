'use client';

import React, { useMemo, useState } from 'react';
import type { Cohort, User } from '@/types';
import { Plus, Trash2, UsersRound } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  cohorts: Cohort[];
  onAddUser: (user: User) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  mode?: 'profile' | 'groups';
}

const roles: User['role'][] = ['superuser', 'admin', 'coordinator', 'professor', 'lecturer', 'student', 'guest'];

const emptyUser = (nextId: string): User => ({
  id: nextId,
  name: '',
  email: '',
  role: 'lecturer',
  department: '',
  universityId: '',
});

const nextUserId = (users: User[]): string => {
  let index = users.length + 1;
  let id = `usr_${index.toString().padStart(3, '0')}`;
  while (users.some(user => user.id === id)) {
    index += 1;
    id = `usr_${index.toString().padStart(3, '0')}`;
  }
  return id;
};

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  cohorts,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  mode = 'profile',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'all'>(mode === 'groups' ? 'student' : 'all');
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<User>(() => emptyUser(nextUserId(users)));

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users
      .filter(user => roleFilter === 'all' || user.role === roleFilter)
      .filter(user => {
        if (!normalizedSearch) return true;
        return [
          user.id,
          user.name,
          user.email,
          user.role,
          user.department || '',
          user.universityId || '',
        ].some(value => value.toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, roleFilter, searchTerm]);

  const createUser = () => {
    if (!draft.id.trim() || !draft.name.trim() || !draft.email.trim()) {
      alert('Bitte ID, Name und E-Mail ausfuellen.');
      return;
    }

    if (users.some(user => user.id === draft.id.trim())) {
      alert(`Ein Nutzer mit der ID "${draft.id.trim()}" existiert bereits.`);
      return;
    }

    onAddUser({
      ...draft,
      id: draft.id.trim(),
      name: draft.name.trim(),
      email: draft.email.trim(),
      department: draft.department?.trim() || null,
      universityId: draft.universityId?.trim() || undefined,
      cohortId: draft.role === 'student' ? draft.cohortId || undefined : undefined,
    });
    setDraft(emptyUser(nextUserId([...users, draft])));
    setIsAdding(false);
  };

  const roleCounts = roles.map(role => ({
    role,
    count: users.filter(user => user.role === role).length,
  }));

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric label="Nutzer" value={users.length} />
        <Metric label="Dozenten" value={users.filter(user => user.role === 'professor' || user.role === 'lecturer').length} />
        <Metric label="Studierende" value={users.filter(user => user.role === 'student').length} />
        <Metric label="Kohorten" value={cohorts.length} />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden flex-grow flex flex-col">
        <div className="p-4 border-b border-border flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Nutzerverwaltung</h2>
              <p className="text-sm text-muted-foreground">Nutzer anlegen, Rollen pflegen und Studierende Kohorten zuordnen.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Suchen..."
              className="bg-muted/50 border border-input rounded-md px-3 py-2 text-sm min-w-[220px]"
            />
            <select
              value={roleFilter}
              onChange={event => setRoleFilter(event.target.value as User['role'] | 'all')}
              className="bg-muted/50 border border-input rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Alle Rollen</option>
              {roles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            <button
              onClick={() => {
                setDraft(emptyUser(nextUserId(users)));
                setIsAdding(prev => !prev);
              }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nutzer hinzufuegen
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border bg-muted/20 flex flex-wrap gap-2">
          {roleCounts.map(item => (
            <button
              key={item.role}
              onClick={() => setRoleFilter(item.role)}
              className={`px-2 py-1 rounded text-xs font-bold ${roleFilter === item.role ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border border-border'}`}
            >
              {item.role}: {item.count}
            </button>
          ))}
        </div>

        {isAdding && (
          <div className="p-4 border-b border-primary/30 bg-primary/5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
              <UserField label="ID" value={draft.id} onChange={value => setDraft(prev => ({ ...prev, id: value }))} />
              <UserField label="Name" value={draft.name} onChange={value => setDraft(prev => ({ ...prev, name: value }))} />
              <UserField label="E-Mail" value={draft.email} onChange={value => setDraft(prev => ({ ...prev, email: value }))} />
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Rolle</span>
                <select
                  value={draft.role}
                  onChange={event => setDraft(prev => ({ ...prev, role: event.target.value as User['role'] }))}
                  className="mt-1 w-full bg-background border border-input rounded-md px-2 py-2 text-sm"
                >
                  {roles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
              <UserField label="Fachbereich" value={draft.department || ''} onChange={value => setDraft(prev => ({ ...prev, department: value }))} />
              <UserField label="Nummer" value={draft.universityId || ''} onChange={value => setDraft(prev => ({ ...prev, universityId: value }))} />
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Kohorte</span>
                <select
                  value={draft.cohortId || ''}
                  onChange={event => setDraft(prev => ({ ...prev, cohortId: event.target.value || undefined }))}
                  disabled={draft.role !== 'student'}
                  className="mt-1 w-full bg-background border border-input rounded-md px-2 py-2 text-sm disabled:opacity-40"
                >
                  <option value="">Keine</option>
                  {cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.shortName} - {cohort.name}</option>)}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-md bg-muted text-sm font-bold">Abbrechen</button>
              <button onClick={createUser} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-bold">Speichern</button>
            </div>
          </div>
        )}

        <div className="overflow-auto flex-grow">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md">
              <tr className="text-left border-b border-border">
                <th className="p-3 font-semibold">ID</th>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">E-Mail</th>
                <th className="p-3 font-semibold">Rolle</th>
                <th className="p-3 font-semibold">Fachbereich</th>
                <th className="p-3 font-semibold">Nummer</th>
                <th className="p-3 font-semibold">Kohorte</th>
                <th className="p-3 font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map(user => (
                <tr key={user.id} className="group hover:bg-muted/20">
                  <td className="p-3">
                    <input
                      value={user.id}
                      onChange={event => onUpdateUser(user.id, { id: event.target.value })}
                      className="w-32 bg-transparent font-mono text-xs border-none p-0 focus:ring-0"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      value={user.name}
                      onChange={event => onUpdateUser(user.id, { name: event.target.value })}
                      className="w-56 bg-transparent font-bold border-none p-0 focus:ring-0"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      value={user.email}
                      onChange={event => onUpdateUser(user.id, { email: event.target.value })}
                      className="w-64 bg-transparent text-muted-foreground border-none p-0 focus:ring-0"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={user.role}
                      onChange={event => onUpdateUser(user.id, { role: event.target.value as User['role'], cohortId: event.target.value === 'student' ? user.cohortId : undefined })}
                      className="bg-muted/40 rounded px-2 py-1 text-xs font-bold"
                    >
                      {roles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <input
                      value={user.department || ''}
                      onChange={event => onUpdateUser(user.id, { department: event.target.value || null })}
                      className="w-44 bg-transparent border-none p-0 focus:ring-0"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      value={user.universityId || ''}
                      onChange={event => onUpdateUser(user.id, { universityId: event.target.value })}
                      className="w-32 bg-transparent border-none p-0 focus:ring-0"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={user.cohortId || ''}
                      onChange={event => onUpdateUser(user.id, { cohortId: event.target.value || undefined })}
                      disabled={user.role !== 'student'}
                      className="bg-muted/40 rounded px-2 py-1 text-xs disabled:opacity-40 max-w-[220px]"
                    >
                      <option value="">Keine</option>
                      {cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.shortName} - {cohort.name}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="opacity-0 group-hover:opacity-100 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Nutzer loeschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-muted-foreground italic">
              Keine Nutzer gefunden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserField: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      className="mt-1 w-full bg-background border border-input rounded-md px-2 py-2 text-sm"
    />
  </label>
);

const Metric: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="text-xs text-muted-foreground font-semibold uppercase">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);
