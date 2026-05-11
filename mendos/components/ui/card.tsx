import { cn } from '@/lib/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  accent?: string
}

export function Card({ children, className, hover, accent }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-[#111111] p-5',
        hover &&
          'transition-all duration-200 hover:border-white/[0.10] hover:bg-[#161616] cursor-pointer',
        accent && `border-l-2`,
        className
      )}
      style={accent ? { borderLeftColor: accent } : undefined}
    >
      {children}
    </div>
  )
}
