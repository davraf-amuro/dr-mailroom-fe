<script setup lang="ts">
import { computed } from 'vue'
import { CircleStop } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import SerialTag from '@/components/shared/SerialTag.vue'
import { formatSerial } from '@/utils/formatSerial'
import { formatDateTime } from '@/utils/formatDate'
import { formatCount } from '@/utils/formatNumber'
import { RunStatusValue, type RunDto } from '@/services/runsService'
import RunStatusBadge from './RunStatusBadge.vue'

const props = defineProps<{
  run: RunDto
  mailbox: string
  origin: string
  cancelling?: boolean
}>()

const emit = defineEmits<{ cancel: [] }>()

const running = computed(() => props.run.status === RunStatusValue.Running)
const completed = computed(() => props.run.status === RunStatusValue.Completed)
const readText = computed(() => `${formatCount(Number(props.run.messagesRead))} mail lette`)
</script>

<template>
  <article
    class="relative flex flex-col gap-3 overflow-hidden border border-panel-line bg-surface p-4"
    :class="completed ? 'pb-12' : undefined"
    :aria-labelledby="`run-${run.id}-title`"
  >
    <header class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <SerialTag :code="formatSerial(run.id, 'GR')" :label="`Giro ${run.id}`" />
        <h3 :id="`run-${run.id}-title`" class="mt-1 truncate text-lg normal-case">
          {{ mailbox }}
        </h3>
        <p class="text-sm text-ink-muted">
          {{ origin }} · dal
          <time :datetime="run.startedAtUtc">{{ formatDateTime(run.startedAtUtc) }}</time>
        </p>
      </div>
      <RunStatusBadge :status="run.status" />
    </header>

    <ProgressMeter v-if="running" label="Avanzamento" :value-text="readText" />
    <p v-else class="font-mono tabular text-sm">
      {{ readText }} · {{ formatCount(Number(run.messagesProcessed)) }} lavorate
    </p>

    <p v-if="!running && run.errorSummary" class="text-sm text-ink-muted">
      {{ run.errorSummary }}
    </p>

    <div v-if="running" class="flex justify-end">
      <BaseButton variant="danger-ghost" :busy="cancelling" @click="emit('cancel')">
        <template #icon><CircleStop :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        Annulla
      </BaseButton>
    </div>

    <!-- Timbro (design.md, "Motion"): decorativo, lo stato è già nel badge -->
    <span v-if="completed" class="mission-stamp stencil" aria-hidden="true">
      Missione completata
    </span>
  </article>
</template>

<style scoped>
.mission-stamp {
  position: absolute;
  right: 1rem;
  bottom: 0.75rem;
  border: 3px double var(--c-ok);
  padding: 0.125rem 0.625rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--c-ok);
  transform: rotate(-6deg);
  animation: stamp-in 400ms cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
  pointer-events: none;
}

@keyframes stamp-in {
  from {
    opacity: 0;
    transform: rotate(-6deg) scale(1.8);
  }
  to {
    opacity: 1;
    transform: rotate(-6deg) scale(1);
  }
}
</style>
