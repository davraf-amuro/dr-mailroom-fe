<script setup lang="ts">
import { useId } from 'vue'

import type { EnabledChoice } from '@/composables/filters/useFiltersView'
import type { MailboxSummaryDto } from '@/services/mailboxesService'

defineProps<{ mailboxes: MailboxSummaryDto[] }>()

const name = defineModel<string>('name', { required: true })
const sender = defineModel<string>('sender', { required: true })
const mailbox = defineModel<string>('mailbox', { required: true })
const enabled = defineModel<EnabledChoice>('enabled', { required: true })

const uid = useId()
const controlClass =
  'mt-1 min-h-11 w-full rounded-full border border-control-border bg-surface px-4'
</script>

<template>
  <form
    role="search"
    aria-label="Cerca filtri"
    class="flex flex-wrap items-end gap-4"
    @submit.prevent
  >
    <div class="min-w-44 flex-1">
      <label :for="`${uid}-name`" class="block text-sm font-semibold">Nome</label>
      <input
        :id="`${uid}-name`"
        v-model="name"
        type="search"
        autocomplete="off"
        placeholder="Fatture"
        :class="controlClass"
      />
    </div>
    <div class="min-w-44 flex-1">
      <label :for="`${uid}-sender`" class="block text-sm font-semibold">Mittente</label>
      <input
        :id="`${uid}-sender`"
        v-model="sender"
        type="search"
        autocomplete="off"
        placeholder="fatture@fornitore.it"
        :class="controlClass"
      />
    </div>
    <div class="min-w-44">
      <label :for="`${uid}-mailbox`" class="block text-sm font-semibold">Casella</label>
      <select :id="`${uid}-mailbox`" v-model="mailbox" :class="controlClass">
        <option value="">Tutte</option>
        <option v-for="item in mailboxes" :key="String(item.id)" :value="String(item.id)">
          {{ item.emailAddress }}
        </option>
      </select>
    </div>
    <div class="min-w-40">
      <label :for="`${uid}-enabled`" class="block text-sm font-semibold">Stato</label>
      <select :id="`${uid}-enabled`" v-model="enabled" :class="controlClass">
        <option value="">Tutti</option>
        <option value="true">Attivi</option>
        <option value="false">Disattivati</option>
      </select>
    </div>
  </form>
</template>
