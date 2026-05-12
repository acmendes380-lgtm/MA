import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI } from '@/lib/openai/client'
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
    const completion = await getOpenAI().chat.completions.create({
      model: 'openai/gpt-4o-mini',
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
    return NextResponse.json({ reply: "Sorry, I couldn't connect right now. Try again." })
  }
}
