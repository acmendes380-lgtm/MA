'use client'

import { useState } from 'react'
import { useWorkouts } from '@/hooks/use-gym'
import { WorkoutForm } from '@/components/gym/workout-form'
import { WorkoutList } from '@/components/gym/workout-list'
import { BodyweightChart } from '@/components/gym/bodyweight-chart'
import { StrengthChart } from '@/components/gym/strength-chart'
import { VolumeChart } from '@/components/gym/volume-chart'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles, Loader2, Dumbbell } from 'lucide-react'
import { calcWeeklyWorkouts } from '@/lib/utils/gym-utils'

const TABS = ['Overview', 'Workouts', 'AI Coach'] as const
type Tab = typeof TABS[number]

export default function GymPageClient() {
  const [tab, setTab] = useState<Tab>('Overview')
  const [showForm, setShowForm] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const { data: workouts } = useWorkouts()

  const allExercises = workouts?.flatMap((w) =>
    w.workout_exercises.map((e) => ({ ...e, date: w.date }))
  ) ?? []
  const exerciseNames = [...new Set(allExercises.map((e) => e.name))].slice(0, 10)
  const weeklyCount = calcWeeklyWorkouts(workouts?.map((w) => ({ date: w.date })) ?? [])
  const totalWorkouts = workouts?.length ?? 0

  async function getAISuggestion() {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/workout-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workouts: workouts?.slice(0, 8) ?? [] }),
      })
      const data = await res.json()
      setAiSuggestion(data.suggestion)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                tab === t ? 'bg-emerald-500/10 text-emerald-400' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Log Workout
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-5">
          <h3 className="text-sm font-medium text-white mb-4">Log New Workout</h3>
          <WorkoutForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'This Week', value: weeklyCount, suffix: ' workouts', color: '#10b981' },
              { label: 'Total Workouts', value: totalWorkouts, suffix: '', color: '#3b82f6' },
              { label: 'Exercises Tracked', value: exerciseNames.length, suffix: '', color: '#f59e0b' },
              { label: 'Workout Types', value: [...new Set(workouts?.map((w) => w.type) ?? [])].length, suffix: '', color: '#8b5cf6' },
            ].map(({ label, value, suffix, color }) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
                <p className="text-xs text-neutral-500 mb-1">{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}{suffix}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BodyweightChart />
            <VolumeChart workouts={workouts ?? []} />
          </div>
          {exerciseNames.length > 0 && (
            <StrengthChart exercises={allExercises} exerciseNames={exerciseNames} />
          )}
          {(!workouts || workouts.length === 0) && (
            <div className="flex flex-col items-center py-20 text-center">
              <Dumbbell className="h-12 w-12 text-neutral-700 mb-4" />
              <p className="text-neutral-500 text-sm">Log your first workout to see analytics</p>
            </div>
          )}
        </div>
      )}

      {tab === 'Workouts' && <WorkoutList />}

      {tab === 'AI Coach' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">AI Workout Suggestion</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Based on your recent training history</p>
            </div>
            <Button size="sm" onClick={getAISuggestion} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? 'Thinking...' : 'Get Suggestion'}
            </Button>
          </div>
          {aiSuggestion && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">{aiSuggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
