'use client'

import { useState } from 'react'
import { useHabits } from '@/hooks/use-habits'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

export function HabitStreaks() {
  const { data: habits, isLoading, toggleToday, createHabit } = useHabits()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    await createHabit.mutateAsync({ name: newName.trim(), color: selectedColor })
    setNewName('')
    setShowAdd(false)
  }

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-medium text-white">Habits</h3>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {habits?.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center gap-3 rounded-lg border border-white/[0.04] p-2.5 hover:border-white/[0.08] transition-colors"
            >
              <button
                onClick={() =>
                  toggleToday.mutate({
                    habitId: habit.id,
                    completed: !habit.completedToday,
                  })
                }
                className={cn(
                  'h-5 w-5 rounded-full border-2 transition-all shrink-0',
                  habit.completedToday
                    ? 'border-transparent'
                    : 'border-white/20 hover:border-white/40'
                )}
                style={
                  habit.completedToday
                    ? { backgroundColor: habit.color }
                    : undefined
                }
              />
              <span className="flex-1 text-sm text-neutral-200">{habit.name}</span>
              {habit.streak > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">
                    {habit.streak}
                  </span>
                </div>
              )}
            </div>
          ))}

          {showAdd && (
            <form onSubmit={handleCreate} className="space-y-2 pt-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Habit name..."
                autoFocus
                className="w-full rounded-lg border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/40 transition-colors"
              />
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={cn(
                      'h-5 w-5 rounded-full transition-transform',
                      selectedColor === c && 'scale-125'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="ml-auto text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {!habits?.length && !showAdd && (
            <p className="text-center text-xs text-neutral-600 py-4">
              No habits yet. Add one to start tracking.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
