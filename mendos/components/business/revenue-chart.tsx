'use client'

import { useClients } from '@/hooks/use-business'
import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { calcTotalRevenue } from '@/lib/utils/business-utils'

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

export function RevenueChart() {
  const { data: clients } = useClients()

  const active = clients?.filter((c) => c.status === 'active') ?? []
  const data = active.map((c) => ({ name: c.name, value: c.value })).filter((d) => d.value > 0)
  const total = calcTotalRevenue(clients ?? [])

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Revenue Breakdown</h3>
        <span className="text-lg font-bold text-cyan-400">${total.toLocaleString()}</span>
      </div>
      {data.length > 0 ? (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={55}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f0f0f0',
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-neutral-400 flex-1 truncate">{d.name}</span>
                <span className="text-xs font-mono text-white">${d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-600 text-center py-6">
          Add active clients with contract values to see revenue.
        </p>
      )}
    </Card>
  )
}
