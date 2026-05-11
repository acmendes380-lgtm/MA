# MendOS Phase 2 — Project Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-featured project management system where the user can create projects, manage tasks/subtasks, write notes, add resources, and get AI suggestions — all organized by category.

**Architecture:** Projects and tasks stored in Supabase. Project detail uses a tab-based layout (Overview, Tasks, Notes, Resources, AI). TanStack Query handles all data fetching with optimistic updates on task status changes.

**Tech Stack:** Next.js 14 App Router, Supabase, TanStack Query v5, Framer Motion, Recharts, OpenAI (gpt-4o-mini)

---

## File Structure

```
app/(dashboard)/projects/
├── page.tsx                          ← projects list
└── [id]/
    ├── page.tsx                      ← project detail shell
    └── tabs/
        ├── overview-tab.tsx
        ├── tasks-tab.tsx
        ├── notes-tab.tsx
        ├── resources-tab.tsx
        └── ai-tab.tsx

components/projects/
├── project-card.tsx
├── project-form.tsx
├── task-item.tsx
└── task-form.tsx

hooks/
├── use-projects.ts
└── use-tasks.ts

app/api/ai/project-suggestions/route.ts

supabase/migrations/002_projects_schema.sql
__tests__/lib/project-utils.test.ts
```

---

### Task 1: Database migration for projects

**Files:**
- Create: `mendos/supabase/migrations/002_projects_schema.sql`

- [ ] **Step 1: Create migration**

```sql
-- mendos/supabase/migrations/002_projects_schema.sql

create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  category text not null default 'personal'
    check (category in ('personal','business','school','golf','gym','content')),
  status text not null default 'active'
    check (status in ('active','paused','completed','archived')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  deadline date,
  progress int not null default 0 check (progress between 0 and 100),
  color text not null default '#3b82f6',
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  project_id uuid references public.projects on delete cascade,
  parent_task_id uuid references public.tasks on delete cascade,
  title text not null,
  status text not null default 'todo'
    check (status in ('todo','in_progress','done')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  deadline date,
  order_index int not null default 0
);

create table if not exists public.project_notes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  user_id uuid references auth.users not null,
  content text not null default '',
  updated_at timestamptz default now(),
  unique(project_id)
);

create table if not exists public.project_resources (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  user_id uuid references auth.users not null,
  title text not null,
  url text not null,
  created_at timestamptz default now()
);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.project_notes enable row level security;
alter table public.project_resources enable row level security;

create policy "Users own their projects"
  on public.projects for all using (user_id = auth.uid());
create policy "Users own their tasks"
  on public.tasks for all using (user_id = auth.uid());
create policy "Users own their project notes"
  on public.project_notes for all using (user_id = auth.uid());
create policy "Users own their project resources"
  on public.project_resources for all using (user_id = auth.uid());
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Paste and execute the SQL above.

- [ ] **Step 3: Commit**

```bash
cd /Users/andremendes/Batman/MendOS/mendos
git add supabase/
git commit -m "feat: add projects schema migration"
```

---

### Task 2: Project utilities and hooks

**Files:**
- Create: `mendos/lib/utils/project-utils.ts`
- Create: `mendos/__tests__/lib/project-utils.test.ts`
- Create: `mendos/hooks/use-projects.ts`
- Create: `mendos/hooks/use-tasks.ts`

- [ ] **Step 1: Write failing test**

```typescript
// mendos/__tests__/lib/project-utils.test.ts
import { getCategoryColor, getPriorityBadge, computeProjectProgress } from '@/lib/utils/project-utils'

describe('getCategoryColor', () => {
  it('returns correct color for golf', () => {
    expect(getCategoryColor('golf')).toBe('#f59e0b')
  })
  it('returns fallback for unknown category', () => {
    expect(getCategoryColor('unknown' as any)).toBe('#3b82f6')
  })
})

describe('getPriorityBadge', () => {
  it('returns urgent variant for urgent priority', () => {
    expect(getPriorityBadge('urgent')).toBe('red')
  })
  it('returns default variant for low priority', () => {
    expect(getPriorityBadge('low')).toBe('default')
  })
})

