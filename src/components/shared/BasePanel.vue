<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Elemento radice: section per i pannelli con titolo, div per i contenitori. */
    as?: 'section' | 'div' | 'article'
    /** Cella "eroe" della vista: bordo primario invece della panel line. */
    hero?: boolean
  }>(),
  { as: 'div', hero: false },
)
</script>

<template>
  <!-- Bordo come strato esterno ritagliato: clip-path smussa anche il bordo, non solo il fondo -->
  <component :is="as" class="panel-frame" :class="hero ? 'bg-federal' : 'bg-panel-line'">
    <div class="panel-body bg-surface p-5">
      <slot />
    </div>
  </component>
</template>

<style scoped>
.panel-frame {
  padding: 1px;
  clip-path: polygon(
    var(--panel-bevel) 0,
    100% 0,
    100% calc(100% - var(--panel-bevel)),
    calc(100% - var(--panel-bevel)) 100%,
    0 100%,
    0 var(--panel-bevel)
  );
}

.panel-body {
  height: 100%;
  clip-path: inherit;
}
</style>
