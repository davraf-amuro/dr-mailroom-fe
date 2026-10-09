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

router.afterEach((to) => {
  document.title = `${to.meta.title} · ${APP_NAME}`
})

export default router
