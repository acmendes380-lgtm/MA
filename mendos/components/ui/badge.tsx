import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white/[0.06] text-neutral-400',
  blue: 'bg-blue-500/10 text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-400',
  red: 'bg-red-500/10 text-red-400',
  purple: 'bg-purple-500/10 text-purple-400',
  cyan: 'bg-cyan-500/10 text-cyan-400',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
