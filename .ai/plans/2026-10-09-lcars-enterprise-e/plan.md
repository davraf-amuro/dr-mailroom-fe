# Piano: Grafica LCARS "Enterprise-E"
Data: 2026-10-09
Stato: COMPLETATO

## Obiettivo
Sul branch `feat/lcars-enterprise-e` (da `main`) ridisegnare la grafica in stile LCARS dell'Enterprise-E (Star Trek: First Contact): fondo nero, blu acciaio, tortora, ruggine, cornici a "gomito", pulsanti a pillola, lettering condensato maiuscolo. Solo presentazione: nessuna logica cambia.

## Scope
### File da modificare
- [x] `src/assets/styles/tokens.css` — palette LCARS (scuro canonico + variante chiara "plancia diurna"), token decorativi `--c-lcars-*`, raggi del gomito; rimosso `--panel-bevel`
- [x] `src/assets/styles/main.css` — tipografia condensata (Saira wdth 50–62.5%), titoli maiuscoli; utility `.font-expanded` → `.font-condensed`
- [x] `src/App.vue` — griglia del guscio con cornice a gomito (sidebar + testata unite)
- [x] `src/components/shell/AppSidebar.vue` — barra LCARS verticale, voci come blocchi colorati a pillola
- [x] `src/components/shell/AppHeader.vue` — barra orizzontale a segmenti, pulsante tema a pillola
- [x] `src/components/shell/AppMark.vue` — classe `.font-condensed`
- [x] `src/components/mailboxes/MailboxesHero.vue` — classe `.font-condensed`
- [x] `src/components/shared/BasePanel.vue` — cornice LCARS (tappo sinistro arrotondato + filetto superiore) al posto dello smusso
- [x] `src/components/shared/BaseButton.vue` — forma a pillola, maiuscolo condensato
- [x] `src/components/shared/BaseBadge.vue` — forma a pillola
- [x] `src/components/shared/HazardStripe.vue` — striscia d'allerta a blocchi LCARS (rosso/nero) invece della zebratura gialla
- [x] `src/components/mailboxes/MailboxSearch.vue`, `src/views/NotFoundView.vue` — angoli coerenti (pillola)
- [x] `index.html` — `theme-color` allineati alla nuova palette

### Perimetro negativo
- Non toccherò: logica (store, composable, service, router), `useTheme`, test, backend, icone/favicon/`design/app-icon.svg` (il marchio si ricolora già dai token), `design/design.md`, nomi dei token esistenti (`--c-federal` & co. restano: cambiano solo i valori)

## Fasi
### Fase 1: Branch
- **Stato**: [x]
- **Azione**: commit della prova `feat/palette-giacca`, `git checkout -b feat/lcars-enterprise-e` da `main`
- **Verifica passo**: `git status` su `feat/lcars-enterprise-e`, albero pulito

### Fase 2: Token
- **Stato**: [x]
- **File**: `src/assets/styles/tokens.css`
- **Operazione**: EDIT
- **Azione**: nuova palette scura e chiara + token LCARS; contrasti verificati con script (testo >= 4.5:1, bordi/focus >= 3:1)
- **Verifica passo**: script di contrasto senza coppie sotto soglia
- **Su divergenza**: STOP

### Fase 3: Tipografia
- **Stato**: [x]
- **File**: `main.css`, `AppMark.vue`, `MailboxesHero.vue`
- **Operazione**: EDIT
- **Azione**: titoli e `.stencil` condensati maiuscoli; rinomina utility in `.font-condensed`
- **Verifica passo**: nessun riferimento residuo a `font-expanded` (grep)

### Fase 4: Guscio a gomito
- **Stato**: [x]
- **File**: `App.vue`, `AppSidebar.vue`, `AppHeader.vue`
- **Operazione**: EDIT
- **Azione**: cornice LCARS desktop (gomito in alto a sinistra), su mobile barra inferiore a blocchi; voce attiva distinta da colore + barra, non dal solo colore
- **Verifica passo**: build ok, layout a 375px e 1280px controllato a schermo

### Fase 5: Componenti condivisi
- **Stato**: [x]
- **File**: `BasePanel.vue`, `BaseButton.vue`, `BaseBadge.vue`, `HazardStripe.vue`, `MailboxSearch.vue`, `NotFoundView.vue`
- **Operazione**: EDIT
- **Azione**: forme LCARS (pillole, tappi), nessuna API dei componenti cambiata
- **Verifica passo**: props/slot invariati (diff), test unitari verdi

### Fase 6: theme-color
- **Stato**: [x]
- **File**: `index.html`
- **Operazione**: EDIT
- **Verifica passo**: valori = `--c-bg` dei due temi

### Fase 7: Verifica
- **Stato**: [x]
- **Azione**: `npm run lint:check`, `npm run format:check`, `npm run type-check`, `npx vitest run`, `npm run build-only`; screenshot con Playwright a 375px e 1280px, tema chiaro e scuro
- **Verifica passo**: tutti exit code 0

## Criteri di verifica finale
- [x] Lint, format, type-check, unit test e build passano
- [x] Contrasti WCAG rispettati in entrambi i temi
- [x] Nessuna modifica fuori dallo scope (git diff --stat)
- [x] Nessun commit/push senza richiesta esplicita

## Note di esecuzione
- Il marchio passa nella testata anche su desktop: la colonna sinistra è ora barra LCARS continua (gomito, voci, coda).
- Barra della voce attiva staccata dal bordo del blocco: altrimenti sul fondo nero del tema scuro si fondeva col margine.
- Screenshot a 375/1280px, chiaro e scuro, con backend spento: i pannelli con dati (card caselle) non sono stati visti a schermo.
- Fuori scope, da valutare: `public/site.webmanifest` ha ancora `background_color`/`theme_color` della palette precedente.
