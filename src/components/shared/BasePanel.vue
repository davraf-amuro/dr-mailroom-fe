<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Elemento radice: section per i pannelli con titolo, div per i contenitori. */
    as?: 'section' | 'div' | 'article'
    /** Cella "eroe" della vista: staffa più spessa nel colore primario della cornice. */
    hero?: boolean
  }>(),
  { as: 'div', hero: false },
)
</script>

<template>
  <!-- Staffa LCARS: tappo sinistro arrotondato che prosegue in filetti sopra e sotto -->
  <component :is="as" class="lcars-panel bg-surface" :class="{ 'lcars-panel--hero': hero }">
    <div class="panel-body p-4">
      <slot />
    </div>
  </component>
</template>

<style scoped>
.lcars-panel {
  --panel-cap: var(--c-lcars-lilac);
  --panel-cap-width: 0.75rem;

  overflow: hidden;
  border-style: solid;
  border-color: var(--panel-cap);
  border-width: 4px 0 4px var(--panel-cap-width);
  border-radius: 1.5rem 0 0 1.5rem;
}

.lcars-panel--hero {
  --panel-cap: var(--c-lcars-orange);
  --panel-cap-width: 1.25rem;
}

.panel-body {
  height: 100%;
}
</style>
