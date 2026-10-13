<script setup lang="ts">
import { Plus } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import BasePanel from '@/components/shared/BasePanel.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

defineProps<{ connecting?: boolean }>()

const emit = defineEmits<{ connect: [] }>()
</script>

<template>
  <BasePanel as="section" hero aria-label="Prima attivazione">
    <EmptyState title="Nessuna unità in hangar">
      <template #illustration>
        <!-- Hangar vuoto a linee, disegnato da zero (design.md, "Stato vuoto") -->
        <svg
          viewBox="0 0 240 120"
          class="h-28 w-56 text-control-border"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M10 110 V44 L120 10 L230 44 V110" />
          <path d="M40 110 V58 H200 V110" />
          <path d="M40 72 H200 M40 86 H200 M40 100 H200" stroke-dasharray="4 6" />
          <path d="M0 110 H240" />
          <path d="M112 110 L120 96 L128 110" stroke="var(--c-caution)" />
          <path d="M56 30 l8 -2.5 M176 30 l-8 -2.5" />
        </svg>
      </template>
      <p class="max-w-prose">
        Collega una casella Gmail: dr-mailroom la legge in <strong>sola lettura</strong> e non
        modifica nulla. Sposta mail nel cestino solo quando lo chiedi tu, con un permesso a parte.
      </p>
      <p class="max-w-prose text-sm text-ink-muted">
        Il primo giro legge tutto lo storico della casella e può richiedere molto tempo.
      </p>
      <template #actions>
        <BaseButton :busy="connecting" @click="emit('connect')">
          <template #icon><Plus :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
          Collega la prima casella
        </BaseButton>
      </template>
    </EmptyState>
  </BasePanel>
</template>
