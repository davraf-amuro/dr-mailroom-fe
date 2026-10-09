<script setup lang="ts">
defineProps<{
  title: string
  /** Sopratitolo stencil (la metafora): mai al posto del titolo. */
  overline?: string
  description?: string
}>()
</script>

<template>
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div class="min-w-0">
      <p v-if="overline" class="stencil text-sm text-ink-muted">{{ overline }}</p>
      <h1 class="text-3xl md:text-4xl">{{ title }}</h1>
      <p v-if="description" class="mt-2 max-w-prose text-ink-muted">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>
