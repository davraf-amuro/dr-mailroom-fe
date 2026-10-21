<script setup lang="ts">
import { computed, useId } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, RefreshCw, Trash2 } from '@lucide/vue'

import SenderMessagesTable from '@/components/stats/SenderMessagesTable.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import InlineNotice from '@/components/shared/InlineNotice.vue'
import LiveRegion from '@/components/shared/LiveRegion.vue'
import PageHeading from '@/components/shared/PageHeading.vue'
import PaginationNav from '@/components/shared/PaginationNav.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import { useOAuthReturn } from '@/composables/mailboxes/useOAuthReturn'
import {
  TrashMessages,
  readTrashOAuthReturn,
  trashConfirmDescription,
} from '@/composables/stats/trashPresentation'
import { useSenderMessages } from '@/composables/stats/useSenderMessages'
import { useTrashSender } from '@/composables/stats/useTrashSender'
import { STATS_ROUTE_NAME } from '@/router/routes/stats'
import { formatCount } from '@/utils/formatNumber'

const route = useRoute()
const uid = useId()

const {
  state,
  rows,
  totalCount,
  withoutAttachmentsCount,
  loadState,
  searchText,
  mailboxAddress,
  linkComplete,
  pages,
  filtered,
  notice,
  showNotice,
  clearNotice,
  reload,
  setPage,
  toggleSort,
} = useSenderMessages()

const firstLoad = computed(() => loadState.value === 'loading' && rows.value.length === 0)
const countText = computed(() => {
  const count = formatCount(totalCount.value)
  return totalCount.value === 1 ? '1 mail' : `${count} mail`
})
const liveMessage = computed(() =>
  loadState.value === 'ready' || loadState.value === 'empty' ? `${countText.value} trovate` : '',
)

// "Elimina tutte": casella e mittente della vista; l'avviso dice quante mail andranno nel cestino.
const trashTarget = computed(() => ({
  mailboxId: state.value.mailboxId,
  senderAddress: state.value.senderAddress,
}))
const trash = useTrashSender(trashTarget, { onNotice: (n) => showNotice(n.tone, n.text) })
const {
  confirmOpen: trashConfirmOpen,
  authorizeOpen: trashAuthorizeOpen,
  phase: trashPhase,
  untilDate: trashUntilDate,
  untilCount: trashUntilCount,
  untilLabel: trashUntilLabel,
  withoutAttachments: trashWithoutAttachments,
} = trash
const trashTitle = computed(() =>
  trashWithoutAttachments.value
    ? TrashMessages.confirmTitleWithoutAttachments
    : TrashMessages.confirmTitle,
)
const trashDescription = computed(() =>
  trashConfirmDescription(
    state.value.senderAddress,
    trashUntilLabel.value,
    trashUntilCount.value,
    trashWithoutAttachments.value,
  ),
)
// Il pulsante serve solo con mail da cestinare in elenco (senza ricerca: "tutte" vale per tutto il mittente).
const canTrash = computed(
  () => loadState.value === 'ready' && totalCount.value > 0 && !trash.busy.value,
)
// "Elimina senza 📎" serve solo se c'è almeno una mail senza allegati (conteggio ignoto: resta attivo).
const canTrashWithoutAttachments = computed(
  () => canTrash.value && withoutAttachmentsCount.value !== 0,
)
const withoutAttachmentsText = computed(() =>
  withoutAttachmentsCount.value === null ? '' : formatCount(withoutAttachmentsCount.value),
)

// Ritorno dal consenso Google del cestino: esito nell'avviso, query string ripulita.
useOAuthReturn((n) => showNotice(n.tone, n.text), readTrashOAuthReturn)
</script>

