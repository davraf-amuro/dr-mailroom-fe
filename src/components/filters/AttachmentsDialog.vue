<script setup lang="ts">
import BaseDialog from '@/components/shared/BaseDialog.vue'
import InlineNotice from '@/components/shared/InlineNotice.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import {
  AttachmentsMessages,
  type AttachmentsState,
} from '@/composables/filters/useMessageAttachments'
import type { MessageSummaryDto } from '@/services/filtersService'
import type { AttachmentDto } from '@/services/messagesService'
import { formatDateTime } from '@/utils/formatDate'
import { formatCount } from '@/utils/formatNumber'

defineProps<{
  message: MessageSummaryDto | null
  state: AttachmentsState
  items: AttachmentDto[]
}>()

const open = defineModel<boolean>('open', { required: true })

const KILOBYTE = 1024

function formatSize(bytes: number | string): string {
  const value = Number(bytes)
  if (value < KILOBYTE) return `${formatCount(value)} B`
  if (value < KILOBYTE * KILOBYTE) return `${formatCount(value / KILOBYTE)} KB`
  return `${formatCount(value / (KILOBYTE * KILOBYTE))} MB`
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    title="Allegati salvati"
    :description="message?.subject || '(senza oggetto)'"
  >
    <ProgressMeter v-if="state === 'loading'" label="Lettura degli allegati" />
    <InlineNotice v-else-if="state === 'none'" tone="info" :text="AttachmentsMessages.none" />
    <InlineNotice v-else-if="state === 'failed'" tone="error" :text="AttachmentsMessages.failed" />
    <ul v-else class="divide-y divide-panel-line border-y border-panel-line">
      <li v-for="item in items" :key="String(item.id)" class="py-3">
        <p class="font-semibold [overflow-wrap:anywhere]">{{ item.originalFileName }}</p>
        <p class="font-mono text-sm text-ink-muted [overflow-wrap:anywhere]">
          {{ item.relativePath }}
        </p>
        <p class="text-sm text-ink-muted tabular">
          {{ formatSize(item.sizeBytes) }} ·
          <time :datetime="item.savedAtUtc">{{ formatDateTime(item.savedAtUtc) }}</time>
        </p>
      </li>
    </ul>
  </BaseDialog>
</template>
