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
php artisan view:cache || true
php artisan event:cache || true

# Préchauffe des caches publics (évite le 1er visiteur lent)
php artisan tinker --execute="
try { app(\\App\\Services\\SiteContentService::class)->allSettings(); } catch (Throwable \$e) {}
try { app(\\App\\Services\\NavigationService::class)->assemble(); } catch (Throwable \$e) {}
try { app(\\App\\Services\\HomepageService::class)->assemble(); } catch (Throwable \$e) {}
try { app(\\App\\Services\\FooterService::class)->assemble(); } catch (Throwable \$e) {}
" 2>/dev/null || true

php-fpm -D
exec nginx -g "daemon off;"
