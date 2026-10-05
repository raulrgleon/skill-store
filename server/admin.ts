import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { isSymbolName } from '../src/icons/symbolNames.ts'

const run = promisify(execFile)

// Local (npm run dev): trabaja sobre esta carpeta y publica con commit + push manual.
// Remoto (producción): SKILLSTORE_REMOTE = URL git. Trabaja sobre un clon propio y cada cambio
// hace commit + push al momento; el webhook de Coolify redespliega el sitio.
const REMOTE = process.env.SKILLSTORE_REMOTE ?? ''
const ROOT = REMOTE
  ? resolve(process.env.SKILLSTORE_ROOT ?? '/data/repo')
  : resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG = join(ROOT, 'catalog')
const CATALOG_JSON = join(ROOT, 'src', 'data', 'catalog.json')
const MEDIA = join(ROOT, 'media')
const TRASH = join(CATALOG, '.trash')
const BRANCH = process.env.SKILLSTORE_BRANCH ?? 'main'

export const adminMode = REMOTE ? 'remote' : 'local'

const AGENTS = ['Cursor', 'Claude', 'ChatGPT', 'Codex', 'Gemini', 'Copilot'] as const
const LEVELS = ['full', 'partial', 'none'] as const
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HEX_RE = /^#[0-9a-fA-F]{6}$/
const MAX_DOC = 500_000
const MAX_GALLERY = 8
const MAX_IMAGE = 2_500_000
const MEDIA_FILE_RE = /^[a-f0-9]{12}\.(?:png|jpg|webp|gif)$/

type Json = Record<string, unknown>

export class AdminError extends Error {}

function fail(message: string): never {
  throw new AdminError(message)
}

export function assertId(id: unknown): string {
  if (typeof id !== 'string' || id.length > 60 || !ID_RE.test(id)) {
    fail('El id solo admite minúsculas, números y guiones (por ejemplo: mi-skill).')
  }
  return id
}

function mediaDir(id: string) {
  const dir = resolve(MEDIA, id)
  if (!dir.startsWith(MEDIA + sep)) fail('Ruta no permitida.')
  return dir
}

function skillDir(id: string) {
  const dir = resolve(CATALOG, id)
  // Defensa extra: nunca salir de catalog/ aunque el regex cambie en el futuro.
  if (!dir.startsWith(CATALOG + sep)) fail('Ruta no permitida.')
  return dir
}

async function readCatalog(): Promise<Json[]> {
  const list = JSON.parse(await readFile(CATALOG_JSON, 'utf8'))
  if (!Array.isArray(list)) fail('catalog.json está dañado.')
  return list as Json[]
}

async function writeCatalog(list: Json[]) {
  const tmp = `${CATALOG_JSON}.tmp`
  await writeFile(tmp, JSON.stringify(list, null, 2) + '\n')
  await rename(tmp, CATALOG_JSON)
}

function text(value: unknown, label: string, max: number, required = true) {
  const str = typeof value === 'string' ? value.trim() : ''
  if (required && !str) fail(`${label} es obligatorio.`)
  if (str.length > max) fail(`${label} no puede pasar de ${max} caracteres.`)
  return str
}

function number(value: unknown, label: string, min: number, max: number) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < min || n > max) fail(`${label} debe estar entre ${min} y ${max}.`)
  return n
}

function color(value: unknown, label: string) {
  if (typeof value !== 'string' || !HEX_RE.test(value)) fail(`${label} debe ser un color como #4338CA.`)
  return value
}

