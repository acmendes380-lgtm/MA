# MendOS — Design Spec
**Date:** 2026-05-11  
**Status:** Approved

---

## Overview

MendOS is a personal life operating system — a single premium web app where the user manages every domain of life: personal development, projects, business, golf, gym, school, habits, and productivity, with an AI coach threading through all of it.

**Audience:** Single user (personal use), authenticated via Supabase Auth.  
**Feel:** Apple + Notion + Linear + Arc Browser — minimal, dark, smooth, premium.  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, OpenAI API, Recharts, Framer Motion, Vercel.

---

## Architecture

```
/mendos
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login / signup pages
│   ├── (dashboard)/            # Protected routes
│   │   ├── page.tsx            # Main dashboard
│   │   ├── projects/
│   │   ├── business/
│   │   ├── golf/
│   │   ├── gym/
│   │   ├── school/
│   │   └── coach/
│   └── api/                    # API routes (AI, analytics)
├── components/
│   ├── ui/                     # Base design system components
│   ├── dashboard/              # Dashboard-specific widgets
│   ├── projects/
│   ├── business/
│   ├── golf/
│   ├── gym/
│   ├── school/
│   └── coach/
├── lib/
│   ├── supabase/               # Client + server Supabase helpers
│   ├── openai/                 # AI client + prompt builders
│   └── utils/
├── hooks/                      # Custom React hooks
├── types/                      # Global TypeScript types
└── supabase/
    └── migrations/             # SQL schema files
```

### Routing Strategy
- All protected routes live under `(dashboard)` group — middleware checks Supabase session and redirects unauthenticated users to `/login`.
- API routes at `app/api/` handle OpenAI calls server-side to keep API keys out of the client.

---

## Design System

### Theme
- Background: `#0a0a0a` (near-black)
- Surface: `#111111`, `#1a1a1a`, `#222222` (card layers)
- Border: `rgba(255,255,255,0.06)`
- Accent: Electric blue `#3b82f6` primary, with per-section accent colors (green for gym, amber for golf, purple for school, cyan for business)
- Text: `#f0f0f0` primary, `#888` muted, `#555` subtle

### Typography
- Font: `Inter` (body/UI), `Geist` (headings) — both via `next/font`
- Scale: 11px caption → 13px body → 15px default → 20px subheading → 32px heading → 48px hero

### Components (reusable)
- `Card` — glassmorphism surface, subtle border, hover lift
- `ProgressRing` — SVG ring with animated fill
- `StatCard` — metric + label + trend indicator
- `Badge` — status/priority labels
- `Button` — primary / ghost / destructive variants
- `Input`, `Textarea`, `Select` — dark-themed form controls
- `Modal` / `Sheet` — slide-in panels for detail views
- `Sidebar` — collapsible nav with icons + labels
- `PageHeader` — title + actions row
- `EmptyState` — illustrated empty state with CTA
- `Skeleton` — loading placeholders

### Animations (Framer Motion)
- Page transitions: fade + slide up (100ms)
- Card entrance: stagger fade-in on mount
- Progress rings: spring animation on value change
- Sidebar: smooth collapse/expand
- Modals: scale + fade

---

## Phase 1 — Core Shell + Main Dashboard

### Layout
- Fixed sidebar (240px expanded, 64px collapsed) with nav links to all sections
- Top bar: breadcrumb + global search + AI coach trigger + user avatar
- Main content area: responsive grid, max-width 1400px

### Sidebar Navigation
- Dashboard (home)
- Projects
- Business / MendAI
- Golf
- Gym
- School
- AI Coach
- Settings

### Main Dashboard Widgets
1. **Daily Goals** — checklist of today's top 3 goals
2. **Habit Streaks** — ring grid showing active habits + current streaks
3. **Productivity Score** — computed daily score (0–100), trend sparkline
4. **Focus Time** — today's deep work logged (hours)
5. **Sleep** — last night's sleep duration + quality (manual input)
6. **Quick Notes** — textarea that saves to a notes table instantly
7. **Upcoming Tasks** — next 5 tasks across all sections by deadline
8. **Calendar Widget** — current week view with event dots
9. **AI Insight** — one-sentence daily motivation/insight from OpenAI (cached, refreshes daily)
10. **Weekly Progress Summary** — bar chart of completed tasks per day this week
11. **Section Health Cards** — one mini card per section (Golf, Gym, School, Business) showing last activity + key metric

