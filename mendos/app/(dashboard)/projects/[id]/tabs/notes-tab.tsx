'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function NotesTab({ projectId }: { projectId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const { data } = useQuery({
    queryKey: ['project-notes', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_notes')
        .select('content')
        .eq('project_id', projectId)
        .single()
      return data?.content ?? ''
    },
  })

  useEffect(() => {
    if (data !== undefined && content === '') setContent(data)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      await supabase.from('project_notes').upsert(
        { project_id: projectId, user_id: user.id, content: text, updated_at: new Date().toISOString() },
        { onConflict: 'project_id' }
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-notes', projectId] }),
  })

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveMutation.mutate(e.target.value), 800)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">Project notes (auto-saved)</span>
        {saveMutation.isPending && <span className="text-xs text-neutral-600">Saving...</span>}
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Write notes, ideas, and thoughts about this project..."
        rows={16}
        className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#111111] px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-white/[0.10] transition-colors font-mono leading-relaxed"
      />
    </div>
  )
}