<template>
  <PageHeading :title="route.meta.title" :overline="route.meta.overline">
    <template #actions>
      <RouterLink
        :to="{ name: STATS_ROUTE_NAME }"
        class="inline-flex min-h-11 items-center gap-2 rounded-full border border-control-border px-4 font-semibold"
      >
        <ArrowLeft :size="20" :stroke-width="1.75" aria-hidden="true" />
        Torna alle statistiche
      </RouterLink>
    </template>
  </PageHeading>

  <InlineNotice
    class="mb-4"
    :tone="notice?.tone ?? null"
    :text="notice?.text ?? null"
    @dismiss="clearNotice()"
  />
  <LiveRegion :message="liveMessage" />

  <EmptyState
    v-if="!linkComplete"
    title="Mittente non indicato"
    description="Apri la griglia dalle statistiche: seleziona una barra del grafico o «Mail» nella tabella dei mittenti."
  />

  <section v-else aria-labelledby="sender-messages-title" class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <p class="stencil text-sm text-ink-muted">Mittente</p>
        <h2 id="sender-messages-title" class="font-condensed mt-1 text-2xl break-words">
          {{ state.senderAddress }}
        </h2>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <p v-if="loadState === 'ready'" class="font-mono tabular text-sm text-ink-muted">
          {{ countText }}{{ filtered ? ' con questo oggetto' : '' }}
        </p>
        <BaseButton variant="danger-ghost" :disabled="!canTrash" @click="trash.request()">
          <template #icon><Trash2 :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
          {{ TrashMessages.button }}
        </BaseButton>
        <p
          v-if="loadState === 'ready' && withoutAttachmentsText"
          class="font-mono tabular text-sm text-ink-muted"
        >
          <span aria-hidden="true">{{ withoutAttachmentsText }} senza 📎</span>
          <span class="visually-hidden">{{ withoutAttachmentsText }} senza allegati</span>
        </p>
        <BaseButton
          variant="danger-ghost"
          :disabled="!canTrashWithoutAttachments"
          @click="trash.request('withoutAttachments')"
        >
          <template #icon><Trash2 :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
          <span aria-hidden="true">{{ TrashMessages.buttonWithoutAttachments }}</span>
          <span class="visually-hidden">{{ TrashMessages.buttonWithoutAttachmentsLabel }}</span>
        </BaseButton>
      </div>
    </div>

    <form role="search" aria-label="Mail del mittente" class="max-w-xl" @submit.prevent>
      <label :for="`${uid}-search`" class="block text-sm font-semibold">Oggetto</label>
      <input
        :id="`${uid}-search`"
        v-model="searchText"
        type="search"
        autocomplete="off"
        placeholder="Parte dell'oggetto, es. promozione"
        class="mt-1 min-h-11 w-full rounded-full border border-control-border bg-surface px-4"
      />
    </form>

    <ProgressMeter v-if="firstLoad" label="Lettura delle mail" class="max-w-md" />

    <EmptyState
      v-else-if="loadState === 'error' && rows.length === 0"
      title="Mail non disponibili"
      description="Il servizio non ha restituito i dati: controlla il banner in alto."
    >
      <template #actions>
        <BaseButton variant="secondary" @click="reload()">
          <template #icon
            ><RefreshCw :size="20" :stroke-width="1.75" aria-hidden="true"
          /></template>
          Riprova
        </BaseButton>
      </template>
    </EmptyState>

    <EmptyState
      v-else-if="loadState === 'empty' && filtered"
      title="Nessuna mail con questo oggetto"
      description="Cambia o cancella il testo cercato."
    />
    <EmptyState
      v-else-if="loadState === 'empty'"
      title="Nessuna mail da questo mittente"
      description="In questa casella non risultano mail lette da questo indirizzo."
    />

    <template v-else>
      <div class="border border-panel-line bg-surface">
        <SenderMessagesTable
          :rows="rows"
          :sender-address="state.senderAddress"
          :mailbox-address="mailboxAddress"
          :sort-dir="state.sortDir"
          :busy="loadState === 'loading'"
          @toggle-sort="toggleSort"
        />
      </div>
      <PaginationNav
        v-if="pages > 1"
        :page="state.page"
        :pages="pages"
        label="Pagine delle mail del mittente"
        :busy="loadState === 'loading'"
        @change="setPage"
      />
    </template>
  </section>

  <ConfirmDialog
    v-model:open="trashConfirmOpen"
    tone="danger"
    :title="trashTitle"
    :description="trashDescription"
    :confirm-label="TrashMessages.confirmLabel"
    :busy="trashPhase === 'checking' || trashPhase === 'starting'"
    @confirm="trash.confirm()"
  >
    <div>
      <label :for="`${uid}-trash-until`" class="block text-sm font-semibold">
        {{ TrashMessages.untilLabel }}
      </label>
      <input
        :id="`${uid}-trash-until`"
        v-model="trashUntilDate"
        type="date"
        :aria-describedby="`${uid}-trash-until-hint`"
        class="mt-1 min-h-11 rounded-full border border-control-border bg-surface px-4"
      />
      <p :id="`${uid}-trash-until-hint`" class="mt-1 text-sm text-ink-muted">
        {{ TrashMessages.untilHint }}
      </p>
    </div>
  </ConfirmDialog>
  <ConfirmDialog
    v-model:open="trashAuthorizeOpen"
    :title="TrashMessages.authorizeTitle"
    :description="TrashMessages.authorizeDescription"
    :confirm-label="TrashMessages.authorizeLabel"
    :busy="trashPhase === 'checking'"
    @confirm="trash.authorize()"
  />
</template>
