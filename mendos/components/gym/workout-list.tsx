'use client'

import { useWorkouts } from '@/hooks/use-gym'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Dumbbell } from 'lucide-react'
import { format } from 'date-fns'
import { calcTotalVolume } from '@/lib/utils/gym-utils'

export function WorkoutList() {
  const { data: workouts, isLoading, deleteWorkout } = useWorkouts()

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
  if (!workouts?.length) return (
    <div className="flex flex-col items-center py-16 text-center">
      <Dumbbell className="h-10 w-10 text-neutral-700 mb-3" />
      <p className="text-sm text-neutral-500">No workouts logged yet</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {workouts.map((w) => (
        <div key={w.id} className="group rounded-xl border border-white/[0.06] bg-[#111111] p-4 hover:border-white/[0.10] transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-emerald-400 capitalize">{w.type}</span>
                <span className="text-xs text-neutral-600">{w.duration} min</span>
              </div>
              <p className="text-xs text-neutral-500">{format(new Date(w.date), 'EEEE, MMM d yyyy')}</p>
            </div>
            <div className="flex items-center gap-3">
              {w.workout_exercises.length > 0 && (
                <span className="text-xs text-neutral-600">
                  {Math.round(calcTotalVolume(w.workout_exercises)).toLocaleString()} kg vol
                </span>
              )}
              <button onClick={() => deleteWorkout.mutate(w.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
          {w.workout_exercises.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {w.workout_exercises.map((ex) => (
                <span key={ex.id} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs text-neutral-400">
                  {ex.name} {ex.sets}×{ex.reps}{ex.weight ? ` @ ${ex.weight}kg` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
