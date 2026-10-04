import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'accent'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px]',
        tone === 'accent' ? 'bg-accent/12 text-accent' : 'bg-surface-2 text-mute',
        className,
      )}
    >
      {children}
    </span>
  )
}
