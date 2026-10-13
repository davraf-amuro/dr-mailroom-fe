# Piano: Prove grafiche "Gundam" (Federazione) e "Zeon"
Data: 2026-10-12
Stato: SCARTATO

## Obiettivo
Due prove grafiche indipendenti, ognuna sul proprio branch creato da `main`:
1. `feat/gundam` — Federazione Terrestre, RX-78-2: corazza bianca, petto blu, giallo delle alette a V e delle prese d'aria, rosso.
2. `feat/zeon` — Principato di Zeon: verde Zaku, grigio acciaio, rosso di Char, occhio mono rosa che scorre nella feritoia.

Riguardano solo la presentazione: logica, test e API dei componenti restano come sono.

## Vincolo: lavoro K.I.T.T. non committato
Il working tree di `dr-mailroom-fe` è su `main` e contiene le modifiche K.I.T.T. non committate. Per non toccarle, i due branch si lavorano in **git worktree** separati, creati da `main` (`a325040`):
- `../dr-mailroom-fe-gundam` → `feat/gundam`
- `../dr-mailroom-fe-zeon` → `feat/zeon`

In ogni worktree si esegue `npm ci`, perché `node_modules` non è condiviso tra i worktree. Nessun commit, nessun push.

## Concetto — Gundam (Federazione)
- **Tipografia**: Saira larga dritta (`font-stretch` 125%, peso 700) maiuscola per i titoli; JetBrains Mono per matricole e numeri ("RX-78-2", "E.F.S.F.").
- **Forme**: placche di corazza con angoli smussati (`clip-path` a 45°) e linee di giunzione sottili.
- **Testata**: fascia blu della corazza con al centro il chevron giallo dell'aletta a V e un tassello rosso; matricola "RX-78-2" in mono.
- **Navigazione**: colonna blu del petto, sempre scura in entrambi i temi. Le voci sono placche con una tacca colorata (bianco, giallo, rosso, celeste). La voce attiva diventa una placca bianca piena con testo scuro, peso maggiore e chevron giallo, così la posizione non è affidata al solo colore. In fondo: le due griglie gialle delle prese d'aria del petto e la targa "RX-78-2 GUNDAM".
- **Pannelli**: placche smussate con cornice sottile; la variante "eroe" ha una fascia blu in alto e un chevron giallo.
- **Pulsanti, badge, progress**: pulsanti a placca smussata; badge a placca; progress a segmenti con indeterminata a fascia che scorre.
- **Temi**: chiaro "hangar" (corazza bianca, primario blu) e scuro "cabina" (blu notte, primario celeste).

## Concetto — Zeon
- **Tipografia**: Saira condensata maiuscola, più militare e compressa (`font-stretch` 75%, peso 700); mono per le sigle ("MS-06S", "ZEON").
- **Forme**: placche spigolose a esagono schiacciato (`clip-path` su due angoli opposti) e rivetti.
- **Testata**: feritoia nera del visore con l'occhio mono rosa che scorre avanti e indietro. Con `prefers-reduced-motion` resta fermo al centro.
- **Navigazione**: colonna verde scuro Zaku, scura in entrambi i temi. Le voci sono placche con rivetto. La voce attiva è una placca rossa "Char" piena con testo chiaro, peso maggiore e spia occhio mono. In fondo: tubi corrugati decorativi (i cavi di alimentazione dello Zaku) e la targa "MS-06S ZAKU II".
- **Pannelli**: placche spigolose, cornice verde; la variante "eroe" ha una fascia rossa.
- **Allerta** (`HazardStripe`): bande diagonali rosse e nere.
- **Temi**: chiaro "hangar di Side 3" (grigio acciaio chiaro, primario verde scuro) e scuro "Solomon" (nero verde, primario verde chiaro, accento rosa).
- Nessuno stemma ufficiale riprodotto: solo colori e forme ispirate.

