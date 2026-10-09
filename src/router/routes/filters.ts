import type { RouteRecordRaw } from 'vue-router'

export const FILTERS_ROUTE_NAME = 'filters'

export const filtersRoutes: RouteRecordRaw[] = [
  {
    path: '/filters',
    name: FILTERS_ROUTE_NAME,
    component: () => import('@/views/FiltersView.vue'),
    meta: { title: 'Filtri', overline: "Regole d'ingaggio" },
  },
]
