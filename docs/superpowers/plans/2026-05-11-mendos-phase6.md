# MendOS Phase 6 — AI Life Coach (Global) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the global AI Life Coach — a floating sidebar chat accessible from any page in the app, primed with cross-domain context (habits, golf, gym, school, business, projects) so it can give genuinely personalized advice.

**Architecture:** A Zustand store controls sidebar open/close state (already seeded in Phase 1). The life coach API route builds a context summary from Supabase data across all sections and passes it as the system prompt. Messages are persisted in `life_coach_messages`. The floating button is rendered inside the dashboard layout.

**Tech Stack:** Next.js 14 App Router, Supabase, Zustand (already installed), OpenAI (gpt-4o-mini), Framer Motion

---

## File Structure

```
components/coach/
├── coach-sidebar.tsx         ← slide-in panel with chat UI
└── coach-trigger.tsx         ← floating button

hooks/use-life-coach.ts

app/api/ai/life-coach/route.ts

supabase/migrations/007_life_coach_schema.sql

app/(dashboard)/layout.tsx    ← modified to include CoachSidebar + CoachTrigger
app/(dashboard)/coach/page.tsx ← replaced with full coach page
```

---

### Task 1: Database migration

**Files:**
- Create: `mendos/supabase/migrations/007_life_coach_schema.sql`

- [ ] **Step 1: Create migration**

```sql
-- mendos/supabase/migrations/007_life_coach_schema.sql

create table if not exists public.life_coach_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.life_coach_messages enable row level security;

create policy "Users own their life coach messages"
  on public.life_coach_messages for all using (user_id = auth.uid());
```

- [ ] **Step 2: Apply in Supabase SQL Editor**

- [ ] **Step 3: Commit**

```bash
cd /Users/andremendes/Batman/MendOS/mendos
git add supabase/
git commit -m "feat: add life coach messages schema"
```

---

### Task 2: Life coach hook

**Files:**
- Create: `mendos/hooks/use-life-coach.ts`

- [ ] **Step 1: Create use-life-coach.ts**

```typescript
// mendos/hooks/use-life-coach.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useLifeCoach() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['life-coach-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_coach_messages')
        .select('*')
        .order('created_at')
        .limit(80)
      if (error) throw error
      return data as { id: string; role: string; content: string; created_at: string }[]
    },
  })

  const addMessage = useMutation({
    mutationFn: async ({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('life_coach_messages')
        .insert({ user_id: user.id, role, content })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['life-coach-messages'] }),
  })

  const clearHistory = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('life_coach_messages')
        .delete()
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['life-coach-messages'] }),
  })

  return { ...query, addMessage, clearHistory }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add life coach data hook"
```

---

### Task 3: Life coach API route with context injection

**Files:**
- Create: `mendos/app/api/ai/life-coach/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// mendos/app/api/ai/life-coach/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { format, subDays } from 'date-fns'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, history } = await request.json()

  const today = format(new Date(), 'yyyy-MM-dd')
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const [
    { data: habits },
    { data: habitLogs },
    { data: scores },
    { data: tasks },
    { data: golfRounds },
    { data: workouts },
    { data: assignments },
    { data: clients },
    { data: projects },
  ] = await Promise.all([
    supabase.from('habits').select('name').eq('user_id', user.id),
    supabase.from('habit_logs').select('habit_id, date, completed').eq('user_id', user.id).gte('date', sevenDaysAgo),
    supabase.from('daily_scores').select('date, productivity_score, sleep_hours, focus_minutes').eq('user_id', user.id).gte('date', sevenDaysAgo).order('date'),
    supabase.from('tasks').select('title, status, deadline').eq('user_id', user.id).neq('status', 'done').gte('deadline', today).order('deadline').limit(5),
    supabase.from('golf_rounds').select('date, score, putts, fairways_hit, fairways_total, gir').eq('user_id', user.id).order('date', { ascending: false }).limit(3),
    supabase.from('workouts').select('date, type, duration').eq('user_id', user.id).gte('date', sevenDaysAgo),
    supabase.from('assignments').select('title, due_date, status, subjects(name)').eq('user_id', user.id).eq('status', 'pending').gte('due_date', today).order('due_date').limit(5),
    supabase.from('clients').select('status').eq('user_id', user.id),
    supabase.from('projects').select('title, status, progress').eq('user_id', user.id).eq('status', 'active').limit(5),
  ])

  const avgSleep = scores?.length
    ? (scores.reduce((s, r) => s + (r.sleep_hours ?? 0), 0) / scores.length).toFixed(1)
    : null
  const avgProductivity = scores?.length
    ? Math.round(scores.reduce((s, r) => s + (r.productivity_score ?? 0), 0) / scores.length)
    : null
  const habitsCompletedToday = habitLogs?.filter((l) => l.date === today && l.completed).length ?? 0
  const totalHabits = habits?.length ?? 0
  const workoutsThisWeek = workouts?.length ?? 0
  const activeClients = clients?.filter((c) => c.status === 'active').length ?? 0
  const lastGolfScore = golfRounds?.[0]?.score ?? null
  const upcomingTasks = tasks?.map((t) => `"${t.title}" due ${t.deadline}`).join(', ')
  const pendingAssignments = assignments?.map((a: any) => `"${a.title}" (${a.subjects?.name}) due ${a.due_date}`).join(', ')
  const activeProjects = projects?.map((p) => `"${p.title}" (${p.progress}%)`).join(', ')

  const context = [
    `Today: ${today}`,
    avgSleep ? `Avg sleep this week: ${avgSleep} hrs` : '',
    avgProductivity != null ? `Avg productivity score: ${avgProductivity}/100` : '',
    `Habits today: ${habitsCompletedToday}/${totalHabits} completed`,
    `Workouts this week: ${workoutsThisWeek}`,
    lastGolfScore ? `Last golf score: ${lastGolfScore}` : '',
    activeClients ? `Active business clients: ${activeClients}` : '',
    upcomingTasks ? `Upcoming tasks: ${upcomingTasks}` : '',
    pendingAssignments ? `Pending school work: ${pendingAssignments}` : '',
    activeProjects ? `Active projects: ${activeProjects}` : '',
  ].filter(Boolean).join('\n')

  const priorMessages = (history ?? []).slice(-10).map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 450,
      messages: [
        {
          role: 'system',
          content: `You are a world-class personal life coach with full visibility into the user's life data. You are warm, direct, and deeply personalized. Never give generic advice. Always reference specific data points. Push the user to be their best.

