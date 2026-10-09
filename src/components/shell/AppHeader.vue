<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Moon, Sun } from '@lucide/vue'

import ServiceStatusBanner from '@/components/status/ServiceStatusBanner.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const { isDark } = storeToRefs(ui)
</script>

<template>
  <header class="border-b border-panel-line bg-surface">
    <div class="flex items-center gap-4 px-4 py-3 md:px-8">
      <div class="md:hidden">
        <slot name="brand" />
      </div>
      <div class="min-w-0 flex-1">
        <ServiceStatusBanner />
      </div>
      <button
        type="button"
        class="inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-control-border text-ink"
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
