import { describe, expect, it } from 'vitest'

import {
  buildFilterRequest,
  buildPreviewRequest,
  emptyFilterForm,
  FILTER_LIMITS,
  FilterErrorMessages,
  formFromFilter,
  isRelativeSubfolder,
  isValidSenderAddress,
  readSenderPrefill,
  splitServerErrors,
  validateFilterForm,
  validatePreviewForm,
  type FilterFormState,
} from '../filterForm'

function validForm(overrides: Partial<FilterFormState> = {}): FilterFormState {
  return {
    ...emptyFilterForm(),
    name: 'Fatture',
    senderAddress: 'fatture@fornitore.it',
    attachmentSubfolder: 'fatture',
    ...overrides,
  }
}

describe('buildFilterRequest (campi condizionali)', () => {
  it('senza condizione sull’oggetto tipo e valore sono null, anche se il testo è rimasto', () => {
    const body = buildFilterRequest(validForm({ subjectMatchType: '', subjectValue: 'avanzo' }))
    expect(body.subjectMatchType).toBeNull()
    expect(body.subjectValue).toBeNull()
  })

  it('con una condizione invia tipo e valore ripuliti', () => {
    const body = buildFilterRequest(
      validForm({ subjectMatchType: 'Contains', subjectValue: '  fattura ' }),
    )
    expect(body.subjectMatchType).toBe('Contains')
    expect(body.subjectValue).toBe('fattura')
  })

  it('la sottocartella viaggia solo con l’estrazione degli allegati', () => {
    const withExtraction = buildFilterRequest(validForm({ attachmentSubfolder: ' fatture/2026 ' }))
    expect(withExtraction.processes).toEqual(['AttachmentExtraction'])
    expect(withExtraction.attachmentSubfolder).toBe('fatture/2026')

    const alertOnly = buildFilterRequest(
      validForm({ extractAttachments: false, createAlert: true, attachmentSubfolder: 'fatture' }),
    )
    expect(alertOnly.processes).toEqual(['Alert'])
    expect(alertOnly.attachmentSubfolder).toBeNull()
  })

  it('invia entrambi i processi, "Tutte le caselle" come null e isEnabled', () => {
    const body = buildFilterRequest(validForm({ createAlert: true, isEnabled: false }))
    expect(body.processes).toEqual(['AttachmentExtraction', 'Alert'])
    expect(body.mailboxId).toBeNull()
    expect(body.isEnabled).toBe(false)
  })

  it('una casella scelta diventa numero', () => {
    expect(buildFilterRequest(validForm({ mailboxId: '3' })).mailboxId).toBe(3)
    expect(buildPreviewRequest(validForm({ mailboxId: '3' })).mailboxId).toBe(3)
  })

  it('l’anteprima non porta nome, processi né sottocartella', () => {
    expect(
      buildPreviewRequest(validForm({ subjectMatchType: 'StartsWith', subjectValue: 'Re:' })),
    ).toEqual({
      senderAddress: 'fatture@fornitore.it',
      mailboxId: null,
      subjectMatchType: 'StartsWith',
      subjectValue: 'Re:',
    })
  })

  it('formFromFilter e buildFilterRequest sono simmetrici', () => {
    const form = validForm({
      mailboxId: '2',
      subjectMatchType: 'Regex',
      subjectValue: '^Fattura \\d+',
      createAlert: true,
    })
    const body = buildFilterRequest(form)
    const back = formFromFilter({
      id: 1,
      mailboxId: body.mailboxId as number,
      name: body.name as string,
      senderAddress: body.senderAddress as string,
      subjectMatchType: 'Regex',
      subjectValue: body.subjectValue,
      attachmentSubfolder: body.attachmentSubfolder,
      isEnabled: true,
      processes: ['AttachmentExtraction', 'Alert'],
    })
    expect(back).toEqual(form)
  })
})

