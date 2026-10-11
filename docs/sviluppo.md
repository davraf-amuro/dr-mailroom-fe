# Sviluppo in locale di dr-mailroom-fe

Come avviare il frontend sul proprio PC, collegarlo all'API, rigenerare il client e far girare test e controlli.

---

## Prerequisiti

| Strumento | Versione | Nota |
|---|---|---|
| Node.js | ≥ 22.12 (il container usa la 24) | richiesto da Vitest 5 |
| npm | 11 | con l'npm 10.7 globale `npm install` fallisce (`Cannot read properties of null (reading 'edgesOut')`): usare `npx -y npm@11 install` |
| Backend `dr-mailroom` | API su `http://localhost:5180` | serve per l'uso reale e per `gen:api`, non per i test |
| Chromium di Playwright | — | solo per i test end-to-end: `npx playwright install chromium` |

---

## Come avviare il frontend

1. Installa le dipendenze: `npm install` (vedi la nota su npm sopra).
2. Crea `public/config.json` copiando `public/config.example.json` e inserisci la chiave API (vedi sotto).
3. Avvia l'API del backend su `http://localhost:5180`.
4. Avvia Vite: `npm run dev`.
5. Apri `http://localhost:5173`.

La porta 5173 è fissa in `vite.config.ts`. L'API in ambiente Development ammette proprio questa origine nel CORS (`Mailroom:Frontend:BaseUrl`, default `http://localhost:5173`).

### Avvio da VS Code

| Profilo | Dove | Cosa fa |
|---|---|---|
| «Vue Dev Server» | `.vscode/launch.json` | esegue `npm run dev` in un terminale |
| «Chrome — localhost:5173» | `.vscode/launch.json` | apre Chrome sul dev server, con i breakpoint di VS Code su `src/` |
| «API + FE» | `dr-mailroom.code-workspace` (cartella superiore, fuori da git) | avvia insieme il debug dell'API (`Debug dr-mailroom-api (http)`) e «Vue Dev Server» |

> ⚠️ «API + FE» avvia l'API sulla porta 5180, la stessa del container `dr-mailroom-api`. Ferma prima il container (`docker stop dr-mailroom-api`) e riavvialo a fine sessione (`docker start dr-mailroom-api`).

---

## Configurazione runtime: `public/config.json`

Il frontend legge `config.json` all'avvio, prima di montare l'app. La stessa build funziona così con indirizzi e chiavi diversi, senza essere ricompilata.

| Campo | Esempio | Significato |
|---|---|---|
| `apiBaseUrl` | `http://localhost:5180` | indirizzo dell'API, senza `/api/v1` |
| `apiKey` | — | chiave API del backend, inviata nell'header `x-api-key` |

- `public/config.json` è escluso da git: il repository è pubblico, la chiave non deve mai finirci.
- Se il file manca o è malformato, l'app mostra l'errore invece di partire.
- Una risposta 401 dell'API mostra un avviso che rimanda a `config.json`.

Per il rischio legato alla chiave in una SPA vedi [container.md](container.md#la-chiave-api-arriva-al-browser).

---

## Client API generato

I tipi delle chiamate all'API sono generati dal documento OpenAPI del backend:

```sh
npm run gen:api
```

Il comando legge `http://localhost:5180/openapi/v1.json` e riscrive `src/services/api/schema.d.ts`. Va rilanciato ogni volta che il backend cambia un endpoint o un DTO, con l'API in esecuzione. Il file generato è escluso da Prettier.

---

## Test

| Comando | Cosa verifica | Serve il backend? |
|---|---|---|
| `npm run test:unit` | test Vitest di componenti, composable, store e servizi (`src/**/__tests__/`) | no |
| `npm run test:e2e` | 4 smoke test Playwright su Chromium (`e2e/smoke.spec.ts`) | no |

Gli end-to-end avviano da soli il dev server e simulano l'API con `page.route` (`e2e/support/mockApi.ts`): nessuna chiamata esce dal browser. Gli scenari:

- hangar vuoto senza caselle;
- errore 400 del server sul salvataggio di un filtro, mostrato sul campo;
- «Esegui ora» seguito dal polling del giro fino a «Completato»;
- banner «Database non raggiungibile», con movimento ridotto attivo.

---

## Controlli di qualità

Da eseguire prima di ogni push. Tutti devono terminare con exit code 0.

| Comando | Controllo |
|---|---|
| `npm run lint:check` | oxlint + ESLint, senza correzioni automatiche |
| `npm run format:check` | Prettier su `src/` |
| `npm run type-check` | `vue-tsc --build` |
| `npm run test:unit -- --run` | test unitari, una sola esecuzione |
| `npm run build` | type-check + build di produzione Vite |

`npm run lint` e `npm run format` applicano invece le correzioni.

---

*Revisione v1.0 — 2026-10-11 21:55 — claude-opus-5-5*
