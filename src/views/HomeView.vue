<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

// Vista provvisoria: campionario dei token, sostituita dal guscio della Fase 9.
const ui = useUiStore()
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-6 p-8">
    <p class="stencil text-sm text-ink-muted">Hangar</p>
    <h1 class="text-4xl">Caselle collegate</h1>
    <p class="font-mono tabular text-ink-muted">MR-0003 · 1.204 mail lette</p>

    <button
      type="button"
      class="min-h-11 rounded bg-federal px-4 font-semibold text-on-federal"
      @click="ui.toggleTheme()"
    >
      Tema {{ ui.isDark ? 'chiaro' : 'scuro' }}
    </button>

    <ul class="space-y-2">
      <li class="rounded border border-panel-line bg-surface p-3 text-ok">✓ Completato</li>
      <li class="rounded border border-panel-line bg-surface p-3 text-alert">✕ Errore</li>
      <li class="rounded border border-panel-line bg-surface p-3 text-neutral">⏸ In pausa</li>
      <li class="rounded bg-caution p-3 text-on-caution">⚠ Database non raggiungibile</li>
    </ul>
  </main>
</template>
