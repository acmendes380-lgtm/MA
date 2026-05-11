'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { calcFairwayPct, calcGIRPct } from '@/lib/utils/golf-utils'
import { format } from 'date-fns'
import type { GolfRound } from '@/types'

export function StatsChart({ rounds }: { rounds: GolfRound[] }) {
  const data = [...rounds]
    .reverse()
    .slice(-10)
    .map((r) => ({
      date: format(new Date(r.date), 'M/d'),
      'FW%': calcFairwayPct(r.fairways_hit, r.fairways_total),
      'GIR%': calcGIRPct(r.gir),
      Putts: r.putts,
    }))

  return (
    <Card>
      <h3 className="text-sm font-medium text-white mb-4">Stats (Last 10 Rounds)</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={12} barCategoryGap="30%">
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
          />
          <Bar dataKey="FW%" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="GIR%" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
