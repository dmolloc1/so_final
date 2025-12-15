<?php

function env($key, $default = null) {
    $value = getenv($key);
    return $value !== false ? $value : $default;
}

$environment = env('ENVIRONMENT', 'development');

if ($environment === 'production') {
    // Producción (Docker)
    $dbConfig = [
        'host' => env('DB_HOST', 'db'),
        'port' => env('DB_PORT', '3306'),
        'database' => env('DB_NAME', 'php_service_db'),
        'username' => env('DB_USER', 'php_user'),
        'password' => env('DB_PASSWORD', 'password'),
        'charset' => 'utf8mb4'
    ];
} else {
    $dbConfig = [
        'host' => env('DB_HOST', 'localhost'),
        'port' => env('DB_PORT', '3306'),
        'database' => env('DB_NAME', 'php_service_local'),
        'username' => env('DB_USER', 'root'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4'
    ];
}

function getDBConnection() {
    global $dbConfig;
    
    try {
        $dsn = sprintf(
            "mysql:host=%s;port=%s;dbname=%s;charset=%s",
            $dbConfig['host'],
            $dbConfig['port'],
            $dbConfig['database'],
            $dbConfig['charset']
        );
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO(
            $dsn,
            $dbConfig['username'],
            $dbConfig['password'],
            $options
        );
        
        return $pdo;
        
    } catch (PDOException $e) {
        // Log del error
        error_log("Error de conexión a BD: " . $e->getMessage());
        
        // En desarrollo, mostrar el error
        if (env('ENVIRONMENT', 'development') === 'development') {
            die("Error de conexión: " . $e->getMessage());
        }
        
        // En producción, mensaje genérico
        die("Error al conectar con la base de datos");
    }
}

// Función helper para ejecutar queries
function query($sql, $params = []) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

// Exportar configuración
return $dbConfig;
?>