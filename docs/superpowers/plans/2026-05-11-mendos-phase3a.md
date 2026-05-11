# MendOS Phase 3A — Golf Performance Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a golf performance tracker with round logging, analytics charts (score trend, GIR/fairways/putts bar, weakness radar), and an AI golf coach chat interface.

**Architecture:** Golf rounds stored in Supabase. Analytics computed client-side from query results with Recharts. AI coach is a chat interface backed by a streaming-capable API route using gpt-4o-mini with a golf-specialist system prompt.

**Tech Stack:** Next.js 14 App Router, Supabase, TanStack Query v5, Recharts, OpenAI (gpt-4o-mini)

---

## File Structure

```
app/(dashboard)/golf/
├── page.tsx                      ← golf dashboard with tabs
└── log/page.tsx                  ← round log form

components/golf/
├── round-form.tsx
├── round-list.tsx
├── score-chart.tsx
├── stats-chart.tsx
├── weakness-radar.tsx
└── coach-chat.tsx

hooks/
├── use-golf-rounds.ts
└── use-golf-stats.ts

lib/utils/golf-utils.ts
app/api/ai/golf-coach/route.ts
supabase/migrations/003_golf_schema.sql
__tests__/lib/golf-utils.test.ts
```

---

### Task 1: Database migration

**Files:**
- Create: `mendos/supabase/migrations/003_golf_schema.sql`

- [ ] **Step 1: Create migration**

```sql
-- mendos/supabase/migrations/003_golf_schema.sql

create table if not exists public.golf_rounds (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null default current_date,
  course text not null,
  score int not null,
  fairways_hit int not null default 0,
  fairways_total int not null default 14,
  gir int not null default 0,
  putts int not null default 36,
  scrambling int,
  penalties int not null default 0,
  driving_distance int,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.golf_coach_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.golf_rounds enable row level security;
alter table public.golf_coach_messages enable row level security;

create policy "Users own their golf rounds"
  on public.golf_rounds for all using (user_id = auth.uid());
create policy "Users own their golf coach messages"
  on public.golf_coach_messages for all using (user_id = auth.uid());
```

- [ ] **Step 2: Apply in Supabase SQL Editor**

- [ ] **Step 3: Commit**

```bash
cd /Users/andremendes/Batman/MendOS/mendos
git add supabase/
git commit -m "feat: add golf schema migration"
```

---

### Task 2: Golf utilities and tests

**Files:**
- Create: `mendos/lib/utils/golf-utils.ts`
- Create: `mendos/__tests__/lib/golf-utils.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// mendos/__tests__/lib/golf-utils.test.ts
import {
  calcFairwayPct,
  calcGIRPct,
  calcPuttsPerHole,
  scoreRelativeToPar,
  buildWeaknessScores,
} from '@/lib/utils/golf-utils'

describe('calcFairwayPct', () => {
  it('returns 50 when half are hit', () => {
    expect(calcFairwayPct(7, 14)).toBe(50)
  })
  it('returns 0 when total is 0', () => {
    expect(calcFairwayPct(0, 0)).toBe(0)
  })
})

describe('calcGIRPct', () => {
  it('returns 100 when all 18 hit', () => {
    expect(calcGIRPct(18)).toBe(100)
  })
})

describe('calcPuttsPerHole', () => {
  it('returns 2 for 36 putts over 18 holes', () => {
    expect(calcPuttsPerHole(36)).toBeCloseTo(2)
  })
})

describe('scoreRelativeToPar', () => {
  it('returns +4 for 76 on a par 72', () => {
    expect(scoreRelativeToPar(76, 72)).toBe(4)
  })
  it('returns -2 for 70 on a par 72', () => {
    expect(scoreRelativeToPar(70, 72)).toBe(-2)
  })
})

describe('buildWeaknessScores', () => {
  it('returns scores between 0 and 100', () => {
    const rounds = [
      { fairways_hit: 7, fairways_total: 14, gir: 9, putts: 32, scrambling: 60, score: 80 },
    ]
    const scores = buildWeaknessScores(rounds)
    Object.values(scores).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    })
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npx jest __tests__/lib/golf-utils.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create golf-utils.ts**

```typescript
// mendos/lib/utils/golf-utils.ts
import type { GolfRound } from '@/types'

