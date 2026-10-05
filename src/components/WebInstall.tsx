import { useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import { installableTargets } from '../lib/targets'
import { skillFileUrl, webInstallCommand } from '../lib/catalog'
import { useStore } from '../store'
import type { Agent, Skill } from '../types'
import { Button } from '../ui/Button'

const AGENTS: Agent[] = ['Cursor', 'Claude', 'Codex', 'ChatGPT', 'Gemini', 'Copilot']

// Agentes sin carpeta de skills: se pega el contenido donde ese producto guarda instrucciones.
const PASTE_HINT: Partial<Record<Agent, string>> = {
  ChatGPT: 'Pégalo en Instrucciones personalizadas o en las instrucciones de un GPT.',
  Gemini: 'Pégalo en las instrucciones de un Gem.',
  Copilot: 'Guárdalo como .github/copilot-instructions.md en tu repositorio.',
}

function useCopy() {
  const { notify } = useStore()
  const [done, setDone] = useState<string | null>(null)

  return {
    done,
    async copy(key: string, read: () => Promise<string> | string, message: string) {
      try {
        await navigator.clipboard.writeText(await read())
        setDone(key)
        notify(message)
        window.setTimeout(() => setDone((current) => (current === key ? null : current)), 1600)
      } catch {
        notify('No se pudo copiar')
      }
    },
  }
}

// Instalación desde la web pública: no hay instalador local, así que se da el comando para la
// carpeta del agente (curl) o el SKILL.md para pegarlo.
export function WebInstall({ skill }: { skill: Skill }) {
  const { homes } = useStore()
  const { done, copy } = useCopy()
  const folders = installableTargets(skill)
  const options = AGENTS.filter((agent) => (skill.compatibility[agent] ?? 'none') !== 'none')
  const [agent, setAgent] = useState<Agent>(options[0] ?? 'Cursor')
  const folder = folders.find((item) => item.label === agent)
  const command = folder ? webInstallCommand(skill.id, homes[folder.id]) : ''

  if (options.length === 0) {
    return <p className="text-[13px] leading-relaxed text-mute">Esta skill no declara ningún agente compatible.</p>
  }

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Agente" className="flex flex-wrap gap-1 rounded-[10px] bg-surface-2 p-1">
        {options.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={agent === item}
            onClick={() => setAgent(item)}
            className={`h-8 min-w-[4.25rem] flex-1 rounded-[8px] px-2 text-[13px] ${agent === item ? 'bg-surface text-ink shadow-sm' : 'text-mute hover:text-ink'}`}
          >
            {item}
          </button>
        ))}
      </div>

      {folder ? (
        <div className="rounded-[10px] border border-line bg-canvas p-3">
          <p className="mb-2 text-[12px] text-mute">Pégalo en la terminal (macOS o Linux)</p>
          <div className="flex items-start gap-2">
            <code className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed break-all">{command}</code>
            <button
              type="button"
              aria-label="Copiar comando"
              onClick={() => copy('command', () => command, 'Comando copiado')}
              className="rounded-[8px] p-1 text-mute hover:text-ink"
            >
              {done === 'command' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p className="mt-2 truncate font-mono text-[11px] text-mute">
            {homes[folder.id]}/{skill.id}/SKILL.md
          </p>
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed text-mute">
          {agent} no tiene carpeta de skills. {PASTE_HINT[agent] ?? 'Copia el contenido y pégalo en sus instrucciones.'}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            copy(
              'doc',
              async () => {
                const response = await fetch(skillFileUrl(skill.id))
                if (!response.ok) throw new Error('No disponible')
                return response.text()
              },
              'SKILL.md copiado',
            )
          }
        >
          {done === 'doc' ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} Copiar SKILL.md
        </Button>
        <a
          href={skillFileUrl(skill.id)}
          download="SKILL.md"
          className="inline-flex h-8 items-center justify-center gap-2 rounded-[10px] border border-line bg-surface px-2.5 text-[13px] font-medium text-ink hover:bg-surface-2"
        >
          <Download size={14} aria-hidden /> Descargar
        </a>
      </div>
    </div>
  )
}
