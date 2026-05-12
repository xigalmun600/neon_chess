# neon-chess deployment

This directory holds the artifacts needed to run neon-chess on a Linux VPS behind Caddy. The plan: SvelteKit (adapter-node) runs as a systemd unit on `127.0.0.1:3000` via `nix develop`, Caddy fronts it on `:443` with auto-HTTPS, Postgres 16 runs out of the project's Nix flake (`pg_start` / `pg_stop`), and a second Caddy site block serves the static `galisma.com` site from `/var/www/galisma`.

The WebSocket backend lives in a separate repo with its own auto-deploy. Caddy proxies `/ws` to `127.0.0.1:8080` so once that server is running on the VPS, the URL works.

## One-time bootstrap

Run as a sudo-capable admin user.

### 1. Service user

```bash
sudo adduser --system --group --home /srv/neon-chess --shell /bin/bash neonchess
sudo mkdir -p /srv/neon-chess
sudo chown neonchess:neonchess /srv/neon-chess
sudo chmod 755 /srv/neon-chess
```

### 2. Install Nix (multi-user / daemon mode)

```bash
sudo apt-get update
sudo apt-get install -y curl xz-utils
sh <(curl -L https://nixos.org/nix/install) --daemon
```

Log out/in. Enable flakes:

```bash
sudo mkdir -p /etc/nix
echo 'experimental-features = nix-command flakes' | sudo tee -a /etc/nix/nix.conf
sudo systemctl restart nix-daemon
```

Add `neonchess` to the Nix daemon group (the multi-user installer creates this group but only adds users that exist at install time):

```bash
sudo usermod -aG nix-users neonchess
```

### 3. Install Caddy (system service — not via Nix)

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
```

### 4. Clone the repo

```bash
sudo -u neonchess git -C /srv/neon-chess clone https://github.com/<your-user>/neon-chess.git .
```

### 5. Prime the Nix dev shell, init Postgres, build

```bash
sudo -u neonchess -i bash -c 'cd /srv/neon-chess && nix develop --command true'
sudo -u neonchess -i bash -c 'cd /srv/neon-chess && nix develop --command pg_start'
sudo -u neonchess -i bash -c 'cd /srv/neon-chess && nix develop --command psql -f db/tables.sql'
sudo -u neonchess -i bash -c 'cd /srv/neon-chess && nix develop --command npm ci'
sudo -u neonchess -i bash -c 'cd /srv/neon-chess && nix develop --command npm run build'
```

`build/index.js` should now exist:
```bash
ls /srv/neon-chess/build/index.js
```

### 6. Env file

```bash
sudo install -m 0640 -o root -g neonchess /dev/stdin /etc/neon-chess.env <<'EOF'
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
ORIGIN=https://chess.galisma.com
DATABASE_URL=postgresql://neon_chess@localhost:5433/neon_chess?host=/srv/neon-chess/.postgres
INTERNAL_API_SECRET=<random-hex>
EOF
```

`INTERNAL_API_SECRET` must match the value in `/etc/chess-server.env` on the same host — generate once with `openssl rand -hex 32` and paste into both files. The chess_server uses it to sign WebSocket auth tickets and to authenticate game-result POSTs to this app.

The DB user is `neon_chess` (created by the flake's `initdb`), not the OS user `neonchess`.

### 7. Install everything (one script)

```bash
sudo bash /srv/neon-chess/deploy/install.sh
sudo systemctl start neon-chess-postgres
sudo systemctl start neon-chess
sudo systemctl status neon-chess
```

`install.sh` copies the systemd units to `/etc/systemd/system/`, the Caddyfile to `/etc/caddy/Caddyfile` (only if it doesn't already exist, so local edits are preserved), the sudoers rule to `/etc/sudoers.d/neonchess`, then enables the services and reloads Caddy. It's idempotent — re-run it after editing any template.

DNS for both `galisma.com` and `chess.galisma.com` must point at the VPS IP before this step — Caddy verifies via HTTP-01 to obtain Let's Encrypt certs.

### 8. SSH deploy key

Generate on your laptop:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/neonchess_deploy -C "github-actions-neonchess" -N ""
```

Install the public key on the VPS:
```bash
sudo -u neonchess mkdir -p /srv/neon-chess/.ssh
sudo -u neonchess chmod 700 /srv/neon-chess/.ssh
echo '<paste contents of ~/.ssh/neonchess_deploy.pub>' \
  | sudo -u neonchess tee /srv/neon-chess/.ssh/authorized_keys
sudo -u neonchess chmod 600 /srv/neon-chess/.ssh/authorized_keys
```

GitHub repo secrets (`Settings → Secrets and variables → Actions`):
- `VPS_HOST` — VPS public IP
- `VPS_USER` — `neonchess`
- `VPS_SSH_KEY` — full contents of the **private** key (`~/.ssh/neonchess_deploy`)

## Smoke test

```bash
curl -I https://chess.galisma.com   # HTTP/2 200
curl -I https://galisma.com         # HTTP/2 200
sudo systemctl status neon-chess
sudo journalctl -u neon-chess -n 50 --no-pager
```

## When a deploy fails

```bash
sudo systemctl status neon-chess
sudo journalctl -u neon-chess -n 200 --no-pager
sudo journalctl -u caddy -n 100 --no-pager
sudo ss -tlnp | grep -E '3000|8080|443'
```

Common failures: env file not readable by the `neonchess` group; the project-local Postgres cluster didn't start (check `journalctl -u neon-chess-postgres`); `nix develop` is slow on first run after `flake.lock` changes (deploy may time out — bump the SSH action timeout if needed); Caddy can't get a cert because DNS isn't pointing at the VPS yet.
