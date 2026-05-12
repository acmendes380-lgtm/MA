'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { calcTotalVolume } from '@/lib/utils/gym-utils'
import { format, subDays } from 'date-fns'

interface Props {
  workouts: { date: string; workout_exercises: { sets: number; reps: number; weight: number | null }[] }[]
}

export function VolumeChart({ workouts }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE') }
  })

  const data = days.map((day) => {
    const dayWorkouts = workouts.filter((w) => w.date === day.date)
    const volume = dayWorkouts.reduce(
      (sum, w) => sum + calcTotalVolume(w.workout_exercises),
      0
    )
    return { label: day.label, Volume: Math.round(volume) }
  })

  return (
    <Card>
      <h3 className="text-sm font-medium text-white mb-4">Weekly Volume (kg)</h3>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} barSize={20}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 11 }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
          />
          <Bar dataKey="Volume" fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
