# MendOS Phase 5 — MendAI Business Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MendAI business dashboard with client management, a kanban pipeline, service tracking, business analytics charts, quick-capture notes, task management, and an AI business assistant chat.

**Architecture:** All business data in Supabase. Pipeline is a client-side kanban built with drag-triggered Supabase updates. Business AI assistant is a persistent chat with a MendAI-specialist system prompt stored in `business_chat_messages`.

**Tech Stack:** Next.js 14 App Router, Supabase, TanStack Query v5, Recharts, OpenAI (gpt-4o-mini)

---

## File Structure

```
app/(dashboard)/business/page.tsx

components/business/
├── client-table.tsx
├── client-form.tsx
├── pipeline-board.tsx
├── pipeline-card.tsx
├── service-list.tsx
├── business-notes.tsx
├── business-tasks.tsx
├── business-chat.tsx
└── revenue-chart.tsx

hooks/use-business.ts
lib/utils/business-utils.ts
app/api/ai/business-assistant/route.ts
supabase/migrations/006_business_schema.sql
__tests__/lib/business-utils.test.ts
```

---

### Task 1: Database migration

**Files:**
- Create: `mendos/supabase/migrations/006_business_schema.sql`

- [ ] **Step 1: Create migration**

```sql
-- mendos/supabase/migrations/006_business_schema.sql

create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  company text,
  email text,
  status text not null default 'lead'
    check (status in ('lead','active','churned')),
  value numeric(10,2) not null default 0,
  notes text,
  last_contact date,
  created_at timestamptz default now()
);

create table if not exists public.pipeline_deals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients on delete set null,
  title text not null,
  stage text not null default 'lead'
    check (stage in ('lead','contacted','proposal','won','lost')),
  value numeric(10,2) not null default 0,
  notes text,
  updated_at timestamptz default now()
);

create table if not exists public.business_services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients on delete set null,
  title text not null,
  type text not null default 'automation'
    check (type in ('automation','chatbot','workflow','integration','other')),
  status text not null default 'active'
    check (status in ('active','paused','completed')),
  deadline date
);

create table if not exists public.business_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  category text not null default 'idea'
    check (category in ('idea','strategy','meeting','content','other')),
  title text not null,
  content text not null default '',
  created_at timestamptz default now()
);

create table if not exists public.business_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  status text not null default 'todo'
    check (status in ('todo','in_progress','done')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  deadline date,
  client_id uuid references public.clients on delete set null
);

create table if not exists public.business_chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;
alter table public.pipeline_deals enable row level security;
alter table public.business_services enable row level security;
alter table public.business_notes enable row level security;
alter table public.business_tasks enable row level security;
alter table public.business_chat_messages enable row level security;

create policy "Users own their clients" on public.clients for all using (user_id = auth.uid());
create policy "Users own their pipeline deals" on public.pipeline_deals for all using (user_id = auth.uid());
create policy "Users own their business services" on public.business_services for all using (user_id = auth.uid());
create policy "Users own their business notes" on public.business_notes for all using (user_id = auth.uid());
create policy "Users own their business tasks" on public.business_tasks for all using (user_id = auth.uid());
create policy "Users own their business chat" on public.business_chat_messages for all using (user_id = auth.uid());
```

- [ ] **Step 2: Apply in Supabase SQL Editor**

- [ ] **Step 3: Commit**

```bash
cd /Users/andremendes/Batman/MendOS/mendos
git add supabase/
git commit -m "feat: add business schema migration"
```

---

### Task 2: Business utilities and tests