export function calcFairwayPct(hit: number, total: number): number {
  if (total === 0) return 0
  return Math.round((hit / total) * 100)
}

export function calcGIRPct(gir: number, holes = 18): number {
  return Math.round((gir / holes) * 100)
}

export function calcPuttsPerHole(putts: number, holes = 18): number {
  return putts / holes
}

export function scoreRelativeToPar(score: number, par = 72): number {
  return score - par
}

export function buildWeaknessScores(
  rounds: Pick<GolfRound, 'fairways_hit' | 'fairways_total' | 'gir' | 'putts' | 'scrambling' | 'score'>[]
): Record<string, number> {
  if (rounds.length === 0) {
    return { Driving: 50, Approach: 50, Putting: 50, 'Short Game': 50, Scoring: 50 }
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  const fairwayPcts = rounds.map((r) => calcFairwayPct(r.fairways_hit, r.fairways_total))
  const girPcts = rounds.map((r) => calcGIRPct(r.gir))
  const puttsPerHole = rounds.map((r) => calcPuttsPerHole(r.putts))
  const scramblingPcts = rounds.filter((r) => r.scrambling != null).map((r) => r.scrambling!)
  const avgScore = avg(rounds.map((r) => r.score))

  const scoringScore = Math.max(0, Math.min(100, Math.round(100 - (avgScore - 72) * 3)))
  const drivingScore = Math.round(avg(fairwayPcts))
  const approachScore = Math.round(avg(girPcts))
  const puttingScore = Math.max(0, Math.min(100, Math.round(100 - (avg(puttsPerHole) - 1.5) * 40)))
  const shortGameScore = scramblingPcts.length > 0 ? Math.round(avg(scramblingPcts)) : 50

  return {
    Driving: drivingScore,
    Approach: approachScore,
    Putting: puttingScore,
    'Short Game': shortGameScore,
    Scoring: scoringScore,
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx jest __tests__/lib/golf-utils.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add golf utilities with tests"
```

---

### Task 3: Golf hooks

**Files:**
- Create: `mendos/hooks/use-golf-rounds.ts`

- [ ] **Step 1: Create use-golf-rounds.ts**

```typescript
// mendos/hooks/use-golf-rounds.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { GolfRound } from '@/types'

export function useGolfRounds(limit = 20) {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['golf-rounds', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_rounds')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as GolfRound[]
    },
  })

  const logRound = useMutation({
    mutationFn: async (
      input: Omit<GolfRound, 'id' | 'user_id' | 'created_at'>
    ) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('golf_rounds').insert({
        user_id: user.id,
        ...input,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['golf-rounds'] }),
  })

  const deleteRound = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('golf_rounds').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['golf-rounds'] }),
  })

  return { ...query, logRound, deleteRound }
}

export function useGolfCoachMessages() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['golf-coach-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_coach_messages')
        .select('*')
        .order('created_at')
        .limit(50)
      if (error) throw error
      return data as { id: string; role: string; content: string; created_at: string }[]
    },
  })

  const addMessage = useMutation({
    mutationFn: async ({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('golf_coach_messages')
        .insert({ user_id: user.id, role, content })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['golf-coach-messages'] }),
  })

  return { ...query, addMessage }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add golf data hooks"
```

---

### Task 4: Golf components

**Files:**
- Create: `mendos/components/golf/round-form.tsx`
- Create: `mendos/components/golf/round-list.tsx`
- Create: `mendos/components/golf/score-chart.tsx`
- Create: `mendos/components/golf/stats-chart.tsx`
- Create: `mendos/components/golf/weakness-radar.tsx`
- Create: `mendos/components/golf/coach-chat.tsx`

- [ ] **Step 1: Create round-form.tsx**

```typescript
// mendos/components/golf/round-form.tsx
'use client'

import { useState } from 'react'
import { useGolfRounds } from '@/hooks/use-golf-rounds'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

interface RoundFormProps {
  onClose: () => void
}

