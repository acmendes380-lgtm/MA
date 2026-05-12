'use client'

import { useState } from 'react'
import { useWorkouts } from '@/hooks/use-gym'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface ExerciseRow {
  name: string
  sets: string
  reps: string
  weight: string
}

interface WorkoutFormProps {
  onClose: () => void
}

export function WorkoutForm({ onClose }: WorkoutFormProps) {
  const { logWorkout } = useWorkouts()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [type, setType] = useState<'strength' | 'cardio' | 'flexibility' | 'other'>('strength')
  const [duration, setDuration] = useState('60')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<ExerciseRow[]>([
    { name: '', sets: '3', reps: '10', weight: '' },
  ])

  function addExercise() {
    setExercises((prev) => [...prev, { name: '', sets: '3', reps: '10', weight: '' }])
  }

  function removeExercise(i: number) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateExercise(i: number, key: keyof ExerciseRow, value: string) {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await logWorkout.mutateAsync({
      workout: {
        date,
        type,
        duration: parseInt(duration) || 60,
        notes: notes || null,
      },
      exercises: exercises
        .filter((e) => e.name.trim())
        .map((e) => ({
          name: e.name.trim(),
          sets: parseInt(e.sets) || 3,
          reps: parseInt(e.reps) || 10,
          weight: e.weight ? parseFloat(e.weight) : null,
        })),
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="[color-scheme:dark]" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none capitalize"
          >
            {(['strength', 'cardio', 'flexibility', 'other'] as const).map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Duration (min)</label>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" max="300" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-neutral-400">Exercises</label>
          <button type="button" onClick={addExercise} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            + Add exercise
          </button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-neutral-600 px-1">
            <span className="col-span-5">Exercise</span>
            <span className="col-span-2 text-center">Sets</span>
            <span className="col-span-2 text-center">Reps</span>
            <span className="col-span-2 text-center">kg</span>
            <span className="col-span-1" />
          </div>
          {exercises.map((ex, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input value={ex.name} onChange={(e) => updateExercise(i, 'name', e.target.value)} placeholder="e.g. Bench Press" className="col-span-5" />
              <Input type="number" value={ex.sets} onChange={(e) => updateExercise(i, 'sets', e.target.value)} min="1" max="20" className="col-span-2 text-center" />
              <Input type="number" value={ex.reps} onChange={(e) => updateExercise(i, 'reps', e.target.value)} min="1" max="100" className="col-span-2 text-center" />
              <Input type="number" value={ex.weight} onChange={(e) => updateExercise(i, 'weight', e.target.value)} placeholder="—" step="0.5" className="col-span-2 text-center" />
              <button type="button" onClick={() => removeExercise(i)} className="col-span-1 flex justify-center">
                <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? PRs? Focus areas?"
          rows={2}
          className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/50 transition-all"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" size="sm" disabled={logWorkout.isPending} className="flex-1">
          {logWorkout.isPending ? 'Saving...' : 'Log Workout'}
        </Button>
      </div>
    </form>
  )
}
