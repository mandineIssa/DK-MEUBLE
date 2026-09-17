#!/bin/sh
set -e

cd /var/www

# Droits storage / cache
mkdir -p storage/framework/{cache,sessions,views} storage/logs storage/app/public bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true

# Lien public pour les uploads
php artisan storage:link --force 2>/dev/null || true

# Migrations (prod)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force --no-interaction
fi

# Seed optionnel (une fois)
if [ "${RUN_SEED:-false}" = "true" ]; then
  php artisan db:seed --force --no-interaction
fi

php artisan config:cache || true
php artisan route:cache || true

php-fpm -D
exec nginx -g "daemon off;"
