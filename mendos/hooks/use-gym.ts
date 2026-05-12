'use client'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Workout, WorkoutExercise } from '@/types'
import { format } from 'date-fns'

export function useWorkouts(limit = 30) {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['workouts', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_exercises(*)')
        .order('date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as (Workout & { workout_exercises: WorkoutExercise[] })[]
    },
  })

  const logWorkout = useMutation({
    mutationFn: async ({
      workout,
      exercises,
    }: {
      workout: Omit<Workout, 'id' | 'user_id' | 'created_at'>
      exercises: Omit<WorkoutExercise, 'id' | 'workout_id'>[]
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')

      const { data: w, error: we } = await supabase
        .from('workouts')
        .insert({ user_id: user.id, ...workout })
        .select()
        .single()
      if (we) throw we

      if (exercises.length > 0) {
        const { error: ee } = await supabase.from('workout_exercises').insert(
          exercises.map((e, i) => ({ workout_id: w.id, order_index: i, ...e }))
        )
        if (ee) throw ee
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })

  const deleteWorkout = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workouts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })

  return { ...query, logWorkout, deleteWorkout }
}

export function useBodyweight() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['bodyweight'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bodyweight_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(90)
      if (error) throw error
      return data as { id: string; date: string; weight: number }[]
    },
  })

  const logWeight = useMutation({
    mutationFn: async (weight: number) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const today = format(new Date(), 'yyyy-MM-dd')
      const { error } = await supabase.from('bodyweight_logs').upsert(
        { user_id: user.id, date: today, weight },
        { onConflict: 'user_id,date' }
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bodyweight'] }),
  })

  return { ...query, logWeight }
}
