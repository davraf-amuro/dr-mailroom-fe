# Piano: Frontend su Docker
Data: 2026-10-09
Stato: COMPLETATO

## Obiettivo
Eseguire dr-mailroom-fe in un container (build Vite + nginx), accanto al container `dr-mailroom-api` già definito nel repo backend.

## Scope
### File da creare/modificare
- [x] `Dockerfile` — multi-stage: `node:24-alpine` (`npm ci`, `npm run build`) → `nginx:1.27-alpine` con `dist/`
- [x] `nginx.conf` — `try_files $uri /index.html` (router in history mode), `Cache-Control: no-store` su `/config.json` e `index.html`, cache lunga su `/assets/`
- [x] `.dockerignore` — `node_modules`, `dist`, `.git`, `.ai`, `e2e`, test, **`public/config.json`** (contiene la chiave API: non deve finire nell'immagine)
- [x] `docker-compose.yml` — servizio `dr-mailroom-fe`, porta host **5173**:80 (è l'origine ammessa dal CORS dell'API, `Mailroom__Frontend__BaseUrl`), `public/config.json` montato in sola lettura a runtime
- [x] `README.md` — breve sezione "Docker"

### Perimetro negativo
- Non toccherò: codice applicativo, `public/config.json` (solo montato), repo backend (`Dockerfile`, `docker-compose.yml`, `.env`), branch: si costruisce il branch corrente `feat/lcars-enterprise-d`

## Fasi
### Fase 1: File Docker
- **Stato**: [x]
- **Verifica passo**: `docker build` riuscito; `docker run --rm <img> ls /usr/share/nginx/html` senza `config.json`
### Fase 2: README
- **Stato**: [x]
### Fase 3: Avvio
- **Stato**: [x]
- **Precondizione**: porte 5180 e 5173 libere (oggi occupate da API locale PID 32192 e Vite PID 39568)
- **Azione**: `docker compose up -d` nel backend e nel frontend
- **Verifica passo**: `docker port` mostra 5180 e 5173; `http://localhost:5173` carica, chiamate API 200, nessun errore CORS

## Criteri di verifica finale
- [x] Immagine FE senza `config.json` al suo interno
- [x] Entrambi i container su con porte pubblicate, UI che legge le caselle dall'API
- [x] Lint FE invariato (nessun file applicativo toccato)
- [x] Nessun commit/push senza richiesta

## Note di esecuzione
- Immagine `dr-mailroom-fe:local` costruita, `nginx -t` ok, `config.json` assente dall'immagine.
- Container backend creato e poi fermato: porta 5180 occupata dall'API locale (PID 32192), doppio scheduler sullo stesso DB.
- Fase 3: processi locali chiusi dall'utente; container su 5180 e 5173, /api/v1/status e /mailboxes/summary 200 con Access-Control-Allow-Origin http://localhost:5173, deep link 200, screenshot con dati reali ok.
