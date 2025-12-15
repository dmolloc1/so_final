<?php
function env($key, $default = null) {
    $value = getenv($key);
    return $value !== false ? $value : $default;
}

$environment = env('ENVIRONMENT', 'development');

// CONFIGURACIÓN DE LA EMPRESA EMISORA
define('COMPANY_RUC', env('COMPANY_RUC', '20000000001'));
define('COMPANY_RAZON_SOCIAL', env('COMPANY_RAZON_SOCIAL', 'Mi Empresa SAC'));
define('COMPANY_NOMBRE_COMERCIAL', env('COMPANY_NOMBRE_COMERCIAL', 'Mi Empresa'));
define('COMPANY_UBIGEO', env('COMPANY_UBIGEO', '150101'));
define('COMPANY_DEPARTAMENTO', env('COMPANY_DEPARTAMENTO', 'LIMA'));
define('COMPANY_PROVINCIA', env('COMPANY_PROVINCIA', 'LIMA'));
define('COMPANY_DISTRITO', env('COMPANY_DISTRITO', 'LIMA'));
define('COMPANY_DIRECCION', env('COMPANY_DIRECCION', 'Av. Lima 123'));

// CONFIGURACIÓN SUNAT
define('SUNAT_RUC', env('SUNAT_RUC', COMPANY_RUC));
define('SUNAT_USUARIO', env('SUNAT_USUARIO', 'MODDATOS'));
define('SUNAT_CLAVE', env('SUNAT_CLAVE', 'moddatos'));

// Endpoint SUNAT según ambiente
if ($environment === 'production') {
    // Producción: usar endpoint real de SUNAT
    define('SUNAT_ENDPOINT', env(
        'SUNAT_ENDPOINT',
        \Greenter\Ws\Services\SunatEndpoints::FE_PRODUCCION
    ));
    error_log("SUNAT: Usando endpoint de PRODUCCIÓN");
} else {
    // Desarrollo: usar endpoint de pruebas (BETA)
    define('SUNAT_ENDPOINT', env(
        'SUNAT_ENDPOINT',
        \Greenter\Ws\Services\SunatEndpoints::FE_BETA
    ));
    error_log("SUNAT: Usando endpoint de PRUEBAS (BETA)");
}

define('BASE_PATH', env('BASE_PATH', __DIR__ . '/..'));

// ========================================
// CAMBIO AQUÍ: Rutas de storage según el ambiente
// ========================================
if ($environment === 'production') {
    // En producción (Docker), usar /app/storage
    define('STORAGE_PATH', '/app/storage');
    define('XML_PATH', '/app/storage/xml');
    define('CDR_PATH', '/app/storage/cdr');
    define('LOGS_PATH', '/app/storage/logs');
    define('CERT_PATH', env('CERT_PATH', '/app/storage/certificado.pem'));
} else {
    // En desarrollo local, usar ruta relativa
    define('STORAGE_PATH', __DIR__ . '/../storage');
    define('XML_PATH', STORAGE_PATH . '/xml');
    define('CDR_PATH', STORAGE_PATH . '/cdr');
    define('LOGS_PATH', STORAGE_PATH . '/logs');
    define('CERT_PATH', __DIR__ . '/../certificado.pem');
}

define('APP_DEBUG', env('APP_DEBUG', 'true') === 'true');

// Configurar errores según ambiente
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    error_log("Debug mode: ENABLED");
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    error_log("Debug mode: DISABLED");
}

// Log de configuración cargada
error_log("Configuración cargada - Ambiente: $environment");
error_log("Storage path: " . STORAGE_PATH);
error_log("XML path: " . XML_PATH);
error_log("CDR path: " . CDR_PATH);
error_log("Cert path: " . CERT_PATH);