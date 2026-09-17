#!/usr/bin/env bash
# Obtient les certificats Let's Encrypt puis active nginx SSL.
# Prérequis : DNS dkmeuble.sn, www, api → IP du serveur ; ports 80/443 ouverts.
set -euo pipefail

cd "$(dirname "$0")/.."

EMAIL="${1:-}"
if [[ -z "$EMAIL" ]]; then
  echo "Usage: ./scripts/init-letsencrypt.sh vous@email.com"
  exit 1
fi

DOMAINS=(-d dkmeuble.sn -d www.dkmeuble.sn -d api.dkmeuble.sn)
DATA_PATH="certbot-etc"

echo "==> Démarrage stack (HTTP)…"
docker compose up -d nginx frontend backend mysql

echo "==> Attente nginx…"
sleep 5

echo "==> Options SSL recommandées Certbot…"
docker compose run --rm --entrypoint "\
  sh -c \"curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    > /etc/letsencrypt/options-ssl-nginx.conf && \
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    > /etc/letsencrypt/ssl-dhparams.pem\"" certbot || true

# Si curl dans l'image certbot échoue, on crée des fichiers minimaux plus tard via openssl

echo "==> Demande certificat (webroot)…"
docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  "${DOMAINS[@]}" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

# DH params si absents
docker compose run --rm --entrypoint "\
  sh -c 'test -f /etc/letsencrypt/ssl-dhparams.pem || openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048'" certbot

# options-ssl-nginx minimal si manquant
docker compose run --rm --entrypoint "\
  sh -c 'test -f /etc/letsencrypt/options-ssl-nginx.conf || printf \"%s\\n\" \
    \"ssl_session_cache shared:le_nginx_SSL:10m;\" \
    \"ssl_session_timeout 1440m;\" \
    \"ssl_protocols TLSv1.2 TLSv1.3;\" \
    \"ssl_prefer_server_ciphers off;\" \
    > /etc/letsencrypt/options-ssl-nginx.conf'" certbot

echo "==> Activation config SSL…"
cp nginx/default.ssl.conf nginx/default.conf

echo "==> Rechargement nginx…"
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload

echo "==> Certbot renew en arrière-plan…"
docker compose up -d certbot

echo ""
echo "HTTPS actif :"
echo "  https://dkmeuble.sn"
echo "  https://www.dkmeuble.sn"
echo "  https://api.dkmeuble.sn"
echo ""
echo "Vérifiez APP_URL / NEXT_PUBLIC_* en https dans .env puis rebuild frontend si besoin."
