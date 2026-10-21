<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, ArrowUp, ExternalLink, Paperclip } from '@lucide/vue'

import BaseBadge from '@/components/shared/BaseBadge.vue'
import { gmailMessageUrl } from '@/composables/stats/senderMessagesPresentation'
import { subjectText } from '@/composables/stats/statsPresentation'
import type { SenderMessageDto } from '@/services/messagesService'
import { SortDirectionValue, type SortDirection } from '@/services/statsService'
import { formatDateTime } from '@/utils/formatDate'
import { isSystemLabel, labelText, splitLabels } from '@/utils/gmailLabels'

const props = defineProps<{
  rows: SenderMessageDto[]
  senderAddress: string
  /** Indirizzo della casella per il link "Apri in Gmail"; null = primo account del browser. */
  mailboxAddress?: string | null
  sortDir: SortDirection
  /** Pagina in caricamento: la tabella resta visibile ma annunciata come occupata. */
  busy?: boolean
}>()

const emit = defineEmits<{ toggleSort: [] }>()

const ariaSort = computed(() =>
  props.sortDir === SortDirectionValue.Asc ? 'ascending' : 'descending',
)

const items = computed(() =>
  props.rows.map((row) => ({
    id: String(row.id),
    subject: row.subject,
    receivedAtUtc: row.receivedAtUtc,
    labels: splitLabels(row.labels).map((id) => ({
      id,
      text: labelText(id),
      system: isSystemLabel(id),
    })),
    hasAttachments: row.hasAttachments,
    gmailUrl: gmailMessageUrl(row.gmailMessageId, props.mailboxAddress ?? null),
  })),
)
</script>

<template>
  <div class="overflow-x-auto" :aria-busy="busy ? 'true' : undefined">
    <!-- Su schermi stretti la tabella scorre in orizzontale invece di schiacciare gli oggetti -->
    <table class="w-full min-w-[60rem] border-collapse text-left">
      <caption class="visually-hidden">
        Mail di
        {{
          senderAddress
        }}: oggetto, data di ricezione, label, allegati e link a Gmail
      </caption>
      <thead>
        <tr class="border-b border-control-border">
          <th scope="col" class="px-3 py-2 text-sm font-semibold text-ink-muted">Oggetto</th>
          <th
            scope="col"
            :aria-sort="ariaSort"
            class="px-3 py-2 text-sm font-semibold text-ink-muted"
          >
            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-1.5 font-semibold"
              @click="emit('toggleSort')"
            >
              Data ricevimento
              <ArrowUp
                v-if="ariaSort === 'ascending'"
                :size="16"
                :stroke-width="1.75"
                aria-hidden="true"
              />
              <ArrowDown v-else :size="16" :stroke-width="1.75" aria-hidden="true" />
            </button>
          </th>
          <th scope="col" class="px-3 py-2 text-sm font-semibold text-ink-muted">Label</th>
          <th scope="col" class="px-3 py-2 text-center text-sm font-semibold text-ink-muted">
            Allegati
          </th>
          <th scope="col" class="px-3 py-2 text-sm font-semibold text-ink-muted">
            <span class="visually-hidden">Apri in Gmail</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in items"
          :key="row.id"
          class="border-b border-panel-line align-top last:border-b-0"
        >
          <th scope="row" class="max-w-[28rem] px-3 py-2 text-left font-normal">
            <span class="block break-words" :title="row.subject ?? undefined">{{
              subjectText(row.subject)
            }}</span>
          </th>
          <td class="px-3 py-2">
            <time :datetime="row.receivedAtUtc" class="text-sm whitespace-nowrap">{{
              formatDateTime(row.receivedAtUtc)
            }}</time>
          </td>
          <td class="px-3 py-2">
            <ul v-if="row.labels.length > 0" class="flex flex-wrap gap-1" aria-label="Label">
              <li v-for="label in row.labels" :key="label.id">
                <BaseBadge
                  :label="label.text"
                  :tone="label.system ? 'neutral' : 'federal'"
                  :title="label.system ? undefined : 'Label creata in Gmail (id)'"
                />
              </li>
            </ul>
            <span v-else class="text-sm text-ink-muted">—</span>
          </td>
          <td class="px-3 py-2 text-center">
            <template v-if="row.hasAttachments">
              <Paperclip
                :size="20"
                :stroke-width="1.75"
                aria-hidden="true"
                class="inline-block text-federal"
              />
              <span class="visually-hidden">Contiene allegati</span>
            </template>
            <span v-else class="text-sm text-ink-muted">
              <span aria-hidden="true">—</span>
              <span class="visually-hidden">Nessun allegato</span>
            </span>
          </td>
          <td class="px-3 py-2 text-right">
            <a
              :href="row.gmailUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-semibold whitespace-nowrap text-federal hover:underline"
            >
              <ExternalLink :size="18" :stroke-width="1.75" aria-hidden="true" />
              Apri in Gmail
              <span class="visually-hidden">(nuova scheda): {{ subjectText(row.subject) }}</span>
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
