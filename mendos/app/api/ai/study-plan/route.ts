import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subjects, upcomingExams, pendingAssignments } = await request.json()

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: 'You are a study coach. Create a specific, realistic weekly study plan. Format as a day-by-day schedule with subject and duration.',
        },
        {
          role: 'user',
          content: `Subjects: ${subjects?.map((s: any) => s.name).join(', ') || 'none'}. Upcoming exams: ${upcomingExams?.map((e: any) => `${e.subjects?.name} - ${e.title} on ${e.date}`).join('; ') || 'none'}. Pending assignments: ${pendingAssignments?.length || 0}. Create a 7-day study plan.`,
        },
      ],
    })
    return NextResponse.json({ plan: completion.choices[0].message.content })
  } catch {
    return NextResponse.json({ plan: 'Study plan unavailable. Check your OpenAI key.' })
  }
}
