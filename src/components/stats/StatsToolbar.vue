<script setup lang="ts">
import { useId } from 'vue'

import { MailboxStatusValue, type MailboxSummaryDto } from '@/services/mailboxesService'
import type { YearStatDto } from '@/services/statsService'
import { formatCount } from '@/utils/formatNumber'

defineProps<{
  mailboxes: MailboxSummaryDto[]
  years: YearStatDto[]
  mailboxId: string
  year: string
}>()

const search = defineModel<string>('search', { required: true })

const emit = defineEmits<{ mailbox: [id: string]; year: [choice: string] }>()

const uid = useId()
const controlClass =
  'mt-1 min-h-11 w-full rounded-full border border-control-border bg-surface px-4'

function valueOf(event: Event): string {
  return (event.target as HTMLSelectElement).value
}
</script>

<template>
  <form
    role="search"
    aria-label="Statistiche della casella"
    class="flex flex-wrap items-end gap-4"
    @submit.prevent
  >
    <div class="min-w-56 flex-1">
      <label :for="`${uid}-mailbox`" class="block text-sm font-semibold">Casella</label>
      <select
        :id="`${uid}-mailbox`"
        :value="mailboxId"
        :class="controlClass"
        @change="emit('mailbox', valueOf($event))"
      >
        <option v-for="item in mailboxes" :key="String(item.id)" :value="String(item.id)">
          {{ item.emailAddress
          }}{{ item.status === MailboxStatusValue.Deleted ? ' (eliminata)' : '' }}
        </option>
      </select>
    </div>
    <div class="min-w-44">
      <label :for="`${uid}-year`" class="block text-sm font-semibold">Anno</label>
      <select
        :id="`${uid}-year`"
        :value="year"
        :class="controlClass"
        @change="emit('year', valueOf($event))"
      >
        <option value="">Tutti</option>
        <option v-for="item in years" :key="String(item.year)" :value="String(item.year)">
          {{ item.year }} · {{ formatCount(Number(item.mailCount)) }} mail
        </option>
      </select>
    </div>
    <div class="min-w-56 flex-1">
      <label :for="`${uid}-search`" class="block text-sm font-semibold">Mittente</label>
      <input
        :id="`${uid}-search`"
        v-model="search"
        type="search"
        autocomplete="off"
        placeholder="Parte dell'indirizzo, es. fornitore"
        :class="controlClass"
      />
    </div>
  </form>
</template>