function cleanSkill(input: Json, id: string, previous?: Json): Json {
  const compatIn = (input.compatibility ?? {}) as Json
  const compatibility = Object.fromEntries(
    AGENTS.map((agent) => {
      const level = compatIn[agent] ?? 'none'
      if (!LEVELS.includes(level as (typeof LEVELS)[number])) fail(`Compatibilidad no válida para ${agent}.`)
      return [agent, level]
    }),
  )
  const agentsIn = Array.isArray(input.agents) ? input.agents : []
  const agents = AGENTS.filter((agent) => agentsIn.includes(agent))
  if (agents.length === 0) fail('Marca al menos un agente compatible.')

  const iconIn = (input.icon ?? {}) as Json
  if (iconIn.symbol !== undefined && iconIn.symbol !== '' && !isSymbolName(iconIn.symbol)) fail('Ese símbolo de icono no existe.')
  const icon = {
    from: color(iconIn.from, 'Color inicial del icono'),
    to: color(iconIn.to, 'Color final del icono'),
    glyph: text(iconIn.glyph, 'Glifo del icono', 3, false) || text(input.name, 'Nombre', 60).slice(0, 2),
    ...(isSymbolName(iconIn.symbol) ? { symbol: iconIn.symbol } : {}),
  }

  const next: Json = {
    id,
    name: text(input.name, 'El nombre', 60),
    subtitle: text(input.subtitle, 'El subtítulo', 90),
    author: text(input.author, 'El autor', 40),
    category: text(input.category, 'La categoría', 30),
    rating: Math.round(number(input.rating, 'La puntuación', 0, 5) * 10) / 10,
    ratingsCount: Math.round(number(input.ratingsCount, 'Las valoraciones', 0, 1e9)),
    price: text(input.price, 'El precio', 20),
    verified: input.verified === true,
    ...(input.private === true ? { private: true } : {}),
    agents,
    compatibility,
    description: text(input.description, 'La descripción', 600),
    whatsNew: text(input.whatsNew, 'Las novedades', 300, false),
    version: text(input.version, 'La versión', 12),
    size: text(input.size, 'El tamaño', 20, false),
    age: text(input.age, 'La edad', 6, false) || '4+',
    icon,
  }

  // Campos que el formulario no edita se conservan tal cual.
  for (const key of ['story', 'screenshots', 'reviews']) {
    if (previous && previous[key] !== undefined) next[key] = previous[key]
  }
  next.screenshots ??= []
  next.reviews ??= []
  return next
}

type Pending = { name: string; data: Buffer }

// Tipo real por los primeros bytes: la extensión o el Content-Type del cliente no se creen.
function sniffImage(buf: Buffer): 'png' | 'jpg' | 'webp' | 'gif' | null {
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.length > 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp'
  if (buf.length > 6 && buf.subarray(0, 4).toString('latin1') === 'GIF8') return 'gif'
  return null
}

function dimension(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : undefined
}

// Valida la galería entera antes de escribir nada en disco.
function parseGallery(id: string, input: unknown, uploads: unknown) {
  const entries = Array.isArray(input) ? input : []
  if (entries.length > MAX_GALLERY) fail(`La galería admite hasta ${MAX_GALLERY} imágenes.`)
  const ups = uploads && typeof uploads === 'object' ? (uploads as Record<string, unknown>) : {}
  const dir = mediaDir(id)
  const gallery: Json[] = []
  const pending: Pending[] = []

  for (const raw of entries) {
    const entry = (raw ?? {}) as Json
    const caption = text(entry.caption, 'El pie de la imagen', 140, false)
    let file = typeof entry.file === 'string' ? entry.file : ''

    if (Object.hasOwn(ups, file)) {
      const encoded = ups[file]
      if (typeof encoded !== 'string') fail('Imagen no válida.')
      const data = Buffer.from(encoded, 'base64')
      if (data.length === 0) fail('Una imagen llegó vacía.')
      if (data.length > MAX_IMAGE) fail('Cada imagen puede pesar hasta 2,5 MB.')
      const kind = sniffImage(data)
      if (!kind) fail('Solo se admiten imágenes PNG, JPG, WebP o GIF.')
      file = `${createHash('sha1').update(data).digest('hex').slice(0, 12)}.${kind}`
      pending.push({ name: file, data })
    } else {
      if (!MEDIA_FILE_RE.test(file)) fail('Imagen no válida.')
      if (!existsSync(join(dir, file))) fail('Una imagen de la galería ya no existe: quítala y vuelve a subirla.')
    }

    const w = dimension(entry.w)
    const h = dimension(entry.h)
    gallery.push({ file, caption, ...(w && h ? { w, h } : {}) })
  }
  return { gallery, pending }
}

