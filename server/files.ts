import type { IncomingMessage, ServerResponse } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Archivos públicos que no están en dist/:
//   /media/<id>/<hash>.<ext>      imágenes de la galería de cada skill
//   /skills/<id>/SKILL.md         el SKILL.md en crudo (para instalar con curl o descargar)
// Se leen primero del clon de trabajo del panel (así lo recién subido se ve al instante) y
// después de la copia que va dentro de la imagen del contenedor.

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CLONE = process.env.SKILLSTORE_REMOTE ? resolve(process.env.SKILLSTORE_ROOT ?? '/data/repo') : null
const ROOTS = [CLONE, APP].filter((root): root is string => Boolean(root))

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MEDIA_RE = /^[a-f0-9]{12}\.(png|jpg|webp|gif)$/
const TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}

// Una skill privada no se publica: ni su SKILL.md ni sus imágenes salen por estas rutas.
function isPublic(root: string, id: string) {
  try {
    const list = JSON.parse(readFileSync(join(root, 'src', 'data', 'catalog.json'), 'utf8')) as {
      id: string
      private?: boolean
    }[]
    const skill = list.find((item) => item.id === id)
    return Boolean(skill) && !skill?.private
  } catch {
    return false
  }
}

function locate(relative: string, id: string) {
  for (const root of ROOTS) {
    const file = join(root, relative)
    if (!existsSync(file) || !statSync(file).isFile()) continue
    if (isPublic(root, id)) return file
  }
  return null
}

function notFound(res: ServerResponse) {
  res.statusCode = 404
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end('No encontrado')
}

// Devuelve true si la ruta era suya (aunque respondiera 404).
export function serveSkillFile(req: IncomingMessage, res: ServerResponse, url: string): boolean {
  const parts = url.split('/').filter(Boolean)
  const head = parts[0]
  if ((head !== 'media' && head !== 'skills') || parts.length !== 3) return false
  if (req.method !== 'GET' && req.method !== 'HEAD') return false

  let id = ''
  let name = ''
  try {
    id = decodeURIComponent(parts[1])
    name = decodeURIComponent(parts[2])
  } catch {
    notFound(res)
    return true
  }
  if (!ID_RE.test(id)) {
    notFound(res)
    return true
  }

  let file: string | null = null
  if (head === 'media') {
    const match = MEDIA_RE.exec(name)
    file = match ? locate(join('media', id, name), id) : null
    if (file && match) {
      res.setHeader('Content-Type', TYPES[match[1]])
      // El nombre es el hash del contenido: nunca cambia.
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    }
  } else if (name === 'SKILL.md') {
    file = locate(join('catalog', id, 'SKILL.md'), id)
    if (file) {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Content-Disposition', 'inline; filename="SKILL.md"')
    }
  }

  if (!file) {
    notFound(res)
    return true
  }

  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Length', statSync(file).size)
  if (req.method === 'HEAD') res.end()
  else createReadStream(file).pipe(res)
  return true
}
