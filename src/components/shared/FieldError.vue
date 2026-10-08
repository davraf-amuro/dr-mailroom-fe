<script setup lang="ts">
import { CircleX } from '@lucide/vue'

defineProps<{
  /** Id richiamato dall'aria-describedby del campo. */
  id: string
  messages: string[]
}>()
</script>

<template>
  <p v-if="messages.length > 0" :id="id" class="mt-1 flex items-start gap-1.5 text-sm text-alert">
    <CircleX :size="16" :stroke-width="1.75" class="mt-0.5 shrink-0" aria-hidden="true" />
    <span>{{ messages.join(' ') }}</span>
  </p>
</template>
