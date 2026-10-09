import type { RouteRecordRaw } from 'vue-router'

export const MAILBOXES_ROUTE_NAME = 'mailboxes'

export const mailboxesRoutes: RouteRecordRaw[] = [
  {
    path: '/mailboxes',
    name: MAILBOXES_ROUTE_NAME,
    component: () => import('@/views/MailboxesView.vue'),
    meta: { title: 'Caselle collegate', navLabel: 'Caselle', overline: 'Hangar' },
  },
]
