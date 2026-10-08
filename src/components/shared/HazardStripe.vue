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
  <div class="hazard-stripe" :style="{ height: `${height}px` }" aria-hidden="true" />
</template>

<style scoped>
.hazard-stripe {
  width: 100%;
  background: repeating-linear-gradient(
    -45deg,
    var(--c-caution) 0 10px,
    var(--c-on-caution) 10px 20px
  );
}
</style>
