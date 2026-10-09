# Piano: Prova LCARS "Enterprise-D"
Data: 2026-10-09
Stato: COMPLETATO

## Obiettivo
Sul branch `feat/lcars-enterprise-d` (da `feat/lcars-enterprise-e`) provare la palette LCARS dell'Enterprise-D (The Next Generation): nero pieno, arancio, pesca, lilla, pervinca, rosso. Struttura (gomito, pillole, staffe) invariata rispetto alla prova E.

## Scope
### File da modificare
- [x] `src/assets/styles/tokens.css` — palette TNG scura e chiara; token decorativi rinominati per colore: `--c-lcars-orange`, `-peach`, `-lilac`, `-periwinkle`, `-red`
- [x] `src/assets/styles/main.css` — esposizione a Tailwind dei token rinominati
- [x] `src/components/shell/AppSidebar.vue` — colori di gomito, voci e coda; etichetta "LCARS 1701-D"
- [x] `src/components/shell/AppHeader.vue` — colori della barra a segmenti e del pulsante tema
- [x] `src/components/shared/BasePanel.vue` — colori della staffa
- [x] `index.html` — `theme-color`

### Perimetro negativo
- Non toccherò: forme e layout (già fatti nella prova E), logica, `useTheme`, test, icone, `public/site.webmanifest`, backend

## Palette (contrasti verificati il 2026-10-09)
- Scuro: fondo `#000000`, superficie `#0e0c14`, testo `#f5ede1`, secondario `#c9b8a6`, primario pervinca `#9999ff`, allerta `#ff6666`, ok `#99cc99`, neutro `#aaa0b8`, bordo `#8a7f9e`, caution arancio `#ff9900`
- Chiaro: fondo `#f4ebe0`, superficie `#fbf6ef`, testo `#14101c`, primario `#4b3f9e`, allerta `#a8323a`, ok `#2f6b3a`
- Blocchi (testo nero, tutti >= 5.6:1): arancio `#ff9900`, pesca `#ffcc99`, lilla `#cc99cc`, pervinca `#9999ff`, rosso `#cc6666`
- Gomito e barra superiore arancio; voci: pervinca, pesca, lilla, rosso; coda lilla; staffa pannelli lilla, eroe arancio

## Fasi
### Fase 1: Branch
- **Stato**: [x]
- **Azione**: commit della prova E su `feat/lcars-enterprise-e`, `git checkout -b feat/lcars-enterprise-d`
### Fase 2: Token e Tailwind
- **Stato**: [x]
- **File**: `tokens.css`, `main.css`
- **Verifica passo**: nessun riferimento residuo a `lcars-blue|tan|steel|rust` (grep)
### Fase 3: Componenti
- **Stato**: [x]
- **File**: `AppSidebar.vue`, `AppHeader.vue`, `BasePanel.vue`, `index.html`
- **Verifica passo**: build ok
### Fase 4: Verifica
- **Stato**: [x]
- **Azione**: lint, format, type-check, vitest, build; screenshot Playwright 375/1280px chiaro e scuro

## Criteri di verifica finale
- [x] Lint, format, type-check, unit test e build passano
- [x] Contrasti WCAG rispettati in entrambi i temi
- [x] Diff limitato ai file in scope
- [x] Nessun push

## Note di esecuzione
- Screenshot a 375/1280px, chiaro e scuro, con backend spento: card caselle non viste a schermo.
