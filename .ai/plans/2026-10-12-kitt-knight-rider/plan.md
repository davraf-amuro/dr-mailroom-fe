# Piano: Prova grafica "K.I.T.T." (Knight Rider)
Data: 2026-10-12
Stato: SCARTATO

## Obiettivo
Sul branch `feat/kitt-knight-rider` (da `main`) ridisegnare la grafica in stile cruscotto della supercar di Knight Rider: nero lucido, LED rossi, scanner rosso che oscilla, tasti rettangolari retroilluminati (rosso, ambra, verde, giallo), lettering largo corsivo maiuscolo e letture LED in mono. Solo presentazione: nessuna logica cambia.

## Concetto
- **Testata**: barra-scanner rossa a segmenti (effetto Larson) che oscilla; con `prefers-reduced-motion` resta accesa ferma al centro.
- **Colonna di navigazione**: console nera con targa "KNIGHT INDUSTRIES 2000", voci come tasti retroilluminati con LED colorato; voce attiva = tasto acceso (LED pieno + bagliore + peso maggiore + spia "ON"), non il solo colore. In fondo, decorazione "modulatore vocale" (tre colonne di barre LED). Su mobile: barra inferiore a 4 tasti.
- **Pannelli**: strumenti incassati (cornice sottile, ombra interna); "eroe" con filetto LED rosso in alto.
- **Pulsanti / badge**: tasti rettangolari (raggio piccolo), badge come spia con puntino LED.
- **Progress**: barra a segmenti LED; indeterminata = scanner.
- **Tema scuro** canonico ("notte"), tema chiaro "garage diurno" (alluminio chiaro, stessi accenti).

## Scope
### File da modificare
- [x] `src/assets/styles/tokens.css` — palette KITT scura e chiara; token decorativi `--c-lcars-*` → `--c-kitt-red|amber|green|yellow`, `--c-on-kitt`; geometria `--lcars-*` → `--kitt-bar|gap|radius`
- [x] `src/assets/styles/main.css` — esposizione token a Tailwind; titoli Saira larga corsiva (`wdth-italic`); utility `.font-condensed` → `.font-console`
- [x] `src/components/shell/ScannerBar.vue` — NUOVO: scanner rosso decorativo (`aria-hidden`)
- [x] `src/components/shell/VoiceModulator.vue` — NUOVO: modulatore vocale decorativo (`aria-hidden`)
- [x] ~~`src/App.vue` — guscio a cruscotto~~ non toccato: la griglia esistente basta
- [x] `src/components/shell/AppHeader.vue` — scanner + pulsante tema a tasto
- [x] `src/components/shell/AppSidebar.vue` — console con tasti retroilluminati
- [x] `src/components/shell/AppMark.vue` — classe `.font-console`
- [x] `src/components/shared/BasePanel.vue` — pannello strumento
- [x] `src/components/shared/BaseButton.vue` — tasto rettangolare
- [x] `src/components/shared/BaseBadge.vue` — spia con LED
- [x] `src/components/shared/HazardStripe.vue` — segmenti LED rossi
- [x] `src/components/shared/ProgressMeter.vue` — barra LED, indeterminata a scanner
- [x] Solo classi (`rounded-full` → raggio tasto, `font-condensed` → `font-console`): `FilterBuilder.vue`, `FilterSearch.vue`, `FilterPreviewPanel.vue`, `MailboxSearch.vue`, `MailboxesHero.vue`, `RunHistoryFilters.vue`, `RunLaunchPad.vue`, `StatsToolbar.vue`, `views/NotFoundView.vue`, `views/SenderMessagesView.vue`, `views/RunsView.vue`, `views/StatsView.vue`
- [x] `index.html` — `theme-color` = `--c-bg` dei due temi

### Perimetro negativo
- Non toccherò: logica (store, composable, service, router), `useTheme`, test, icone/favicon/`design/`, `public/site.webmanifest`, API dei componenti (props/slot/emit), backend, nuove dipendenze npm

## Fasi
### Fase 1: Branch
- **Stato**: [x]
- **Precondizione**: `main` pulito
- **Azione**: `git checkout -b feat/kitt-knight-rider`
- **Verifica passo**: `git status` sul nuovo branch, albero pulito

### Fase 2: Token e tipografia
- **Stato**: [x]
- **File**: `tokens.css`, `main.css`
- **Operazione**: EDIT
- **Azione**: palette + token KITT; titoli larghi corsivi; utility `.font-console`; contrasti verificati con script (testo >= 4.5:1, bordi/focus >= 3:1)
- **Verifica passo**: script contrasti senza coppie sotto soglia
- **Su divergenza**: STOP

### Fase 3: Guscio
- **Stato**: [x]
- **File**: `ScannerBar.vue`, `VoiceModulator.vue`, `App.vue`, `AppHeader.vue`, `AppSidebar.vue`, `AppMark.vue`
- **Operazione**: CREATE + EDIT
- **Verifica passo**: build ok; animazioni ferme con reduced-motion

### Fase 4: Componenti condivisi
- **Stato**: [x]
- **File**: `BasePanel.vue`, `BaseButton.vue`, `BaseBadge.vue`, `HazardStripe.vue`, `ProgressMeter.vue`
- **Operazione**: EDIT
- **Verifica passo**: props/slot invariati (diff), unit test verdi

### Fase 5: Classi nei componenti di dominio e theme-color
- **Stato**: [x]
- **File**: elenco "Solo classi" + `index.html`
- **Operazione**: EDIT
- **Verifica passo**: grep senza residui di `lcars`, `font-condensed`, `rounded-full` sui campi

### Fase 6: Verifica
- **Stato**: [x]
- **Azione**: `npm run lint:check`, `npm run format:check`, `npm run type-check`, `npx vitest run`, `npm run build-only`; screenshot Playwright 375px e 1280px, chiaro e scuro
- **Verifica passo**: tutti exit code 0

## Criteri di verifica finale
- [x] Lint, format, type-check, unit test e build passano
- [x] Contrasti WCAG rispettati in entrambi i temi
- [x] Animazioni rispettano `prefers-reduced-motion`
- [x] Nessuna modifica fuori scope (`git diff --stat`)
- [x] Nessun commit/push senza richiesta esplicita

## Note di esecuzione
- `tokens.css`: aggiunti anche `--c-console`, `--c-console-raised`, `--c-console-line`, `--c-console-ink` (fondo scuro di testata e navigazione in entrambi i temi), esposti a Tailwind.
- Primario (`--c-federal`) ambra nel tema scuro, bruciato `#8f3f00` nel chiaro; rosso riservato a scanner, LED decorativi e allerta, così pericolo e azione principale restano distinti.
- Sul fondo console l'anello di focus è ambra in entrambi i temi (il primario del tema chiaro non contrasta sul nero).
- Barra inferiore mobile: lettering ristretto sotto `md`, altrimenti "ESECUZIONI" e "STATISTICHE" sbordavano.
- `BaseBadge`: spia LED come contenuto di riserva dello slot `icon`; API invariata.
- Screenshot 375/1280px, chiaro e scuro, con API simulata (caselle e filtri). Esecuzioni e statistiche non viste a schermo.
- Verifica a freddo (`/dr-verify-plan`) non ancora eseguita: Stato resta IN CORSO fino ad allora.
- 2026-10-12: tema scartato dall'utente. Modifiche ripristinate, branch `feat/kitt-knight-rider` eliminato, nessun commit.
