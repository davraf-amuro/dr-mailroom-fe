<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { LayoutList, MessageSquareQuote, Save, SearchCheck, X } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import FieldError from '@/components/shared/FieldError.vue'
import { FILTER_LIMITS, FilterField, type FilterFormState } from '@/composables/filters/filterForm'
import {
  subjectChoiceOptions,
  subjectValuePlaceholders,
} from '@/composables/filters/filterPresentation'
import type { BuilderMode } from '@/composables/filters/useFilterBuilder'
import type { FieldErrors } from '@/services/api/problem'
import type { MailboxSummaryDto } from '@/services/mailboxesService'

const props = defineProps<{
  errors: FieldErrors
  mailboxes: MailboxSummaryDto[]
  /** Nome del filtro che si sta modificando; null = nuovo filtro. */
  editingName: string | null
  saving: boolean
  previewBusy: boolean
  /** Cambia quando serve portare il focus (errore da correggere o modifica avviata). */
  focusToken: number
}>()

const form = defineModel<FilterFormState>('form', { required: true })
const mode = defineModel<BuilderMode>('mode', { required: true })

const emit = defineEmits<{ submit: []; preview: []; cancel: [] }>()

const uid = useId()
const ids = {
  name: `${uid}-name`,
  sender: `${uid}-sender`,
  mailbox: `${uid}-mailbox`,
  subjectType: `${uid}-subject-type`,
  subjectTypeHint: `${uid}-subject-type-hint`,
  subjectValue: `${uid}-subject-value`,
  extract: `${uid}-extract`,
  subfolder: `${uid}-subfolder`,
  subfolderHint: `${uid}-subfolder-hint`,
  alert: `${uid}-alert`,
  archive: `${uid}-archive`,
  enabled: `${uid}-enabled`,
  processes: `${uid}-processes`,
}

const subjectValuePlaceholder = computed(() =>
  form.value.subjectMatchType === '' ? '' : subjectValuePlaceholders[form.value.subjectMatchType],
)

const formElement = ref<HTMLFormElement | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)

function messagesOf(key: string): string[] {
  return props.errors[key] ?? []
}

function invalid(key: string): 'true' | undefined {
  return messagesOf(key).length > 0 ? 'true' : undefined
}

/** Id degli elementi che descrivono il controllo: aiuto e/o errore del campo. */
function describedBy(key: string, errorId: string, hintId?: string): string | undefined {
  const parts = [hintId, messagesOf(key).length > 0 ? errorId : undefined].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : undefined
}

watch(
  () => props.focusToken,
  async () => {
    await nextTick()
    const firstInvalid = formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')
    ;(firstInvalid ?? nameInput.value)?.focus()
  },
)

const controlClass =
  'mt-1 min-h-11 w-full rounded-full border border-control-border bg-surface px-4 aria-[invalid=true]:border-alert'
</script>

