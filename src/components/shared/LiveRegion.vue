<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Testo annunciato; la regione esiste sempre, anche vuota, così lo screen reader la conosce. */
    message: string
    politeness?: 'polite' | 'assertive'
    /** Visibile anche a schermo oppure solo per gli screen reader. */
    visible?: boolean
  }>(),
  { politeness: 'polite', visible: false },
)
</script>

<template>
  <div
    :role="politeness === 'assertive' ? 'alert' : 'status'"
    :aria-live="politeness"
    aria-atomic="true"
    :class="visible ? undefined : 'visually-hidden'"
  >
    {{ message }}
  </div>
</template>
