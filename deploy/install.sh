#!/usr/bin/env bash
# Install neon-chess deploy artifacts into the system.
# Run as root from the repo root: sudo bash deploy/install.sh
# Idempotent — safe to re-run after editing any of the templates.

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "error: must be run as root (try: sudo bash deploy/install.sh)" >&2
    exit 1
fi

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Installing from $DEPLOY_DIR"

# 1. systemd units
echo "--> systemd units"
install -m 0644 "$DEPLOY_DIR/neon-chess-postgres.service" /etc/systemd/system/neon-chess-postgres.service
install -m 0644 "$DEPLOY_DIR/neon-chess.service" /etc/systemd/system/neon-chess.service
systemctl daemon-reload

# 2. Caddyfile (only if it doesn't exist or matches the template — never overwrite local edits)
echo "--> Caddyfile"
if [[ ! -f /etc/caddy/Caddyfile ]]; then
    install -m 0644 "$DEPLOY_DIR/Caddyfile.example" /etc/caddy/Caddyfile
    echo "    installed /etc/caddy/Caddyfile (was missing)"
elif cmp -s "$DEPLOY_DIR/Caddyfile.example" /etc/caddy/Caddyfile; then
    echo "    /etc/caddy/Caddyfile already matches the template"
else
    echo "    /etc/caddy/Caddyfile differs from the template — leaving it alone"
    echo "    diff: sudo diff /etc/caddy/Caddyfile $DEPLOY_DIR/Caddyfile.example"
fi

# 3. Enable services (won't restart if already running)
echo "--> enabling services"
systemctl enable neon-chess-postgres
systemctl enable neon-chess

# 4. Reload Caddy if it's running
if systemctl is-active --quiet caddy; then
    echo "--> reloading caddy"
    caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
    systemctl reload caddy
fi

echo
echo "Done. Next steps if this is a first install:"
echo "  sudo systemctl start neon-chess-postgres"
echo "  sudo systemctl start neon-chess"
echo "  sudo systemctl status neon-chess"
echo
echo "After editing any unit file, re-run this script then:"
echo "  sudo systemctl restart neon-chess"
