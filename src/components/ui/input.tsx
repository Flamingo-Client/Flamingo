import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-sm border border-line-strong bg-surface px-3 text-sm text-body outline-none transition-all duration-200 ease-out-expo file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-faint focus:border-body focus:ring-[3px] focus:ring-accent/[0.08] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
