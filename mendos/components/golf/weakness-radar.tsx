'use client'

import { Card } from '@/components/ui/card'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { buildWeaknessScores } from '@/lib/utils/golf-utils'
import type { GolfRound } from '@/types'

export function WeaknessRadar({ rounds }: { rounds: GolfRound[] }) {
  const scores = buildWeaknessScores(rounds)
  const data = Object.entries(scores).map(([subject, A]) => ({ subject, A }))

  return (
    <Card>
      <h3 className="text-sm font-medium text-white mb-2">Weakness Analysis</h3>
      <p className="text-xs text-neutral-500 mb-4">Higher = stronger area</p>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11 }} />
          <Radar dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  )
}
