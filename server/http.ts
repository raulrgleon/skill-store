import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  adminDelete,
  adminGet,
  adminList,
  adminPublish,
  adminSave,
  adminStatus,
} from './admin.ts'

const MAX_BODY = 1_500_000
// Guardar una skill puede incluir imágenes (base64): hasta 8 de 2,5 MB.
const MAX_BODY_WITH_MEDIA = 30_000_000

export function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}

export function readBody(req: IncomingMessage, limit = MAX_BODY) {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += buf.length
      if (size > limit) {
        reject(new Error('La petición es demasiado grande.'))
        req.destroy()
        return
      }
      chunks.push(buf)
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('JSON inválido'))
      }
    })
    req.on('error', reject)
  })
}

// Rutas del panel (/api/admin/skills, /status, /publish). Quien llama ya validó el acceso:
// en local el host/cabecera (plugin de Vite), en producción la sesión (prod.ts).
export async function adminRoute(req: IncomingMessage, res: ServerResponse, url: string) {
  const rest = url.slice('/api/admin/'.length)
  const [head, rawId] = rest.split('/')
  const id = rawId ? decodeURIComponent(rawId) : ''

  if (req.method === 'GET' && head === 'skills' && !id) return send(res, 200, await adminList())
  if (req.method === 'GET' && head === 'skills') return send(res, 200, await adminGet(id))
  if (req.method === 'PUT' && head === 'skills') {
    const body = (await readBody(req, MAX_BODY_WITH_MEDIA)) as {
      isNew?: unknown
      skill?: unknown
      doc?: unknown
      uploads?: unknown
    }
    return send(res, 200, await adminSave({ id, isNew: body.isNew, skill: body.skill, doc: body.doc, uploads: body.uploads }))
  }
  if (req.method === 'DELETE' && head === 'skills') return send(res, 200, await adminDelete(id))
  if (req.method === 'GET' && head === 'status') return send(res, 200, await adminStatus())
  if (req.method === 'POST' && head === 'publish') {
    const body = (await readBody(req)) as { message?: unknown }
    return send(res, 200, await adminPublish(body.message))
  }
  return send(res, 404, { error: 'Ruta no encontrada' })
}
