import { useMemo, useState } from 'react'
import { SkillCard } from '../components/SkillCard'
import { categories } from '../data/skills'
import { useStore } from '../store'
import type { Agent, Skill } from '../types'
import { Button } from '../ui/Button'
import { Field, Input, TextArea } from '../ui/Input'

const steps = ['Ficha', 'Contenido', 'Compatibilidad', 'Vista previa']
const agentOptions: Agent[] = ['Cursor', 'Claude', 'ChatGPT', 'Codex', 'Gemini', 'Copilot']

type Draft = {
  name: string
  author: string
  category: string
  subtitle: string
  description: string
  price: 'Gratis' | 'De pago'
  agents: Agent[]
}

const empty: Draft = {
  name: '',
  author: '',
  category: 'Ingeniería',
  subtitle: '',
  description: '',
  price: 'Gratis',
  agents: ['Cursor'],
}

function toSkill(draft: Draft): Skill {
  const compatibility = Object.fromEntries(agentOptions.map((agent) => [agent, draft.agents.includes(agent) ? 'full' : 'none'])) as Skill['compatibility']
  return {
    id: 'borrador',
    name: draft.name || 'Sin nombre',
    subtitle: draft.subtitle || 'Añade una línea que diga qué hace.',
    author: draft.author || 'Tu nombre',
    category: draft.category,
    rating: 0,
    ratingsCount: 0,
    price: draft.price === 'Gratis' ? 'Gratis' : 'De pago',
    verified: false,
    agents: draft.agents,
    compatibility,
    description: draft.description,
    whatsNew: 'Borrador local.',
    version: '0.1',
    size: '—',
    age: '4+',
    icon: { from: '#4338ca', to: '#18181b', glyph: 'S' },
    screenshots: [],
    reviews: [],
  }
}

export function SubmitPage() {
  const { notify } = useStore()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(empty)
  const [error, setError] = useState<string | null>(null)
  const preview = useMemo(() => toSkill(draft), [draft])

  function patch(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }))
    setError(null)
  }

  function next() {
    if (step === 0 && (!draft.name.trim() || !draft.author.trim())) {
      setError('Escribe el nombre de la skill y el autor.')
      return
    }
    if (step === 1 && (!draft.subtitle.trim() || !draft.description.trim())) {
      setError('Escribe el subtítulo y la descripción.')
      return
    }
    if (step === 2 && draft.agents.length === 0) {
      setError('Elige al menos un agente.')
      return
    }
    setError(null)
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  function save() {
    let stored: Draft[] = []
    try {
      const parsed = JSON.parse(localStorage.getItem('skillstore-drafts') || '[]') as unknown
      if (Array.isArray(parsed)) stored = parsed as Draft[]
    } catch {
      stored = []
    }
    localStorage.setItem('skillstore-drafts', JSON.stringify([draft, ...stored].slice(0, 12)))
    notify('Borrador guardado en este navegador')
  }

  return (
    <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <h1 className="text-[40px] font-medium tracking-tight">Publicar una skill</h1>
        <p className="mt-2 max-w-[48ch] text-[16px] leading-relaxed text-mute">
          Arma la ficha y mírala como la vería alguien en el catálogo. El borrador se queda en este navegador.
        </p>

        <ol className="mt-6 flex gap-2" aria-label="Pasos">
          {steps.map((label, index) => (
            <li key={label} className="min-w-0 flex-1">
              <div className={`h-1 rounded-full ${index <= step ? 'bg-accent' : 'bg-line'}`} />
              <p className={`mt-2 text-[12px] ${index === step ? 'text-ink' : 'text-mute'}`}>{label}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-4">
          {step === 0 ? (
            <>
              <Field label="Nombre">
                <Input value={draft.name} onChange={(event) => patch({ name: event.target.value })} placeholder="Code Review" />
              </Field>
              <Field label="Autor">
                <Input value={draft.author} onChange={(event) => patch({ author: event.target.value })} placeholder="Tu equipo" />
              </Field>
              <Field label="Categoría">
                <select
                  className="h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[14px]"
                  value={draft.category}
                  onChange={(event) => patch({ category: event.target.value })}
                >
                  {categories
                    .filter((category) => category.id !== 'Equipos')
                    .map((category) => (
                      <option key={category.id}>{category.label}</option>
                    ))}
                </select>
              </Field>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Field label="Subtítulo" hint="Una línea. Es lo que se lee en la ficha.">
                <Input value={draft.subtitle} onChange={(event) => patch({ subtitle: event.target.value })} />
              </Field>
              <Field label="Descripción">
                <TextArea value={draft.description} onChange={(event) => patch({ description: event.target.value })} />
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <fieldset>
                <legend className="text-[13px]">Agentes</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {agentOptions.map((agent) => {
                    const checked = draft.agents.includes(agent)
                    return (
                      <label key={agent} className="flex items-center gap-2 rounded-[10px] border border-line px-3 py-2 text-[14px]">
                        <input
                          type="checkbox"
                          className="size-4 accent-(--accent)"
                          checked={checked}
                          onChange={() =>
                            patch({
                              agents: checked ? draft.agents.filter((item) => item !== agent) : [...draft.agents, agent],
                            })
                          }
                        />
                        {agent}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-[13px]">Precio</legend>
                <div className="mt-2 flex gap-4 text-[14px]">
                  {(['Gratis', 'De pago'] as const).map((price) => (
                    <label key={price} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="precio"
                        className="accent-(--accent)"
                        checked={draft.price === price}
                        onChange={() => patch({ price })}
                      />
                      {price}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          ) : null}

          {step === 3 ? (
            <div className="max-w-md lg:hidden">
              <SkillCard skill={preview} quiet />
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-[14px] text-danger">{error}</p> : null}

        <div className="mt-8 flex gap-2">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep((current) => current - 1)}>
              Atrás
            </Button>
          ) : null}
          {step < steps.length - 1 ? <Button onClick={next}>Continuar</Button> : <Button onClick={save}>Guardar borrador</Button>}
        </div>
      </div>

      <aside className="hidden lg:block">
        <p className="text-[13px] text-mute">Vista previa</p>
        <div className="sticky top-24 mt-3">
          <SkillCard skill={preview} quiet />
        </div>
      </aside>
    </div>
  )
}
