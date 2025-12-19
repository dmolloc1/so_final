# Microservicio de Comprobantes Electrónicos

## Instalación

1. Instalar dependencias:
```bash
composer install
```

2. Configurar certificado digital:
   - Colocar el certificado en la raíz como `certificado.pem`

3. Configurar empresa en `src/config.php`

## Uso

### Generar Boleta
```bash
POST /boleta

{
    "serie": "B001",
    "correlativo": "00000001",
    "fecha_emision": "2025-01-01",
    "cliente": {
        "tipo_doc": "1",
        "num_doc": "12345678",
        "rzn_social": "Juan Pérez"
    },
    "items": [
        {
            "codigo": "PROD001",
            "descripcion": "Producto de prueba",
            "cantidad": 1,
            "valor_unitario": 100.00
        }
    ]
}
```

### Descargar CDR
```bash
GET /cdr/{filename}
```

### Estado del servicio
```bash
GET /health
```

## Estructura de directorios

- `public/` - Punto de entrada web
- `src/` - Código fuente del microservicio
- `storage/` - Almacenamiento de archivos
  - `xml/` - XMLs generados
  - `cdr/` - CDRs de SUNAT
  - `logs/` - Logs del sistema
- `vendor/` - Dependencias de Composer