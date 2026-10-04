import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const demos = [
  { id: 'frontend-design', ask: 'Rediseña la pantalla de ajustes', note: 'Dirección visual antes de escribir CSS.' },
  { id: 'code-review', ask: 'Revisa este PR antes de mergear', note: 'Riesgos reales, no nitpicks.' },
  { id: 'seo-auditor', ask: 'Audita la landing de precios', note: 'Plan priorizado por impacto.' },
]

const targets = [
  { label: 'Cursor', path: '~/.cursor/skills' },
  { label: 'Claude', path: '~/.claude/skills' },
  { label: 'Codex', path: '~/.codex/skills' },
]

const TYPE_MS = 26

export function InstallDemo() {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const demo = demos[index]
  const command = `npm run skillstore -- install ${demo.id}`
  const [typed, setTyped] = useState(command.length)
  const [stage, setStage] = useState(5)

  useEffect(() => {
    if (reduce) {
      setTyped(command.length)
      setStage(5)
      return
    }

    let live = true
    const timers: number[] = []
    const at = (ms: number, run: () => void) => {
      timers.push(window.setTimeout(() => live && run(), ms))
    }

    setTyped(0)
    setStage(0)

    const start = 600
    for (let i = 1; i <= command.length; i += 1) at(start + i * TYPE_MS, () => setTyped(i))

    const done = start + command.length * TYPE_MS
    at(done + 350, () => setStage(1))
    at(done + 600, () => setStage(2))
    at(done + 850, () => setStage(3))
    at(done + 1500, () => setStage(4))
    at(done + 2100, () => setStage(5))
    at(done + 6200, () => setIndex((current) => (current + 1) % demos.length))

    return () => {
      live = false
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [command, reduce])

  return (
    <div
      role="img"
      aria-label={`Ejemplo: se instala ${demo.id} en Cursor, Claude y Codex, y el agente la usa.`}
      className="overflow-hidden rounded-[14px] border border-white/10 bg-[#0c0c0f] text-[#e4e4e7] shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_30px_80px_-24px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
        </div>
        <p className="font-mono text-[12px] text-white/50">skill-store</p>
        <span className="w-10" />
      </div>

      <div className="min-h-[300px] space-y-3 p-4 font-mono text-[12.5px] leading-relaxed sm:text-[13px]" aria-hidden>
        <p className="break-all">
          <span className="text-[#a5b4fc]">$</span> {command.slice(0, typed)}
          {typed < command.length ? <span className="ml-px inline-block h-[1.1em] w-[7px] translate-y-[3px] bg-white/70" /> : null}
        </p>

        <ul className="space-y-1">
          {targets.map((target, position) => (
            <li
              key={target.label}
              className={`flex gap-3 transition-opacity duration-200 ${stage > position ? 'opacity-100' : 'opacity-0'}`}
            >
              <span className="text-[#86efac]">✓</span>
              <span className="w-14 text-white/60">{target.label}</span>
              <span className="min-w-0 truncate text-white/80">
                {target.path}/{demo.id}
              </span>
            </li>
          ))}
        </ul>

        <div className={`space-y-2 border-t border-white/10 pt-3 transition-opacity duration-300 ${stage >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white/50">Agente</p>
          <p>
            <span className="text-[#a5b4fc]">›</span> {demo.ask}
          </p>
          <div className={`rounded-[10px] border border-white/10 bg-white/[0.04] p-3 transition-opacity duration-300 ${stage >= 5 ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-[#a5b4fc]">Usando la skill {demo.id}</p>
            <p className="mt-1 text-white/60">{demo.note}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
