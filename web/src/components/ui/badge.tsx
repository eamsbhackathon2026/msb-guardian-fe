import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap', {
  variants: {
    variant: {
      primary: 'bg-primary text-white',
      soft: 'bg-orange-soft text-primary-pressed',
      success: 'bg-success-soft text-success-deep',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-danger-soft text-danger-deep',
      info: 'bg-info-soft text-info',
      neutral: 'bg-divider text-muted',
    },
    size: {
      default: 'px-2.5 py-1 text-[11px]',
      md: 'px-3 py-1.5 text-xs',
    },
  },
  defaultVariants: { variant: 'soft', size: 'default' },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}
