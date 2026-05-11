'use client'

import { useGolfRounds } from '@/hooks/use-golf-rounds'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Target } from 'lucide-react'
import { calcFairwayPct, calcGIRPct } from '@/lib/utils/golf-utils'
import { format } from 'date-fns'

export function RoundList() {
  const { data: rounds, isLoading, deleteRound } = useGolfRounds()

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
  }

  if (!rounds?.length) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Target className="h-10 w-10 text-neutral-700 mb-3" />
        <p className="text-sm text-neutral-500">No rounds logged yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rounds.map((r) => (
        <div
          key={r.id}
          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#111111] px-4 py-3 hover:border-white/[0.10] transition-colors"
        >
          <div className="text-center shrink-0">
            <p className="text-2xl font-bold text-amber-400">{r.score}</p>
            <p className="text-xs text-neutral-600">
              {r.score > 72 ? `+${r.score - 72}` : r.score < 72 ? `${r.score - 72}` : 'E'}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{r.course}</p>
            <p className="text-xs text-neutral-500">{format(new Date(r.date), 'MMM d, yyyy')}</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-neutral-500">
            <span>{calcFairwayPct(r.fairways_hit, r.fairways_total)}% FW</span>
            <span>{calcGIRPct(r.gir)}% GIR</span>
            <span>{r.putts} putts</span>
          </div>
          <button
            onClick={() => deleteRound.mutate(r.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
          </button>
        </div>
      ))}
    </div>
  )
}