### Data Flow
- Dashboard fetches all data client-side via TanStack Query (React Query v5) from Supabase.
- AI insight fetched from `POST /api/ai/daily-insight` — OpenAI GPT-4o-mini, prompt uses user's recent data, response cached in `ai_insights` table keyed by `user_id + date`.

---

## Phase 2 — Project Management

### Features
- Create / edit / delete projects
- Categories: personal, business, school, golf, gym, content
- Each project has: title, description, category, status, priority, deadline, progress (0–100%), color label
- Tasks + subtasks per project (nested, max 2 levels)
- Notes (rich-ish textarea, stored as markdown)
- File/resource links (URL list, not file uploads — keep infra simple)
- Timeline: simple milestone list with dates

### Project Page Layout
- Header: title, category badge, progress ring, deadline, status toggle
- Tabs: Overview | Tasks | Notes | Resources | AI Suggestions
- AI Suggestions tab: calls `POST /api/ai/project-suggestions` with project data → returns 3–5 actionable suggestions

### Database Tables
- `projects` (id, user_id, title, description, category, status, priority, deadline, progress, color, created_at)
- `tasks` (id, user_id, project_id, parent_task_id, title, status, priority, deadline, order)
- `project_notes` (id, project_id, content, updated_at)
- `project_resources` (id, project_id, title, url)

---

## Phase 3A — Golf Performance Tracker

### Round Logging
Fields per round: date, course, score (total + per hole optional), fairways hit, GIR, putts, scrambling %, penalties, driving distance, notes.

### Analytics
- Score trend line chart (last 20 rounds)
- Fairways / GIR / putts bar chart (last 10 rounds)
- Weakness radar chart (putting, driving, approach, short game, mental)
- Personal bests panel

### AI Golf Coach
- `POST /api/ai/golf-coach` — sends last 10 rounds summary → returns: weakness analysis, top 3 drill recommendations, practice schedule suggestion
- Displayed in a "Coach" tab on the Golf page
- User can ask follow-up questions (threaded chat, stored in `golf_coach_messages`)

### Database Tables
- `golf_rounds` (id, user_id, date, course, score, fairways_hit, fairways_total, gir, putts, scrambling, penalties, driving_distance, notes)
- `golf_coach_messages` (id, user_id, role, content, created_at)

---

## Phase 3B — Gym + Fitness Tracker

### Workout Logging
- Log workout: date, type (strength/cardio/flexibility), duration, exercises
- Exercise entry: name, sets, reps, weight
- Bodyweight log: date + weight
- Cardio log: date, type, duration, distance, calories

### Analytics
- Strength progression chart per exercise (weight over time)
- Weekly volume bar chart
- Bodyweight trend line
- Recovery score (simple: rest days in last 7)

### AI Workout Suggestions
- `POST /api/ai/workout-suggestions` — last 4 weeks of workouts → returns suggested next workout + recovery notes

### Database Tables
- `workouts` (id, user_id, date, type, duration, notes)
- `workout_exercises` (id, workout_id, name, sets, reps, weight)
- `bodyweight_logs` (id, user_id, date, weight)
- `cardio_logs` (id, user_id, date, type, duration, distance, calories)

---

## Phase 4 — School + Study Tracker

### Features
- Subjects list with color labels
- Assignments: title, subject, due date, status, grade (when returned)
- Exams: title, subject, date, status, grade
- Study sessions: subject, duration, notes, date
- Grade tracker: per subject average

### Widgets
- Upcoming deadlines (sorted by due date)
- Grade averages bar chart per subject
- Study hours this week (bar chart)
- Study timer (Pomodoro-style, in-app)

### AI Study Assistant
- `POST /api/ai/study-plan` — given subjects + upcoming exams → returns suggested weekly study plan

