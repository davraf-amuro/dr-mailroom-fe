<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import BasePanel from '@/components/shared/BasePanel.vue'

const props = defineProps<{
  counts: { active: number; tokenRevoked: number; paused: number; deleted: number }
  connecting?: boolean
}>()

const emit = defineEmits<{ connect: [] }>()

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

// Frase di sintesi (design.md, cella eroe): "3 unità operative · 1 da ricollegare".
const parts = computed(() => {
  const { active, tokenRevoked, paused, deleted } = props.counts
  const result = [plural(active, 'unità operativa', 'unità operative')]
  if (tokenRevoked > 0) result.push(`${tokenRevoked} da ricollegare`)
  if (paused > 0) result.push(`${paused} in pausa`)
  if (deleted > 0) result.push(plural(deleted, 'eliminata', 'eliminate'))
  return result
})
</script>

<template>
  <BasePanel as="section" hero aria-labelledby="mailboxes-hero-title" class="hero-cell">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="stencil text-sm text-ink-muted">Stato dell'hangar</p>
        <h2 id="mailboxes-hero-title" class="font-condensed mt-1 text-2xl md:text-3xl">
          <template v-for="(part, index) in parts" :key="part">
            <span v-if="index > 0" class="text-ink-muted" aria-hidden="true"> · </span>
            <span :class="index === 0 ? 'text-federal' : undefined">{{ part }}</span>
          </template>
        </h2>
        <p class="mt-2 max-w-prose text-sm text-ink-muted">
          dr-mailroom legge le caselle in <strong>sola lettura</strong>: sposta mail nel cestino
          solo quando lo chiedi tu, con «Elimina tutte».
        </p>
      </div>
      <BaseButton :busy="connecting" @click="emit('connect')">
        <template #icon><Plus :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        Collega casella Gmail
      </BaseButton>
    </div>
  </BasePanel>
</template>

<style scoped>
/* Crocini negli angoli della cella eroe (design.md, "Elementi grafici originali"). */
.hero-cell :deep(.panel-body) {
  background-image:
    linear-gradient(var(--c-panel-line), var(--c-panel-line)),
    linear-gradient(var(--c-panel-line), var(--c-panel-line)),
    linear-gradient(var(--c-panel-line), var(--c-panel-line)),
    linear-gradient(var(--c-panel-line), var(--c-panel-line));
  background-size:
    14px 1px,
    1px 14px,
    14px 1px,
    1px 14px;
  background-position:
    right 18px top 24px,
    right 24px top 18px,
    left 18px bottom 24px,
    left 24px bottom 18px;
  background-repeat: no-repeat;
}
</style>
