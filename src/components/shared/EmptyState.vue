<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-6 py-8 text-center">
    <slot name="illustration" />
    <h2 class="text-2xl">{{ title }}</h2>
    <p v-if="description" class="max-w-prose text-ink-muted">{{ description }}</p>
    <slot />
    <div v-if="$slots.actions" class="flex flex-wrap justify-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>
