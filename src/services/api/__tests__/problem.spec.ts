import { describe, expect, it } from 'vitest'

import { interpretResponse, readFieldErrors } from '../problem'

describe('interpretResponse', () => {
  it('200 restituisce i dati', () => {
    expect(interpretResponse(200, [{ id: 1 }], 'list')).toEqual({ kind: 'ok', data: [{ id: 1 }] })
  })

  it('201 (creazione) è un successo con i dati della risorsa', () => {
    expect(interpretResponse(201, { id: 5 }, 'resource')).toEqual({ kind: 'ok', data: { id: 5 } })
  })

  it('204 è un successo senza dati', () => {
    expect(interpretResponse(204, undefined, 'resource')).toEqual({ kind: 'ok', data: undefined })
  })

  it("202 è un'operazione avviata", () => {
    expect(interpretResponse(202, { runIds: [7] }, 'resource')).toEqual({
      kind: 'accepted',
      data: { runIds: [7] },
    })
  })

  it('404 su una lista significa nessun dato, non errore', () => {
    expect(interpretResponse(404, { title: 'Not Found' }, 'list')).toEqual({ kind: 'empty' })
  })

  it('404 su una risorsa significa risorsa inesistente', () => {
    expect(interpretResponse(404, { detail: 'Casella 9 non trovata' }, 'resource')).toEqual({
      kind: 'notFound',
      detail: 'Casella 9 non trovata',
    })
  })

  it('400 riporta gli errori per campo', () => {
    const body = { title: 'Validation', errors: { senderAddress: ['Obbligatorio'] } }
    expect(interpretResponse(400, body, 'resource')).toEqual({
      kind: 'validation',
      fieldErrors: { senderAddress: ['Obbligatorio'] },
      detail: 'Validation',
    })
  })

  it('409 riporta il detail del conflitto', () => {
    expect(interpretResponse(409, { detail: 'La casella è in pausa' }, 'resource')).toEqual({
      kind: 'conflict',
      detail: 'La casella è in pausa',
    })
  })

  it('401 e 403 indicano una chiave mancante o non valida', () => {
    expect(interpretResponse(401, null, 'list')).toEqual({ kind: 'unauthorized', status: 401 })
    expect(interpretResponse(403, null, 'list')).toEqual({ kind: 'unauthorized', status: 403 })
  })

  it('503 indica il database non raggiungibile', () => {
    expect(interpretResponse(503, { detail: 'DB giù' }, 'list')).toEqual({
      kind: 'databaseUnavailable',
      detail: 'DB giù',
    })
  })

  it('altri codici diventano errore generico', () => {
    expect(interpretResponse(500, 'boom', 'list')).toEqual({
      kind: 'error',
      status: 500,
      detail: null,
    })
  })
})

describe('readFieldErrors', () => {
  it('porta le chiavi in camelCase e scarta i valori non testuali', () => {
    const body = { errors: { SenderAddress: ['a', 3], 'Processes.Items': ['b'], vuoto: [] } }
    expect(readFieldErrors(body)).toEqual({ senderAddress: ['a'], 'processes.items': ['b'] })
  })

  it('senza errors restituisce un oggetto vuoto', () => {
    expect(readFieldErrors({ title: 'x' })).toEqual({})
    expect(readFieldErrors(null)).toEqual({})
  })
})
