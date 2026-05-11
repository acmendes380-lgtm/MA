'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  showValue?: boolean
  className?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 64,
  strokeWidth = 5,
  color = '#3b82f6',
  label,
  showValue = true,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1)
  const offset = circumference * (1 - progress)

  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        {showValue && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
            {Math.round(progress * 100)}%
          </span>
        )}
      </div>
      {label && (
        <span className="text-xs text-neutral-500 text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  )
}
