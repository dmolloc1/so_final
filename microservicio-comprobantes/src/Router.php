<?php

namespace MicroservicioComprobantes;

class Router
{
    private $routes = [];

    public function post($path, $callback)
    {
        $this->routes['POST'][$path] = $callback;
    }

    public function get($path, $callback)
    {
        $this->routes['GET'][$path] = $callback;
    }

    public function dispatch()
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Remover el directorio base si existe
        $path = str_replace('/public', '', $path);
        
        if (isset($this->routes[$method])) {
            foreach ($this->routes[$method] as $route => $callback) {
                if ($this->matchRoute($route, $path, $params)) {
                    call_user_func_array($callback, $params);
                    return;
                }
            }
        }
        
        // Ruta no encontrada
        http_response_code(404);
        echo json_encode(['error' => 'Ruta no encontrada']);
    }

    private function matchRoute($route, $path, &$params)
    {
        $params = [];
        
        // Convertir parámetros {param} a regex
        $pattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $route);
        $pattern = '#^' . $pattern . '$#';
        
        if (preg_match($pattern, $path, $matches)) {
            array_shift($matches); // Remover el match completo
            $params = $matches;
            return true;
        }
        
        return false;
    }
}