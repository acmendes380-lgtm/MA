// app/api/ai/life-coach/route.ts
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
  const pendingAssignments = assignments?.map((a: any) => `"${a.title}" (${(a.subjects as any)?.name}) due ${a.due_date}`).join(', ')
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
          content: `You are a world-class personal life coach with full visibility into the user's life data. You are warm, direct, and deeply personalized. Never give generic advice. Always reference specific data points. Push the user to be their best.\n\nUser context:\n${context}`,
        },
        ...priorMessages,
        { role: 'user', content: message },
      ],
    })
    return NextResponse.json({ reply: completion.choices[0].message.content })
  } catch {
    return NextResponse.json({ reply: "I'm having trouble connecting. Try again in a moment." })
  }
}