**Files:**
- Create: `mendos/lib/utils/business-utils.ts`
- Create: `mendos/__tests__/lib/business-utils.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// mendos/__tests__/lib/business-utils.test.ts
import {
  calcTotalRevenue,
  calcConversionRate,
  getPipelineStageLabel,
} from '@/lib/utils/business-utils'

describe('calcTotalRevenue', () => {
  it('returns 0 for empty clients', () => {
    expect(calcTotalRevenue([])).toBe(0)
  })
  it('sums value of active clients only', () => {
    const clients = [
      { status: 'active', value: 1000 },
      { status: 'active', value: 2000 },
      { status: 'lead', value: 5000 },
      { status: 'churned', value: 500 },
    ]
    expect(calcTotalRevenue(clients)).toBe(3000)
  })
})

describe('calcConversionRate', () => {
  it('returns 0 when no deals', () => {
    expect(calcConversionRate([])).toBe(0)
  })
  it('returns correct percentage', () => {
    const deals = [
      { stage: 'won' },
      { stage: 'won' },
      { stage: 'lost' },
      { stage: 'lead' },
    ]
    expect(calcConversionRate(deals)).toBe(50)
  })
})

describe('getPipelineStageLabel', () => {
  it('returns readable label for each stage', () => {
    expect(getPipelineStageLabel('won')).toBe('Closed Won')
    expect(getPipelineStageLabel('lost')).toBe('Closed Lost')
    expect(getPipelineStageLabel('lead')).toBe('Lead')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npx jest __tests__/lib/business-utils.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create business-utils.ts**

```typescript
// mendos/lib/utils/business-utils.ts

export function calcTotalRevenue(clients: { status: string; value: number }[]): number {
  return clients
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + c.value, 0)
}

export function calcConversionRate(deals: { stage: string }[]): number {
  const closed = deals.filter((d) => d.stage === 'won' || d.stage === 'lost')
  if (closed.length === 0) return 0
  const won = deals.filter((d) => d.stage === 'won').length
  return Math.round((won / closed.length) * 100)
}

export function getPipelineStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    lead: 'Lead',
    contacted: 'Contacted',
    proposal: 'Proposal',
    won: 'Closed Won',
    lost: 'Closed Lost',
  }
  return labels[stage] ?? stage
}

export const STAGE_ORDER = ['lead', 'contacted', 'proposal', 'won', 'lost'] as const
export type PipelineStage = (typeof STAGE_ORDER)[number]

export const STAGE_COLORS: Record<PipelineStage, string> = {
  lead: '#555',
  contacted: '#3b82f6',
  proposal: '#f59e0b',
  won: '#10b981',
  lost: '#ef4444',
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx jest __tests__/lib/business-utils.test.ts
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add business utilities with tests"
```

---

### Task 3: Business hooks

**Files:**
- Create: `mendos/hooks/use-business.ts`

- [ ] **Step 1: Create use-business.ts**

```typescript
// mendos/hooks/use-business.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Client, PipelineDeal } from '@/types'

export function useClients() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Client[]
    },
  })

  const createClient_ = useMutation({
    mutationFn: async (input: Partial<Client>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('clients').insert({ user_id: user.id, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { error } = await supabase.from('clients').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  return { ...query, createClient: createClient_, updateClient, deleteClient }
}

export function usePipeline() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['pipeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_deals')
        .select('*, clients(name, company)')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as (PipelineDeal & { clients: { name: string; company: string | null } | null })[]
    },
  })

  const createDeal = useMutation({
    mutationFn: async (input: { title: string; stage: string; value: number; client_id?: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('pipeline_deals').insert({ user_id: user.id, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  })

  const moveDeal = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase.from('pipeline_deals').update({ stage, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  })

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pipeline_deals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  })

  return { ...query, createDeal, moveDeal, deleteDeal }
}

export function useBusinessNotes() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['business-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_notes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as { id: string; category: string; title: string; content: string; created_at: string }[]
    },
  })

  const createNote = useMutation({
    mutationFn: async ({ category, title, content }: { category: string; title: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('business_notes').insert({ user_id: user.id, category, title, content })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-notes'] }),
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('business_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-notes'] }),
  })

  return { ...query, createNote, deleteNote }
}

