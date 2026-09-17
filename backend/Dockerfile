FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx \
    libzip-dev zip unzip git \
    icu-dev oniguruma-dev \
    && docker-php-ext-install pdo_mysql zip intl \
    && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader \
    || composer install --no-dev --no-scripts --no-interaction --prefer-dist

COPY . .
RUN composer dump-autoload --optimize \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs storage/app/public bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod +x docker/entrypoint.sh \
    && sed -i 's/\r$//' docker/entrypoint.sh \
    && rm -f /etc/nginx/http.d/default.conf \
    && cp docker/nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 8080

ENTRYPOINT ["/var/www/docker/entrypoint.sh"]
