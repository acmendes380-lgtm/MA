import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { DailyScore } from '@/types'

const today = () => format(new Date(), 'yyyy-MM-dd')

export function useDailyScore() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['daily-score', today()],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_scores')
        .select('*')
        .eq('date', today())
        .single()
      return data as DailyScore | null
    },
  })

  const upsertScore = useMutation({
    mutationFn: async (updates: Partial<DailyScore>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('daily_scores').upsert(
        { user_id: user.id, date: today(), ...updates },
        { onConflict: 'user_id,date' }
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-score'] }),
  })

  return { ...query, upsertScore }
}
