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
        {/* Background rounded square */}
        <rect width="32" height="32" rx="8" fill="#1a1a2e" />
        {/* Stylized M mark */}
        <path
          d="M6 24V8l10 9 10-9v16"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Blue accent dot at peak */}
        <circle cx="16" cy="17" r="2" fill="#3b82f6" />
      </svg>
      {showText && (
        <span className="text-sm font-semibold text-white tracking-tight">
          MendOS
        </span>
      )}
    </div>
  )
}