describe('validateFilterForm (regole D15)', () => {
  it('un form valido non ha errori', () => {
    expect(validateFilterForm(validForm())).toEqual({})
  })

  it('nome obbligatorio e massimo 100 caratteri', () => {
    expect(validateFilterForm(validForm({ name: '  ' })).name).toEqual([
      FilterErrorMessages.nameRequired,
    ])
    expect(
      validateFilterForm(validForm({ name: 'a'.repeat(FILTER_LIMITS.nameMax + 1) })).name,
    ).toEqual([FilterErrorMessages.nameTooLong])
  })

  it.each([
    ['', FilterErrorMessages.senderRequired],
    ['non-una-email', FilterErrorMessages.senderInvalid],
    ['a@b.it, c@d.it', FilterErrorMessages.senderInvalid],
    ['a@b.it; c@d.it', FilterErrorMessages.senderInvalid],
    ['Nome <a@b.it>', FilterErrorMessages.senderInvalid],
  ])('mittente %j → errore', (senderAddress, message) => {
    expect(validateFilterForm(validForm({ senderAddress })).senderAddress).toEqual([message])
  })

  it('mittente: massimo 320 caratteri', () => {
    const tooLong = `${'a'.repeat(FILTER_LIMITS.senderMax)}@x.it`
    expect(validateFilterForm(validForm({ senderAddress: tooLong })).senderAddress).toEqual([
      FilterErrorMessages.senderTooLong,
    ])
  })

  it('tipo e valore dell’oggetto vanno insieme', () => {
    expect(
      validateFilterForm(validForm({ subjectMatchType: 'Contains', subjectValue: ' ' }))
        .subjectValue,
    ).toEqual([FilterErrorMessages.subjectValueMissing])
    expect(
      validateFilterForm(validForm({ subjectMatchType: '', subjectValue: 'fattura' }))
        .subjectMatchType,
    ).toEqual([FilterErrorMessages.subjectTypeMissing])
  })

  it('valore dell’oggetto: massimo 500 caratteri', () => {
    const form = validForm({
      subjectMatchType: 'Contains',
      subjectValue: 'x'.repeat(FILTER_LIMITS.subjectValueMax + 1),
    })
    expect(validateFilterForm(form).subjectValue).toEqual([FilterErrorMessages.subjectValueTooLong])
  })

  it('con Regex la sintassi la valida il server (motore .NET): nessun errore lato client', () => {
    for (const subjectValue of ['([a-z', '(?i)fattura', '(?<anno>\\d{4})', '^Fattura \\d+$']) {
      expect(validateFilterForm(validForm({ subjectMatchType: 'Regex', subjectValue }))).toEqual({})
    }
  })

  it('il solo salvataggio del contenuto basta come processo; la sottocartella è facoltativa', () => {
    const form = validForm({
      extractAttachments: false,
      archiveContent: true,
      attachmentSubfolder: '',
    })
    expect(validateFilterForm(form)).toEqual({})
    expect(buildFilterRequest(form)).toMatchObject({
      processes: ['ContentArchive'],
      attachmentSubfolder: null,
    })
  })

  it('con il salvataggio del contenuto una sottocartella indicata si controlla e viaggia', () => {
    const form = validForm({ extractAttachments: false, archiveContent: true })
    expect(buildFilterRequest(form).attachmentSubfolder).toBe('fatture')
    expect(
      validateFilterForm({ ...form, attachmentSubfolder: '../fuori' }).attachmentSubfolder,
    ).toEqual([FilterErrorMessages.subfolderInvalid])
  })

  it('formFromFilter legge il processo ContentArchive', () => {
    const form = formFromFilter({
      id: 1,
      mailboxId: null,
      name: 'Sconti',
      senderAddress: 'promo@negozio.it',
      subjectMatchType: null,
      subjectValue: null,
      attachmentSubfolder: null,
      isEnabled: true,
      processes: ['ContentArchive'],
    })
    expect(form.archiveContent).toBe(true)
    expect(form.extractAttachments).toBe(false)
  })

  it('serve almeno un processo', () => {
    const errors = validateFilterForm(validForm({ extractAttachments: false, createAlert: false }))
    expect(errors.processes).toEqual([FilterErrorMessages.processesMissing])
    expect(errors.attachmentSubfolder).toBeUndefined()
  })

  it('con l’estrazione la sottocartella è obbligatoria; senza non si controlla', () => {
    expect(validateFilterForm(validForm({ attachmentSubfolder: '' })).attachmentSubfolder).toEqual([
      FilterErrorMessages.subfolderMissing,
    ])
    expect(
      validateFilterForm(
        validForm({
          extractAttachments: false,
          createAlert: true,
          attachmentSubfolder: '../fuori',
        }),
      ),
    ).toEqual({})
  })

  it.each(['../fuori', 'a/../b', '/radice', '\\rete', 'C:\\dati', 'a<b', 'a|b', 'fatture?'])(
    'sottocartella non relativa o non valida: %j',
    (attachmentSubfolder) => {
      expect(isRelativeSubfolder(attachmentSubfolder)).toBe(false)
      expect(validateFilterForm(validForm({ attachmentSubfolder })).attachmentSubfolder).toEqual([
        FilterErrorMessages.subfolderInvalid,
      ])
    },
  )

  it.each(['fatture', 'fatture/2026', 'fornitori\\acme'])('sottocartella valida: %j', (value) => {
    expect(isRelativeSubfolder(value)).toBe(true)
  })

  it('sottocartella: massimo 200 caratteri', () => {
    const form = validForm({ attachmentSubfolder: 'a'.repeat(FILTER_LIMITS.subfolderMax + 1) })
    expect(validateFilterForm(form).attachmentSubfolder).toEqual([
      FilterErrorMessages.subfolderTooLong,
    ])
  })

  it('l’anteprima controlla solo mittente e oggetto', () => {
    const errors = validatePreviewForm(
      validForm({ name: '', senderAddress: 'x', extractAttachments: false, createAlert: false }),
    )
    expect(Object.keys(errors)).toEqual(['senderAddress'])
  })
})

