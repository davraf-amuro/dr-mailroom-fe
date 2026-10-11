---
applyTo: "README.md"
---

# Struttura README — dr-mailroom-fe

Questo file definisce la struttura obbligatoria del `README.md` di questo repository (`dr-mailroom-fe`, SPA Vue 3 del servizio dr-mailroom).
Il README è la porta d'ingresso: dice cos'è il frontend e rimanda a `docs/` per tutto il resto. Non duplica il contenuto dei documenti.
Quando crei o aggiorni il README, rispetta esattamente questa struttura. Non aggiungere sezioni non previste. Non rimuovere sezioni esistenti.

---

## Struttura obbligatoria

Il README deve contenere queste sezioni, in questo ordine:

| # | Sezione | Scopo |
|---|---------|-------|
| 1 | Titolo + panoramica | Nome del frontend e cosa fa, in poche righe concrete |
| 2 | Documentazione | Tabella di tutti i file `.md` in `docs/` con descrizione |
| 3 | Quick Links | Solo se già presente: link rapidi |
| 4 | Footer | `*Documento aggiornato: Mese Anno — Revisione vN — YYYY-MM-DD — modello*` |

---

## Regole per sezione

### 1 — Titolo + panoramica
- H1 con il nome del repository: `# dr-mailroom-fe`
- Un paragrafo su cosa fa il frontend, più una lista breve delle viste
- Cita il backend `dr-mailroom` (API REST), la specifica funzionale e la direzione visiva (`design.md`), con link
- Niente istruzioni di avvio, configurazione o container: stanno in `docs/`

### 2 — Documentazione
- Titolo: `## Documentazione`
- Tabella con colonne: `File | Contenuto`
- Una riga per ogni file `.md` in `docs/` che esiste davvero
- Escludi `docs/*-wiki.md`: non sono committati
- Link markdown cliccabile: `[docs/nome.md](docs/nome.md)`
- Contenuto: una riga che dica cosa si trova nel file, non un riassunto

### 3 — Quick Links
- Mantienila invariata se il README la contiene già
- Se non c'è, non crearla

### 4 — Footer
- Formato esatto: `*Documento aggiornato: Mese Anno — Revisione vN — YYYY-MM-DD — modello-llm*`
- Preceduto da una riga `---`
- Incrementa la revisione di 0.1 per modifiche normali, di 1.0 per ristrutturazioni (stessa logica di `doc-versioning.instructions.md`)

---

## Quando aggiornare il README

| Evento | Cosa aggiornare |
|--------|-----------------|
| Nuovo file in `docs/`, o file rimosso | Sezione "Documentazione" |
| Cambiano lo scopo del frontend o le viste | Sezione "Titolo + panoramica" |
| Qualsiasi modifica | Footer |

*Template v1.0 - dr-mailroom-fe - Last Update 2026-10-11 21:50 — claude-opus-5-5 — adattato dal template dr-guidelines v2.2 sul modello di dr-mailroom, perché quello installato descriveva il README del repository dr-guidelines*
