# Piano: Revisione dei placeholder dei campi
Data: 2026-10-10
Stato: COMPLETATO

## Obiettivo
Placeholder che descrivono cosa inserire senza ingannare: sottocartella allegati relativa alla root
del server, ricerche a corrispondenza parziale, esempio dell'oggetto coerente col tipo di condizione.

## Analisi (stato attuale)

| Campo | File | Attuale | Problema |
|-------|------|---------|----------|
| Cartella allegati | `FilterBuilder.vue:293` | `fatture/fornitore` | Sembra un percorso completo; la root (`Attachments:RootPath`, montata su host) non è visibile |
| Testo oggetto | `FilterBuilder.vue:245` | `fattura` | Uguale per Inizia con / Contiene / Regex |
| Nome filtro | `FilterBuilder.vue:124` | `Fatture dei fornitori` | Ok, manca solo "es." |
| Mittente (builder) | `FilterBuilder.vue:151` | `fatture@fornitore.it` | Ok (match esatto), manca "es." |
| Ricerca nome | `FilterSearch.vue:33` | `Fatture` | Backend `Contains`: va detto che basta una parte |
| Ricerca mittente | `FilterSearch.vue:44` | `fatture@fornitore.it` | Backend `Contains`: l'indirizzo intero suggerisce match esatto |
| Ricerca casella | `MailboxSearch.vue:28` | `nome@gmail.com` | Idem |
| Ricerca mittente stats | `StatsToolbar.vue:70` | `fatture@fornitore.it` | Idem |

## Scope
### File da modificare
- [x] `src/components/filters/FilterBuilder.vue` — placeholder + testo d'aiuto sotto la sottocartella (collegato con `aria-describedby`); etichetta classica "Sottocartella degli allegati"; placeholder dell'oggetto dinamico
- [x] `src/composables/filters/filterPresentation.ts` — mappa `subjectValuePlaceholders` per tipo di condizione (niente letterali sparsi)
- [x] `src/components/filters/FilterSearch.vue` — placeholder ricerca parziale
- [x] `src/components/mailboxes/MailboxSearch.vue` — placeholder ricerca parziale
- [x] `src/components/stats/StatsToolbar.vue` — placeholder ricerca parziale

### Nuovi testi

| Campo | Nuovo placeholder |
|-------|-------------------|
| Nome filtro | `es. Fatture dei fornitori` |
| Mittente (builder) | `es. fatture@fornitore.it` |
| Oggetto, Inizia con | `es. Fattura n.` |
| Oggetto, Contiene | `es. fattura` |
| Oggetto, Regex | `es. ^Fattura \d+` |
| Sottocartella | `es. fornitore` |
| Aiuto sottocartella | "Sottocartella dentro la cartella allegati del server (es. fornitore o fatture/2026). Niente lettera di unità né «..»." |
| Ricerca nome | `Parte del nome, es. fatture` |
| Ricerca mittente (filtri, stats) | `Parte dell'indirizzo, es. fornitore` |
| Ricerca casella | `Parte dell'indirizzo, es. gmail` |

### Perimetro negativo
- Non toccherò: backend, validatori, endpoint (niente esposizione della root dal server), test, stili, altri componenti

## Fasi

### Fase 1: Mappa placeholder oggetto
- **Stato**: [x]
- **File**: `src/composables/filters/filterPresentation.ts`
- **Azione**: export `subjectValuePlaceholders: Record<keyof typeof SubjectMatchTypeValue, string>`
- **Verifica passo**: type-check

### Fase 2: FilterBuilder
- **Stato**: [x]
- **File**: `src/components/filters/FilterBuilder.vue`
- **Azione**: nuovi placeholder; aiuto sottocartella con id `subfolderHint` in `describedBy`; etichetta classica
- **Verifica passo**: rilettura; type-check

### Fase 3: Campi di ricerca
- **Stato**: [x]
- **File**: `FilterSearch.vue`, `MailboxSearch.vue`, `StatsToolbar.vue`
- **Azione**: sostituzione placeholder
- **Verifica passo**: rilettura

### Fase 4: Verifica finale
- **Stato**: [x]
- **Azione**: `npm run type-check`, `npm run lint`, `npm run test:unit -- --run`

## Criteri di verifica
- [x] Nessun placeholder con indirizzo completo nei campi di ricerca
- [x] Sottocartella con testo d'aiuto visibile in entrambe le modalità e letto dagli screen reader
- [x] Placeholder dell'oggetto cambia col tipo di condizione
- [x] type-check, lint e test verdi
