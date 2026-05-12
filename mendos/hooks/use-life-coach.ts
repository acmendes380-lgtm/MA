'use client'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useLifeCoach() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['life-coach-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_coach_messages')
        .select('*')
        .order('created_at')
        .limit(80)
      if (error) throw error
      return data as { id: string; role: string; content: string; created_at: string }[]
    },
  })

  const addMessage = useMutation({
    mutationFn: async ({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase
        .from('life_coach_messages')
        .insert({ user_id: user.id, role, content })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['life-coach-messages'] }),
  })

  const clearHistory = useMutation({
    mutationFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase
        .from('life_coach_messages')
        .delete()
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['life-coach-messages'] }),
  })

  return { ...query, addMessage, clearHistory }
}