User context:
${context}`,
        },
        ...priorMessages,
        { role: 'user', content: message },
      ],
    })
    return NextResponse.json({ reply: completion.choices[0].message.content })
  } catch {
    return NextResponse.json({ reply: 'I\'m having trouble connecting. Try again in a moment.' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add AI life coach route with cross-domain context injection"
```

---

### Task 4: Coach sidebar component

**Files:**
- Create: `mendos/components/coach/coach-sidebar.tsx`
- Create: `mendos/components/coach/coach-trigger.tsx`

- [ ] **Step 1: Create coach-sidebar.tsx**

```typescript
// mendos/components/coach/coach-sidebar.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLifeCoach } from '@/hooks/use-life-coach'
import { useCoachStore } from '@/store/coach'
import { Button } from '@/components/ui/button'
import { Send, Bot, X, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function CoachSidebar() {
  const { isOpen, close } = useCoachStore()
  const { data: messages, isLoading, addMessage, clearHistory } = useLifeCoach()
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [isOpen, messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || aiLoading) return
    const userMsg = input.trim()
    setInput('')
    setAiLoading(true)
    await addMessage.mutateAsync({ role: 'user', content: userMsg })

    try {
      const res = await fetch('/api/ai/life-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages ?? [] }),
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0d0d0d] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 shrink-0">
                <Bot className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-white">AI Life Coach</h2>
                <p className="text-xs text-neutral-500">Knows your goals, habits, and data</p>
              </div>
              <button
                onClick={() => clearHistory.mutate()}
                className="text-neutral-600 hover:text-neutral-400 transition-colors"
                title="Clear history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={close} className="text-neutral-600 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages?.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 mb-4">
                    <Sparkles className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">Your Personal Life Coach</h3>
                  <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                    I know your habits, golf scores, workouts, school deadlines, and business metrics. Ask me anything.
                  </p>
                  <div className="mt-6 grid gap-2 w-full">
                    {[
                      'What should I focus on today?',
                      "How's my golf game trending?",
                      'What habits am I neglecting?',
                      'Help me plan my week',
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="rounded-xl border border-white/[0.06] px-3 py-2.5 text-xs text-neutral-400 hover:text-white hover:border-white/[0.12] text-left transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'ml-auto bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white/[0.06] text-neutral-200 rounded-tl-sm'
                  )}
                >
                  {msg.content}
                </div>
              ))}

              {aiLoading && (
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-white/[0.06] p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your life coach..."
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/40 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend(e as any)
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="md"
                  disabled={!input.trim() || aiLoading}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Create coach-trigger.tsx**

```typescript
// mendos/components/coach/coach-trigger.tsx
'use client'

import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { useCoachStore } from '@/store/coach'

