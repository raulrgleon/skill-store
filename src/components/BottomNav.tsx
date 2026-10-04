import type { StoreTab } from '../types'

const items: { id: StoreTab; label: string; icon: string }[] = [
  { id: 'hoy', label: 'Hoy', icon: '▣' },
  { id: 'explorar', label: 'Explorar', icon: '◎' },
  { id: 'equipos', label: 'Equipos', icon: '☰' },
  { id: 'biblioteca', label: 'Biblioteca', icon: '▢' },
]

type BottomNavProps = {
  tab: StoreTab
  onTab: (tab: StoreTab) => void
}

export function BottomNav({ tab, onTab }: BottomNavProps) {
  return (
    <nav className="frost fixed inset-x-0 bottom-0 z-30 hairline md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5 pb-[max(10px,env(safe-area-inset-bottom))]">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium ${
              tab === item.id ? 'text-blue' : 'text-mute'
            }`}
          >
            <span className="text-[18px] leading-none">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
