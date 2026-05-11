# MendOS Phase 3B — Gym + Fitness Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a gym tracker with workout logging, exercise tracking, bodyweight trend, strength progression charts, and AI workout suggestions.

**Architecture:** Workouts and exercises stored in Supabase with a parent-child relationship (workout → exercises). Analytics computed client-side from query data. AI suggestions call gpt-4o-mini with recent workout history as context.

**Tech Stack:** Next.js 14 App Router, Supabase, TanStack Query v5, Recharts, OpenAI (gpt-4o-mini)

---

## File Structure

```
app/(dashboard)/gym/page.tsx

components/gym/
├── workout-form.tsx
├── workout-list.tsx
├── strength-chart.tsx
├── bodyweight-chart.tsx
└── volume-chart.tsx

hooks/use-gym.ts
lib/utils/gym-utils.ts
app/api/ai/workout-suggestions/route.ts
supabase/migrations/004_gym_schema.sql
__tests__/lib/gym-utils.test.ts
```

---

### Task 1: Database migration

**Files:**
- Create: `mendos/supabase/migrations/004_gym_schema.sql`

- [ ] **Step 1: Create migration**

```sql
-- mendos/supabase/migrations/004_gym_schema.sql

create table if not exists public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null default current_date,
  type text not null default 'strength'
    check (type in ('strength','cardio','flexibility','other')),
  duration int not null default 60,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.workout_exercises (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts on delete cascade not null,
  name text not null,
  sets int not null default 3,
  reps int not null default 10,
  weight numeric(6,2),
  order_index int not null default 0
);

create table if not exists public.bodyweight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  weight numeric(5,1) not null,
  unique(user_id, date)
);

create table if not exists public.cardio_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null default current_date,
  type text not null default 'run',
  duration int not null,
  distance numeric(5,2),
  calories int
);

alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.bodyweight_logs enable row level security;
alter table public.cardio_logs enable row level security;

create policy "Users own their workouts" on public.workouts for all using (user_id = auth.uid());
create policy "Users own their workout exercises" on public.workout_exercises for all
  using (workout_id in (select id from public.workouts where user_id = auth.uid()));
create policy "Users own their bodyweight logs" on public.bodyweight_logs for all using (user_id = auth.uid());
create policy "Users own their cardio logs" on public.cardio_logs for all using (user_id = auth.uid());
```

- [ ] **Step 2: Apply in Supabase SQL Editor**

- [ ] **Step 3: Commit**

```bash
cd /Users/andremendes/Batman/MendOS/mendos
git add supabase/
git commit -m "feat: add gym schema migration"
```

---

### Task 2: Gym utilities and tests

**Files:**
- Create: `mendos/lib/utils/gym-utils.ts`
- Create: `mendos/__tests__/lib/gym-utils.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// mendos/__tests__/lib/gym-utils.test.ts
import { calcTotalVolume, calcWeeklyWorkouts, getStrengthProgress } from '@/lib/utils/gym-utils'

describe('calcTotalVolume', () => {
  it('returns 0 for empty list', () => {
    expect(calcTotalVolume([])).toBe(0)
  })
  it('sums sets * reps * weight', () => {
    const exercises = [
      { sets: 3, reps: 10, weight: 100 },
      { sets: 3, reps: 8, weight: 80 },
    ]
    expect(calcTotalVolume(exercises)).toBe(3 * 10 * 100 + 3 * 8 * 80)
  })
  it('skips exercises with null weight', () => {
    const exercises = [{ sets: 3, reps: 10, weight: null }]
    expect(calcTotalVolume(exercises)).toBe(0)
  })
})

describe('calcWeeklyWorkouts', () => {
  it('returns 0 for empty list', () => {
    expect(calcWeeklyWorkouts([])).toBe(0)
  })
  it('counts workouts in last 7 days', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoWeeksAgo = new Date(today)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const workouts = [
      { date: today.toISOString().split('T')[0] },
      { date: yesterday.toISOString().split('T')[0] },
      { date: twoWeeksAgo.toISOString().split('T')[0] },
    ]
    expect(calcWeeklyWorkouts(workouts)).toBe(2)
  })
})

describe('getStrengthProgress', () => {
  it('returns empty array for missing exercise', () => {
    expect(getStrengthProgress([], 'Bench Press')).toEqual([])
  })
  it('returns max weight per date for given exercise', () => {
    const data = [
      { date: '2026-01-01', name: 'Bench Press', weight: 80, sets: 3, reps: 10 },
      { date: '2026-01-01', name: 'Bench Press', weight: 85, sets: 1, reps: 5 },
      { date: '2026-01-08', name: 'Bench Press', weight: 90, sets: 3, reps: 8 },
    ]
    const result = getStrengthProgress(data, 'Bench Press')
    expect(result).toEqual([
      { date: '2026-01-01', weight: 85 },
      { date: '2026-01-08', weight: 90 },
    ])
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npx jest __tests__/lib/gym-utils.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create gym-utils.ts**

```typescript
// mendos/lib/utils/gym-utils.ts
import { subDays, parseISO, isAfter } from 'date-fns'

