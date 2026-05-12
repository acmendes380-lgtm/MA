'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getStrengthProgress } from '@/lib/utils/gym-utils'
import { format } from 'date-fns'

interface Props {
  exercises: { date: string; name: string; weight: number | null; sets: number; reps: number }[]
  exerciseNames: string[]
}

export function StrengthChart({ exercises, exerciseNames }: Props) {
  const [selected, setSelected] = useState(exerciseNames[0] ?? '')

  const data = getStrengthProgress(exercises, selected).map((d) => ({
    date: format(new Date(d.date), 'M/d'),
    weight: d.weight,
  }))

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Strength Progress</h3>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-2 py-1 text-xs text-white outline-none"
        >
          {exerciseNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`${v} kg`, 'Weight']}
            />
            <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-xs text-neutral-600 text-center py-8">No data for {selected}</p>
      )}
    </Card>
  )
}
