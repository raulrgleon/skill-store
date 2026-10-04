import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Header } from './components/Header'
import { skills } from './data/skills'
import { RouterProvider, useRouter } from './lib/router'
import { AuthorPage } from './pages/AuthorPage'
import { BrowsePage } from './pages/BrowsePage'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { SkillPage } from './pages/SkillPage'
import { SubmitPage } from './pages/SubmitPage'
import { TeamsPage } from './pages/TeamsPage'
import { StoreProvider } from './store'
import { Button } from './ui/Button'
import { CommandPalette } from './ui/CommandPalette'

function routeKey(route: ReturnType<typeof useRouter>['route']) {
  if (route.page === 'skill') return `skill:${route.id}`
  if (route.page === 'author') return `author:${route.author}`
  return route.page
}

function titleFor(route: ReturnType<typeof useRouter>['route']) {
  if (route.page === 'browse') return 'Explorar · Skill Store'
  if (route.page === 'library') return 'Biblioteca · Skill Store'
  if (route.page === 'teams') return 'Equipos · Skill Store'
  if (route.page === 'submit') return 'Publicar · Skill Store'
  if (route.page === 'skill') {
    const skill = skills.find((item) => item.id === route.id)
    return skill ? `${skill.name} · Skill Store` : 'Skill Store'
  }
  if (route.page === 'author') return `${route.author} · Skill Store`
  if (route.page === 'missing') return 'No encontrada · Skill Store'
  return 'Skill Store'
}

function Shell() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [palette, setPalette] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPalette(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.title = titleFor(router.route)
    window.scrollTo(0, 0)
  }, [router.route])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.style.colorScheme = next
    localStorage.setItem('skillstore-theme', next)
  }

  const page = (() => {
    const route = router.route
    if (route.page === 'home') return <HomePage onSearch={() => setPalette(true)} />
    if (route.page === 'browse') return <BrowsePage />
    if (route.page === 'skill') return <SkillPage id={route.id} />
    if (route.page === 'author') return <AuthorPage author={route.author} />
    if (route.page === 'submit') return <SubmitPage />
    if (route.page === 'library') return <LibraryPage />
    if (route.page === 'teams') return <TeamsPage />
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <h1 className="text-[32px] font-medium tracking-tight">Esa página no existe</h1>
        <Button className="mt-6" variant="secondary" onClick={() => router.navigate('/')}>
          Ir al inicio
        </Button>
      </div>
    )
  })()

  return (
    <div className="min-h-svh bg-canvas text-ink">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-80 focus:rounded-[10px] focus:bg-surface focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>
      <Header theme={theme} onTheme={toggleTheme} onSearch={() => setPalette(true)} />
      <main id="contenido">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={routeKey(router.route)}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18, ease: 'easeOut' }}
          >
            {page}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-8 text-[13px] text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>Skill Store</p>
          <p>Instalación local en Cursor, Claude y Codex.</p>
        </div>
      </footer>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </RouterProvider>
  )
}
