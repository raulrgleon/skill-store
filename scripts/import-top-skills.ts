// Importa al catálogo las skills más instaladas de skills.sh que aún no estén.
// Lo ejecuta cada noche .github/workflows/import-skills.yml; también se puede lanzar a mano:
//   GITHUB_TOKEN=... IMPORT_LIMIT=3 FORCE=1 DRY_RUN=1 node --experimental-strip-types scripts/import-top-skills.ts
//
// Por cada skill: localiza su SKILL.md en GitHub, copia la carpeta (solo archivos de texto),
// añade la licencia del repositorio si la carpeta no trae una, y redacta la ficha en español con
// GitHub Models. Si el modelo no responde, usa la descripción original.

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { categories } from '../src/data/categories.ts'
import { isSymbolName, SYMBOL_NAMES } from '../src/icons/symbolNames.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG = join(ROOT, 'catalog')
const CATALOG_JSON = join(ROOT, 'src', 'data', 'catalog.json')
const LOG = join(ROOT, 'automation', 'imports.json')

const TOKEN = process.env.GITHUB_TOKEN ?? ''
const LIMIT = Math.max(1, Math.min(25, Number(process.env.IMPORT_LIMIT ?? 10) || 10))
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const FORCE = process.env.FORCE === '1' || process.env.FORCE === 'true'
const TIME_ZONE = process.env.IMPORT_TIME_ZONE ?? 'America/Chicago'
const MODEL = process.env.IMPORT_MODEL ?? 'openai/gpt-4.1-mini'

const MAX_FILES = 60
const MAX_FILE = 400_000
const MAX_TOTAL = 3_000_000
const MAX_DOC = 500_000
const TEXT_EXT = /\.(md|mdx|txt|py|js|mjs|cjs|ts|tsx|jsx|sh|bash|zsh|ps1|json|jsonc|ya?ml|toml|ini|cfg|html?|css|scss|xml|csv|tsv|sql|rb|go|rs|java|kt|swift|php|r|lua|svg|env\.example|gitignore)$/i
const SAFE_PATH = /^[A-Za-z0-9._\-/ ]+$/

const KNOWN_AUTHORS: Record<string, string> = {
  'vercel-labs': 'Vercel',
  vercel: 'Vercel',
  anthropics: 'Anthropic',
  openai: 'OpenAI',
  microsoft: 'Microsoft',
  github: 'GitHub',
  google: 'Google',
  'google-gemini': 'Google',
  mattpocock: 'Matt Pocock',
  'heygen-com': 'HeyGen',
  supabase: 'Supabase',
  stripe: 'Stripe',
  cloudflare: 'Cloudflare',
}

const PALETTE: [string, string][] = [
  ['#4338CA', '#818CF8'],
  ['#0A84FF', '#64D2FF'],
  ['#30D158', '#64D2FF'],
  ['#FF375F', '#FF9F0A'],
  ['#BF5AF2', '#5E5CE6'],
  ['#D97757', '#1A1A1A'],
  ['#0F766E', '#5EEAD4'],
  ['#1F2937', '#6B7280'],
]

type Json = Record<string, unknown>
type Entry = { owner: string; repo: string; skill: string; rank: number; installs: number }
type TreeItem = { path: string; type: string; size?: number }
type Copy = { path: string; data: Buffer }

function log(...parts: unknown[]) {
  console.log(...parts)
}

// ---- utilidades -------------------------------------------------------------

async function http(url: string, init: RequestInit = {}, attempt = 0): Promise<Response> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) }).catch((error) => {
    if (attempt < 2) return null
    throw error
  })
  if (response && (response.status < 500 || attempt >= 2)) return response
  await new Promise((done) => setTimeout(done, 1500 * (attempt + 1)))
  return http(url, init, attempt + 1)
}

function gh(path: string) {
  return http(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'skill-store-importer',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  })
}

async function ghJson<T>(path: string): Promise<T> {
  const response = await gh(path)
  if (!response.ok) throw new Error(`GitHub ${response.status} en ${path}`)
  return (await response.json()) as T
}