export function calcTotalVolume(
  exercises: { sets: number; reps: number; weight: number | null }[]
): number {
  return exercises.reduce((total, ex) => {
    if (ex.weight == null) return total
    return total + ex.sets * ex.reps * ex.weight
  }, 0)
}

export function calcWeeklyWorkouts(workouts: { date: string }[]): number {
  const cutoff = subDays(new Date(), 7)
  return workouts.filter((w) => isAfter(parseISO(w.date), cutoff)).length
}

export function getStrengthProgress(
  exercises: { date: string; name: string; weight: number | null; sets: number; reps: number }[],
  exerciseName: string
): { date: string; weight: number }[] {
  const filtered = exercises.filter(
    (e) => e.name.toLowerCase() === exerciseName.toLowerCase() && e.weight != null
  )

  const byDate: Record<string, number> = {}
  for (const e of filtered) {
    byDate[e.date] = Math.max(byDate[e.date] ?? 0, e.weight!)
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight]) => ({ date, weight }))
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx jest __tests__/lib/gym-utils.test.ts
```
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add gym utilities with tests"
```

---

### Task 3: Gym hooks

**Files:**
- Create: `mendos/hooks/use-gym.ts`

- [ ] **Step 1: Create use-gym.ts**

```typescript
// mendos/hooks/use-gym.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Workout, WorkoutExercise } from '@/types'
import { format } from 'date-fns'

export function useWorkouts(limit = 30) {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['workouts', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_exercises(*)')
        .order('date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as (Workout & { workout_exercises: WorkoutExercise[] })[]
    },
  })

  const logWorkout = useMutation({
    mutationFn: async ({
      workout,
      exercises,
    }: {
      workout: Omit<Workout, 'id' | 'user_id' | 'created_at'>
      exercises: Omit<WorkoutExercise, 'id' | 'workout_id'>[]
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: w, error: we } = await supabase
        .from('workouts')
        .insert({ user_id: user.id, ...workout })
        .select()
        .single()
      if (we) throw we

      if (exercises.length > 0) {
        const { error: ee } = await supabase.from('workout_exercises').insert(
          exercises.map((e, i) => ({ workout_id: w.id, order_index: i, ...e }))
        )
        if (ee) throw ee
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })

  const deleteWorkout = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workouts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })

  return { ...query, logWorkout, deleteWorkout }
}

export function useBodyweight() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['bodyweight'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bodyweight_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(90)
      if (error) throw error
      return data as { id: string; date: string; weight: number }[]
    },
  })

  const logWeight = useMutation({
    mutationFn: async (weight: number) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const today = format(new Date(), 'yyyy-MM-dd')
      const { error } = await supabase.from('bodyweight_logs').upsert(
        { user_id: user.id, date: today, weight },
        { onConflict: 'user_id,date' }
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bodyweight'] }),
  })

  return { ...query, logWeight }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add gym data hooks"
```

---

### Task 4: Gym components

**Files:**
- Create: `mendos/components/gym/workout-form.tsx`
- Create: `mendos/components/gym/workout-list.tsx`
- Create: `mendos/components/gym/strength-chart.tsx`
- Create: `mendos/components/gym/bodyweight-chart.tsx`
- Create: `mendos/components/gym/volume-chart.tsx`

