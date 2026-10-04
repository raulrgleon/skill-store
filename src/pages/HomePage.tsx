import {
  Code2,
  FileText,
  FolderSearch,
  Handshake,
  LifeBuoy,
  LineChart,
  ListChecks,
  Megaphone,
  PenTool,
  Scale,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { InstallDemo } from '../components/InstallDemo'
import { SkillCard } from '../components/SkillCard'
import { categoryOptions, heat, publicCatalog } from '../lib/catalog'
import { formatCount } from '../lib/format'
import { useRouter } from '../lib/router'

const categoryIcon: Record<string, LucideIcon> = {
  Ingeniería: Code2,
  Diseño: PenTool,
  Marketing: Megaphone,
  Ventas: Handshake,
  Legal: Scale,
  Finanzas: LineChart,
  Soporte: LifeBuoy,
  Productividad: ListChecks,
  Documentos: FileText,
  Equipos: Users,
}

const steps = [
  { title: 'Elige una skill', body: 'Busca por oficio y abre la ficha. Ahí está el SKILL.md completo, sin resumen.' },
  { title: 'Instálala', body: 'Un clic copia la carpeta a Cursor, Claude o Codex. O pega el comando en la terminal.' },
  { title: 'Pídele trabajo al agente', body: 'No hay que activarla. El agente la usa cuando la tarea encaja con lo que dice la skill.' },
]

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: { label: string; onClick: () => void }; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-medium tracking-tight">{title}</h2>
          {hint ? <p className="mt-1 max-w-[52ch] text-[14px] text-mute">{hint}</p> : null}
        </div>
        {action ? (
          <button type="button" onClick={action.onClick} className="shrink-0 text-[14px] text-accent hover:underline">
            {action.label}
          </button>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function HomePage({ onSearch }: { onSearch: () => void }) {
  const { navigate } = useRouter()
  const catalog = publicCatalog()
  const featured = ['frontend-design', 'code-review', 'seo-auditor']
    .map((id) => catalog.find((skill) => skill.id === id))
    .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill))
  const featuredIds = new Set(featured.map((skill) => skill.id))
  const trending = [...catalog].sort((a, b) => heat(b) - heat(a)).filter((skill) => !featuredIds.has(skill.id)).slice(0, 6)
  const trendingIds = new Set(trending.map((skill) => skill.id))
  const fresh = [...catalog].reverse().filter((skill) => !featuredIds.has(skill.id) && !trendingIds.has(skill.id)).slice(0, 6)
  const authors = new Set(catalog.map((skill) => skill.author)).size
  const ratings = catalog.reduce((sum, skill) => sum + skill.ratingsCount, 0)
  const chips = ['Ingeniería', 'Diseño', 'Marketing', 'Productividad']

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="hero-wash pointer-events-none absolute inset-0" aria-hidden />
        <div className="hero-in relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 pt-14 pb-16 lg:grid-cols-[1fr_minmax(0,520px)] lg:pt-20 lg:pb-24">
          <div>
            <h1 className="max-w-[14ch] text-[44px] leading-[1.02] font-medium tracking-[-0.035em] sm:text-[60px]">
              Enséñale un oficio nuevo a tu agente.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-mute">
              Una skill es una carpeta con instrucciones. La copias a Cursor, Claude o Codex y el agente ya sabe hacer ese trabajo.
            </p>

            <button
              type="button"
              onClick={onSearch}
              className="mt-8 flex h-14 w-full max-w-xl items-center gap-3 rounded-[14px] border border-line bg-surface px-4 text-left text-[16px] text-mute shadow-soft transition-colors duration-150 hover:border-accent"
            >
              <Search size={18} aria-hidden />
              <span className="flex-1">Buscar una skill</span>
              <kbd className="hidden rounded-[6px] border border-line px-1.5 py-0.5 font-sans text-[12px] sm:block">⌘K</kbd>
            </button>

            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => navigate(`/explorar?categoria=${encodeURIComponent(chip)}`)}
                  className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[14px] transition-colors duration-150 hover:border-accent"
                >
                  {chip}
                </button>
              ))}
            </div>

            <p className="mt-8 text-[14px] text-mute">
              {catalog.length} skills de {authors} autores y {formatCount(ratings)} valoraciones. Gratis y sin cuenta.
            </p>
          </div>

          <InstallDemo />
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] space-y-20 px-5 pt-16 pb-24">
        <Section title="Destacadas" hint="Las que más se usan para empezar." action={{ label: 'Ver todo el catálogo', onClick: () => navigate('/explorar') }}>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((skill) => (
              <SkillCard key={skill.id} skill={skill} large />
            ))}
          </div>
        </Section>

        <Section title="Tendencia" hint="Las más instaladas esta semana.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </Section>

        {fresh.length > 0 ? (
          <Section title="Recién llegadas" hint="Lo último que entró al catálogo.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fresh.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </Section>
        ) : null}

        <Section title="Por oficio">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryOptions().map((category) => {
              const Icon = categoryIcon[category.id] ?? FolderSearch
              const count = catalog.filter((skill) => skill.category === category.id).length
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => navigate(`/explorar?categoria=${encodeURIComponent(category.id)}`)}
                  className="card-hover flex items-center gap-3 rounded-[14px] border border-line bg-surface px-4 py-4 text-left"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-accent">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium">{category.label}</span>
                    <span className="block text-[13px] text-mute">
                      {count} {count === 1 ? 'skill' : 'skills'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        <section className="border-t border-line pt-14">
          <h2 className="text-[24px] font-medium tracking-tight">Cómo se usa</h2>
          <ol className="mt-6 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[13px] text-mute">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[16px] font-medium tracking-tight">{step.title}</h3>
                  <p className="mt-1.5 max-w-[34ch] text-[14px] leading-relaxed text-mute">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
