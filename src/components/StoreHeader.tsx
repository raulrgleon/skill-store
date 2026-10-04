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
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-[880px] items-end gap-6 px-5 pt-5 pb-0">
        <p className="display pb-3 text-[28px] leading-none">Skill Store</p>
        <nav className="ml-auto hidden items-end gap-5 md:flex">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              className={`border-b-2 pb-3 text-[15px] ${
                tab === item.id
                  ? 'border-ink font-medium text-ink'
                  : 'border-transparent text-mute hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-[880px] px-5 py-3">
        <label className="block">
          <span className="sr-only">Buscar</span>
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            onFocus={() => onTab('explorar')}
            placeholder="Buscar por oficio o por agente"
            className="w-full border-0 border-b border-line bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-dim"
          />
        </label>
      </div>
    </header>
  )
}
