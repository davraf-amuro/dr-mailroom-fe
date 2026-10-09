<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Link, Pause, Play, Trash2 } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import { availableActions } from '@/composables/mailboxes/mailboxPresentation'
import type { MailboxStatus } from '@/services/mailboxesService'

const props = defineProps<{
  status: MailboxStatus
  /** Indirizzo della casella, per dare un nome accessibile univoco ai pulsanti. */
  emailAddress: string
  busy?: 'pause' | 'resume' | 'delete'
  reconnecting?: boolean
  /** In tabella: pulsanti su una riga sola. */
  compact?: boolean
}>()

const emit = defineEmits<{
  pause: []
  resume: []
  reconnect: []
  remove: []
  details: []
}>()

const actions = computed(() => availableActions(props.status))
const anyBusy = computed(() => props.busy !== undefined)
</script>

<template>
  <div class="flex gap-2" :class="compact ? 'flex-nowrap' : 'flex-wrap'">
    <BaseButton
      v-if="actions.reconnect"
      :busy="reconnecting"
      :disabled="anyBusy"
      :aria-label="`Ricollega ${emailAddress}`"
      @click="emit('reconnect')"
    >
      <template #icon><Link :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
      Ricollega
    </BaseButton>
    <BaseButton
      v-if="actions.pause"
      variant="secondary"
      :busy="busy === 'pause'"
      :disabled="anyBusy"
      :aria-label="`Pausa ${emailAddress}`"
      @click="emit('pause')"
    >
      <template #icon><Pause :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
      Pausa
    </BaseButton>
    <BaseButton
      v-if="actions.resume"
      variant="secondary"
      :busy="busy === 'resume'"
      :disabled="anyBusy"
      :aria-label="`Riprendi ${emailAddress}`"
      @click="emit('resume')"
    >
      <template #icon><Play :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
      Riprendi
    </BaseButton>
    <BaseButton
      variant="ghost"
      :aria-label="`Dettagli di ${emailAddress}`"
      @click="emit('details')"
    >
      <template #icon><Eye :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
      Dettagli
    </BaseButton>
    <BaseButton
      v-if="actions.remove"
      variant="danger-ghost"
      :busy="busy === 'delete'"
      :disabled="anyBusy"
      :aria-label="`Elimina ${emailAddress}`"
      @click="emit('remove')"
    >
      <template #icon><Trash2 :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
      Elimina
    </BaseButton>
  </div>
</template>