async function raw(owner: string, repo: string, ref: string, path: string) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path.split('/').map(encodeURIComponent).join('/')}`
  const response = await http(url, { headers: { 'User-Agent': 'skill-store-importer' } })
  if (!response.ok) throw new Error(`No se pudo descargar ${path} (${response.status})`)
  return Buffer.from(await response.arrayBuffer())
}

function parseInstalls(text: string) {
  const match = text.trim().match(/^([\d.]+)\s*([KM]?)$/i)
  if (!match) return 0
  const n = Number(match[1])
  const unit = match[2].toUpperCase()
  return Math.round(n * (unit === 'M' ? 1e6 : unit === 'K' ? 1e3 : 1))
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}

function titleCase(id: string) {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function frontmatter(doc: string) {
  const match = doc.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const meta: Record<string, string> = {}
  if (!match) return meta
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([\w-]+):\s*(.*)$/)
    if (pair) meta[pair[1]] = pair[2].trim().replace(/^["']|["']$/g, '')
  }
  return meta
}

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).trim()}…`
}

function localDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

function localHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(date))
}

// ---- ranking de skills.sh --------------------------------------------------

async function leaderboard(): Promise<Entry[]> {
  const response = await http('https://skills.sh/', { headers: { 'User-Agent': 'skill-store-importer' } })
  if (!response.ok) throw new Error(`skills.sh respondió ${response.status}`)
  const html = await response.text()
  const entries: Entry[] = []
  const seen = new Set<string>()
  const row = /<a class="group grid[^"]*" href="\/([\w.-]+)\/([\w.-]+)\/([\w.:-]+)">([\s\S]*?)<\/a>/g
  for (const match of html.matchAll(row)) {
    const [, owner, repo, skill, body] = match
    const key = `${owner}/${repo}/${skill}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const rank = Number(body.match(/font-mono">(\d+)<\/span>/)?.[1] ?? entries.length + 1)
    const installs = parseInstalls(body.match(/font-mono text-sm text-foreground">([^<]+)</)?.[1] ?? '')
    entries.push({ owner, repo, skill, rank, installs })
  }
  // Si cambia el HTML de skills.sh preferimos fallar (y que llegue el aviso) a importar basura.
  if (entries.length < 20) throw new Error(`El ranking de skills.sh cambió de formato (solo ${entries.length} filas).`)
  return entries.sort((a, b) => b.installs - a.installs || a.rank - b.rank)
}

// ---- GitHub: localizar y copiar la skill -------------------------------------

const trees = new Map<string, { ref: string; items: TreeItem[]; license: string; repoInfo: Json }>()

async function repoTree(owner: string, repo: string) {
  const key = `${owner}/${repo}`
  const cached = trees.get(key)
  if (cached) return cached
  const info = await ghJson<Json>(`/repos/${owner}/${repo}`)
  const ref = String(info.default_branch ?? 'main')
  const tree = await ghJson<{ tree: TreeItem[]; truncated: boolean }>(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`)
  const license = String((info.license as Json | null)?.spdx_id ?? 'NOASSERTION')
  const value = { ref, items: tree.tree, license, repoInfo: info }
  trees.set(key, value)
  return value
}

async function locateSkill(entry: Entry) {
  const { ref, items } = await repoTree(entry.owner, entry.repo)
  const docs = items.filter((item) => item.type === 'blob' && (item.path === 'SKILL.md' || item.path.endsWith('/SKILL.md')))
  if (docs.length === 0) return null
  const dirOf = (path: string) => (path === 'SKILL.md' ? '' : path.slice(0, -'/SKILL.md'.length))
  const base = (path: string) => dirOf(path).split('/').pop() ?? ''

  const byDir = docs.find((item) => base(item.path).toLowerCase() === entry.skill.toLowerCase())
  if (byDir) return { ref, dir: dirOf(byDir.path) }

  // La carpeta no siempre se llama como la skill: se busca por el name del frontmatter.
  for (const item of docs.slice(0, 60)) {
    const doc = (await raw(entry.owner, entry.repo, ref, item.path)).toString('utf8')
    if (frontmatter(doc).name?.toLowerCase() === entry.skill.toLowerCase()) return { ref, dir: dirOf(item.path) }
  }
  return null
}

