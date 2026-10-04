import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Route =
  | { page: 'home' }
  | { page: 'browse' }
  | { page: 'skill'; id: string }
  | { page: 'author'; author: string }
  | { page: 'submit' }
  | { page: 'library' }
  | { page: 'teams' }
  | { page: 'admin' }
  | { page: 'admin-edit'; id: string | null }
  | { page: 'missing' }

type RouterValue = {
  route: Route
  params: URLSearchParams
  navigate: (to: string) => void
  replace: (to: string) => void
}

const RouterContext = createContext<RouterValue | null>(null)

function parseLocation(): { route: Route; params: URLSearchParams } {
  const url = new URL(window.location.href)
  const parts = url.pathname.split('/').filter(Boolean)
  const params = url.searchParams
  const head = parts[0]

  if (!head) return { route: { page: 'home' }, params }
  if (head === 'explorar') return { route: { page: 'browse' }, params }
  if (head === 'skill' && parts[1]) return { route: { page: 'skill', id: decodeURIComponent(parts[1]) }, params }
  if (head === 'autor' && parts[1]) return { route: { page: 'author', author: decodeURIComponent(parts[1]) }, params }
  if (head === 'publicar') return { route: { page: 'submit' }, params }
  if (head === 'biblioteca') return { route: { page: 'library' }, params }
  if (head === 'equipos') return { route: { page: 'teams' }, params }
  // El panel solo existe en desarrollo: en producción /admin cae en "no existe".
  if (import.meta.env.DEV && head === 'admin') {
    if (parts[1] === 'nueva') return { route: { page: 'admin-edit', id: null }, params }
    if (parts[1] === 'editar' && parts[2]) {
      return { route: { page: 'admin-edit', id: decodeURIComponent(parts[2]) }, params }
    }
    return { route: { page: 'admin' }, params }
  }
  return { route: { page: 'missing' }, params }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(parseLocation)

  useEffect(() => {
    const onPop = () => setLocation(parseLocation())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const value = useMemo<RouterValue>(() => {
    function go(to: string, mode: 'push' | 'replace') {
      const next = new URL(to, window.location.origin)
      const target = next.pathname + next.search
      const current = window.location.pathname + window.location.search
      if (target !== current) {
        const method = mode === 'push' ? 'pushState' : 'replaceState'
        history[method](null, '', target)
      }
      setLocation(parseLocation())
    }

    return {
      route: location.route,
      params: location.params,
      navigate: (to) => go(to, 'push'),
      replace: (to) => go(to, 'replace'),
    }
  }, [location])

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const value = useContext(RouterContext)
  if (!value) throw new Error('useRouter fuera del provider')
  return value
}