<template>
  <form
    ref="formElement"
    novalidate
    class="builder"
    :class="mode === 'phrase' ? 'builder--phrase' : 'builder--classic'"
    :aria-label="editingName ? `Modifica del filtro ${editingName}` : 'Nuovo filtro'"
    @submit.prevent="emit('submit')"
  >
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <p class="stencil text-sm text-ink-muted">
          {{ editingName ? 'Modifica del filtro' : 'Nuovo filtro' }}
        </p>
        <h2 class="font-condensed text-2xl md:text-3xl [overflow-wrap:anywhere]">
          {{ editingName ?? 'Costruisci una regola' }}
        </h2>
      </div>
      <div class="flex gap-1" role="group" aria-label="Modalità del costruttore">
        <button
          type="button"
          class="mode-toggle"
          :aria-pressed="mode === 'phrase'"
          @click="mode = 'phrase'"
        >
          <MessageSquareQuote :size="20" :stroke-width="1.75" aria-hidden="true" />
          A frase
        </button>
        <button
          type="button"
          class="mode-toggle"
          :aria-pressed="mode === 'classic'"
          @click="mode = 'classic'"
        >
          <LayoutList :size="20" :stroke-width="1.75" aria-hidden="true" />
          Form classico
        </button>
      </div>
    </div>

    <div class="mt-4 space-y-4">
      <div>
        <label :for="ids.name" class="block text-sm font-semibold">Nome del filtro</label>
        <input
          :id="ids.name"
          ref="nameInput"
          v-model="form.name"
          type="text"
          autocomplete="off"
          :maxlength="FILTER_LIMITS.nameMax"
          placeholder="es. Fatture dei fornitori"
          :class="controlClass"
          :aria-invalid="invalid(FilterField.name)"
          :aria-describedby="describedBy(FilterField.name, `${ids.name}-error`)"
        />
        <FieldError :id="`${ids.name}-error`" :messages="messagesOf(FilterField.name)" />
      </div>

      <div class="builder-fields">
        <div class="field">
          <span v-if="mode === 'phrase'" class="lead stencil" aria-hidden="true">
            Quando arriva una mail da
          </span>
          <div class="control">
            <label
              :for="ids.sender"
              :class="mode === 'phrase' ? 'visually-hidden' : 'block text-sm font-semibold'"
            >
              Mittente
            </label>
            <input
              :id="ids.sender"
              v-model="form.senderAddress"
              type="email"
              inputmode="email"
              autocomplete="off"
              :maxlength="FILTER_LIMITS.senderMax"
              placeholder="es. fatture@fornitore.it"
              :class="controlClass"
              :aria-invalid="invalid(FilterField.senderAddress)"
              :aria-describedby="describedBy(FilterField.senderAddress, `${ids.sender}-error`)"
            />
            <FieldError
              :id="`${ids.sender}-error`"
              :messages="messagesOf(FilterField.senderAddress)"
            />
          </div>
        </div>

        <div class="field">
          <span v-if="mode === 'phrase'" class="lead stencil" aria-hidden="true">su</span>
          <div class="control">
            <label
              :for="ids.mailbox"
              :class="mode === 'phrase' ? 'visually-hidden' : 'block text-sm font-semibold'"
            >
              Casella
            </label>
            <select
              :id="ids.mailbox"
              v-model="form.mailboxId"
              :class="controlClass"
              :aria-invalid="invalid(FilterField.mailboxId)"
              :aria-describedby="describedBy(FilterField.mailboxId, `${ids.mailbox}-error`)"
            >
              <option value="">Tutte le caselle</option>
              <option
                v-for="mailbox in mailboxes"
                :key="String(mailbox.id)"
                :value="String(mailbox.id)"
              >
                {{ mailbox.emailAddress }}
              </option>
            </select>
            <FieldError
              :id="`${ids.mailbox}-error`"
              :messages="messagesOf(FilterField.mailboxId)"
            />
          </div>
        </div>

        <div class="field">
          <span v-if="mode === 'phrase'" class="lead stencil" aria-hidden="true">
            e l'oggetto
          </span>
          <div class="control">
            <label
              :for="ids.subjectType"
              :class="mode === 'phrase' ? 'visually-hidden' : 'block text-sm font-semibold'"
            >
              Condizione sull'oggetto
            </label>
            <select
              :id="ids.subjectType"
              v-model="form.subjectMatchType"
              :class="controlClass"
              :aria-invalid="invalid(FilterField.subjectMatchType)"
              :aria-describedby="
                describedBy(
                  FilterField.subjectMatchType,
                  `${ids.subjectType}-error`,
                  ids.subjectTypeHint,
                )
              "
            >
              <option
                v-for="option in subjectChoiceOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <FieldError
              :id="`${ids.subjectType}-error`"
              :messages="messagesOf(FilterField.subjectMatchType)"
            />
          </div>
          <div v-if="form.subjectMatchType !== ''" class="control">
            <label
              :for="ids.subjectValue"
              :class="mode === 'phrase' ? 'visually-hidden' : 'block text-sm font-semibold'"
            >
              Testo da cercare nell'oggetto
            </label>
            <input
              :id="ids.subjectValue"
              v-model="form.subjectValue"
              type="text"
              autocomplete="off"
              :maxlength="FILTER_LIMITS.subjectValueMax"
              :placeholder="subjectValuePlaceholder"
              :class="controlClass"
              :aria-invalid="invalid(FilterField.subjectValue)"
              :aria-describedby="describedBy(FilterField.subjectValue, `${ids.subjectValue}-error`)"
            />
            <FieldError
              :id="`${ids.subjectValue}-error`"
              :messages="messagesOf(FilterField.subjectValue)"
            />
          </div>
        </div>
        <p :id="ids.subjectTypeHint" class="hint text-sm text-ink-muted">
          Un filtro ha al più una condizione sull'oggetto. Per più condizioni crea più filtri con lo
          stesso mittente.
        </p>

        <fieldset
          class="field processes"
          :aria-describedby="describedBy(FilterField.processes, `${ids.processes}-error`)"
        >
          <legend v-if="mode === 'phrase'" class="lead stencil float-left mr-3">allora</legend>
          <legend v-else class="mb-1 block text-sm font-semibold">Cosa fare</legend>
          <div class="control">
            <label class="check" :for="ids.extract">
              <input
                :id="ids.extract"
                v-model="form.extractAttachments"
                type="checkbox"
                :aria-invalid="invalid(FilterField.processes)"
              />
              Estrai allegati
            </label>
          </div>
          <div class="control">
            <label class="check" :for="ids.alert">
              <input :id="ids.alert" v-model="form.createAlert" type="checkbox" />
              Crea un'allerta
            </label>
          </div>
          <div class="control">
            <label class="check" :for="ids.archive">
              <input :id="ids.archive" v-model="form.archiveContent" type="checkbox" />
              Salva il contenuto della mail
            </label>
          </div>
          <div v-if="form.extractAttachments || form.archiveContent" class="control">
            <label
              :for="ids.subfolder"
              :class="mode === 'phrase' ? 'visually-hidden' : 'block text-sm font-semibold'"
            >
              Sottocartella
            </label>
            <div class="flex items-center gap-2">
              <span v-if="mode === 'phrase'" class="lead stencil" aria-hidden="true">in</span>
              <input
                :id="ids.subfolder"
                v-model="form.attachmentSubfolder"
                type="text"
                autocomplete="off"
                :maxlength="FILTER_LIMITS.subfolderMax"
                placeholder="es. fornitore"
                :class="controlClass"
                :aria-invalid="invalid(FilterField.attachmentSubfolder)"
                :aria-describedby="
                  describedBy(
                    FilterField.attachmentSubfolder,
                    `${ids.subfolder}-error`,
                    ids.subfolderHint,
                  )
                "
              />
            </div>
            <p :id="ids.subfolderHint" class="mt-1 text-sm text-ink-muted">
              Sottocartella dentro la cartella allegati del server (es. fornitore o fatture/2026),
              dove finiscono allegati e contenuto. Obbligatoria per gli allegati, facoltativa per il
              solo contenuto. Niente lettera di unità né «..».
            </p>
            <FieldError
              :id="`${ids.subfolder}-error`"
              :messages="messagesOf(FilterField.attachmentSubfolder)"
            />
          </div>
          <FieldError
            :id="`${ids.processes}-error`"
            :messages="messagesOf(FilterField.processes)"
          />
        </fieldset>

        <div class="field">
          <label class="check" :for="ids.enabled">
            <input :id="ids.enabled" v-model="form.isEnabled" type="checkbox" />
            Filtro attivo
          </label>
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-3">
      <BaseButton type="submit" :busy="saving" :disabled="previewBusy">
        <template #icon><Save :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        {{ editingName ? 'Salva modifiche' : 'Crea filtro' }}
      </BaseButton>
      <BaseButton
        variant="secondary"
        :busy="previewBusy"
        :disabled="saving"
        @click="emit('preview')"
      >
        <template #icon
          ><SearchCheck :size="20" :stroke-width="1.75" aria-hidden="true"
        /></template>
        Prova sulle mail già lette
      </BaseButton>
      <BaseButton v-if="editingName" variant="ghost" :disabled="saving" @click="emit('cancel')">
        <template #icon><X :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        Annulla modifica
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.mode-toggle {
  display: inline-flex;
  min-height: var(--hit-target-min);
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--c-control-border);
  background: var(--c-surface);
  padding-inline: 0.875rem;
  font-weight: 600;
  color: var(--c-ink-muted);
}

