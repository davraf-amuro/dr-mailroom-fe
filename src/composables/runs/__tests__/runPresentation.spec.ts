import { describe, expect, it } from 'vitest'

import {
  isFinalStatus,
  localDayStartUtc,
  parseIdList,
  requestedProcessesText,
  runOriginText,
  runStatusPresentation,
} from '../runPresentation'

describe('parseIdList (?runIds=&skippedMailboxIds=)', () => {
  it('legge interi positivi separati da virgola, senza duplicati', () => {
    expect(parseIdList({ runIds: '4, 5,4' }, 'runIds')).toEqual(['4', '5'])
  })

  it('usa il primo valore se la chiave è ripetuta', () => {
    expect(parseIdList({ runIds: ['7', '8'] }, 'runIds')).toEqual(['7'])
  })

  it.each([undefined, '', '0', '-3', 'abc', '1e3', '<b>'])('valore %j → nessun id', (value) => {
    expect(parseIdList(value === undefined ? {} : { runIds: value }, 'runIds')).toEqual([])
  })

  it('scarta solo le parti non valide', () => {
    expect(parseIdList({ runIds: '3,x,9' }, 'runIds')).toEqual(['3', '9'])
  })
})

describe('origine del giro', () => {
  const names = new Map([['4', 'Fatture']])

  it('schedulato e manuale: solo l’etichetta', () => {
    expect(
      runOriginText({ trigger: 'Scheduled', filterId: null, requestedProcesses: null }, names),
    ).toBe('Schedulato')
  })

  it('riapplica: filtro e processi richiesti', () => {
    expect(
      runOriginText(
        { trigger: 'Reapply', filterId: 4, requestedProcesses: 'AttachmentExtraction,Alert' },
        names,
      ),
    ).toBe('Riapplica · Fatture · Allegati, Allerta')
  })

  it('riapplica con filtro non più esistente: la sua matricola', () => {
    expect(
      runOriginText({ trigger: 'Reapply', filterId: 9, requestedProcesses: null }, names),
    ).toBe('Riapplica · Filtro 9')
  })

  it('cestino di un mittente: etichetta e indirizzo', () => {
    expect(
      runOriginText(
        {
          trigger: 'TrashSender',
          filterId: null,
          requestedProcesses: null,
          senderAddress: 'no-reply@spam.example',
        },
        names,
      ),
    ).toBe('Cestino mittente · no-reply@spam.example')
  })

  it('processo sconosciuto: il nome come arriva', () => {
    expect(requestedProcessesText('Alert, Nuovo')).toBe('Allerta, Nuovo')
  })
})

describe('stati', () => {
  it('Cancelled è grigio, con testo e icona', () => {
    expect(runStatusPresentation.Cancelled.tone).toBe('neutral')
    expect(runStatusPresentation.Cancelled.label).toBe('Annullato')
  })

  it.each(['Completed', 'Failed', 'Skipped', 'Cancelled'] as const)('%s è finale', (status) => {
    expect(isFinalStatus(status)).toBe(true)
  })

  it('Running non è finale', () => {
    expect(isFinalStatus('Running')).toBe(false)
  })
})

describe('date dei filtri', () => {
  it('giorno locale in UTC senza designatore di fuso', () => {
    const value = localDayStartUtc('2026-10-09')
    expect(value).toBe(new Date('2026-10-09T00:00:00').toISOString().slice(0, -1))
    expect(value?.endsWith('Z')).toBe(false)
  })

  it('campo vuoto → nessun filtro', () => {
    expect(localDayStartUtc('')).toBeUndefined()
  })
})
