import { beforeEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import { validatePreviewForm } from '../filterForm'
import { useFilterBuilder } from '../useFilterBuilder'

/** Crea il costruttore dentro uno scope, come farebbe il setup di un componente. */
function createBuilder() {
  return effectScope().run(() => useFilterBuilder())!
}

describe("useFilterBuilder — condizione sull'oggetto", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('"Nessuna condizione" svuota il testo rimasto nascosto', async () => {
    const builder = createBuilder()
    builder.form.subjectMatchType = 'StartsWith'
    builder.form.subjectValue = 'Riepilogo spese'
    await nextTick()

    builder.form.subjectMatchType = ''
    await nextTick()

    expect(builder.form.subjectValue).toBe('')
  })

  it("l'anteprima con solo il mittente non segnala errori sull'oggetto", async () => {
    const builder = createBuilder()
    builder.form.senderAddress = 'no-reply@mycicero.it'
    builder.form.subjectMatchType = 'Contains'
    builder.form.subjectValue = 'fattura'
    await nextTick()
    builder.form.subjectMatchType = ''
    await nextTick()

    expect(validatePreviewForm(builder.form)).toEqual({})
  })

  it('cambiare tipo di confronto conserva il testo', async () => {
    const builder = createBuilder()
    builder.form.subjectMatchType = 'StartsWith'
    builder.form.subjectValue = 'fattura'
    await nextTick()

    builder.form.subjectMatchType = 'Contains'
    await nextTick()

    expect(builder.form.subjectValue).toBe('fattura')
  })
})
