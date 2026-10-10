import { reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useStorage } from '@vueuse/core'

import type { FieldErrors } from '@/services/api/problem'
import type { FilterDto, FilterId } from '@/services/filtersService'
import { useFiltersStore } from '@/stores/filters'
import {
  buildFilterRequest,
  buildPreviewRequest,
  emptyFilterForm,
  FilterField,
  formFromFilter,
  validateFilterForm,
  validatePreviewForm,
  type FilterFormState,
} from './filterForm'

export type BuilderMode = 'phrase' | 'classic'

/** Preferenza di interfaccia (non sensibile): costruttore a frase o form classico. */
export const BUILDER_MODE_STORAGE_KEY = 'dr-mailroom-filter-builder-mode'

/** Campo del form → chiave dell'errore mostrato accanto a quel controllo. */
const errorKeyOf: Record<keyof FilterFormState, string> = {
  name: FilterField.name,
  senderAddress: FilterField.senderAddress,
  mailboxId: FilterField.mailboxId,
  subjectMatchType: FilterField.subjectMatchType,
  subjectValue: FilterField.subjectValue,
  extractAttachments: FilterField.processes,
  createAlert: FilterField.processes,
  attachmentSubfolder: FilterField.attachmentSubfolder,
  isEnabled: FilterField.isEnabled,
}

/** Campi che definiscono "quali mail": se cambiano, l'anteprima mostrata non è più valida. */
const previewFields: (keyof FilterFormState)[] = [
  'senderAddress',
  'mailboxId',
  'subjectMatchType',
  'subjectValue',
]

/** Stato del costruttore di filtri: form, errori per campo, creazione/modifica, anteprima. */
export function useFilterBuilder() {
  const store = useFiltersStore()
  const { saving, preview, previewBusy } = storeToRefs(store)

  const form = reactive<FilterFormState>(emptyFilterForm())
  const errors = ref<FieldErrors>({})
  const editing = ref<FilterDto | null>(null)
  const mode = useStorage<BuilderMode>(BUILDER_MODE_STORAGE_KEY, 'phrase')
  /** Cambia a ogni richiesta di spostare il focus (errore da mostrare o modifica avviata). */
  const focusToken = ref(0)
  /** True se l'anteprima mostrata è stata richiesta almeno una volta. */
  const previewed = ref(false)

  function assign(next: FilterFormState): void {
    Object.assign(form, next)
    errors.value = {}
  }

  for (const key of Object.keys(errorKeyOf) as (keyof FilterFormState)[]) {
    watch(
      () => form[key],
      () => {
        const errorKey = errorKeyOf[key]
        if (errors.value[errorKey] !== undefined) {
          const { [errorKey]: _removed, ...rest } = errors.value
          errors.value = rest
        }
      },
    )
  }

  watch(
    () => previewFields.map((key) => form[key]),
    () => {
      store.clearPreview()
      previewed.value = false
    },
  )

  function requestFocus(): void {
    focusToken.value++
  }

  function reset(): void {
    editing.value = null
    assign(emptyFilterForm())
    store.clearPreview()
    previewed.value = false
  }

  function startEdit(filter: FilterDto): void {
    editing.value = filter
    assign(formFromFilter(filter))
    store.clearPreview()
    previewed.value = false
    requestFocus()
  }

  /** Nuovo filtro con il solo mittente (precompilazione da `?sender=`). */
  function prefillSender(address: string): void {
    reset()
    form.senderAddress = address
    requestFocus()
  }

  function showErrors(next: FieldErrors): void {
    errors.value = next
    requestFocus()
  }

  /** Valida lato client, poi salva (POST o PUT). True se il filtro è stato salvato. */
  async function submit(): Promise<boolean> {
    const clientErrors = validateFilterForm(form)
    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors)
      return false
    }
    const id: FilterId | null = editing.value?.id ?? null
    const result = await store.save(id, buildFilterRequest(form))
    if (result.kind === 'saved') {
      reset()
      return true
    }
    if (result.kind === 'invalid') showErrors(result.fields)
    return false
  }

  /** Anteprima (dry-run) sulle mail già indicizzate. */
  async function runPreview(): Promise<void> {
    const clientErrors = validatePreviewForm(form)
    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors)
      return
    }
    previewed.value = true
    const result = await store.runPreview(buildPreviewRequest(form))
    if (result.kind === 'invalid') showErrors(result.fields)
  }

  return {
    form,
    errors,
    editing,
    mode,
    focusToken,
    saving,
    preview,
    previewBusy,
    previewed,
    reset,
    startEdit,
    prefillSender,
    submit,
    runPreview,
  }
}
