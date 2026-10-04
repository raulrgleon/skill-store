import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type Tab = { id: string; label: string }

export function Tabs({
  tabs,
  value,
  onChange,
  label,
  children,
}: {
  tabs: Tab[]
  value: string
  onChange: (id: string) => void
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((tab) => {
          const selected = tab.id === value
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={cn(
                'h-10 shrink-0 border-b-2 px-3 text-[14px]',
                selected ? 'border-accent text-ink' : 'border-transparent text-mute hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" className="pt-6">
        {children}
      </div>
    </div>
  )
}
