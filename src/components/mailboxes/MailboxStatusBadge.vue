<script setup lang="ts">
import { computed } from 'vue'

import BaseBadge from '@/components/shared/BaseBadge.vue'
import { mailboxStatusPresentation } from '@/composables/mailboxes/mailboxPresentation'
import type { MailboxStatus } from '@/services/mailboxesService'

const props = defineProps<{ status: MailboxStatus }>()

const presentation = computed(() => mailboxStatusPresentation[props.status])
</script>

<template>
  <BaseBadge
    :label="presentation.label"
    :tone="presentation.tone"
    :class="presentation.struck ? 'line-through' : undefined"
    :data-status="status"
  >
    <template #icon>
      <component :is="presentation.icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
    </template>
  </BaseBadge>
</template>
