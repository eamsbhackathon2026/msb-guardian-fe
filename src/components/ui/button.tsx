import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-pressed',
        secondary: 'bg-surface text-ink border border-line hover:bg-app',
        outline: 'bg-transparent text-ink border border-line hover:bg-app',
        ghost: 'bg-transparent text-muted hover:text-ink',
        danger: 'bg-danger text-white hover:opacity-90',
        dangerText: 'bg-transparent text-danger hover:bg-danger-soft',
        soft: 'bg-orange-soft text-primary-pressed hover:bg-orange-border',
      },
      size: {
        default: 'h-12 px-5 text-[15px]',
        sm: 'h-9 px-3.5 text-[13px]',
        md: 'h-11 px-4 text-sm',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type, ...props }, ref) => (
  <button ref={ref} type={type ?? 'button'} className={cn(buttonVariants({ variant, size }), className)} {...props} />
))
Button.displayName = 'Button'