export function RoundForm({ onClose }: RoundFormProps) {
  const { logRound } = useGolfRounds()
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    course: '',
    score: '',
    fairways_hit: '',
    fairways_total: '14',
    gir: '',
    putts: '',
    scrambling: '',
    penalties: '0',
    driving_distance: '',
    notes: '',
  })

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await logRound.mutateAsync({
      date: form.date,
      course: form.course,
      score: parseInt(form.score),
      fairways_hit: parseInt(form.fairways_hit) || 0,
      fairways_total: parseInt(form.fairways_total) || 14,
      gir: parseInt(form.gir) || 0,
      putts: parseInt(form.putts) || 36,
      scrambling: form.scrambling ? parseInt(form.scrambling) : null,
      penalties: parseInt(form.penalties) || 0,
      driving_distance: form.driving_distance ? parseInt(form.driving_distance) : null,
      notes: form.notes || null,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Date</label>
          <Input type="date" value={form.date} onChange={set('date')} className="[color-scheme:dark]" required />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Course</label>
          <Input value={form.course} onChange={set('course')} placeholder="Course name" required />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Score</label>
          <Input type="number" value={form.score} onChange={set('score')} placeholder="e.g. 82" required min="50" max="150" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Putts</label>
          <Input type="number" value={form.putts} onChange={set('putts')} placeholder="36" min="0" max="72" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Fairways Hit</label>
          <Input type="number" value={form.fairways_hit} onChange={set('fairways_hit')} placeholder="7" min="0" max="14" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">GIR</label>
          <Input type="number" value={form.gir} onChange={set('gir')} placeholder="9" min="0" max="18" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Scrambling %</label>
          <Input type="number" value={form.scrambling} onChange={set('scrambling')} placeholder="50" min="0" max="100" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Penalties</label>
          <Input type="number" value={form.penalties} onChange={set('penalties')} placeholder="0" min="0" max="20" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Drive Distance (yds)</label>
          <Input type="number" value={form.driving_distance} onChange={set('driving_distance')} placeholder="250" min="100" max="400" />
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Notes</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          placeholder="Course conditions, key moments..."
          rows={2}
          className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/50 transition-all"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" size="sm" disabled={logRound.isPending} className="flex-1">
          {logRound.isPending ? 'Saving...' : 'Log Round'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create score-chart.tsx**

```typescript
// mendos/components/golf/score-chart.tsx
'use client'

import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import type { GolfRound } from '@/types'

export function ScoreChart({ rounds }: { rounds: GolfRound[] }) {
  const data = [...rounds]
    .reverse()
    .slice(-20)
    .map((r) => ({
      date: format(new Date(r.date), 'MMM d'),
      Score: r.score,
    }))

  return (
    <Card>
      <h3 className="text-sm font-medium text-white mb-4">Score Trend</h3>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, bottom: 0, left: 0, right: 8 }}>
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
          <YAxis domain={['dataMin - 4', 'dataMax + 4']} hide />
          <ReferenceLine y={72} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
          />
          <Line
            type="monotone"
            dataKey="Score"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 3: Create stats-chart.tsx**

```typescript
// mendos/components/golf/stats-chart.tsx
'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { calcFairwayPct, calcGIRPct } from '@/lib/utils/golf-utils'
import { format } from 'date-fns'
import type { GolfRound } from '@/types'

export function StatsChart({ rounds }: { rounds: GolfRound[] }) {
  const data = [...rounds]
    .reverse()
    .slice(-10)
    .map((r) => ({
      date: format(new Date(r.date), 'M/d'),
      'FW%': calcFairwayPct(r.fairways_hit, r.fairways_total),
      'GIR%': calcGIRPct(r.gir),
      Putts: r.putts,
    }))

  return (
    <Card>
      <h3 className="text-sm font-medium text-white mb-4">Stats (Last 10 Rounds)</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={12} barCategoryGap="30%">
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
          />
          <Bar dataKey="FW%" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="GIR%" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 4: Create weakness-radar.tsx**

```typescript
// mendos/components/golf/weakness-radar.tsx
'use client'

import { Card } from '@/components/ui/card'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { buildWeaknessScores } from '@/lib/utils/golf-utils'
import type { GolfRound } from '@/types'

export function WeaknessRadar({ rounds }: { rounds: GolfRound[] }) {
  const scores = buildWeaknessScores(rounds)
  const data = Object.entries(scores).map(([subject, A]) => ({ subject, A }))

  return (
    <Card>
      <h3 className="text-sm font-medium text-white mb-2">Weakness Analysis</h3>
      <p className="text-xs text-neutral-500 mb-4">Higher = stronger area</p>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11 }} />
          <Radar dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 5: Create coach-chat.tsx**

```typescript
// mendos/components/golf/coach-chat.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useGolfCoachMessages, useGolfRounds } from '@/hooks/use-golf-rounds'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function CoachChat() {
  const { data: messages, isLoading: loadingMessages, addMessage } = useGolfCoachMessages()
  const { data: rounds } = useGolfRounds(10)
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || aiLoading) return
    const userMsg = input.trim()
    setInput('')
    setAiLoading(true)

    await addMessage.mutateAsync({ role: 'user', content: userMsg })

    try {
      const res = await fetch('/api/ai/golf-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, rounds: rounds ?? [] }),
      })
      const data = await res.json()
      await addMessage.mutateAsync({ role: 'assistant', content: data.reply })
    } catch {
      await addMessage.mutateAsync({
        role: 'assistant',
        content: 'I had trouble connecting. Please try again.',
      })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[500px] rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <Bot className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-medium text-white">Golf Coach</span>
        <span className="ml-auto text-xs text-neutral-600">Powered by GPT-4o-mini</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingMessages ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-2/3 ml-auto" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-8 w-8 text-amber-400/30 mb-3" />
            <p className="text-sm text-neutral-500">Ask your golf coach anything</p>
            <p className="text-xs text-neutral-600 mt-1">
              e.g. "What are my biggest weaknesses?" or "Give me a putting drill"
            </p>
          </div>
        ) : (
          messages?.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'bg-white/[0.06] text-neutral-200'
              )}
            >
              {msg.content}
            </div>
          ))
        )}
        {aiLoading && (
          <div className="max-w-[80%] rounded-xl px-3.5 py-2.5 bg-white/[0.06]">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0ms]" />
              <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:150ms]" />
              <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-white/[0.06]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your golf coach..."
          className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/30 transition-colors"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || aiLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Create round-list.tsx**

