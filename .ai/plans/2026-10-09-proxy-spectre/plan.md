# Piano: dr-mailroom-fe dietro nginx-proxy (mailroom.spectre.local)
Data: 2026-10-09
Stato: IN CORSO

## Obiettivo
Raggiungere il frontend su `http://mailroom.spectre.local/`, come `condominio.spectre.local`: voce in `hosts`, blocco `server` nel proxy, container nella rete esterna `spectre-net`.

## Vincolo
L'API resta su `http://localhost:5180`: è il redirect URI OAuth registrato in Google Console, e Google accetta `http` solo su `localhost`. Nessun `api`-host per mailroom.
Il CORS dell'API ammette una sola origine (`Mailroom__Frontend__BaseUrl`): passa a `http://mailroom.spectre.local`, quindi `localhost:5173` non potrà più chiamare l'API → la porta 5173 si toglie.

## Scope
### File da modificare
- [x] `C:\docker\nginx-proxy\conf.d\spectre.conf` — nuovo blocco `server_name mailroom.spectre.local` → `http://dr-mailroom-fe:80`, stesse intestazioni dei blocchi esistenti
- [ ] `C:\Windows\System32\drivers\etc\hosts` — `127.0.0.1  mailroom.spectre.local` (se serve l'amministratore, lo aggiunge l'utente)
- [x] `dr-mailroom-fe/docker-compose.yml` — rete esterna `spectre-net`, via `ports: 5173:80`
- [x] `dr-mailroom-fe/README.md` — sezione Docker: URL `http://mailroom.spectre.local`, prerequisiti proxy e hosts
- [x] `dr-mailroom/.env` (non committato) — `Mailroom__Frontend__BaseUrl=http://mailroom.spectre.local` (CORS + ritorno dopo il collegamento della casella)

### Perimetro negativo
- Non toccherò: blocchi esistenti di `spectre.conf`, compose di nginx-proxy e di condominio, codice applicativo, `public/config.json` (`apiBaseUrl` resta `http://localhost:5180`), redirect OAuth, compose del backend

## Fasi
### Fase 1: Proxy
- **Stato**: [x]
- **Azione**: aggiungi il blocco, `docker exec nginx-proxy nginx -t` poi `nginx -s reload`
### Fase 2: hosts
- **Stato**: [ ]
### Fase 3: Frontend in spectre-net
- **Stato**: [x]
- **Azione**: compose + README, `docker compose up -d`
### Fase 4: CORS backend
- **Stato**: [x]
- **Azione**: `.env`, `docker compose up -d` nel backend (ricrea il container)
### Fase 5: Verifica
- **Stato**: [x]
- **Verifica passo**: `http://mailroom.spectre.local/` 200; API con `Origin: http://mailroom.spectre.local` → `Access-Control-Allow-Origin` corretto; `condominio.spectre.local` e `api.spectre.local` ancora 200; screenshot

## Criteri di verifica finale
- [x] UI su `http://mailroom.spectre.local/` legge le caselle
- [x] Condominio invariato e funzionante
- [x] Nessun commit/push senza richiesta

## Note di esecuzione
- Ordine invertito: Fase 3 prima della 1 (il reload del proxy fallisce se `dr-mailroom-fe` non è ancora in spectre-net).
- Backup di `spectre.conf` nello scratchpad prima della modifica; `nginx -t` ok, reload ok.
- Verifica con `Host:` e Playwright `--host-resolver-rules`: mailroom 200 (anche deep link), condominio 200, api.spectre.local 404 dall'API di condominio (nessuna rotta su `/`, come prima). CORS: ammessa solo `http://mailroom.spectre.local`.
- Fase 2 in attesa: scrittura di `hosts` negata (serve amministratore), la fa l'utente.
