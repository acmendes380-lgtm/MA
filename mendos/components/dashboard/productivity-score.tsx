'use client'

import { useState } from 'react'
import { useDailyScore } from '@/hooks/use-daily-score'
import { Card } from '@/components/ui/card'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Zap } from 'lucide-react'

export function ProductivityScore() {
  const { data: score, upsertScore } = useDailyScore()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseInt(value)
    if (isNaN(num) || num < 0 || num > 100) return
    upsertScore.mutate({ productivity_score: num, focus_minutes: score?.focus_minutes ?? 0 })
    setEditing(false)
    setValue('')
  }

  const current = score?.productivity_score ?? 0

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-neutral-400">Productivity</span>
          </div>
          {editing ? (
            <form onSubmit={handleSubmit}>
              <input
                type="number"
                min="0"
                max="100"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                onBlur={() => setEditing(false)}
                placeholder="0-100"
                className="w-20 rounded border border-blue-500/40 bg-transparent px-2 py-1 text-sm text-white outline-none"
              />
            </form>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-2xl font-bold text-white hover:text-blue-400 transition-colors"
            >
              {current}
              <span className="text-sm font-normal text-neutral-500">/100</span>
            </button>
          )}
        </div>
        <ProgressRing
          value={current}
          size={52}
          strokeWidth={4}
          color="#3b82f6"
          showValue={false}
        />
      </div>
    </Card>
  )
}