```typescript
// mendos/components/golf/round-list.tsx
'use client'

import { useGolfRounds } from '@/hooks/use-golf-rounds'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Target } from 'lucide-react'
import { calcFairwayPct, calcGIRPct } from '@/lib/utils/golf-utils'
import { format } from 'date-fns'

export function RoundList() {
  const { data: rounds, isLoading, deleteRound } = useGolfRounds()

  if (isLoading) {
    return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
  }

  if (!rounds?.length) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Target className="h-10 w-10 text-neutral-700 mb-3" />
        <p className="text-sm text-neutral-500">No rounds logged yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rounds.map((r) => (
        <div
          key={r.id}
          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#111111] px-4 py-3 hover:border-white/[0.10] transition-colors"
        >
          <div className="text-center shrink-0">
            <p className="text-2xl font-bold text-amber-400">{r.score}</p>
            <p className="text-xs text-neutral-600">{r.score > 72 ? `+${r.score - 72}` : r.score < 72 ? `${r.score - 72}` : 'E'}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{r.course}</p>
            <p className="text-xs text-neutral-500">{format(new Date(r.date), 'MMM d, yyyy')}</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-neutral-500">
            <span>{calcFairwayPct(r.fairways_hit, r.fairways_total)}% FW</span>
            <span>{calcGIRPct(r.gir)}% GIR</span>
            <span>{r.putts} putts</span>
          </div>
          <button
            onClick={() => deleteRound.mutate(r.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add golf components (form, charts, radar, coach chat)"
```

---

### Task 5: AI golf coach API route

