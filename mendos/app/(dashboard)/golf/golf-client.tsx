'use client'

import { useState } from 'react'
import { useGolfRounds } from '@/hooks/use-golf-rounds'
import { RoundForm } from '@/components/golf/round-form'
import { RoundList } from '@/components/golf/round-list'
import { ScoreChart } from '@/components/golf/score-chart'
import { StatsChart } from '@/components/golf/stats-chart'
import { WeaknessRadar } from '@/components/golf/weakness-radar'
import { CoachChat } from '@/components/golf/coach-chat'
import { Button } from '@/components/ui/button'
import { Plus, Target } from 'lucide-react'
import { calcFairwayPct, calcGIRPct } from '@/lib/utils/golf-utils'

const TABS = ['Overview', 'Rounds', 'Coach'] as const
type Tab = typeof TABS[number]

export default function GolfPageClient() {
  const [tab, setTab] = useState<Tab>('Overview')
  const [showForm, setShowForm] = useState(false)
  const { data: rounds } = useGolfRounds()

  const recent = rounds?.slice(0, 10) ?? []
  const avgScore = recent.length
    ? Math.round(recent.reduce((a, r) => a + r.score, 0) / recent.length)
    : null
  const avgFW = recent.length
    ? Math.round(recent.reduce((a, r) => a + calcFairwayPct(r.fairways_hit, r.fairways_total), 0) / recent.length)
    : null
  const avgGIR = recent.length
    ? Math.round(recent.reduce((a, r) => a + calcGIRPct(r.gir), 0) / recent.length)
    : null
  const bestScore = rounds?.length ? Math.min(...rounds.map((r) => r.score)) : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                tab === t ? 'bg-amber-500/10 text-amber-400' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Log Round
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-5">
          <h3 className="text-sm font-medium text-white mb-4">Log New Round</h3>
          <RoundForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Avg Score', value: avgScore ?? '—', color: '#f59e0b' },
              { label: 'Best Score', value: bestScore ?? '—', color: '#10b981' },
              { label: 'FW%', value: avgFW != null ? `${avgFW}%` : '—', color: '#3b82f6' },
              { label: 'GIR%', value: avgGIR != null ? `${avgGIR}%` : '—', color: '#8b5cf6' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
                <p className="text-xs text-neutral-500 mb-1">{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
          {rounds && rounds.length > 0 && (
            <>
              <ScoreChart rounds={rounds} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <StatsChart rounds={rounds} />
                <WeaknessRadar rounds={rounds} />
              </div>
            </>
          )}
          {(!rounds || rounds.length === 0) && (
            <div className="flex flex-col items-center py-20 text-center">
              <Target className="h-12 w-12 text-neutral-700 mb-4" />
              <p className="text-neutral-500 text-sm">Log your first round to see analytics</p>
            </div>
          )}
        </div>
      )}

      {tab === 'Rounds' && <RoundList />}
      {tab === 'Coach' && <CoachChat />}
    </div>
  )
}
