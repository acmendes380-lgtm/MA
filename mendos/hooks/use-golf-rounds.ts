'use client'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { GolfRound } from '@/types'

export function useGolfRounds(limit = 20) {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['golf-rounds', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_rounds')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as GolfRound[]
    },
  })

  const logRound = useMutation({
    mutationFn: async (
      input: Omit<GolfRound, 'id' | 'user_id'>
    ) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase.from('golf_rounds').insert({
        user_id: user.id,
        ...input,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['golf-rounds'] }),
  })

  const deleteRound = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('golf_rounds').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['golf-rounds'] }),
  })

  return { ...query, logRound, deleteRound }
}

export function useGolfCoachMessages() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['golf-coach-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_coach_messages')
        .select('*')
        .order('created_at')
        .limit(50)
      if (error) throw error
      return data as { id: string; role: string; content: string; created_at: string }[]
    },
  })

  const addMessage = useMutation({
    mutationFn: async ({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase
        .from('golf_coach_messages')
        .insert({ user_id: user.id, role, content })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['golf-coach-messages'] }),
  })

  return { ...query, addMessage }
}
