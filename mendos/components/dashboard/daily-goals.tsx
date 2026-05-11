'use client'

import { useState } from 'react'
import { useDailyGoals } from '@/hooks/use-daily-goals'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Plus, Trash2, Target } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function DailyGoals() {
  const { data: goals, isLoading, addGoal, toggleGoal, deleteGoal } = useDailyGoals()
  const [newGoal, setNewGoal] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newGoal.trim()) return
    await addGoal.mutateAsync(newGoal.trim())
    setNewGoal('')
  }

  const completed = goals?.filter((g) => g.completed).length ?? 0
  const total = goals?.length ?? 0

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-medium text-white">Today's Goals</h3>
        </div>
        {total > 0 && (
          <span className="text-xs text-neutral-500">
            {completed}/{total}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      ) : (
        <div className="space-y-2">
          {goals?.map((goal) => (
            <div
              key={goal.id}
              className="group flex items-center gap-3 rounded-lg border border-white/[0.04] p-2.5 hover:border-white/[0.08] transition-colors"
            >
              <button
                onClick={() => toggleGoal.mutate({ id: goal.id, completed: !goal.completed })}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border transition-all shrink-0',
                  goal.completed
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-white/20 hover:border-white/40'
                )}
              >
                {goal.completed && <Check className="h-3 w-3 text-white" />}
              </button>
              <span
                className={cn(
                  'flex-1 text-sm transition-colors',
                  goal.completed ? 'line-through text-neutral-600' : 'text-neutral-200'
                )}
              >
                {goal.text}
              </span>
              <button
                onClick={() => deleteGoal.mutate(goal.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
              </button>
            </div>
          ))}

          {(goals?.length ?? 0) < 5 && (
            <form onSubmit={handleAdd} className="flex items-center gap-2">
              <input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a goal..."
                className="flex-1 rounded-lg border border-white/[0.06] bg-transparent px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/40 transition-colors"
              />
              <button
                type="submit"
                disabled={!newGoal.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/80 text-white hover:bg-blue-600 transition-colors disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </Card>
  )
}
