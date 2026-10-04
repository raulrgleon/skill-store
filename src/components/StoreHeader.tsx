import type { StoreTab } from '../types'

const tabs: { id: StoreTab; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'explorar', label: 'Explorar' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'biblioteca', label: 'Biblioteca' },
]

type StoreHeaderProps = {
  tab: StoreTab
  query: string
  onTab: (tab: StoreTab) => void
  onQuery: (value: string) => void
}

export function StoreHeader({ tab, query, onTab, onQuery }: StoreHeaderProps) {
  return (
    <header className="frost sticky top-0 z-30 hairline">
      <div className="mx-auto flex max-w-[1080px] items-center gap-4 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-[9px] bg-[#0A84FF] text-[15px] font-bold text-white">
            S
          </div>
          <div className="hidden leading-none sm:block">
            <p className="text-[15px] font-semibold tracking-tight">Skill Store</p>
            <p className="mt-0.5 text-[11px] text-mute">Para todas las IAs</p>
          </div>
        </div>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                tab === item.id ? 'bg-white/10 text-white' : 'text-mute hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <label className="relative ml-auto min-w-0 flex-1 md:max-w-[280px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute">
            ⌕
          </span>
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            onFocus={() => onTab('explorar')}
            placeholder="Buscar skills, oficios, IAs"
            className="w-full rounded-full border-0 bg-white/8 py-2 pr-3 pl-8 text-[13px] text-white outline-none placeholder:text-mute"
          />
        </label>

        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ff9f0a] to-[#ff375f] text-[12px] font-bold">
          R
        </div>
      </div>
    </header>
  )
}
