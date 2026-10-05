import { categories, skills } from '../data/skills'
import type { Agent, Skill } from '../types'

export const OFFICIAL_AUTHORS = ['Anthropic', 'Vercel']

export type SortKey = 'tendencia' | 'adoptadas' | 'recientes' | 'puntuacion'

export type PriceFilter = '' | 'gratis' | 'pago'

export type Filters = {
  q: string
  categoria: string
  agente: string
  etiqueta: string
  verificada: boolean
  precio: PriceFilter
  orden: SortKey
  pagina: number
}

const SORTS: SortKey[] = ['tendencia', 'adoptadas', 'recientes', 'puntuacion']

export function publicCatalog() {
  return skills.filter((skill) => !skill.private)
}

export function isOfficial(skill: Skill) {
  return OFFICIAL_AUTHORS.includes(skill.author)
}

export function isPaid(skill: Skill) {
  return skill.price !== 'Gratis' && skill.price !== 'Privada'
}

export function skillTags(skill: Skill) {
  const tags: string[] = []
  if (isOfficial(skill)) tags.push('Oficial')
  if (skill.verified) tags.push('Verificada')
  if (skill.price === 'Gratis') tags.push('Gratis')
  if (isPaid(skill)) tags.push('De pago')
  return tags
}

export const TAG_OPTIONS = ['Oficial', 'Verificada', 'Gratis', 'De pago']

export function installCommand(id: string, target?: string) {
  return `npm run skillstore -- install ${id}${target ? ` --target ${target}` : ''}`
}

// SKILL.md en crudo, servido por la propia web (lo usa curl y el botón de descarga).
export function skillFileUrl(id: string) {
  return `/skills/${encodeURIComponent(id)}/SKILL.md`
}

// Instalación sin el instalador local: descarga el SKILL.md a la carpeta del agente.
export function webInstallCommand(id: string, home: string) {
  const dir = `${home}/${id}`
  return `mkdir -p ${dir} && curl -fsSL ${window.location.origin}${skillFileUrl(id)} -o ${dir}/SKILL.md`
}

export function skillPath(id: string) {
  return `/skill/${encodeURIComponent(id)}`
}

export function authorPath(author: string) {
  return `/autor/${encodeURIComponent(author)}`
}

export function categoryOptions() {
  const present = new Set(publicCatalog().map((skill) => skill.category))
  return categories.filter((category) => present.has(category.id) && category.id !== 'Equipos')
}

export function heat(skill: Skill) {
  return skill.rating * Math.log10(skill.ratingsCount + 10)
}

export function sortSkills(list: Skill[], sort: SortKey) {
  const copy = [...list]
  if (sort === 'recientes') return copy.reverse()
  if (sort === 'puntuacion') {
    return copy.sort((a, b) => b.rating - a.rating || b.ratingsCount - a.ratingsCount)
  }
  if (sort === 'adoptadas') {
    return copy.sort((a, b) => b.ratingsCount - a.ratingsCount)
  }
  return copy.sort((a, b) => heat(b) - heat(a))
}

export function matchesQuery(skill: Skill, query: string) {
  const haystack = [skill.name, skill.subtitle, skill.author, skill.category, skill.description]
    .join(' ')
    .toLocaleLowerCase('es')
  return haystack.includes(query.trim().toLocaleLowerCase('es'))
}

export function applyFilters(list: Skill[], filters: Filters) {
  return list.filter((skill) => {
    if (filters.q && !matchesQuery(skill, filters.q)) return false
    if (filters.categoria && skill.category !== filters.categoria) return false
    if (filters.agente) {
      const level = skill.compatibility[filters.agente as Agent] ?? 'none'
      if (level === 'none') return false
    }
    if (filters.etiqueta && !skillTags(skill).includes(filters.etiqueta)) return false
    if (filters.verificada && !skill.verified) return false
    if (filters.precio === 'gratis' && skill.price !== 'Gratis') return false
    if (filters.precio === 'pago' && !isPaid(skill)) return false
    return true
  })
}

export function filtersFromParams(params: URLSearchParams): Filters {
  const orden = params.get('orden')
  const precio = params.get('precio')
  return {
    q: params.get('q') ?? '',
    categoria: params.get('categoria') ?? '',
    agente: params.get('agente') ?? '',
    etiqueta: params.get('etiqueta') ?? '',
    verificada: params.get('verificada') === '1',
    precio: precio === 'gratis' || precio === 'pago' ? precio : '',
    orden: SORTS.includes(orden as SortKey) ? (orden as SortKey) : 'tendencia',
    pagina: Math.max(1, Number.parseInt(params.get('pagina') || '1', 10) || 1),
  }
}

export function hrefFromFilters(filters: Filters) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.categoria) params.set('categoria', filters.categoria)
  if (filters.agente) params.set('agente', filters.agente)
  if (filters.etiqueta) params.set('etiqueta', filters.etiqueta)
  if (filters.verificada) params.set('verificada', '1')
  if (filters.precio) params.set('precio', filters.precio)
  if (filters.orden !== 'tendencia') params.set('orden', filters.orden)
  if (filters.pagina > 1) params.set('pagina', String(filters.pagina))
  const search = params.toString()
  return search ? `/explorar?${search}` : '/explorar'
}

export function activeFilterCount(filters: Filters) {
  return [filters.categoria, filters.agente, filters.etiqueta, filters.verificada, filters.precio].filter(Boolean)
    .length
}
