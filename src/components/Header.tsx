import { useEffect, useState } from 'react'
import { Menu, Moon, Search, Sun } from 'lucide-react'
import { useRouter, type Route } from '../lib/router'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

const links: { href: string; label: string; page: Route['page'] }[] = [
  { href: '/', label: 'Inicio', page: 'home' },
  { href: '/explorar', label: 'Explorar', page: 'browse' },
  { href: '/biblioteca', label: 'Biblioteca', page: 'library' },
  { href: '/equipos', label: 'Equipos', page: 'teams' },
]

function useModLabel() {
  const [label, setLabel] = useState('Ctrl K')
  useEffect(() => {
    setLabel(/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K')
  }, [])
  return label
}

export function Header({
  theme,
  onTheme,
  onSearch,
}: {
  theme: 'light' | 'dark'
  onTheme: () => void
  onSearch: () => void
}) {
  const { route, navigate } = useRouter()
  const mod = useModLabel()
  const [menu, setMenu] = useState(false)
  const current = route.page

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-5">
        <button type="button" onClick={() => navigate('/')} className="shrink-0 text-[15px] font-medium tracking-tight">
          Skill Store
        </button>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Principal">
          {links.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => navigate(link.href)}
              aria-current={current === link.page ? 'page' : undefined}
              className={`rounded-[8px] px-2.5 py-1.5 text-[14px] ${current === link.page ? 'text-ink' : 'text-mute hover:text-ink'}`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={onSearch}
          className="ml-auto hidden h-10 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-left text-[14px] text-mute sm:flex sm:max-w-sm"
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Search size={15} aria-hidden />
          <span className="flex-1 truncate">Buscar skills</span>
          <kbd className="rounded-[6px] border border-line px-1.5 py-0.5 font-sans text-[11px] text-mute">{mod}</kbd>
        </button>

        <button
          type="button"
          className="ml-auto rounded-[10px] border border-line p-2 text-mute sm:hidden"
          aria-label="Buscar"
          onClick={onSearch}
        >
          <Search size={16} />
        </button>

        <button
          type="button"
          onClick={onTheme}
          aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
          className="rounded-[10px] border border-line p-2 text-mute hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <Button className="hidden sm:inline-flex" onClick={() => navigate('/publicar')}>
          Publicar
        </Button>

        <button type="button" className="rounded-[10px] border border-line p-2 md:hidden" aria-label="Abrir menú" onClick={() => setMenu(true)}>
          <Menu size={16} />
        </button>
      </div>

      {menu ? (
        <Dialog title="Menú" onClose={() => setMenu(false)}>
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <button
                key={link.href}
                type="button"
                className="rounded-[10px] px-3 py-2 text-left text-[15px] hover:bg-surface-2"
                onClick={() => {
                  setMenu(false)
                  navigate(link.href)
                }}
              >
                {link.label}
              </button>
            ))}
            <Button
              className="mt-3"
              onClick={() => {
                setMenu(false)
                navigate('/publicar')
              }}
            >
              Publicar
            </Button>
          </div>
        </Dialog>
      ) : null}
    </header>
  )
}
