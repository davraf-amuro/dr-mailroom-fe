<script setup lang="ts">
import { useId } from 'vue'

import { mailboxStatusOptions } from '@/composables/mailboxes/mailboxPresentation'
import type { MailboxStatus } from '@/services/mailboxesService'

const emailAddress = defineModel<string>('emailAddress', { required: true })
const status = defineModel<MailboxStatus | ''>('status', { required: true })

const emailId = useId()
const statusId = useId()
</script>

<template>
  <form
    role="search"
    aria-label="Cerca caselle"
    class="flex flex-wrap items-end gap-4"
    @submit.prevent
  >
    <div class="min-w-56 flex-1">
      <label :for="emailId" class="block text-sm font-semibold">Indirizzo</label>
      <input
        :id="emailId"
        v-model="emailAddress"
        type="search"
        autocomplete="off"
        placeholder="nome@gmail.com"
        class="mt-1 min-h-11 w-full rounded-full border border-control-border bg-surface px-4"
      />
    </div>
    <div class="min-w-44">
      <label :for="statusId" class="block text-sm font-semibold">Stato</label>
      <select
        :id="statusId"
        v-model="status"
        class="mt-1 min-h-11 w-full rounded-full border border-control-border bg-surface px-4"
      >
        <option value="">Tutti gli stati</option>
        <option v-for="option in mailboxStatusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
  </form>
</template>
