<script setup lang="ts">
import { computed } from 'vue'

import BaseBadge from '@/components/shared/BaseBadge.vue'
import { runStatusPresentation } from '@/composables/runs/runPresentation'
import type { RunStatus } from '@/services/runsService'

const props = defineProps<{ status: RunStatus }>()

const presentation = computed(() => runStatusPresentation[props.status])
</script>

<template>
  <BaseBadge :label="presentation.label" :tone="presentation.tone" :data-status="status">
    <template #icon>
      <component :is="presentation.icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
    </template>
  </BaseBadge>
</template>
