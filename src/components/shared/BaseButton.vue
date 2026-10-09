<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger-ghost'
    type?: 'button' | 'submit' | 'reset'
    /** Chiamata in corso: il pulsante resta visibile, annunciato come occupato e non cliccabile. */
    busy?: boolean
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button', busy: false, disabled: false },
)

const variantClass = computed(
  () =>
    ({
      primary: 'bg-federal text-on-federal border-federal',
      secondary: 'bg-surface text-federal border-control-border',
      danger: 'bg-alert text-on-alert border-alert',
      ghost: 'bg-transparent text-federal border-transparent',
      'danger-ghost': 'bg-transparent text-alert border-transparent',
    })[props.variant],
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || busy"
    :aria-busy="busy ? 'true' : undefined"
    class="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border px-4 font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
    :class="variantClass"
  >
    <LoaderCircle
      v-if="busy"
      :size="20"
      :stroke-width="1.75"
      class="animate-spin"
      aria-hidden="true"
    />
    <slot name="icon" v-else />
    <slot />
  </button>
</template>
