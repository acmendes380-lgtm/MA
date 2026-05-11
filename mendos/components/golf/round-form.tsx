'use client'

import { useState } from 'react'
import { useGolfRounds } from '@/hooks/use-golf-rounds'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

interface RoundFormProps {
  onClose: () => void
}

export function RoundForm({ onClose }: RoundFormProps) {
  const { logRound } = useGolfRounds()
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    course: '',
    score: '',
    fairways_hit: '',
    fairways_total: '14',
    gir: '',
    putts: '',
    scrambling: '',
    penalties: '0',
    driving_distance: '',
    notes: '',
  })

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await logRound.mutateAsync({
      date: form.date,
      course: form.course,
      score: parseInt(form.score),
      fairways_hit: parseInt(form.fairways_hit) || 0,
      fairways_total: parseInt(form.fairways_total) || 14,
      gir: parseInt(form.gir) || 0,
      putts: parseInt(form.putts) || 36,
      scrambling: form.scrambling ? parseInt(form.scrambling) : null,
      penalties: parseInt(form.penalties) || 0,
      driving_distance: form.driving_distance ? parseInt(form.driving_distance) : null,
      notes: form.notes || null,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Date</label>
          <Input type="date" value={form.date} onChange={set('date')} className="[color-scheme:dark]" required />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Course</label>
          <Input value={form.course} onChange={set('course')} placeholder="Course name" required />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Score</label>
          <Input type="number" value={form.score} onChange={set('score')} placeholder="e.g. 82" required min="50" max="150" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Putts</label>
          <Input type="number" value={form.putts} onChange={set('putts')} placeholder="36" min="0" max="72" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Fairways Hit</label>
          <Input type="number" value={form.fairways_hit} onChange={set('fairways_hit')} placeholder="7" min="0" max="14" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">GIR</label>
          <Input type="number" value={form.gir} onChange={set('gir')} placeholder="9" min="0" max="18" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Scrambling %</label>
          <Input type="number" value={form.scrambling} onChange={set('scrambling')} placeholder="50" min="0" max="100" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Penalties</label>
          <Input type="number" value={form.penalties} onChange={set('penalties')} placeholder="0" min="0" max="20" />
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Drive Distance (yds)</label>
          <Input type="number" value={form.driving_distance} onChange={set('driving_distance')} placeholder="250" min="100" max="400" />
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Notes</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          placeholder="Course conditions, key moments..."
          rows={2}
          className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/50 transition-all"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" size="sm" disabled={logRound.isPending} className="flex-1">
          {logRound.isPending ? 'Saving...' : 'Log Round'}
        </Button>
      </div>
    </form>
  )
}
