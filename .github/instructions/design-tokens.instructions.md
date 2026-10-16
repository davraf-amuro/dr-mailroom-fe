---
applyTo: "**/*.css,**/*.vue"
---

# Design Tokens — Contratto dei colori e dei temi

Scopo: fissa i **nomi** dei token di design che ogni tema di un frontend web deve fornire e le regole con cui i componenti li usano. I **valori** appartengono al tema: questo file non ne contiene. Un tema nuovo cambia i valori, non i nomi, e i componenti restano identici.

Complementa `frontend-organization.instructions.md` (dove stanno i file) e `no-hardcoded-values.instructions.md` del core (nessun valore letterale con significato fuori dal suo punto di definizione).

---

## Regola 1 — Dove stanno i token

- `src/assets/styles/tokens.css`: definizione dei token, tema chiaro e tema scuro. Unico file che contiene valori di colore.
- `src/assets/styles/main.css`: importa `tokens.css`, espone i token a Tailwind (Regola 6), stili di base e utility.
- Nessun altro file definisce colori. Un componente che ha bisogno di un colore nuovo chiede un token nuovo, non scrive un esadecimale.

---

## Regola 2 — Token semantici obbligatori

Ogni tema definisce tutti questi token, in entrambi i temi (chiaro e scuro). Il nome descrive il **ruolo**, mai il colore.

| Token | Ruolo |
|---|---|
| `--c-bg` | Fondo della pagina |
| `--c-surface` | Fondo di pannelli, card, dialoghi |
| `--c-panel-line` | Linee e separatori **decorativi**: non delimitano controlli |
| `--c-control-border` | Bordo di input, select e controlli interattivi |
| `--c-ink` | Testo principale |
| `--c-ink-muted` | Testo secondario (didascalie, metadati) |
| `--c-federal` / `--c-on-federal` | Colore primario (azioni principali, link, focus) e testo sopra di esso |
| `--c-alert` / `--c-on-alert` | Errore, azione distruttiva, e testo sopra |
| `--c-caution` / `--c-on-caution` | Avviso, e testo sopra |
| `--c-ok` / `--c-on-ok` | Esito positivo, e testo sopra |
| `--c-neutral` | Stato neutro o inattivo (badge, icone) |

---

## Regola 3 — Coppie `on-*` e usi vietati

- Testo o icona su un fondo `--c-federal`, `--c-alert`, `--c-caution`, `--c-ok` → sempre il rispettivo `--c-on-*`. Mai `--c-ink` su un fondo colorato.
- `--c-caution` **non si usa mai come colore del testo**: solo come fondo, con `--c-on-caution` sopra. I gialli e gli arancio non reggono il contrasto su fondo chiaro.
- `--c-panel-line` non delimita un controllo: per il bordo di un input si usa `--c-control-border`.
- Uno stato (errore, attivo, selezionato) non è mai affidato al solo colore: si aggiunge testo, icona, peso o forma.

---

## Regola 4 — Soglie di contrasto (WCAG 2.x)

Valgono per ogni tema, **in chiaro e in scuro**:

| Coppia | Soglia minima |
|---|---|
| `--c-ink`, `--c-ink-muted`, `--c-neutral` su `--c-bg` e su `--c-surface` | 4.5:1 |
| `--c-federal`, `--c-alert`, `--c-ok` usati come testo (link, badge, pulsanti senza fondo) su `--c-bg` e su `--c-surface` | 4.5:1 |
| Ogni `--c-on-*` sul proprio fondo | 4.5:1 |
| `--c-control-border` su `--c-bg` e su `--c-surface` | 3:1 |
| `--c-federal` (anello di focus) su `--c-bg` e su `--c-surface` | 3:1 |
| Testo sopra i colori propri di un tema (Regola 7) | 4.5:1 |

Chi crea o modifica un tema misura i rapporti e li annota in un commento in testa a `tokens.css`, con la data. Un valore cambiato senza misura è un tema non verificato.

---

## Regola 5 — Interazione e accessibilità

Token obbligatori, anch'essi con nome fisso e valore del tema:

