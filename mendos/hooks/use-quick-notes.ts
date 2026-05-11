import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCallback, useRef } from 'react'

export function useQuickNotes() {
  const supabase = createClient()
  const qc = useQueryClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const query = useQuery({
    queryKey: ['quick-notes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('quick_notes')
        .select('content')
        .single()
      return data?.content ?? ''
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('quick_notes').upsert(
        { user_id: user.id, content, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quick-notes'] }),
  })

  const debouncedSave = useCallback(
    (content: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => saveMutation.mutate(content), 800)
    },
    [saveMutation]
  )

  return { ...query, debouncedSave, isSaving: saveMutation.isPending }
}
