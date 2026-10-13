# Piano: data e ora dell'ultima mail nel tooltip della classifica
Data: 2026-10-13
Stato: COMPLETATO

## Obiettivo
Al passaggio del mouse su una barra della classifica "mittenti più attivi" (/stats) il tooltip mostra indirizzo, numero di mail e data/ora dell'ultima mail ricevuta.

## Scope
### File da modificare
- [x] `src/composables/stats/topSendersOption.ts` — `tooltip.formatter` con indirizzo, conteggio e `formatDateTime(lastReceivedAtUtc)`; testo dinamico passato da `encodeHTML` di ECharts (il tooltip è HTML)
- [x] `src/composables/stats/__tests__/topSendersOption.spec.ts` — CREATE: test del formatter (data presente, escape HTML)

### Perimetro negativo
- Non toccherò: backend (il dato `lastReceivedAtUtc` è già nel DTO), `SenderOverviewTable.vue`, `TopSendersChart.vue`, `utils/formatDate.ts`, etichette sulle barre

## Fasi

### Fase 1: formatter del tooltip
- **Stato**: [x]
- **Precondizione**: `SenderOverviewDto` ha `lastReceivedAtUtc` (verificato)
- **File**: `src/composables/stats/topSendersOption.ts`
- **Operazione**: EDIT
- **Azione**: sostituire `valueFormatter` con `formatter(params)` che legge `senders[params.dataIndex]` e restituisce `indirizzo<br/>N mail<br/>Ultima: <data ora>`, con escape HTML di indirizzo
- **Tool ammessi**: nessuno
- **Verifica passo**: rilettura file; `vue-tsc --build` senza errori
- **Su divergenza**: STOP — scrivi `⚠️ Divergenza Fase 1: <cosa>`

### Fase 2: test unitario
- **Stato**: [x]
- **Precondizione**: Fase 1 completata
- **File**: `src/composables/stats/__tests__/topSendersOption.spec.ts`
- **Operazione**: CREATE
- **Azione**: test che il tooltip contenga la data formattata e che un indirizzo con `<` sia escapato
- **Tool ammessi**: nessuno
- **Verifica passo**: `npx vitest run src/composables/stats` verde
- **Su divergenza**: STOP — scrivi `⚠️ Divergenza Fase 2: <cosa>`

## Criteri di verifica finale
- [x] Tooltip mostra data e ora dell'ultima mail (ora locale, formato `formatDateTime`)
- [x] Testo dinamico escapato
- [x] `vitest run` verde, `vue-tsc --build` e `npm run lint:check` puliti
