# Piano: commit della ricarica automatica del router e pubblicazione su Docker
Data: 2026-10-13
Stato: COMPLETATO

## Obiettivo
Committare il `router.onError` (ricarica una volta la pagina quando il modulo dinamico non si scarica) e ricostruire il container `dr-mailroom-fe` su `http://mailroom.spectre.local`.

## Contesto
La build Docker usa la cartella di lavoro: entra anche il tooltip della classifica (piano `2026-10-13-tooltip-ultima-mail`, COMPLETATO ma non committato). Si committa prima, separato, così l'immagine corrisponde a commit esistenti.

## Scope
### File da committare
- [x] `src/composables/stats/topSendersOption.ts` + `src/composables/stats/__tests__/topSendersOption.spec.ts` — commit 1: tooltip con data dell'ultima mail
- [x] `src/router/index.ts` — commit 2: ricarica su modulo dinamico non scaricabile

### Perimetro negativo
- Non toccherò: `git push` (non richiesto), piani scartati `gundam`/`kitt`, `public/config.json`, backend, compose e proxy

## Fasi
### Fase 1: commit tooltip
- **Stato**: [x]
### Fase 2: commit router
- **Stato**: [x]
### Fase 3: pubblicazione Docker
- **Stato**: [x]
- **Azione**: `docker compose up -d --build`
### Fase 4: verifica
- **Stato**: [x]
- **Verifica passo**: container `Up`; `http://mailroom.spectre.local/` 200; clic su "Filtri" apre `/filters`; asset vecchio bloccato → una ricarica e pagina aperta

## Criteri di verifica finale
- [x] Due commit su `feat/cestino-mittente`, albero pulito salvo `.ai/`
- [x] Container ricreato con la nuova immagine
- [x] Filtri si apre su `mailroom.spectre.local`
