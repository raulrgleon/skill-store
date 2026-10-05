import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { adminMode, AdminError } from './admin.ts'
import {
  authConfigured,
  checkPassword,
  clearFailures,
  clientIp,
  cookieHeader,
  createSession,
  hasSession,
  lockedOut,
  registerFailure,
  SESSION_SECONDS,
} from './auth.ts'
import { adminRoute, readBody, send } from './http.ts'

// Servidor de producción: sirve la web (dist/) y la API del panel /api/admin con login.
// Sustituye a nginx para poder escribir en el repositorio desde la web.

const DIST = resolve(process.env.DIST_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'dist'))
const PORT = Number(process.env.PORT ?? 80)
// El panel solo se abre con contraseña Y con llave de despliegue (modo remoto).
const ready = authConfigured && adminMode === 'remote'

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
}

const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.map', '.md'])
const gzipCache = new Map<string, { mtime: number; body: Buffer }>()

function secure(req: IncomingMessage) {
  return req.headers['x-forwarded-proto'] === 'https'
}

function baseHeaders(res: ServerResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

// Mismas comprobaciones que en local, más la sesión: cabecera propia (no se puede enviar
// desde otro sitio sin preflight) y Origin igual al host.
function assertSameOrigin(req: IncomingMessage) {
  if (req.headers['x-skillstore-admin'] !== '1') throw new AdminError('Petición no autorizada.')
  const origin = req.headers.origin
  if (origin) {
    let host = ''
    try {
      host = new URL(origin).host
    } catch {
      throw new AdminError('Origen no permitido.')
    }
    if (host !== req.headers.host) throw new AdminError('Origen no permitido.')
  }
}

async function handleAdmin(req: IncomingMessage, res: ServerResponse, url: string) {
  if (req.method === 'GET' && url === '/api/admin/session') {
    return send(res, 200, { authenticated: hasSession(req), mode: adminMode, configured: ready })
  }

  assertSameOrigin(req)
  if (!ready) return send(res, 503, { error: 'El panel no está configurado en este servidor.' })

  if (req.method === 'POST' && url === '/api/admin/login') {
    const ip = clientIp(req)
    if (lockedOut(ip)) return send(res, 429, { error: 'Demasiados intentos. Espera 15 minutos.' })
    const body = (await readBody(req)) as { password?: unknown }
    if (!checkPassword(body.password)) {
      registerFailure(ip)
      // Frena la fuerza bruta incluso dentro del límite.
      await new Promise((done) => setTimeout(done, 700))
      return send(res, 401, { error: 'Contraseña incorrecta.' })
    }
    clearFailures(ip)
    res.setHeader('Set-Cookie', cookieHeader(createSession(), SESSION_SECONDS, secure(req)))
    return send(res, 200, { authenticated: true, mode: adminMode, configured: true })
  }

  if (req.method === 'POST' && url === '/api/admin/logout') {
    res.setHeader('Set-Cookie', cookieHeader('', 0, secure(req)))
    return send(res, 200, { authenticated: false })
  }

  if (!hasSession(req)) return send(res, 401, { error: 'Inicia sesión para continuar.' })
  return adminRoute(req, res, url)
}

function resolveFile(pathname: string) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '')
  const file = resolve(DIST, clean)
  if (file !== DIST && !file.startsWith(DIST + sep)) return null
  return file
}

async function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string) {
  let file = resolveFile(pathname)
  if (!file) {
    res.statusCode = 400
    return res.end('Ruta no válida')
  }

  let isFile = existsSync(file) && statSync(file).isFile()
  if (!isFile) {
    // Rutas de la app (/explorar, /skill/x): index.html. Un archivo que falta (con extensión): 404.
    if (extname(pathname)) {
      res.statusCode = 404
      return res.end('No encontrado')
    }
    file = join(DIST, 'index.html')
    isFile = true
  }

  const ext = extname(file)
  const stat = statSync(file)
  res.setHeader('Content-Type', TYPES[ext] ?? 'application/octet-stream')
  // Los assets llevan hash en el nombre; el HTML nunca se cachea para ver los despliegues al instante.
  res.setHeader(
    'Cache-Control',
    file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
  )

  const wantsGzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))
  if (wantsGzip && COMPRESSIBLE.has(ext) && stat.size > 1024) {
    let entry = gzipCache.get(file)
    if (!entry || entry.mtime !== stat.mtimeMs) {
      entry = { mtime: stat.mtimeMs, body: gzipSync(await readFile(file)) }
      gzipCache.set(file, entry)
    }
    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Vary', 'Accept-Encoding')
    res.setHeader('Content-Length', entry.body.length)
    return res.end(req.method === 'HEAD' ? undefined : entry.body)
  }

  res.setHeader('Content-Length', stat.size)
  if (req.method === 'HEAD') return res.end()
  createReadStream(file).pipe(res)
}

const server = createServer(async (req, res) => {
  baseHeaders(res)
  const url = (req.url ?? '/').split('?')[0]
  try {
    if (url === '/healthz') {
      res.setHeader('Content-Type', 'text/plain')
      return res.end('ok')
    }
    if (url.startsWith('/api/admin/')) return await handleAdmin(req, res, url)
    if (url.startsWith('/api/')) return send(res, 404, { error: 'No disponible en la versión pública.' })
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405
      return res.end('Método no permitido')
    }
    return await serveStatic(req, res, url)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado'
    if (res.headersSent) return res.end()
    // Los fallos del panel se muestran; el resto se registra y no se detalla fuera.
    if (error instanceof AdminError) return send(res, 400, { error: message })
    console.error(`[${req.method} ${url}]`, message)
    send(res, 500, { error: 'Error interno del servidor.' })
  }
})

server.listen(PORT, () => {
  console.log(`Skill Store en :${PORT} · panel ${ready ? 'activo' : 'apagado (faltan ADMIN_PASSWORD, SESSION_SECRET o DEPLOY_KEY)'} · modo ${adminMode}`)
})

// Evita que un fallo suelto tumbe el proceso: Coolify lo reiniciaría y se perdería el clon.
process.on('unhandledRejection', (reason) => console.error('unhandledRejection', reason))

