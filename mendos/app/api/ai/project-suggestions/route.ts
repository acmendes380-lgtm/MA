import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI } from '@/lib/openai/client'
import type { Project } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { project }: { project: Project } = await request.json()

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'openai/gpt-4o-mini',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content:
            'You are a productivity expert. Return exactly 5 specific, actionable suggestions as a JSON array of strings. No preamble, just the JSON array.',
        },
        {
          role: 'user',
          content: `Project: "${project.title}" (${project.category}, ${project.priority} priority, ${project.progress}% complete, status: ${project.status}). Description: ${project.description ?? 'none'}. Give 5 concrete next actions.`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(raw)
    const suggestions: string[] = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
      : Array.isArray(parsed)
      ? parsed
      : Object.values(parsed).flat().slice(0, 5) as string[]

    return NextResponse.json({ suggestions: suggestions.slice(0, 5) })
  } catch {
    return NextResponse.json(
      { suggestions: ['Review current blockers', 'Break next task into smaller steps', 'Schedule a focused work session', 'Review project deadline', 'Update progress percentage'] },
    )
  }
}
