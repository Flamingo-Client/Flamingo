import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium outline-none select-none transition-all duration-200 ease-out-expo focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground shadow-sm hover:opacity-90',
        destructive: 'border border-bad/25 bg-bad/[0.08] text-bad hover:bg-bad/[0.15]',
        outline: 'border border-line-strong bg-surface text-body hover:border-body hover:bg-surface-sunken',
        secondary: 'bg-surface-sunken text-body hover:bg-line',
        ghost: 'text-muted hover:bg-surface-sunken hover:text-body',
        link: 'text-body underline-offset-4 hover:underline',
        subtle: 'bg-surface-sunken text-body hover:bg-line',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3 text-[13px]',
        lg: 'h-10 px-5 text-[15px]',
        icon: 'h-8 w-8 rounded-xs',
        'icon-sm': 'h-6 w-6 rounded-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