| Token | Uso | Valore consigliato |
|---|---|---|
| `--focus-ring-width` | Spessore dell'anello di focus | `3px` |
| `--focus-ring-offset` | Distanza dell'anello dal bordo | `2px` |
| `--hit-target-min` | Lato minimo dell'area cliccabile/toccabile | `44px` |
| `--stencil-tracking` | Spaziatura delle lettere di etichette maiuscole | del tema |

- Un solo anello di focus per tutta l'app, definito su `:focus-visible` in `main.css` con `--c-federal`. Nessun componente lo ridefinisce o lo rimuove.
- `prefers-reduced-motion: reduce` azzera animazioni e transizioni, in `main.css`.

---

## Regola 6 — Tema chiaro e scuro

- Il tema scelto sta nell'attributo `data-theme` di `<html>`: `light` o `dark`. Lo imposta `composables/shared/useTheme.ts` e la scelta sopravvive tra una sessione e l'altra.
- Senza attributo vale la preferenza di sistema (`prefers-color-scheme`).
- Struttura di `tokens.css`:

```css
:root { color-scheme: light; /* tema chiaro + token comuni */ }
:root[data-theme='dark'] { color-scheme: dark; /* tema scuro */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) { color-scheme: dark; /* stessi valori del tema scuro */ }
}
```

- In `main.css` la variante `dark:` di Tailwind v4 segue l'attributo, non solo il sistema:

```css
@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));
```

- Esposizione a Tailwind con `@theme inline`, un alias per token, nome senza il prefisso `c-`:

```css
@theme inline {
  --color-bg: var(--c-bg);
  --color-on-federal: var(--c-on-federal);
  /* … uno per ogni token della Regola 2 e della Regola 7 */
}
```

I componenti usano le utility (`bg-surface`, `text-ink`, `border-control-border`) o `var(--c-…)`. Mai un colore letterale.

---

## Regola 7 — Token propri di un tema

Un tema può aggiungere token suoi (colori decorativi, forme, misure):

- Prefisso dedicato al tema, per esempio `--c-<tema>-*` per i colori e `--<tema>-*` per le misure.
- Nominati per **ruolo** (`--c-<tema>-frame`, `--c-<tema>-accent-1`), non per colore (`--c-<tema>-orange`): così due varianti dello stesso tema cambiano solo i valori.
- Ogni colore decorativo che porta testo ha il suo `--c-on-*` e rispetta la Regola 4.
- Non sostituiscono i token semantici: un componente condiviso usa `--c-federal` per l'azione primaria anche dentro un tema che ha colori propri.

Cambiare tema non cambia l'API dei componenti condivisi (props, slot, eventi): cambia solo lo stile.

---

## Regola 8 — Animazioni, dipendenze e font di un tema

- Ogni animazione decorativa ha un ripiego dentro `@media (prefers-reduced-motion: reduce)` che la ferma in uno **stato significativo** (indicatore acceso in posizione neutra, barra piena a metà, valore statico): non spenta e non nascosta. Vale in aggiunta all'azzeramento globale della Regola 5, che da solo lascia l'elemento in un fotogramma arbitrario.
- Un tema non introduce dipendenze npm proprie. Fanno eccezione i font, dichiarati nell'istruzione del tema e installati solo dopo conferma esplicita dell'utente.
- Lo stato attivo o semantico non è mai affidato al solo bagliore o al solo colore: si aggiunge testo, spia, peso o forma (vale la Regola 3).

---

## ✅ Checklist pre-commit

- [ ] Nessun colore letterale fuori da `tokens.css`?
- [ ] Tutti i token della Regola 2 e della Regola 5 definiti, in chiaro e in scuro?
- [ ] Testo su fondo colorato con il rispettivo `--c-on-*`? `--c-caution` mai come testo?
- [ ] Rapporti di contrasto misurati e annotati in `tokens.css` dopo ogni modifica di colore?
- [ ] Stati mai affidati al solo colore?
- [ ] Token propri del tema con prefisso dedicato e nomi di ruolo?
- [ ] Ogni animazione decorativa con ripiego in `prefers-reduced-motion: reduce`, nessuna dipendenza npm oltre ai font confermati?

---

*Istruzione v1.1 - Design Tokens - 2026-10-14 — claude-opus-5-5 — contratto dei token estratto dal frontend di prova dr-mailroom-fe (dr-guidelines#13, #14); Regola 8 (dr-fe#3)*
