import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  className?: string
  bodyClassName?: string
  footer?: React.ReactNode
  children: React.ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  description,
  className,
  bodyClassName,
  footer,
  children,
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-[3px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.28, ease: EASE }}
            className={cn(
              'flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-line bg-surface-raised shadow-2xl',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex shrink-0 items-start justify-between gap-6 border-b border-line px-4 py-3.5">
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-body">{title}</h2>
                  {description && (
                    <p className="mt-1 truncate text-[12px] text-muted">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xs p-1 text-faint transition-colors duration-200 hover:bg-surface-sunken hover:text-body"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className={cn('scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4', bodyClassName)}>
              {children}
            </div>
            {footer && (
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-4 py-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
