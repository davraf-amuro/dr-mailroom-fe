import { createRouter, createWebHistory } from 'vue-router'

import { APP_NAME } from '@/utils/appInfo'

import { filtersRoutes } from './routes/filters'
import { MAILBOXES_ROUTE_NAME, mailboxesRoutes } from './routes/mailboxes'
import { runsRoutes } from './routes/runs'
import { statsRoutes } from './routes/stats'

declare module 'vue-router' {
  interface RouteMeta {
    /** Etichetta operativa della vista: titolo della pagina e voce di navigazione. */
    title: string
    /** Etichetta breve per la navigazione, se il titolo è lungo. */
    navLabel?: string
    /** Sopratitolo della metafora di design.md ("Hangar", "Diario di bordo"…). */
    overline?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: MAILBOXES_ROUTE_NAME } },
    ...mailboxesRoutes,
    ...filtersRoutes,
    ...runsRoutes,
    ...statsRoutes,
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Pagina non trovata' },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

/** Testi con cui i browser segnalano un modulo dinamico non scaricabile (Chromium, Firefox, Safari). */
const CHUNK_LOAD_ERRORS = [
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'Importing a module script failed',
]
/** Chiave di sessione: ricorda la pagina già ricaricata, così un errore vero non diventa un ciclo. */
const CHUNK_RELOAD_KEY = 'dr-mailroom:chunk-reload'

function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_LOAD_ERRORS.some((text) => error.message.includes(text))
}

function readReloadTarget(): string | null {
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_KEY)
  } catch {
    return null
  }
}

function writeReloadTarget(target: string | null): void {
  try {
    if (target === null) sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    else sessionStorage.setItem(CHUNK_RELOAD_KEY, target)
  } catch {
    // Storage non disponibile: si rinuncia solo alla protezione dal ciclo.
  }
}

// Dopo un nuovo deploy o un riavvio di Vite il tab aperto chiede file che non esistono più:
// la navigazione fallirebbe in silenzio. Si ricarica la pagina chiesta, una volta sola.
router.onError((error, to) => {
  if (!isChunkLoadError(error)) return
  const target = router.resolve(to.fullPath).href
  if (readReloadTarget() === target) return
  writeReloadTarget(target)
  window.location.assign(target)
})

router.afterEach((to, _from, failure) => {
  document.title = `${to.meta.title} · ${APP_NAME}`
  if (!failure) writeReloadTarget(null)
})

export default router
