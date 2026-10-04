import type { StoreTab } from '../types'

const items: { id: StoreTab; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'explorar', label: 'Explorar' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'biblioteca', label: 'Biblioteca' },
]

type BottomNavProps = {
  tab: StoreTab
  onTab: (tab: StoreTab) => void
}

export function BottomNav({ tab, onTab }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTab(item.id)}
            className={`py-1 text-[13px] ${tab === item.id ? 'font-medium text-ink' : 'text-mute'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
