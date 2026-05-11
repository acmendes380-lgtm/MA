import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format, subDays } from 'date-fns'
import type { Habit, HabitWithStreak } from '@/types'

const today = () => format(new Date(), 'yyyy-MM-dd')

function computeStreak(logs: { date: string; completed: boolean }[]): number {
  const completed = logs
    .filter((l) => l.completed)
    .map((l) => l.date)
    .sort()
    .reverse()

  let streak = 0
  let checkDate = new Date()

  for (const date of completed) {
    const expected = format(checkDate, 'yyyy-MM-dd')
    if (date === expected) {
      streak++
      checkDate = subDays(checkDate, 1)
    } else {
      break
    }
  }
  return streak
}

export function useHabits() {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['habits-with-streaks', today()],
    queryFn: async () => {
      const { data: habits, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at')
      if (error) throw error

      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id, date, completed')
        .gte('date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))

      return (habits as Habit[]).map((h): HabitWithStreak => {
        const habitLogs = (logs ?? []).filter((l) => l.habit_id === h.id)
        return {
          ...h,
          streak: computeStreak(habitLogs),
          completedToday: habitLogs.some(
            (l) => l.date === today() && l.completed
          ),
        }
      })
    },
  })

  const toggleToday = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: string; completed: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('habit_logs').upsert(
        { habit_id: habitId, user_id: user.id, date: today(), completed },
        { onConflict: 'habit_id,date' }
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits-with-streaks'] }),
  })

  const createHabit = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('habits').insert({ user_id: user.id, name, color })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits-with-streaks'] }),
  })

  return { ...query, toggleToday, createHabit }
}
