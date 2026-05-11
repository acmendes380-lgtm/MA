# MendOS Phase 4 — School + Study Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a school tracker with subjects, assignments, exams, study sessions, a Pomodoro study timer, grade analytics, and an AI study plan generator.

**Architecture:** All school data in Supabase. Study timer is pure client state (no persistence — timer state is ephemeral). Grade averages computed client-side. AI study plan generated on demand via API route.

**Tech Stack:** Next.js 14 App Router, Supabase, TanStack Query v5, Recharts, OpenAI (gpt-4o-mini)

---

## File Structure

```
app/(dashboard)/school/page.tsx

components/school/
├── subject-form.tsx
├── assignment-form.tsx
├── assignment-list.tsx
├── exam-list.tsx
├── study-timer.tsx
└── grade-chart.tsx

hooks/use-school.ts
lib/utils/school-utils.ts
app/api/ai/study-plan/route.ts
supabase/migrations/005_school_schema.sql
__tests__/lib/school-utils.test.ts
```

---

### Task 1: Database migration

**Files:**
- Create: `mendos/supabase/migrations/005_school_schema.sql`

- [ ] **Step 1: Create migration**

```sql
-- mendos/supabase/migrations/005_school_schema.sql

create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  color text not null default '#8b5cf6',
  created_at timestamptz default now()
);

create table if not exists public.assignments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id uuid references public.subjects on delete cascade not null,
  title text not null,
  due_date date not null,
  status text not null default 'pending'
    check (status in ('pending','submitted','graded')),
  grade numeric(5,2),
  notes text
);

create table if not exists public.exams (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id uuid references public.subjects on delete cascade not null,
  title text not null,
  date date not null,
  status text not null default 'upcoming'
    check (status in ('upcoming','completed')),
  grade numeric(5,2),
  notes text
);

create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id uuid references public.subjects on delete cascade not null,
  duration_minutes int not null,
  notes text,
  date date not null default current_date
);

alter table public.subjects enable row level security;
alter table public.assignments enable row level security;
alter table public.exams enable row level security;
alter table public.study_sessions enable row level security;

create policy "Users own their subjects" on public.subjects for all using (user_id = auth.uid());
create policy "Users own their assignments" on public.assignments for all using (user_id = auth.uid());
create policy "Users own their exams" on public.exams for all using (user_id = auth.uid());
create policy "Users own their study sessions" on public.study_sessions for all using (user_id = auth.uid());
```

- [ ] **Step 2: Apply in Supabase SQL Editor**

- [ ] **Step 3: Commit**

```bash
cd /Users/andremendes/Batman/MendOS/mendos
git add supabase/
git commit -m "feat: add school schema migration"
```

---

### Task 2: School utilities and tests

**Files:**
- Create: `mendos/lib/utils/school-utils.ts`
- Create: `mendos/__tests__/lib/school-utils.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// mendos/__tests__/lib/school-utils.test.ts
import { calcSubjectAverage, calcWeeklyStudyHours, getDaysUntil } from '@/lib/utils/school-utils'

describe('calcSubjectAverage', () => {
  it('returns null for empty grades', () => {
    expect(calcSubjectAverage([])).toBeNull()
  })
  it('returns average of grades', () => {
    expect(calcSubjectAverage([80, 90, 100])).toBeCloseTo(90)
  })
  it('ignores null grades', () => {
    expect(calcSubjectAverage([null, 80, null, 100])).toBeCloseTo(90)
  })
})

describe('calcWeeklyStudyHours', () => {
  it('returns 0 for no sessions', () => {
    expect(calcWeeklyStudyHours([])).toBe(0)
  })
  it('sums minutes and converts to hours', () => {
    const today = new Date()
    const d1 = new Date(today); d1.setDate(d1.getDate() - 1)
    const old = new Date(today); old.setDate(old.getDate() - 10)
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    const sessions = [
      { date: fmt(today), duration_minutes: 60 },
      { date: fmt(d1), duration_minutes: 90 },
      { date: fmt(old), duration_minutes: 120 },
    ]
    expect(calcWeeklyStudyHours(sessions)).toBeCloseTo(2.5)
  })
})

describe('getDaysUntil', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getDaysUntil(today)).toBe(0)
  })
  it('returns positive for future dates', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 3)
    expect(getDaysUntil(tomorrow.toISOString().split('T')[0])).toBe(3)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npx jest __tests__/lib/school-utils.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create school-utils.ts**

```typescript
// mendos/lib/utils/school-utils.ts
import { differenceInCalendarDays, parseISO, subDays, isAfter } from 'date-fns'

