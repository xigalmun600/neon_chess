# Neon Chess

## Ajedrez online con estilo neon. Juega contra una maquina o contra otra persona.
Pagina web: <https://chess.galisma.com>.

## Como desplegar
Usando nix:

```bash
git clone https://github.com/xigalmun600/neon_chess.git
cd neon_chess
nix develop          # Node 22, Postgres 16 y DATABASE_URL listos
pg_start             # arranca el cluster (la primera vez lo crea en ./.postgres)
psql -f db/tables.sql
npm install
npm run dev          # http://localhost:5173
```

Cuando termines, `pg_stop`.

Sin nix hay que usar con node 22 y postgres 16 instalados a mano, una BD `neon_chess`, exportar `DATABASE_URL` y aplicar `db/tables.sql`.

## Para jugar contra humanos en local
Necesitas tambien [chess_server](https://github.com/xigalmun600/chess_server) (el WebSocket que empareja jugadores):

```bash
node --experimental-strip-types src/index.ts
```
El cliente detecta donde esta por si mismo, en localhost va a `ws://localhost:8080` y en produccion a `wss://<dominio>/ws`.

Las dos apps comparten un `INTERNAL_API_SECRET` (en `.env`): neon_chess lo usa para firmar el ticket HMAC del WS y para validar la cabecera del endpoint que guarda los resultados. Si lo pones distinto en cada lado, los retos no conectan y el ESO no se guarda.

## Producción
`npm run build` genera `build/index.js` (adapter-node). Lo arranca `node build/index.js` en el puerto 3000. Necesita `DATABASE_URL` apuntando a postgres.

El despliegue es automatico: push a `main` → un GitHub Action entra por SSH al VPS, hace `git pull`, `npm install`, `npm run build` y `systemctl restart neon-chess`. Caddy delante termina TLS y enruta `/ws` al `chess_server` (:8080) y el resto a la app SvelteKit (:3000). Los systemd units y el Caddyfile están en `deploy/`.

## Comandos utiles
- `npm run check` — comprueba tipos con svelte-check.
- `npm run test:e2e` — tests E2E con Playwright (lanza dos navegadores y juega una partida entera entre ellos).
- `npm run preview` — sirve el build de producción en local.
