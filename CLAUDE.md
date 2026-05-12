# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev environment

Node 22 + Postgres 16 come from `flake.nix`. Standard loop:

```bash
nix develop          # drops into shell with Node, Postgres 16, pg_start/pg_stop, and DATABASE_URL set
pg_start             # first run also initializes the cluster in ./.postgres
psql -f db/tables.sql
npm install
npm run dev
```

`pg_stop` shuts the local cluster down. The cluster lives in `./.postgres` (gitignored) and listens on a Unix socket inside that directory — `DATABASE_URL` uses libpq's `?host=/path` form (see `src/lib/server/db/index.ts`, which parses the URL manually because `postgres-js` would otherwise forward `host` as a runtime parameter).

For "Play vs Human" to work locally, the WebSocket backend must also be running — see *Companion repo* below.

## Commands

- `npm run dev` — Vite dev server (HMR, no build step uses the adapter).
- `npm run build` — production build via `@sveltejs/adapter-node`; output at `build/index.js`.
- `npm run preview` — serve the production build locally.
- `npm run check` — `svelte-check` against `tsconfig.json`. Use this as the type/lint gate; there's no separate lint config.

There is no test suite.

## Architecture

SvelteKit 2 + Svelte 5 (runes mode forced on for everything outside `node_modules` via `svelte.config.js`). Tailwind for styling, Drizzle ORM over `postgres-js` for the DB, server-rendered auth, and a thin Opponent abstraction on the client.

**Opponent abstraction** (`src/lib/state/opponent.ts` + `player-opponent.ts` + `machine-opponent.ts`) — the game UI talks to an `Opponent` interface (`start / sendMove / stop`). Two implementations:
- `PlayerOpponent` — opens a WebSocket to the external chess server (see below).
- `MachineOpponent` — spawns a Stockfish Web Worker from `/static/stockfish/`.

The WS URL is resolved at runtime by `src/lib/state/ws-url.ts`: `localhost` hostname → `ws://localhost:8080`, anything else → `wss://<host>/ws` (Caddy on the VPS proxies `/ws` to the chess server).

**Auth** (`src/lib/server/auth.ts` + `hooks.server.ts`) — session-cookie auth using `@oslojs/crypto` for hashing tokens and `@node-rs/argon2` for passwords. Sessions live in the `session` table; `hooks.server.ts` validates the cookie on every request and exposes the user via `event.locals`.

**Schema** — Drizzle schema lives in `src/lib/server/db/schema.ts`, but the production-truth schema is the hand-rolled `db/tables.sql`. There are no Drizzle migrations.

## Companion repo: chess_server

The multiplayer WebSocket backend is a separate Node project at `/home/ismael/Proyectos/chess_server`. It's a small `ws` server (~70 lines) that pairs clients off a queue and relays moves. No build step — runs via `node --experimental-strip-types src/index.ts` on port 8080.

When the user mentions "the server", "the WS backend", or anything about matchmaking/move relay, the code lives there, not here.

## Deployment

Both repos auto-deploy to a single VPS (`Alfonso`, domain `chess.galisma.com`) on push to `main` via `appleboy/ssh-action`. The workflow SSHes in as `neonchess`, pulls, builds (only for the SvelteKit app), and `systemctl restart`s the unit.

Production layout:
- `/srv/neon-chess` — this repo. Runs as `neon-chess.service`, listens on `127.0.0.1:3000`.
- `/srv/chess-server` — companion repo. Runs as `chess-server.service`, listens on `127.0.0.1:8080`.
- Caddy terminates TLS and routes `/ws` → `:8080`, everything else → `:3000`.
- Postgres runs as a project-local cluster managed by `pg_start` (same as dev) via `neon-chess-postgres.service`.

systemd units, install script, and Caddyfile template live in `deploy/`. `nix` is at `/usr/bin/nix` on this VPS (not the default Nix profile path) — the unit files hardcode this.

## Project documentation (TFG / Proyecto Intermodular)

The project documentation is written in Typst at `/home/ismael/Documentos/TFG`. That repo is the **documentation target**, not a reference — the code here is the source of truth. When asked to "document", "write up", or add something to the "memoria/TFG/dissertation", the destination is that repo. Don't proactively edit it without being asked.

**Idioma:** todo el contenido de los documentos debe estar en español. Mantén el español también en títulos, leyendas de figuras, comentarios y cualquier texto visible — el código y las identificadores se quedan en inglés.

### Convocatoria — Proyecto Intermodular (mayo 2026)

- **Entrega:** lunes 18 de mayo de 2026, 15:00h, por Google Classroom.
- **Defensa:** exposición presencial de 15 min máx. — primera parte con diapositivas, segunda parte demo en vivo (registro, login usuario + funcionalidades, login admin + opciones básicas).

### Entregables

1. **Memoria** (Typst, en `~/Documentos/TFG`) — documento ya existente en el repo, hay que terminarlo / actualizarlo.
2. **Presentación en PDF** — a producir también desde el repo de Typst, con los puntos del Anexo I:
   1. Temática del proyecto: introducción y enfoque
   2. Tecnologías usadas: Front-End, Back-End, interfaz, despliegue
   3. Modelo de datos: diagrama E/R y Modelo Relacional
   4. Diseño de interfaz: RWD, framework de maquetación, guía de estilo
   5. Arquitectura: lado cliente (validación, Ajax/etc.), lado servidor (acceso a BD, estructura, librerías), apps móviles/escritorio si aplica
   6. Despliegue: detalle del proceso
   7. Conclusiones: aspectos relevantes, herramientas no vistas en clase, novedades técnicas
3. **Código fuente** + subido a GitHub (ya está).
4. **`LEEME.TXT`** con usuarios/contraseñas de prueba e instrucciones.
5. **Enlace a la app desplegada** — `chess.galisma.com` (ver sección Deployment).

**Requisito de despliegue cumplido:** la app vive en alojamiento web propio (VPS Alfonso), así que no hace falta VM en Drive.

### Criterios de evaluación

1. Seguimiento del proyecto (tutor)
2. Contenido de la memoria
3. Exposición y defensa
