<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { CircleCheck, CircleDashed, KeyRound, RefreshCw, TriangleAlert, WifiOff } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import HazardStripe from '@/components/shared/HazardStripe.vue'
import LiveRegion from '@/components/shared/LiveRegion.vue'
import { getRuntimeConfig } from '@/services/api/runtimeConfig'
import { useStatusStore } from '@/stores/status'
import { formatTime } from '@/utils/formatDate'

const status = useStatusStore()
const { health, lastError, lastCheckedUtc, retrying, keyRejected } = storeToRefs(status)

const apiBaseUrl = getRuntimeConfig().apiBaseUrl

onMounted(() => status.start())

// Assertive solo per il database giù (specifica, "Accessibilità"); il resto è polite.
const assertiveMessage = computed(() =>
  health.value === 'databaseDown'
    ? `Database non raggiungibile. ${lastError.value ?? ''}`.trim()
    : '',
)
const politeMessage = computed(() => {
  if (health.value === 'unreachable') return 'Servizio dr-mailroom non raggiungibile.'
  if (keyRejected.value) return 'Chiave API mancante o non valida: controlla config.json.'
  return ''
})
</script>

<template>
  <div data-testid="service-status">
    <LiveRegion :message="assertiveMessage" politeness="assertive" />
    <LiveRegion :message="politeMessage" />

    <section
      v-if="health === 'databaseDown'"
      class="border border-alert bg-surface"
      aria-labelledby="service-status-title"
    >
      <HazardStripe />
      <div class="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <TriangleAlert :size="24" :stroke-width="1.75" class="text-alert" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <p class="stencil text-xs text-ink-muted">Comunicazioni interrotte</p>
          <h2 id="service-status-title" class="text-lg text-alert">Database non raggiungibile</h2>
          <p v-if="lastError" class="text-sm break-words text-ink-muted">{{ lastError }}</p>
        </div>
        <BaseButton variant="secondary" :busy="retrying" @click="status.retry()">
          <template #icon>
            <RefreshCw :size="20" :stroke-width="1.75" aria-hidden="true" />
          </template>
          Riprova connessione
        </BaseButton>
      </div>
    </section>

    <section
      v-else-if="health === 'unreachable'"
      class="flex flex-wrap items-center gap-3 border border-alert bg-surface px-4 py-3"
      aria-labelledby="service-status-title"
    >
      <WifiOff :size="24" :stroke-width="1.75" class="text-alert" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p class="stencil text-xs text-ink-muted">Comunicazioni interrotte</p>
        <h2 id="service-status-title" class="text-lg text-alert">Servizio non raggiungibile</h2>
        <p class="text-sm text-ink-muted">
          Nessuna risposta da <span class="font-mono">{{ apiBaseUrl }}</span
          >. Nuovo tentativo ogni minuto.
        </p>
      </div>
    </section>

    <p v-else class="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
      <CircleCheck
        v-if="health === 'ready'"
        :size="16"
        :stroke-width="1.75"
        class="text-ok"
        aria-hidden="true"
      />
      <CircleDashed v-else :size="16" :stroke-width="1.75" aria-hidden="true" />
      <span class="stencil text-xs">Comunicazioni</span>
      <span v-if="health === 'ready'">
        attive<span v-if="lastCheckedUtc" class="hidden sm:inline">
          · database verificato alle
          <span class="font-mono tabular">{{ formatTime(lastCheckedUtc) }}</span>
        </span>
      </span>
      <span v-else>in verifica…</span>
    </p>

    <p
      v-if="keyRejected"
      class="mt-2 flex items-center gap-2 border border-alert bg-surface px-4 py-2 text-sm text-alert"
    >
      <KeyRound :size="16" :stroke-width="1.75" aria-hidden="true" />
      <span>
        Chiave API mancante o non valida: controlla <span class="font-mono">config.json</span>.
      </span>
    </p>
  </div>
</template>
