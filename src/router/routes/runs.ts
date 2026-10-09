import type { RouteRecordRaw } from 'vue-router'

export const RUNS_ROUTE_NAME = 'runs'

export const runsRoutes: RouteRecordRaw[] = [
  {
    path: '/runs',
    name: RUNS_ROUTE_NAME,
    component: () => import('@/views/RunsView.vue'),
    meta: { title: 'Esecuzioni', overline: 'Diario di bordo' },
  },
]
