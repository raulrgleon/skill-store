import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export type InstallTarget = 'cursor' | 'claude' | 'codex'

export const INSTALL_TARGETS: InstallTarget[] = ['cursor', 'claude', 'codex']

const MARKER = '.skillstore.json'

export const targetHomes: Record<InstallTarget, string> = {
  cursor: join(homedir(), '.cursor', 'skills'),
  claude: join(homedir(), '.claude', 'skills'),
  codex: join(homedir(), '.codex', 'skills'),
}

export function catalogRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'catalog')
}

export function skillSource(id: string) {
  return join(catalogRoot(), id)
}

export function assertSkillId(id: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error('Skill no válida')
  }
  if (!existsSync(join(skillSource(id), 'SKILL.md'))) {
    throw new Error(`No existe la skill "${id}" en el catálogo`)
  }
}

export function parseTargets(value: unknown): InstallTarget[] {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  const targets = list
    .map((item) => String(item).trim().toLowerCase())
    .filter((item): item is InstallTarget => INSTALL_TARGETS.includes(item as InstallTarget))
  if (targets.length === 0) {
    throw new Error('Elige al menos un destino: cursor, claude o codex')
  }
  return [...new Set(targets)]
}

async function readMarker(dir: string) {
  try {
    const raw = await readFile(join(dir, MARKER), 'utf8')
    return JSON.parse(raw) as { id?: string; source?: string }
  } catch {
    return null
  }
}

async function copySkill(id: string, dest: string) {
  const marker = await readMarker(dest)
  if (existsSync(dest) && !marker) {
    throw new Error(`Ya hay una carpeta en ${dest} que no instaló Skill Store. No la tocamos.`)
  }
  if (existsSync(dest)) {
    await rm(dest, { recursive: true, force: true })
  }
  await mkdir(dirname(dest), { recursive: true })
  await cp(skillSource(id), dest, { recursive: true })
  await writeFile(
    join(dest, MARKER),
    JSON.stringify(
      {
        id,
        source: 'skill-store',
        installedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  )
}

export async function installSkill(id: string, targets: InstallTarget[]) {
  assertSkillId(id)
  const paths: Record<string, string> = {}
  for (const target of targets) {
    const dest = join(targetHomes[target], id)
    await copySkill(id, dest)
    paths[target] = dest
  }
  return { id, targets, paths }
}

export async function uninstallSkill(id: string, targets?: InstallTarget[]) {
  assertSkillId(id)
  const selected = targets && targets.length > 0 ? targets : INSTALL_TARGETS
  const removed: Record<string, string> = {}
  for (const target of selected) {
    const dest = join(targetHomes[target], id)
    const marker = await readMarker(dest)
    if (!marker || marker.id !== id) continue
    await rm(dest, { recursive: true, force: true })
    removed[target] = dest
  }
  return { id, removed }
}

export async function listInstalled() {
  const installed: Record<string, InstallTarget[]> = {}
  for (const target of INSTALL_TARGETS) {
    const home = targetHomes[target]
    if (!existsSync(home)) continue
    const entries = await readdir(home, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const marker = await readMarker(join(home, entry.name))
      if (!marker?.id) continue
      installed[marker.id] ??= []
      if (!installed[marker.id].includes(target)) {
        installed[marker.id].push(target)
      }
    }
  }
  return { installed, homes: targetHomes }
}

export async function listCatalog() {
  const entries = await readdir(catalogRoot(), { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
}
