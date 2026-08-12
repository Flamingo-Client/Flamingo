import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'border-line bg-surface-sunken text-muted',
        solid: 'border-transparent bg-accent text-accent-foreground',
        secondary: 'border-line bg-surface-sunken text-muted',
        destructive: 'border-bad/25 bg-bad/[0.08] text-bad',
        outline: 'border-line-strong bg-transparent text-body',
        success: 'border-good/25 bg-good/[0.08] text-good',
        warning: 'border-warn/25 bg-warn/[0.08] text-warn',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