describe('splitServerErrors (errori 400 con chiavi camelCase)', () => {
  it('assegna ogni messaggio al campo con la stessa chiave', () => {
    const { fields, unmatched } = splitServerErrors({
      senderAddress: ['Indirizzo non valido.'],
      subjectValue: ['Valore obbligatorio.'],
      attachmentSubfolder: ['Percorso non relativo.'],
      processes: ['Almeno un processo.'],
    })
    expect(fields).toEqual({
      senderAddress: ['Indirizzo non valido.'],
      subjectValue: ['Valore obbligatorio.'],
      attachmentSubfolder: ['Percorso non relativo.'],
      processes: ['Almeno un processo.'],
    })
    expect(unmatched).toEqual([])
  })

  it('i messaggi senza un campo corrispondente non si perdono', () => {
    const { fields, unmatched } = splitServerErrors({
      mailboxId: ['La casella non esiste.'],
      altro: ['Errore generico.'],
    })
    expect(fields).toEqual({ mailboxId: ['La casella non esiste.'] })
    expect(unmatched).toEqual(['Errore generico.'])
  })
})

describe('readSenderPrefill (?sender=)', () => {
  it('indirizzo valido → viene restituito ripulito', () => {
    expect(readSenderPrefill({ sender: ' fatture@fornitore.it ' })).toBe('fatture@fornitore.it')
  })

  it('usa il primo valore se la chiave è ripetuta', () => {
    expect(readSenderPrefill({ sender: ['a@b.it', 'c@d.it'] })).toBe('a@b.it')
  })

  it.each([undefined, '', '   ', 'non-una-email', 'a@b.it,c@d.it', '<script>@x.it'])(
    'valore non valido %j → ignorato',
    (sender) => {
      expect(readSenderPrefill(sender === undefined ? {} : { sender })).toBeNull()
    },
  )

  it('isValidSenderAddress rifiuta più indirizzi e spazi', () => {
    expect(isValidSenderAddress('a@b.it')).toBe(true)
    expect(isValidSenderAddress('a b@c.it')).toBe(false)
  })
})
