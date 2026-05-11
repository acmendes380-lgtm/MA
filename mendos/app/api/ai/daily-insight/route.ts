import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { format } from 'date-fns'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: cached } = await supabase
    .from('ai_insights')
    .select('content')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (cached) {
    return NextResponse.json({ insight: cached.content })
  }

  const [{ data: goals }, { data: score }, { data: habits }] = await Promise.all([
    supabase
      .from('daily_goals')
      .select('text, completed')
      .eq('user_id', user.id)
      .eq('date', today),
    supabase
      .from('daily_scores')
      .select('productivity_score, sleep_hours, focus_minutes')
      .eq('user_id', user.id)
      .eq('date', today)
      .single(),
    supabase.from('habits').select('name').eq('user_id', user.id).limit(5),
  ])

  const completedGoals = goals?.filter((g) => g.completed).length ?? 0
  const totalGoals = goals?.length ?? 0

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 80,
      messages: [
        {
          role: 'system',
          content:
            'You are a motivational life coach. Give one specific, actionable insight in a single sentence (max 90 characters). Be direct and inspiring, not generic.',
        },
        {
          role: 'user',
          content: `Today: ${completedGoals}/${totalGoals} goals done, sleep ${score?.sleep_hours ?? '?'} hrs, focus ${score?.focus_minutes ?? 0} min, habits: ${habits?.map((h) => h.name).join(', ') || 'none set'}. Give me one insight.`,
        },
      ],
    })

    const content =
      completion.choices[0].message.content ?? 'Make today count.'

    await supabase
      .from('ai_insights')
      .upsert({ user_id: user.id, date: today, content }, { onConflict: 'user_id,date' })

    return NextResponse.json({ insight: content })
  } catch {
    return NextResponse.json({ insight: 'Focus on what matters most today.' })
  }
}
