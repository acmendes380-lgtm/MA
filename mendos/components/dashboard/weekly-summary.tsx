'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'
import { BarChart2 } from 'lucide-react'

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    return { date: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE') }
  })
}

export function WeeklySummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['weekly-summary'],
    queryFn: async () => {
      const supabase = createClient()
      const days = getLast7Days()
      const { data: goals } = await supabase
        .from('daily_goals')
        .select('date, completed')
        .in('date', days.map((d) => d.date))
        .eq('completed', true)

      const counts: Record<string, number> = {}
      goals?.forEach((g) => {
        counts[g.date] = (counts[g.date] ?? 0) + 1
      })

      return days.map((d) => ({
        label: d.label,
        Goals: counts[d.date] ?? 0,
        isToday: d.date === format(new Date(), 'yyyy-MM-dd'),
      }))
    },
  })

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-medium text-white">Weekly Progress</h3>
        <span className="text-xs text-neutral-600 ml-auto">Goals completed</span>
      </div>

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : (
        <ResponsiveContainer width="100%" height={128}>
          <BarChart data={data} barSize={18} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#555', fontSize: 11 }}
            />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f0f0f0',
              }}
            />
            <Bar
              dataKey="Goals"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              fillOpacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
