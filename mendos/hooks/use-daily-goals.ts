import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { DailyGoal } from '@/types'

const today = () => format(new Date(), 'yyyy-MM-dd')

export function useDailyGoals() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['daily-goals', today()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('date', today())
        .order('order_index')
      if (error) throw error
      return data as DailyGoal[]
    },
  })

  const addGoal = useMutation({
    mutationFn: async (text: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('daily_goals').insert({
        user_id: user.id,
        text,
        date: today(),
        order_index: (query.data?.length ?? 0),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-goals'] }),
  })

  const toggleGoal = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('daily_goals')
        .update({ completed })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-goals'] }),
  })

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-goals'] }),
  })

  return { ...query, addGoal, toggleGoal, deleteGoal }
}
