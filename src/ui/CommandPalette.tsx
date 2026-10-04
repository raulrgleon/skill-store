import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Search } from 'lucide-react'
import { publicCatalog, skillPath } from '../lib/catalog'
import { useRouter } from '../lib/router'
import { SkillIcon } from '../components/SkillIcon'

const pages = [
  { label: 'Inicio', href: '/' },
  { label: 'Explorar', href: '/explorar' },
  { label: 'Biblioteca', href: '/biblioteca' },
  { label: 'Equipos', href: '/equipos' },
  { label: 'Publicar una skill', href: '/publicar' },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { navigate } = useRouter()
  const reduce = useReducedMotion()
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('es')
    const skills = publicCatalog()
      .filter((skill) =>
        q
          ? [skill.name, skill.subtitle, skill.author, skill.category].join(' ').toLocaleLowerCase('es').includes(q)
          : true,
      )
      .slice(0, q ? 8 : 6)
      .map((skill) => ({ kind: 'skill' as const, id: skill.id, label: skill.name, hint: skill.author, href: skillPath(skill.id), skill }))
    const links = pages
      .filter((page) => (q ? page.label.toLocaleLowerCase('es').includes(q) : !q))
      .map((page) => ({ kind: 'page' as const, id: page.href, label: page.label, hint: 'Página', href: page.href, skill: null }))
    return q ? [...skills, ...links] : [...links.slice(0, 4), ...skills]
  }, [query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const timer = window.setTimeout(() => input.current?.focus(), 0)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = overflow
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  if (!open) return null

  function choose(index: number) {
    const item = results[index]
    if (!item) return
    navigate(item.href)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Cerrar búsqueda" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar skills"
        className="relative w-full max-w-xl overflow-hidden rounded-[14px] border border-line bg-surface shadow-soft"
        style={reduce ? undefined : { animation: 'hero-in 160ms ease-out' }}
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search size={16} className="text-mute" aria-hidden />
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar skills, autores o páginas"
            aria-label="Buscar"
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-mute"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
              } else if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActive((current) => Math.min(current + 1, results.length - 1))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActive((current) => Math.max(current - 1, 0))
              } else if (event.key === 'Enter') {
                event.preventDefault()
                choose(active)
              }
            }}
          />
        </div>
        <ul className="max-h-[360px] overflow-y-auto p-2" role="listbox" aria-label="Resultados">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-[14px] text-mute">Ninguna skill coincide con “{query.trim()}”.</li>
          ) : (
            results.map((item, index) => (
              <li key={`${item.kind}-${item.id}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  className={`flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left ${index === active ? 'bg-surface-2' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                >
                  {item.skill ? <SkillIcon skill={item.skill} size={32} /> : <span className="size-8 rounded-[8px] bg-surface-2" />}
                  <span className="min-w-0">
                    <span className="block truncate text-[14px]">{item.label}</span>
                    <span className="block truncate text-[12px] text-mute">{item.hint}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