- [ ] **Step 1: Create workout-form.tsx**

```typescript
// mendos/components/gym/workout-form.tsx
'use client'

import { useState } from 'react'
import { useWorkouts } from '@/hooks/use-gym'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface ExerciseRow {
  name: string
  sets: string
  reps: string
  weight: string
}

interface WorkoutFormProps {
  onClose: () => void
}

export function WorkoutForm({ onClose }: WorkoutFormProps) {
  const { logWorkout } = useWorkouts()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [type, setType] = useState<'strength' | 'cardio' | 'flexibility' | 'other'>('strength')
  const [duration, setDuration] = useState('60')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<ExerciseRow[]>([
    { name: '', sets: '3', reps: '10', weight: '' },
  ])

  function addExercise() {
    setExercises((prev) => [...prev, { name: '', sets: '3', reps: '10', weight: '' }])
  }

  function removeExercise(i: number) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateExercise(i: number, key: keyof ExerciseRow, value: string) {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await logWorkout.mutateAsync({
      workout: {
        date,
        type,
        duration: parseInt(duration) || 60,
        notes: notes || null,
      },
      exercises: exercises
        .filter((e) => e.name.trim())
        .map((e) => ({
          name: e.name.trim(),
          sets: parseInt(e.sets) || 3,
          reps: parseInt(e.reps) || 10,
          weight: e.weight ? parseFloat(e.weight) : null,
        })),
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="[color-scheme:dark]" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none capitalize"
          >
            {['strength', 'cardio', 'flexibility', 'other'].map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Duration (min)</label>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" max="300" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-neutral-400">Exercises</label>
          <button type="button" onClick={addExercise} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            + Add exercise
          </button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-neutral-600 px-1">
            <span className="col-span-5">Exercise</span>
            <span className="col-span-2 text-center">Sets</span>
            <span className="col-span-2 text-center">Reps</span>
            <span className="col-span-2 text-center">kg</span>
            <span className="col-span-1" />
          </div>
          {exercises.map((ex, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input value={ex.name} onChange={(e) => updateExercise(i, 'name', e.target.value)} placeholder="e.g. Bench Press" className="col-span-5" />
              <Input type="number" value={ex.sets} onChange={(e) => updateExercise(i, 'sets', e.target.value)} min="1" max="20" className="col-span-2 text-center" />
              <Input type="number" value={ex.reps} onChange={(e) => updateExercise(i, 'reps', e.target.value)} min="1" max="100" className="col-span-2 text-center" />
              <Input type="number" value={ex.weight} onChange={(e) => updateExercise(i, 'weight', e.target.value)} placeholder="—" step="0.5" className="col-span-2 text-center" />
              <button type="button" onClick={() => removeExercise(i)} className="col-span-1 flex justify-center">
                <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? PRs? Focus areas?"
          rows={2}
          className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/50 transition-all"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" size="sm" disabled={logWorkout.isPending} className="flex-1">
          {logWorkout.isPending ? 'Saving...' : 'Log Workout'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create bodyweight-chart.tsx**

```typescript
// mendos/components/gym/bodyweight-chart.tsx
'use client'

import { useState } from 'react'
import { useBodyweight } from '@/hooks/use-gym'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { Scale } from 'lucide-react'

export function BodyweightChart() {
  const { data: logs, isLoading, logWeight } = useBodyweight()
  const [input, setInput] = useState('')

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    const w = parseFloat(input)
    if (isNaN(w) || w <= 0) return
    await logWeight.mutateAsync(w)
    setInput('')
  }

  const chartData = [...(logs ?? [])]
    .reverse()
    .slice(-30)
    .map((l) => ({ date: format(new Date(l.date), 'M/d'), weight: l.weight }))

  const latest = logs?.[0]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-white">Bodyweight</h3>
        </div>
        {latest && (
          <span className="text-lg font-bold text-emerald-400">{latest.weight} kg</span>
        )}
      </div>

      <form onSubmit={handleLog} className="flex gap-2 mb-4">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Log today's weight (kg)"
          step="0.1"
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-emerald-500/40 transition-colors"
        />
        <Button type="submit" size="sm" variant="outline" disabled={!input}>Log</Button>
      </form>

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
            />
            <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