export function CoachTrigger() {
  const { toggle, isOpen } = useCoachStore()

  if (isOpen) return null

  return (
    <motion.button
      onClick={toggle}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="fixed bottom-6 right-6 z-30 flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
      title="Open AI Life Coach"
    >
      <Bot className="h-5 w-5 text-white" />
    </motion.button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add coach sidebar and floating trigger components"
```

---

### Task 5: Wire coach into dashboard layout

**Files:**
- Modify: `mendos/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Update dashboard layout to include coach**

```typescript
// mendos/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { CoachSidebar } from '@/components/coach/coach-sidebar'
import { CoachTrigger } from '@/components/coach/coach-trigger'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-6 py-6">{children}</div>
        </main>
      </div>
      <CoachSidebar />
      <CoachTrigger />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: wire coach sidebar and trigger into dashboard layout"
```

---

### Task 6: Full coach page (for /coach route)

**Files:**
- Modify: `mendos/app/(dashboard)/coach/page.tsx`

- [ ] **Step 1: Replace coach placeholder page**

```typescript
// mendos/app/(dashboard)/coach/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useLifeCoach } from '@/hooks/use-life-coach'
import { Button } from '@/components/ui/button'
import { Send, Bot, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const QUICK_PROMPTS = [
  'What should I prioritize today?',
  'How can I improve my golf game?',
  "Analyze my week's performance",
  'What habits should I build?',
  'Help me plan my business outreach',
  'What are my biggest growth areas?',
]

export default function CoachPage() {
  const { data: messages, isLoading, addMessage, clearHistory } = useLifeCoach()
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
      const res = await fetch('/api/ai/life-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages ?? [] }),
      })
      const data = await res.json()
      await addMessage.mutateAsync({ role: 'assistant', content: data.reply })
    } catch {
      await addMessage.mutateAsync({ role: 'assistant', content: 'Connection error. Please try again.' })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-white">AI Life Coach</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Personalized coaching powered by your real data</p>
        </div>
        {(messages?.length ?? 0) > 0 && (
          <Button variant="ghost" size="sm" onClick={() => clearHistory.mutate()}>
            <Trash2 className="h-4 w-4" />
            Clear history
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-6 space-y-4 mb-4">
        {messages?.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600/10 mb-5">
              <Sparkles className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Your Personal Life Coach</h2>
            <p className="text-sm text-neutral-500 max-w-md mb-8 leading-relaxed">
              I have access to your habits, productivity scores, golf rounds, workouts, school deadlines, and business metrics. Ask me anything.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="rounded-xl border border-white/[0.06] px-4 py-3 text-xs text-neutral-400 hover:text-white hover:border-white/[0.12] text-left transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/20 mr-2.5 mt-0.5 shrink-0">
                <Bot className="h-3.5 w-3.5 text-blue-400" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white/[0.06] text-neutral-200 rounded-tl-sm'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {aiLoading && (
          <div className="flex justify-start">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/20 mr-2.5 shrink-0">
              <Bot className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk to your life coach..."
          className="flex-1 rounded-xl border border-white/[0.08] bg-[#111111] px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/40 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(e as any)
            }
          }}
        />
        <Button type="submit" size="lg" disabled={!input.trim() || aiLoading} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add full AI Life Coach page at /coach"
```

---

### Task 7: Final verification — full app end-to-end

- [ ] **Step 1: Run all tests**

```bash
cd /Users/andremendes/Batman/MendOS/mendos
npx jest
```
Expected: All tests pass

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

- [ ] **Step 3: Full end-to-end walkthrough**

Test each section in order:
1. **Auth** — log in, redirects to dashboard
2. **Dashboard** — AI insight loads, add goals, toggle habits, log sleep + productivity, quick notes save
3. **Projects** — create a project (each category), open detail, add tasks, mark done, write notes, add resource, get AI suggestions
4. **Golf** — log a round, see score chart update, chat with golf coach
5. **Gym** — log a workout with exercises, see volume chart, bodyweight chart, get AI suggestion
6. **School** — add subjects, add assignments, run study timer, check grades, generate study plan
7. **Business** — add clients, move pipeline deals, write business notes, chat with AI assistant
8. **AI Coach** — open floating button from any page, chat works, references real data
9. **Coach page** — /coach full page version works, quick prompts work

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: Phase 6 complete — global AI Life Coach with cross-domain context"
```

---

**All phases complete. MendOS is fully built.**

## Summary of what was built

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Core shell, auth, design system, main dashboard | ✓ |
| 2 | Project management with tasks, notes, AI suggestions | ✓ |
| 3A | Golf tracker with analytics and AI coach | ✓ |
| 3B | Gym tracker with strength charts and AI suggestions | ✓ |
| 4 | School tracker with timer and AI study plan | ✓ |
| 5 | MendAI business with CRM, pipeline, AI assistant | ✓ |
| 6 | Global AI Life Coach with cross-domain context | ✓ |

## Deployment to Vercel

```bash
# 1. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/mendos.git
git push -u origin main

# 2. Import project at vercel.com/new
# 3. Set environment variables in Vercel project settings:
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
#    SUPABASE_SERVICE_ROLE_KEY
#    OPENAI_API_KEY
# 4. Deploy — Vercel auto-detects Next.js
```