function looksBinary(data: Buffer) {
  return data.subarray(0, 8000).includes(0)
}

async function collectFiles(entry: Entry, ref: string, dir: string, items: TreeItem[]) {
  const prefix = dir ? `${dir}/` : ''
  // Una skill en la raíz del repositorio: solo SKILL.md y la licencia, no el repositorio entero.
  const blobs = items.filter((item) => {
    if (item.type !== 'blob' || !item.path.startsWith(prefix)) return false
    const rel = item.path.slice(prefix.length)
    if (!dir) return /^(SKILL\.md|LICEN[SC]E(\.\w+)?)$/i.test(rel)
    return true
  })

  const files: Copy[] = []
  let total = 0
  for (const item of blobs) {
    const rel = item.path.slice(prefix.length)
    const isDoc = rel === 'SKILL.md'
    const isLicense = /^LICEN[SC]E(\.\w+)?$/i.test(rel)
    if (!isDoc && !isLicense && !TEXT_EXT.test(rel)) continue
    if (!SAFE_PATH.test(rel) || rel.split('/').some((part) => part === '..' || part.startsWith('.'))) continue
    if ((item.size ?? 0) > MAX_FILE && !isDoc) continue
    if (files.length >= MAX_FILES || total + (item.size ?? 0) > MAX_TOTAL) break
    const data = await raw(entry.owner, entry.repo, ref, item.path)
    if (looksBinary(data)) continue
    files.push({ path: rel, data })
    total += data.length
  }
  return files
}

async function licenseText(owner: string, repo: string) {
  const response = await gh(`/repos/${owner}/${repo}/license`)
  if (!response.ok) return null
  const body = (await response.json()) as { content?: string; encoding?: string }
  if (!body.content || body.encoding !== 'base64') return null
  return Buffer.from(body.content, 'base64')
}

async function authorName(owner: string) {
  if (KNOWN_AUTHORS[owner]) return KNOWN_AUTHORS[owner]
  try {
    const user = await ghJson<{ name?: string | null; login: string }>(`/users/${owner}`)
    return clip(user.name || user.login, 40)
  } catch {
    return clip(owner, 40)
  }
}

// ---- ficha en español con GitHub Models ------------------------------------

type Copywriting = { name: string; subtitle: string; description: string; category: string; symbol: string }

async function copywrite(entry: Entry, doc: string): Promise<Copywriting | null> {
  if (!TOKEN) return null
  const meta = frontmatter(doc)
  const body = doc.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').slice(0, 6000)
  const prompt = [
    'Eres editor de una tienda de skills para agentes de IA (Cursor, Claude, Codex). Escribe la ficha en español neutro.',
    'Devuelve SOLO un objeto JSON con estas claves:',
    '- "name": nombre comercial corto (máx. 40 caracteres), sin el nombre de la empresa salvo que sea parte del producto.',
    '- "subtitle": una frase que diga para qué sirve (máx. 80 caracteres), sin punto final.',
    '- "description": 2 o 3 frases concretas sobre qué hace y cuándo usarla (máx. 500 caracteres). Nada de marketing vacío.',
    `- "category": exactamente una de: ${categories.filter((c) => c.id !== 'Equipos').map((c) => c.id).join(', ')}.`,
    `- "symbol": exactamente uno de: ${SYMBOL_NAMES.join(', ')}.`,
    '',
    `Skill: ${entry.skill} (repositorio ${entry.owner}/${entry.repo})`,
    `Descripción original: ${meta.description ?? '(sin descripción)'}`,
    'Contenido (recortado):',
    body,
  ].join('\n')

  try {
    const response = await http('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) {
      log(`  · el modelo respondió ${response.status}; uso la descripción original`)
      return null
    }
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}') as Partial<Copywriting>
    if (!parsed.name || !parsed.subtitle || !parsed.description) return null
    return {
      name: clip(String(parsed.name), 60),
      subtitle: clip(String(parsed.subtitle), 90),
      description: clip(String(parsed.description), 600),
      category: categories.some((c) => c.id === parsed.category && c.id !== 'Equipos') ? String(parsed.category) : 'Productividad',
      symbol: isSymbolName(parsed.symbol) ? parsed.symbol : 'sparkles',
    }
  } catch (error) {
    log(`  · el modelo falló (${error instanceof Error ? error.message : error}); uso la descripción original`)
    return null
  }
}