```

- [ ] **Step 3: Create strength-chart.tsx**

```typescript
// mendos/components/gym/strength-chart.tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getStrengthProgress } from '@/lib/utils/gym-utils'
import { format } from 'date-fns'

interface Props {
  exercises: { date: string; name: string; weight: number | null; sets: number; reps: number }[]
  exerciseNames: string[]
}

export function StrengthChart({ exercises, exerciseNames }: Props) {
  const [selected, setSelected] = useState(exerciseNames[0] ?? '')

  const data = getStrengthProgress(exercises, selected).map((d) => ({
    date: format(new Date(d.date), 'M/d'),
    weight: d.weight,
  }))

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Strength Progress</h3>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-2 py-1 text-xs text-white outline-none"
        >
          {exerciseNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
              formatter={(v: number) => [`${v} kg`, 'Weight']}
            />
            <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-xs text-neutral-600 text-center py-8">No data for {selected}</p>
      )}
    </Card>
  )
}
```

- [ ] **Step 4: Create volume-chart.tsx**

```typescript
// mendos/components/gym/volume-chart.tsx
'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { calcTotalVolume } from '@/lib/utils/gym-utils'
import { format, subDays } from 'date-fns'

interface Props {
  workouts: { date: string; workout_exercises: { sets: number; reps: number; weight: number | null }[] }[]
}

export function VolumeChart({ workouts }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE') }
  })

  const data = days.map((day) => {
    const dayWorkouts = workouts.filter((w) => w.date === day.date)
    const volume = dayWorkouts.reduce(
      (sum, w) => sum + calcTotalVolume(w.workout_exercises),
      0
    )
    return { label: day.label, Volume: Math.round(volume) }
  })

  return (
    <Card>
      <h3 className="text-sm font-medium text-white mb-4">Weekly Volume (kg)</h3>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} barSize={20}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 11 }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
          />
          <Bar dataKey="Volume" fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 5: Create workout-list.tsx**

```typescript
// mendos/components/gym/workout-list.tsx
'use client'

import { useWorkouts } from '@/hooks/use-gym'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Dumbbell } from 'lucide-react'
import { format } from 'date-fns'
import { calcTotalVolume } from '@/lib/utils/gym-utils'

export function WorkoutList() {
  const { data: workouts, isLoading, deleteWorkout } = useWorkouts()

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
  if (!workouts?.length) return (
    <div className="flex flex-col items-center py-16 text-center">
      <Dumbbell className="h-10 w-10 text-neutral-700 mb-3" />
      <p className="text-sm text-neutral-500">No workouts logged yet</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {workouts.map((w) => (
        <div key={w.id} className="group rounded-xl border border-white/[0.06] bg-[#111111] p-4 hover:border-white/[0.10] transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-emerald-400 capitalize">{w.type}</span>
                <span className="text-xs text-neutral-600">{w.duration} min</span>
              </div>
              <p className="text-xs text-neutral-500">{format(new Date(w.date), 'EEEE, MMM d yyyy')}</p>
            </div>
            <div className="flex items-center gap-3">
              {w.workout_exercises.length > 0 && (
                <span className="text-xs text-neutral-600">
                  {Math.round(calcTotalVolume(w.workout_exercises)).toLocaleString()} kg vol
                </span>
              )}
              <button onClick={() => deleteWorkout.mutate(w.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
          {w.workout_exercises.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {w.workout_exercises.map((ex) => (
                <span key={ex.id} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs text-neutral-400">
                  {ex.name} {ex.sets}×{ex.reps}{ex.weight ? ` @ ${ex.weight}kg` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add gym components (form, charts, list)"
```

---

### Task 5: AI workout suggestions route

