export type InstallTarget = 'cursor' | 'claude' | 'codex'

export type InstalledMap = Record<string, InstallTarget[]>

export const TARGET_LABEL: Record<InstallTarget, string> = {
  cursor: 'Cursor',
  claude: 'Claude',
  codex: 'Codex',
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const data = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo hablar con el instalador')
  }
  return data
}

export function fetchInstalled() {
  return request<{ installed: InstalledMap; homes: Record<InstallTarget, string> }>('/api/installed')
}

export function installSkill(id: string, targets: InstallTarget[]) {
  return request<{ id: string; targets: InstallTarget[]; paths: Record<string, string> }>('/api/install', {
    method: 'POST',
    body: JSON.stringify({ id, targets }),
  })
}

export function uninstallSkill(id: string, targets?: InstallTarget[]) {
  return request<{ id: string; removed: Record<string, string> }>('/api/uninstall', {
    method: 'POST',
    body: JSON.stringify({ id, targets }),
  })
}