function guessCategory(text: string) {
  const t = text.toLowerCase()
  if (/(design|ui|ux|css|figma|frontend|visual|brand)/.test(t)) return 'Diseño'
  if (/(seo|marketing|social|ads|content|copywrit|reddit|twitter)/.test(t)) return 'Marketing'
  if (/(sales|crm|lead)/.test(t)) return 'Ventas'
  if (/(legal|contract|compliance)/.test(t)) return 'Legal'
  if (/(finance|invoice|accounting|tax)/.test(t)) return 'Finanzas'
  if (/(support|ticket|helpdesk)/.test(t)) return 'Soporte'
  if (/(pdf|docx|xlsx|pptx|document|spreadsheet|slides)/.test(t)) return 'Documentos'
  if (/(code|test|deploy|api|react|database|git|debug|refactor|typescript|python|cli|architecture|tdd)/.test(t)) return 'Ingeniería'
  return 'Productividad'
}

// ---- catálogo -------------------------------------------------------------------

async function readJson<T>(path: string, fallback: T): Promise<T> {
  if (!existsSync(path)) return fallback
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true })
  const tmp = `${path}.tmp`
  await writeFile(tmp, JSON.stringify(value, null, 2) + '\n')
  await rename(tmp, path)
}

function sourceKey(owner: string, repo: string, skill: string) {
  return `${owner}/${repo}/${skill}`.toLowerCase()
}