**Files:**
- Create: `mendos/app/api/ai/workout-suggestions/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// mendos/app/api/ai/workout-suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workouts } = await request.json()

  const summary = workouts
    .slice(0, 8)
    .map((w: any) => `${w.date}: ${w.type} (${w.duration}min), exercises: ${w.workout_exercises.map((e: any) => `${e.name} ${e.sets}x${e.reps}${e.weight ? ` @${e.weight}kg` : ''}`).join(', ')}`)
    .join('\n')

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: 'You are an expert strength and conditioning coach. Based on the user\'s recent workout history, suggest the optimal next workout session. Be specific about exercises, sets, reps, and weights. Also note any recovery concerns.',
        },
        {
          role: 'user',
          content: `My recent workouts:\n${summary || 'No workouts logged yet.'}\n\nWhat should my next workout look like?`,
        },
      ],
    })
    return NextResponse.json({ suggestion: completion.choices[0].message.content })
  } catch {
    return NextResponse.json({ suggestion: 'Consider a full-body session with compound movements: squat, bench press, and deadlift at moderate intensity with proper rest days.' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add AI workout suggestions route"
```

---

### Task 6: Gym page

**Files:**
- Modify: `mendos/app/(dashboard)/gym/page.tsx`

- [ ] **Step 1: Replace gym page**

```typescript
// mendos/app/(dashboard)/gym/page.tsx
'use client'

import { useState } from 'react'
import { useWorkouts, useBodyweight } from '@/hooks/use-gym'
import { WorkoutForm } from '@/components/gym/workout-form'
import { WorkoutList } from '@/components/gym/workout-list'
import { BodyweightChart } from '@/components/gym/bodyweight-chart'
import { StrengthChart } from '@/components/gym/strength-chart'
import { VolumeChart } from '@/components/gym/volume-chart'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Sparkles, Loader2 } from 'lucide-react'
import { calcWeeklyWorkouts } from '@/lib/utils/gym-utils'

const TABS = ['Overview', 'Workouts', 'AI Coach'] as const

export default function GymPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Overview')
  const [showForm, setShowForm] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const { data: workouts, isLoading } = useWorkouts()

  const allExercises = workouts?.flatMap((w) =>
    w.workout_exercises.map((e) => ({ ...e, date: w.date }))
  ) ?? []
  const exerciseNames = [...new Set(allExercises.map((e) => e.name))].slice(0, 10)
  const weeklyCount = calcWeeklyWorkouts(workouts?.map((w) => ({ date: w.date })) ?? [])
  const totalWorkouts = workouts?.length ?? 0

  async function getAISuggestion() {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/workout-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workouts: workouts?.slice(0, 8) ?? [] }),
      })
      const data = await res.json()
      setAiSuggestion(data.suggestion)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${tab === t ? 'bg-emerald-500/10 text-emerald-400' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'}`}
            >{t}</button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />Log Workout
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-5">
          <h3 className="text-sm font-medium text-white mb-4">Log New Workout</h3>
          <WorkoutForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="This Week" value={weeklyCount} unit="workouts" color="#10b981" />
            <StatCard label="Total Workouts" value={totalWorkouts} color="#3b82f6" />
            <StatCard label="Current Weight" value={`—`} color="#f59e0b" />
            <StatCard label="Streak" value="—" unit="days" color="#8b5cf6" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BodyweightChart />
            <VolumeChart workouts={workouts ?? []} />
          </div>
          {exerciseNames.length > 0 && (
            <StrengthChart exercises={allExercises} exerciseNames={exerciseNames} />
          )}
        </div>
      )}

      {tab === 'Workouts' && <WorkoutList />}

      {tab === 'AI Coach' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">AI Workout Suggestion</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Based on your recent training history</p>
            </div>
            <Button size="sm" onClick={getAISuggestion} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? 'Thinking...' : 'Get Suggestion'}
            </Button>
          </div>
          {aiSuggestion && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">{aiSuggestion}</p>
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

- [ ] **Step 3: Verify in browser — open `/gym`**

Log a workout with exercises, see it appear in list and volume chart. Log bodyweight. Switch to AI Coach tab.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: Phase 3B complete — gym tracker with strength charts and AI suggestions"
```

---

**Phase 3B complete.** Workout logging, exercise tracking, strength progression, bodyweight trend, volume chart, and AI suggestions.

**Next:** Run Phase 4 plan → `docs/superpowers/plans/2026-05-11-mendos-phase4.md`
