FROM php:8.2-fpm

# Instalar extensiones
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Directorio de trabajo
WORKDIR /var/www/html

# Copiar composer files
COPY composer.json composer.lock* ./

# Instalar dependencias
RUN composer install --no-dev --optimize-autoloader --no-scripts || true

# Copiar código
COPY . .

# Crear directorio de storage FUERA de /var/www/html
RUN mkdir -p /app/storage/xml /app/storage/cdr /app/storage/logs \
    && chown -R www-data:www-data /var/www/html /app/storage \
    && chmod -R 755 /var/www/html \
    && chmod -R 777 /app/storage

# Optimizar autoload
RUN composer dump-autoload --optimize --classmap-authoritative || true

EXPOSE 9000

CMD ["php-fpm"]