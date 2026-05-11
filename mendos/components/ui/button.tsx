import { cn } from '@/lib/utils/cn'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'destructive' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
          variant === 'primary' &&
            'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700',
          variant === 'ghost' &&
            'text-neutral-400 hover:bg-white/[0.05] hover:text-white',
          variant === 'destructive' &&
            'bg-red-900/30 text-red-400 hover:bg-red-900/50',
          variant === 'outline' &&
            'border border-white/[0.08] text-neutral-300 hover:bg-white/[0.04]',
          size === 'xs' && 'h-6 px-2 text-xs',
          size === 'sm' && 'h-7 px-3 text-xs',
          size === 'md' && 'h-9 px-4 text-sm',
          size === 'lg' && 'h-11 px-6 text-base',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
