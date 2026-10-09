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
  /** Colore del blocco LCARS: classe Tailwind del fondo. */
  tone: string
}

const items: NavItem[] = [
  { name: MAILBOXES_ROUTE_NAME, icon: Warehouse, tone: 'bg-lcars-periwinkle' },
  { name: FILTERS_ROUTE_NAME, icon: Funnel, tone: 'bg-lcars-peach' },
  { name: RUNS_ROUTE_NAME, icon: Rocket, tone: 'bg-lcars-lilac' },
  { name: STATS_ROUTE_NAME, icon: ChartColumn, tone: 'bg-lcars-red' },
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
    class="fixed inset-x-0 bottom-0 z-30 bg-bg p-1 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-(--lcars-gap) md:p-0 md:pl-3"
  >
    <!-- Gomito LCARS: si salda alla barra superiore della testata -->
    <div class="lcars-elbow hidden md:flex" aria-hidden="true">
      <span class="stencil font-mono text-xs text-on-lcars">LCARS 1701-D</span>
    </div>
    <ul class="grid grid-cols-4 gap-(--lcars-gap) md:flex md:flex-col">
      <li v-for="link in links" :key="link.name">
        <RouterLink
          :to="{ name: link.name }"
          class="nav-link stencil flex min-h-14 flex-col items-center justify-center gap-1 px-2 text-xs font-semibold text-on-lcars md:min-h-14 md:flex-row md:items-end md:justify-end md:gap-3 md:px-4 md:pb-1.5 md:text-base"
          :class="link.tone"
        >
          <component :is="link.icon" :size="20" :stroke-width="1.75" aria-hidden="true" />
          <span>{{ link.label }}</span>
        </RouterLink>
      </li>
    </ul>
    <!-- Coda della colonna: chiude la cornice in basso -->
    <div class="lcars-tail hidden flex-1 md:block" aria-hidden="true" />
  </nav>
</template>

<style scoped>
.lcars-elbow {
  position: relative;
  align-items: flex-end;
  justify-content: flex-end;
  height: 6rem;
  padding: 0 1rem 0.375rem;
  background: var(--c-lcars-orange);
  border-top-left-radius: var(--lcars-elbow);
}

/* Raccordo concavo tra gomito e barra orizzontale della testata. */
.lcars-elbow::after {
  content: '';
  position: absolute;
  top: var(--lcars-bar);
  left: 100%;
  width: 1rem;
  height: 1rem;
  background: radial-gradient(
    circle at 100% 100%,
    transparent calc(1rem - 0.5px),
    var(--c-lcars-orange) 1rem
  );
}

.lcars-tail {
  background: var(--c-lcars-lilac);
  border-bottom-left-radius: var(--lcars-elbow);
}

/* Barra in basso su mobile: estremità a pillola. */
li:first-child .nav-link {
  border-radius: 9999px 0 0 9999px;
}

li:last-child .nav-link {
  border-radius: 0 9999px 9999px 0;
}

@media (min-width: 48rem) {
  li:first-child .nav-link,
  li:last-child .nav-link {
    border-radius: 0;
  }
}

.nav-link:hover {
  filter: brightness(1.12);
}

/*
 * Voce attiva: barra nera e peso maggiore, non il solo colore. La barra è staccata dal bordo
 * del blocco, così resta visibile anche sul fondo nero del tema scuro.
 */
.nav-link[aria-current='page'] {
  font-weight: 800;
  background-image: linear-gradient(
    to top,
    transparent 4px,
    var(--c-on-lcars) 4px 9px,
    transparent 9px
  );
}

@media (min-width: 48rem) {
  .nav-link[aria-current='page'] {
    background-image: linear-gradient(
      to right,
      transparent 6px,
      var(--c-on-lcars) 6px 14px,
      transparent 14px
    );
  }
}
</style>
