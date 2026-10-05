import type { Skill } from '../types'

export type AdminItem = { skill: Skill; hasDoc: boolean; extraFiles: number }

export type GitChange = { code: string; file: string }

export type AdminMode = 'local' | 'remote'

export type AdminStatus = {
  mode: AdminMode
  git: boolean
  branch: string
  changes: GitChange[]
  ahead: number
}

export type Session = { authenticated: boolean; mode: AdminMode; configured: boolean }

export class AuthError extends Error {}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Skillstore-Admin': '1' },
  })
  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    throw new Error('El servidor no respondió al panel. Reinicia npm run dev.')
  }
  if (response.status === 401 && path !== 'login') throw new AuthError('Tu sesión terminó. Inicia sesión otra vez.')
  if (!response.ok) {
    const message = (data as { error?: string } | null)?.error
    throw new Error(message || 'No se pudo completar la acción.')
  }
  return data as T
}

export const adminApi = {
  session: () => request<Session>('session'),
  login: (password: string) => request<Session>('login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ authenticated: boolean }>('logout', { method: 'POST', body: '{}' }),
  list: () => request<{ items: AdminItem[] }>('skills'),
  get: (id: string) =>
    request<{ skill: Skill; doc: string; extraFiles: number }>(`skills/${encodeURIComponent(id)}`),
  save: (id: string, body: { isNew: boolean; skill: Skill; doc: string; uploads?: Record<string, string> }) =>
    request<{ skill: Skill }>(`skills/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string) =>
    request<{ id: string; trashed: string | null }>(`skills/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  status: () => request<AdminStatus>('status'),
  publish: (message: string) =>
    request<{ commit: string; published: number }>('publish', { method: 'POST', body: JSON.stringify({ message }) }),
}

// Mensaje que sobrevive a la recarga completa que provoca Vite al cambiar catalog.json.
const FLASH = 'skillstore-flash'

export function flash(message: string) {
  sessionStorage.setItem(FLASH, message)
}

export function takeFlash() {
  const message = sessionStorage.getItem(FLASH)
  if (message) sessionStorage.removeItem(FLASH)
  return message
}
