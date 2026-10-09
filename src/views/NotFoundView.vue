<script setup lang="ts">
import { RouterLink } from 'vue-router'

import EmptyState from '@/components/shared/EmptyState.vue'
import { MAILBOXES_ROUTE_NAME } from '@/router/routes/mailboxes'
</script>

<template>
  <EmptyState
    title="Pagina non trovata"
    description="L'indirizzo non corrisponde a nessuna vista di dr-mailroom."
  >
    <template #actions>
      <RouterLink
        :to="{ name: MAILBOXES_ROUTE_NAME }"
        class="inline-flex min-h-11 items-center rounded-sm border border-federal bg-federal px-4 font-semibold text-on-federal"
      >
        Torna alle caselle
      </RouterLink>
    </template>
  </EmptyState>
</template>
