import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { installSkill, listInstalled, parseTargets, uninstallSkill } from './installer.ts'

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
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
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/api/')) {
          next()
          return
        }

        try {
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