### Database Tables
- `subjects` (id, user_id, name, color)
- `assignments` (id, user_id, subject_id, title, due_date, status, grade)
- `exams` (id, user_id, subject_id, title, date, status, grade)
- `study_sessions` (id, user_id, subject_id, duration_minutes, notes, date)

---

## Phase 5 — MendAI Business Section

### Sub-sections
1. **Dashboard** — revenue metric, active clients, leads count, conversion rate, growth chart
2. **Clients** — table of clients with: name, company, status (lead/active/churned), value, last contact
3. **Pipeline** — kanban board: Lead → Contacted → Proposal → Closed Won / Lost
4. **Services** — list of active projects: automation, chatbot, workflow; each with status + client link
5. **Notes + Ideas** — quick capture: business ideas, strategy notes, meeting notes (markdown)
6. **Tasks** — outreach tasks, client deadlines, deliverables

### AI Business Assistant
- Sidebar chat panel on the Business section
- `POST /api/ai/business-assistant` — system prompt primes it as a MendAI business strategy + outreach expert
- Can: suggest cold DM copy, outreach sequences, offer improvement ideas, analyze pipeline health
- Messages stored in `business_chat_messages`

### Database Tables
- `clients` (id, user_id, name, company, email, status, value, notes, last_contact)
- `pipeline_deals` (id, user_id, client_id, stage, value, notes, updated_at)
- `business_services` (id, user_id, client_id, title, type, status, deadline)
- `business_notes` (id, user_id, category, title, content, created_at)
- `business_tasks` (id, user_id, title, status, priority, deadline, client_id)
- `business_chat_messages` (id, user_id, role, content, created_at)

---

## Phase 6 — AI Life Coach (Global)

### Concept
A persistent chat sidebar accessible from anywhere in the app via a floating button. The AI has access to a summary of the user's recent data across all sections.

### Context Injection
`POST /api/ai/life-coach` builds a context payload:
- Last 7 days: habits completed, productivity score, sleep avg
- Last 3 golf rounds summary
- Last 3 workouts
- Upcoming tasks (next 7 days)
- Current project statuses
- School deadlines

### UX
- Floating button (bottom-right) opens a slide-up panel
- Chat interface: scrollable message history + input
- Conversation stored in `life_coach_messages`
- System prompt: positions AI as a knowledgeable life coach with full context

### Database Table
- `life_coach_messages` (id, user_id, role, content, created_at)

---

## Authentication + Security

- Supabase Auth (email/password for personal use, no OAuth needed unless desired)
- Row Level Security (RLS) on all tables: `user_id = auth.uid()`
- API routes verify Supabase session via `createServerClient` before any DB access
- OpenAI key stored in `.env.local`, never exposed to client
- All AI calls are server-side API routes

---

## Database Schema Summary

All tables include `id uuid DEFAULT gen_random_uuid() PRIMARY KEY` and `user_id uuid REFERENCES auth.users NOT NULL`. RLS policies: `SELECT/INSERT/UPDATE/DELETE WHERE user_id = auth.uid()`.

Core tables:
- `profiles` — display name, avatar_url, preferences (JSON)
- `habits` — name, frequency, color, target_streak
- `habit_logs` — habit_id, date, completed
- `daily_scores` — date, productivity_score, focus_minutes, sleep_hours, sleep_quality, notes
- `quick_notes` — content, updated_at
- All section-specific tables listed above

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

---

## Deployment

- Vercel: connect GitHub repo, set env vars, auto-deploy on push to `main`
- Supabase: hosted project, run migrations via `supabase db push`
- No Docker needed; fully serverless

---

## Build Order (Phases)

| Phase | Contents | Deliverable |
|-------|----------|-------------|
| 1 | Scaffolding, auth, design system, layout, main dashboard | Working app with real data |
| 2 | Project management | Full CRUD projects + tasks |
| 3A | Golf tracker | Round logging + analytics + AI coach |
| 3B | Gym tracker | Workout logging + charts |
| 4 | School tracker | Assignments + study timer + AI plan |
| 5 | MendAI business | CRM + pipeline + AI assistant |
| 6 | AI Life Coach | Global AI sidebar with cross-domain context |
