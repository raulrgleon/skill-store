import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage } from 'node:http'

const PASSWORD = process.env.ADMIN_PASSWORD ?? ''
const SECRET = process.env.SESSION_SECRET ?? ''

export const COOKIE = 'skillstore_admin'
export const SESSION_SECONDS = 60 * 60 * 24 * 7

// Sin contraseña y secreto el panel queda apagado: nunca se abre "por defecto".
export const authConfigured = PASSWORD.length >= 12 && SECRET.length >= 32

function digest(value: string) {
  return createHash('sha256').update(value).digest()
}

export function checkPassword(input: unknown) {
  if (!authConfigured || typeof input !== 'string') return false
  return timingSafeEqual(digest(input), digest(PASSWORD))
}

function sign(payload: string) {
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

// Sesión sin estado: "expira.nonce.firma". Sobrevive a los reinicios del contenedor.
export function createSession() {
  const payload = `${Math.floor(Date.now() / 1000) + SESSION_SECONDS}.${randomBytes(12).toString('base64url')}`
  return `${payload}.${sign(payload)}`
}

export function hasSession(req: IncomingMessage) {
  if (!authConfigured) return false
  const raw = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)
  if (!raw) return false
  const [expires, nonce, signature] = raw.split('.')
  if (!expires || !nonce || !signature) return false
  const expected = sign(`${expires}.${nonce}`)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false
  return Number(expires) > Date.now() / 1000
}

export function cookieHeader(value: string, maxAge: number, secure: boolean) {
  return [
    `${COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ')
}

// ---- Límite de intentos de login (en memoria, por IP) ------------------------

const MAX_FAILS = 5
const WINDOW_MS = 15 * 60 * 1000
const attempts = new Map<string, { fails: number; first: number }>()

export function clientIp(req: IncomingMessage) {
  const forwarded = req.headers['cf-connecting-ip'] ?? req.headers['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return value?.split(',')[0].trim() || req.socket.remoteAddress || 'desconocida'
}

export function lockedOut(ip: string) {
  const entry = attempts.get(ip)
  if (!entry) return false
  if (Date.now() - entry.first > WINDOW_MS) {
    attempts.delete(ip)
    return false
  }
  return entry.fails >= MAX_FAILS
}

export function registerFailure(ip: string) {
  const entry = attempts.get(ip)
  if (!entry || Date.now() - entry.first > WINDOW_MS) attempts.set(ip, { fails: 1, first: Date.now() })
  else entry.fails += 1
}

export function clearFailures(ip: string) {
  attempts.delete(ip)
}
