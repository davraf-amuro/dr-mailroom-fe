# Piano — Densità spaziature FE

Stato: COMPLETATO
Data: 2026-10-10
Branch: feat/densita-spaziature (FE)

## Obiettivo

Recuperare spazio verticale/orizzontale riducendo di circa uno step Tailwind le spaziature di layout
(tra schede, blocchi, sezioni e padding pannelli). Nessun cambio a hit target (`min-h-11`,
`--hit-target-min`), pulsanti, badge, dialog, tabelle.

## Scope

| File | Da | A |
|------|----|---|
| `src/App.vue` (main) | `pt-6 md:px-8 md:pb-10` | `pt-4 md:px-6 md:pb-6` |
| `src/components/shared/PageHeading.vue` | `mb-6` | `mb-4` |
| `src/components/shared/BasePanel.vue` | `p-5` | `p-4` |
| `src/components/shared/EmptyState.vue` | `py-12` | `py-8` |
| `src/views/*View.vue` (4 viste) | `mb-6` / `space-y-6` / `gap-6` / `gap-5` / `space-y-4` | `mb-4` / `space-y-4` / `gap-4` / `gap-3` / `space-y-3` |
| `src/components/mailboxes/MailboxCard.vue` | `-mx-5 -mt-5 mb-4`, `mt-4`, `mt-5` | `-mx-4 -mt-4 mb-3`, `mt-3`, `mt-4` (allineato a BasePanel) |
| `src/components/mailboxes/MailboxesHero.vue` | `gap-6` | `gap-4` |
| `src/components/filters/FilterCard.vue` | `mt-5` | `mt-4` |
| `src/components/filters/FilterBuilder.vue` | `mt-5 space-y-5`, `mt-6` | `mt-4 space-y-4`, `mt-4` |
| `src/components/runs/RunLaunchPad.vue` | `gap-6`, `space-y-5`, lista `gap-4` | `gap-4`, `space-y-4`, `gap-3` |

## Fuori scope

Token in `tokens.css`, cornice LCARS (`--lcars-*`), header/sidebar, dialog, tabelle, componenti
`shared` non elencati, logica e test.

## Fasi

- [x] 1. Shell e shared (App, PageHeading, BasePanel, EmptyState)
- [x] 2. Viste (Filters, Mailboxes, Runs, Stats)
- [x] 3. Componenti di dominio (MailboxCard, MailboxesHero, FilterCard, FilterBuilder, RunLaunchPad)
- [x] 4. Verifica: `npm run lint:check`, `npm run type-check`, `npx vitest run`

## Criteri di verifica

- [x] Nessuna classe `-mx-5`/`-mt-5` residua legata al vecchio `p-5` di BasePanel
- [x] Hit target invariati (`min-h-11` non toccati)
- [x] Lint, type-check e test unitari verdi
