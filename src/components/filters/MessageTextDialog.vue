<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Copy } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import BaseDialog from '@/components/shared/BaseDialog.vue'
import InlineNotice from '@/components/shared/InlineNotice.vue'
import LiveRegion from '@/components/shared/LiveRegion.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import { FilterMessagesMessages } from '@/composables/filters/filterMessagesPresentation'
import { subjectText } from '@/composables/stats/statsPresentation'
import type { FilterMessageDto } from '@/services/filtersService'
import { formatDateTime } from '@/utils/formatDate'

const props = defineProps<{
  message: FilterMessageDto | null
  loading: boolean
  text: string | null
  error: string | null
  /** Copia negli appunti; sostituibile nei test. */
  copy?: (text: string) => Promise<void>
}>()

const open = defineModel<boolean>('open', { required: true })

const copyStatus = ref('')

// Oggetto e data nel titolo: il dialogo non ha bisogno di una description separata
const title = computed(() => {
  const message = props.message
  if (!message) return 'Mail'
  const subject = message.subject?.trim() ? subjectText(message.subject) : 'Mail senza oggetto'
  return `${subject} · ${formatDateTime(message.receivedAtUtc)}`
})

// Nuova mail o popup riaperto: l'esito della copia precedente non vale più
watch(
  () => props.message,
  () => {
    copyStatus.value = ''
  },
)

async function copyText(): Promise<void> {
  if (props.text === null) return
  const write = props.copy ?? ((value: string) => navigator.clipboard.writeText(value))
  try {
    await write(props.text)
    copyStatus.value = FilterMessagesMessages.copied
  } catch {
    copyStatus.value = FilterMessagesMessages.copyFailed
  }
}
</script>

<template>
  <BaseDialog v-model:open="open" :title="title">
    <ProgressMeter v-if="loading" label="Lettura del testo della mail" />
    <InlineNotice v-else-if="error" tone="warning" :text="error" @dismiss="open = false" />
    <!-- Testo della mail così com'è: a capo e spazi preservati, selezionabile per copiare il codice -->
    <pre
      v-else-if="text !== null"
      tabindex="0"
      aria-label="Testo della mail"
      class="max-h-[60vh] overflow-auto border border-panel-line bg-bg p-4 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap"
      >{{ text }}</pre>
    <LiveRegion :message="copyStatus" visible class="mt-3 text-sm text-ink-muted" />

    <template #footer>
      <BaseButton variant="secondary" @click="open = false">Chiudi</BaseButton>
      <BaseButton :disabled="text === null || loading" @click="copyText()">
        <template #icon><Copy :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        Copia testo
      </BaseButton>
    </template>
  </BaseDialog>
</template>
