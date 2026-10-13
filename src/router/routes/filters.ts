import type { RouteRecordRaw } from 'vue-router'

export const FILTERS_ROUTE_NAME = 'filters'
export const FILTER_MESSAGES_ROUTE_NAME = 'filter-messages'

export const filtersRoutes: RouteRecordRaw[] = [
  {
    path: '/filters',
    name: FILTERS_ROUTE_NAME,
    component: () => import('@/views/FiltersView.vue'),
    meta: { title: 'Filtri', overline: "Regole d'ingaggio" },
  },
  {
    // Tabella delle mail di un filtro: si apre dalla card del filtro, non compare nel menu.
    path: '/filters/:id(\\d+)/messages',
    name: FILTER_MESSAGES_ROUTE_NAME,
    component: () => import('@/views/FilterMessagesView.vue'),
    meta: { title: 'Mail del filtro', overline: "Regole d'ingaggio" },
  },
]