## Scope (identico nei due branch, cambia il contenuto)
### File da modificare
- [x] `src/assets/styles/tokens.css` — palette chiara e scura. `--c-lcars-*` diventa `--c-hull*` (colonna e testata) e `--c-ms-*` (colori delle tacche/placche) con `--c-on-ms`; `--lcars-*` diventa `--ms-*` (geometria: smusso, fessura, barra)
- [x] `src/assets/styles/main.css` — token esposti a Tailwind, tipografia dei titoli, utility `.font-condensed` rinominata `.font-plate`
- [x] Componenti NUOVI decorativi (`aria-hidden`):
  - Gundam: `src/components/shell/VFinCrest.vue` (chevron della testata) e `src/components/shell/ChestVents.vue` (prese d'aria)
  - Zeon: `src/components/shell/MonoEye.vue` (feritoia con occhio mono) e `src/components/shell/PowerPipes.vue` (tubi corrugati)
- [x] Guscio: `src/components/shell/AppHeader.vue`, `AppSidebar.vue`, `AppMark.vue`
- [x] Componenti condivisi: `BasePanel.vue`, `BaseButton.vue`, `BaseBadge.vue`, `HazardStripe.vue`, `ProgressMeter.vue` (props, slot ed emit invariati)
- [x] Solo classi (`rounded-full` diventa smusso, `font-condensed` diventa `font-plate`): `FilterBuilder.vue`, `FilterPreviewPanel.vue`, `FilterSearch.vue`, `MailboxSearch.vue`, `MailboxesHero.vue`, `RunHistoryFilters.vue`, `RunLaunchPad.vue`, `StatsToolbar.vue`, `views/NotFoundView.vue`, `views/RunsView.vue`, `views/SenderMessagesView.vue`, `views/StatsView.vue`
- [x] `index.html` — `theme-color` uguale a `--c-bg` dei due temi

### Perimetro negativo
Non si toccano:
- il lavoro K.I.T.T. nel working tree principale;
- la logica (store, composable, service, router), `useTheme`, i test;
- icone, favicon, `design/`, `public/site.webmanifest`;
- `App.vue`, salvo necessità dichiarata;
- le API dei componenti, il backend;
- le dipendenze npm (nessuna nuova).

## Fasi
### Fase 1: Worktree Gundam
- **Stato**: [x]
- **Azione**: `git worktree add -b feat/gundam ../dr-mailroom-fe-gundam main`, poi `npm ci`; copia di `public/config.json` per il dev locale (file ignorato da git)
- **Verifica passo**: `git status` pulito nel worktree; working tree K.I.T.T. invariato

### Fase 2: Tema Gundam
- **Stato**: [x]
- **Azione**: token e tipografia, poi guscio, condivisi, classi; contrasti verificati con script (testo ≥ 4.5:1, bordi e focus ≥ 3:1)
- **Verifica passo**: script contrasti senza coppie sotto soglia; grep senza residui `lcars` e `font-condensed`

### Fase 3: Verifica Gundam
- **Stato**: [x]
- **Azione**: `npm run lint:check`, `npm run format:check`, `npm run type-check`, `npx vitest run`, `npm run build-only`; screenshot a 375 e 1280 px, chiaro e scuro
- **Su divergenza**: STOP, correggi, riesegui

### Fase 4: Worktree Zeon
- **Stato**: [x]
- **Azione**: `git worktree add -b feat/zeon ../dr-mailroom-fe-zeon main`, poi `npm ci`; si parte copiando i file Gundam (stessa struttura di token), poi si cambiano palette e decorazioni
- **Verifica passo**: `git status` nel worktree

### Fase 5: Tema Zeon
- **Stato**: [x]
- **Azione**: palette, tipografia condensata, `MonoEye`, `PowerPipes`, placche spigolose, allerta diagonale; nel branch Zeon nessun file Gundam (`VFinCrest`, `ChestVents`)
- **Verifica passo**: script contrasti; grep senza residui `lcars`, `font-condensed`, `VFin`, `ChestVents`

### Fase 6: Verifica Zeon
- **Stato**: [x]
- **Azione**: stessi comandi della Fase 3 e screenshot

## Criteri di verifica
- [x] Due branch `feat/gundam` e `feat/zeon` da `main`, nessun commit, nessun push
- [x] Modifiche K.I.T.T. nel working tree principale invariate (stessi 26 file in `git status`)
- [x] Lint, format, type-check, test, build: exit 0 in entrambi i worktree
- [x] Contrasti WCAG rispettati in entrambi i temi di entrambi i branch
- [x] Animazioni ferme con `prefers-reduced-motion`
- [x] Voce attiva riconoscibile anche senza colore (peso e segno grafico)
- [x] `git diff --stat` dentro lo scope dichiarato

## Note di esecuzione
- Smussi realizzati con `corner-shape: bevel` più `border-radius` e non con `clip-path`: `clip-path` avrebbe tagliato l'anello di focus. Dove `corner-shape` non è supportato restano angoli arrotondati.
- Gundam: sulla placca bianca attiva il chevron è blu corazza e non giallo, perché il giallo su bianco ha contrasto 1.4:1.
- Gundam: `--c-hull-line` portato a `#7f9ae6`, perché `#4a6cc4` aveva 2.25:1 sul blu.
- Zeon: smusso su due angoli opposti (in alto a sinistra e in basso a destra); voci di navigazione a esagono schiacciato (`border-radius: 14px / 50%` con bevel).
- Zeon: `--c-ms-char` sul fondo scuro ha contrasto 3.01:1, quindi si usa solo come fondo (voce attiva, fascia eroe) e mai come testo.
- Su mobile la voce attiva non ha il segno grafico laterale (chevron o occhio): lo sostituisce una barra sotto l'etichetta.
- Verifiche: lint, format, type-check, 232 test e build con exit 0 in entrambi i worktree. Script contrasti senza coppie sotto soglia. Screenshot in `scratchpad/shots/{gundam,zeon}`. Reduced-motion: occhio mono con `animation: none`, fermo al centro.
- `App.vue` non toccato. `git status` del working tree K.I.T.T. invariato.
- 2026-10-12: temi scartati dall'utente. Worktree e branch `feat/gundam` e `feat/zeon` eliminati, nessun commit, nessun push.
