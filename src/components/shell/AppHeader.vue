<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Moon, Sun } from '@lucide/vue'

import ServiceStatusBanner from '@/components/status/ServiceStatusBanner.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const { isDark } = storeToRefs(ui)
</script>

<template>
  <header class="bg-bg">
    <!-- Barra LCARS a segmenti: su desktop prosegue il gomito della colonna di navigazione -->
    <div class="flex h-(--lcars-bar) gap-(--lcars-gap) pr-3 md:pr-4" aria-hidden="true">
      <div class="flex-1 rounded-l-full bg-lcars-orange md:rounded-none" />
      <div class="w-20 bg-lcars-lilac" />
      <div class="w-10 bg-lcars-periwinkle" />
      <div class="w-8 rounded-r-full bg-lcars-red" />
    </div>
    <div class="flex items-center gap-4 px-4 py-3 md:px-8">
      <div class="shrink-0">
        <slot name="brand" />
      </div>
      <div class="min-w-0 flex-1">
        <ServiceStatusBanner />
      </div>
      <button
        type="button"
        class="inline-flex h-11 w-16 shrink-0 items-center justify-center rounded-full bg-lcars-lilac text-on-lcars hover:brightness-110"
        :aria-pressed="isDark"
        aria-label="Tema scuro"
        :title="isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'"
        @click="ui.toggleTheme()"
      >
        <Sun v-if="isDark" :size="20" :stroke-width="1.75" aria-hidden="true" />
        <Moon v-else :size="20" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>
