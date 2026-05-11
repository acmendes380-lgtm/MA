import { cn } from '@/lib/utils/cn'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  color?: string
  className?: string
}

export function StatCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  color = '#3b82f6',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-[#111111] p-4',
        className
      )}
    >
      <p className="text-xs text-neutral-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-white" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-sm text-neutral-500">{unit}</span>}
      </div>
      {trend && (
        <div className="mt-1.5 flex items-center gap-1">
          {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-400" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
          {trend === 'neutral' && <Minus className="h-3 w-3 text-neutral-500" />}
          {trendLabel && (
            <span
              className={cn(
                'text-xs',
                trend === 'up' && 'text-emerald-400',
                trend === 'down' && 'text-red-400',
                trend === 'neutral' && 'text-neutral-500'
              )}
            >
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
