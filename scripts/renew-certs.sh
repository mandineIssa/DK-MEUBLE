#!/usr/bin/env bash
# Renouvelle les certificats et recharge nginx (si besoin).
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose run --rm --entrypoint certbot certbot renew --webroot -w /var/www/certbot
docker compose exec nginx nginx -s reload
echo "Renouvellement terminé."
