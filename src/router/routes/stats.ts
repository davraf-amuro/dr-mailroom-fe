import type { RouteRecordRaw } from 'vue-router'

export const STATS_ROUTE_NAME = 'stats'
export const STATS_MESSAGES_ROUTE_NAME = 'stats-messages'

export const statsRoutes: RouteRecordRaw[] = [
  {
    path: '/stats',
    name: STATS_ROUTE_NAME,
    component: () => import('@/views/StatsView.vue'),
    meta: { title: 'Statistiche', overline: 'Intelligence' },
  },
  {
    // Griglia delle mail di un mittente: si apre dalle statistiche, non compare nel menu.
    path: '/stats/messages',
    name: STATS_MESSAGES_ROUTE_NAME,
    component: () => import('@/views/SenderMessagesView.vue'),
    meta: { title: 'Mail del mittente', overline: 'Intelligence' },
  },
]
