import type { RouteRecordRaw } from 'vue-router'

export const STATS_ROUTE_NAME = 'stats'

export const statsRoutes: RouteRecordRaw[] = [
  {
    path: '/stats',
    name: STATS_ROUTE_NAME,
    component: () => import('@/views/StatsView.vue'),
    meta: { title: 'Statistiche', overline: 'Intelligence' },
  },
]
