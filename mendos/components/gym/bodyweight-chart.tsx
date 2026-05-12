'use client'

import { useState } from 'react'
import { useBodyweight } from '@/hooks/use-gym'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { Scale } from 'lucide-react'

export function BodyweightChart() {
  const { data: logs, logWeight } = useBodyweight()
  const [input, setInput] = useState('')

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    const w = parseFloat(input)
    if (isNaN(w) || w <= 0) return
    await logWeight.mutateAsync(w)
    setInput('')
  }

  const chartData = [...(logs ?? [])]
    .reverse()
    .slice(-30)
    .map((l) => ({ date: format(new Date(l.date), 'M/d'), weight: l.weight }))

  const latest = logs?.[0]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-white">Bodyweight</h3>
        </div>
        {latest && (
          <span className="text-lg font-bold text-emerald-400">{latest.weight} kg</span>
        )}
      </div>

      <form onSubmit={handleLog} className="flex gap-2 mb-4">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Log today's weight (kg)"
          step="0.1"
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-emerald-500/40 transition-colors"
        />
        <Button type="submit" size="sm" variant="outline" disabled={!input}>Log</Button>
      </form>

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
            />
            <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
