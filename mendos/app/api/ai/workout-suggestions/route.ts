import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workouts } = await request.json()

  const summary = (workouts as any[])
    .slice(0, 8)
    .map((w) => `${w.date}: ${w.type} (${w.duration}min), exercises: ${(w.workout_exercises as any[]).map((e) => `${e.name} ${e.sets}x${e.reps}${e.weight ? ` @${e.weight}kg` : ''}`).join(', ')}`)
    .join('\n')

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: "You are an expert strength and conditioning coach. Based on the user's recent workout history, suggest the optimal next workout session. Be specific about exercises, sets, reps, and weights. Also note any recovery concerns.",
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