**Files:**
- Create: `mendos/app/api/ai/golf-coach/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// mendos/app/api/ai/golf-coach/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { buildWeaknessScores, calcFairwayPct, calcGIRPct } from '@/lib/utils/golf-utils'
import type { GolfRound } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, rounds }: { message: string; rounds: GolfRound[] } = await request.json()

  const weaknesses = buildWeaknessScores(rounds)
  const avgScore = rounds.length
    ? Math.round(rounds.reduce((a, r) => a + r.score, 0) / rounds.length)
    : null

  const context = rounds.length > 0
    ? `Player stats from last ${rounds.length} rounds: avg score ${avgScore}, weaknesses: ${JSON.stringify(weaknesses)}, avg fairways ${Math.round(rounds.reduce((a, r) => a + calcFairwayPct(r.fairways_hit, r.fairways_total), 0) / rounds.length)}%, avg GIR ${Math.round(rounds.reduce((a, r) => a + calcGIRPct(r.gir), 0) / rounds.length)}%.`
    : 'No round data available yet.'

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 350,
      messages: [
        {
          role: 'system',
          content: `You are an expert golf coach. Be specific, practical, and encouraging. ${context}`,
        },
        { role: 'user', content: message },
      ],
    })
    const reply = completion.choices[0].message.content ?? 'Let me think about that.'
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ reply: 'Sorry, I couldn\'t connect right now. Try again.' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add AI golf coach API route"
```

---

### Task 6: Golf dashboard page

**Files:**
- Modify: `mendos/app/(dashboard)/golf/page.tsx`

- [ ] **Step 1: Replace golf page**

```typescript
// mendos/app/(dashboard)/golf/page.tsx
'use client'

import { useState } from 'react'
import { useGolfRounds } from '@/hooks/use-golf-rounds'
import { RoundForm } from '@/components/golf/round-form'
import { RoundList } from '@/components/golf/round-list'
import { ScoreChart } from '@/components/golf/score-chart'
import { StatsChart } from '@/components/golf/stats-chart'
import { WeaknessRadar } from '@/components/golf/weakness-radar'
import { CoachChat } from '@/components/golf/coach-chat'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Plus, Target } from 'lucide-react'
import { calcFairwayPct, calcGIRPct } from '@/lib/utils/golf-utils'

const TABS = ['Overview', 'Rounds', 'Coach'] as const

export default function GolfPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Overview')
  const [showForm, setShowForm] = useState(false)
  const { data: rounds } = useGolfRounds()

  const recent = rounds?.slice(0, 10) ?? []
  const avgScore = recent.length
    ? Math.round(recent.reduce((a, r) => a + r.score, 0) / recent.length)
    : null
  const avgFW = recent.length
    ? Math.round(recent.reduce((a, r) => a + calcFairwayPct(r.fairways_hit, r.fairways_total), 0) / recent.length)
    : null
  const avgGIR = recent.length
    ? Math.round(recent.reduce((a, r) => a + calcGIRPct(r.gir), 0) / recent.length)
    : null
  const bestScore = rounds?.length ? Math.min(...rounds.map((r) => r.score)) : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                tab === t ? 'bg-amber-500/10 text-amber-400' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Log Round
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-5">
          <h3 className="text-sm font-medium text-white mb-4">Log New Round</h3>
          <RoundForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Avg Score" value={avgScore ?? '—'} color="#f59e0b" />
            <StatCard label="Best Score" value={bestScore ?? '—'} color="#10b981" />
            <StatCard label="FW%" value={avgFW != null ? `${avgFW}%` : '—'} color="#3b82f6" />
            <StatCard label="GIR%" value={avgGIR != null ? `${avgGIR}%` : '—'} color="#8b5cf6" />
          </div>
          {rounds && rounds.length > 0 && (
            <>
              <ScoreChart rounds={rounds} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <StatsChart rounds={rounds} />
                <WeaknessRadar rounds={rounds} />
              </div>
            </>
          )}
          {(!rounds || rounds.length === 0) && (
            <div className="flex flex-col items-center py-20 text-center">
              <Target className="h-12 w-12 text-neutral-700 mb-4" />
              <p className="text-neutral-500 text-sm">Log your first round to see analytics</p>
            </div>
          )}
        </div>
      )}

      {tab === 'Rounds' && <RoundList />}
      {tab === 'Coach' && <CoachChat />}
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npx jest
```
Expected: All pass

- [ ] **Step 3: Verify in browser**

Open `/golf`. Log a round, check charts update, chat with AI coach.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: Phase 3A complete — golf performance tracker with AI coach"
```

---

**Phase 3A complete.** Round logging, score trend, stats charts, weakness radar, and AI golf coach chat.

**Next:** Run Phase 3B plan → `docs/superpowers/plans/2026-05-11-mendos-phase3b.md`
