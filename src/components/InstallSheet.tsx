import { useMemo, useState } from 'react'
import type { Skill } from '../types'
import type { InstallTarget } from '../lib/api'
import { TARGET_LABEL } from '../lib/api'
import { defaultTargets, installableTargets } from '../lib/targets'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { SkillIcon } from './SkillIcon'
import { WebInstall } from './WebInstall'

const webOnly = ['ChatGPT', 'Gemini', 'Copilot'] as const

type InstallSheetProps = {
  skill: Skill
  installer: boolean
  homes: Record<InstallTarget, string>
  busy: boolean
  error: string | null
  onClose: () => void
  onInstall: (targets: InstallTarget[]) => void
}

export function InstallSheet(props: InstallSheetProps) {
  if (props.installer) return <LocalSheet {...props} />
  return (
    <Dialog title="Instalar skill" onClose={props.onClose}>
      <div className="mb-4 flex items-center gap-3">
        <SkillIcon skill={props.skill} size={48} />
        <div>
          <p className="text-[15px] font-medium">{props.skill.name}</p>
          <p className="text-[13px] text-mute">Elige tu agente y copia el comando.</p>
        </div>
      </div>
      <WebInstall skill={props.skill} />
    </Dialog>
  )
}

function LocalSheet({ skill, homes, busy, error, onClose, onInstall }: InstallSheetProps) {
  const options = useMemo(() => installableTargets(skill), [skill])
  const [selected, setSelected] = useState<InstallTarget[]>(() => defaultTargets(skill))
  const unavailable = webOnly.filter((agent) => (skill.compatibility[agent] ?? 'none') !== 'none')

  function toggle(id: InstallTarget) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <Dialog title="Instalar skill" onClose={onClose}>
      <div className="flex items-center gap-3">
        <SkillIcon skill={skill} size={48} />
        <div>
          <p className="text-[15px] font-medium">{skill.name}</p>
          <p className="text-[13px] text-mute">Se copia a la carpeta de skills del agente.</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {options.map((option) => {
          const checked = selected.includes(option.id)
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-3 ${checked ? 'border-accent bg-surface-2' : 'border-line'}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(option.id)}
                className="size-4 accent-(--accent)"
              />
              <span className="min-w-0">
                <span className="block text-[14px]">
                  {option.label}
                  <span className="ml-2 text-[12px] text-mute">{option.level === 'full' ? 'Completa' : 'Parcial'}</span>
                </span>
                <span className="block truncate font-mono text-[12px] text-mute">
                  {homes[option.id]}/{skill.id}
                </span>
              </span>
            </label>
          )
        })}
      </div>

      {unavailable.length > 0 ? (
        <p className="mt-3 text-[13px] text-mute">{unavailable.join(', ')} no tienen carpeta local en este Mac.</p>
      ) : null}
      {error ? <p className="mt-3 text-[13px] text-danger">{error}</p> : null}

      <div className="mt-5 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="flex-1" disabled={busy || selected.length === 0} onClick={() => onInstall(selected)}>
          {busy ? 'Instalando…' : selected.length ? `Instalar en ${selected.map((id) => TARGET_LABEL[id]).join(', ')}` : 'Elige un agente'}
        </Button>
      </div>
    </Dialog>
  )
}