async function main() {
  const today = localDate()
  const history = await readJson<{ lastRun?: string; runs: Json[] }>(LOG, { runs: [] })

  // El workflow se lanza a las 05:00 y 06:00 UTC para cubrir el cambio de horario: solo trabaja
  // la ejecución que cae entre las 00:00 y las 02:59 de la hora local, y una vez al día.
  if (!FORCE) {
    const hour = localHour()
    if (hour > 2) return log(`Son las ${hour}:00 en ${TIME_ZONE}; esta ejecución no toca. Nada que hacer.`)
    if (history.lastRun === today) return log(`Ya se importó hoy (${today}). Nada que hacer.`)
  }

  const catalog = await readJson<Json[]>(CATALOG_JSON, [])
  const ids = new Set(catalog.map((item) => String(item.id)))
  const known = new Set(
    catalog
      .map((item) => item.source as Json | undefined)
      .filter((source): source is Json => Boolean(source))
      .map((source) => `${String(source.repo)}/${String(source.skill)}`.toLowerCase()),
  )

  const ranking = await leaderboard()
  log(`Ranking de skills.sh: ${ranking.length} skills. Límite de hoy: ${LIMIT}.${DRY_RUN ? ' (simulación)' : ''}`)

  // Las ya importadas se actualizan con su número de instalaciones de hoy.
  for (const item of catalog) {
    const source = item.source as Json | undefined
    if (!source) continue
    const match = ranking.find((entry) => sourceKey(entry.owner, entry.repo, entry.skill) === `${String(source.repo)}/${String(source.skill)}`.toLowerCase())
    if (match && match.installs > 0) source.installs = match.installs
  }

  const added: Json[] = []
  const skipped: Json[] = []

  for (const entry of ranking) {
    if (added.length >= LIMIT) break
    const key = sourceKey(entry.owner, entry.repo, entry.skill)
    if (known.has(key)) continue
    log(`\n#${entry.rank} ${key} · ${entry.installs.toLocaleString('es')} instalaciones`)

    try {
      const located = await locateSkill(entry)
      if (!located) throw new Error('no se encontró su SKILL.md en el repositorio')
      const { items, license, repoInfo } = await repoTree(entry.owner, entry.repo)
      if (repoInfo.archived) throw new Error('el repositorio está archivado')

      const files = await collectFiles(entry, located.ref, located.dir, items)
      const docFile = files.find((file) => file.path === 'SKILL.md')
      if (!docFile) throw new Error('SKILL.md vacío o ilegible')
      if (docFile.data.length > MAX_DOC) throw new Error('SKILL.md demasiado grande')
      const doc = docFile.data.toString('utf8')
      const meta = frontmatter(doc)
      if (!meta.name || !meta.description) throw new Error('el SKILL.md no tiene name y description')

      if (!files.some((file) => /^LICEN[SC]E(\.\w+)?$/i.test(file.path))) {
        const text = await licenseText(entry.owner, entry.repo)
        if (text) files.push({ path: 'LICENSE.txt', data: text })
      }

      let id = slugify(entry.skill)
      if (ids.has(id)) id = slugify(`${entry.owner}-${entry.skill}`)
      if (!id || ids.has(id)) throw new Error(`el id "${id}" ya está en uso`)

      const copy = await copywrite(entry, doc)
      const [from, to] = PALETTE[createHash('sha1').update(key).digest()[0] % PALETTE.length]
      const totalBytes = files.reduce((sum, file) => sum + file.data.length, 0)
      const url = `https://skills.sh/${entry.owner}/${entry.repo}/${entry.skill}`

      const skill: Json = {
        id,
        name: copy?.name ?? titleCase(entry.skill),
        subtitle: copy?.subtitle ?? clip(meta.description, 90),
        author: await authorName(entry.owner),
        category: copy?.category ?? guessCategory(`${entry.skill} ${meta.description}`),
        rating: 0,
        ratingsCount: 0,
        price: 'Gratis',
        verified: false,
        agents: ['Cursor', 'Claude', 'Codex'],
        compatibility: { Cursor: 'full', Claude: 'full', ChatGPT: 'none', Codex: 'full', Gemini: 'none', Copilot: 'none' },
        description: copy?.description ?? clip(meta.description, 600),
        whatsNew: `Importada de skills.sh, donde suma ${entry.installs.toLocaleString('es')} instalaciones.`,
        version: '1.0',
        size: `${Math.max(1, Math.round(totalBytes / 1024))} KB`,
        age: '4+',
        icon: { from, to, glyph: titleCase(entry.skill).slice(0, 2), symbol: copy?.symbol ?? 'sparkles' },
        screenshots: [],
        reviews: [],
        source: {
          repo: `${entry.owner}/${entry.repo}`,
          skill: entry.skill,
          url,
          installs: entry.installs,
          license,
          importedAt: today,
        },
      }

      if (!DRY_RUN) {
        const dir = resolve(CATALOG, id)
        if (!dir.startsWith(CATALOG + sep)) throw new Error('ruta no permitida')
        await rm(dir, { recursive: true, force: true })
        for (const file of files) {
          const target = resolve(dir, normalize(file.path))
          if (!target.startsWith(dir + sep)) continue
          await mkdir(dirname(target), { recursive: true })
          await writeFile(target, file.data)
        }
        catalog.push(skill)
      }

      ids.add(id)
      known.add(key)
      added.push({ id, source: key, installs: entry.installs, files: files.length, license, spanish: Boolean(copy) })
      log(`  ✓ añadida como "${String(skill.name)}" (${id}) · ${files.length} archivos · licencia ${license}${copy ? '' : ' · ficha en inglés'}`)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      skipped.push({ source: key, reason })
      log(`  ✗ omitida: ${reason}`)
    }
  }

  log(`\nResultado: ${added.length} añadidas, ${skipped.length} omitidas.`)
  if (DRY_RUN) return

  await writeJson(CATALOG_JSON, catalog)
  history.lastRun = today
  history.runs = [{ date: today, added, skipped }, ...history.runs].slice(0, 90)
  await writeJson(LOG, history)

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      `## Importación del ${today}`,
      '',
      `${added.length} skills añadidas, ${skipped.length} omitidas.`,
      '',
      ...added.map((item) => `- ✅ \`${String(item.id)}\` desde ${String(item.source)} (${Number(item.installs).toLocaleString('es')} instalaciones)`),
      ...skipped.map((item) => `- ⏭️ ${String(item.source)}: ${String(item.reason)}`),
    ]
    await writeFile(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n', { flag: 'a' })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
