import { useMemo, useState } from 'react'
import type { Skill } from '../types'
import type { InstallTarget } from '../lib/api'
import { TARGET_LABEL } from '../lib/api'
import { defaultTargets, installableTargets } from '../lib/targets'
import { SkillIcon } from './SkillIcon'

const webOnly = ['ChatGPT', 'Gemini', 'Copilot'] as const

type InstallSheetProps = {
  skill: Skill
  homes: Record<InstallTarget, string>
  busy: boolean
  error: string | null
  onClose: () => void
  onInstall: (targets: InstallTarget[]) => void
}

export function InstallSheet({ skill, homes, busy, error, onClose, onInstall }: InstallSheetProps) {
  const options = useMemo(() => installableTargets(skill), [skill])
  const [selected, setSelected] = useState<InstallTarget[]>(() => defaultTargets(skill))
  const unavailable = webOnly.filter((agent) => (skill.compatibility[agent] ?? 'none') !== 'none')

  function toggle(id: InstallTarget) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Cerrar" />
      <div className="relative w-full max-w-[440px] rounded-t-[22px] bg-card p-5 pb-8 sm:rounded-[22px]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="flex items-center gap-3">
          <SkillIcon skill={skill} size={52} />
          <div>
            <p className="text-[13px] font-semibold text-mute">Instalar en tus agentes</p>
            <h2 className="text-[20px] font-bold tracking-tight">{skill.name}</h2>
          </div>
        </div>

        <p className="mt-3 text-[13px] text-mute">
          Se copia la carpeta SKILL.md a tu máquina. Cursor, Claude y Codex la cargan solos.
        </p>

        <div className="mt-4 space-y-2">
          {options.map((option) => {
            const checked = selected.includes(option.id)
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 ${
                  checked ? 'bg-white/8' : 'bg-white/4'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option.id)}
                  className="size-4 accent-[#0a84ff]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">
                    {option.label}
                    <span className="ml-2 text-[11px] font-medium text-mute">
                      {option.level === 'full' ? 'Completa' : 'Parcial'}
                    </span>
                  </p>
                  <p className="truncate text-[11px] text-dim">{homes[option.id]}/{skill.id}</p>
                </div>
              </label>
            )
          })}
        </div>

        {unavailable.length > 0 ? (
          <p className="mt-3 text-[12px] text-dim">
            {unavailable.join(', ')} aún no tienen carpeta local. Próximamente.
          </p>
        ) : null}

        {error ? <p className="mt-3 text-[13px] text-[#ff453a]">{error}</p> : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full bg-white/8 text-[15px] font-bold"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy || selected.length === 0}
            onClick={() => onInstall(selected)}
            className="h-11 flex-1 rounded-full bg-blue text-[15px] font-bold text-white disabled:opacity-40"
          >
            {busy ? 'Instalando…' : `Obtener${selected.length ? ` · ${selected.map((id) => TARGET_LABEL[id]).join(', ')}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
