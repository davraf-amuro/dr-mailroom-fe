<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Altezza della striscia in pixel. */
    height?: number
  }>(),
  { height: 8 },
)
</script>

<template>
  <!-- Puramente decorativa: il pericolo è sempre detto anche a parole accanto -->
  <div class="alert-stripe" :style="{ height: `${height}px` }" aria-hidden="true" />
</template>

<style scoped>
/* Allerta rossa LCARS: blocchi rossi separati da fessure del colore di fondo. */
.alert-stripe {
  width: 100%;
  background: repeating-linear-gradient(
    90deg,
    var(--c-alert) 0 28px,
    var(--c-bg) 28px calc(28px + var(--lcars-gap))
  );
}
</style>