.mode-toggle[aria-pressed='true'] {
  border-color: var(--c-federal);
  background: var(--c-federal);
  color: var(--c-on-federal);
}

.check {
  display: inline-flex;
  min-height: var(--hit-target-min);
  align-items: center;
  gap: 0.625rem;
  font-weight: 600;
}

.check input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--c-federal);
}

.lead {
  font-size: 0.875rem;
  color: var(--c-ink-muted);
  white-space: nowrap;
}

.processes {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

/* Modalità a frase: i controlli stanno in riga, preceduti dalla parola di raccordo. */
.builder--phrase .builder-fields {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.builder--phrase .field {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.5rem 0.75rem;
}

.builder--phrase .field > .lead {
  padding-top: 0.75rem;
}

.builder--phrase .control {
  min-width: min(100%, 14rem);
  flex: 1 1 14rem;
}

.builder--phrase .processes .control {
  flex: 0 1 auto;
}

.builder--phrase .processes .control:has(input[type='text']) {
  flex: 1 1 14rem;
}

/* Form classico: una colonna di campi con etichetta visibile. */
.builder--classic .builder-fields {
  display: grid;
  gap: 1.25rem;
}

@media (min-width: 48rem) {
  .builder--classic .builder-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .builder--classic .processes,
  .builder--classic .hint {
    grid-column: 1 / -1;
  }
}

.builder--classic .field {
  display: grid;
  gap: 1rem;
}

.hint {
  margin-top: -0.75rem;
}
</style>
