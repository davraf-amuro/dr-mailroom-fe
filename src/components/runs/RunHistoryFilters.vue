<script setup lang="ts">
import { useId } from 'vue'
import { Download } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'

import { runStatusOptions, runTriggerOptions } from '@/composables/runs/runPresentation'
import type { MailboxDto } from '@/services/mailboxesService'
import type { RunStatus, RunTrigger } from '@/services/runsService'

defineProps<{
  mailboxes: MailboxDto[]
  /** Cronologia in lettura: «Carica» annunciato come occupato. */
  busy?: boolean
}>()

const emit = defineEmits<{ load: [] }>()

const mailbox = defineModel<string>('mailbox', { required: true })
const trigger = defineModel<RunTrigger | ''>('trigger', { required: true })
const status = defineModel<RunStatus | ''>('status', { required: true })
const from = defineModel<string>('from', { required: true })
const to = defineModel<string>('to', { required: true })

const uid = useId()
const controlClass =
  'mt-1 min-h-11 w-full rounded-full border border-control-border bg-surface px-4'
</script>

<template>
  <form
    role="search"
    aria-label="Filtra la cronologia"
    class="flex flex-wrap items-end gap-4"
    @submit.prevent="emit('load')"
  >
    <div class="min-w-48 flex-1">
      <label :for="`${uid}-mailbox`" class="block text-sm font-semibold">Casella</label>
      <select :id="`${uid}-mailbox`" v-model="mailbox" :class="controlClass">
        <option value="">Tutte</option>
        <option v-for="item in mailboxes" :key="String(item.id)" :value="String(item.id)">
          {{ item.emailAddress }}
        </option>
      </select>
    </div>
    <div class="min-w-40">
      <label :for="`${uid}-trigger`" class="block text-sm font-semibold">Origine</label>
      <select :id="`${uid}-trigger`" v-model="trigger" :class="controlClass">
        <option value="">Tutte</option>
        <option v-for="option in runTriggerOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <div class="min-w-40">
      <label :for="`${uid}-status`" class="block text-sm font-semibold">Stato</label>
      <select :id="`${uid}-status`" v-model="status" :class="controlClass">
        <option value="">Tutti</option>
        <option v-for="option in runStatusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <div class="min-w-40">
      <label :for="`${uid}-from`" class="block text-sm font-semibold">Avviati dal</label>
      <input
        :id="`${uid}-from`"
        v-model="from"
        type="date"
        :max="to || undefined"
        :class="controlClass"
      />
    </div>
    <div class="min-w-40">
      <label :for="`${uid}-to`" class="block text-sm font-semibold">al</label>
      <input
        :id="`${uid}-to`"
        v-model="to"
        type="date"
        :min="from || undefined"
        :class="controlClass"
      />
    </div>
    <BaseButton type="submit" variant="secondary" :busy="busy">
      <template #icon><Download :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
      Carica
    </BaseButton>
  </form>
</template>
