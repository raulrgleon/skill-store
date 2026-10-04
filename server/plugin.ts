import type { IncomingMessage, ServerResponse } from 'node:http'
import { sep } from 'node:path'
import type { Plugin } from 'vite'
import {
  AdminError,
  adminDelete,
  adminGet,
  adminList,
  adminPublish,
  adminSave,
  adminStatus,
} from './admin.ts'
import { installSkill, listInstalled, parseTargets, uninstallSkill } from './installer.ts'

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

// El panel escribe archivos del proyecto: solo se atiende desde esta máquina.
// 1) Host local (evita DNS rebinding) 2) cabecera propia (un sitio externo no puede enviarla
// sin preflight, y no respondemos preflights) 3) Origin, si viene, debe ser el mismo host.
function assertLocalAdmin(req: IncomingMessage) {
  const host = (req.headers.host ?? '').replace(/:\d+$/, '')
  if (!LOCAL_HOSTS.has(host)) throw new AdminError('El panel solo funciona en localhost.')
  if (req.headers['x-skillstore-admin'] !== '1') throw new AdminError('Petición no autorizada.')
  const origin = req.headers.origin
  if (origin && new URL(origin).host !== req.headers.host) throw new AdminError('Origen no permitido.')
}

function readBody(req: IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
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

export function skillStoreApi(): Plugin {
  return {
    name: 'skill-store-api',
    // El panel escribe catalog.json y catalog/*: sin esto Vite recargaría la página a mitad de la
    // petición y el aviso de "guardado" se perdería. El panel recarga él mismo al terminar.
    handleHotUpdate({ file }) {
      const path = file.split(sep).join('/')
      if (path.endsWith('/src/data/catalog.json') || path.includes('/catalog/')) return []
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/api/')) {
          next()
          return
        }

        try {
          if (url.startsWith('/api/admin/')) {
            assertLocalAdmin(req)
            const rest = url.slice('/api/admin/'.length)
            const [head, rawId] = rest.split('/')
            const id = rawId ? decodeURIComponent(rawId) : ''

            if (req.method === 'GET' && head === 'skills' && !id) return send(res, 200, await adminList())
            if (req.method === 'GET' && head === 'skills') return send(res, 200, await adminGet(id))
            if (req.method === 'PUT' && head === 'skills') {
              const body = (await readBody(req)) as { isNew?: unknown; skill?: unknown; doc?: unknown }
              return send(res, 200, await adminSave({ id, isNew: body.isNew, skill: body.skill, doc: body.doc }))
            }
            if (req.method === 'DELETE' && head === 'skills') return send(res, 200, await adminDelete(id))
            if (req.method === 'GET' && head === 'status') return send(res, 200, await adminStatus())
            if (req.method === 'POST' && head === 'publish') {
              const body = (await readBody(req)) as { message?: unknown }
              return send(res, 200, await adminPublish(body.message))
            }
            return send(res, 404, { error: 'Ruta no encontrada' })
          }

          if (req.method === 'GET' && url === '/api/installed') {
            send(res, 200, await listInstalled())
            return
          }

          if (req.method === 'POST' && url === '/api/install') {
            const body = (await readBody(req)) as { id?: string; targets?: unknown }
            if (!body.id) throw new Error('Falta el id de la skill')
            send(res, 200, await installSkill(body.id, parseTargets(body.targets)))
            return
          }

          if (req.method === 'POST' && url === '/api/uninstall') {
            const body = (await readBody(req)) as { id?: string; targets?: unknown }
            if (!body.id) throw new Error('Falta el id de la skill')
            const targets = Array.isArray(body.targets) ? parseTargets(body.targets) : undefined
            send(res, 200, await uninstallSkill(body.id, targets))
            return
          }

          next()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al instalar'
          send(res, 400, { error: message })
        }
      })
    },
  }
}
