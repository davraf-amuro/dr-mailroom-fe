<script setup lang="ts">
import { type Component } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ChartColumn, Funnel, Rocket, Warehouse } from '@lucide/vue'

import { FILTERS_ROUTE_NAME } from '@/router/routes/filters'
import { MAILBOXES_ROUTE_NAME } from '@/router/routes/mailboxes'
import { RUNS_ROUTE_NAME } from '@/router/routes/runs'
import { STATS_ROUTE_NAME } from '@/router/routes/stats'

interface NavItem {
  name: string
  icon: Component
}

const items: NavItem[] = [
  { name: MAILBOXES_ROUTE_NAME, icon: Warehouse },
  { name: FILTERS_ROUTE_NAME, icon: Funnel },
  { name: RUNS_ROUTE_NAME, icon: Rocket },
  { name: STATS_ROUTE_NAME, icon: ChartColumn },
]

const router = useRouter()

// Etichette dalla meta della route: un solo punto in cui cambiarle.
const links = items.map((item) => {
  const { meta } = router.resolve({ name: item.name })
  return { ...item, label: meta.navLabel ?? meta.title }
})
</script>

<template>
  <nav
    aria-label="Navigazione principale"
    class="fixed inset-x-0 bottom-0 z-30 border-t border-control-border bg-surface md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-t-0"
  >
    <div class="hidden px-5 py-6 md:block">
      <slot name="brand" />
    </div>
    <ul class="grid grid-cols-4 md:flex md:flex-col md:gap-1 md:px-3">
      <li v-for="link in links" :key="link.name">
        <RouterLink
          :to="{ name: link.name }"
          class="nav-link flex min-h-14 flex-col items-center justify-center gap-1 px-2 text-xs font-semibold text-ink-muted md:min-h-11 md:flex-row md:justify-start md:gap-3 md:px-3 md:text-base"
        >
          <component :is="link.icon" :size="20" :stroke-width="1.75" aria-hidden="true" />
          <span>{{ link.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.nav-link:hover {
  color: var(--c-ink);
}

/* Voce attiva: colore, fondo e barra, non il solo colore. */
.nav-link[aria-current='page'] {
  color: var(--c-federal);
  background: var(--c-bg);
  box-shadow: inset 0 3px 0 var(--c-federal);
}

@media (min-width: 48rem) {
  .nav-link[aria-current='page'] {
    box-shadow: inset 3px 0 0 var(--c-federal);
  }
}
</style>
