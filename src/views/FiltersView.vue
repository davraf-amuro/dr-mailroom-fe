<script setup lang="ts">
import { useRoute } from 'vue-router'

import EmptyState from '@/components/shared/EmptyState.vue'
import PageHeading from '@/components/shared/PageHeading.vue'

// Vista provvisoria: il contenuto arriva con la Fase 11 del piano.
const route = useRoute()
</script>

<template>
  <PageHeading :title="route.meta.title" :overline="route.meta.overline" />
  <EmptyState title="Vista in preparazione" />
</template>
