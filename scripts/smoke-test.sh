#!/usr/bin/env bash
# Smoke test local MVP — API + pages Next
set -euo pipefail

API="${API_URL:-http://localhost:8000}"
WEB="${WEB_URL:-http://localhost:3000}"

echo "==> API $API"
curl -sf "$API/api/categories" | head -c 120 >/dev/null && echo "  OK /api/categories"
curl -sf "$API/api/products" | head -c 120 >/dev/null && echo "  OK /api/products"

echo "==> Site $WEB"
for path in "/" "/produits" "/realisations" "/a-propos" "/devis" "/contact" "/robots.txt" "/sitemap.xml"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB$path")
  echo "  $code  $path"
done

echo "Smoke test terminé."
