'use client'

import { cn } from '@/lib/utils/cn'

interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export function Logo({ size = 32, className, showText = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="32" height="32" rx="8" fill="#0d0d0d" />

        {/* Diagonal arms (dim) */}
        <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#3b82f6" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round" />
        <line x1="22.5" y1="9.5" x2="19.5" y2="12.5" stroke="#3b82f6" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round" />
        <line x1="9.5" y1="22.5" x2="12.5" y2="19.5" stroke="#3b82f6" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round" />
        <line x1="22.5" y1="22.5" x2="19.5" y2="19.5" stroke="#3b82f6" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round" />

        {/* Cardinal N — pointed upward, filled blue */}
        <polygon points="16,4 14,13 18,13" fill="#3b82f6" />

        {/* Cardinal S — pointed downward, filled white/dim */}
        <polygon points="16,28 14,19 18,19" fill="white" fillOpacity="0.5" />

        {/* Cardinal W — pointed left, filled white/dim */}
        <polygon points="4,16 13,14 13,18" fill="white" fillOpacity="0.5" />

        {/* Cardinal E — pointed right, filled white/dim */}
        <polygon points="28,16 19,14 19,18" fill="white" fillOpacity="0.5" />

        {/* Center dot */}
        <circle cx="16" cy="16" r="2" fill="white" />
        <circle cx="16" cy="16" r="1" fill="#3b82f6" />
      </svg>

      {showText && (
        <span className="text-sm font-semibold text-white tracking-tight">
          MendOS
        </span>
      )}
    </div>
  )
}
