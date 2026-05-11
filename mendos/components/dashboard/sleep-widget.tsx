'use client'

import { useState } from 'react'
import { useDailyScore } from '@/hooks/use-daily-score'
import { Card } from '@/components/ui/card'
import { Moon } from 'lucide-react'

const QUALITY_LABELS = ['', '😴', '😔', '😐', '😊', '🌟']

export function SleepWidget() {
  const { data: score, upsertScore } = useDailyScore()
  const [editHours, setEditHours] = useState(false)
  const [hoursVal, setHoursVal] = useState('')

  function handleHoursSubmit(e: React.FormEvent) {
    e.preventDefault()
    const h = parseFloat(hoursVal)
    if (isNaN(h)) return
    upsertScore.mutate({ sleep_hours: h })
    setEditHours(false)
    setHoursVal('')
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Moon className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-neutral-400">Sleep</span>
          </div>
          {editHours ? (
            <form onSubmit={handleHoursSubmit}>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hoursVal}
                onChange={(e) => setHoursVal(e.target.value)}
                autoFocus
                onBlur={() => setEditHours(false)}
                placeholder="hrs"
                className="w-16 rounded border border-purple-500/40 bg-transparent px-2 py-1 text-sm text-white outline-none"
              />
            </form>
          ) : (
            <button
              onClick={() => setEditHours(true)}
              className="text-2xl font-bold text-white hover:text-purple-400 transition-colors"
            >
              {score?.sleep_hours ?? '—'}
              <span className="text-sm font-normal text-neutral-500"> hrs</span>
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              onClick={() => upsertScore.mutate({ sleep_quality: q })}
              className={`text-base transition-all ${
                score?.sleep_quality === q ? 'scale-125' : 'opacity-40 hover:opacity-70'
              }`}
            >
              {QUALITY_LABELS[q]}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
