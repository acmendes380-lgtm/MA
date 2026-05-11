'use client'

import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import type { GolfRound } from '@/types'

export function ScoreChart({ rounds }: { rounds: GolfRound[] }) {
  const data = [...rounds]
    .reverse()
    .slice(-20)
    .map((r) => ({
      date: format(new Date(r.date), 'MMM d'),
      Score: r.score,
    }))

  return (
    <Card>
      <h3 className="text-sm font-medium text-white mb-4">Score Trend</h3>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, bottom: 0, left: 0, right: 8 }}>
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
          <YAxis domain={['dataMin - 4', 'dataMax + 4']} hide />
          <ReferenceLine y={72} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
          />
          <Line
            type="monotone"
            dataKey="Score"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