describe('computeProjectProgress', () => {
  it('returns 0 for empty task list', () => {
    expect(computeProjectProgress([])).toBe(0)
  })
  it('returns 100 when all tasks are done', () => {
    const tasks = [
      { status: 'done' as const },
      { status: 'done' as const },
    ]
    expect(computeProjectProgress(tasks)).toBe(100)
  })
  it('returns 50 when half are done', () => {
    const tasks = [
      { status: 'done' as const },
      { status: 'todo' as const },
    ]
    expect(computeProjectProgress(tasks)).toBe(50)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npx jest __tests__/lib/project-utils.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create project-utils.ts**

```typescript
// mendos/lib/utils/project-utils.ts
import type { ProjectCategory, Priority } from '@/types'

export const CATEGORY_COLORS: Record<ProjectCategory, string> = {
  personal: '#3b82f6',
  business: '#06b6d4',
  school: '#8b5cf6',
  golf: '#f59e0b',
  gym: '#10b981',
  content: '#ec4899',
}

export function getCategoryColor(category: ProjectCategory): string {
  return CATEGORY_COLORS[category] ?? '#3b82f6'
}

export function getPriorityBadge(priority: Priority): string {
  const map: Record<Priority, string> = {
    low: 'default',
    medium: 'blue',
    high: 'amber',
    urgent: 'red',
  }
  return map[priority]
}

export function computeProjectProgress(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0
  const done = tasks.filter((t) => t.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx jest __tests__/lib/project-utils.test.ts
```
Expected: PASS (6 tests)

- [ ] **Step 5: Create use-projects.ts**

```typescript
// mendos/hooks/use-projects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectCategory, Priority } from '@/types'

export function useProjects(category?: ProjectCategory) {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['projects', category],
    queryFn: async () => {
      let q = supabase.from('projects').select('*').order('created_at', { ascending: false })
      if (category) q = q.eq('category', category)
      const { data, error } = await q
      if (error) throw error
      return data as Project[]
    },
  })

  const createProject = useMutation({
    mutationFn: async (input: {
      title: string
      description?: string
      category: ProjectCategory
      priority: Priority
      deadline?: string
      color: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('projects')
        .insert({ user_id: user.id, ...input })
        .select()
        .single()
      if (error) throw error
      return data as Project
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { error } = await supabase.from('projects').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  return { ...query, createProject, updateProject, deleteProject }
}

export function useProject(id: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Project
    },
    enabled: !!id,
  })
}
```

- [ ] **Step 6: Create use-tasks.ts**

```typescript
// mendos/hooks/use-tasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Task, Priority, TaskStatus } from '@/types'

export function useTasks(projectId: string) {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .is('parent_task_id', null)
        .order('order_index')
      if (error) throw error
      return data as Task[]
    },
    enabled: !!projectId,
  })

  const createTask = useMutation({
    mutationFn: async (input: { title: string; priority?: Priority; deadline?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const order = (query.data?.length ?? 0)
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        project_id: projectId,
        order_index: order,
        ...input,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  return { ...query, createTask, updateTask, deleteTask }
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add project utilities, hooks, and tests"
```

---

### Task 3: Projects list page

**Files:**
- Create: `mendos/components/projects/project-card.tsx`
- Create: `mendos/components/projects/project-form.tsx`
- Modify: `mendos/app/(dashboard)/projects/page.tsx`

- [ ] **Step 1: Create project-card.tsx**

```typescript
// mendos/components/projects/project-card.tsx
'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from '@/components/ui/progress-ring'
import { getCategoryColor, getPriorityBadge } from '@/lib/utils/project-utils'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import type { Project } from '@/types'

export function ProjectCard({ project }: { project: Project }) {
  const color = getCategoryColor(project.category)
  const priorityVariant = getPriorityBadge(project.priority) as any

  return (
    <Link href={`/projects/${project.id}`}>
      <Card hover accent={color} className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{project.title}</h3>
            {project.description && (
              <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <ProgressRing
            value={project.progress}
            size={44}
            strokeWidth={4}
            color={color}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={priorityVariant as any}>{project.priority}</Badge>
          <Badge variant="default" className="capitalize">{project.category}</Badge>
          <Badge
            variant={
              project.status === 'completed'
                ? 'green'
                : project.status === 'paused'
                ? 'amber'
                : 'default'
            }
          >
            {project.status}
          </Badge>
        </div>

        {project.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(project.deadline), 'MMM d, yyyy')}</span>
          </div>
        )}
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: Create project-form.tsx**

```typescript
// mendos/components/projects/project-form.tsx
'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORY_COLORS } from '@/lib/utils/project-utils'
import type { ProjectCategory, Priority } from '@/types'

const CATEGORIES: ProjectCategory[] = ['personal', 'business', 'school', 'golf', 'gym', 'content']
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

interface ProjectFormProps {
  onClose: () => void
}

export function ProjectForm({ onClose }: ProjectFormProps) {
  const { createProject } = useProjects()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ProjectCategory>('personal')
  const [priority, setPriority] = useState<Priority>('medium')
  const [deadline, setDeadline] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await createProject.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      deadline: deadline || undefined,
      color: CATEGORY_COLORS[category],
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project name..."
          autoFocus
          required
        />
      </div>

      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this project about?"
          rows={2}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/50 transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 capitalize"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 capitalize"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p} className="capitalize">{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Deadline (optional)</label>
        <Input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="[color-scheme:dark]"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim() || createProject.isPending}
          className="flex-1"
        >
          {createProject.isPending ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Replace projects page**

```typescript
// mendos/app/(dashboard)/projects/page.tsx
'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, FolderOpen } from 'lucide-react'
import type { ProjectCategory } from '@/types'

const FILTERS: { label: string; value: ProjectCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Personal', value: 'personal' },
  { label: 'Business', value: 'business' },
  { label: 'School', value: 'school' },
  { label: 'Golf', value: 'golf' },
  { label: 'Gym', value: 'gym' },
  { label: 'Content', value: 'content' },
]

export default function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectCategory | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const { data: projects, isLoading } = useProjects(
    filter === 'all' ? undefined : filter
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-500 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-5">
          <h3 className="text-sm font-medium text-white mb-4">New Project</h3>
          <ProjectForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : projects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="h-10 w-10 text-neutral-700 mb-3" />
          <p className="text-sm text-neutral-500">No projects yet</p>
          <p className="text-xs text-neutral-600 mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add project list page with filtering and creation"
```

---

### Task 4: Project detail page

**Files:**
- Create: `mendos/app/(dashboard)/projects/[id]/page.tsx`
- Create: `mendos/app/(dashboard)/projects/[id]/tabs/overview-tab.tsx`
- Create: `mendos/app/(dashboard)/projects/[id]/tabs/tasks-tab.tsx`
- Create: `mendos/app/(dashboard)/projects/[id]/tabs/notes-tab.tsx`
- Create: `mendos/app/(dashboard)/projects/[id]/tabs/resources-tab.tsx`
- Create: `mendos/app/(dashboard)/projects/[id]/tabs/ai-tab.tsx`

- [ ] **Step 1: Create project detail page**

```typescript
// mendos/app/(dashboard)/projects/[id]/page.tsx
'use client'

import { useState } from 'react'
import { use } from 'react'
import { useProject } from '@/hooks/use-projects'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Badge } from '@/components/ui/badge'
import { getCategoryColor, getPriorityBadge } from '@/lib/utils/project-utils'
import { OverviewTab } from './tabs/overview-tab'
import { TasksTab } from './tabs/tasks-tab'
import { NotesTab } from './tabs/notes-tab'
import { ResourcesTab } from './tabs/resources-tab'
import { AITab } from './tabs/ai-tab'
import { Skeleton } from '@/components/ui/skeleton'

const TABS = ['Overview', 'Tasks', 'Notes', 'Resources', 'AI'] as const
type Tab = (typeof TABS)[number]

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: project, isLoading } = useProject(id)
  const [activeTab, setActiveTab] = useState<Tab>('Tasks')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!project) {
    return <p className="text-neutral-600 text-sm">Project not found.</p>
  }

  const color = getCategoryColor(project.category)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" className="capitalize">{project.category}</Badge>
            <Badge variant={getPriorityBadge(project.priority) as any}>{project.priority}</Badge>
            <Badge
              variant={project.status === 'completed' ? 'green' : project.status === 'paused' ? 'amber' : 'default'}
            >
              {project.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold text-white">{project.title}</h1>
          {project.description && (
            <p className="text-sm text-neutral-500 mt-1">{project.description}</p>
          )}
        </div>
        <ProgressRing value={project.progress} size={64} strokeWidth={5} color={color} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab
                ? 'border-blue-500 text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && <OverviewTab project={project} />}
      {activeTab === 'Tasks' && <TasksTab projectId={project.id} />}
      {activeTab === 'Notes' && <NotesTab projectId={project.id} />}
      {activeTab === 'Resources' && <ResourcesTab projectId={project.id} />}
      {activeTab === 'AI' && <AITab project={project} />}
    </div>
  )
}
```

- [ ] **Step 2: Create overview-tab.tsx**

```typescript
// mendos/app/(dashboard)/projects/[id]/tabs/overview-tab.tsx
'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import type { Project, ProjectStatus } from '@/types'

const STATUSES: ProjectStatus[] = ['active', 'paused', 'completed', 'archived']

export function OverviewTab({ project }: { project: Project }) {
  const { updateProject } = useProjects()
  const [editProgress, setEditProgress] = useState(false)
  const [progressVal, setProgressVal] = useState(String(project.progress))

  function handleProgressSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(progressVal)
    if (isNaN(n) || n < 0 || n > 100) return
    updateProject.mutate({ id: project.id, progress: n })
    setEditProgress(false)
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <h3 className="text-xs text-neutral-500 mb-3 uppercase tracking-wide">Progress</h3>
        {editProgress ? (
          <form onSubmit={handleProgressSubmit} className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              value={progressVal}
              onChange={(e) => setProgressVal(e.target.value)}
              autoFocus
              className="w-24"
            />
            <span className="text-sm text-neutral-400">%</span>
            <Button type="submit" size="sm">Save</Button>
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <button
              onClick={() => setEditProgress(true)}
              className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
            >
              {project.progress}%
            </button>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-xs text-neutral-500 mb-3 uppercase tracking-wide">Status</h3>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateProject.mutate({ id: project.id, status: s })}
              className={`rounded-lg px-3 py-1.5 text-xs capitalize transition-all ${
                project.status === s
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-500 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {project.deadline && (
        <Card>
          <h3 className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Deadline</h3>
          <p className="text-white font-medium">
            {format(new Date(project.deadline), 'MMMM d, yyyy')}
          </p>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create tasks-tab.tsx**

```typescript
// mendos/app/(dashboard)/projects/[id]/tabs/tasks-tab.tsx
'use client'

import { useState } from 'react'
import { useTasks } from '@/hooks/use-tasks'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Plus, Trash2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TaskStatus } from '@/types'

export function TasksTab({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading, createTask, updateTask, deleteTask } = useTasks(projectId)
  const [newTitle, setNewTitle] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    await createTask.mutateAsync({ title: newTitle.trim() })
    setNewTitle('')
  }

  const todo = tasks?.filter((t) => t.status === 'todo') ?? []
  const inProgress = tasks?.filter((t) => t.status === 'in_progress') ?? []
  const done = tasks?.filter((t) => t.status === 'done') ?? []

  if (isLoading) {
    return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/40 transition-colors"
        />
        <Button type="submit" size="sm" disabled={!newTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {[
        { label: 'To Do', items: todo, status: 'todo' as TaskStatus },
        { label: 'In Progress', items: inProgress, status: 'in_progress' as TaskStatus },
        { label: 'Done', items: done, status: 'done' as TaskStatus },
      ].map(({ label, items }) => (
        items.length > 0 && (
          <div key={label}>
            <p className="text-xs text-neutral-500 mb-2">{label} ({items.length})</p>
            <div className="space-y-1.5">
              {items.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-lg border border-white/[0.04] p-3 hover:border-white/[0.08] transition-colors"
                >
                  <button
                    onClick={() => {
                      const next: Record<string, TaskStatus> = {
                        todo: 'in_progress',
                        in_progress: 'done',
                        done: 'todo',
                      }
                      updateTask.mutate({ id: task.id, status: next[task.status] })
                    }}
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all shrink-0',
                      task.status === 'done' ? 'bg-blue-600 border-blue-600' :
                      task.status === 'in_progress' ? 'border-blue-500' :
                      'border-white/20'
                    )}
                  >
                    {task.status === 'done' && <Check className="h-3 w-3 text-white" />}
                    {task.status === 'in_progress' && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                  </button>

                  <span className={cn(
                    'flex-1 text-sm',
                    task.status === 'done' ? 'line-through text-neutral-600' : 'text-neutral-200'
                  )}>
                    {task.title}
                  </span>

                  <button
                    onClick={() => deleteTask.mutate(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {tasks?.length === 0 && (
        <p className="text-center text-xs text-neutral-600 py-8">
          No tasks yet. Add one above.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create notes-tab.tsx**

```typescript
// mendos/app/(dashboard)/projects/[id]/tabs/notes-tab.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function NotesTab({ projectId }: { projectId: string }) {
  const supabase = createClient()
  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const { data } = useQuery({
    queryKey: ['project-notes', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_notes')
        .select('content')
        .eq('project_id', projectId)
        .single()
      return data?.content ?? ''
    },
  })

  useEffect(() => {
    if (data !== undefined && content === '') setContent(data)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('project_notes').upsert(
        { project_id: projectId, user_id: user.id, content: text, updated_at: new Date().toISOString() },
        { onConflict: 'project_id' }
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-notes', projectId] }),
  })

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveMutation.mutate(e.target.value), 800)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">Project notes (auto-saved)</span>
        {saveMutation.isPending && <span className="text-xs text-neutral-600">Saving...</span>}
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Write notes, ideas, and thoughts about this project..."
        rows={16}
        className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#111111] px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-white/[0.10] transition-colors font-mono leading-relaxed"
      />
    </div>
  )
}
```

- [ ] **Step 5: Create resources-tab.tsx**

```typescript
// mendos/app/(dashboard)/projects/[id]/tabs/resources-tab.tsx
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink, Trash2, Plus, Link as LinkIcon } from 'lucide-react'

interface Resource { id: string; title: string; url: string }

export function ResourcesTab({ projectId }: { projectId: string }) {
  const supabase = createClient()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  const { data: resources } = useQuery({
    queryKey: ['project-resources', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_resources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      return (data ?? []) as Resource[]
    },
  })

  const addMutation = useMutation({
    mutationFn: async ({ title, url }: { title: string; url: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('project_resources').insert({
        project_id: projectId, user_id: user.id, title, url,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-resources', projectId] })
      setTitle('')
      setUrl('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('project_resources').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-resources', projectId] }),
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    await addMutation.mutateAsync({ title: title.trim(), url: normalizedUrl })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="flex-1" required />
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" className="flex-1" required />
        <Button type="submit" size="sm" disabled={!title.trim() || !url.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-2">
        {resources?.map((r) => (
          <div key={r.id} className="group flex items-center gap-3 rounded-lg border border-white/[0.04] p-3 hover:border-white/[0.08] transition-colors">
            <LinkIcon className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{r.title}</p>
              <p className="text-xs text-neutral-600 truncate">{r.url}</p>
            </div>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <ExternalLink className="h-3.5 w-3.5 text-neutral-500 hover:text-blue-400 transition-colors" />
            </a>
            <button onClick={() => deleteMutation.mutate(r.id)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
            </button>
          </div>
        ))}
        {resources?.length === 0 && (
          <p className="text-center text-xs text-neutral-600 py-8">No resources yet.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create ai-tab.tsx**

```typescript
// mendos/app/(dashboard)/projects/[id]/tabs/ai-tab.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import type { Project } from '@/types'

export function AITab({ project }: { project: Project }) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchSuggestions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/project-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      })
      if (!res.ok) throw new Error('Failed to get suggestions')
      const data = await res.json()
      setSuggestions(data.suggestions)
    } catch (e) {
      setError('Could not get suggestions. Check your OpenAI key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">AI Suggestions</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Get actionable ideas to move this project forward
          </p>
        </div>
        <Button size="sm" onClick={fetchSuggestions} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? 'Thinking...' : 'Get Suggestions'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4"
            >
              <span className="text-xs font-bold text-blue-400 shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-sm text-neutral-200">{s}</p>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-8 w-8 text-neutral-700 mb-3" />
          <p className="text-sm text-neutral-500">
            Click "Get Suggestions" to get AI-powered ideas for this project
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add project detail page with tabs (overview, tasks, notes, resources, AI)"
```

---

### Task 5: AI project suggestions route

**Files:**
- Create: `mendos/app/api/ai/project-suggestions/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// mendos/app/api/ai/project-suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import type { Project } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { project }: { project: Project } = await request.json()

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content:
            'You are a productivity expert. Return exactly 5 specific, actionable suggestions as a JSON array of strings. No preamble, just the JSON array.',
        },
        {
          role: 'user',
          content: `Project: "${project.title}" (${project.category}, ${project.priority} priority, ${project.progress}% complete, status: ${project.status}). Description: ${project.description ?? 'none'}. Give 5 concrete next actions.`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(raw)
    const suggestions: string[] = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
      : Array.isArray(parsed)
      ? parsed
      : Object.values(parsed).flat().slice(0, 5)

    return NextResponse.json({ suggestions: suggestions.slice(0, 5) })
  } catch {
    return NextResponse.json(
      { suggestions: ['Review current blockers', 'Break next task into smaller steps', 'Schedule a focused work session', 'Review project deadline', 'Update progress percentage'] },
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add AI project suggestions API route"
```

---

### Task 6: Verify Phase 2

- [ ] **Step 1: Run tests**

```bash
npx jest
```
Expected: All tests pass

- [ ] **Step 2: Test in browser**

```bash
npm run dev
```

Verify:
1. Navigate to `/projects`
2. Create a project in each category
3. Open a project detail page
4. Add tasks, mark them done, delete them
5. Write notes — verify auto-save
6. Add a resource link
7. Click "Get Suggestions" on AI tab — verify suggestions appear
8. Progress ring on list page reflects project.progress value

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: Phase 2 complete — full project management system"
```

---

**Phase 2 complete.** Full project CRUD, task management, notes, resources, and AI suggestions.

**Next:** Run Phase 3A plan → `docs/superpowers/plans/2026-05-11-mendos-phase3a.md`
