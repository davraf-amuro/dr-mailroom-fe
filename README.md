# dr-mailroom-fe

Frontend di [dr-mailroom](https://github.com/davraf-amuro/dr-mailroom), il servizio che legge caselle Gmail in sola lettura. È una SPA Vue 3 + Vite + TypeScript che parla solo con l'API REST del backend (`/api/v1`), autenticata con una chiave API letta a runtime da `config.json`. In produzione gira in un container nginx.

Le viste:

- **Caselle**: collegamento a Gmail, avanzamento del primo giro, pausa e ripresa, rimozione
- **Filtri**: costruttore di regole su mittente e oggetto, anteprima sulle mail già lette, riapplica allo storico
- **Esecuzioni**: «Esegui ora», giri in corso con avanzamento e annullamento, cronologia
- **Statistiche**: mittenti più attivi, panoramica paginata per mittente e griglia delle mail di un mittente
- **Banner di stato**: database o servizio non raggiungibili, chiave API rifiutata

Cosa deve fare il frontend è descritto nella [specifica](https://github.com/davraf-amuro/dr-mailroom/blob/main/docs/frontend-specifiche.md) del backend. La direzione visiva, i token e il lessico sono in [design.md](https://github.com/davraf-amuro/dr-mailroom/blob/main/.ai/plans/2026-10-08-dr-mailroom-fe/design.md).

## Documentazione

| File | Contenuto |
|---|---|
| [docs/sviluppo.md](docs/sviluppo.md) | Avvio in locale, profili VS Code, `config.json`, `gen:api`, test e controlli di qualità |
| [docs/container.md](docs/container.md) | Immagine nginx, pubblicazione dietro `nginx-proxy`, CORS e rischio della chiave API in una SPA |

---
*Documento aggiornato: Ottobre 2026 — Revisione v1.0 — 2026-10-11 — claude-opus-5-5*