export function calcSubjectAverage(grades: (number | null)[]): number | null {
  const valid = grades.filter((g): g is number => g != null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

export function calcWeeklyStudyHours(sessions: { date: string; duration_minutes: number }[]): number {
  const cutoff = subDays(new Date(), 7)
  const recent = sessions.filter((s) => isAfter(parseISO(s.date), cutoff))
  const totalMinutes = recent.reduce((sum, s) => sum + s.duration_minutes, 0)
  return totalMinutes / 60
}

export function getDaysUntil(dateStr: string): number {
  const target = parseISO(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return differenceInCalendarDays(target, today)
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx jest __tests__/lib/school-utils.test.ts
```
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add school utilities with tests"
```

---

### Task 3: School hooks

**Files:**
- Create: `mendos/hooks/use-school.ts`

- [ ] **Step 1: Create use-school.ts**

```typescript
// mendos/hooks/use-school.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Subject, Assignment, Exam } from '@/types'
import { format } from 'date-fns'

export function useSubjects() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (error) throw error
      return data as Subject[]
    },
  })

  const createSubject = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('subjects').insert({ user_id: user.id, name, color })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subjects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })

  return { ...query, createSubject, deleteSubject }
}

export function useAssignments() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, subjects(name, color)')
        .order('due_date')
      if (error) throw error
      return data as (Assignment & { subjects: { name: string; color: string } })[]
    },
  })

  const createAssignment = useMutation({
    mutationFn: async (input: { subject_id: string; title: string; due_date: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('assignments').insert({ user_id: user.id, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })

  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Assignment> & { id: string }) => {
      const { error } = await supabase.from('assignments').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assignments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })

  return { ...query, createAssignment, updateAssignment, deleteAssignment }
}

export function useExams() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*, subjects(name, color)')
        .order('date')
      if (error) throw error
      return data as (Exam & { subjects: { name: string; color: string } })[]
    },
  })

  const createExam = useMutation({
    mutationFn: async (input: { subject_id: string; title: string; date: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('exams').insert({ user_id: user.id, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  })

  const updateExam = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Exam> & { id: string }) => {
      const { error } = await supabase.from('exams').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  })

  return { ...query, createExam, updateExam }
}

export function useStudySessions() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['study-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .order('date', { ascending: false })
        .limit(60)
      if (error) throw error
      return data as { id: string; subject_id: string; duration_minutes: number; notes: string | null; date: string }[]
    },
  })

  const logSession = useMutation({
    mutationFn: async ({ subject_id, duration_minutes, notes }: { subject_id: string; duration_minutes: number; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('study_sessions').insert({
        user_id: user.id,
        subject_id,
        duration_minutes,
        notes: notes || null,
        date: format(new Date(), 'yyyy-MM-dd'),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['study-sessions'] }),
  })

  return { ...query, logSession }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add school data hooks"
```

---

### Task 4: School components

**Files:**
- Create: `mendos/components/school/study-timer.tsx`
- Create: `mendos/components/school/assignment-list.tsx`
- Create: `mendos/components/school/exam-list.tsx`
- Create: `mendos/components/school/grade-chart.tsx`
- Create: `mendos/components/school/subject-form.tsx`
- Create: `mendos/components/school/assignment-form.tsx`

- [ ] **Step 1: Create study-timer.tsx**

```typescript
// mendos/components/school/study-timer.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSubjects } from '@/hooks/use-school'
import { useStudySessions } from '@/hooks/use-school'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Timer, Play, Pause, RotateCcw } from 'lucide-react'

const MODES = { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 }
type Mode = keyof typeof MODES

export function StudyTimer() {
  const { data: subjects } = useSubjects()
  const { logSession } = useStudySessions()
  const [mode, setMode] = useState<Mode>('focus')
  const [seconds, setSeconds] = useState(MODES.focus)
  const [running, setRunning] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [sessionsToday, setSessionsToday] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const startedAt = useRef<number>(0)

  useEffect(() => {
    setSeconds(MODES[mode])
    setRunning(false)
  }, [mode])

  useEffect(() => {
    if (running) {
      startedAt.current = Date.now()
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (mode === 'focus' && selectedSubject) {
              logSession.mutate({ subject_id: selectedSubject, duration_minutes: 25 })
              setSessionsToday((n) => n + 1)
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  function reset() {
    setRunning(false)
    setSeconds(MODES[mode])
  }

  const total = MODES[mode]
  const progress = ((total - seconds) / total) * 100
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Timer className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-medium text-white">Study Timer</h3>
        {sessionsToday > 0 && (
          <span className="ml-auto text-xs text-neutral-500">{sessionsToday} sessions today</span>
        )}
      </div>

      <div className="flex gap-1 mb-6">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${mode === m ? 'bg-purple-500/10 text-purple-400' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'}`}
          >
            {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short' : 'Long'}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <ProgressRing
          value={progress}
          size={120}
          strokeWidth={6}
          color={mode === 'focus' ? '#8b5cf6' : '#10b981'}
          showValue={false}
        />
        <div className="absolute text-3xl font-bold text-white tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => setRunning(!running)}
            className={mode === 'focus' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'}
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? 'Pause' : 'Start'}
          </Button>
        </div>

        {mode === 'focus' && subjects && subjects.length > 0 && (
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">Select subject (optional)</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Create assignment-list.tsx**

```typescript
// mendos/components/school/assignment-list.tsx
'use client'

import { useAssignments } from '@/hooks/use-school'
import { Skeleton } from '@/components/ui/skeleton'
import { getDaysUntil } from '@/lib/utils/school-utils'
import { cn } from '@/lib/utils/cn'
import { CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export function AssignmentList() {
  const { data: assignments, isLoading, updateAssignment, deleteAssignment } = useAssignments()

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
  if (!assignments?.length) return <p className="text-xs text-neutral-600 text-center py-8">No assignments yet.</p>

  return (
    <div className="space-y-2">
      {assignments.map((a) => {
        const days = getDaysUntil(a.due_date)
        const urgent = days <= 2 && a.status === 'pending'
        return (
          <div key={a.id} className={cn(
            'group flex items-center gap-3 rounded-xl border p-3 transition-colors',
            a.status === 'graded' ? 'border-white/[0.04] opacity-60' : urgent ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-white/[0.06] hover:border-white/[0.10]'
          )}>
            <button
              onClick={() => updateAssignment.mutate({ id: a.id, status: a.status === 'pending' ? 'submitted' : a.status === 'submitted' ? 'graded' : 'pending' })}
              className={cn('shrink-0 transition-colors', a.status === 'graded' ? 'text-emerald-400' : a.status === 'submitted' ? 'text-blue-400' : urgent ? 'text-red-400' : 'text-neutral-600 hover:text-white')}
            >
              {a.status === 'graded' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm', a.status === 'graded' && 'line-through text-neutral-600')}>{a.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-neutral-500" style={{ color: a.subjects?.color }}>{a.subjects?.name}</span>
                <span className="text-xs text-neutral-600">
                  {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days left`}
                </span>
              </div>
            </div>
            {a.grade != null && (
              <span className="text-sm font-bold text-emerald-400">{a.grade}%</span>
            )}
            <button onClick={() => deleteAssignment.mutate(a.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create grade-chart.tsx**

```typescript
// mendos/components/school/grade-chart.tsx
'use client'

import { useSubjects, useAssignments, useExams } from '@/hooks/use-school'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { calcSubjectAverage } from '@/lib/utils/school-utils'

export function GradeChart() {
  const { data: subjects } = useSubjects()
  const { data: assignments } = useAssignments()
  const { data: exams } = useExams()

  const data = subjects?.map((s) => {
    const aGrades = assignments?.filter((a) => a.subject_id === s.id && a.grade != null).map((a) => a.grade!) ?? []
    const eGrades = exams?.filter((e) => e.subject_id === s.id && e.grade != null).map((e) => e.grade!) ?? []
    const avg = calcSubjectAverage([...aGrades, ...eGrades])
    return { name: s.name, avg: avg != null ? Math.round(avg) : null, color: s.color }
  }).filter((d) => d.avg != null) ?? []

  if (!data.length) return (
    <Card><p className="text-xs text-neutral-600 text-center py-6">Grade data will appear once assignments are graded.</p></Card>
  )

  return (
    <Card>
      <h3 className="text-sm font-medium text-white mb-4">Grade Averages</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={28}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 11 }} />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
            formatter={(v: number) => [`${v}%`, 'Average']}
          />
          <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 4: Create subject-form.tsx**

```typescript
// mendos/components/school/subject-form.tsx
'use client'

import { useState } from 'react'
import { useSubjects } from '@/hooks/use-school'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export function SubjectManager() {
  const { data: subjects, isLoading, createSubject, deleteSubject } = useSubjects()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await createSubject.mutateAsync({ name: name.trim(), color })
    setName('')
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex gap-2 items-center">
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`h-5 w-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white/20 ring-offset-1 ring-offset-[#111]' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Subject name" className="flex-1" />
        <Button type="submit" size="sm" disabled={!name.trim()}>Add</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {subjects?.map((s) => (
          <div key={s.id} className="group flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-neutral-200">{s.name}</span>
            <button onClick={() => deleteSubject.mutate(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              <Trash2 className="h-3 w-3 text-neutral-600 hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create assignment-form.tsx**

```typescript
// mendos/components/school/assignment-form.tsx
'use client'

import { useState } from 'react'
import { useSubjects, useAssignments, useExams } from '@/hooks/use-school'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

interface Props {
  type: 'assignment' | 'exam'
  onClose: () => void
}

export function WorkForm({ type, onClose }: Props) {
  const { data: subjects } = useSubjects()
  const { createAssignment } = useAssignments()
  const { createExam } = useExams()
  const [subjectId, setSubjectId] = useState(subjects?.[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectId || !title.trim()) return
    if (type === 'assignment') {
      await createAssignment.mutateAsync({ subject_id: subjectId, title: title.trim(), due_date: date })
    } else {
      await createExam.mutateAsync({ subject_id: subjectId, title: title.trim(), date })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === 'assignment' ? 'Assignment title' : 'Exam name'} autoFocus required />
      <div className="grid grid-cols-2 gap-3">
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">Select subject</option>
          {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="[color-scheme:dark]" required />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" size="sm" disabled={!title.trim() || !subjectId} className="flex-1">Add {type}</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add school components (timer, lists, charts, forms)"
```

---

### Task 5: AI study plan route

**Files:**
- Create: `mendos/app/api/ai/study-plan/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// mendos/app/api/ai/study-plan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subjects, upcomingExams, pendingAssignments } = await request.json()

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: 'You are a study coach. Create a specific, realistic weekly study plan. Format as a day-by-day schedule with subject and duration.',
        },
        {
          role: 'user',
          content: `Subjects: ${subjects?.map((s: any) => s.name).join(', ') || 'none'}. Upcoming exams: ${upcomingExams?.map((e: any) => `${e.subjects?.name} - ${e.title} on ${e.date}`).join('; ') || 'none'}. Pending assignments: ${pendingAssignments?.length || 0}. Create a 7-day study plan.`,
        },
      ],
    })
    return NextResponse.json({ plan: completion.choices[0].message.content })
  } catch {
    return NextResponse.json({ plan: 'Study plan unavailable. Check your OpenAI key.' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add AI study plan route"
```

---

### Task 6: School page

**Files:**
- Modify: `mendos/app/(dashboard)/school/page.tsx`

- [ ] **Step 1: Replace school page**

```typescript
// mendos/app/(dashboard)/school/page.tsx
'use client'

import { useState } from 'react'
import { useSubjects, useAssignments, useExams, useStudySessions } from '@/hooks/use-school'
import { SubjectManager } from '@/components/school/subject-form'
import { AssignmentList } from '@/components/school/assignment-list'
import { GradeChart } from '@/components/school/grade-chart'
import { StudyTimer } from '@/components/school/study-timer'
import { WorkForm } from '@/components/school/assignment-form'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Plus } from 'lucide-react'
import { calcWeeklyStudyHours } from '@/lib/utils/school-utils'
import { format } from 'date-fns'

const TABS = ['Overview', 'Assignments', 'Exams', 'Timer', 'AI'] as const

export default function SchoolPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Overview')
  const [showAddWork, setShowAddWork] = useState<'assignment' | 'exam' | null>(null)
  const [studyPlan, setStudyPlan] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const { data: subjects } = useSubjects()
  const { data: assignments } = useAssignments()
  const { data: exams } = useExams()
  const { data: sessions } = useStudySessions()

  const weeklyHours = calcWeeklyStudyHours(sessions ?? [])
  const pending = assignments?.filter((a) => a.status === 'pending').length ?? 0
  const upcomingExams = exams?.filter((e) => e.status === 'upcoming') ?? []

  async function getStudyPlan() {
    setPlanLoading(true)
    try {
      const res = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects, upcomingExams: upcomingExams.slice(0, 5), pendingAssignments: assignments?.filter(a => a.status === 'pending') }),
      })
      const data = await res.json()
      setStudyPlan(data.plan)
    } finally {
      setPlanLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${tab === t ? 'bg-purple-500/10 text-purple-400' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'}`}
            >{t}</button>
          ))}
        </div>
        {(tab === 'Assignments' || tab === 'Exams') && (
          <Button size="sm" onClick={() => setShowAddWork(tab === 'Assignments' ? 'assignment' : 'exam')}>
            <Plus className="h-4 w-4" />{tab === 'Assignments' ? 'Add Assignment' : 'Add Exam'}
          </Button>
        )}
      </div>

      {showAddWork && (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-5">
          <h3 className="text-sm font-medium text-white mb-4">New {showAddWork}</h3>
          <WorkForm type={showAddWork} onClose={() => setShowAddWork(null)} />
        </div>
      )}

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Study Hours" value={weeklyHours.toFixed(1)} unit="this week" color="#8b5cf6" />
            <StatCard label="Pending" value={pending} unit="assignments" color="#f59e0b" />
            <StatCard label="Upcoming Exams" value={upcomingExams.length} color="#ef4444" />
            <StatCard label="Subjects" value={subjects?.length ?? 0} color="#3b82f6" />
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-4">
            <h3 className="text-xs text-neutral-400 mb-3 uppercase tracking-wide">Subjects</h3>
            <SubjectManager />
          </div>
          <GradeChart />
        </div>
      )}

      {tab === 'Assignments' && <AssignmentList />}

      {tab === 'Exams' && (
        <div className="space-y-2">
          {upcomingExams.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111111] p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{e.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: e.subjects?.color }}>{e.subjects?.name}</span>
                  <span className="text-xs text-neutral-600">{format(new Date(e.date), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          ))}
          {!upcomingExams.length && <p className="text-xs text-neutral-600 text-center py-8">No upcoming exams.</p>}
        </div>
      )}

      {tab === 'Timer' && (
        <div className="max-w-sm mx-auto">
          <StudyTimer />
        </div>
      )}

      {tab === 'AI' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">AI Study Plan</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Personalized weekly schedule based on your subjects and deadlines</p>
            </div>
            <Button size="sm" onClick={getStudyPlan} disabled={planLoading}>
              {planLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {planLoading ? 'Generating...' : 'Generate Plan'}
            </Button>
          </div>
          {studyPlan && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-5">
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">{studyPlan}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npx jest
```
Expected: All pass

- [ ] **Step 3: Verify in browser**

Open `/school`. Add subjects, assignments, exams. Run the study timer. Check grade chart. Generate AI study plan.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: Phase 4 complete — school tracker with timer and AI study plan"
```

---

**Phase 4 complete.** Subjects, assignments, exams, study sessions, Pomodoro timer, grade charts, and AI study plan generator.

**Next:** Run Phase 5 plan → `docs/superpowers/plans/2026-05-11-mendos-phase5.md`
