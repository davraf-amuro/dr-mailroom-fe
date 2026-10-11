# Container di dr-mailroom-fe

Come si costruisce e si pubblica il frontend in Docker, e quali limiti di sicurezza ha la chiave API in una SPA.

---

## Com'è fatta l'immagine

`Dockerfile` multi-stage:

| Stadio | Immagine | Cosa fa |
|---|---|---|
| `build` | `node:24-alpine` | `npm ci` e `npm run build` |
| `final` | `nginx:1.27-alpine` | serve `dist/` con la configurazione di `nginx.conf` |

Regole di `nginx.conf`:

| Percorso | Comportamento | Cache |
|---|---|---|
| `/assets/` | file con hash nel nome | `public, max-age=31536000, immutable` |
| `/config.json` | configurazione montata dal compose | `no-store`: sempre riletta |
| ogni altra rotta | `try_files $uri $uri/ /index.html`, il router la risolve lato client | `no-store` |

`public/config.json` non entra mai nell'immagine: è escluso da `.dockerignore` e si monta a runtime in sola lettura.

---

## Come pubblicare il frontend

Il frontend è raggiungibile su `http://mailroom.spectre.local`, dietro il container condiviso `nginx-proxy`. Non pubblica porte proprie.

### Prerequisiti

- La rete Docker esterna `spectre-net` e il container `nginx-proxy`, con un blocco `server` per `mailroom.spectre.local` che punta a `http://dr-mailroom-fe:80`.
- La riga `127.0.0.1  mailroom.spectre.local` nel file hosts.
- `Mailroom__Frontend__BaseUrl=http://mailroom.spectre.local` nel `.env` del backend: è l'origine che il CORS dell'API ammette. Senza, il browser blocca ogni chiamata.
- `public/config.json` compilato (vedi [sviluppo.md](sviluppo.md#configurazione-runtime-publicconfigjson)), con `apiBaseUrl` raggiungibile **dal browser**, non dal container.

### Avvio

```sh
docker compose up -d --build
```

Dopo una modifica al codice si rilancia lo stesso comando: ricostruisce l'immagine e ricrea il container.

---

## La chiave API arriva al browser

Una SPA non ha un server proprio: ogni chiamata all'API parte dal browser. Quindi la chiave in `config.json` arriva al browser di chi apre l'app.

| Cosa succede | Conseguenza |
|---|---|
| Chiunque apra l'app può leggere la chiave (strumenti di sviluppo, `GET /config.json`) | Chi raggiunge il frontend ha di fatto accesso completo all'API |
| La chiave resta in una variabile di memoria, mai in `localStorage` | Limita solo la persistenza: chiusa la scheda, la chiave sparisce dal browser. Non la nasconde |
| `config.json` è servito con `no-store` | Cambiare la chiave non richiede una nuova build: basta aggiornare il file e ricaricare |

**Uso previsto:** rete locale o comunque fidata, con il frontend non esposto su internet. Per un'esposizione pubblica servirebbe un'autenticazione degli utenti (per esempio un reverse proxy con login, o un backend-for-frontend che tenga la chiave lato server): oggi non c'è.

---

*Revisione v1.0 — 2026-10-11 21:58 — claude-opus-5-5*