export function useBusinessTasks() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['business-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_tasks')
        .select('*, clients(name)')
        .order('deadline', { nullsFirst: false })
      if (error) throw error
      return data as any[]
    },
  })

  const createTask = useMutation({
    mutationFn: async (input: { title: string; priority: string; deadline?: string; client_id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('business_tasks').insert({ user_id: user.id, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-tasks'] }),
  })

  const toggleTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('business_tasks').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-tasks'] }),
  })

  return { ...query, createTask, toggleTask }
}

export function useBusinessChat() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['business-chat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_chat_messages')
        .select('*')
        .order('created_at')
        .limit(60)
      if (error) throw error
      return data as { id: string; role: string; content: string; created_at: string }[]
    },
  })

  const addMessage = useMutation({
    mutationFn: async ({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('business_chat_messages').insert({ user_id: user.id, role, content })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-chat'] }),
  })

  return { ...query, addMessage }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add business data hooks"
```

---

### Task 4: Business components

**Files:**
- Create: `mendos/components/business/client-table.tsx`
- Create: `mendos/components/business/client-form.tsx`
- Create: `mendos/components/business/pipeline-board.tsx`
- Create: `mendos/components/business/business-notes.tsx`
- Create: `mendos/components/business/business-tasks.tsx`
- Create: `mendos/components/business/business-chat.tsx`
- Create: `mendos/components/business/revenue-chart.tsx`

- [ ] **Step 1: Create client-table.tsx**

```typescript
// mendos/components/business/client-table.tsx
'use client'

import { useClients } from '@/hooks/use-business'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Users } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_VARIANT: Record<string, any> = { lead: 'amber', active: 'green', churned: 'default' }

export function ClientTable() {
  const { data: clients, isLoading, deleteClient } = useClients()

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
  if (!clients?.length) return (
    <div className="flex flex-col items-center py-16 text-center">
      <Users className="h-10 w-10 text-neutral-700 mb-3" />
      <p className="text-sm text-neutral-500">No clients yet. Add your first one.</p>
    </div>
  )

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            {['Name', 'Company', 'Status', 'Value', 'Last Contact', ''].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-neutral-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {clients.map((c) => (
            <tr key={c.id} className="group hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 font-medium text-white">{c.name}</td>
              <td className="px-4 py-3 text-neutral-400">{c.company ?? '—'}</td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
              </td>
              <td className="px-4 py-3 text-neutral-300 font-mono">
                {c.value > 0 ? `$${c.value.toLocaleString()}` : '—'}
              </td>
              <td className="px-4 py-3 text-neutral-500 text-xs">
                {c.last_contact ? format(new Date(c.last_contact), 'MMM d') : '—'}
              </td>
              <td className="px-4 py-3">
                <button onClick={() => deleteClient.mutate(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create client-form.tsx**

```typescript
// mendos/components/business/client-form.tsx
'use client'

import { useState } from 'react'
import { useClients } from '@/hooks/use-business'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ClientForm({ onClose }: { onClose: () => void }) {
  const { createClient } = useClients()
  const [form, setForm] = useState({ name: '', company: '', email: '', status: 'lead', value: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    await createClient.mutateAsync({
      name: form.name.trim(),
      company: form.company || undefined,
      email: form.email || undefined,
      status: form.status as any,
      value: parseFloat(form.value) || 0,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input value={form.name} onChange={set('name')} placeholder="Name" required autoFocus />
        <Input value={form.company} onChange={set('company')} placeholder="Company" />
        <Input type="email" value={form.email} onChange={set('email')} placeholder="Email" />
        <Input type="number" value={form.value} onChange={set('value')} placeholder="Contract value $" min="0" step="100" />
      </div>
      <select value={form.status} onChange={set('status')}
        className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none"
      >
        <option value="lead">Lead</option>
        <option value="active">Active Client</option>
        <option value="churned">Churned</option>
      </select>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" size="sm" disabled={!form.name.trim() || createClient.isPending} className="flex-1">Add Client</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Create pipeline-board.tsx**

```typescript
// mendos/components/business/pipeline-board.tsx
'use client'

import { useState } from 'react'
import { usePipeline } from '@/hooks/use-business'
import { STAGE_ORDER, STAGE_COLORS, getPipelineStageLabel } from '@/lib/utils/business-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import type { PipelineStage } from '@/lib/utils/business-utils'

export function PipelineBoard() {
  const { data: deals, isLoading, createDeal, moveDeal, deleteDeal } = usePipeline()
  const [adding, setAdding] = useState<PipelineStage | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newValue, setNewValue] = useState('')

  async function handleAdd(stage: PipelineStage) {
    if (!newTitle.trim()) return
    await createDeal.mutateAsync({ title: newTitle.trim(), stage, value: parseFloat(newValue) || 0 })
    setNewTitle('')
    setNewValue('')
    setAdding(null)
  }

  const stages = STAGE_ORDER.slice(0, 4) as PipelineStage[]

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {stages.map((stage) => {
        const stageDeals = deals?.filter((d) => d.stage === stage) ?? []
        const stageValue = stageDeals.reduce((s, d) => s + d.value, 0)
        const color = STAGE_COLORS[stage]
        return (
          <div key={stage} className="flex-shrink-0 w-60 space-y-2">
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-xs font-medium" style={{ color }}>{getPipelineStageLabel(stage)}</span>
                <span className="ml-2 text-xs text-neutral-600">({stageDeals.length})</span>
              </div>
              {stageValue > 0 && (
                <span className="text-xs text-neutral-500">${stageValue.toLocaleString()}</span>
              )}
            </div>

            <div className="space-y-1.5 min-h-[60px]">
              {stageDeals.map((deal) => {
                const nextStages = stages.filter((s) => s !== stage && s !== 'won' && s !== 'lost')
                return (
                  <div key={deal.id} className="group rounded-lg border border-white/[0.06] bg-[#111111] p-3 hover:border-white/[0.10] transition-colors">
                    <p className="text-xs font-medium text-white mb-1">{deal.title}</p>
                    {deal.clients && <p className="text-xs text-neutral-600">{deal.clients.name}</p>}
                    {deal.value > 0 && <p className="text-xs text-cyan-400 font-mono mt-1">${deal.value.toLocaleString()}</p>}
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {stages.indexOf(stage) < stages.length - 1 && (
                        <button
                          onClick={() => moveDeal.mutate({ id: deal.id, stage: stages[stages.indexOf(stage) + 1] })}
                          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white transition-colors"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                      <button onClick={() => moveDeal.mutate({ id: deal.id, stage: 'won' })} className="text-xs text-emerald-500 hover:text-emerald-400 ml-auto">Won</button>
                      <button onClick={() => moveDeal.mutate({ id: deal.id, stage: 'lost' })} className="text-xs text-red-500 hover:text-red-400">Lost</button>
                      <button onClick={() => deleteDeal.mutate(deal.id)}>
                        <Trash2 className="h-3 w-3 text-neutral-600 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {adding === stage ? (
              <div className="rounded-lg border border-white/[0.08] bg-[#111111] p-2.5 space-y-2">
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Deal title" autoFocus className="text-xs" />
                <Input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value $" className="text-xs" />
                <div className="flex gap-1">
                  <button onClick={() => setAdding(null)} className="flex-1 text-xs text-neutral-500 hover:text-white py-1 transition-colors">Cancel</button>
                  <button onClick={() => handleAdd(stage)} className="flex-1 text-xs text-blue-400 hover:text-blue-300 py-1 transition-colors font-medium">Add</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(stage)}
                className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-white/[0.08] px-3 py-2 text-xs text-neutral-600 hover:text-neutral-400 hover:border-white/[0.15] transition-all"
              >
                <Plus className="h-3 w-3" />Add deal
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Create business-chat.tsx**

```typescript
// mendos/components/business/business-chat.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useBusinessChat } from '@/hooks/use-business'
import { useClients, usePipeline } from '@/hooks/use-business'
import { Button } from '@/components/ui/button'
import { Send, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function BusinessChat() {
  const { data: messages, isLoading, addMessage } = useBusinessChat()
  const { data: clients } = useClients()
  const { data: deals } = usePipeline()
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
      const res = await fetch('/api/ai/business-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: {
            activeClients: clients?.filter((c) => c.status === 'active').length ?? 0,
            totalLeads: clients?.filter((c) => c.status === 'lead').length ?? 0,
            openDeals: deals?.filter((d) => !['won','lost'].includes(d.stage)).length ?? 0,
          },
        }),
      })
      const data = await res.json()
      await addMessage.mutateAsync({ role: 'assistant', content: data.reply })
    } catch {
      await addMessage.mutateAsync({ role: 'assistant', content: 'Connection error. Try again.' })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[520px] rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <Bot className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-medium text-white">MendAI Business Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages?.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-8 w-8 text-cyan-400/30 mb-3" />
            <p className="text-sm text-neutral-500">Your MendAI business strategist</p>
            <p className="text-xs text-neutral-600 mt-1">Ask about outreach, offers, pricing, cold DMs, or strategy</p>
          </div>
        )}
        {messages?.map((msg) => (
          <div key={msg.id} className={cn(
            'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
            msg.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'bg-white/[0.06] text-neutral-200'
          )}>
            {msg.content}
          </div>
        ))}
        {aiLoading && (
          <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 bg-white/[0.06]">
            <div className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <div key={d} className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-white/[0.06]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your business assistant..."
          className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-cyan-500/30 transition-colors"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || aiLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Create revenue-chart.tsx**

```typescript
// mendos/components/business/revenue-chart.tsx
'use client'

import { useClients } from '@/hooks/use-business'
import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { calcTotalRevenue } from '@/lib/utils/business-utils'

export function RevenueChart() {
  const { data: clients } = useClients()

  const active = clients?.filter((c) => c.status === 'active') ?? []
  const data = active.map((c) => ({ name: c.name, value: c.value })).filter((d) => d.value > 0)
  const total = calcTotalRevenue(clients ?? [])

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Revenue Breakdown</h3>
        <span className="text-lg font-bold text-cyan-400">${total.toLocaleString()}</span>
      </div>
      {data.length > 0 ? (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-neutral-400 flex-1 truncate">{d.name}</span>
                <span className="text-xs font-mono text-white">${d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-600 text-center py-6">Add active clients with contract values to see revenue.</p>
      )}
    </Card>
  )
}
```

- [ ] **Step 6: Create business-notes.tsx**

```typescript
// mendos/components/business/business-notes.tsx
'use client'

import { useState } from 'react'
import { useBusinessNotes } from '@/hooks/use-business'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, StickyNote } from 'lucide-react'

const CATEGORIES = ['idea', 'strategy', 'meeting', 'content', 'other'] as const
const CATEGORY_VARIANT: Record<string, any> = { idea: 'purple', strategy: 'blue', meeting: 'green', content: 'amber', other: 'default' }

export function BusinessNotes() {
  const { data: notes, isLoading, createNote, deleteNote } = useBusinessNotes()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: 'idea', title: '', content: '' })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    await createNote.mutateAsync(form)
    setForm({ category: 'idea', title: '', content: '' })
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />Quick Capture
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl border border-white/[0.08] bg-[#111111] p-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-2 py-1.5 text-xs text-white outline-none"
            >
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Title"
              autoFocus
              required
              className="flex-1 rounded-lg border border-white/[0.08] bg-transparent px-3 py-1.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/40"
            />
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder="Write your note..."
            rows={3}
            className="w-full resize-none rounded-lg border border-white/[0.06] bg-transparent px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-white/[0.10]"
          />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button type="submit" size="sm" disabled={!form.title.trim()} className="flex-1">Save Note</Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {notes?.map((n) => (
          <div key={n.id} className="group rounded-xl border border-white/[0.06] bg-[#111111] p-4 hover:border-white/[0.10] transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={CATEGORY_VARIANT[n.category]} className="capitalize">{n.category}</Badge>
              <h4 className="text-sm font-medium text-white flex-1">{n.title}</h4>
              <button onClick={() => deleteNote.mutate(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
              </button>
            </div>
            {n.content && <p className="text-xs text-neutral-500 leading-relaxed">{n.content}</p>}
          </div>
        ))}
        {!notes?.length && !showForm && (
          <div className="flex flex-col items-center py-12 text-center">
            <StickyNote className="h-8 w-8 text-neutral-700 mb-3" />
            <p className="text-sm text-neutral-500">No notes yet. Capture your first idea.</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add business components (clients, pipeline, chat, notes, revenue chart)"
```

---

### Task 5: AI business assistant route

**Files:**
- Create: `mendos/app/api/ai/business-assistant/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// mendos/app/api/ai/business-assistant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, context } = await request.json()

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are a business strategist and sales coach for MendAI, an AI automation agency. You help with: cold outreach, offer positioning, lead generation, client management, pricing strategy, and business growth. Current stats: ${context.activeClients} active clients, ${context.totalLeads} leads, ${context.openDeals} open deals. Be specific, actionable, and direct. No fluff.`,
        },
        { role: 'user', content: message },
      ],
    })
    return NextResponse.json({ reply: completion.choices[0].message.content })
  } catch {
    return NextResponse.json({ reply: 'Connection issue. Please try again.' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add AI business assistant route"
```

---

### Task 6: Business dashboard page

**Files:**
- Modify: `mendos/app/(dashboard)/business/page.tsx`

- [ ] **Step 1: Replace business page**

```typescript
// mendos/app/(dashboard)/business/page.tsx
'use client'

import { useState } from 'react'
import { useClients, usePipeline, useBusinessNotes, useBusinessTasks } from '@/hooks/use-business'
import { ClientTable } from '@/components/business/client-table'
import { ClientForm } from '@/components/business/client-form'
import { PipelineBoard } from '@/components/business/pipeline-board'
import { BusinessChat } from '@/components/business/business-chat'
import { BusinessNotes } from '@/components/business/business-notes'
import { RevenueChart } from '@/components/business/revenue-chart'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { calcTotalRevenue, calcConversionRate } from '@/lib/utils/business-utils'

const TABS = ['Overview', 'Clients', 'Pipeline', 'Notes', 'AI Assistant'] as const

export default function BusinessPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Overview')
  const [showClientForm, setShowClientForm] = useState(false)
  const { data: clients } = useClients()
  const { data: deals } = usePipeline()

  const revenue = calcTotalRevenue(clients ?? [])
  const activeClients = clients?.filter((c) => c.status === 'active').length ?? 0
  const leads = clients?.filter((c) => c.status === 'lead').length ?? 0
  const conversionRate = calcConversionRate(deals ?? [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${tab === t ? 'bg-cyan-500/10 text-cyan-400' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'}`}
            >{t}</button>
          ))}
        </div>
        {tab === 'Clients' && (
          <Button size="sm" onClick={() => setShowClientForm(true)}>
            <Plus className="h-4 w-4" />Add Client
          </Button>
        )}
      </div>

      {showClientForm && (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-5">
          <h3 className="text-sm font-medium text-white mb-4">New Client</h3>
          <ClientForm onClose={() => setShowClientForm(false)} />
        </div>
      )}

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="MRR" value={`$${revenue.toLocaleString()}`} color="#06b6d4" />
            <StatCard label="Active Clients" value={activeClients} color="#10b981" />
            <StatCard label="Leads" value={leads} color="#f59e0b" />
            <StatCard label="Conversion Rate" value={`${conversionRate}%`} color="#3b82f6" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RevenueChart />
            <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
              <h3 className="text-sm font-medium text-white mb-3">Pipeline Summary</h3>
              <div className="space-y-2">
                {['lead','contacted','proposal'].map((stage) => {
                  const count = deals?.filter((d) => d.stage === stage).length ?? 0
                  const value = deals?.filter((d) => d.stage === stage).reduce((s, d) => s + d.value, 0) ?? 0
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400 capitalize">{stage}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-600">{count} deals</span>
                        {value > 0 && <span className="text-xs font-mono text-white">${value.toLocaleString()}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Clients' && <ClientTable />}
      {tab === 'Pipeline' && <PipelineBoard />}
      {tab === 'Notes' && <BusinessNotes />}
      {tab === 'AI Assistant' && <BusinessChat />}
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

Open `/business`. Add clients, move deals through pipeline, write notes, chat with AI assistant.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: Phase 5 complete — MendAI business dashboard with CRM, pipeline, and AI assistant"
```

---

**Phase 5 complete.** Full CRM, kanban pipeline, revenue chart, quick-capture notes, and MendAI business assistant.

**Next:** Run Phase 6 plan → `docs/superpowers/plans/2026-05-11-mendos-phase6.md`