// Escribe las nuevas y borra las que ya no están en la galería.
async function applyGallery(id: string, gallery: Json[], pending: Pending[]) {
  const dir = mediaDir(id)
  if (gallery.length === 0) {
    await rm(dir, { recursive: true, force: true })
    return
  }
  await mkdir(dir, { recursive: true })
  for (const item of pending) await writeFile(join(dir, item.name), item.data)
  const keep = new Set(gallery.map((item) => String(item.file)))
  for (const name of await readdir(dir)) {
    if (!keep.has(name)) await rm(join(dir, name), { force: true })
  }
}

async function countExtraFiles(dir: string): Promise<number> {
  let count = 0
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (entry.isDirectory()) count += await countExtraFiles(join(dir, entry.name))
    else if (entry.name !== 'SKILL.md') count += 1
  }
  return count
}

export async function adminList() {
  await syncRemote()
  const list = await readCatalog()
  const items = await Promise.all(
    list.map(async (skill) => {
      const id = String(skill.id)
      const dir = skillDir(id)
      return {
        skill,
        hasDoc: existsSync(join(dir, 'SKILL.md')),
        extraFiles: await countExtraFiles(dir),
      }
    }),
  )
  return { items }
}

export async function adminGet(id: string) {
  assertId(id)
  await syncRemote()
  const list = await readCatalog()
  const skill = list.find((item) => item.id === id)
  if (!skill) fail('No existe esa skill.')
  const docPath = join(skillDir(id), 'SKILL.md')
  const doc = existsSync(docPath) ? await readFile(docPath, 'utf8') : ''
  return { skill, doc, extraFiles: await countExtraFiles(skillDir(id)) }
}

export function adminSave(input: { id: unknown; isNew: unknown; skill: unknown; doc: unknown; uploads?: unknown }) {
  return serial(async () => {
    const id = assertId(input.id)
    if (!input.skill || typeof input.skill !== 'object') fail('Faltan los datos de la skill.')
    const doc = typeof input.doc === 'string' ? input.doc : ''
    if (!doc.trim()) fail('El SKILL.md no puede estar vacío: es lo que instala el agente.')
    if (doc.length > MAX_DOC) fail('El SKILL.md es demasiado grande (máximo 500 KB).')

    await syncRemote(true)
    const list = await readCatalog()
    const index = list.findIndex((item) => item.id === id)
    if (input.isNew && index !== -1) fail(`Ya existe una skill con el id "${id}".`)
    if (!input.isNew && index === -1) fail('Esa skill ya no existe.')

    const skill = cleanSkill(input.skill as Json, id, index === -1 ? undefined : list[index])
    // Valida la galería entera antes de tocar el disco.
    const { gallery, pending } = parseGallery(id, (input.skill as Json).gallery, input.uploads)
    if (gallery.length > 0) skill.gallery = gallery
    if (index === -1) list.push(skill)
    else list[index] = skill

    const dir = skillDir(id)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'SKILL.md'), doc.endsWith('\n') ? doc : `${doc}\n`)
    await applyGallery(id, gallery, pending)
    await writeCatalog(list)
    if (REMOTE) await publishRemote(`${input.isNew ? 'Añadir' : 'Actualizar'} skill ${String(skill.name)}`)
    return { skill }
  })
}

export function adminDelete(id: string) {
  return serial(async () => {
    assertId(id)
    await syncRemote(true)
    const list = await readCatalog()
    const index = list.findIndex((item) => item.id === id)
    if (index === -1) fail('Esa skill ya no existe.')
    const name = String(list[index].name)
    list.splice(index, 1)

    const dir = skillDir(id)
    let trashed: string | null = null
    if (existsSync(dir)) {
      if (REMOTE) {
        // En remoto la papelera es el historial de git.
        await rm(dir, { recursive: true, force: true })
      } else {
        await mkdir(TRASH, { recursive: true })
        trashed = join(TRASH, `${id}-${Date.now()}`)
        await rename(dir, trashed)
      }
    }
    const media = mediaDir(id)
    if (existsSync(media)) {
      if (REMOTE) {
        await rm(media, { recursive: true, force: true })
      } else {
        await mkdir(TRASH, { recursive: true })
        await rename(media, join(TRASH, `${id}-${Date.now()}-media`))
      }
    }
    await writeCatalog(list)
    if (REMOTE) await publishRemote(`Eliminar skill ${name}`)
    return { id, trashed: trashed ? trashed.replace(ROOT + sep, '') : null }
  })
}

