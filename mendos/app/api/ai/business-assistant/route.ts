// app/api/ai/business-assistant/route.ts
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
