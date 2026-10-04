import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { SkillCard } from '../components/SkillCard'
import { agents } from '../data/skills'
import {
  TAG_OPTIONS,
  activeFilterCount,
  applyFilters,
  categoryOptions,
  filtersFromParams,
  hrefFromFilters,
  publicCatalog,
  sortSkills,
  type Filters,
  type SortKey,
} from '../lib/catalog'
import { useRouter } from '../lib/router'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

const PAGE_SIZE = 9

const sorts: { id: SortKey; label: string }[] = [
  { id: 'tendencia', label: 'Tendencia' },
  { id: 'adoptadas', label: 'Más adoptadas' },
  { id: 'recientes', label: 'Recientes' },
  { id: 'puntuacion', label: 'Mejor puntuación' },
]

function FilterFields({
  filters,
  onChange,
  scope,
}: {
  filters: Filters
  onChange: (next: Filters) => void
  scope: string
}) {
  function patch(partial: Partial<Filters>) {
    onChange({ ...filters, ...partial, pagina: partial.pagina ?? 1 })
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-[13px] text-ink">Categoría</legend>
        <div className="mt-2 space-y-1">
          <FilterRadio name={`${scope}-categoria`} label="Todas" checked={!filters.categoria} onChange={() => patch({ categoria: '' })} />
          {categoryOptions().map((category) => (
            <FilterRadio
              key={category.id}
              name={`${scope}-categoria`}
              label={category.label}
              checked={filters.categoria === category.id}
              onChange={() => patch({ categoria: category.id })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[13px] text-ink">Etiqueta</legend>
        <div className="mt-2 space-y-1">
          <FilterRadio name={`${scope}-etiqueta`} label="Todas" checked={!filters.etiqueta} onChange={() => patch({ etiqueta: '' })} />
          {TAG_OPTIONS.map((tag) => (
            <FilterRadio
              key={tag}
              name={`${scope}-etiqueta`}
              label={tag}
              checked={filters.etiqueta === tag}
              onChange={() => patch({ etiqueta: tag })}
            />
          ))}
        </div>
      </fieldset>

      <label className="block text-[13px] text-ink">
        Compatibilidad
        <select
          className="mt-2 h-10 w-full rounded-[10px] border border-line bg-surface px-2 text-[14px]"
          value={filters.agente}
          onChange={(event) => patch({ agente: event.target.value })}
        >
          <option value="">Cualquier agente</option>
          {agents.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-[14px]">
        <input
          type="checkbox"
          className="size-4 accent-(--accent)"
          checked={filters.verificada}
          onChange={(event) => patch({ verificada: event.target.checked })}
        />
        Solo verificadas
      </label>

      <fieldset>
        <legend className="text-[13px] text-ink">Precio</legend>
        <div className="mt-2 space-y-1">
          <FilterRadio name={`${scope}-precio`} label="Todos" checked={!filters.precio} onChange={() => patch({ precio: '' })} />
          <FilterRadio name={`${scope}-precio`} label="Gratis" checked={filters.precio === 'gratis'} onChange={() => patch({ precio: 'gratis' })} />
          <FilterRadio name={`${scope}-precio`} label="De pago" checked={filters.precio === 'pago'} onChange={() => patch({ precio: 'pago' })} />
        </div>
      </fieldset>
    </div>
  )
}

function FilterRadio({
  name,
  label,
  checked,
  onChange,
}: {
  name: string
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-2 text-[14px] text-mute">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-(--accent)" />
      {label}
    </label>
  )
}

export function BrowsePage() {
  const { params, replace } = useRouter()
  const filters = filtersFromParams(params)
  const [drawer, setDrawer] = useState(false)
  const filtered = sortSkills(applyFilters(publicCatalog(), filters), filters.orden)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(filters.pagina, pages)
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const count = activeFilterCount(filters)

  function update(next: Filters) {
    replace(hrefFromFilters(next))
  }

  function clear() {
    replace('/explorar')
  }

  return (
    <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-10 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-[20px] font-medium tracking-tight">Explorar</h1>
            {count > 0 ? (
              <button type="button" onClick={clear} className="text-[13px] text-accent">
                Limpiar
              </button>
            ) : null}
          </div>
          <FilterFields filters={filters} onChange={update} scope="escritorio" />
        </div>
      </aside>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-medium tracking-tight lg:hidden">Explorar</h1>
          <label className="min-w-[200px] flex-1 text-[13px] text-mute">
            <span className="sr-only">Buscar en el catálogo</span>
            <input
              value={filters.q}
              onChange={(event) => update({ ...filters, q: event.target.value, pagina: 1 })}
              placeholder="Buscar en el catálogo"
              className="h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-mute"
            />
          </label>
          <label className="text-[13px] text-mute">
            <span className="sr-only">Ordenar</span>
            <select
              value={filters.orden}
              onChange={(event) => update({ ...filters, orden: event.target.value as SortKey, pagina: 1 })}
              className="h-10 rounded-[10px] border border-line bg-surface px-2 text-[14px] text-ink"
            >
              {sorts.map((sort) => (
                <option key={sort.id} value={sort.id}>
                  {sort.label}
                </option>
              ))}
            </select>
          </label>
          <Button variant="secondary" className="lg:hidden" onClick={() => setDrawer(true)}>
            <SlidersHorizontal size={15} />
            Filtros{count ? ` (${count})` : ''}
          </Button>
        </div>

        <p className="mt-4 text-[14px] text-mute">
          {filtered.length === 0 ? 'Sin resultados' : `${filtered.length} skills`}
        </p>

        {slice.length === 0 ? (
          <div className="mt-8 max-w-md">
            <h2 className="text-[20px] font-medium tracking-tight">Ninguna skill coincide</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-mute">Quita un filtro o prueba con otra palabra.</p>
            <Button className="mt-4" variant="secondary" onClick={clear}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {slice.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav className="mt-8 flex items-center justify-between" aria-label="Páginas">
            <Button variant="secondary" disabled={page <= 1} onClick={() => update({ ...filters, pagina: page - 1 })}>
              Anterior
            </Button>
            <p className="text-[14px] text-mute">
              Página {page} de {pages}
            </p>
            <Button variant="secondary" disabled={page >= pages} onClick={() => update({ ...filters, pagina: page + 1 })}>
              Siguiente
            </Button>
          </nav>
        ) : null}
      </div>

      {drawer ? (
        <Dialog title="Filtros" onClose={() => setDrawer(false)}>
          <FilterFields filters={filters} onChange={update} scope="movil" />
          <Button className="mt-6 w-full" onClick={() => setDrawer(false)}>
            Ver {filtered.length} skills
          </Button>
        </Dialog>
      ) : null}
    </div>
  )
}