// ---- git ------------------------------------------------------------------

const PUBLISH_PATHS = ['catalog', 'media', 'src/data/catalog.json']

async function git(args: string[], cwd = ROOT) {
  const { stdout } = await run('git', args, {
    cwd,
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
  return stdout.trim()
}

let lastSync = 0

// Modo remoto: deja el clon igual que origin/main (clona la primera vez).
export async function syncRemote(force = false) {
  if (!REMOTE) return
  if (!force && Date.now() - lastSync < 10_000) return
  try {
    if (!existsSync(join(ROOT, '.git'))) {
      await mkdir(dirname(ROOT), { recursive: true })
      await git(['clone', '--depth', '1', '--branch', BRANCH, REMOTE, ROOT], dirname(ROOT))
    } else {
      await git(['fetch', '--depth', '1', 'origin', BRANCH])
      await git(['reset', '--hard', `origin/${BRANCH}`])
      await git(['clean', '-fd', '--', ...PUBLISH_PATHS])
    }
  } catch (error) {
    console.error('syncRemote', error instanceof Error ? error.message.split('\n')[0] : error)
    fail('No se pudo conectar con el repositorio en GitHub. Revisa la llave de despliegue.')
  }
  lastSync = Date.now()
}

// Las escrituras van de una en una: hay un solo clon y un solo push a la vez.
let queue: Promise<unknown> = Promise.resolve()

function serial<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task)
  queue = next.catch(() => undefined)
  return next
}

async function publishRemote(message: string) {
  await git(['add', '-A', '--', ...PUBLISH_PATHS])
  const dirty = await git(['status', '--porcelain', '--', ...PUBLISH_PATHS])
  if (!dirty) return
  await git([
    '-c', 'user.name=Skill Store Admin',
    '-c', 'user.email=admin@skill.dnet.llc',
    'commit', '-m', message, '--', ...PUBLISH_PATHS,
  ])
  try {
    await git(['push', 'origin', `HEAD:${BRANCH}`])
  } catch {
    lastSync = 0
    fail('No se pudo subir el cambio (¿alguien publicó a la vez?). Vuelve a intentarlo.')
  }
}

export async function adminStatus() {
  // Remoto: no hay nada pendiente, cada guardado ya es un commit subido.
  if (REMOTE) return { mode: adminMode, git: true, branch: BRANCH, changes: [], ahead: 0 }
  try {
    const changes = (await git(['status', '--porcelain', '--', ...PUBLISH_PATHS]))
      .split('\n')
      .filter(Boolean)
      .map((line) => ({ code: line.slice(0, 2).trim() || '?', file: line.slice(3) }))
    let ahead = 0
    try {
      ahead = Number(await git(['rev-list', '--count', '@{u}..HEAD'])) || 0
    } catch {
      ahead = 0
    }
    const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD'])
    return { mode: adminMode, git: true, branch, changes, ahead }
  } catch {
    return { mode: adminMode, git: false, branch: '', changes: [], ahead: 0 }
  }
}

export async function adminPublish(message: unknown) {
  if (REMOTE) fail('Aquí cada cambio se publica al guardar.')
  const msg = typeof message === 'string' ? message.trim() : ''
  if (!msg) fail('Escribe un mensaje para el cambio.')
  if (msg.length > 120) fail('El mensaje no puede pasar de 120 caracteres.')

  const status = await adminStatus()
  if (!status.git) fail('Esta carpeta no es un repositorio git.')
  if (status.changes.length === 0 && status.ahead === 0) fail('No hay cambios que publicar.')

  if (status.changes.length > 0) {
    await git(['add', '-A', '--', ...PUBLISH_PATHS])
    // `--` + rutas: solo se commitea el catálogo, aunque haya otros archivos preparados.
    await git(['commit', '-m', msg, '--', ...PUBLISH_PATHS])
  }
  try {
    await git(['push', 'origin', 'HEAD'])
  } catch (error) {
    const detail = error instanceof Error ? error.message.split('\n').slice(0, 3).join(' ') : ''
    fail(`Se guardó el commit en local, pero el push falló. ${detail}`.trim())
  }
  const commit = await git(['rev-parse', '--short', 'HEAD'])
  return { commit, published: status.changes.length }
}
